exports.handler = async (event) => {
  const url = new URL(event.rawUrl);
  const path = url.searchParams.get('path') || '';
  if (!path) {
    return json(400, { error: 'Missing path' });
  }

  const TMDB_TOKEN = (process.env.TMDB_TOKEN || '').trim(); // v4
  const TMDB_KEY   = (process.env.TMDB_KEY   || '').trim(); // v3
  if (!TMDB_TOKEN && !TMDB_KEY) {
    return json(500, { error: 'Missing TMDB_TOKEN or TMDB_KEY on server' });
  }

  // Rebuild query string minus "path"
  url.searchParams.delete('path');
  const qs = url.searchParams.toString();
  const base = 'https://api.themoviedb.org/3';
  const target = `${base}${path.startsWith('/') ? '' : '/'}${path}${qs ? `?${qs}` : ''}`;

  const headers = { 'Content-Type': 'application/json;charset=utf-8' };
  if (TMDB_TOKEN) headers.Authorization = `Bearer ${TMDB_TOKEN}`;

  // If only v3 key available, append it as api_key
  const fetchUrl = TMDB_TOKEN ? target : `${target}${qs ? '&' : '?'}api_key=${encodeURIComponent(TMDB_KEY)}`;

  try {
    const res = await fetch(fetchUrl, { headers });
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      body
    };
  } catch (err) {
    console.error('tmdb-proxy error', { msg: err.message });
    return json(502, { error: 'Upstream fetch failed' });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    body: JSON.stringify(obj)
  };
}
