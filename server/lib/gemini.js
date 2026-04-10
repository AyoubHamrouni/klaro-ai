/**
 * Google Gemini AI Integration
 *
 * Provides integration with Google's Gemini AI models for text generation
 * and analysis. Used as the primary AI provider in the Klaro AI system.
 *
 * @author Ayoub Hamrouni
 * @version 1.0.0
 */

import fetch from "node-fetch";

/**
 * Generate content using Google Gemini AI
 *
 * @param {string} apiKey - Gemini API key
 * @param {string} systemInstruction - System prompt for the AI
 * @param {string} prompt - User prompt to process
 * @param {Object} schema - JSON schema for response validation
 * @param {string} model - Gemini model to use (default: gemini-1.5-flash)
 * @returns {Promise<Object>} Parsed JSON response from Gemini
 * @throws {Error} If API call fails or response is invalid
 */
export async function generateGeminiContent(
  apiKey,
  systemInstruction,
  prompt,
  schema,
  model = "gemini-1.5-flash",
) {
  if (!apiKey) {
    throw new Error("Gemini API key is required");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeoutMs = 25000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          response_mime_type: "application/json",
          response_schema: schema,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No content returned from Gemini API");
    }

    // Parse and validate JSON response
    const parsedResponse = JSON.parse(text);

    // Basic validation
    if (typeof parsedResponse !== "object" || parsedResponse === null) {
      throw new Error("Invalid response format from Gemini API");
    }

    return parsedResponse;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Gemini API request timed out");
    }
    if (error.name === "SyntaxError") {
      throw new Error("Failed to parse JSON response from Gemini API");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
