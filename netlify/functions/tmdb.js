// netlify/functions/tmdb.js
exports.handler = async (event, context) => {
  console.log('Function called with:', event.httpMethod, event.queryStringParameters);
  
  // Domain restrictions - allow your actual domain and localhost
  const allowedOrigins = [
    'https://tv-movie-tracker.netlify.app', // Your actual domain
    'https://zippy-meerkat-329c02.netlify.app', // Old domain (temporary)
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8888', // Netlify dev
    'http://127.0.0.1:8888'
  ];
  
  const origin = event.headers.origin || event.headers.referer || '';
  const isAllowedOrigin = allowedOrigins.some(allowed => 
    origin.startsWith(allowed)
  ) || !origin; // Allow if no origin (direct access)
  
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300' // 5 minute cache
  };

  // Handle preflight CORS requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return { 
      statusCode: 200, 
      headers, 
      body: '' 
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Only GET requests are supported.' })
    };
  }

  try {
    // Get API key from environment variable
    const API_KEY = process.env.TMDB_API_KEY;
    
    if (!API_KEY) {
      console.error('TMDB_API_KEY environment variable is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          message: 'API key not configured'
        })
      };
    }

    console.log('API key found, length:', API_KEY.length);

    // Extract query parameters
    const { endpoint, query, page = '1', genre } = event.queryStringParameters || {};

    if (!endpoint) {
      console.log('Missing endpoint parameter');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameter',
          message: 'endpoint parameter is required'
        })
      };
    }

    console.log('Processing request for endpoint:', endpoint);

    // Rate limiting - log IP for monitoring
    const userIP = event.headers['client-ip'] || 
                   event.headers['x-forwarded-for'] || 
                   event.headers['x-real-ip'] || 
                   'unknown';
    
    console.log(`Request from IP: ${userIP} for endpoint: ${endpoint}`);

    // Build the TMDB API URL
    let tmdbUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}`;
    
    // Add optional parameters
    if (query) {
      tmdbUrl += `&query=${encodeURIComponent(query)}`;
      console.log('Added query parameter:', query);
    }
    
    if (page && page !== '1') {
      tmdbUrl += `&page=${encodeURIComponent(page)}`;
      console.log('Added page parameter:', page);
    }
    
    if (genre) {
      tmdbUrl += `&with_genres=${encodeURIComponent(genre)}`;
      console.log('Added genre parameter:', genre);
    }

    // Log the URL (without API key for security)
    const logUrl = tmdbUrl.replace(API_KEY, '[REDACTED]');
    console.log('Making request to TMDB:', logUrl);

    // Make the request to TMDB API
    const response = await fetch(tmdbUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TV-Movie-Tracker/1.0'
      }
    });

    console.log('TMDB response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TMDB API error:', response.status, errorText);
      
      return {
        statusCode: response.status >= 500 ? 502 : response.status,
        headers,
        body: JSON.stringify({ 
          error: 'External API error',
          message: `TMDB API returned ${response.status}: ${response.statusText}`,
          details: response.status === 401 ? 'Invalid API key' : 'Service temporarily unavailable'
        })
      };
    }

    // Parse the JSON response
    const data = await response.json();
    console.log('Successfully fetched data, results count:', data.results ? data.results.length : 'N/A');

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function error:', error.name, error.message);
    console.error('Stack trace:', error.stack);
    
    // Handle different types of errors
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network error connecting to TMDB API';
      statusCode = 502;
    } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
      errorMessage = 'Request timeout - TMDB API is slow';
      statusCode = 504;
    }
    
    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      })
    };
  }
};// netlify/functions/tmdb.js
exports.handler = async (event, context) => {
  console.log('Function called with:', event.httpMethod, event.queryStringParameters);
  
  // Domain restrictions - only allow requests from your domain and localhost
  const allowedOrigins = [
    'https://zippy-meerkat-329c02.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8888', // Netlify dev
    'http://127.0.0.1:8888'
  ];
  
  const origin = event.headers.origin || event.headers.referer || '';
  const isAllowedOrigin = allowedOrigins.some(allowed => 
    origin.startsWith(allowed)
  ) || !origin; // Allow if no origin (direct access)
  
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : 'https://zippy-meerkat-329c02.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300' // 5 minute cache
  };

  // Handle preflight CORS requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return { 
      statusCode: 200, 
      headers, 
      body: '' 
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Only GET requests are supported.' })
    };
  }

  try {
    // Get API key from environment variable
    const API_KEY = process.env.TMDB_API_KEY;
    
    if (!API_KEY) {
      console.error('TMDB_API_KEY environment variable is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          message: 'API key not configured'
        })
      };
    }

    console.log('API key found, length:', API_KEY.length);

    // Extract query parameters
    const { endpoint, query, page = '1', genre } = event.queryStringParameters || {};

    if (!endpoint) {
      console.log('Missing endpoint parameter');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameter',
          message: 'endpoint parameter is required'
        })
      };
    }

    console.log('Processing request for endpoint:', endpoint);

    // Rate limiting - log IP for monitoring
    const userIP = event.headers['client-ip'] || 
                   event.headers['x-forwarded-for'] || 
                   event.headers['x-real-ip'] || 
                   'unknown';
    
    console.log(`Request from IP: ${userIP} for endpoint: ${endpoint}`);

    // Build the TMDB API URL
    let tmdbUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}`;
    
    // Add optional parameters
    if (query) {
      tmdbUrl += `&query=${encodeURIComponent(query)}`;
      console.log('Added query parameter:', query);
    }
    
    if (page && page !== '1') {
      tmdbUrl += `&page=${encodeURIComponent(page)}`;
      console.log('Added page parameter:', page);
    }
    
    if (genre) {
      tmdbUrl += `&with_genres=${encodeURIComponent(genre)}`;
      console.log('Added genre parameter:', genre);
    }

    // Log the URL (without API key for security)
    const logUrl = tmdbUrl.replace(API_KEY, '[REDACTED]');
    console.log('Making request to TMDB:', logUrl);

    // Make the request to TMDB API
    const response = await fetch(tmdbUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TV-Movie-Tracker/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('TMDB response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TMDB API error:', response.status, errorText);
      
      return {
        statusCode: response.status >= 500 ? 502 : response.status,
        headers,
        body: JSON.stringify({ 
          error: 'External API error',
          message: `TMDB API returned ${response.status}: ${response.statusText}`,
          details: response.status === 401 ? 'Invalid API key' : 'Service temporarily unavailable'
        })
      };
    }

    // Parse the JSON response
    const data = await response.json();
    console.log('Successfully fetched data, results count:', data.results ? data.results.length : 'N/A');

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function error:', error.name, error.message);
    console.error('Stack trace:', error.stack);
    
    // Handle different types of errors
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network error connecting to TMDB API';
      statusCode = 502;
    } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
      errorMessage = 'Request timeout - TMDB API is slow';
      statusCode = 504;
    }
    
    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      })
    };
  }
};