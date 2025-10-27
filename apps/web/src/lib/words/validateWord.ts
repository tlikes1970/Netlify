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

// serverless proxies (no keys in client)
async function askDictionary(word: string, signal?: AbortSignal): Promise<boolean> {
  const r = await withTimeout(fetch(`/api/dict/entries?word=${encodeURIComponent(word)}`, { signal }), 2000);
  if (!r.ok) return false;
  const j = await r.json();
  // Accept true if array with length or explicit {valid:true}
  return Array.isArray(j) ? j.length > 0 : Boolean(j?.valid);
}
async function askWordnik(word: string, signal?: AbortSignal): Promise<boolean> {
  const r = await withTimeout(fetch(`/api/wordnik/definitions?word=${encodeURIComponent(word)}`, { signal }), 2000);
  if (!r.ok) return false;
  const j = await r.json();
  return Array.isArray(j) ? j.length > 0 : Boolean(j?.valid);
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

  // API-managed wordlist - only query remote
  const ac = new AbortController();
  const tasks: Array<Promise<boolean>> = [];
  if (isOpen('dictionary')) tasks.push(askDictionary(w, ac.signal).catch(e => { if ((e as Error)?.message.includes('401')) trip('dictionary'); return false; }));
  if (isOpen('wordnik')) tasks.push(askWordnik(w, ac.signal).catch(e => { if ((e as Error)?.message.includes('401')) trip('wordnik'); return false; }));

  let apiValid = false;
  if (tasks.length) {
    const results = await Promise.allSettled(tasks);
    apiValid = results.some(r => r.status === 'fulfilled' && r.value === true);
  }

  let verdict: Verdict;
  if (apiValid) {
    verdict = { valid: true, source: 'api' };
  } else {
    // Fallback to local word list if API fails
    const localValid = await isAcceptedLocal(w);
    verdict = localValid
      ? { valid: true, source: 'local' }
      : { valid: false, source: 'none', reason: 'not-found' };
  }

  // Cache in memory only (no localStorage)
  MEMO.set(w, verdict);
  return verdict;
}
