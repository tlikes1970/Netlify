// Worker to check if a word exists in the valid-guess lexicon
// Loads shards lazily by first character; falls back to full list if shards missing

const cache = new Map<string, Set<string>>();

async function loadShard(first: string): Promise<Set<string>> {
  if (cache.has(first)) return cache.get(first)!;
  let text = '';
  try {
    const r = await fetch(`/words/shards/${first}.txt`, { cache: 'force-cache' });
    if (r.ok) text = await r.text();
  } catch (e) { /* ignore network error; will fallback to full list */ }
  if (!text) {
    try {
      const r2 = await fetch('/words/valid-guess.txt', { cache: 'force-cache' });
      if (r2.ok) text = await r2.text();
    } catch (e) { /* ignore fallback fetch failure */ }
  }
  const set = new Set<string>(
    text
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
  );
  cache.set(first, set);
  return set;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.onmessage = async (e: MessageEvent<any>) => {
  const data = e.data || {};
  if (data.type !== 'check' || !data.word) return;
  const w: string = data.word;
  const set = await loadShard(w[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (self as any).postMessage({ ok: set.has(w) });
};


