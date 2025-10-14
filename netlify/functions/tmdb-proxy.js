exports.handler = async (event) => {
  try {
    const TMDB_TOKEN = (process.env.TMDB_TOKEN || '').trim();
    if (!TMDB_TOKEN) {
      return {
        statusCode: 500,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
        body: JSON.stringify({ error: 'Missing TMDB_TOKEN on server' })
      };
    }

    const qs = event.queryStringParameters || {};
    const rawPath = String(qs.path || '').trim();
    const path = rawPath.startsWith('/') ? rawPath : '/' + rawPath;

    const { path: _omit, ...rest } = qs;
    const params = new URLSearchParams({ language: 'en-US', ...rest });

    const url = `https://api.themoviedb.org/3${path}?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TMDB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const text = await res.text();

    return {
      statusCode: res.status,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'cache-control': res.ok ? 'public, max-age=300' : 'no-store'
      },
      body: text
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      body: JSON.stringify({ error: String(e && e.message || e) })
    };
  }
};