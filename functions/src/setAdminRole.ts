/**
 * Process: Set Admin Role
 * Purpose: Callable Cloud Function to grant admin role via custom claims
 * Data Source: Firebase Auth custom claims
 * Update Path: Sets {role: 'admin'} custom claim on user
 * Dependencies: firebase-admin/auth
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

export const setAdminRole = onCall(
  {
    cors: true,
    region: "us-central1",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    await getAuth().setCustomUserClaims(request.auth.uid, { role: "admin" });

    return { message: "Admin role granted" };
  }
);
