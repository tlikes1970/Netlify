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

const ARTICLES = new Set(['the','a','an']);

export type SearchFeatures = {
  title: string;
  originalTitle?: string;
  aliases?: string[];
  overview?: string;
  popularity?: number;       // TMDB popularity
  voteAverage?: number;      // 0..10
  voteCount?: number;
  releaseYear?: number | null;
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
  const q = normalize(query);
  const title = normalize(features.title);
  const orig = normalize(features.originalTitle || '');
  const aliases = (features.aliases || []).map(normalize);
  
  // Parse year from query if present
  const yearMatch = /\b(19|20)\d{2}\b/.exec(query);
  const queryYear = yearMatch ? parseInt(yearMatch[0]) : null;

  // Title matching signals
  const titleSig = titleSignal(q, [title, orig, ...aliases]);
  const titleExact = titleSig.tier === 'exact' ? 1 : 0;
  const titlePrefix = titleSig.tier === 'starts' ? 1 : 0;
  const titleContains = titleSig.tier === 'contains' ? 1 : 0;
  
  // Check AKA exact match
  const akaExact = aliases.some(a => a === q) ? 1 : 0;
  
  // Franchise root detection
  const franchiseRoot = features.collectionName ? 
    (normalize(features.collectionName).includes(q) ? 1 : 0) : 0;

  // Year match bonus
  const yearBonus = (queryYear && features.releaseYear === queryYear) ? 20 : 0;

  // Skip overview BM25 for single-token queries
  const isSingleToken = tokensLower(query).length === 1;
  const bm25 = isSingleToken 
    ? bm25Like(q, [title, orig, ...aliases])
    : bm25Like(q, [title, orig, ...(features.overview ? [normalize(features.overview)] : [])]);

  // Capped popularity bonus: min(10, 10 * log1p(pop_norm * 100))
  const popRaw = features.popularity ?? 0;
  const popNorm = clamp(popRaw / 200, 0, 1);
  const popLog = Math.log1p(popNorm * 100);
  const popularityBonus = Math.min(10 * popLog / 3.0, 10);

  // Recency bonus: small positive if ≤5yrs, soft negative after, capped [-6, +8]
  const now = new Date().getFullYear();
  const age = features.releaseYear ? now - features.releaseYear : 50;
  const recencyBonus = age <= 5 
    ? Math.min(age * 1.6, 8) 
    : Math.max(-6, -(age - 5) * 0.3); // Very gentle negative curve

  // Halve pop/recency when exact or franchise hit
  const reducePopRecency = (titleExact || akaExact || franchiseRoot);
  const finalPopBonus = reducePopRecency ? popularityBonus * 0.5 : popularityBonus;
  const finalRecencyBonus = reducePopRecency ? recencyBonus * 0.5 : recencyBonus;

  const voteAvgNorm = clamp((features.voteAverage ?? 0) / 10, 0, 1);
  const voteCntSig = 1 - Math.exp(-(features.voteCount ?? 0) / 5000);
  const voteSig = voteCntSig * voteAvgNorm;

  const typeMatch = opts.preferType && opts.preferType !== 'all'
    ? (features.mediaType === opts.preferType ? 1 : 0)
    : 0;

  const langHint = langBoost(features.originalLanguage, opts.userLocaleLangs || []);

  // New scoring formula with proper weights
  const score = 100 * titleExact
              + 60 * akaExact
              + 45 * titlePrefix
              + 25 * titleContains
              + 30 * franchiseRoot
              + yearBonus
              + finalPopBonus
              + finalRecencyBonus
              + 5 * voteSig
              + 0.5 * typeMatch
              + 0.5 * langHint
              + 2 * bm25;

  const debug = opts.debugSearch ? {
    titleExact,
    akaExact,
    titlePrefix,
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

function normalize(s: string): string {
  return s.normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();
}

function stripLeadingArticlesTokens(s: string): string[] {
  const t = tokensLower(s);
  while (t.length && ARTICLES.has(t[0])) t.shift();
  return t;
}

function titleTier(qTok: string, field: string) {
  // returns a tier label and numeric strength to help ties later
  const fTokens = tokensLower(field).join(' ');  // lowercase for comparison
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
  const qTok = tokensLower(query).join(' '); // lowercase for comparison
  let bestScore = 0;
  let bestTier: TitleSignal['tier'] = 'overlap';

  for (const f of fields) {
    if (!f) continue;
    const { tier, strength } = titleTier(qTok, f);
    if (strength > bestScore) { bestScore = strength; bestTier = tier; }

    // token overlap is only a weak tail signal
    const jac = jaccard(tokensLower(query), tokensLower(f)) * 0.85;
    if (bestScore < 0.80 && jac > bestScore) { bestScore = jac; bestTier = 'overlap'; }
  }
  return { score: bestScore, tier: bestTier };
}

function bm25Like(query: string, texts: string[]): number {
  const t = texts.join(' ');
  // crude proxy: token overlap weighted by log length
  const tq = tokensLower(query);
  const tt = tokensLower(t);
  const overlap = jaccard(tq, tt);
  const len = Math.max(tt.length, 1);
  const lengthPenalty = Math.log10(Math.min(len, 200) + 10) / 2.3; // ~0.2..1
  return clamp(overlap * lengthPenalty, 0, 1);
}

function tokens(s: string): string[] {
  return s.split(/[^a-z0-9]+/i).filter(Boolean);
}

function tokensLower(s: string): string[] {
  return tokens(s.toLowerCase());
}

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

function recencyBoost(year: number | null): number {
  if (!year) return 0;
  const now = new Date().getFullYear();
  const age = Math.max(0, now - year);
  if (age >= 25) return 0;
  if (age <= 2) return 1;
  return clamp(1 - (age - 2) / 23, 0, 1); // fades over ~25y
}

function langBoost(orig: string | null | undefined, locales: string[]): number {
  if (!orig || locales.length === 0) return 0;
  const lc = new Set(locales.map(l => l.slice(0,2)));
  return lc.has(orig.slice(0,2)) ? 1 : 0;
}

function isFranchiseQuery(q: string): boolean {
  return tokensLower(q).length === 1;
}

function startsWithBase(itemTitle: string, q: string): boolean {
  const base = stripLeadingArticlesTokens(itemTitle).join(' ');
  const qTok = tokensLower(q).join(' ');
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
    const va = (bMeta.voteAverage ?? 0) - (aMeta.voteAverage ?? 0);
    if (va) return va;
  }

  const t = order.indexOf(aMeta.tier) - order.indexOf(bMeta.tier);
  if (t) return -t; // higher tier first
  const vc = (bMeta.voteCount ?? 0) - (aMeta.voteCount ?? 0);
  if (vc) return vc;
  const va = (bMeta.voteAverage ?? 0) - (aMeta.voteAverage ?? 0);
  if (va) return va;
  return (bMeta.releaseYear ?? 0) - (aMeta.releaseYear ?? 0);
}


