/**
 * Process: Manage Admin Role
 * Purpose: Callable Cloud Function to grant/revoke admin role to other users (admin only)
 * Data Source: Firebase Auth custom claims
 * Update Path: Sets/removes {role: 'admin'} custom claim on target user
 * Dependencies: firebase-admin/auth
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';

export const manageAdminRole = onCall(
  { cors: true },
  async (req) => {
    // Check caller is authenticated
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check caller is admin by verifying their token claims
    // Note: req.auth.token contains the decoded ID token with custom claims
    const callerRole = req.auth.token?.role;
    
    if (callerRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can manage admin roles');
    }

    // Get target user ID and grant/revoke flag from request
    const { userId, grant } = req.data;

    if (typeof userId !== 'string' || typeof grant !== 'boolean') {
      throw new HttpsError('invalid-argument', 'userId (string) and grant (boolean) are required');
    }

    // Prevent self-demotion (safety check)
    if (userId === req.auth.uid && !grant) {
      throw new HttpsError('permission-denied', 'Cannot revoke your own admin role');
    }

    // Get target user to verify they exist
    const targetUser = await getAuth().getUser(userId);

    // Set or remove admin role
    if (grant) {
      await getAuth().setCustomUserClaims(userId, { role: 'admin' });
      return { 
        message: 'Admin role granted',
        userId,
        email: targetUser.email,
      };
    } else {
      // Remove admin role by setting claims to null or empty object
      await getAuth().setCustomUserClaims(userId, null);
      return { 
        message: 'Admin role revoked',
        userId,
        email: targetUser.email,
      };
    }
  }
);

