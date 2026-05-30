import { describe, it, expect } from 'vitest';
import {
  parseAirDateIso,
  getNextAirDate,
  getValidatedNextAirDate,
} from '@/lib/constants/metadata';
import { isoDaysFromToday } from './testHelpers/libraryEntries';

describe('parseAirDateIso', () => {
  it('parses YYYY-MM-DD as UTC midnight without day shift', () => {
    const parsed = parseAirDateIso('2026-03-15');
    expect(parsed).not.toBeNull();
    expect(parsed!.getUTCFullYear()).toBe(2026);
    expect(parsed!.getUTCMonth()).toBe(2);
    expect(parsed!.getUTCDate()).toBe(15);
  });

  it('returns null for invalid strings', () => {
    expect(parseAirDateIso('not-a-date')).toBeNull();
    expect(parseAirDateIso('')).toBeNull();
  });
});

describe('getNextAirDate', () => {
  it('reads nextAirDate from library entries', () => {
    const iso = isoDaysFromToday(10);
    const date = getNextAirDate({ nextAirDate: iso });
    expect(date).not.toBeNull();
    expect(date!.getUTCDate()).toBe(
      parseAirDateIso(iso)!.getUTCDate()
    );
  });

  it('falls back to next_episode_to_air.air_date', () => {
    const iso = isoDaysFromToday(5);
    const date = getNextAirDate({
      next_episode_to_air: { air_date: iso },
    });
    expect(date).not.toBeNull();
  });
});

describe('getValidatedNextAirDate', () => {
  it('rejects past dates', () => {
    const past = parseAirDateIso(isoDaysFromToday(-3));
    expect(getValidatedNextAirDate(past)).toBeNull();
  });

  it('accepts near-future dates', () => {
    const future = parseAirDateIso(isoDaysFromToday(14));
    expect(getValidatedNextAirDate(future)).not.toBeNull();
  });

  it('rejects dates more than 365 days out', () => {
    const far = parseAirDateIso(isoDaysFromToday(400));
    expect(getValidatedNextAirDate(far)).toBeNull();
  });
});
