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
  // Allow same-origin requests (origin is undefined)
  if (!origin) return true;

  // Allow localhost for development
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return true;
  }

  // Allow production origins from env
  if (allowedOrigins.has(origin)) {
    return true;
  }

  // Permissive CORS in production if no specific origins are defined
  // This helps when the deployment URL is dynamic (like Cloud Run)
  if (process.env.NODE_ENV === "production" && allowedOrigins.size === 0) {
    return true;
  }

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    // In production, be slightly more permissive to avoid white-screen issues
    if (process.env.NODE_ENV === "production") {
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
app.use(cors(corsOptions));

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
 * Tries both root dist and server dist to handle different deployment structures
 */
const distPath = path.join(__dirname, "dist");
const rootDistPath = path.join(__dirname, "..", "dist");

app.use(express.static(distPath));
app.use(express.static(rootDistPath));

// Fallback all other GET requests to the React index.html
app.get("*", (req, res, next) => {
  // Do not serve index.html for missing assets or API calls
  if (
    req.method !== "GET" || 
    req.path.startsWith("/api") || 
    req.path.includes(".")
  ) {
    return next();
  }
  
  // Try sending from either dist location
  const indexPath = path.join(distPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      const rootIndexPath = path.join(rootDistPath, "index.html");
      res.sendFile(rootIndexPath, (rootErr) => {
        if (rootErr) {
          next();
        }
      });
    }
  });
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
