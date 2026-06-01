/**
 * Central trial / Pro / read-only entitlement resolution.
 * paidPro and activeTrial both grant full access; expired unpaid users are read-only.
 */

import type { ProStatus } from './proStatus';

export const TRIAL_LENGTH_DAYS = 21;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const TRIAL_STORAGE_KEY = 'flicklet.trial.v1';

export type EntitlementPhase =
  | 'anonymous'
  | 'activeTrial'
  | 'paidPro'
  | 'expiredReadOnly';

export interface TrialRecord {
  userId: string;
  startMs: number;
}

export interface EntitlementInput {
  isAuthenticated: boolean;
  paidPro: boolean;
  proSource: ProStatus['source'];
  trialStartMs: number | null;
  nowMs?: number;
}

export interface EntitlementState {
  phase: EntitlementPhase;
  paidPro: boolean;
  trialActive: boolean;
  trialExpired: boolean;
  hasFullAccess: boolean;
  isReadOnlyMode: boolean;
  trialStartMs: number | null;
  trialDaysRemaining: number | null;
  proSource: ProStatus['source'];
}

export function loadTrialRecord(userId: string): TrialRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrialRecord;
    if (parsed?.userId === userId && typeof parsed.startMs === 'number') {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveTrialRecord(record: TrialRecord): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
}

export function parseAuthCreationTimeMs(
  creationTime: string | undefined
): number | null {
  if (!creationTime) return null;
  const ms = Date.parse(creationTime);
  return Number.isFinite(ms) ? ms : null;
}

/** Resolve or create trial start for a signed-in user (persisted per user). */
export function ensureTrialStartMs(
  userId: string,
  creationTime: string | undefined
): number {
  const existing = loadTrialRecord(userId);
  if (existing) return existing.startMs;

  const creationMs = parseAuthCreationTimeMs(creationTime);
  const startMs = creationMs ?? Date.now();
  saveTrialRecord({ userId, startMs });
  return startMs;
}

export function getTrialDaysRemaining(
  trialStartMs: number | null,
  nowMs: number = Date.now()
): number | null {
  if (trialStartMs == null) return null;
  const endMs = trialStartMs + TRIAL_LENGTH_DAYS * MS_PER_DAY;
  const remainingMs = endMs - nowMs;
  if (remainingMs <= 0) return 0;
  return Math.max(0, Math.floor(remainingMs / MS_PER_DAY));
}

export function isTrialActive(
  trialStartMs: number | null,
  nowMs: number = Date.now()
): boolean {
  if (trialStartMs == null) return false;
  return nowMs < trialStartMs + TRIAL_LENGTH_DAYS * MS_PER_DAY;
}

export function isTrialExpired(
  trialStartMs: number | null,
  paidPro: boolean,
  isAuthenticated: boolean,
  nowMs: number = Date.now()
): boolean {
  if (!isAuthenticated || paidPro) return false;
  if (trialStartMs == null) return false;
  return !isTrialActive(trialStartMs, nowMs);
}

export function resolveEntitlements(input: EntitlementInput): EntitlementState {
  const nowMs = input.nowMs ?? Date.now();
  const paidPro = input.paidPro;

  if (!input.isAuthenticated) {
    return {
      phase: 'anonymous',
      paidPro: false,
      trialActive: false,
      trialExpired: false,
      hasFullAccess: false,
      isReadOnlyMode: false,
      trialStartMs: null,
      trialDaysRemaining: null,
      proSource: null,
    };
  }

  if (paidPro) {
    return {
      phase: 'paidPro',
      paidPro: true,
      trialActive: false,
      trialExpired: false,
      hasFullAccess: true,
      isReadOnlyMode: false,
      trialStartMs: input.trialStartMs,
      trialDaysRemaining: getTrialDaysRemaining(input.trialStartMs, nowMs),
      proSource: input.proSource,
    };
  }

  const trialActive = isTrialActive(input.trialStartMs, nowMs);
  const trialExpired = isTrialExpired(
    input.trialStartMs,
    false,
    true,
    nowMs
  );

  if (trialActive) {
    return {
      phase: 'activeTrial',
      paidPro: false,
      trialActive: true,
      trialExpired: false,
      hasFullAccess: true,
      isReadOnlyMode: false,
      trialStartMs: input.trialStartMs,
      trialDaysRemaining: getTrialDaysRemaining(input.trialStartMs, nowMs),
      proSource: input.proSource,
    };
  }

  if (trialExpired) {
    return {
      phase: 'expiredReadOnly',
      paidPro: false,
      trialActive: false,
      trialExpired: true,
      hasFullAccess: false,
      isReadOnlyMode: true,
      trialStartMs: input.trialStartMs,
      trialDaysRemaining: 0,
      proSource: input.proSource,
    };
  }

  // Authenticated, no paid, trial not started yet (pre-init)
  return {
    phase: 'anonymous',
    paidPro: false,
    trialActive: false,
    trialExpired: false,
    hasFullAccess: false,
    isReadOnlyMode: false,
    trialStartMs: input.trialStartMs,
    trialDaysRemaining: null,
    proSource: input.proSource,
  };
}

export function hasFullAccess(state: EntitlementState): boolean {
  return state.hasFullAccess;
}

export function isReadOnlyMode(state: EntitlementState): boolean {
  return state.isReadOnlyMode;
}

let cachedEntitlements: EntitlementState = resolveEntitlements({
  isAuthenticated: false,
  paidPro: false,
  proSource: null,
  trialStartMs: null,
});

export function setEntitlementsCache(state: EntitlementState): void {
  cachedEntitlements = state;
}

export function getEntitlementsSync(): EntitlementState {
  return cachedEntitlements;
}

export function getTrialStatusLabel(state: EntitlementState): string | null {
  if (state.phase === 'paidPro') return null;
  if (state.phase === 'activeTrial') {
    const days = state.trialDaysRemaining;
    if (days == null) return 'Full access trial active';
    if (days <= 0) return 'Trial ends today — upgrade to keep editing';
    if (days === 1) return 'Full access trial: 1 day left';
    return `Full access trial: ${days} days left`;
  }
  if (state.phase === 'expiredReadOnly') {
    return 'Trial ended — your library is read-only. Export anytime or upgrade to keep editing.';
  }
  return null;
}
