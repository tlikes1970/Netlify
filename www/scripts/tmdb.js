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

  console.log('✅ TMDB API client loaded successfully');
})();
