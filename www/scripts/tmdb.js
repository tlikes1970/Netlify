/**
 * Process: TMDB API Client
 * Purpose: Central TMDB API integration with proper error handling
 * Data Source: TMDB API via tmdb-config.js
 * Update Path: Modify API endpoints or add new functions here
 * Dependencies: tmdb-config.js, TMDB_CONFIG
 */

(function() {
  'use strict';

  console.log('🎬 TMDB API client loading...');

  // Ensure TMDB_CONFIG is available
  if (!window.TMDB_CONFIG) {
    console.error('❌ TMDB_CONFIG not found. Make sure tmdb-config.js is loaded first.');
    return;
  }

  // Central TMDB API client
  window.tmdbGet = async function tmdbGet(path, params = {}) {
    try {
      const config = window.TMDB_CONFIG;
      const apiKey = config.apiKey;
      
      if (!apiKey) {
        console.warn('⚠️ TMDB API key not available');
        return { results: [], page: 1, total_pages: 0, total_results: 0 };
      }

      const baseUrl = config.baseUrl || 'https://api.themoviedb.org/3';
      const searchParams = new URLSearchParams({ 
        ...params, 
        api_key: apiKey,
        language: 'en-US' // Default language
      });
      
      const url = `${baseUrl}${path}?${searchParams.toString()}`;
      
      console.log('🌐 TMDB API request:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`⚠️ TMDB API error: ${response.status} ${response.statusText}`);
        return { results: [], page: 1, total_pages: 0, total_results: 0 };
      }
      
      const data = await response.json();
      console.log('✅ TMDB API response received:', path);
      return data;
      
    } catch (error) {
      console.error('❌ TMDB API request failed:', error);
      return { results: [], page: 1, total_pages: 0, total_results: 0 };
    }
  };

  // Genre mapping helper
  window.getGenreName = function(genreId, mediaType = 'movie') {
    const genres = window.__GENRES__ || {};
    return genres[genreId] || 'Unknown';
  };

  // Search helper
  window.searchTMDB = async function(query, mediaType = 'multi', page = 1) {
    return await window.tmdbGet('/search/multi', {
      query: query,
      page: page,
      include_adult: false
    });
  };

  // Trending content helper
  window.getTrending = async function(mediaType = 'all', timeWindow = 'week', page = 1) {
    return await window.tmdbGet(`/trending/${mediaType}/${timeWindow}`, {
      page: page
    });
  };

  // Genre list helper
  window.getGenres = async function(mediaType = 'movie') {
    return await window.tmdbGet(`/genre/${mediaType}/list`);
  };

  // Discover content by genre
  window.discoverByGenre = async function(genreId, mediaType = 'movie', page = 1) {
    return await window.tmdbGet('/discover/movie', {
      with_genres: genreId,
      page: page,
      sort_by: 'popularity.desc'
    });
  };

  console.log('✅ TMDB API client loaded successfully');
})();
