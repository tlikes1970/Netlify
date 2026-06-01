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

  it('legacy user without stored trial uses auth creation time when recent', () => {
    const creation = '2026-05-20T00:00:00.000Z';
    const start = ensureTrialStartMs('user-ent-test-recent', creation);
    expect(start).toBe(Date.parse(creation));
    expect(isTrialExpired(start, false, true, NOW)).toBe(false);
  });

  it('migration fallback starts trial at now when no creation time', () => {
    const before = Date.now();
    const start = ensureTrialStartMs('user-ent-test-new', undefined);
    expect(start).toBeGreaterThanOrEqual(before);
    expect(isTrialActive(start, Date.now())).toBe(true);
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
