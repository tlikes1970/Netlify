/**
 * Search ranking utilities
 * Purpose: Computes relevance scores for search results using BM25-like signals
 * Data Source: MediaItem fields from TMDB responses
 * Update Path: Adjust coefficients in computeScore function
 * Dependencies: Used by smartSearch and api.ts
 * 
 * Test Assertions:
 * - "predator" → Predator (1987) should rank in top 3
 * - "predator 1987" → Predator (1987) should rank #1 (year bonus +20)
 * - Exact title matches beat purely popular but non-exact matches
 * - Franchise roots (earliest year) preferred over sequels in tie-breaking
 */

import { normalizeTitle, tokensLower as tokensLowerUtil } from '../lib/string';

const ARTICLES = new Set(['the','a','an']);

// Score constants for search ranking
export const SCORE = {
  EXACT: 100,
  AKA_EXACT: 60,
  LEADING: 70,
  STARTS: 45,
  WORD: 30,
  CONTAINS: 25,
  FRANCHISE_ROOT: 30,
  YEAR_MATCH: 20,
  POPULARITY_MAX: 10,
  RECENCY_MAX: 8,
  RECENCY_MIN: -6,
  VOTE_SIG_EXACT: 10,
  VOTE_SIG_NON_EXACT: 5,
  TYPE_MATCH: 0.5,
  LANG_HINT: 0.5,
  BM25: 2
} as const;

export type SearchFeatures = {
  title: string;
  originalTitle?: string;
  aliases?: string[];
  overview?: string;
  popularity?: number;       // TMDB popularity
  voteAverage?: number;      // 0..10
  voteCount?: number;
  releaseYear?: number | null;
  releaseDate?: string | null; // ISO date string for more precise recency calculation
  mediaType: 'movie' | 'tv' | 'person';
  originalLanguage?: string | null;
  collectionName?: string;   // TMDB collection name if part of a franchise
};

export type TitleSignal = { score: number; tier: 'exact'|'leading'|'starts'|'word'|'contains'|'overlap' };

export function computeSearchScore(
  query: string, 
  features: SearchFeatures, 
  opts: {
    preferType?: 'movie' | 'tv' | 'person' | 'all',
    userLocaleLangs?: string[],
    debugSearch?: boolean
  } = {}
): { score: number; titleSig: TitleSignal; debug?: Record<string, number> } {
  const q = normalizeTitle(query);
  const title = normalizeTitle(features.title);
  const orig = normalizeTitle(features.originalTitle || '');
  const aliases = (features.aliases || []).map(normalizeTitle);
  
  // Parse year from query if present
  const yearMatch = /\b(19|20)\d{2}\b/.exec(query);
  const queryYear = yearMatch ? parseInt(yearMatch[0]) : null;

  // Title matching signals
  const titleSig = titleSignal(q, [title, orig, ...aliases]);
  const titleExact = titleSig.tier === 'exact' ? 1 : 0;
  const titleLeading = titleSig.tier === 'leading' ? 1 : 0; // "House of Cards" for query "house"
  const titlePrefix = titleSig.tier === 'starts' ? 1 : 0;
  const titleWord = titleSig.tier === 'word' ? 1 : 0; // Contains query as whole word
  const titleContains = titleSig.tier === 'contains' ? 1 : 0;
  
  // Check AKA exact match
  const akaExact = aliases.some(a => a === q) ? 1 : 0;
  
  // Franchise root detection
  const franchiseRoot = features.collectionName ? 
    (normalizeTitle(features.collectionName).includes(q) ? 1 : 0) : 0;

  // Year match bonus
  const yearBonus = (queryYear && features.releaseYear === queryYear) ? SCORE.YEAR_MATCH : 0;

  // Skip overview BM25 for single-token queries
  const isSingleToken = tokensLowerUtil(query).length === 1;
  const bm25 = isSingleToken 
    ? bm25Like(q, [title, orig, ...aliases])
    : bm25Like(q, [title, orig, ...(features.overview ? [normalizeTitle(features.overview)] : [])]);

  // Capped popularity bonus: min(10, 10 * log1p(pop_norm * 100))
  const popRaw = features.popularity ?? 0;
  const popNorm = clamp(popRaw / 200, 0, 1);
  const popLog = Math.log1p(popNorm * 100);
  const popularityBonus = Math.min(10 * popLog / 3.0, 10);

  // Recency bonus: small positive if ≤5yrs, soft negative after, capped [-6, +8]
  // Newer titles get higher bonus inside the window.
  let age: number;
  if (features.releaseDate) {
    const ageDays = (Date.now() - new Date(features.releaseDate).getTime()) / 864e5;
    age = ageDays / 365.25;
  } else if (features.releaseYear) {
    const now = new Date().getFullYear();
    age = now - features.releaseYear;
  } else {
    age = 50;
  }

  let recencyBonus: number;
  if (!features.releaseYear && !features.releaseDate) {
    // Unknown date → stay neutral
    recencyBonus = 0;
  } else if (age <= 5) {
    // age = 0 → ~SCORE.RECENCY_MAX
    // age = 5 → ~0
    recencyBonus = SCORE.RECENCY_MAX - (SCORE.RECENCY_MAX / 5) * age;
  } else {
    // Soft negative after 5 years
    const extra = age - 5;
    recencyBonus = Math.max(
      SCORE.RECENCY_MIN,
      -extra * 0.3
    );
  }

  // Test patch: don't halve bonuses for exact matches
  const finalPopBonus = popularityBonus;
  const finalRecencyBonus = recencyBonus;

  const voteAvgNorm = clamp((features.voteAverage ?? 0) / 10, 0, 1);
  const voteCntSig = 1 - Math.exp(-(features.voteCount ?? 0) / 5000);
  const voteSig = voteCntSig * voteAvgNorm;

  const typeMatch = opts.preferType && opts.preferType !== 'all'
    ? (features.mediaType === opts.preferType ? 1 : 0)
    : 0;

  const langHint = langBoost(features.originalLanguage, opts.userLocaleLangs || []);

  // For exact matches, increase vote signal weight to better differentiate popular items
  // This ensures popular shows/movies rank higher than obscure ones with same title
  const voteSigWeight = (titleExact || akaExact) ? SCORE.VOTE_SIG_EXACT : SCORE.VOTE_SIG_NON_EXACT;

  // New scoring formula with proper weights using SCORE constants
  // Leading tier (e.g., "House of Cards" for "house") should rank high, between exact and starts
  const score = SCORE.EXACT * titleExact
              + SCORE.AKA_EXACT * akaExact
              + SCORE.LEADING * titleLeading  // Higher than starts since it's a better match
              + SCORE.STARTS * titlePrefix
              + SCORE.WORD * titleWord  // Contains query as whole word (better than partial contains)
              + SCORE.CONTAINS * titleContains
              + SCORE.FRANCHISE_ROOT * franchiseRoot
              + yearBonus
              + finalPopBonus
              + finalRecencyBonus
              + voteSigWeight * voteSig
              + SCORE.TYPE_MATCH * typeMatch
              + SCORE.LANG_HINT * langHint
              + SCORE.BM25 * bm25;

  const debug = opts.debugSearch ? {
    titleExact,
    titleLeading,
    akaExact,
    titlePrefix,
    titleWord,
    titleContains,
    franchiseRoot,
    yearMatch: yearBonus,
    popBonus: finalPopBonus,
    recencyBonus: finalRecencyBonus,
    voteSig,
    bm25,
    total: score
  } : undefined;

  return {
    score,
    titleSig,
    debug
  };
}

// normalize is now normalizeTitle from '../lib/string'

function stripLeadingArticlesTokens(s: string): string[] {
  const t = tokensLowerUtil(s);
  while (t.length && ARTICLES.has(t[0])) t.shift();
  return t;
}

function titleTier(qTok: string, field: string) {
  // returns a tier label and numeric strength to help ties later
  const fTokens = tokensLowerUtil(field).join(' ');  // lowercase for comparison
  const fNoArt  = stripLeadingArticlesTokens(field).join(' ');  // already lowercased

  // Special case: if fTokens (with article) = qTok exactly, it's exact
  // if fNoArt (without article) = qTok, it's leading (not exact)
  if (fTokens === qTok) return { tier: 'exact' as const, strength: 1.0 };
  if (fNoArt === qTok) return { tier: 'leading' as const, strength: 0.98 };
  if (fNoArt.startsWith(qTok + ' '))       return { tier: 'leading' as const,   strength: 0.98 };
  if (new RegExp(`^${escapeReg(qTok)}\\b`).test(fNoArt))
                                            return { tier: 'starts' as const,    strength: 0.93 };
  if (new RegExp(`\\b${escapeReg(qTok)}\\b`).test(fTokens))
                                            return { tier: 'word' as const,      strength: 0.90 };
  if (fTokens.includes(qTok))              return { tier: 'contains' as const,  strength: 0.78 };
  return { tier: 'overlap' as const, strength: 0 }; // will get jaccard later
}

export function titleSignal(query: string, fields: string[]): TitleSignal {
  const qTok = tokensLowerUtil(query).join(' '); // lowercase for comparison
  let bestScore = 0;
  let bestTier: TitleSignal['tier'] = 'overlap';

  for (const f of fields) {
    if (!f) continue;
    const { tier, strength } = titleTier(qTok, f);
    if (strength > bestScore) { bestScore = strength; bestTier = tier; }

    // token overlap is only a weak tail signal
    const jac = jaccard(tokensLowerUtil(query), tokensLowerUtil(f)) * 0.85;
    if (bestScore < 0.80 && jac > bestScore) { bestScore = jac; bestTier = 'overlap'; }
  }
  return { score: bestScore, tier: bestTier };
}

function bm25Like(query: string, texts: string[]): number {
  const t = texts.join(' ');
  // crude proxy: token overlap weighted by log length
  const tq = tokensLowerUtil(query);
  const tt = tokensLowerUtil(t);
  const overlap = jaccard(tq, tt);
  const len = Math.max(tt.length, 1);
  const lengthPenalty = Math.log10(Math.min(len, 200) + 10) / 2.3; // ~0.2..1
  return clamp(overlap * lengthPenalty, 0, 1);
}

// Export tokensLower for backward compatibility (re-export from lib/string)
export { tokensLowerUtil as tokensLower };

function jaccard(a: string[] | Set<string>, b: string[] | Set<string>): number {
  const A = a instanceof Set ? a : new Set(a);
  const B = b instanceof Set ? b : new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return A.size + B.size === 0 ? 0 : inter / (A.size + B.size - inter);
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function langBoost(orig: string | null | undefined, locales: string[]): number {
  if (!orig || locales.length === 0) return 0;
  const lc = new Set(locales.map(l => l.slice(0,2)));
  return lc.has(orig.slice(0,2)) ? 1 : 0;
}

function isFranchiseQuery(q: string): boolean {
  return tokensLowerUtil(q).length === 1;
}

function startsWithBase(itemTitle: string, q: string): boolean {
  const base = stripLeadingArticlesTokens(itemTitle).join(' ');
  const qTok = tokensLowerUtil(q).join(' ');
  return base === qTok || base.startsWith(qTok + ' ');
}

export function tieBreak(
  aMeta: { tier: string; voteCount?: number; voteAverage?: number; releaseYear?: number; title?: string },
  bMeta: { tier: string; voteCount?: number; voteAverage?: number; releaseYear?: number; title?: string },
  query: string
): number {
  const order = ['exact','leading','starts','word','contains','overlap'];

  const franchiseMode = isFranchiseQuery(query)
    && aMeta.title && bMeta.title
    && startsWithBase(aMeta.title, query)
    && startsWithBase(bMeta.title, query);

  if (franchiseMode) {
    // Franchise head strategy: prefer the ORIGINAL/earliest title
    // Not the most popular or highest rated
    const yearDiff = (aMeta.releaseYear ?? 9999) - (bMeta.releaseYear ?? 9999);
    if (yearDiff !== 0) return yearDiff; // Earliest year wins
    
    // Only as tie-breaker if same year: prefer more votes
    const vc = (bMeta.voteCount ?? 0) - (aMeta.voteCount ?? 0);
    if (vc) return vc;
    
    // Final tie-breaker: preference order
    const va = (aMeta.voteAverage ?? 0) - (bMeta.voteAverage ?? 0);
    if (va) return va;
  }

  const t = order.indexOf(aMeta.tier) - order.indexOf(bMeta.tier);
  if (t) return -t; // higher tier first
  
  // Standard tie-breaking: prefer more votes, then higher rating, then newer year
  const vc = (bMeta.voteCount ?? 0) - (aMeta.voteCount ?? 0);
  if (vc) return vc;
  const va = (bMeta.voteAverage ?? 0) - (aMeta.voteAverage ?? 0);
  if (va) return va;
  return (bMeta.releaseYear ?? 0) - (aMeta.releaseYear ?? 0);
}


