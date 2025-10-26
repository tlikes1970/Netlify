import { searchMulti, type SearchResultWithPagination } from './api';

const CACHE = new Map<string, { t: number; v: SearchResultWithPagination }>();
const TTL = 5 * 60 * 1000; // 5 minutes

export async function cachedSearchMulti(...args: Parameters<typeof searchMulti>): Promise<SearchResultWithPagination> {
  const [q, page, genre, type] = args;
  const key = [q, page, genre ?? '', type].join('|');
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.v;
  const v = await searchMulti(...args);
  CACHE.set(key, { t: Date.now(), v });
  return v;
}
