// apps/web/src/lib/words/localWords.ts
// Local, offline-first acceptance set. Replace this with your real list(s).
// Supports Set or an optional Bloom filter loaded from a static asset.

let ACCEPT_SET: Set<string> | null = null;

// Minimal dev seed. Replace with real data (e.g., from ENABLE/SCOWL) in production.
const DEV_SEED = [
  'couch','scowl','zesty','zebra','zombi','zoned','stare','cigar','react','watch','other'
];

// Optional: basic Bloom support if you ship /words/accepted.bloom (JSON with {m,k,bitsBase64})
type BloomSerialized = { m: number; k: number; bitsBase64: string };
class TinyBloom {
  private m: number;
  private k: number;
  private bits: Uint8Array;
  constructor(b: BloomSerialized) {
    this.m = b.m; this.k = b.k;
    this.bits = Uint8Array.from(atob(b.bitsBase64), c => c.charCodeAt(0));
  }
  private _hashes(word: string) {
    // Two simple 32-bit hashes; derive k via double hashing.
    let h1 = 2166136261, h2 = 16777619;
    for (let i = 0; i < word.length; i++) {
      const c = word.charCodeAt(i);
      h1 ^= c; h1 = Math.imul(h1, 16777619);
      h2 += c + (h2 << 1) + (h2 << 4) + (h2 << 7) + (h2 << 8) + (h2 << 24);
    }
    const idx = (n: number) => Math.abs((h1 + n * h2) % this.m);
    return Array.from({ length: this.k }, (_, i) => idx(i));
  }
  has(word: string) {
    const hashes = this._hashes(word);
    for (const bit of hashes) {
      const byte = this.bits[bit >> 3];
      if (((byte >> (bit & 7)) & 1) === 0) return false;
    }
    return true;
  }
}

let BLOOM: TinyBloom | null = null;
let bloomInitPromise: Promise<void> | null = null;

export async function initLocalWords(): Promise<void> {
  if (ACCEPT_SET || BLOOM || bloomInitPromise) return bloomInitPromise ?? Promise.resolve();

  // Try to load a bloom filter first; fall back to a Set.
  bloomInitPromise = (async () => {
    try {
      const res = await fetch('/words/accepted.bloom', { cache: 'force-cache' });
      if (res.ok) {
        const json = (await res.json()) as BloomSerialized;
        BLOOM = new TinyBloom(json);
        return;
      }
    } catch {}
    // Fallback Set (dev or shipped JSON)
    ACCEPT_SET = new Set<string>(DEV_SEED);
    try {
      const res = await fetch('/words/accepted.json', { cache: 'force-cache' });
      if (res.ok) {
        const arr = (await res.json()) as string[];
        ACCEPT_SET = new Set(arr.map(w => w.toLowerCase()));
      }
    } catch {}
  })();

  await bloomInitPromise;
}

export async function isAcceptedLocal(word: string): Promise<boolean> {
  await initLocalWords();
  const w = word.toLowerCase();
  if (BLOOM) return BLOOM.has(w);
  if (ACCEPT_SET) return ACCEPT_SET.has(w);
  return false;
}
