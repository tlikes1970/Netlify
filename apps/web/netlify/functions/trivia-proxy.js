// Netlify Function: proxies OpenTDB safely from same origin
// No secrets required. Validates and allowlists params. Adds short caching.
const ALLOWED = new Set(['amount', 'category', 'difficulty', 'type', 'encode', 'seed']);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return json(405, { error: 'Method not allowed' });
    }

    const qs = new URLSearchParams();
    const src = new URLSearchParams(event.queryStringParameters || {});

    for (const [k, v] of src.entries()) {
      if (!ALLOWED.has(k)) continue;
      const val = String(v).slice(0, 64); // basic length cap
      qs.set(k, val);
    }

    // sensible defaults
    if (!qs.has('amount')) qs.set('amount', '5');
    if (!qs.has('type')) qs.set('type', 'multiple');
    if (!qs.has('encode')) qs.set('encode', 'url3986');

    const url = `https://opentdb.com/api.php?${qs.toString()}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();

    return {
      statusCode: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 min
      },
      body: text,
    };
  } catch (err) {
    return json(502, { error: 'Trivia proxy failed', detail: String((err && err.message) || err) });
  }
};

function json(code, obj) {
  return {
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}
