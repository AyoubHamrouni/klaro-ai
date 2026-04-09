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
  process.env.OPENROUTER_MODEL || "microsoft/wizardlm-2-8x22b:free";

/**
 * Rate limiting: Track last usage of each provider to avoid exhaustion
 * Maps provider names to timestamp of last successful usage
 */
const providerCooldowns = new Map();

/**
 * Check if a provider is on cooldown to prevent API exhaustion
 *
 * @param {string} providerName - Name of the AI provider
 * @param {number} cooldownMs - Cooldown period in milliseconds (default: 5000)
 * @returns {boolean} True if provider is on cooldown
 */
function isProviderOnCooldown(providerName, cooldownMs = 5000) {
  const lastUsed = providerCooldowns.get(providerName);
  if (!lastUsed) return false;
  return Date.now() - lastUsed < cooldownMs;
}

/**
 * Mark a provider as recently used for rate limiting
 *
 * @param {string} providerName - Name of the AI provider
 */
function markProviderUsed(providerName) {
  providerCooldowns.set(providerName, Date.now());
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
      key: GEMINI_API_KEY,
      model: GEMINI_MODEL,
      fn: generateGeminiContent,
    },
    {
      name: "OpenRouter-Primary",
      key: OPENROUTER_API_KEY,
      model: OPENROUTER_MODEL,
      fn: generateOpenRouterContent,
    },
    {
      name: "OpenRouter-WizardLM",
      key: OPENROUTER_API_KEY,
      model: "microsoft/wizardlm-2-8x22b:free",
      fn: generateOpenRouterContent,
    },
    {
      name: "OpenRouter-Llama",
      key: OPENROUTER_API_KEY,
      model: "meta-llama/llama-3.1-8b-instruct:free",
      fn: generateOpenRouterContent,
    },
    {
      name: "OpenRouter-Gemma4-26B",
      key: OPENROUTER_API_KEY,
      model: "google/gemma-4-26b-a4b-it:free",
      fn: generateOpenRouterContent,
    },
    {
      name: "OpenRouter-Gemma4-31B",
      key: OPENROUTER_API_KEY,
      model: "google/gemma-4-31b-it:free",
      fn: generateOpenRouterContent,
    },
    {
      name: "OpenRouter-Nemotron",
      key: OPENROUTER_API_KEY,
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      fn: generateOpenRouterContent,
    },
    {
      name: "OpenRouter-Minimax",
      key: OPENROUTER_API_KEY,
      model: "minimax/minimax-m2.5:free",
      fn: generateOpenRouterContent,
    },
  ];

  // Shuffle providers to distribute load and avoid exhausting single models
  const shuffledProviders = [...providers].sort(() => Math.random() - 0.5);

  for (const provider of shuffledProviders) {
    if (!provider.key) continue;

    // Skip providers on cooldown to distribute load
    if (isProviderOnCooldown(provider.name)) {
      console.log(`[AI] ⏳ ${provider.name} on cooldown, skipping...`);
      continue;
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
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
          // Auto-parse JSON if string was returned from OpenRouter
          if (typeof result === "string") {
            try {
              result = JSON.parse(result);
            } catch (e) {
              /* ignore */
            }
          }
        }

        if (result) {
          console.log(
            `[AI] ✅ ${provider.name} succeeded on attempt ${attempt}.`,
          );
          markProviderUsed(provider.name);
          return result;
        }
      } catch (err) {
        console.warn(
          `[AI] ⚠️ ${provider.name} attempt ${attempt} failed:`,
          err.message,
        );
        // Small delay before retry
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  // Hackathon Demo: Return mock data if all AI providers fail
  if (mockFallback) {
    console.log("[AI] 🔄 All providers failed, using mock data for demo");
    return mockFallback;
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
  const topic =
    text.substring(0, 30).split(" ").slice(0, 2).join(" ") || "Topic";
  return `mindmap
  root(( ${topic} ))
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
    const mindmapPrompt = `Create a mind map for the following study summary using Mermaid.js mindmap syntax.
Rules:
- Start with: mindmap
- Use 2-space indentation for hierarchy
- Root node should be the main topic (1-3 words) wrapped in (( ))
- Max 3 levels of depth
- Each node: 2-5 words MAX, no special characters except spaces
- 4-8 branches from root
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

    let mindmapData = "";
    if (mindmapResult.status === "fulfilled" && mindmapResult.value) {
      const v = mindmapResult.value;
      mindmapData =
        typeof v === "object" && v.mindmap
          ? v.mindmap
          : typeof v === "string"
            ? v
            : getMockMindmap(text);
    } else {
      mindmapData = getMockMindmap(text);
    }

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

    const result = await callAIWithFallback(systemPrompt, userPrompt, schema);
    res.json({ tasks: result });
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

    const result = await callAIWithFallback(systemPrompt, userPrompt, schema);
    const questions = result.questions || result;
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

    const result = await callAIWithFallback(systemPrompt, userPrompt, schema);
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

export default router;
