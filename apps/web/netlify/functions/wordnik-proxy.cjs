// netlify/functions/wordnik-proxy.cjs
// Proxy for Wordnik API with API key protection

function json(code, obj) {
  return {
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return json(405, { error: 'Method not allowed' });
    }

    const qs = new URLSearchParams(event.queryStringParameters || {});
    const word = (qs.get('word') || '').trim();

    // Guardrails: keep it simple & safe
    if (!/^[A-Za-z][A-Za-z\-']{0,63}$/.test(word)) {
      return json(400, { error: 'Invalid word' });
    }

    // Use API key from environment variable (not hardcoded!)
    // If no API key is set, skip Wordnik and return empty
    const apiKey = process.env.WORDNIK_API_KEY;
    if (!apiKey) {
      console.warn('WORDNIK_API_KEY not set, skipping Wordnik check');
      return json(200, []); // Return empty array
    }

    const url = `https://api.wordnik.com/v4/word.json/${encodeURIComponent(word)}/definitions?limit=1&api_key=${apiKey}`;

    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    const text = await upstream.text(); // pass-through body
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
    return json(502, {
      error: 'Wordnik upstream failed',
      detail: String((err && err.message) || err),
    });
  }
};

