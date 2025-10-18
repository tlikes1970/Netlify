// TMDB v4 (Bearer) proxy for Netlify Functions
// Accepts ?endpoint=/... or ?path=... and forwards remaining query params to TMDB API
// Requires TMDB_TOKEN (v4 Read Access Token) environment variable

export const config = { path: '/api/tmdb-proxy' };

const API_BASE = 'https://api.themoviedb.org/3/';

const cors = (contentType = 'application/json; charset=utf-8') => ({
  'Content-Type': contentType,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
});

const isProd = process.env.NODE_ENV === 'production';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors('text/plain'), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: cors(), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const token = (process.env.TMDB_TOKEN || '').trim();
  if (!token) {
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ 
        error: 'Server misconfiguration', 
        message: 'TMDB_TOKEN is not set',
        hint: 'Set TMDB_TOKEN in Netlify environment variables'
      })
    };
  }

  const qs = event.queryStringParameters || {};
  const endpointRaw = (qs.endpoint || qs.path || '').toString().trim();
  if (!endpointRaw) {
    return {
      statusCode: 400,
      headers: cors(),
      body: JSON.stringify({ 
        error: 'Missing required parameter', 
        message: 'Provide "endpoint" or "path" query parameter' 
      })
    };
  }

  // Normalize endpoint and build TMDB URL
  const ep = endpointRaw.startsWith('/') ? endpointRaw.slice(1) : endpointRaw;
  const url = new URL(ep, API_BASE);

  // Forward all query params except our control params
  const params = new URLSearchParams(qs);
  params.delete('endpoint');
  params.delete('path');
  params.delete('api_key'); // use v4 bearer only

  // TMDB /search/* does not accept media_type; remove it to avoid 400s
  if (ep.startsWith('search/')) params.delete('media_type');

  // Copy non-empty values
  for (const [k, v] of params.entries()) {
    if (v != null && String(v).length) url.searchParams.set(k, v);
  }

  let tmdbRes;
  try {
    tmdbRes = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    return {
      statusCode: 502,
      headers: cors(),
      body: JSON.stringify({ 
        error: 'Upstream fetch failed', 
        message: err?.message || String(err) 
      })
    };
  }

  const bodyText = await tmdbRes.text();
  const headers = {
    ...cors(),
    'Cache-Control': tmdbRes.ok ? 'public, max-age=60' : 'no-store'
  };

  if (!tmdbRes.ok) {
    let details;
    try { 
      details = JSON.parse(bodyText); 
    } catch { 
      details = { message: bodyText }; 
    }

    const payload = {
      error: 'TMDB error',
      status: tmdbRes.status,
      statusText: tmdbRes.statusText,
      details: details.status_message || details.message || bodyText.slice(0, 300),
      ...(isProd ? {} : { proxied_url: url.toString() }),
    };

    return { statusCode: tmdbRes.status, headers, body: JSON.stringify(payload) };
  }

  // Pass through TMDB JSON directly
  return { statusCode: 200, headers, body: bodyText };
}