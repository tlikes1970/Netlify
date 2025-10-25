// apps/web/src/lib/words/validateWord.ts
import { isAcceptedLocal } from './localWords';

export type Verdict = { valid: boolean; source: 'local' | 'remote' | 'none'; reason?: string };

const MEMO = new Map<string, Verdict>();
const LS_KEY = 'word-valid-v1';

function loadLS(): Record<string, Verdict> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function saveLS(obj: Record<string, Verdict>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {
    // Ignore localStorage errors
  }
}
const LS = loadLS();

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

  if (MEMO.has(w)) return MEMO.get(w)!;
  if (LS[w]) { MEMO.set(w, LS[w]); return LS[w]; }

  // 1) Local fast path
  if (await isAcceptedLocal(w)) {
    const v: Verdict = { valid: true, source: 'local' };
    MEMO.set(w, v); LS[w] = v; saveLS(LS); return v;
  }

  // 2) Remote checks in parallel (optional generosity)
  const ac = new AbortController();
  const tasks: Array<Promise<boolean>> = [];
  if (isOpen('dictionary')) tasks.push(askDictionary(w, ac.signal).catch(e => { if ((e as Error)?.message.includes('401')) trip('dictionary'); return false; }));
  if (isOpen('wordnik'))    tasks.push(askWordnik(w, ac.signal).catch(e => { if ((e as Error)?.message.includes('401')) trip('wordnik'); return false; }));

  let remoteValid = false;
  if (tasks.length) {
    const results = await Promise.allSettled(tasks);
    remoteValid = results.some(r => r.status === 'fulfilled' && r.value === true);
  }

  const verdict: Verdict = remoteValid
    ? { valid: true, source: 'remote' }
    : { valid: false, source: 'none', reason: 'not-found' };

  MEMO.set(w, verdict); LS[w] = verdict; saveLS(LS);
  return verdict;
}
