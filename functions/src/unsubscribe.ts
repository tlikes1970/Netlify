/**
 * Process: Unsubscribe from Email Digest
 * Purpose: Callable function to unsubscribe users from weekly email digest
 * Data Source: Firestore users collection, JWT token verification
 * Update Path: Sets emailSubscriber=false on user document
 * Dependencies: firebase-functions (v1), firebase-admin
 */

import * as functions from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
import { db } from "./admin";

export const unsubscribe = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const { token } = data;

    if (!token || typeof token !== "string") {
      throw new HttpsError("invalid-argument", "Token is required");
    }

    try {
      // Decode token (simple base64url decode for our simple token)
      // In production, use proper JWT verification with secret
      const decoded = JSON.parse(
        Buffer.from(token, "base64url").toString("utf-8")
      );

      if (!decoded.uid || decoded.type !== "unsubscribe") {
        throw new HttpsError("invalid-argument", "Invalid token format");
      }

      // Check expiration
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new HttpsError("invalid-argument", "Token has expired");
      }

      const uid = decoded.uid;

      // Update user document
      await db.collection("users").doc(uid).update({
        emailSubscriber: false,
      });

      return { message: "Unsubscribed" };
    } catch (error: any) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error("Error unsubscribing:", error);
      throw new HttpsError("internal", "Failed to unsubscribe");
    }
});

