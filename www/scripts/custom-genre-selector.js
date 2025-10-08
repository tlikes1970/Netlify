/* ========== custom-genre-selector.js ==========
   Custom genre selector for curated rows customization
   Provides main genre, sub-genre, and media type selection
*/

(function() {
  'use strict';

  console.log('🎭 Custom genre selector loading...');

  // Genre cache for performance
  let genreCache = {
    movies: null,
    tv: null,
    lastFetch: 0,
    cacheTimeout: 5 * 60 * 1000 // 5 minutes
  };

  // Sub-genre mappings (dependent on main genre)
  const subGenreMappings = {
    // Drama sub-genres
    18: [
      { id: 'drama_crime', name: 'Crime Drama', tmdbId: 80 },
      { id: 'drama_romance', name: 'Romance Drama', tmdbId: 10749 },
      { id: 'drama_historical', name: 'Historical Drama', tmdbId: 36 },
      { id: 'drama_biographical', name: 'Biographical Drama', tmdbId: 18 }
    ],
    // Comedy sub-genres
    35: [
      { id: 'comedy_romantic', name: 'Romantic Comedy', tmdbId: 10749 },
      { id: 'comedy_action', name: 'Action Comedy', tmdbId: 28 },
      { id: 'comedy_dark', name: 'Dark Comedy', tmdbId: 35 },
      { id: 'comedy_sitcom', name: 'Sitcom', tmdbId: 35 }
    ],
    // Action sub-genres
    28: [
      { id: 'action_adventure', name: 'Adventure', tmdbId: 12 },
      { id: 'action_thriller', name: 'Action Thriller', tmdbId: 53 },
      { id: 'action_crime', name: 'Crime Action', tmdbId: 80 },
      { id: 'action_sci_fi', name: 'Sci-Fi Action', tmdbId: 878 }
    ],
    // Horror sub-genres
    27: [
      { id: 'horror_supernatural', name: 'Supernatural Horror', tmdbId: 27 },
      { id: 'horror_slasher', name: 'Slasher', tmdbId: 27 },
      { id: 'horror_psychological', name: 'Psychological Horror', tmdbId: 27 },
      { id: 'horror_comedy', name: 'Horror Comedy', tmdbId: 35 }
    ],
    // Sci-Fi sub-genres
    878: [
      { id: 'sci_fi_fantasy', name: 'Sci-Fi Fantasy', tmdbId: 10765 },
      { id: 'sci_fi_thriller', name: 'Sci-Fi Thriller', tmdbId: 53 },
      { id: 'sci_fi_action', name: 'Sci-Fi Action', tmdbId: 28 },
      { id: 'sci_fi_drama', name: 'Sci-Fi Drama', tmdbId: 18 }
    ]
  };

  // Fallback genres if TMDB API fails
  const fallbackGenres = {
    movies: [
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' },
      { id: 18, name: 'Drama' },
      { id: 27, name: 'Horror' },
      { id: 878, name: 'Science Fiction' },
      { id: 12, name: 'Adventure' },
      { id: 16, name: 'Animation' },
      { id: 80, name: 'Crime' },
      { id: 99, name: 'Documentary' },
      { id: 14, name: 'Fantasy' },
      { id: 36, name: 'History' },
      { id: 10402, name: 'Music' },
      { id: 9648, name: 'Mystery' },
      { id: 10749, name: 'Romance' },
      { id: 53, name: 'Thriller' }
    ],
    tv: [
      { id: 18, name: 'Drama' },
      { id: 35, name: 'Comedy' },
      { id: 80, name: 'Crime' },
      { id: 10759, name: 'Action & Adventure' },
      { id: 10765, name: 'Sci-Fi & Fantasy' },
      { id: 10768, name: 'War & Politics' },
      { id: 10762, name: 'Kids' },
      { id: 10763, name: 'News' },
      { id: 10764, name: 'Reality' },
      { id: 10766, name: 'Soap' },
      { id: 10767, name: 'Talk' },
      { id: 10770, name: 'TV Movie' }
    ]
  };

  /**
   * Load genres from TMDB API with caching
   */
  async function loadGenres(mediaType = 'movie') {
    const now = Date.now();
    
    // Check cache first
    if (genreCache[mediaType] && (now - genreCache.lastFetch) < genreCache.cacheTimeout) {
      console.log(`🎭 Using cached ${mediaType} genres`);
      return genreCache[mediaType];
    }

    // Check if tmdbGet is available
    if (!window.tmdbGet) {
      console.warn(`🎭 tmdbGet not available, using fallback ${mediaType} genres`);
      return fallbackGenres[mediaType] || [];
    }

    try {
      console.log(`🎭 Fetching ${mediaType} genres from TMDB...`);
      const response = await window.tmdbGet(`genre/${mediaType}/list`);
      
      console.log(`🎭 TMDB response for ${mediaType} genres:`, response);
      
      if (response && response.genres) {
        genreCache[mediaType] = response.genres;
        genreCache.lastFetch = now;
        console.log(`🎭 Loaded ${response.genres.length} ${mediaType} genres from TMDB`);
        return response.genres;
      } else {
        console.warn(`🎭 Invalid response format for ${mediaType} genres:`, response);
      }
    } catch (error) {
      console.warn(`🎭 Failed to load ${mediaType} genres from TMDB:`, error);
    }

    // Fallback to static genres
    console.log(`🎭 Using fallback ${mediaType} genres`);
    return fallbackGenres[mediaType] || [];
  }

  /**
   * Create genre selector dropdown
   */
  function createGenreSelector(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`🎭 Container ${containerId} not found`);
      return;
    }

    const {
      mainGenreId = 'mainGenre',
      subGenreId = 'subGenre', 
      mediaTypeId = 'mediaType',
      onSelectionChange = null,
      initialValues = {}
    } = options;

    // Create the selector HTML
    container.innerHTML = `
      <div class="genre-selector">
        <div class="genre-selector-row">
          <label for="${mainGenreId}" class="genre-label">Main Genre:</label>
          <select id="${mainGenreId}" class="genre-select">
            <option value="">Loading genres...</option>
          </select>
        </div>
        
        <div class="genre-selector-row">
          <label for="${subGenreId}" class="genre-label">Sub Genre:</label>
          <select id="${subGenreId}" class="genre-select">
            <option value="">Select main genre first</option>
          </select>
        </div>
        
        <div class="genre-selector-row">
          <label for="${mediaTypeId}" class="genre-label">Media Type:</label>
          <select id="${mediaTypeId}" class="genre-select">
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>
    `;

    const mainGenreSelect = document.getElementById(mainGenreId);
    const subGenreSelect = document.getElementById(subGenreId);
    const mediaTypeSelect = document.getElementById(mediaTypeId);

    // Populate main genre dropdown
    async function populateMainGenres() {
      try {
        const mediaType = mediaTypeSelect.value || 'movie';
        console.log(`🎭 Populating main genres for media type: ${mediaType}`);
        
        const genres = await loadGenres(mediaType);
        console.log(`🎭 Received ${genres.length} genres for ${mediaType}`);
        
        mainGenreSelect.innerHTML = '<option value="">Select main genre</option>';
        
        if (genres && genres.length > 0) {
          genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            mainGenreSelect.appendChild(option);
          });
          console.log(`🎭 Populated ${genres.length} main genres for ${mediaType}`);
        } else {
          console.warn(`🎭 No genres received for ${mediaType}`);
          mainGenreSelect.innerHTML = '<option value="">No genres available</option>';
        }

        // Set initial value if provided
        if (initialValues.mainGenre) {
          mainGenreSelect.value = initialValues.mainGenre;
          console.log(`🎭 Set initial main genre: ${initialValues.mainGenre}`);
        }

      } catch (error) {
        console.error('🎭 Error populating main genres:', error);
        mainGenreSelect.innerHTML = '<option value="">Error loading genres</option>';
      }
    }

    // Populate sub-genre dropdown based on main genre
    function populateSubGenres(mainGenreId) {
      subGenreSelect.innerHTML = '<option value="">Select sub genre</option>';
      
      if (!mainGenreId) {
        subGenreSelect.innerHTML = '<option value="">Select main genre first</option>';
        return;
      }

      const subGenres = subGenreMappings[mainGenreId] || [];
      
      subGenres.forEach(subGenre => {
        const option = document.createElement('option');
        option.value = subGenre.tmdbId;
        option.textContent = subGenre.name;
        subGenreSelect.appendChild(option);
      });

      // Set initial value if provided
      if (initialValues.subGenre) {
        subGenreSelect.value = initialValues.subGenre;
      }

      console.log(`🎭 Populated ${subGenres.length} sub genres for main genre ${mainGenreId}`);
    }

    // Event listeners
    mainGenreSelect.addEventListener('change', (e) => {
      const mainGenreId = e.target.value;
      populateSubGenres(mainGenreId);
      
      if (onSelectionChange) {
        onSelectionChange({
          mainGenre: mainGenreId,
          subGenre: '',
          mediaType: mediaTypeSelect.value
        });
      }
    });

    subGenreSelect.addEventListener('change', (e) => {
      if (onSelectionChange) {
        onSelectionChange({
          mainGenre: mainGenreSelect.value,
          subGenre: e.target.value,
          mediaType: mediaTypeSelect.value
        });
      }
    });

    mediaTypeSelect.addEventListener('change', (e) => {
      // Repopulate main genres when media type changes
      populateMainGenres();
      
      if (onSelectionChange) {
        onSelectionChange({
          mainGenre: mainGenreSelect.value,
          subGenre: subGenreSelect.value,
          mediaType: e.target.value
        });
      }
    });

    // Initialize with fallback
    populateMainGenres().catch(error => {
      console.error('🎭 Failed to populate genres, using fallback:', error);
      // Use fallback genres immediately
      const fallbackGenresList = fallbackGenres[mediaTypeSelect.value || 'movie'] || [];
      mainGenreSelect.innerHTML = '<option value="">Select main genre</option>';
      fallbackGenresList.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        mainGenreSelect.appendChild(option);
      });
    });
    
    // Set initial values
    if (initialValues.mediaType) {
      mediaTypeSelect.value = initialValues.mediaType;
    }
  }

  /**
   * Get current selection from a genre selector
   */
  function getGenreSelection(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const mainGenre = container.querySelector('.genre-selector select:nth-of-type(1)')?.value;
    const subGenre = container.querySelector('.genre-selector select:nth-of-type(2)')?.value;
    const mediaType = container.querySelector('.genre-selector select:nth-of-type(3)')?.value;

    return {
      mainGenre: mainGenre || '',
      subGenre: subGenre || '',
      mediaType: mediaType || 'movie'
    };
  }

  /**
   * Set genre selection programmatically
   */
  function setGenreSelection(containerId, selection) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const selects = container.querySelectorAll('.genre-selector select');
    if (selects.length >= 3) {
      selects[0].value = selection.mainGenre || '';
      selects[1].value = selection.subGenre || '';
      selects[2].value = selection.mediaType || 'movie';
    }
  }

  // Export functions to global scope
  window.CustomGenreSelector = {
    createGenreSelector,
    getGenreSelection,
    setGenreSelection,
    loadGenres,
    subGenreMappings
  };

  console.log('🎭 Custom genre selector loaded successfully');

})();