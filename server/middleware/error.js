/**
 * Error Handling Middleware for Lumina OS API
 *
 * Provides centralized error handling with appropriate HTTP status codes
 * and user-friendly error messages for production environments.
 *
 * @author Ayoub Hamrouni
 * @version 1.0.0
 */

/**
 * Global error handler middleware
 * Catches and processes all application errors
 *
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Determine appropriate status code
  let statusCode = 500;
  let message = "Internal server error";

  // Handle specific error types
  if (err.message.includes("API Error")) {
    statusCode = 502; // Bad Gateway
    message = "AI service temporarily unavailable";
  } else if (err.message.includes("rate limit")) {
    statusCode = 429; // Too Many Requests
    message = "Rate limit exceeded, please try again later";
  } else if (err.message.includes("timeout")) {
    statusCode = 504; // Gateway Timeout
    message = "Request timeout, please try again";
  } else if (err.message.includes("validation")) {
    statusCode = 400; // Bad Request
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && {
      // Include stack trace in development
      stack: err.stack,
    }),
  });
};

/**
 * 404 Not Found handler middleware
 * Handles requests to undefined routes
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The requested path ${req.method} ${req.path} does not exist`,
    availableEndpoints: [
      "GET /health",
      "POST /summarize",
      "POST /study-bundle",
      "POST /text-to-speech",
      "POST /chat",
    ],
    timestamp: new Date().toISOString(),
  });
};
