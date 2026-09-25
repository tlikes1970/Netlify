/**
 * Admin-only callable to reset a user's trial entitlement for QA.
 * Does not modify billing, library, settings, or other user data.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './admin';
import { getAuth } from 'firebase-admin/auth';

const TRIAL_RECORD_VERSION = 2;

export const resetTrialEntitlement = onCall({ cors: true }, async (req) => {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (req.auth.token?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can reset trial entitlements');
  }

  const { userId, trialStartMs } = req.data ?? {};

  if (typeof userId !== 'string' || userId.length === 0) {
    throw new HttpsError('invalid-argument', 'userId (string) is required');
  }

  if (
    trialStartMs !== undefined &&
    (typeof trialStartMs !== 'number' || !Number.isFinite(trialStartMs))
  ) {
    throw new HttpsError('invalid-argument', 'trialStartMs must be a finite number when provided');
  }

  const targetUser = await getAuth().getUser(userId);
  const startMs = typeof trialStartMs === 'number' ? trialStartMs : Date.now();

  const trialRef = db
    .collection('users')
    .doc(userId)
    .collection('entitlements')
    .doc('trial');

  const existing = await trialRef.get();

  await trialRef.set(
    {
      trialStartMs: startMs,
      version: TRIAL_RECORD_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
      resetAt: FieldValue.serverTimestamp(),
      resetBy: req.auth.uid,
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  return {
    message: 'Trial entitlement reset',
    userId,
    email: targetUser.email ?? null,
    trialStartMs: startMs,
  };
});
