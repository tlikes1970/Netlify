// netlify/functions/dict-entries.ts
export const config = { path: '/api/dict/entries' };

export async function handler(event: any) {
  const url = new URL(event.rawUrl ?? `http://x?${event.rawQuery}`);
  const word = url.searchParams.get('word');
  if (!word) return { statusCode: 400, body: 'word required' };

  const target = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const r = await fetch(target, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { statusCode: r.status, body: 'fail' };
    const j = await r.json();
    return { statusCode: 200, body: JSON.stringify(j) };
  } catch {
    return { statusCode: 502, body: 'timeout' };
  }
}
