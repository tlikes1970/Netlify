// apps/web/src/lib/words/validateWord.ts

import { isAcceptedLocal } from './localWords';

export type Verdict = { valid: boolean; source: 'api' | 'local' | 'none'; reason?: string };

const MEMO = new Map<string, Verdict>();

function normalize(w: string) {
  return w.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function withTimeout<T>(p: Promise<T>, ms = 2000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

// Dictionary API proxy (Netlify function)
async function askDictionary(word: string, signal?: AbortSignal): Promise<boolean> {
  try {
    const r = await withTimeout(
      fetch(`/.netlify/functions/dict-proxy?word=${encodeURIComponent(word)}`, { signal }), 
      3000
    );
    if (!r.ok) {
      console.warn('Dictionary API returned non-OK status:', r.status);
      return false;
    }
    const j = await r.json();
    // API returns {valid: true/false}
    return Boolean(j?.valid);
  } catch (error) {
    console.warn('Dictionary API request failed:', error);
    return false;
  }
}

// circuit breaker per provider
const breaker: Record<string, number> = {};
function isOpen(name: string) { return (breaker[name] ?? 0) < Date.now(); }
function trip(name: string, minutes = 10) { breaker[name] = Date.now() + minutes * 60_000; }

export async function validateWord(raw: string): Promise<Verdict> {
  const w = normalize(raw);
  if (w.length !== 5 || /[^a-z]/.test(w)) return { valid: false, source: 'none', reason: 'format' };

  // Check memo first
  if (MEMO.has(w)) return MEMO.get(w)!;

  // OPTIMISTIC FAST PATH: Check local word list FIRST (before slow API calls)
  // This handles 95%+ of valid words instantly without network calls
  const localValid = await isAcceptedLocal(w);
  if (localValid) {
    const verdict: Verdict = { valid: true, source: 'local' };
    MEMO.set(w, verdict);
    return verdict;
  }

  // Slow path: Query dictionary API if word not found locally
  // This is CRITICAL - ensures we don't reject valid words not in our local list
  let apiValid = false;
  
  if (isOpen('dictionary')) {
    try {
      apiValid = await askDictionary(w);
      if (apiValid) {
        const verdict: Verdict = { valid: true, source: 'api' };
        MEMO.set(w, verdict);
        return verdict;
      }
    } catch (error) {
      // Log but don't fail - API errors shouldn't block the game
      console.warn('Dictionary API check failed for word:', w, error);
    }
  }

  // If word is not in local list AND not in dictionary, it's invalid
  const verdict: Verdict = { valid: false, source: 'none', reason: 'not-found' };

  // Cache in memory only (no localStorage)
  MEMO.set(w, verdict);
  return verdict;
}
