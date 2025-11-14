/**
 * Process: Set Admin Role
 * Purpose: Callable Cloud Function to grant admin role via custom claims
 * Data Source: Firebase Auth custom claims
 * Update Path: Sets {role: 'admin'} custom claim on user
 * Dependencies: firebase-admin/auth
 */

import { onRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

const allowedOrigins = [
  "https://flicklet.netlify.app",
  "https://flicklet.app",
  "http://localhost:8888",
  "http://localhost:4173",
  "http://localhost:5173",
];

function setCorsHeaders(req: any, res: any): boolean {
  const origin = req.headers.origin || req.headers.Origin;
  if (origin && typeof origin === "string" && allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return true;
  }
  return false;
}

export const setAdminRole = onRequest(
  {
    cors: true,
    region: "us-central1",
  },
  async (req: any, res: any) => {
    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      setCorsHeaders(req, res);
      res.status(204).send("");
      return;
    }

    // Set CORS headers for actual request
    if (!setCorsHeaders(req, res)) {
      res.status(403).json({ error: "CORS not allowed" });
      return;
    }

    try {
      console.log("[setAdminRole] Request received:", {
        method: req.method,
        origin: req.headers.origin,
        hasAuth: !!req.headers.authorization,
      });

      // Get auth token from Authorization header or request body
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("[setAdminRole] Missing or invalid authorization header");
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const token = authHeader.split("Bearer ")[1];
      console.log("[setAdminRole] Token extracted, verifying...");

      // Verify the token and get the user
      const decodedToken = await getAuth().verifyIdToken(token);
      const uid = decodedToken.uid;
      console.log("[setAdminRole] Token verified for user:", uid);

      // Set admin role
      await getAuth().setCustomUserClaims(uid, { role: "admin" });
      console.log("[setAdminRole] Admin role granted successfully");

      const response = { message: "Admin role granted", success: true };
      console.log("[setAdminRole] Sending response:", response);
      res.status(200).json(response);
    } catch (error: any) {
      console.error("[setAdminRole] Error setting admin role:", error);
      const errorResponse = {
        error: "Failed to set admin role",
        message: error.message,
      };
      console.log("[setAdminRole] Sending error response:", errorResponse);
      res.status(500).json(errorResponse);
    }
  }
);
