/**
 * TMDB Configuration
 * This file is loaded before other scripts to provide TMDB API configuration
 */

// TMDB API configuration
window.TMDB_CONFIG = {
  apiKey: null, // Will be set by environment variable
  baseUrl: 'https://api.themoviedb.org/3',
  imageBaseUrl: 'https://image.tmdb.org/t/p/',
  language: 'en-US',
  region: 'US',
};

// Set API key from environment (will be available in production)
if (typeof process !== 'undefined' && process.env && process.env.TMDB_API_KEY) {
  window.TMDB_CONFIG.apiKey = process.env.TMDB_API_KEY;
} else {
  // Try to get API key from meta tag for local development
  const metaTag = document.querySelector('meta[name="tmdb-api-key"]');
  if (metaTag && metaTag.content && metaTag.content !== 'YOUR_TMDB_API_KEY_HERE') {
    window.TMDB_CONFIG.apiKey = metaTag.content;
    window.__TMDB_API_KEY__ = metaTag.content; // Also set the global variable
  }
}

console.log('🎬 TMDB Config loaded');
