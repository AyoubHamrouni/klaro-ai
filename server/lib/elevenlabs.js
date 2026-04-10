/**
 * ElevenLabs Text-to-Speech Integration
 *
 * Provides natural voice synthesis for text-to-speech functionality.
 * Used to create audio read-along for study materials.
 *
 * @author Ayoub Hamrouni
 * @version 1.0.0
 */

import fetch from "node-fetch";

/**
 * Generate text-to-speech audio using ElevenLabs
 *
 * @param {string} apiKey - ElevenLabs API key
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - Voice ID to use (default: EXAVITQu4vr4xnSDxMaL)
 * @returns {Promise<ReadableStream>} Audio stream response
 * @throws {Error} If API call fails
 */
export async function generateTTS(
  apiKey,
  text,
  voiceId = "EXAVITQu4vr4xnSDxMaL",
) {
  if (!apiKey) {
    throw new Error("ElevenLabs API key is required");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for text-to-speech");
  }

  // Truncate to prevent payload-too-large errors
  const MAX_TTS_CHARS = 5000;
  const sanitizedText = text.trim().slice(0, MAX_TTS_CHARS);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: sanitizedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
        },
        speed: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `ElevenLabs API Error: ${response.status} - ${errorText}`,
      );
    }

    return response.body;
  } catch (error) {
    if (error.message.includes("API Error")) {
      throw error; // Re-throw API errors as-is
    }
    throw new Error(`Text-to-speech generation failed: ${error.message}`);
  }
}
