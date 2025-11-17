/**
 * Netlify Function: Fetch Goofs for a Movie/TV Show
 * 
 * This function fetches goofs from external sources (IMDb, goofs API, etc.)
 * and returns them in a standardized format.
 * 
 * Query Parameters:
 * - tmdbId: TMDB ID of the movie/show
 * - imdbId: (optional) IMDb ID for more accurate fetching
 * - title: (optional) Title for search fallback
 * 
 * Returns: JSON array of goofs in GoofSet format
 */

const cors = (contentType = 'application/json') => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': contentType,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
});

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors('text/plain'), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: cors(), 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  const qs = event.queryStringParameters || {};
  const tmdbId = qs.tmdbId || qs.tmdb_id;
  const imdbId = qs.imdbId || qs.imdb_id;
  const title = qs.title;

  if (!tmdbId) {
    return {
      statusCode: 400,
      headers: cors(),
      body: JSON.stringify({ 
        error: 'Missing required parameter', 
        message: 'Provide "tmdbId" query parameter' 
      })
    };
  }

  try {
    // TODO: Implement actual goofs fetching logic
    // Options:
    // 1. Use IMDb scraping (via a service like RapidAPI IMDb API)
    // 2. Use a dedicated goofs API service
    // 3. Use TMDB to get IMDb ID, then fetch from IMDb
    
    // For now, return empty array - this will be populated when you choose a data source
    const goofs = await fetchGoofsFromSource(tmdbId, imdbId, title);

    return {
      statusCode: 200,
      headers: {
        ...cors(),
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
      body: JSON.stringify({
        tmdbId: parseInt(tmdbId),
        source: 'api',
        lastUpdated: new Date().toISOString(),
        items: goofs
      })
    };
  } catch (error) {
    console.error('Error fetching goofs:', error);
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ 
        error: 'Failed to fetch goofs', 
        message: error.message || String(error)
      })
    };
  }
};

/**
 * Fetch goofs from external source
 * TODO: Implement based on your chosen data source
 */
async function fetchGoofsFromSource(tmdbId, imdbId, title) {
  // Option 1: If you have an IMDb API service (e.g., RapidAPI)
  // const imdbApiKey = process.env.IMDB_API_KEY;
  // if (imdbApiKey && imdbId) {
  //   return await fetchFromImdbApi(imdbId, imdbApiKey);
  // }

  // Option 2: If you have a dedicated goofs API
  // const goofsApiKey = process.env.GOOFS_API_KEY;
  // if (goofsApiKey) {
  //   return await fetchFromGoofsApi(tmdbId, goofsApiKey);
  // }

  // Option 3: Use TMDB to get IMDb ID, then fetch
  // if (!imdbId) {
  //   imdbId = await getImdbIdFromTmdb(tmdbId);
  // }
  // if (imdbId) {
  //   return await fetchFromImdb(imdbId);
  // }

  // For now, return empty array
  // Replace this with actual fetching logic once you choose a data source
  return [];
}

/**
 * Example: Fetch from IMDb API (RapidAPI)
 * Uncomment and configure when ready
 */
// async function fetchFromImdbApi(imdbId, apiKey) {
//   const response = await fetch(`https://imdb-api.com/en/API/Goofs/${apiKey}/${imdbId}`, {
//     headers: { 'Accept': 'application/json' }
//   });
//   if (!response.ok) throw new Error(`IMDb API error: ${response.status}`);
//   const data = await response.json();
//   // Transform IMDb goofs format to our GoofItem format
//   return data.items?.map((item, idx) => ({
//     id: `imdb-${idx}`,
//     type: categorizeGoof(item.type),
//     text: item.text,
//     subtlety: item.subtlety || 'obvious'
//   })) || [];
// }

/**
 * Example: Get IMDb ID from TMDB
 */
// async function getImdbIdFromTmdb(tmdbId) {
//   const tmdbToken = process.env.TMDB_TOKEN;
//   if (!tmdbToken) return null;
//   
//   const response = await fetch(
//     `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbToken}`,
//     { headers: { 'Accept': 'application/json' } }
//   );
//   if (!response.ok) return null;
//   const data = await response.json();
//   return data.imdb_id || null;
// }

/**
 * Categorize goof type from external source
 */
function categorizeGoof(externalType) {
  const lower = (externalType || '').toLowerCase();
  if (lower.includes('continuity')) return 'continuity';
  if (lower.includes('prop')) return 'prop';
  if (lower.includes('crew') || lower.includes('camera')) return 'crew';
  if (lower.includes('logic') || lower.includes('plot')) return 'logic';
  return 'other';
}

