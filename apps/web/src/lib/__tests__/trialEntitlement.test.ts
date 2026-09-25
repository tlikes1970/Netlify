import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TRIAL_STORAGE_KEY, TRIAL_RECORD_VERSION } from '../entitlements';

const mockGetDoc = vi.fn();
const mockRunTransaction = vi.fn();
const mockTransactionGet = vi.fn();
const mockTransactionSet = vi.fn();

vi.mock('../firebaseBootstrap', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ path: 'users/test-user/entitlements/trial' })),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
  serverTimestamp: () => ({ __type: 'serverTimestamp' }),
}));

import {
  fetchServerTrialStartMs,
  readTrialStartMs,
  resolveServerTrialStartMs,
} from '../trialEntitlement';

describe('trialEntitlement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockRunTransaction.mockImplementation(async (_db, fn) => {
      const transaction = {
        get: mockTransactionGet,
        set: mockTransactionSet,
      };
      return fn(transaction);
    });
  });

  it('readTrialStartMs parses valid data', () => {
    expect(readTrialStartMs({ trialStartMs: 12345, version: 2 })).toBe(12345);
    expect(readTrialStartMs({ version: 2 })).toBeNull();
  });

  it('fetchServerTrialStartMs returns existing server value', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ trialStartMs: 1000, version: 2 }),
    });

    await expect(fetchServerTrialStartMs('user-a')).resolves.toBe(1000);
  });

  it('resolveServerTrialStartMs reuses existing server trial', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ trialStartMs: 5000, version: 2 }),
    });

    const start = await resolveServerTrialStartMs('user-a');
    expect(start).toBe(5000);
    expect(mockRunTransaction).not.toHaveBeenCalled();

    const cached = JSON.parse(localStorage.getItem(TRIAL_STORAGE_KEY) ?? '{}');
    expect(cached).toEqual({
      userId: 'user-a',
      startMs: 5000,
      version: TRIAL_RECORD_VERSION,
    });
  });

  it('resolveServerTrialStartMs migrates local trial when server missing', async () => {
    localStorage.setItem(
      TRIAL_STORAGE_KEY,
      JSON.stringify({ userId: 'user-b', startMs: 9000, version: 2 })
    );

    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    });
    mockTransactionGet.mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    });

    const start = await resolveServerTrialStartMs('user-b');
    expect(start).toBe(9000);
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ trialStartMs: 9000, version: TRIAL_RECORD_VERSION })
    );
  });

  it('resolveServerTrialStartMs uses server winner when transaction finds existing doc', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    });
    mockTransactionGet.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ trialStartMs: 7777, version: 2 }),
    });

    const start = await resolveServerTrialStartMs('user-c');
    expect(start).toBe(7777);
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('server trial wins over differing local cache', async () => {
    localStorage.setItem(
      TRIAL_STORAGE_KEY,
      JSON.stringify({ userId: 'user-d', startMs: 1111, version: 2 })
    );

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ trialStartMs: 2222, version: 2 }),
    });

    const start = await resolveServerTrialStartMs('user-d');
    expect(start).toBe(2222);

    const cached = JSON.parse(localStorage.getItem(TRIAL_STORAGE_KEY) ?? '{}');
    expect(cached.startMs).toBe(2222);
  });
});
