import express from "express";
import { PrismaClient } from "@prisma/client";
import { getPosts, getPostBySlug, getPostComments } from "./routes/posts.js";
import { getUserByUsername } from "./routes/users.js";
import { getTags } from "./routes/tags.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { rateLimit } from "./middleware/rateLimit.js";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// CORS middleware - allow requests from Netlify dev and Next.js dev
app.use((request, res, next) => {
  const origin = request.headers.origin;
  const allowedOrigins = [
    "http://localhost:8888", // Netlify dev
    "http://localhost:3000", // Next.js dev
    "http://localhost:4173", // Vite preview
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

app.use(express.json());

// Apply rate limiting to all API routes (60 requests per minute per IP)
app.use("/api", rateLimit(60, 60000));

/**
 * Process: Health Check
 * Purpose: Verify server and database connectivity
 * Data Source: Prisma database connection test
 * Update Path: N/A - read-only endpoint
 * Dependencies: Prisma client, database connection
 */
app.get("/health", async (request, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

// API routes
app.get("/api/v1/posts", getPosts);
app.get("/api/v1/posts/:slug", getPostBySlug);
app.get("/api/v1/posts/:slug/comments", getPostComments);
app.get("/api/v1/users/:username", getUserByUsername);
app.get("/api/v1/tags", getTags);
// Alias for testing: /api/feed maps to /api/v1/posts
app.get("/api/feed", getPosts);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Export app for testing
export { app };

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
