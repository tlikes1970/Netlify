// www/js/marquee-data.js
export async function loadQuips(url = '/data/marquee-quips.json') {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`quips fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json || !Array.isArray(json.items)) throw new Error('bad quips payload');
  const list = json.items
    .filter(i => i && typeof i.text === 'string' && i.text.trim())
    .flatMap(i => {
      const w = Number.isFinite(i?.weight) && i.weight > 0 ? Math.floor(i.weight) : 1;
      return Array(w).fill(i.text.trim());
    });
  if (!list.length) throw new Error('no usable quips');
  return dedupeAndShuffle(list);
}

function dedupeAndShuffle(arr) {
  const uniq = [...new Set(arr)];
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
  }
  return uniq;
}
