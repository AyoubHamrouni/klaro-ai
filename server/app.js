/**
 * Lumina OS Express Application
 *
 * Main Express application setup with middleware, routes, and error handling.
 * Provides RESTful API endpoints for AI-powered study assistance.
 *
 * @author Ayoub Hamrouni
 * @version 1.0.0
 */

import express from "express";
import cors from "cors";
import "dotenv/config";
import studyRoutes from "./routes/study.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

/**
 * Express application instance
 * Configured with security, performance, and reliability in mind
 */
const app = express();

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

/**
 * CORS middleware
 * Allows cross-origin requests from frontend applications
 */
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-production-domain.com"] // Update for production
        : ["http://localhost:5173", "http://localhost:3000"], // Vite dev server
    credentials: true,
  }),
);

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
