/* ========== curated-genre-settings.js ==========
   Settings integration for curated row genre customization
   Handles loading, saving, and applying genre preferences
*/

(function() {
  'use strict';

  console.log('🎯 Curated genre settings loading...');

  // Default genre configurations
  const DEFAULT_GENRES = [
    {
      mainGenre: '18', // Drama
      subGenre: '80',  // Crime
      mediaType: 'both',
      title: 'Drama & Crime'
    },
    {
      mainGenre: '35', // Comedy
      subGenre: '10749', // Romance
      mediaType: 'both',
      title: 'Comedy & Romance'
    },
    {
      mainGenre: '878', // Sci-Fi
      subGenre: '10765', // Sci-Fi & Fantasy
      mediaType: 'both',
      title: 'Sci-Fi & Fantasy'
    }
  ];

  // Storage key for genre preferences
  const STORAGE_KEY = 'flicklet:curated:genres';

  /**
   * Load saved genre preferences from localStorage
   */
  function loadGenrePreferences() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🎯 Loaded saved genre preferences:', parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('🎯 Error loading genre preferences:', error);
    }
    
    console.log('🎯 Using default genre preferences');
    return DEFAULT_GENRES;
  }

  /**
   * Save genre preferences to localStorage
   */
  function saveGenrePreferences(preferences) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      console.log('🎯 Saved genre preferences:', preferences);
      
      // Update status indicator
      const status = document.getElementById('curatedGenresStatus');
      if (status) {
        status.textContent = '✅ Saved';
        status.style.color = '#10b981';
        setTimeout(() => {
          status.textContent = 'Auto-saves';
          status.style.color = '';
        }, 2000);
      }
      
      // Dispatch event to update curated rows
      document.dispatchEvent(new CustomEvent('curated:genres:updated', {
        detail: { preferences }
      }));
      
    } catch (error) {
      console.error('🎯 Error saving genre preferences:', error);
    }
  }

  /**
   * Initialize genre selectors in settings
   */
  function initializeGenreSelectors() {
    const preferences = loadGenrePreferences();
    
    // Initialize each curated row genre selector
    for (let i = 1; i <= 3; i++) {
      const containerId = `curatedGenre${i}`;
      const preference = preferences[i - 1] || DEFAULT_GENRES[i - 1];
      
      if (window.CustomGenreSelector) {
        window.CustomGenreSelector.createGenreSelector(containerId, {
          mainGenreId: `mainGenre${i}`,
          subGenreId: `subGenre${i}`,
          mediaTypeId: `mediaType${i}`,
          initialValues: preference,
          onSelectionChange: (selection) => {
            console.log(`🎯 Genre selection changed for row ${i}:`, selection);
            
            // Update preferences
            const currentPreferences = loadGenrePreferences();
            currentPreferences[i - 1] = {
              ...selection,
              title: generateTitle(selection)
            };
            
            saveGenrePreferences(currentPreferences);
          }
        });
      } else {
        console.warn('🎯 CustomGenreSelector not available');
      }
    }
  }

  /**
   * Generate a title based on genre selection
   */
  function generateTitle(selection) {
    const { mainGenre, subGenre, mediaType } = selection;
    
    if (!mainGenre) return 'Custom Row';
    
    // Get genre names from TMDB or fallback
    const mainGenreName = getGenreName(mainGenre);
    const subGenreName = subGenre ? getGenreName(subGenre) : '';
    
    let title = mainGenreName;
    if (subGenreName && subGenreName !== mainGenreName) {
      title += ` & ${subGenreName}`;
    }
    
    return title;
  }

  /**
   * Get genre name by ID (with fallback)
   */
  function getGenreName(genreId) {
    const fallbackGenres = {
      '18': 'Drama',
      '35': 'Comedy',
      '28': 'Action',
      '27': 'Horror',
      '878': 'Sci-Fi',
      '12': 'Adventure',
      '16': 'Animation',
      '80': 'Crime',
      '99': 'Documentary',
      '14': 'Fantasy',
      '36': 'History',
      '10402': 'Music',
      '9648': 'Mystery',
      '10749': 'Romance',
      '53': 'Thriller',
      '10759': 'Action & Adventure',
      '10765': 'Sci-Fi & Fantasy',
      '10768': 'War & Politics',
      '10762': 'Kids',
      '10763': 'News',
      '10764': 'Reality',
      '10766': 'Soap',
      '10767': 'Talk',
      '10770': 'TV Movie'
    };
    
    return fallbackGenres[genreId] || `Genre ${genreId}`;
  }

  /**
   * Reset to default genres
   */
  function resetToDefaults() {
    console.log('🎯 Resetting to default genres');
    saveGenrePreferences(DEFAULT_GENRES);
    
    // Reinitialize selectors with defaults
    setTimeout(() => {
      initializeGenreSelectors();
    }, 100);
  }

  /**
   * Get current genre preferences
   */
  function getCurrentGenrePreferences() {
    return loadGenrePreferences();
  }

  /**
   * Initialize the settings integration
   */
  function initializeSettings() {
    console.log('🎯 Initializing curated genre settings...');
    
    // Wait for CustomGenreSelector to be available
    const checkForSelector = () => {
      if (window.CustomGenreSelector) {
        initializeGenreSelectors();
        
        // Set up reset button
        const resetBtn = document.getElementById('resetCuratedGenres');
        if (resetBtn) {
          resetBtn.addEventListener('click', resetToDefaults);
        }
        
        console.log('🎯 Curated genre settings initialized');
      } else {
        setTimeout(checkForSelector, 100);
      }
    };
    
    checkForSelector();
  }

  // Export functions to global scope
  window.CuratedGenreSettings = {
    loadGenrePreferences,
    saveGenrePreferences,
    getCurrentGenrePreferences,
    resetToDefaults,
    DEFAULT_GENRES
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSettings);
  } else {
    initializeSettings();
  }

  console.log('🎯 Curated genre settings loaded');

})();
