import { describe, expect, it, vi } from 'vitest';
import { typoSearch } from '../typoSearch';
import type { SearchResultWithPagination } from '../api';

const result = (titles: string[], mediaType: 'tv' | 'movie' | 'person' = 'tv'): SearchResultWithPagination => ({
  items: titles.map(title => ({ id: 1, title, mediaType })), page: 1, totalPages: 1,
});

describe('typo-tolerant search orchestration', () => {
  it.each(['Braking Bad', 'Breakng Bad', 'Breaikng Bad', 'Breakingg Bad', 'BreakingBad', 'Breaking-Bad', 'Breeking Bad'])('recovers %s from provider candidates', async query => {
    const run = vi.fn(async (term: string) => result(term === query ? [] : ['Breaking Bad']));
    expect(await typoSearch(query, 1, run)).toMatchObject({ correctedQuery: 'Breaking Bad', items: [{ title: 'Breaking Bad' }] });
  });
  it.each(['Breaking Bad', 'Q', 'Rare: 2049'])('preserves useful exact query %s without probes', async query => {
    const run = vi.fn(async () => result([query]));
    expect(await typoSearch(query, 1, run)).not.toHaveProperty('correctedQuery');
    expect(run).toHaveBeenCalledTimes(1);
  });
  it.each(['tv', 'movie', 'person'] as const)('uses the supplied %s pipeline for every request', async mode => {
    const target = mode === 'person' ? 'Bryan Cranston' : 'Breaking Bad';
    const query = mode === 'person' ? 'Bryan Cranstn' : 'Braking Bad';
    const run = vi.fn(async (term: string) => result(term === query ? [] : [target], mode));
    expect((await typoSearch(query, 1, run)).items[0].mediaType).toBe(mode);
  });
  it('rejects unrelated and similarly plausible candidates', async () => {
    expect(await typoSearch('Braking Bad', 1, async term => result(term === 'Braking Bad' ? [] : ['Breaking Bad', 'Braking Bed']))).not.toHaveProperty('correctedQuery');
    expect(await typoSearch('Unrelated Query', 1, async () => result(['Breaking Bad']))).not.toHaveProperty('correctedQuery');
  });
  it('does not change numbered identity', async () => {
    expect(await typoSearch('Blad Runner 2049', 1, async () => result(['Blade Runner 2048']))).not.toHaveProperty('correctedQuery');
  });
  it('propagates API failures rather than inventing matches', async () => {
    await expect(typoSearch('Braking Bad', 1, async () => { throw new Error('offline'); })).rejects.toThrow('offline');
  });
  it('does not probe pagination or ambiguous short queries', async () => {
    const run = vi.fn(async () => result([]));
    await typoSearch('Bad', 1, run);
    await typoSearch('Braking Bad', 2, run);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
