/**
 * Data Optimizer - Store only essential data, pull rest from TMDB
 * Purpose: Prevent Firebase document size issues by storing minimal data locally
 * Data Source: TMDB API for full details, localStorage for essentials only
 * Update Path: Automatically optimize data on load and save
 * Dependencies: TMDB API, localStorage, Firebase sync
 */

(function () {
  'use strict';

  // Essential fields to store locally
  const ESSENTIAL_FIELDS = {
    // Core identification
    id: true,
    media_type: true,
    title: true,
    name: true, // For TV shows

    // Display essentials
    poster_path: true,
    backdrop_path: true,
    release_date: true,
    first_air_date: true, // For TV shows

    // User experience
    vote_average: true,
    overview: true,

    // User data
    added_date: true,
    user_notes: true,
    user_rating: true,

    // List management
    list_type: true, // 'watching', 'wishlist', 'watched'
    last_watched: true, // For tracking progress
    watch_count: true, // How many times watched

    // High-leverage system fields
    compound_id: true, // e.g., "movie:12345" - helps dedupe across lists
    data_v: true, // Schema version for safe migrations
    origin: true, // Optional audit trail: "search", "import", "curated"
  };

  // Fields to always exclude (too large, not needed locally)
  const EXCLUDED_FIELDS = {
    // Large arrays
    genres: true,
    networks: true,
    production_companies: true,
    spoken_languages: true,
    origin_country: true,
    languages: true,

    // TV-specific large data
    seasons: true,
    episodes: true,
    last_episode_to_air: true,
    next_episode_to_air: true,
    number_of_episodes: true,
    number_of_seasons: true,

    // TMDB metadata
    popularity: true,
    vote_count: true,
    adult: true,
    video: true,
    original_language: true,
    original_title: true,
    original_name: true,

    // Large objects
    last_air_date: true,
    in_production: true,
    status: true,
    runtime: true,
    homepage: true,

    // Debug fields
    _score: true,
    because: true,
  };

  /**
   * Optimize a single item - keep only essential fields
   */
  function optimizeItem(item, listType) {
    if (!item || typeof item !== 'object') return null;

    const mediaType = item.media_type || (item.name ? 'tv' : 'movie');
    const itemId = item.id;

    const optimized = {
      // Core identification
      id: itemId,
      media_type: mediaType,

      // Display essentials
      title: item.title || item.name,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      release_date: item.release_date || item.first_air_date,

      // User experience
      vote_average: item.vote_average,
      overview: item.overview,

      // User data
      added_date: item.added_date || Date.now(),
      user_notes: item.user_notes || '',
      user_rating: item.user_rating || null,

      // List management
      list_type: listType,
      last_watched: item.last_watched || null,
      watch_count: item.watch_count || 0,

      // High-leverage system fields
      compound_id: `${mediaType}:${itemId}`, // e.g., "movie:12345"
      data_v: 1, // Schema version for safe migrations
      origin: item.origin || 'unknown', // Audit trail: "search", "import", "curated"
    };

    // Remove null/undefined values
    Object.keys(optimized).forEach((key) => {
      if (optimized[key] === null || optimized[key] === undefined) {
        delete optimized[key];
      }
    });

    return optimized;
  }

  /**
   * Optimize entire watchlist data
   */
  function optimizeWatchlistData(data) {
    if (!data || typeof data !== 'object') return data;

    const optimized = {
      settings: data.settings || {},
      tv: {
        watching: (data.tv?.watching || []).map((item) => optimizeItem(item, 'watching')),
        wishlist: (data.tv?.wishlist || []).map((item) => optimizeItem(item, 'wishlist')),
        watched: (data.tv?.watched || []).map((item) => optimizeItem(item, 'watched')),
      },
      movies: {
        watching: (data.movies?.watching || []).map((item) => optimizeItem(item, 'watching')),
        wishlist: (data.movies?.wishlist || []).map((item) => optimizeItem(item, 'wishlist')),
        watched: (data.movies?.watched || []).map((item) => optimizeItem(item, 'watched')),
      },
    };

    // Remove null items (failed optimization)
    Object.keys(optimized).forEach((mediaType) => {
      if (optimized[mediaType] && typeof optimized[mediaType] === 'object') {
        Object.keys(optimized[mediaType]).forEach((listType) => {
          if (Array.isArray(optimized[mediaType][listType])) {
            optimized[mediaType][listType] = optimized[mediaType][listType].filter(
              (item) => item !== null,
            );
          }
        });
      }
    });

    return optimized;
  }

  /**
   * Get full item details from TMDB when needed
   */
  async function getFullItemDetails(item) {
    if (!item || !item.id || !item.media_type) {
      console.warn('[DataOptimizer] Invalid item for full details:', item);
      return null;
    }

    try {
      const endpoint = item.media_type === 'tv' ? `tv/${item.id}` : `movie/${item.id}`;
      const tmdbData = await window.tmdbGet(endpoint);

      if (tmdbData && tmdbData.id) {
        // Merge full details with local data
        return {
          ...tmdbData,
          // Preserve user data
          added_date: item.added_date,
          user_notes: item.user_notes,
          user_rating: item.user_rating,
          list_type: item.list_type,
          last_watched: item.last_watched,
          watch_count: item.watch_count,
        };
      }
    } catch (error) {
      console.error('[DataOptimizer] Failed to get full details:', error);
    }

    return null;
  }

  /**
   * Optimize data on load
   */
  function optimizeOnLoad() {
    try {
      const rawData = localStorage.getItem('flicklet-data');
      if (!rawData) return;

      const data = JSON.parse(rawData);
      const optimized = optimizeWatchlistData(data);

      // Check size reduction
      const originalSize = rawData.length;
      const optimizedSize = JSON.stringify(optimized).length;
      const reduction = Math.round((1 - optimizedSize / originalSize) * 100);

      console.log(
        `[DataOptimizer] Data optimization: ${Math.round(originalSize / 1024)}KB → ${Math.round(optimizedSize / 1024)}KB (${reduction}% reduction)`,
      );

      // Save optimized data
      localStorage.setItem('flicklet-data', JSON.stringify(optimized));

      // Update window.appData
      if (typeof window.loadAppData === 'function') {
        window.loadAppData();
      }

      return optimized;
    } catch (error) {
      console.error('[DataOptimizer] Optimization failed:', error);
      return null;
    }
  }

  /**
   * Optimize data before saving
   */
  function optimizeBeforeSave(data) {
    if (!data || typeof data !== 'object') return data;

    const optimized = optimizeWatchlistData(data);
    const size = JSON.stringify(optimized).length;

    console.log(`[DataOptimizer] Pre-save optimization: ${Math.round(size / 1024)}KB`);

    return optimized;
  }

  // Expose to global scope
  window.DataOptimizer = {
    optimizeItem,
    optimizeWatchlistData,
    getFullItemDetails,
    optimizeOnLoad,
    optimizeBeforeSave,
    ESSENTIAL_FIELDS,
    EXCLUDED_FIELDS,
  };

  // Auto-optimize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeOnLoad);
  } else {
    optimizeOnLoad();
  }
})();
