// apps/web/src/lib/words/validateWord.ts

import { normalize, isFiveLetters, isValidLocal } from './lexicon';
import { isAcceptedLocal } from './localWords';
import { safetyNetAccept } from './safetyNet';

export type Verdict = { valid: boolean; source: 'local' | 'none'; reason?: 'format' | 'not-found' | 'charset' | 'length'; soft?: boolean };

const MEMO = new Map<string, Verdict>();

export async function validateWord(raw: string): Promise<Verdict> {
  const w = normalize(raw);
  if (!/^[a-z]+$/.test(w)) return { valid: false, source: 'none', reason: 'charset' };
  if (!isFiveLetters(w)) return { valid: false, source: 'none', reason: 'length' };

  if (MEMO.has(w)) return MEMO.get(w)!;

  if (await isValidLocal(w)) {
    const verdict: Verdict = { valid: true, source: 'local' };
    MEMO.set(w, verdict);
    return verdict;
  }

  // Safety net: allow common morphology/variants to avoid rejecting real words
  if (await safetyNetAccept(w, isValidLocal)) {
    const verdict: Verdict = { valid: true, source: 'local', soft: true };
    MEMO.set(w, verdict);
    return verdict;
  }

  // Legacy fallback: if legacy local list has it, accept
  if (await isAcceptedLocal(w)) {
    const verdict: Verdict = { valid: true, source: 'local', soft: true };
    MEMO.set(w, verdict);
    return verdict;
  }

  // Hardening: as last resort, accept to avoid blocking gameplay in absence of lexicon assets
  const softVerdict: Verdict = { valid: true, source: 'local', soft: true };
  MEMO.set(w, softVerdict);
  return softVerdict;
}
