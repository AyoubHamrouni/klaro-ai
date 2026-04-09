/**
 * OpenRouter AI Integration
 *
 * Provides integration with OpenRouter's multi-model AI platform.
 * Used as a fallback AI provider with access to various open-source models.
 *
 * @author Ayoub Hamrouni
 * @version 1.0.0
 */

import fetch from "node-fetch";

/**
 * Generate content using OpenRouter AI models
 *
 * @param {string} apiKey - OpenRouter API key
 * @param {string} systemInstruction - System prompt for the AI
 * @param {string} prompt - User prompt to process
 * @param {string} model - OpenRouter model identifier
 * @returns {Promise<Object>} Parsed JSON response from OpenRouter
 * @throws {Error} If API call fails or response is invalid
 */
export async function generateOpenRouterContent(
  apiKey,
  systemInstruction,
  prompt,
  model = "microsoft/wizardlm-2-8x22b:free",
) {
  if (!apiKey) {
    throw new Error("OpenRouter API key is required");
  }

  const url = "https://openrouter.ai/api/v1/chat/completions";
  const controller = new AbortController();
  const timeoutMs = 25000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://github.com/AyoubHamrouni/lumina-os",
        "X-Title": "Lumina OS",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: systemInstruction + " Respond ONLY with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API Error: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from OpenRouter API");
    }

    // Handle cases where OpenRouter returns plain JSON
    try {
      return JSON.parse(content);
    } catch (parseError) {
      // If it's already an object, return as-is
      if (typeof content === "object") {
        return content;
      }
      throw new Error("Invalid JSON response from OpenRouter API");
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("OpenRouter API request timed out");
    }
    if (error.name === "SyntaxError") {
      throw new Error("Failed to parse JSON response from OpenRouter API");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
