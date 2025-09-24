// tmdb-config.js — Legacy compatibility for proxy migration
(function(){
  'use strict';
  
  console.log('🎬 TMDB Config: Using proxy-based API (no direct API key)');
  
  // Legacy compatibility - no direct API key exposure
  window.TMDB_CONFIG = window.TMDB_CONFIG || {
    apiKey: null, // No direct API key - using proxy
    baseUrl: 'PROXY_ONLY', // All requests go through proxy
    imgBase: 'https://image.tmdb.org/t/p/'
  };
  
  // No API key exposure for security
  window.__TMDB_API_KEY__ = null;
  
  console.info('[TMDB] Proxy-based configuration loaded - API key secured server-side');
})();

