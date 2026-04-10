/**
 * Klaro AI API Server
 *
 * Main entry point for the Klaro AI backend API.
 * Provides AI-powered study assistance with multi-model fallback system.
 *
 * @author Ayoub Hamrouni
 * @version 1.0.0
 * @license MIT
 */

import app from "./app.js";

/**
 * Server port configuration
 * Uses environment variable or defaults to 3001
 */
const PORT = process.env.PORT || 3001;

/**
 * Start the Express server
 * Logs API key configuration status for debugging
 */
app.listen(PORT, () => {
  console.log(`🚀 Klaro AI API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log("");

  // API Key Status Check
  console.log("🔑 API Configuration Status:");
  console.log(
    `   Gemini: ${process.env.GEMINI_API_KEY ? "✅ configured" : "❌ not set"}`,
  );
  console.log(
    `   OpenRouter: ${process.env.OPENROUTER_API_KEY ? "✅ configured" : "❌ not set"}`,
  );
  console.log(
    `   ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? "✅ configured" : "❌ not set"}`,
  );
  console.log("");

  if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    console.log(
      "⚠️  Warning: No AI API keys configured. Mock data will be used.",
    );
  }
});
