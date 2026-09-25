/**
 * Server-backed trial entitlement — Firestore is source of truth.
 * Path: users/{uid}/entitlements/trial
 */

import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from './firebaseBootstrap';
import {
  TRIAL_RECORD_VERSION,
  loadTrialRecord,
  saveTrialRecord,
  type TrialRecord,
} from './entitlements';

export const TRIAL_ENTITLEMENT_COLLECTION = 'entitlements';
export const TRIAL_ENTITLEMENT_DOC_ID = 'trial';

export type ServerTrialEntitlement = {
  trialStartMs: number;
  version: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  resetAt?: unknown;
  resetBy?: string;
};

export function trialEntitlementRef(userId: string): DocumentReference {
  return doc(db, 'users', userId, TRIAL_ENTITLEMENT_COLLECTION, TRIAL_ENTITLEMENT_DOC_ID);
}

export function readTrialStartMs(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;
  const startMs = (data as ServerTrialEntitlement).trialStartMs;
  return typeof startMs === 'number' && Number.isFinite(startMs) ? startMs : null;
}

/** Read trial start from Firestore only (no create). */
export async function fetchServerTrialStartMs(userId: string): Promise<number | null> {
  const snap = await getDoc(trialEntitlementRef(userId));
  if (!snap.exists()) return null;
  return readTrialStartMs(snap.data());
}

function cacheLocalTrial(userId: string, startMs: number): void {
  const record: TrialRecord = {
    userId,
    startMs,
    version: TRIAL_RECORD_VERSION,
  };
  saveTrialRecord(record);
}

/**
 * Resolve account trial start from Firestore (create once if missing).
 * Local storage is cache-only; server wins on conflict.
 */
export async function resolveServerTrialStartMs(userId: string): Promise<number> {
  const ref = trialEntitlementRef(userId);

  const existing = await getDoc(ref);
  if (existing.exists()) {
    const startMs = readTrialStartMs(existing.data());
    if (startMs == null) {
      throw new Error('[Trial] Invalid server trial document');
    }
    cacheLocalTrial(userId, startMs);
    return startMs;
  }

  const local = loadTrialRecord(userId);
  const proposedStartMs = local?.startMs ?? Date.now();

  const startMs = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists()) {
      const existingStart = readTrialStartMs(snap.data());
      if (existingStart == null) {
        throw new Error('[Trial] Invalid server trial document');
      }
      return existingStart;
    }

    transaction.set(ref, {
      trialStartMs: proposedStartMs,
      version: TRIAL_RECORD_VERSION,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } satisfies ServerTrialEntitlement);

    return proposedStartMs;
  });

  cacheLocalTrial(userId, startMs);
  return startMs;
}
