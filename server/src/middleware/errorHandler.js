/**
 * Process: Error Handler
 * Purpose: Uniform error handling for 404 and 500 responses
 * Data Source: Express error middleware
 * Update Path: N/A - middleware
 * Dependencies: Express
 */
export function errorHandler(error, request, res, next) {
  // Prisma not found errors
  if (error.code === "P2025") {
    return res.status(404).json({ error: "Not found" });
  }

  // Default 500 for unhandled errors
  console.error("Error Handler - Full error details:", {
    message: error.message,
    stack: error.stack,
    code: error.code,
    name: error.name,
    request: {
      method: request.method,
      url: request.url,
      query: request.query,
    },
  });
  res.status(500).json({ error: "Internal Server Error" });
}

/**
 * Process: 404 Handler
 * Purpose: Catch all unmatched routes
 * Data Source: Express middleware
 * Update Path: N/A - middleware
 * Dependencies: Express
 */
export function notFoundHandler(request, res) {
  res.status(404).json({ error: "Not found" });
}

