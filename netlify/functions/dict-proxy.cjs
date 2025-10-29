// netlify/functions/dict-proxy.cjs
// Dictionary API proxy for word validation

function jsonResponse(code, obj) {
  return {
    statusCode: code,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  try {
    if (event.httpMethod !== 'GET') {
      return jsonResponse(405, { error: 'Method not allowed' });
    }

    const qs = new URLSearchParams(event.queryStringParameters || {});
    const word = (qs.get('word') || '').trim().toLowerCase();

    if (!word) {
      return jsonResponse(400, { error: 'Missing word parameter' });
    }

    // Validate word is 5 letters
    if (word.length !== 5 || !/^[a-z]+$/.test(word)) {
      return jsonResponse(400, { error: 'Word must be exactly 5 lowercase letters' });
    }

    // Query Free Dictionary API (no key required)
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    
    const upstream = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    const text = await upstream.text();
    
    // If we get a 404 or empty response, word is not found
    if (upstream.status === 404) {
      return jsonResponse(200, { valid: false });
    }
    
    if (!upstream.ok) {
      console.error('Dictionary API error:', upstream.status, text);
      return jsonResponse(200, { valid: false }); // Treat API errors as "not found" rather than failing
    }

    const json = JSON.parse(text);
    
    // If we got results, word is valid
    const valid = Array.isArray(json) && json.length > 0;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      },
      body: JSON.stringify({ valid }),
    };
  } catch (err) {
    console.error('Dictionary proxy error:', err);
    return jsonResponse(200, { valid: false }); // Treat errors as "not found"
  }
};

