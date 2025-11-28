/**
 * Process: Manage Pro Status
 * Purpose: Callable Cloud Function to grant/revoke Pro status to users (admin only)
 * Data Source: Firestore users/{uid}/settings.pro
 * Update Path: Sets/removes Pro status in user settings
 * Dependencies: firebase-admin/firestore
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './admin';
import { getAuth } from 'firebase-admin/auth';

export const manageProStatus = onCall(
  { cors: true },
  async (req) => {
    // Check caller is authenticated
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check caller is admin by verifying their token claims
    const callerRole = req.auth.token?.role;
    
    if (callerRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can manage Pro status');
    }

    // Get target user ID and grant/revoke flag from request
    const { userId, isPro } = req.data;

    if (typeof userId !== 'string' || typeof isPro !== 'boolean') {
      throw new HttpsError('invalid-argument', 'userId (string) and isPro (boolean) are required');
    }

    // Get target user to verify they exist
    const targetUser = await getAuth().getUser(userId);

    // Get existing user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const existingData = userDoc.exists ? userDoc.data() : {};
    const existingSettings = existingData?.settings || {};

    // Update Pro status
    const updatedSettings = {
      ...existingSettings,
      pro: {
        isPro: isPro,
        features: {
          advancedNotifications: isPro,
          themePacks: isPro,
          socialFeatures: isPro,
          bloopersAccess: isPro,
          extrasAccess: isPro,
        },
      },
    };

    // Update Firestore
    await userRef.set({
      ...existingData,
      settings: updatedSettings,
    }, { merge: true });

    return { 
      message: `Pro status ${isPro ? 'granted' : 'revoked'}`,
      userId,
      email: targetUser.email,
      isPro,
    };
  }
);

