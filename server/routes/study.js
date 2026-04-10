/**
 * Study Routes for Lumina OS API
 *
 * Provides AI-powered study assistance endpoints including summarization,
 * task generation, mind mapping, and text-to-speech functionality.
 *
 * Features multi-model AI fallback system for maximum reliability.
 *
 * @author Ayoub Hamrouni
 * @version 1.0.0
 */

import express from "express";
import { generateGeminiContent } from "../lib/gemini.js";
import { generateTTS } from "../lib/elevenlabs.js";
import { generateOpenRouterContent } from "../lib/openrouter.js";

const router = express.Router();

// ==========================================
// CONFIGURATION
// ==========================================

/**
 * API Keys from environment variables
 * These are required for AI functionality
 */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * AI Model configuration
 * Can be overridden via environment variables
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "google/gemma-4-26b-a4b-it:free";

const SOURCE_FETCH_TIMEOUT_MS = 12000;

/**
 * Rate limiting: Track last usage of each provider to avoid exhaustion
 * Maps provider names to timestamp of last successful usage
 */
const providerCooldowns = new Map();
const providerFamilyCooldowns = new Map();
const DEFAULT_PROVIDER_COOLDOWN_MS = 5000;
const RATE_LIMIT_PROVIDER_COOLDOWN_MS = 30000;
const AUTH_ERROR_PROVIDER_COOLDOWN_MS = 1000 * 60 * 60;

/**
 * Check if a provider is on cooldown to prevent API exhaustion
 *
 * @param {string} providerName - Name of the AI provider
 * @returns {boolean} True if provider is on cooldown
 */
function isProviderOnCooldown(providerName) {
  const expiresAt = providerCooldowns.get(providerName);
  if (!expiresAt) return false;
  return Date.now() < expiresAt;
}

function isProviderFamilyOnCooldown(familyName) {
  const expiresAt = providerFamilyCooldowns.get(familyName);
  if (!expiresAt) return false;
  return Date.now() < expiresAt;
}

/**
 * Mark a provider as recently used for rate limiting
 *
 * @param {string} providerName - Name of the AI provider
 * @param {number} cooldownMs - Cooldown period in milliseconds
 */
function markProviderUsed(
  providerName,
  cooldownMs = DEFAULT_PROVIDER_COOLDOWN_MS,
) {
  providerCooldowns.set(providerName, Date.now() + cooldownMs);
}

function markProviderFamilyUsed(
  familyName,
  cooldownMs = DEFAULT_PROVIDER_COOLDOWN_MS,
) {
  providerFamilyCooldowns.set(familyName, Date.now() + cooldownMs);
}

/**
 * Determines whether an error indicates a rate limit or quota issue
 *
 * @param {Error} error - Error thrown by the AI provider
 * @returns {boolean} True if the error looks like a rate limit / quota issue
 */
function isRateLimitError(error) {
  const message = String(error?.message || "").toLowerCase();
  return /429|quota|rate limit|exceeded|high capacity|capacity|too many requests/.test(
    message,
  );
}

function isAuthenticationError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    /401|403|unauthorized|forbidden|invalid api key|api key is required|authentication/.test(
      message,
    ) ||
    error?.status === 401 ||
    error?.status === 403
  );
}

function isRetryableError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    /timeout|timed out|network|fetch failed|econnreset|etimedout|aborterror/.test(
      message,
    ) || error?.name === "AbortError"
  );
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtmlToText(html) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function extractHtmlTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1]).trim() : "";
}

async function fetchTextResponse(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": "LuminaOS/1.0 (+study-source-extractor)",
        Accept: "text/plain,text/html,application/json;q=0.9,*/*;q=0.8",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch source content (${response.status}).`);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePublicSourceUrl(input) {
  const url = new URL(input);
  const host = url.hostname.toLowerCase();

  if (host.includes("github.com")) {
    const blobMatch = url.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
    if (blobMatch) {
      const [, owner, repo, branch, path] = blobMatch;
      return {
        kind: "github-raw",
        url: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
        label: `${owner}/${repo}`,
      };
    }
  }

  if (host === "docs.google.com") {
    const docMatch = url.pathname.match(/\/document\/d\/([A-Za-z0-9-_]+)/);
    if (docMatch) {
      return {
        kind: "google-doc",
        url: `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`,
        label: "Google Doc",
      };
    }
  }

  if (host.endsWith("wikipedia.org")) {
    const title = url.pathname.split("/wiki/")[1];
    if (title) {
      return {
        kind: "wikipedia",
        url: `https://${host}/api/rest_v1/page/summary/${title}`,
        label: "Wikipedia",
      };
    }
  }

  if (host === "arxiv.org") {
    const absMatch = url.pathname.match(/\/abs\/([^/]+)/);
    if (absMatch) {
      return {
        kind: "arxiv",
        url: `https://export.arxiv.org/api/query?id_list=${absMatch[1]}`,
        label: "arXiv",
      };
    }
  }

  if (
    host.includes("medium.com") ||
    host === "dev.to" ||
    host.includes("substack.com") ||
    host.includes("githubusercontent.com")
  ) {
    return {
      kind: "html",
      url: input,
      label: host,
    };
  }

  throw new Error(
    "Unsupported public link. Try a Google Doc, GitHub file, Wikipedia article, arXiv paper, Medium post, or Dev.to article.",
  );
}

async function extractSourceFromUrl(input) {
  const normalized = normalizePublicSourceUrl(input);

  if (normalized.kind === "google-doc" || normalized.kind === "github-raw") {
    const response = await fetchTextResponse(normalized.url);
    const text = (await response.text()).trim();
    if (!text) {
      throw new Error("The shared link did not return readable text.");
    }
    return {
      sourceLabel: normalized.label,
      title: normalized.label,
      text,
    };
  }

  if (normalized.kind === "wikipedia") {
    const response = await fetchTextResponse(normalized.url, {
      headers: { Accept: "application/json" },
    });
    const data = await response.json();
    const title = data?.title || "Wikipedia Article";
    const text = [data?.extract, data?.description].filter(Boolean).join("\n\n").trim();
    if (!text) {
      throw new Error("The Wikipedia link did not include extractable content.");
    }
    return {
      sourceLabel: "Wikipedia",
      title,
      text,
    };
  }

  if (normalized.kind === "arxiv") {
    const response = await fetchTextResponse(normalized.url, {
      headers: { Accept: "application/atom+xml,text/xml;q=0.9,*/*;q=0.8" },
    });
    const xml = await response.text();
    const title = decodeHtmlEntities(
      xml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "arXiv Paper",
    )
      .replace(/^arXiv Query:\s*/i, "")
      .trim();
    const summary = decodeHtmlEntities(
      xml.match(/<summary>([\s\S]*?)<\/summary>/i)?.[1] || "",
    )
      .replace(/\s+/g, " ")
      .trim();
    const authorMatches = Array.from(xml.matchAll(/<name>([\s\S]*?)<\/name>/gi))
      .map((match) => decodeHtmlEntities(match[1]).trim())
      .filter(Boolean)
      .slice(0, 5);
    const text = [
      title,
      authorMatches.length ? `Authors: ${authorMatches.join(", ")}` : "",
      summary,
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();
    if (!summary) {
      throw new Error("The arXiv paper did not return an abstract.");
    }
    return {
      sourceLabel: "arXiv",
      title,
      text,
    };
  }

  const response = await fetchTextResponse(normalized.url);
  const html = await response.text();
  const title = extractHtmlTitle(html) || normalized.label;
  const articleMatch =
    html.match(/<article[\s\S]*?<\/article>/i) ||
    html.match(/<main[\s\S]*?<\/main>/i);
  const text = stripHtmlToText((articleMatch && articleMatch[0]) || html);

  if (!text || text.length < 120) {
    throw new Error(
      "This page could not be cleanly extracted. Try pasting the article text directly for the demo.",
    );
  }

  return {
    sourceLabel: normalized.label,
    title,
    text: text.slice(0, 20000),
  };
}

function isUnavailableModelError(error) {
  const message = String(error?.message || "").toLowerCase();
  return /404|no endpoints found|model not found|does not exist/.test(message);
}

/**
 * Validate an AI response against a basic schema definition.
 *
 * Supports nested objects, arrays, strings, and integers.
 */
function validateResponseAgainstSchema(result, schema) {
  if (!schema) return true;

  if (schema.type === "OBJECT") {
    if (
      typeof result !== "object" ||
      result === null ||
      Array.isArray(result)
    ) {
      return false;
    }

    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in result)) return false;
      }
    }

    if (schema.properties) {
      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        if (!(key in result)) continue;
        if (!validateResponseAgainstSchema(result[key], propertySchema))
          return false;
      }
    }

    return true;
  }

  if (schema.type === "ARRAY") {
    if (!Array.isArray(result)) return false;
    if (schema.items) {
      for (const item of result) {
        if (!validateResponseAgainstSchema(item, schema.items)) return false;
      }
    }
    return true;
  }

  if (schema.type === "STRING") {
    return typeof result === "string";
  }

  if (schema.type === "INTEGER") {
    return Number.isInteger(result);
  }

  return true;
}

/**
 * Multi-Model AI Fallback System
 *
 * Attempts to generate content using multiple AI providers in sequence.
 * Implements intelligent load balancing and rate limiting to prevent API exhaustion.
 * Falls back to mock data if all providers fail (hackathon reliability).
 *
 * @param {string} systemPrompt - System instruction for the AI
 * @param {string} userPrompt - User input prompt
 * @param {Object} schema - JSON schema for response validation
 * @param {Object} mockFallback - Mock data to return if all AI providers fail
 * @returns {Promise<Object>} AI-generated content or mock fallback
 * @throws {Error} If all providers fail and no mock fallback is provided
 */
async function callAIWithFallback(
  systemPrompt,
  userPrompt,
  schema,
  mockFallback = null,
) {
  const providers = [
    {
      name: "Gemini",
      family: "Gemini",
      key: GEMINI_API_KEY,
      model: GEMINI_MODEL,
      fn: generateGeminiContent,
      maxAttempts: 1,
    },
    {
      name: "OpenRouter-Primary",
      family: "OpenRouter",
      key: OPENROUTER_API_KEY,
      model: OPENROUTER_MODEL,
      fn: generateOpenRouterContent,
      maxAttempts: 1,
    },
    {
      name: "OpenRouter-Gemma4-26B",
      family: "OpenRouter",
      key: OPENROUTER_API_KEY,
      model: "google/gemma-4-26b-a4b-it:free",
      fn: generateOpenRouterContent,
      maxAttempts: 1,
    },
    {
      name: "OpenRouter-Gemma4-31B",
      family: "OpenRouter",
      key: OPENROUTER_API_KEY,
      model: "google/gemma-4-31b-it:free",
      fn: generateOpenRouterContent,
      maxAttempts: 1,
    },
    {
      name: "OpenRouter-Nemotron",
      family: "OpenRouter",
      key: OPENROUTER_API_KEY,
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      fn: generateOpenRouterContent,
      maxAttempts: 1,
    },
  ];

  // Preserve a primary-first fallback order with retry and adaptive cooldowns
  const executionOrder = [...providers];
  let lastError = null;

  for (const provider of executionOrder) {
    if (!provider.key) continue;
    if (provider.family && isProviderFamilyOnCooldown(provider.family)) {
      console.log(
        `[AI] ⏳ ${provider.family} family on cooldown, skipping ${provider.name}...`,
      );
      continue;
    }

    if (isProviderOnCooldown(provider.name)) {
      console.log(`[AI] ⏳ ${provider.name} on cooldown, skipping...`);
      continue;
    }

    const maxAttempts = provider.maxAttempts ?? 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[AI] [${provider.name}] Attempt ${attempt}...`);

        let result;
        if (provider.name === "Gemini") {
          result = await provider.fn(
            provider.key,
            systemPrompt,
            userPrompt,
            schema,
            provider.model,
          );
        } else {
          result = await provider.fn(
            provider.key,
            systemPrompt,
            userPrompt,
            provider.model,
          );
          if (typeof result === "string") {
            try {
              result = JSON.parse(result);
            } catch (e) {
              /* ignore */
            }
          }
        }

        if (result) {
          const valid = validateResponseAgainstSchema(result, schema);
          if (!valid) {
            throw new Error(
              `${provider.name} returned malformed data that did not match the expected schema.`,
            );
          }

          console.log(
            `[AI] ✅ ${provider.name} succeeded on attempt ${attempt}.`,
          );
          markProviderUsed(provider.name);
          return result;
        }
      } catch (err) {
        lastError = err;
        const authError = isAuthenticationError(err);
        const rateLimitError = isRateLimitError(err);
        const retryableError = isRetryableError(err);
        const unavailableModelError = isUnavailableModelError(err);
        const cooldownMs = rateLimitError
          ? RATE_LIMIT_PROVIDER_COOLDOWN_MS
          : authError
            ? AUTH_ERROR_PROVIDER_COOLDOWN_MS
            : DEFAULT_PROVIDER_COOLDOWN_MS;
        markProviderUsed(provider.name, cooldownMs);
        if (provider.family && (authError || rateLimitError)) {
          markProviderFamilyUsed(provider.family, cooldownMs);
        }
        console.warn(
          `[AI] ⚠️ ${provider.name} attempt ${attempt} failed: ${err.message}. Cooling down for ${cooldownMs}ms`,
        );

        if (authError) {
          console.warn(
            `[AI] ⚠️ ${provider.name} rejected the API key. Skipping the rest of the ${provider.family || provider.name} providers for this request.`,
          );
          break;
        }

        if (rateLimitError) {
          console.warn(
            `[AI] ⚠️ ${provider.name} appears rate-limited or at capacity. Switching to next provider...`,
          );
          break;
        }

        if (unavailableModelError) {
          console.warn(
            `[AI] ⚠️ ${provider.name} is unavailable. Skipping to the next provider without retry.`,
          );
          break;
        }

        if (!retryableError) {
          break;
        }

        if (attempt < maxAttempts)
          await new Promise((r) => setTimeout(r, 1000));
        if (attempt === maxAttempts) break;
      }
    }
  }

  if (mockFallback) {
    console.log("[AI] 🔄 All providers failed, using mock data for demo");
    return mockFallback;
  }

  if (lastError) {
    throw new Error(
      `Stability Interruption: ${lastError.message} Please try again in a few seconds.`,
    );
  }

  throw new Error(
    "Stability Interruption: All healthy AI nodes are currently at high capacity. Our systems are attempting to reconnect. Please try again in 10-15 seconds.",
  );
}

// ──────────────────────────────────────────────
// Mock Fallback for Hackathon Demo
// ──────────────────────────────────────────────

/**
 * Generate mock summary data for demo reliability
 *
 * Creates realistic summary structure when AI services are unavailable.
 * Used as ultimate fallback in the multi-model system.
 *
 * @param {string} text - Input text to summarize
 * @returns {Object} Mock summary with key terms and metadata
 */
function getMockSummary(text) {
  const wordCount = text.split(/\s+/).length;
  const summaryLength = Math.max(50, Math.min(200, wordCount / 5));
  return {
    summary: `This is a ${Math.round(wordCount / 10) * 10}-word educational text about ${text.substring(0, 50).split(" ").slice(0, 3).join(" ")}... (Mock summary for demo - AI services temporarily unavailable)`,
    keyTerms: [
      {
        term: "Education",
        definition: "The process of learning and acquiring knowledge",
      },
      {
        term: "Learning",
        definition: "The acquisition of knowledge or skills",
      },
    ],
    difficulty_level: "intermediate",
    wordCount: summaryLength,
  };
}

/**
 * Generate mock mindmap data for demo reliability
 *
 * Creates Mermaid.js mindmap syntax when AI services are unavailable.
 * Provides basic structure for visual learning features.
 *
 * @param {string} text - Input text to create mindmap for
 * @returns {string} Mermaid mindmap syntax
 */
function getMockMindmap(text) {
  const topic = extractMindmapTopic(text);
  const branches = extractMindmapBranches(text);
  if (branches.length > 0) {
    return stringifyMindmapTree(topic, branches);
  }

  return `mindmap
  root((${topic}))
    Key Concepts
      Main Idea
        Definition
        Examples
    Applications
      Real World
        Case Studies
        Benefits
    Learning Tips
      Study Methods
        Practice
        Review`;
}

/**
 * Generate a mind map from summary text for demo reliability
 *
 * @param {string} summary - Summary text to visualize
 * @returns {Object} Mindmap payload
 */
function getMockMindmapPayload(summary) {
  return { mindmap: getMockMindmap(summary) };
}

function isValidMindmapSyntax(mindmap) {
  if (typeof mindmap !== "string") return false;
  const trimmed = mindmap.trim();
  return trimmed.startsWith("mindmap") && trimmed.split(/\r?\n/).length > 1;
}

function extractMindmapTopic(text) {
  const stopwords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "your",
    "about",
    "their",
    "they",
    "them",
    "will",
    "have",
    "has",
    "are",
    "was",
    "were",
    "you",
    "can",
    "our",
    "but",
    "not",
    "all",
    "one",
    "two",
    "also",
  ]);

  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopwords.has(word))
      .slice(0, 4)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ") || "Study Topic"
  );
}

function sanitizeMindmapLabel(label, fallback = "Concept") {
  const cleaned = String(label || "")
    .replace(/[`*_#>"']/g, " ")
    .replace(/[()[\]{}:;,.!?/\\|@#$%^&+=~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallback;

  const words = cleaned
    .split(" ")
    .filter(Boolean)
    .slice(0, 5);

  if (words.length === 0) return fallback;

  return words.join(" ");
}

function toTitleCasePhrase(value) {
  return sanitizeMindmapLabel(value)
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractCandidatePhrases(sentence) {
  return sentence
    .split(/[,;:()\-]/)
    .map((part) => sanitizeMindmapLabel(part))
    .filter((part) => {
      const words = part.split(" ").filter(Boolean);
      return words.length >= 2 && words.length <= 5;
    });
}

function extractMindmapBranches(summary) {
  const normalized = summary.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const branchMap = new Map();

  sentences.forEach((sentence, index) => {
    const phrases = extractCandidatePhrases(sentence);
    const branchLabel = toTitleCasePhrase(
      phrases[0] ||
        sentence
          .split(" ")
          .slice(0, 4)
          .join(" "),
    );

    if (!branchMap.has(branchLabel)) {
      branchMap.set(branchLabel, []);
    }

    const details = branchMap.get(branchLabel);
    phrases.slice(1, 4).forEach((phrase) => {
      const detailLabel = toTitleCasePhrase(phrase);
      if (detailLabel !== branchLabel && !details.includes(detailLabel)) {
        details.push(detailLabel);
      }
    });

    if (details.length === 0) {
      const fallbackChunks = sentence
        .split(/,| and | but | because | which /i)
        .map((part) => sanitizeMindmapLabel(part))
        .filter(Boolean)
        .slice(1, 3)
        .map((part) => toTitleCasePhrase(part));
      fallbackChunks.forEach((detailLabel) => {
        if (detailLabel !== branchLabel && !details.includes(detailLabel)) {
          details.push(detailLabel);
        }
      });
    }

    if (details.length === 0) {
      details.push(index % 2 === 0 ? "Key Detail" : "Why It Matters");
    }
  });

  return Array.from(branchMap.entries())
    .slice(0, 6)
    .map(([label, details]) => ({
      label,
      children: details.slice(0, 3).map((detail) => ({
        label: detail,
        children: [],
      })),
    }));
}

function stringifyMindmapTree(topic, branches) {
  const lines = [`mindmap`, `  root((` + sanitizeMindmapLabel(topic, "Study Topic") + `))`];

  branches.forEach((branch) => {
    lines.push(`    ${sanitizeMindmapLabel(branch.label, "Core Concept")}`);
    branch.children.forEach((child) => {
      lines.push(`      ${sanitizeMindmapLabel(child.label, "Key Detail")}`);
    });
  });

  return lines.join("\n");
}

function buildDeterministicMindmap(summary) {
  const topic = extractMindmapTopic(summary);
  const branches = extractMindmapBranches(summary);

  if (branches.length > 0) {
    return stringifyMindmapTree(topic, branches);
  }

  return `mindmap
  root((${topic}))
    Core Ideas
      Main Definition
      Key Detail
    Supporting Ideas
      Real Example
      Why It Matters
    Study Focus
      Practice Recall
      Compare Concepts`;
}

function normalizeMindmapResponse(value, summary) {
  const raw =
    typeof value === "string"
      ? value
      : typeof value === "object" && value?.mindmap
        ? value.mindmap
        : "";

  if (isValidMindmapSyntax(raw)) {
    return raw.trim();
  }

  return buildDeterministicMindmap(summary);
}

/**
 * Generate mock study tasks for demo reliability
 *
 * Creates standardized study tasks when AI services are unavailable.
 * Provides consistent active recall activities for users.
 *
 * @param {Object} summary - Summary object (unused in mock)
 * @returns {string[]} Array of study task strings
 */
function getMockTasks(summary) {
  return [
    "Read the summary carefully and highlight key points",
    "Review the key terms and their definitions",
    "Create flashcards for important concepts",
    "Practice explaining the topic in your own words",
    "Apply the concepts to a real-world example",
  ];
}

/**
 * Generate mock quiz data when AI providers are unavailable.
 *
 * @param {string} text - Input text for quiz generation
 * @returns {Object} Mock quiz object with simple questions
 */
function getMockQuiz(text) {
  const topic =
    text.substring(0, 80).split(" ").slice(0, 5).join(" ") || "the topic";
  return {
    questions: [
      {
        question: `What is the main idea of ${topic}?`,
        options: [
          "A high-level summary",
          "A detailed list of steps",
          "A description of a different subject",
          "A random unrelated statement",
        ],
        correctAnswerIndex: 0,
        explanation: "The main idea summarizes the core topic of the text.",
      },
      {
        question: "Which approach best helps you remember the material?",
        options: [
          "Practice and review regularly",
          "Ignore it completely",
          "Wait until the last minute",
          "Copy it without understanding",
        ],
        correctAnswerIndex: 0,
        explanation: "Regular practice and review reinforce learning.",
      },
    ],
  };
}

/**
 * Generate a fallback chat reply when AI providers are unavailable.
 *
 * @param {string} message - User message
 * @returns {Object} Chat reply object
 */
function getMockChatReply(message) {
  return {
    reply: `Thanks for your question! I’m having trouble connecting to the study assistant right now, but here’s a quick tip: break your work into small steps and review one idea at a time.`,
  };
}

// ──────────────────────────────────────────────
// Performance Cache (In-Memory)
// ──────────────────────────────────────────────
const resultCache = new Map();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

function getCachedResult(key) {
  const cached = resultCache.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data;
  return null;
}

function setCachedResult(key, data) {
  resultCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// ──────────────────────────────────────────────
// Endpoint: Study Bundle (Summary + Action Plan in one go)
// ──────────────────────────────────────────────

/**
 * POST /study-bundle
 * Atomic endpoint providing complete study session data
 *
 * Generates summary, key terms, study tasks, and mindmap in single request.
 * Uses multi-model AI fallback system for maximum reliability.
 *
 * @param {string} text - Study material text to process
 * @returns {Object} Complete study bundle with summary, tasks, and mindmap
 */
router.post("/study-bundle", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // Performance Hack: Check Cache First
    const cacheKey = `bundle:${text.substring(0, 100)}:${text.length}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      console.log("[Cache] ⚡ Serving Study Bundle from cache.");
      return res.json(cached);
    }

    console.log("[Study Bundle] 🚀 Generating full study package...");

    // 1. Generate Summary & Key Terms
    const summaryPrompt = `Summarize the following text for a student. The summary should be 15-20% of the original length. Use simple, clear language. Return a JSON object with keys: "summary" (string), "keyTerms" (array of {term, definition}), and "difficulty_level" (string).\n\nText:\n${text}`;
    const summarySchema = {
      type: "OBJECT",
      properties: {
        summary: { type: "STRING" },
        keyTerms: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              term: { type: "STRING" },
              definition: { type: "STRING" },
            },
            required: ["term", "definition"],
          },
        },
        difficulty_level: { type: "STRING" },
      },
      required: ["summary", "keyTerms", "difficulty_level"],
    };

    const summaryResult = await callAIWithFallback(
      "You are a study assistant specialized in helping neurodivergent readers. Use clear language and structured formats.",
      summaryPrompt,
      summarySchema,
      getMockSummary(text),
    );

    // 2. Generate Action Plan (Micro-tasks)
    const decomposePrompt = `Break down the following study material into a list of 5-8 small, actionable tasks that a student can complete in 5-10 minutes each. Return a JSON object with a "tasks" key containing an array of strings.\n\nSummary:\n${summaryResult.summary}`;
    const decomposeSchema = {
      type: "OBJECT",
      properties: { tasks: { type: "ARRAY", items: { type: "STRING" } } },
      required: ["tasks"],
    };

    // 3. Generate Mind Map (Mermaid.js syntax)
    const mindmapPrompt = `Create a premium study mind map for the following summary using Mermaid.js mindmap syntax.
Rules:
- Start with: mindmap
- Use 2-space indentation for hierarchy
- Root node should be the main topic (1-3 words) wrapped in (( ))
- Max 3 levels of depth
- Each node: 1-5 words MAX, concrete and content-specific
- 4-6 branches from root
- Each branch should cover a different angle of the topic
- Each branch should have 2-3 detail nodes
- Prefer concept groupings a student would actually review, not generic labels like Overview, Details, or Summary
- Capture relationships, mechanisms, categories, causes, effects, examples, or steps when present
- Return ONLY the raw Mermaid mindmap syntax, NO code fences, NO explanation

Example format:
mindmap
  root((Biology))
    Cell Structure
      Cell Membrane
      Nucleus
    Metabolism
      Glycolysis
      Photosynthesis

Summary:
${summaryResult.summary}`;

    const [actionPlan, mindmapResult] = await Promise.allSettled([
      callAIWithFallback(
        "You are an executive function coach. Break material into tiny, actionable steps.",
        decomposePrompt,
        decomposeSchema,
      ),
      callAIWithFallback(
        "You are a visual learning expert. Generate clean Mermaid.js mindmap syntax only.",
        mindmapPrompt,
        {
          type: "OBJECT",
          properties: { mindmap: { type: "STRING" } },
          required: ["mindmap"],
        },
      ),
    ]);

    const tasks =
      actionPlan.status === "fulfilled"
        ? actionPlan.value?.tasks || getMockTasks(summaryResult.summary)
        : getMockTasks(summaryResult.summary);

    const mindmapData =
      mindmapResult.status === "fulfilled" && mindmapResult.value
        ? normalizeMindmapResponse(mindmapResult.value, summaryResult.summary)
        : buildDeterministicMindmap(summaryResult.summary);

    const finalResult = {
      ...summaryResult,
      tasks,
      mindmapData,
      wordCount: summaryResult.summary.trim().split(/\s+/).length,
      originalWordCount: text.trim().split(/\s+/).length,
    };

    setCachedResult(cacheKey, finalResult);
    res.json(finalResult);
  } catch (err) {
    console.error("[Study Bundle Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Endpoint: Mind Map Generation
// ──────────────────────────────────────────────

/**
 * POST /mindmap
 * Generate a Mermaid mind map from a summary
 *
 * @param {string} summary - Summary text to visualize
 * @returns {Object} Mindmap data payload
 */
router.post("/mindmap", async (req, res) => {
  try {
    const { summary } = req.body;
    if (!summary) {
      return res.status(400).json({ error: "Summary is required" });
    }

    const cacheKey = `mindmap:${summary.substring(0, 120)}:${summary.length}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      console.log("[Cache] ⚡ Serving mindmap from cache.");
      return res.json(cached);
    }

    const mindmapPrompt = `Analyze this study material and create a high-quality study mind map showing the main topic, key concepts, and relationships.

Your task:
1. Identify the PRIMARY TOPIC (main subject)
2. Extract 4-6 DISTINCT MAIN CONCEPTS directly from the content
3. For each main concept, identify 2-3 SUB-CONCEPTS or DETAILS
4. Show hierarchy: root → main concepts → details

Rules:
- Root label: the main subject (2-3 words) wrapped in (( ))
- Use Mermaid mindmap syntax with 2-space indents
- Each node: 1-5 words, clear and specific to the content
- Max 3 hierarchy levels
- Focus on ACTUAL content, not generic structure
- Use branches that feel like a polished study outline, not placeholders
- Prefer labels covering mechanisms, categories, evidence, process, impact, examples, or strategy when relevant
- Start with: mindmap
- Return ONLY raw syntax, NO code fences

Example:
mindmap
  root((Photosynthesis))
    Light Reactions
      Photosystem II
      Electron Transport
    Calvin Cycle
      Carbon Fixation
      Sugar Production
    Chloroplast Structure
      Thylakoids
      Stroma

Material to map:
${summary}`;

    const mindmapResult = await callAIWithFallback(
      "You are a visual learning expert. Generate clean Mermaid.js mindmap syntax only.",
      mindmapPrompt,
      {
        type: "OBJECT",
        properties: { mindmap: { type: "STRING" } },
        required: ["mindmap"],
      },
      getMockMindmapPayload(summary),
    );

    const mindmapData = normalizeMindmapResponse(mindmapResult, summary);

    const payload = { mindmapData };
    setCachedResult(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    console.error("[Mindmap Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/extract-source", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "A public URL is required." });
    }

    const extracted = await extractSourceFromUrl(url);
    return res.json({
      text: extracted.text,
      metadata: {
        title: extracted.title,
        sourceLabel: extracted.sourceLabel,
        extractedAt: Date.now(),
      },
    });
  } catch (error) {
    console.error("[Extract Source Error]:", error);
    return res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to extract content from this link.",
    });
  }
});

// ──────────────────────────────────────────────
// API ENDPOINTS
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// Endpoint: Summarize (Legacy support)
// ──────────────────────────────────────────────

/**
 * POST /summarize
 * Legacy endpoint for text summarization
 *
 * @deprecated Use /study-bundle for complete study session
 * @param {string} text - Text to summarize
 * @returns {Object} Summary with key terms and difficulty level
 */
router.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const systemPrompt =
      "You are a study assistant specialized in helping dyslexic readers. Use simple, clear language. Break down complex ideas.";
    const userPrompt = `Summarize the following text for a student. The summary should be 15-20% of the original length. Use simple, clear language. Return a JSON object with keys: "summary" (string), "keyTerms" (array of {term, definition}), and "difficulty_level" (string).\n\nText:\n${text}`;

    const schema = {
      type: "OBJECT",
      properties: {
        summary: { type: "STRING" },
        keyTerms: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              term: { type: "STRING" },
              definition: { type: "STRING" },
            },
            required: ["term", "definition"],
          },
        },
        difficulty_level: { type: "STRING" },
      },
      required: ["summary", "keyTerms", "difficulty_level"],
    };

    const result = await callAIWithFallback(
      systemPrompt,
      userPrompt,
      schema,
      getMockSummary(text),
    );
    const summaryWordCount = result.summary.trim().split(/\s+/).length;

    res.json({ ...result, wordCount: summaryWordCount });
  } catch (err) {
    console.error("[Summarize Error]:", err);
    res.status(500).json({ error: "Failed to summarize text" });
  }
});

// ──────────────────────────────────────────────
// Endpoint: Decompose (Task Breakdown)
// ──────────────────────────────────────────────
router.post("/decompose", async (req, res) => {
  try {
    const { summary } = req.body;
    if (!summary) return res.status(400).json({ error: "Summary is required" });

    const systemPrompt =
      "You are an executive function coach for students with ADHD. Your goal is to take a summary and break it down into tiny, actionable, non-intimidating steps.";
    const userPrompt = `Break down the following study material into a list of 5-8 small, actionable tasks that a student can complete in 5-10 minutes each. Use clear, encouraging language. Return a JSON array of strings.\n\nSummary:\n${summary}`;

    const schema = {
      type: "ARRAY",
      items: { type: "STRING" },
    };

    const result = await callAIWithFallback(
      systemPrompt,
      userPrompt,
      schema,
      getMockTasks(summary),
    );
    const tasks = Array.isArray(result)
      ? result
      : result.tasks || getMockTasks(summary);
    res.json({ tasks });
  } catch (err) {
    console.error("[Decompose Error]:", err);
    res.status(500).json({ error: "Failed to decompose tasks" });
  }
});

// ──────────────────────────────────────────────
// Endpoint: Generate Quiz
// ──────────────────────────────────────────────
router.post("/generate-quiz", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const systemPrompt =
      "You are a study assistant that generates gamified quizzes. Generate 3 to 5 clear multiple choice questions.";
    const userPrompt = `Generate a multiple choice quiz for the following text. Return a JSON object with a "questions" key containing an array of objects, each with: "question" (string), "options" (array of strings), "correctAnswerIndex" (integer), and "explanation" (string).\n\nText:\n${text}`;

    const schema = {
      type: "OBJECT",
      properties: {
        questions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              options: { type: "ARRAY", items: { type: "STRING" } },
              correctAnswerIndex: { type: "INTEGER" },
              explanation: { type: "STRING" },
            },
            required: [
              "question",
              "options",
              "correctAnswerIndex",
              "explanation",
            ],
          },
        },
      },
      required: ["questions"],
    };

    const result = await callAIWithFallback(
      systemPrompt,
      userPrompt,
      schema,
      getMockQuiz(text),
    );
    const questions = Array.isArray(result)
      ? result
      : result.questions || getMockQuiz(text).questions;
    res.json({ questions });
  } catch (err) {
    console.error("[Quiz Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Endpoint: Chat (Interactive Study Companion)
// ──────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  try {
    const { message, context, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const systemPrompt = `You are an encouraging study companion for a student with dyslexia. 
      You are helping them understand the following context: 
      ---
      ${context}
      ---
      RULES:
      1. Use simple, clear language.
      2. Keep responses concise (under 3 sentences if possible).
      3. Focus ONLY on explaining the provided context.
      4. Be encouraging and patient.`;

    const userPrompt = history
      ? `Conversation so far:\n${history}\n\nStudent: ${message}`
      : message;

    const schema = {
      type: "OBJECT",
      properties: {
        reply: { type: "STRING" },
      },
      required: ["reply"],
    };

    const result = await callAIWithFallback(
      systemPrompt,
      userPrompt,
      schema,
      getMockChatReply(message),
    );
    res.json(result);
  } catch (err) {
    console.error("[Chat Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Endpoint: Text-to-Speech
// ──────────────────────────────────────────────

/**
 * POST /text-to-speech
 * Convert text to natural speech audio
 *
 * Uses ElevenLabs AI to generate high-quality voice synthesis
 * for accessibility and read-along functionality.
 *
 * @param {string} text - Text to convert to speech
 * @returns {Stream} Audio stream (MP3 format)
 */
router.post("/text-to-speech", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const audioStream = await generateTTS(ELEVENLABS_API_KEY, text);
    res.setHeader("Content-Type", "audio/mpeg");
    audioStream.pipe(res);
  } catch (err) {
    console.error("[TTS Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Endpoint: Process Document (Multi-format support)
// ──────────────────────────────────────────────
/**
 * POST /process-document
 * Process documents in various formats (DOCX, PPT, etc.)
 * Browser handles: PDF, TXT, CSV
 * Server handles: DOCX, PPT, links
 *
 * @param {string} url - URL to process (Google Drive, etc.)
 * @param {Buffer} file - File buffer for server-side processing
 * @param {string} fileType - Type of file being processed
 * @returns {Object} Extracted text and metadata
 */
router.post("/process-document", async (req, res) => {
  try {
    const { url, fileType } = req.body;

    if (!url && !req.file) {
      return res.status(400).json({ error: "Either URL or file is required" });
    }

    let extractedText = "";
    let sourceType = "unknown";

    // Handle URL-based documents
    if (url) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        // Google Drive/Docs extraction
        if (domain.includes("docs.google.com")) {
          // Extract document ID
          const docIdMatch =
            url.match(/\/document\/d\/([A-Za-z0-9-_]+)/) ||
            url.match(/id=([A-Za-z0-9-_]+)/);

          if (docIdMatch) {
            const docId = docIdMatch[1];
            // Export as plain text via Google's export API
            const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
            try {
              const response = await fetch(exportUrl);
              if (response.ok) {
                extractedText = await response.text();
                sourceType = "Google Docs";
              }
            } catch (e) {
              console.warn("Google Docs export failed:", e);
              extractedText = `[Google Docs] Document: ${docId}\nNote: Content requires authentication to access.`;
            }
          }
        }
        // Wikipedia articles
        else if (domain.includes("wikipedia.org")) {
          try {
            const pageTitle =
              new URLSearchParams(urlObj.search).get("title") ||
              urlObj.pathname.split("/").pop();
            const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${pageTitle}&prop=extracts&explaintext=true&format=json`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            const pages = Object.values(data.query.pages);
            if (pages.length > 0 && "extract" in pages[0]) {
              extractedText = pages[0].extract;
              sourceType = "Wikipedia";
            }
          } catch (e) {
            console.warn("Wikipedia extraction failed:", e);
          }
        }
        // Medium articles
        else if (domain.includes("medium.com")) {
          try {
            const response = await fetch(url);
            const html = await response.text();
            // Extract text from HTML (basic approach)
            const textMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
            if (textMatch) {
              extractedText = textMatch[1]
                .replace(/<[^>]*>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"');
              sourceType = "Medium";
            }
          } catch (e) {
            console.warn("Medium extraction failed:", e);
          }
        }
        // arXiv papers
        else if (domain.includes("arxiv.org")) {
          try {
            const paperId = urlObj.pathname.match(
              /\/(?:abs|pdf)\/([0-9.]+)/,
            )?.[1];
            if (paperId) {
              const apiUrl = `http://export.arxiv.org/api/query?id_list=${paperId}`;
              const response = await fetch(apiUrl);
              const xml = await response.text();
              const summaryMatch = xml.match(
                /<summary[^>]*>([\s\S]*?)<\/summary>/,
              );
              if (summaryMatch) {
                extractedText = `[arXiv Paper: ${paperId}]\n${summaryMatch[1].trim()}`;
                sourceType = "arXiv";
              }
            }
          } catch (e) {
            console.warn("arXiv extraction failed:", e);
          }
        }

        if (!extractedText) {
          return res.status(400).json({
            error: `Could not extract content from ${domain}. Supported: Google Drive, Wikipedia, Medium, arXiv, GitHub, Dev.to`,
          });
        }
      } catch (error) {
        return res.status(400).json({ error: "Invalid URL provided" });
      }
    }
    // Handle file uploads for server-side processing
    else if (req.file) {
      const fileName = req.file.originalname;
      const buffer = req.file.buffer;

      if (fileName.endsWith(".docx")) {
        // DOCX: Would require docx parsing library
        throw new Error(
          "DOCX processing requires additional dependencies. Please install docx library.",
        );
      } else if (fileName.endsWith(".ppt") || fileName.endsWith(".pptx")) {
        // PPT: Would require pptx parsing library
        throw new Error(
          "PowerPoint processing requires additional dependencies. Please install pptx-parser library.",
        );
      } else {
        throw new Error(`Unsupported file type: ${fileName}`);
      }
    }

    if (!extractedText) {
      return res.status(400).json({ error: "No content could be extracted" });
    }

    res.json({
      text: extractedText.substring(0, 50000), // Limit to 50k chars
      metadata: {
        source: sourceType,
        extractedAt: new Date().toISOString(),
        contentLength: extractedText.length,
      },
    });
  } catch (err) {
    console.error("[Document Processing Error]:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to process document" });
  }
});

export default router;
