import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../lib/storage', () => ({ Library: { getEntry: () => null } }));
import { smartSearch } from '../smartSearch';
import { searchMulti } from '../api';
import { typoSearch } from '../typoSearch';

afterEach(() => vi.unstubAllGlobals());
it.each(['all', 'movies-tv', 'people'] as const)('runs the real %s provider mapping and fallback', async mode => {
  const query = mode === 'people' ? 'Bryan Cranstn' : 'Breakng Bad';
  const title = mode === 'people' ? 'Bryan Cranston' : 'Breaking Bad';
  const fetchMock = vi.fn(async (url: string) => {
    const params = new URL(url, 'https://example.test').searchParams;
    const term = params.get('query');
    const results = term === query || !term ? [] : mode === 'people'
      ? [{id: 7, name: title, known_for: []}]
      : [{id: 7, name: title, first_air_date: '2008-01-20', media_type: 'tv'}];
    return {ok: true, json: async () => ({results, total_pages: 1})};
  });
  vi.stubGlobal('fetch', fetchMock);
  const run = (term: string, page: number) => mode === 'people'
    ? searchMulti(term, page, null, mode)
    : smartSearch(term, page, mode);
  const response = await typoSearch(query, 1, run);
  expect(response).toMatchObject({correctedQuery: title, items: [{id:7, title, mediaType: mode === 'people' ? 'person' : 'tv'}]});
  expect(fetchMock.mock.calls.some(([url]) => new URL(url, 'https://example.test').searchParams.get('query') === title)).toBe(true);
});
