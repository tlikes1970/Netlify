import { describe, expect, it } from 'vitest';

import { READ_ONLY_PRIMARY } from '../copy/access';
import {
  TRIAL_LENGTH_DAYS,
  getTrialDaysRemaining,
  getTrialStatusLabel,
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
      trialResolved: true,
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
      trialResolved: true,
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
      trialResolved: true,
      nowMs: NOW,
    });
    expect(state.phase).toBe('expiredReadOnly');
    expect(state.hasFullAccess).toBe(false);
    expect(state.isReadOnlyMode).toBe(true);
    expect(state.trialDaysRemaining).toBe(0);
    expect(getTrialStatusLabel(state)).toBe(READ_ONLY_PRIMARY);
  });

  it('trial ends today shows zero days remaining', () => {
    const start = NOW - TRIAL_LENGTH_DAYS * DAY + 60_000;
    expect(getTrialDaysRemaining(start, NOW)).toBe(0);
    expect(isTrialActive(start, NOW)).toBe(true);
  });

  it('blocks full access while trial is unresolved', () => {
    const state = resolveEntitlements({
      isAuthenticated: true,
      paidPro: false,
      proSource: null,
      trialStartMs: NOW - 2 * DAY,
      trialResolved: false,
      nowMs: NOW,
    });
    expect(state.hasFullAccess).toBe(false);
    expect(state.isReadOnlyMode).toBe(true);
  });

  it('read-only when authenticated, resolved, and no trial record', () => {
    const state = resolveEntitlements({
      isAuthenticated: true,
      paidPro: false,
      proSource: null,
      trialStartMs: null,
      trialResolved: true,
      nowMs: NOW,
    });
    expect(state.isReadOnlyMode).toBe(true);
    expect(state.hasFullAccess).toBe(false);
  });

  it('paidPro overrides expired trial', () => {
    const state = resolveEntitlements({
      isAuthenticated: true,
      paidPro: true,
      proSource: 'android',
      trialStartMs: NOW - 40 * DAY,
      trialResolved: true,
      nowMs: NOW,
    });
    expect(state.phase).toBe('paidPro');
    expect(state.hasFullAccess).toBe(true);
    expect(isTrialExpired(NOW - 40 * DAY, false, true, NOW)).toBe(true);
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
