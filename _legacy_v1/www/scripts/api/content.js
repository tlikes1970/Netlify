/**
 * Process: Content API Presets
 * Purpose: Define and fetch content for personalized rows using existing TMDB layer
 * Data Source: TMDB API via existing tmdbGet function
 * Update Path: Modify ROW_PRESETS array or add new fetch functions
 * Dependencies: tmdbGet, TMDB_CONFIG, i18n
 */

(function () {
  'use strict';

  console.log('🎬 Content API presets loaded');

  const GENRE_FALLBACK = window.__GENRES__ || {
    16: 'Animation',
    27: 'Horror',
    28: 'Action',
    35: 'Comedy',
    18: 'Drama',
    12: 'Adventure',
    14: 'Fantasy',
    53: 'Thriller',
    80: 'Crime',
    99: 'Documentary',
  };

  function resolveGenreIdByName(name, map) {
    const norm = String(name || '')
      .trim()
      .toLowerCase();
    if (!norm) return null;
    const pairs = Object.entries(map || {});
    for (const [id, label] of pairs) {
      if (String(label).toLowerCase() === norm) return Number(id);
    }
    return null;
  }

  /**
   * Available row presets for personalized sections
   */
  window.ROW_PRESETS = [
    {
      key: 'trending',
      labelKey: 'rows.trending',
      fetch: fetchTrending,
    },
    {
      key: 'anime',
      labelKey: 'rows.anime',
      fetch: fetchAnime,
    },
    {
      key: 'horror',
      labelKey: 'rows.horror',
      fetch: (page = 1) => fetchByGenre('Horror', page),
    },
    {
      key: 'staff_picks',
      labelKey: 'rows.staff_picks',
      fetch: fetchStaffPicks,
    },
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
        window.tmdbGet('trending/movie/day', { page: page }),
        window.tmdbGet('trending/tv/day', { page: page }),
      ]);

      // Combine and shuffle results
      const allResults = [...(moviesData?.results || []), ...(tvData?.results || [])].sort(
        () => Math.random() - 0.5,
      );

      return {
        results: allResults,
        page: page,
        total_pages: Math.max(moviesData?.total_pages || 1, tvData?.total_pages || 1),
      };
    } catch (error) {
      console.warn('[content] tmdbGet failed for trending', error);
      return [];
    }
  }

  /**
   * Resolve genre ID by name using fallback map
   * @param {string} name - Genre name to resolve
   * @param {Object} genresMap - Genre map from TMDB API
   * @returns {number|null} Genre ID or null if not found
   */
  function resolveGenreIdByName(name, genresMap) {
    const norm = String(name || '')
      .trim()
      .toLowerCase();
    if (!norm) return null;
    // Try provided map first
    for (const [id, label] of Object.entries(genresMap || {})) {
      if (String(label).toLowerCase() === norm) return Number(id);
    }
    // Try fallback map
    for (const [id, label] of Object.entries(window.__GENRES__ || {})) {
      if (String(label).toLowerCase() === norm) return Number(id);
    }
    return null;
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

      // First get the genre ID using fallback
      const genreData = await window.tmdbGet('genre/movie/list');
      const genreId =
        resolveGenreIdByName(genreName, genreData.genres) ??
        resolveGenreIdByName(genreName, GENRE_FALLBACK);

      if (genreId == null) {
        console.warn('[content] Genre not found via API or fallback:', genreName);
        return []; // do not throw
      }

      // Fetch movies by genre
      try {
        const movieData = await window.tmdbGet('discover/movie', {
          with_genres: genreId,
          page: page,
          sort_by: 'popularity.desc',
        });
        const movieItems = Array.isArray(movieData?.results) ? movieData.results : [];

        // Also fetch TV shows by genre if available
        const tvGenreData = await window.tmdbGet('genre/tv/list');
        const tvGenreId =
          resolveGenreIdByName(genreName, tvGenreData.genres) ??
          resolveGenreIdByName(genreName, GENRE_FALLBACK);

        let tvItems = [];
        let tvData = null;
        if (tvGenreId) {
          tvData = await window.tmdbGet('discover/tv', {
            with_genres: tvGenreId,
            page: page,
            sort_by: 'popularity.desc',
          });
          tvItems = Array.isArray(tvData?.results) ? tvData.results : [];
        }

        // Combine results
        const allResults = [...movieItems, ...tvItems].sort(() => Math.random() - 0.5);

        return {
          results: allResults,
          page: page,
          total_pages: Math.max(movieData?.total_pages || 1, tvData?.total_pages || 1),
        };
      } catch (err) {
        console.warn('[content] tmdbGet failed for genre', genreName, err);
        return [];
      }
    } catch (error) {
      console.warn('[content] Genre not found:', genreName);
      return [];
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
        window.tmdbGet('movie/top_rated', { page: page }),
        window.tmdbGet('tv/top_rated', { page: page }),
        window.tmdbGet('movie/popular', { page: page }),
        window.tmdbGet('tv/popular', { page: page }),
      ]);

      // Combine and prioritize highly rated content
      const allResults = [
        ...(topRatedMovies?.results || []).slice(0, 5),
        ...(topRatedTV?.results || []).slice(0, 5),
        ...(popularMovies?.results || []).slice(0, 3),
        ...(popularTV?.results || []).slice(0, 3),
      ].sort(() => Math.random() - 0.5);

      return {
        results: allResults,
        page: page,
        total_pages: 1, // Staff picks are curated, so we don't paginate much
      };
    } catch (error) {
      console.warn('[content] tmdbGet failed for staff picks', error);
      return [];
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

      if (!animatedContent || !Array.isArray(animatedContent.results)) {
        return [];
      }

      // Filter for anime-specific content (Japanese origin required)
      const animeResults = animatedContent.results.filter((item) => {
        // Must be from Japan (primary requirement)
        const isJapanese = item.origin_country && item.origin_country.includes('JP');

        // Additional anime-specific keywords in title or overview
        const title = (item.title || item.name || '').toLowerCase();
        const overview = (item.overview || '').toLowerCase();
        const hasAnimeKeywords =
          /anime|manga|otaku|shounen|shoujo|seinen|josei|mecha|isekai|slice of life|battle shounen|studio ghibli|ghibli/i.test(
            title + ' ' + overview,
          );

        // Must be Japanese AND have anime characteristics
        return isJapanese && (hasAnimeKeywords || item.genre_ids?.includes(16));
      });

      console.log(
        `🎌 Filtered ${animeResults.length} anime items from ${animatedContent.results.length} animated items`,
      );

      return {
        results: animeResults,
        page: page,
        total_pages: animatedContent.total_pages || 1,
      };
    } catch (error) {
      console.warn('[content] tmdbGet failed for anime', error);
      return [];
    }
  }
})();
