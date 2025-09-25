// netlify/functions/dict-proxy.js
// Same-origin proxy for dictionaryapi.dev with basic validation & caching.

function json(code, obj) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return json(405, { error: 'Method not allowed' });
    }

    const qs = new URLSearchParams(event.queryStringParameters || {});
    const lang = (qs.get('lang') || 'en').toLowerCase().trim();
    const word = (qs.get('word') || '').trim();

    // Guardrails: keep it simple & safe
    if (!/^[a-z]{2,3}$/.test(lang)) return json(400, { error: 'Invalid lang' });
    if (!/^[A-Za-z][A-Za-z\-']{0,63}$/.test(word)) return json(400, { error: 'Invalid word' });

    const url = `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(word)}`;

    const upstream = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    const text = await upstream.text(); // pass-through body (array or error)
    return {
      statusCode: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        // Small cache helps avoid hammering upstream
        'Cache-Control': 'public, max-age=300',
      },
      body: text,
    };
  } catch (err) {
    return json(502, { error: 'Dictionary upstream failed', detail: String(err && err.message || err) });
  }
};
