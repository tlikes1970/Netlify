// apps/web/src/search/smartSearch.ts
// Lightweight TMDB orchestrator: search tv+movie, select anchor, pull similar+recommendations,
// blend with plain results, then re-rank to avoid false matches like "nation(s)" for "z-nation".

import type { MediaItem } from '../components/cards/card.types';
import type { SearchResult } from './api';
// Reuse your existing mapper. If your path differs, adjust the import.
import { mapTMDBToMediaItem } from './api';

type SearchType = 'all' | 'movies-tv' | 'people';

function qs(params: Record<string, any>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  return p.toString();
}

async function fetchTMDB(path: string, params: Record<string, any>, signal?: AbortSignal) {
  const url = `/.netlify/functions/tmdb-proxy?${qs({ path, ...params })}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

function normalizeQuery(q: string): string {
  return q
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[''']/g, "'").replace(/["""]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(s: string): string[] {
  return normalizeQuery(s).toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
}
function jaccard(a: Set<string>, b: Set<string>) {
  const i = new Set([...a].filter(x => b.has(x))).size;
  const u = new Set([...a, ...b]).size || 1;
  return i / u;
}

function titleScore(query: string, title: string): number {
  const q = normalizeQuery(query).toLowerCase();
  const t = normalizeQuery(title).toLowerCase();

  if (t === q) return 1.0;
  if (t.includes(q)) return 0.85;
  if (q.includes(t)) return 0.8;

  const qTokens = new Set(tokenize(q));
  const tTokens = new Set(tokenize(t));
  let score = jaccard(qTokens, tTokens);

  // Penalize 'nation(s)' false-positives specifically for "z-nation" style queries.
  if (/^z[-\s]?nation$/i.test(q) && /nation/.test(t) && !/zombie|undead|apocalypse|infect|virus|outbreak|plague/i.test(t)) {
    score *= 0.5;
  }
  return score;
}

const TV_GENRES_HINT = new Set([27, 10765, 10759]); // Horror, Sci-Fi&Fantasy, Action&Adventure
const MOVIE_GENRES_HINT = new Set([27, 878, 28]);   // Horror, Sci-Fi, Action
function genreScore(item: any): number {
  const ids: number[] = item.genre_ids || [];
  if (item.mediaType === 'tv')    return ids.some(id => TV_GENRES_HINT.has(id)) ? 0.25 : 0;
  if (item.mediaType === 'movie') return ids.some(id => MOVIE_GENRES_HINT.has(id)) ? 0.25 : 0;
  return 0;
}

function overviewHintScore(overview?: string): number {
  if (!overview) return 0;
  const o = overview.toLowerCase();
  const hits = ['zombie','undead','apocalypse','virus','outbreak','plague'];
  const n = hits.reduce((acc, h) => acc + (o.includes(h) ? 1 : 0), 0);
  return Math.min(0.25, n * 0.07);
}

function popularityNibble(v?: number) {
  return Math.min(0.25, (v ?? 0) / 40);
}

function rank(query: string, item: MediaItem): number {
  const t = titleScore(query, item.title || '');
  const g = genreScore(item);
  const o = overviewHintScore(item.synopsis);
  const p = popularityNibble(item.voteAverage);
  // 70% title, small additive boosts from genre/overview/popularity
  return t * 0.7 + g + o + p;
}

function dedupe(items: MediaItem[]) {
  const seen = new Set<string>();
  const out: MediaItem[] = [];
  for (const it of items) {
    const key = `${it.mediaType}:${it.id}`;
    if (!seen.has(key)) { seen.add(key); out.push(it); }
  }
  return out;
}

export async function smartSearch(
  queryRaw: string,
  page = 1,
  searchType: SearchType = 'all',
  opts?: { signal?: AbortSignal; language?: string; region?: string }
): Promise<SearchResult[]> {
  const language = opts?.language ?? 'en-US';
  const region   = opts?.region ?? 'US';
  const query    = normalizeQuery(queryRaw);

  // People-only: keep existing flow simple
  if (searchType === 'people') {
    const json = await fetchTMDB('search/person', { query, page, include_adult: false, language, region }, opts?.signal);
    return (json.results ?? []).map(mapTMDBToMediaItem).filter(Boolean) as SearchResult[];
  }

  // 1) TV + Movie search (first page) to find an anchor
  const [tvRes, movieRes] = await Promise.all([
    fetchTMDB('search/tv',    { query, page: 1, include_adult: false, language, region }, opts?.signal),
    fetchTMDB('search/movie', { query, page: 1, include_adult: false, language, region }, opts?.signal),
  ]);
  const tv = (tvRes.results ?? []).map(mapTMDBToMediaItem).filter(Boolean) as MediaItem[];
  const mv = (movieRes.results ?? []).map(mapTMDBToMediaItem).filter(Boolean) as MediaItem[];
  const base = [...tv, ...mv];

  // 2) Anchor selection: strong title match
  const withScores = base.map(c => ({ c, s: titleScore(query, c.title || '') }))
                         .sort((a, b) => b.s - a.s);
  const anchor = withScores.length && withScores[0].s >= 0.8 ? withScores[0].c : null;

  // 3) Pull similar + recommendations for the anchor
  let anchorExtras: MediaItem[] = [];
  if (anchor && (anchor.mediaType === 'tv' || anchor.mediaType === 'movie')) {
    try {
      const [sim, rec] = await Promise.all([
        fetchTMDB(`${anchor.mediaType}/${anchor.id}/similar`, { page: 1, language }, opts?.signal),
        fetchTMDB(`${anchor.mediaType}/${anchor.id}/recommendations`, { page: 1, language }, opts?.signal),
      ]);
      const a = (sim.results ?? []).map(mapTMDBToMediaItem).filter(Boolean) as MediaItem[];
      const b = (rec.results ?? []).map(mapTMDBToMediaItem).filter(Boolean) as MediaItem[];
      anchorExtras = dedupe([...a, ...b]);
    } catch { /* extras are optional */ }
  }

  // 4) Plain multi results for breadth on requested page
  const plain = await fetchTMDB('search/multi', {
    query, page, include_adult: false, language, region
  }, opts?.signal).then(j => (j.results ?? [])
    .map(mapTMDBToMediaItem)
    .filter(Boolean)) as MediaItem[];

  // 5) Combine, dedupe, rank
  const combined = dedupe([...(anchor ? [anchor] : []), ...anchorExtras, ...base, ...plain]);
  const ranked = combined
    .map(item => ({ item, score: rank(query, item) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.item);

  // Respect movies-tv filter if needed
  if (searchType === 'movies-tv') {
    return ranked.filter(r => r.mediaType === 'tv' || r.mediaType === 'movie');
  }
  return ranked;
}
