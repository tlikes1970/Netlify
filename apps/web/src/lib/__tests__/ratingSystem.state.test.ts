/**
 * Rating state tests for ratingSystem
 * Verifies getRatingState returns only valid states (no 'zero' state)
 * and normalizeRating clamps correctly to 1-5
 */
import { describe, it, expect } from 'vitest';
import { getRatingState, normalizeRating, RatingState } from '@/lib/ratingSystem';

describe('normalizeRating', () => {
  it('returns null for null input', () => {
    expect(normalizeRating(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeRating(undefined)).toBeNull();
  });

  it('clamps values below 1 to 1', () => {
    expect(normalizeRating(0)).toBe(1);
    expect(normalizeRating(-5)).toBe(1);
    expect(normalizeRating(0.4)).toBe(1);
  });

  it('clamps values above 5 to 5', () => {
    expect(normalizeRating(6)).toBe(5);
    expect(normalizeRating(100)).toBe(5);
    expect(normalizeRating(5.6)).toBe(5);
  });

  it('rounds to nearest integer within range', () => {
    expect(normalizeRating(2.4)).toBe(2);
    expect(normalizeRating(2.5)).toBe(3);
    expect(normalizeRating(3.7)).toBe(4);
  });

  it('returns valid integers for valid inputs', () => {
    expect(normalizeRating(1)).toBe(1);
    expect(normalizeRating(2)).toBe(2);
    expect(normalizeRating(3)).toBe(3);
    expect(normalizeRating(4)).toBe(4);
    expect(normalizeRating(5)).toBe(5);
  });
});

describe('getRatingState', () => {
  // Valid states that should be returned
  const validStates: RatingState[] = ['null', 'unchanged', 'changed'];

  it('returns "null" when new rating is null', () => {
    expect(getRatingState(3, null)).toBe('null');
    expect(getRatingState(null, null)).toBe('null');
    expect(getRatingState(5, undefined)).toBe('null');
  });

  it('returns "unchanged" when old and new ratings normalize to same value', () => {
    expect(getRatingState(3, 3)).toBe('unchanged');
    expect(getRatingState(2.4, 2.4)).toBe('unchanged');
    expect(getRatingState(2.4, 2)).toBe('unchanged'); // Both normalize to 2
    expect(getRatingState(null, 1)).not.toBe('unchanged'); // null -> 1 is a change
  });

  it('returns "changed" when ratings differ after normalization', () => {
    expect(getRatingState(1, 5)).toBe('changed');
    expect(getRatingState(null, 3)).toBe('changed');
    expect(getRatingState(2, 4)).toBe('changed');
    expect(getRatingState(undefined, 2)).toBe('changed');
  });

  it('never returns "zero" for any input (dead state removed)', () => {
    // Test a wide range of inputs to confirm 'zero' is never returned
    const testCases: [number | null | undefined, number | null | undefined][] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [-1, -1],
      [null, 0],
      [0, null],
      [undefined, 0],
      [0, undefined],
      [0.1, 0.1],
      [0.5, 0.5],
    ];

    for (const [oldRating, newRating] of testCases) {
      const state = getRatingState(oldRating, newRating);
      expect(validStates).toContain(state);
      expect(state).not.toBe('zero');
    }
  });

  it('returns only valid RatingState values for representative inputs', () => {
    const representativeInputs: [number | null | undefined, number | null | undefined][] = [
      [1, 1],
      [2, 3],
      [4, 5],
      [null, 3],
      [3, null],
      [undefined, 4],
      [5, undefined],
    ];

    for (const [oldRating, newRating] of representativeInputs) {
      const state = getRatingState(oldRating, newRating);
      expect(validStates).toContain(state);
    }
  });
});


