// tmdb-config.js — secure configuration with environment variable support
(function(){
  'use strict';
  
  // Get API key from environment variable or meta tag (more secure than hardcoding)
  const getApiKey = () => {
    // 1. Check for environment variable (for build processes)
    if (typeof process !== 'undefined' && process.env && process.env.TMDB_API_KEY) {
      console.info('[TMDB] Using API key from environment variable');
      return process.env.TMDB_API_KEY;
    }
    
    // 2. Check for meta tag (for runtime configuration)
    const metaKey = document.querySelector('meta[name="tmdb-api-key"]')?.content;
    if (metaKey && metaKey !== 'YOUR_TMDB_API_KEY_HERE') {
      console.info('[TMDB] Using API key from meta tag');
      return metaKey;
    }
    
    // 3. Check for window variable (for development)
    if (window.TMDB_API_KEY && window.TMDB_API_KEY !== 'YOUR_TMDB_API_KEY_HERE') {
      console.info('[TMDB] Using API key from window variable');
      return window.TMDB_API_KEY;
    }
    
    // 4. Fallback to hardcoded key (only for development - should be replaced in production)
    console.warn('⚠️ Using fallback TMDB API key. Please set TMDB_API_KEY environment variable or meta tag for production.');
    return 'b7247bb415b50f25b5e35e2566430b96';
  };
  
  window.TMDB_CONFIG = window.TMDB_CONFIG || {
    apiKey: getApiKey(),
    baseUrl: 'https://api.themoviedb.org/3',
    imgBase: 'https://image.tmdb.org/t/p/'
  };
  
  // Expose API key for compatibility
  if (window.TMDB_CONFIG.apiKey) {
    window.__TMDB_API_KEY__ = window.TMDB_CONFIG.apiKey;
  }
  
  console.info('[TMDB] Configuration loaded:', {
    hasApiKey: !!window.__TMDB_API_KEY__,
    baseUrl: window.TMDB_CONFIG.baseUrl,
    isFallbackKey: window.TMDB_CONFIG.apiKey === 'b7247bb415b50f25b5e35e2566430b96'
  });
})();

