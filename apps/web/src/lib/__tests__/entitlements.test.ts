import { describe, expect, it } from 'vitest';

import {
  TRIAL_LENGTH_DAYS,
  ensureTrialStartMs,
  getTrialDaysRemaining,
  isTrialActive,
  isTrialExpired,
  resolveEntitlements,
} from '../entitlements';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 4, 31, 12, 0, 0);

describe('entitlements', () => {
  it('paidPro grants full access', () => {
    const state = resolveEntitlements({
      isAuthenticated: true,
      paidPro: true,
      proSource: 'android',
      trialStartMs: NOW - 30 * DAY,
      nowMs: NOW,
    });
    expect(state.phase).toBe('paidPro');
    expect(state.hasFullAccess).toBe(true);
    expect(state.isReadOnlyMode).toBe(false);
  });

  it('active trial grants full access', () => {
    const start = NOW - 5 * DAY;
    const state = resolveEntitlements({
      isAuthenticated: true,
      paidPro: false,
      proSource: null,
      trialStartMs: start,
      nowMs: NOW,
    });
    expect(state.phase).toBe('activeTrial');
    expect(state.hasFullAccess).toBe(true);
    expect(state.trialDaysRemaining).toBe(16);
  });

  it('expired unpaid user is read-only', () => {
    const start = NOW - (TRIAL_LENGTH_DAYS + 1) * DAY;
    const state = resolveEntitlements({
      isAuthenticated: true,
      paidPro: false,
      proSource: null,
      trialStartMs: start,
      nowMs: NOW,
    });
    expect(state.phase).toBe('expiredReadOnly');
    expect(state.hasFullAccess).toBe(false);
    expect(state.isReadOnlyMode).toBe(true);
    expect(state.trialDaysRemaining).toBe(0);
  });

  it('trial ends today shows zero days remaining', () => {
    const start = NOW - TRIAL_LENGTH_DAYS * DAY + 60_000;
    expect(getTrialDaysRemaining(start, NOW)).toBe(0);
    expect(isTrialActive(start, NOW)).toBe(true);
  });

  it('first sign-in starts a fresh trial at now', () => {
    const before = Date.now();
    const start = ensureTrialStartMs('user-ent-test-new');
    expect(start).toBeGreaterThanOrEqual(before);
    expect(isTrialActive(start, Date.now())).toBe(true);
  });

  it('resets expired legacy v1 trial record to a new 21-day window', () => {
    const userId = 'user-ent-test-migrate';
    const expiredStart = NOW - (TRIAL_LENGTH_DAYS + 5) * DAY;
    localStorage.setItem(
      'flicklet.trial.v1',
      JSON.stringify({ userId, startMs: expiredStart, version: 1 })
    );
    const before = Date.now();
    const start = ensureTrialStartMs(userId);
    expect(start).toBeGreaterThanOrEqual(before);
    expect(isTrialActive(start, Date.now())).toBe(true);
    localStorage.removeItem('flicklet.trial.v1');
  });

  it('anonymous user is not read-only', () => {
    const state = resolveEntitlements({
      isAuthenticated: false,
      paidPro: false,
      proSource: null,
      trialStartMs: null,
      nowMs: NOW,
    });
    expect(state.isReadOnlyMode).toBe(false);
    expect(state.hasFullAccess).toBe(false);
  });
});
