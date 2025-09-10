/**
 * Process: Content API Presets
 * Purpose: Define and fetch content for personalized rows using existing TMDB layer
 * Data Source: TMDB API via existing tmdbGet function
 * Update Path: Modify ROW_PRESETS array or add new fetch functions
 * Dependencies: tmdbGet, TMDB_CONFIG, i18n
 */

(function() {
  'use strict';

  console.log('🎬 Content API presets loaded');

  /**
   * Available row presets for personalized sections
   */
  window.ROW_PRESETS = [
    {
      key: 'trending',
      labelKey: 'rows.trending',
      fetch: fetchTrending
    },
    {
      key: 'anime',
      labelKey: 'rows.anime',
      fetch: (page = 1) => fetchByGenre('Animation', page)
    },
    {
      key: 'horror',
      labelKey: 'rows.horror',
      fetch: (page = 1) => fetchByGenre('Horror', page)
    },
    {
      key: 'staff_picks',
      labelKey: 'rows.staff_picks',
      fetch: fetchStaffPicks
    }
  ];

  /**
   * Fetch trending content (movies and TV shows)
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} TMDB response with results array
   */
  async function fetchTrending(page = 1) {
    try {
      console.log('🎬 Fetching trending content, page:', page);
      
      // Fetch both movies and TV shows trending
      const [moviesData, tvData] = await Promise.all([
        window.tmdbGet('trending/movie/day', `&page=${page}`),
        window.tmdbGet('trending/tv/day', `&page=${page}`)
      ]);

      // Combine and shuffle results
      const allResults = [
        ...(moviesData.results || []),
        ...(tvData.results || [])
      ].sort(() => Math.random() - 0.5);

      return {
        results: allResults,
        page: page,
        total_pages: Math.max(moviesData.total_pages || 1, tvData.total_pages || 1)
      };
    } catch (error) {
      console.error('❌ Failed to fetch trending content:', error);
      throw error;
    }
  }

  /**
   * Fetch content by genre
   * @param {string} genreName - Genre name to filter by
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} TMDB response with results array
   */
  async function fetchByGenre(genreName, page = 1) {
    try {
      console.log(`🎬 Fetching ${genreName} content, page:`, page);
      
      // First get the genre ID
      const genreData = await window.tmdbGet('genre/movie/list');
      const genre = genreData.genres?.find(g => g.name === genreName);
      
      if (!genre) {
        throw new Error(`Genre "${genreName}" not found`);
      }

      // Fetch movies by genre
      const movieData = await window.tmdbGet('discover/movie', `&with_genres=${genre.id}&page=${page}&sort_by=popularity.desc`);
      
      // Also fetch TV shows by genre if available
      const tvGenreData = await window.tmdbGet('genre/tv/list');
      const tvGenre = tvGenreData.genres?.find(g => g.name === genreName);
      
      let tvData = { results: [] };
      if (tvGenre) {
        tvData = await window.tmdbGet('discover/tv', `&with_genres=${tvGenre.id}&page=${page}&sort_by=popularity.desc`);
      }

      // Combine results
      const allResults = [
        ...(movieData.results || []),
        ...(tvData.results || [])
      ].sort(() => Math.random() - 0.5);

      return {
        results: allResults,
        page: page,
        total_pages: Math.max(movieData.total_pages || 1, tvData.total_pages || 1)
      };
    } catch (error) {
      console.error(`❌ Failed to fetch ${genreName} content:`, error);
      throw error;
    }
  }

  /**
   * Fetch staff picks (curated content)
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} TMDB response with results array
   */
  async function fetchStaffPicks(page = 1) {
    try {
      console.log('🎬 Fetching staff picks, page:', page);
      
      // Use a mix of highly rated and popular content
      const [topRatedMovies, topRatedTV, popularMovies, popularTV] = await Promise.all([
        window.tmdbGet('movie/top_rated', `&page=${page}`),
        window.tmdbGet('tv/top_rated', `&page=${page}`),
        window.tmdbGet('movie/popular', `&page=${page}`),
        window.tmdbGet('tv/popular', `&page=${page}`)
      ]);

      // Combine and prioritize highly rated content
      const allResults = [
        ...(topRatedMovies.results || []).slice(0, 5),
        ...(topRatedTV.results || []).slice(0, 5),
        ...(popularMovies.results || []).slice(0, 3),
        ...(popularTV.results || []).slice(0, 3)
      ].sort(() => Math.random() - 0.5);

      return {
        results: allResults,
        page: page,
        total_pages: 1 // Staff picks are curated, so we don't paginate much
      };
    } catch (error) {
      console.error('❌ Failed to fetch staff picks:', error);
      throw error;
    }
  }

})();
