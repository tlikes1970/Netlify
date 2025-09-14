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
      fetch: fetchAnime
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

  /**
   * Fetch anime content (Japanese animated content)
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} TMDB response with anime results
   */
  async function fetchAnime(page = 1) {
    try {
      console.log('🎌 Fetching anime content, page:', page);
      
      // Fetch animated content and filter for Japanese productions
      const animatedContent = await fetchByGenre('Animation', page);
      
      if (!animatedContent || !animatedContent.results) {
        return { results: [], page: page, total_pages: 1 };
      }

      // Filter for anime-specific content (Japanese origin required)
      const animeResults = animatedContent.results.filter(item => {
        // Must be from Japan (primary requirement)
        const isJapanese = item.origin_country && item.origin_country.includes('JP');
        
        // Additional anime-specific keywords in title or overview
        const title = (item.title || item.name || '').toLowerCase();
        const overview = (item.overview || '').toLowerCase();
        const hasAnimeKeywords = /anime|manga|otaku|shounen|shoujo|seinen|josei|mecha|isekai|slice of life|battle shounen|studio ghibli|ghibli/i.test(title + ' ' + overview);
        
        // Must be Japanese AND have anime characteristics
        return isJapanese && (hasAnimeKeywords || item.genre_ids?.includes(16));
      });

      console.log(`🎌 Filtered ${animeResults.length} anime items from ${animatedContent.results.length} animated items`);

      return {
        results: animeResults,
        page: page,
        total_pages: animatedContent.total_pages || 1
      };
    } catch (error) {
      console.error('❌ Failed to fetch anime content:', error);
      throw error;
    }
  }

})();
