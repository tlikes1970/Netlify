import { describe, it, expect } from 'vitest';
import {
  getAllContexts,
  getLinesForContext,
  PERSONALITY_PHASE2_STATS,
  personalityTierFromLevel,
  type PersonalityTier,
} from '../../data/flickletPersonalityPhase2';

const TIERS: PersonalityTier[] = ['Minimal', 'Standard', 'Maximum'];

describe('flickletPersonalityPhase2 import', () => {
  it('imports expected line counts from approved CSV', () => {
    expect(PERSONALITY_PHASE2_STATS.totalLines).toBe(959);
    expect(PERSONALITY_PHASE2_STATS.contexts).toBe(22);
    expect(PERSONALITY_PHASE2_STATS.byTier).toEqual({
      Minimal: 330,
      Standard: 306,
      Maximum: 323,
    });
  });

  it('maps personality levels to strict tiers', () => {
    expect(personalityTierFromLevel(1)).toBe('Minimal');
    expect(personalityTierFromLevel(2)).toBe('Standard');
    expect(personalityTierFromLevel(3)).toBe('Maximum');
  });
});

describe('tier isolation', () => {
  for (const context of getAllContexts()) {
    it(`keeps tiers isolated for ${context}`, () => {
      const idsByTier = Object.fromEntries(
        TIERS.map((tier) => [tier, getLinesForContext(context, tier).map((l) => l.id)])
      ) as Record<PersonalityTier, string[]>;

      for (const tier of TIERS) {
        expect(idsByTier[tier].length).toBeGreaterThan(0);
        for (const id of idsByTier[tier]) {
          for (const other of TIERS) {
            if (other === tier) continue;
            expect(idsByTier[other]).not.toContain(id);
          }
        }
      }
    });
  }
});
