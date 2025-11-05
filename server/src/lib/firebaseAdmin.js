/**
 * Process: Firebase Admin Initialization
 * Purpose: Initialize Firebase Admin SDK for server-side Firestore access
 * Data Source: Service account JSON from GOOGLE_APPLICATION_CREDENTIALS env var
 * Update Path: N/A - initialized once
 * Dependencies: firebase-admin package
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";

let firestore = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account from GOOGLE_APPLICATION_CREDENTIALS env var or JSON string
 */
export async function initFirebaseAdmin() {
  if (firestore) {
    return firestore; // Already initialized
  }

  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      firestore = admin.firestore();
      return firestore;
    }

    // Initialize with service account
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
      // Use service account JSON string
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (serviceAccountPath) {
      // Use service account file path
      const serviceAccount = JSON.parse(
        readFileSync(serviceAccountPath, "utf8")
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Try to use Application Default Credentials (for Cloud Run, etc.)
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }

    firestore = admin.firestore();
    return firestore;
  } catch (error) {
    console.error("[FirebaseAdmin] Initialization error:", error.message);
    // Return null if initialization fails - route will handle gracefully
    return null;
  }
}

/**
 * Get Firestore instance (lazy initialization)
 */
export async function getFirestore() {
  if (!firestore) {
    return await initFirebaseAdmin();
  }
  return firestore;
}
