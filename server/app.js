/**
 * Klaro AI Express Application
 *
 * Main Express application setup with middleware, routes, and error handling.
 * Provides RESTful API endpoints for AI-powered study assistance.
 *
 * @author Ayoub Hamrouni
 * @version 1.0.0
 */

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import studyRoutes from "./routes/study.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Express application instance
 * Configured with security, performance, and reliability in mind
 */
const app = express();

function parseAllowedOrigins() {
  const envOrigins = [
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.CLIENT_ORIGIN,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(",").map((item) => item.trim()))
    .filter(Boolean);

  return new Set(envOrigins);
}

const allowedOrigins = parseAllowedOrigins();

function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return true;
  }

  return allowedOrigins.has(origin);
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
};

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

/**
 * CORS middleware
 * Allows cross-origin requests from frontend applications
 */
app.use(
  cors(corsOptions),
);

app.options("*", cors(corsOptions));

/**
 * JSON parsing middleware
 * Increased limit to handle large academic texts
 */
app.use(express.json({ limit: "10mb" }));

/**
 * Request logging middleware (development only)
 */
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================

/**
 * Health check endpoint for deployment monitoring
 * Used by GCP Cloud Run and load balancers
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: process.uptime(),
  });
});

// ==========================================
// ROUTES
// ==========================================

/**
 * Study-related API routes
 * All AI-powered study assistance endpoints
 */
app.use("/", studyRoutes);

// ==========================================
// FRONTEND STATIC SERVING (PRODUCTION)
// ==========================================

/**
 * Serve the built Vite frontend statically and resolve React Router
 */
app.use(express.static(path.join(__dirname, "dist")));

// Fallback all other GET requests to the React index.html
app.get("*", (req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ==========================================
// ERROR HANDLING
// ==========================================

/**
 * 404 handler for undefined routes
 */
app.use(notFoundHandler);

/**
 * Global error handler
 * Catches and formats all application errors
 */
app.use(errorHandler);

export default app;
