/**
 * Admin script to reset a user's trial entitlement for QA.
 * Usage: npx ts-node --project tsconfig.json scripts/reset-trial.ts <userId> [trialStartMs]
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or Firebase Admin default credentials.
 * Does NOT modify billing/status or user library data.
 */

import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const TRIAL_RECORD_VERSION = 2;

initializeApp();
const db = getFirestore();
const auth = getAuth();

async function resetTrial(userId: string, trialStartMs?: number) {
  const targetUser = await auth.getUser(userId);
  const startMs = trialStartMs ?? Date.now();

  const trialRef = db.collection('users').doc(userId).collection('entitlements').doc('trial');
  const existing = await trialRef.get();

  await trialRef.set(
    {
      trialStartMs: startMs,
      version: TRIAL_RECORD_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
      resetAt: FieldValue.serverTimestamp(),
      resetBy: 'admin-script',
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  console.log('✅ Trial entitlement reset');
  console.log(`   userId: ${userId}`);
  console.log(`   email: ${targetUser.email ?? '(none)'}`);
  console.log(`   trialStartMs: ${startMs}`);
  console.log(`   path: users/${userId}/entitlements/trial`);
}

const userId = process.argv[2];
const startArg = process.argv[3];

if (!userId) {
  console.error('Usage: npx ts-node --project tsconfig.json scripts/reset-trial.ts <userId> [trialStartMs]');
  process.exit(1);
}

const trialStartMs = startArg ? Number(startArg) : undefined;
if (startArg && !Number.isFinite(trialStartMs)) {
  console.error('trialStartMs must be a number');
  process.exit(1);
}

resetTrial(userId, trialStartMs)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  });
