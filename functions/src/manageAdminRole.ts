import { assertNotDeleting } from './deletionProtection';
/**
 * Process: Manage Admin Role
 * Purpose: Callable Cloud Function to grant/revoke admin role to other users (admin only)
 * Data Source: Firebase Auth custom claims
 * Update Path: Sets/removes {role: 'admin'} custom claim on target user
 * Dependencies: firebase-admin/auth
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

export const manageAdminRole = onCall({ cors: true }, async (req) => {
  // Check caller is authenticated
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  // Check caller is admin by verifying their token claims
  // Note: req.auth.token contains the decoded ID token with custom claims
  const callerRole = req.auth.token?.role;

  if (callerRole !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Only admins can manage admin roles",
    );
  }

  // Get target user ID and grant/revoke flag from request
  const { userId, grant } = req.data ?? {};

  if (
    typeof userId !== "string" ||
    !userId.trim() ||
    typeof grant !== "boolean"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "userId (string) and grant (boolean) are required",
    );
  }

  // Prevent self-demotion (safety check)
  if (userId === req.auth.uid && !grant) {
    throw new HttpsError(
      "permission-denied",
      "Cannot revoke your own admin role",
    );
  }

  await assertNotDeleting(req.auth.uid);
  await assertNotDeleting(userId);
  // Get target user to verify they exist
  const targetUser = await getAuth().getUser(userId);

  // Change only the administrator claim. Other services may own other claims.
  const claims = { ...targetUser.customClaims };
  if (grant) claims.role = "admin";
  else if (claims.role === "admin") delete claims.role;
  await getAuth().setCustomUserClaims(userId, claims);
  return {
    message: `Admin role ${grant ? "granted" : "revoked"}`,
    userId,
    email: targetUser.email,
  };
});
