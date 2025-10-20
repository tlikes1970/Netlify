/**
 * Process: TMDB API Client
 * Purpose: Central TMDB API integration via secure proxy
 * Data Source: TMDB API via netlify/functions/tmdb-proxy.js
 * Update Path: Modify API endpoints or add new functions here
 * Dependencies: tmdb-proxy.js (Netlify Function)
 */

(function () {
  'use strict';

  console.log('🎬 TMDB API client loading...');

  // Request deduplication
  const _inflight = new Map();

  // Proxy configuration
  const TMDB_PROXY_URL = '/.netlify/functions/tmdb-proxy';

  // Rate limiting (client-side backup)
  let requestCount = 0;
  const MAX_REQUESTS_PER_MINUTE = 30; // Reduced since we have server-side limiting
  const requestTimes = [];

  function checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old requests
    while (requestTimes.length > 0 && requestTimes[0] < oneMinuteAgo) {
      requestTimes.shift();
    }

    if (requestTimes.length >= MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    requestTimes.push(now);
  }

  // Language helper methods
  function getCurrentLanguage() {
    // Try LanguageManager first (if available)
    if (window.LanguageManager && typeof window.LanguageManager.getCurrentLanguage === 'function') {
      return window.LanguageManager.getCurrentLanguage();
    }

    // Try direct localStorage access
    try {
      const stored = localStorage.getItem('flicklet-language');
      if (stored) return stored;
    } catch (error) {
      console.warn('Failed to get language from localStorage:', error);
    }

    // Fallback to appData
    if (window.appData?.settings?.lang) {
      return window.appData.settings.lang;
    }

    // Fallback to HTML lang attribute
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      return htmlLang.split('-')[0]; // Extract language code from 'en-US' -> 'en'
    }

    // Default fallback
    return 'en';
  }

  function mapToTMDBLocale(lang) {
    const langMap = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-PT',
      ru: 'ru-RU',
      ja: 'ja-JP',
      ko: 'ko-KR',
      zh: 'zh-CN',
    };

    return langMap[lang] || 'en-US';
  }

  // Build proxy URL helper
  function buildProxyUrl(endpoint, params = {}) {
    const currentLang = getCurrentLanguage();
    const tmdbLang = mapToTMDBLocale(currentLang);

    const url = new URL(TMDB_PROXY_URL, window.location.origin);
    url.searchParams.set('path', endpoint);

    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    // Add language parameter
    url.searchParams.set('language', tmdbLang);

    return url.toString();
  }

  // Central TMDB API client via proxy
  window.tmdbGet = async function tmdbGet(path, params = {}) {
    const key = path + '::' + JSON.stringify(params);
    if (_inflight.has(key)) return _inflight.get(key);

    const promise = (async () => {
      const url = buildProxyUrl(path, params);
      const res = await fetch(url);
      if (res.status === 404) { console.warn('[tmdb] 404', path); return { ok:false, status:404 }; }
      if (!res.ok)        { console.warn('[tmdb] error', path, res.status); return { ok:false, status:res.status }; }
      const data = await res.json();
      if (Array.isArray(data?.results)) console.log('✅ TMDB', path, `results:${data.results.length}`);
      else                              console.log('✅ TMDB', path, 'object');
      return { ok:true, data };
    })().finally(() => _inflight.delete(key));

    _inflight.set(key, promise);
    return promise;
  };

  // Locale mapping helper - centralized source of truth
  window.getTMDBLocale = function (lang) {
    return mapToTMDBLocale(lang);
  };

  // Genre mapping helper
  window.getGenreName = function (genreId, mediaType = 'movie') {
    const genres = window.__GENRES__ || {};
    return genres[genreId] || 'Unknown';
  };

  // Search helper
  window.searchTMDB = async function (query, mediaType = 'multi', page = 1) {
    return await window.tmdbGet('search/multi', {
      query: query,
      page: page,
      media_type: mediaType,
    });
  };

  // Trending content helper
  window.getTrending = async function (mediaType = 'all', timeWindow = 'day', page = 1) {
    return await window.tmdbGet(`trending/${mediaType}/${timeWindow}`, {
      page: page,
    });
  };

  // Genre list helper
  window.getGenres = async function (mediaType = 'movie') {
    return await window.tmdbGet(`genre/${mediaType}/list`);
  };

  // Discover content by genre
  window.discoverByGenre = async function (genreId, mediaType = 'movie', page = 1) {
    return await window.tmdbGet(`discover/${mediaType}`, {
      with_genres: genreId,
      page: page,
      sort_by: 'popularity.desc',
    });
  };

  // Get detailed information for a specific movie or TV show
  window.getTMDBDetails = async function (id, mediaType) {
    try {
      console.log(`[tmdb] Fetching details for ${mediaType} ID: ${id}`);
      const result = await window.tmdbGet(`${mediaType}/${id}`);
      
      if (!result.ok) {
        console.warn(`[tmdb] Failed to fetch details for ${mediaType}/${id}:`, result.status);
        return null;
      }
      
      return result.data;
    } catch (error) {
      console.error(`[tmdb] Error fetching details for ${mediaType}/${id}:`, error);
      return null;
    }
  };

  // Enhance search result with detailed information
  window.enhanceTMDBItem = async function (item) {
    try {
      // Determine media type
      const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
      const id = item.id || item.tmdb_id || item.tmdbId;
      
      if (!id) {
        console.warn('[tmdb] No ID found for item:', item);
        return item;
      }
      
      // Fetch detailed information
      const details = await window.getTMDBDetails(id, mediaType);
      if (!details) {
        console.warn('[tmdb] No details found for item:', item.title || item.name);
        return item;
      }
      
      // Merge search result with detailed information
      const enhanced = {
        ...item,
        ...details,
        // Preserve original search result fields
        id: item.id || details.id,
        media_type: mediaType,
        // Add enhanced metadata
        genres: details.genres || [],
        runtime: details.runtime || details.episode_run_time?.[0] || null,
        vote_average: details.vote_average || item.vote_average,
        vote_count: details.vote_count || item.vote_count,
        // TV show specific
        number_of_seasons: details.number_of_seasons,
        number_of_episodes: details.number_of_episodes,
        next_episode_to_air: details.next_episode_to_air,
        // Movie specific
        release_date: details.release_date || item.release_date,
        first_air_date: details.first_air_date || item.first_air_date,
        // Common fields
        overview: details.overview || item.overview,
        poster_path: details.poster_path || item.poster_path,
        backdrop_path: details.backdrop_path || item.backdrop_path,
        original_title: details.original_title || item.original_title,
        original_name: details.original_name || item.original_name,
        original_language: details.original_language || item.original_language,
        popularity: details.popularity || item.popularity,
        adult: details.adult || item.adult,
        video: details.video || item.video,
        // Production info
        production_companies: details.production_companies || [],
        production_countries: details.production_countries || [],
        spoken_languages: details.spoken_languages || [],
        // TV specific
        created_by: details.created_by || [],
        networks: details.networks || [],
        origin_country: details.origin_country || [],
        status: details.status,
        type: details.type,
        // Additional metadata
        tagline: details.tagline,
        homepage: details.homepage,
        imdb_id: details.imdb_id,
        external_ids: details.external_ids || {}
      };
      
  console.log(`[tmdb] Enhanced item: ${enhanced.title || enhanced.name} with ${enhanced.genres?.length || 0} genres`);
  return enhanced;
  
} catch (error) {
  console.error('[tmdb] Error enhancing item:', error);
  return item; // Return original item if enhancement fails
}
};

// Function to enhance all existing items in appData
window.enhanceAllExistingItems = async function() {
  console.log('[tmdb] Starting enhancement of all existing items...');
  
  if (!window.appData) {
    console.warn('[tmdb] No appData found');
    return;
  }
  
  let enhancedCount = 0;
  let totalCount = 0;
  
  // Process TV shows
  if (window.appData.tv) {
    for (const listName of ['watching', 'wishlist', 'watched']) {
      if (window.appData.tv[listName]) {
        console.log(`[tmdb] Enhancing TV ${listName} items...`);
        for (let i = 0; i < window.appData.tv[listName].length; i++) {
          const item = window.appData.tv[listName][i];
          totalCount++;
          
          // Check if item already has detailed data
          if (item.genres && item.genres.length > 0 && item.runtime) {
            console.log(`[tmdb] Item ${item.title || item.name} already enhanced, skipping`);
            continue;
          }
          
          try {
            const enhanced = await window.enhanceTMDBItem(item);
            if (enhanced && enhanced !== item) {
              window.appData.tv[listName][i] = enhanced;
              enhancedCount++;
              console.log(`[tmdb] Enhanced TV item: ${enhanced.title || enhanced.name}`);
            }
          } catch (error) {
            console.error(`[tmdb] Failed to enhance TV item ${item.title || item.name}:`, error);
          }
        }
      }
    }
  }
  
  // Process movies
  if (window.appData.movies) {
    for (const listName of ['watching', 'wishlist', 'watched']) {
      if (window.appData.movies[listName]) {
        console.log(`[tmdb] Enhancing movie ${listName} items...`);
        for (let i = 0; i < window.appData.movies[listName].length; i++) {
          const item = window.appData.movies[listName][i];
          totalCount++;
          
          // Check if item already has detailed data
          if (item.genres && item.genres.length > 0 && item.runtime) {
            console.log(`[tmdb] Item ${item.title || item.name} already enhanced, skipping`);
            continue;
          }
          
          try {
            const enhanced = await window.enhanceTMDBItem(item);
            if (enhanced && enhanced !== item) {
              window.appData.movies[listName][i] = enhanced;
              enhancedCount++;
              console.log(`[tmdb] Enhanced movie item: ${enhanced.title || enhanced.name}`);
            }
          } catch (error) {
            console.error(`[tmdb] Failed to enhance movie item ${item.title || item.name}:`, error);
          }
        }
      }
    }
  }
  
  console.log(`[tmdb] Enhancement complete: ${enhancedCount}/${totalCount} items enhanced`);
  
  // Save the enhanced data
  if (enhancedCount > 0 && typeof window.saveAppData === 'function') {
    window.saveAppData();
    console.log('[tmdb] Enhanced data saved to localStorage');
    
    // Also save to Firebase if available
    if (typeof window.saveData === 'function') {
      window.saveData();
      console.log('[tmdb] Enhanced data saved to Firebase');
    }
    
    // Trigger UI update
    if (window.FlickletApp && typeof window.FlickletApp.updateUI === 'function') {
      window.FlickletApp.updateUI();
      console.log('[tmdb] UI updated with enhanced data');
    }
  }
  
  return { enhancedCount, totalCount };
};

  console.log('✅ TMDB API client loaded successfully');
})();
