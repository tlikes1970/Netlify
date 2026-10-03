import type { SearchResultWithPagination } from './api';
import { generateQueryVariations, levenshteinDistance, normalizeQuery, tokensLower } from '../lib/string';

type RunSearch = (query: string, page: number) => Promise<SearchResultWithPagination>;
const identity = (value: string) => tokensLower(normalizeQuery(value)).join(' ');

/** Only candidates supplied by the search provider can establish a correction. */
export async function typoSearch(query: string, page: number, run: RunSearch) {
  const normal = await run(query, page);
  const q = identity(query);
  if (page !== 1 || q.length < 6 || q.length > 100 || normal.items.some(item => identity(item.title).includes(q))) {
    return normal;
  }
  const words = q.split(' ');
  const probes = new Set(generateQueryVariations(query).slice(1));
  // An intact word retrieves candidates without generating thousands of spellings.
  if (words.length > 1) words.filter(word => word.length >= 3 && !/^\d+$/.test(word)).slice(0, 3).forEach(word => probes.add(word));
  else if (q.length >= 8) probes.add(q.slice(0, 4));
  const responses = await Promise.all([...probes].slice(0, 4).map(probe => run(probe, 1)));
  const candidates = new Map<string, { title: string; distance: number }>();
  for (const item of [...normal.items, ...responses.flatMap(result => result.items)]) {
    const name = identity(item.title);
    const distance = levenshteinDistance(q.replace(/ /g, ''), name.replace(/ /g, ''));
    const allowed = q.length >= 10 ? 2 : 1;
    // Numeric identity must never be corrected into another numbered title.
    if (distance > allowed || (q.match(/\d+/g) || []).join() !== (name.match(/\d+/g) || []).join()) continue;
    candidates.set(name, { title: item.title, distance });
  }
  const ranked = [...candidates.values()].sort((a, b) => a.distance - b.distance);
  if (!ranked.length || (ranked[1] && ranked[1].distance <= ranked[0].distance + 1)) return normal;
  const correctedQuery = ranked[0].title;
  if (normalizeQuery(correctedQuery).toLowerCase() === normalizeQuery(query).toLowerCase()) return normal;
  const corrected = await run(correctedQuery, 1);
  if (!corrected.items.some(item => identity(item.title) === identity(correctedQuery))) return normal;
  return { ...corrected, correctedQuery };
}
