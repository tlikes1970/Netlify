// tmdb-config.js — unify key exposure
(function(){
  window.TMDB_CONFIG = window.TMDB_CONFIG || {
    apiKey: window.TMDB_CONFIG?.apiKey || (document.querySelector('meta[name="tmdb-api-key"]')?.content || 'b7247bb415b50f25b5e35e2566430b96'),
    baseUrl: 'https://api.themoviedb.org/3',
    imgBase: 'https://image.tmdb.org/t/p/'
  };
  if (window.TMDB_CONFIG.apiKey) {
    window.__TMDB_API_KEY__ = window.TMDB_CONFIG.apiKey; // <<< ADD THIS
  }
  console.info('[TMDB] key present:', !!window.__TMDB_API_KEY__);
})();

