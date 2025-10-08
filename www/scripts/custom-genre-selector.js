/* ========== custom-genre-selector.js ==========
   Custom Genre Selection System
   Handles dynamic genre/subgenre dropdowns for personalized rows
   Replaces the simple number input with rich genre selection
*/

(function () {
  'use strict';

  console.log('🎭 Custom Genre Selector loaded');

  // Genre data cache
  let genreCache = {
    movies: null,
    tv: null,
    subgenres: {}
  };

  /**
   * Process: Fallback Genre Data
   * Purpose: Provides basic genre data when TMDB API is unavailable
   * Data Source: Hardcoded common genres
   * Update Path: Add more genres as needed
   * Dependencies: None
   */
  function getFallbackGenres() {
    return [
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' },
      { id: 18, name: 'Drama' },
      { id: 27, name: 'Horror' },
      { id: 878, name: 'Sci-Fi' },
      { id: 16, name: 'Animation' },
      { id: 80, name: 'Crime' },
      { id: 99, name: 'Documentary' },
      { id: 12, name: 'Adventure' },
      { id: 10751, name: 'Family' },
      { id: 14, name: 'Fantasy' },
      { id: 36, name: 'History' },
      { id: 10402, name: 'Music' },
      { id: 9648, name: 'Mystery' },
      { id: 10749, name: 'Romance' },
      { id: 53, name: 'Thriller' },
      { id: 10752, name: 'War' },
      { id: 37, name: 'Western' }
    ];
  }

  // User's current selections
  let userSelections = [];

  // Initialize the genre selector system
  function initializeGenreSelector() {
    console.log('🎭 Initializing custom genre selector...');
    
    // Get the count input and genre container
    const countInput = document.getElementById('settingCustomRowsCount');
    const genreContainer = document.getElementById('genreDropdownsContainer');
    
    console.log('🎭 Count input found:', !!countInput, countInput);
    console.log('🎭 Genre container found:', !!genreContainer, genreContainer);
    
    if (!countInput || !genreContainer) {
      console.warn('🎭 Required elements not found for genre selector');
      return;
    }

    // Load saved selections
    loadUserSelections();

    // Set up count input listener
    countInput.addEventListener('input', handleCountChange);
    
    // Initial render
    renderGenreDropdowns();
  }

  /**
   * Process: Genre Data Fetching
   * Purpose: Fetches and caches TMDB genre data for movies and TV shows
   * Data Source: TMDB API via existing tmdbGet function
   * Update Path: Modify genre mapping or add new genre sources
   * Dependencies: tmdbGet, window.__GENRES__
   */
  async function fetchGenreData() {
    try {
      console.log('🎭 Fetching genre data from TMDB...');
      
      // Fetch both movie and TV genres
      const [movieResult, tvResult] = await Promise.all([
        window.tmdbGet('genre/movie/list'),
        window.tmdbGet('genre/tv/list')
      ]);

      // Check if requests were successful
      if (movieResult?.ok && movieResult?.data?.genres) {
        genreCache.movies = movieResult.data.genres;
        console.log('🎭 Loaded movie genres:', movieResult.data.genres.length);
      } else {
        console.warn('🎭 Failed to load movie genres, using fallback');
        genreCache.movies = getFallbackGenres();
      }

      if (tvResult?.ok && tvResult?.data?.genres) {
        genreCache.tv = tvResult.data.genres;
        console.log('🎭 Loaded TV genres:', tvResult.data.genres.length);
      } else {
        console.warn('🎭 Failed to load TV genres, using fallback');
        genreCache.tv = getFallbackGenres();
      }

      // Create subgenre mappings (this could be expanded with more specific subgenres)
      createSubgenreMappings();

      return true;
    } catch (error) {
      console.error('🎭 Error fetching genre data:', error);
      return false;
    }
  }

  /**
   * Process: Subgenre Mapping Creation
   * Purpose: Creates mappings from main genres to their subgenres
   * Data Source: Hardcoded mappings based on common TMDB genre combinations
   * Update Path: Add new genre/subgenre combinations as needed
   * Dependencies: genreCache
   */
  function createSubgenreMappings() {
    // Define subgenre mappings for common genres
    genreCache.subgenres = {
      // Action subgenres
      28: [
        { id: '28,12', name: 'Action & Adventure' },
        { id: '28,16', name: 'Action & Animation' },
        { id: '28,53', name: 'Action & Thriller' },
        { id: '28,878', name: 'Action & Sci-Fi' }
      ],
      // Comedy subgenres
      35: [
        { id: '35,16', name: 'Comedy & Animation' },
        { id: '35,18', name: 'Comedy & Drama' },
        { id: '35,10749', name: 'Romantic Comedy' },
        { id: '35,80', name: 'Comedy & Crime' }
      ],
      // Drama subgenres
      18: [
        { id: '18,80', name: 'Drama & Crime' },
        { id: '18,10749', name: 'Romantic Drama' },
        { id: '18,36', name: 'Historical Drama' },
        { id: '18,99', name: 'Documentary Drama' }
      ],
      // Horror subgenres
      27: [
        { id: '27,53', name: 'Horror & Thriller' },
        { id: '27,878', name: 'Horror & Sci-Fi' },
        { id: '27,9648', name: 'Horror & Mystery' },
        { id: '27,16', name: 'Horror & Animation' }
      ],
      // Sci-Fi subgenres
      878: [
        { id: '878,28', name: 'Sci-Fi & Action' },
        { id: '878,12', name: 'Sci-Fi & Adventure' },
        { id: '878,18', name: 'Sci-Fi & Drama' },
        { id: '878,16', name: 'Sci-Fi & Animation' }
      ],
      // Animation subgenres
      16: [
        { id: '16,28', name: 'Animation & Action' },
        { id: '16,35', name: 'Animation & Comedy' },
        { id: '16,12', name: 'Animation & Adventure' },
        { id: '16,18', name: 'Animation & Drama' }
      ]
    };

    console.log('🎭 Created subgenre mappings for', Object.keys(genreCache.subgenres).length, 'genres');
  }

  /**
   * Process: Count Change Handler
   * Purpose: Updates the number of genre dropdown rows when user changes count
   * Data Source: settingCustomRowsCount input value
   * Update Path: Modify to handle different count ranges or validation
   * Dependencies: renderGenreDropdowns, saveUserSelections
   */
  function handleCountChange(event) {
    const count = parseInt(event.target.value, 10);
    console.log('🎭 Count changed to:', count);
    
    // Validate count
    if (count < 1 || count > 3) {
      console.warn('🎭 Invalid count, resetting to 3');
      event.target.value = 3;
      return;
    }

    // Adjust user selections array
    while (userSelections.length < count) {
      userSelections.push({ genre: '', subgenre: '' });
    }
    while (userSelections.length > count) {
      userSelections.pop();
    }

    // Re-render dropdowns
    renderGenreDropdowns();
    
    // Save changes
    saveUserSelections();
  }

  /**
   * Process: Genre Dropdown Rendering
   * Purpose: Renders the dynamic genre selection interface
   * Data Source: userSelections array and genreCache
   * Update Path: Modify UI structure or add new dropdown types
   * Dependencies: genreCache, userSelections
   */
  function renderGenreDropdowns() {
    const container = document.getElementById('genreDropdownsContainer');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Create dropdown rows
    for (let i = 0; i < userSelections.length; i++) {
      const row = createGenreRow(i);
      container.appendChild(row);
    }

    console.log('🎭 Rendered', userSelections.length, 'genre dropdown rows');
  }

  /**
   * Process: Genre Row Creation
   * Purpose: Creates a single genre selection row with main and subgenre dropdowns
   * Data Source: genreCache and userSelections[i]
   * Update Path: Modify row structure or add new controls
   * Dependencies: genreCache, createDropdown
   */
  function createGenreRow(index) {
    const row = document.createElement('div');
    row.className = 'genre-row';
    row.dataset.index = index;

    const selection = userSelections[index] || { genre: '', subgenre: '' };

    row.innerHTML = `
      <div class="genre-row-label">Row ${index + 1}</div>
      <div class="genre-dropdowns">
        <div class="genre-dropdown">
          <select id="genre-${index}" data-type="genre">
            <option value="">Select Genre...</option>
          </select>
        </div>
        <div class="genre-dropdown">
          <select id="subgenre-${index}" data-type="subgenre" disabled>
            <option value="">Select Subgenre (Optional)</option>
          </select>
        </div>
      </div>
    `;

    // Populate genre dropdown
    const genreSelect = row.querySelector(`#genre-${index}`);
    populateGenreDropdown(genreSelect);

    // Set up event listeners
    genreSelect.addEventListener('change', (e) => handleGenreChange(index, e.target.value));
    
    const subgenreSelect = row.querySelector(`#subgenre-${index}`);
    subgenreSelect.addEventListener('change', (e) => handleSubgenreChange(index, e.target.value));

    // Set current values
    if (selection.genre) {
      genreSelect.value = selection.genre;
      handleGenreChange(index, selection.genre);
    }
    if (selection.subgenre) {
      subgenreSelect.value = selection.subgenre;
    }

    return row;
  }

  /**
   * Process: Genre Dropdown Population
   * Purpose: Populates a genre dropdown with available genres
   * Data Source: genreCache.movies and genreCache.tv
   * Update Path: Modify genre filtering or add new genre sources
   * Dependencies: genreCache
   */
  function populateGenreDropdown(select) {
    if (!genreCache.movies || !genreCache.tv) {
      console.warn('🎭 Genre cache not loaded, using fallback');
      // Fallback to basic genres
      const fallbackGenres = [
        { id: 28, name: 'Action' },
        { id: 35, name: 'Comedy' },
        { id: 18, name: 'Drama' },
        { id: 27, name: 'Horror' },
        { id: 878, name: 'Sci-Fi' },
        { id: 16, name: 'Animation' }
      ];
      
      fallbackGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        select.appendChild(option);
      });
      return;
    }

    // Combine and deduplicate genres from movies and TV
    const allGenres = [...genreCache.movies, ...genreCache.tv];
    const uniqueGenres = allGenres.filter((genre, index, self) => 
      index === self.findIndex(g => g.id === genre.id)
    );

    // Sort by name
    uniqueGenres.sort((a, b) => a.name.localeCompare(b.name));

    // Add options
    uniqueGenres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.id;
      option.textContent = genre.name;
      select.appendChild(option);
    });
  }

  /**
   * Process: Genre Change Handler
   * Purpose: Handles when user selects a main genre, updates subgenre dropdown
   * Data Source: genreCache.subgenres and userSelections
   * Update Path: Modify subgenre logic or add new genre combinations
   * Dependencies: genreCache, userSelections
   */
  function handleGenreChange(index, genreId) {
    console.log(`🎭 Genre changed for row ${index}:`, genreId);
    
    // Update user selection
    userSelections[index] = userSelections[index] || {};
    userSelections[index].genre = genreId;
    userSelections[index].subgenre = ''; // Reset subgenre

    // Update subgenre dropdown
    const subgenreSelect = document.getElementById(`subgenre-${index}`);
    if (!subgenreSelect) return;

    // Clear existing options
    subgenreSelect.innerHTML = '<option value="">Select Subgenre (Optional)</option>';
    
    if (genreId && genreCache.subgenres[genreId]) {
      // Enable subgenre dropdown and populate
      subgenreSelect.disabled = false;
      
      genreCache.subgenres[genreId].forEach(subgenre => {
        const option = document.createElement('option');
        option.value = subgenre.id;
        option.textContent = subgenre.name;
        subgenreSelect.appendChild(option);
      });
    } else {
      // Disable subgenre dropdown
      subgenreSelect.disabled = true;
    }

    // Save changes
    saveUserSelections();
  }

  /**
   * Process: Subgenre Change Handler
   * Purpose: Handles when user selects a subgenre
   * Data Source: userSelections
   * Update Path: Modify subgenre handling logic
   * Dependencies: userSelections, saveUserSelections
   */
  function handleSubgenreChange(index, subgenreId) {
    console.log(`🎭 Subgenre changed for row ${index}:`, subgenreId);
    
    // Update user selection
    userSelections[index] = userSelections[index] || {};
    userSelections[index].subgenre = subgenreId;

    // Save changes
    saveUserSelections();
  }

  /**
   * Process: User Selections Loading
   * Purpose: Loads saved genre selections from localStorage
   * Data Source: localStorage 'flicklet:custom:genres'
   * Update Path: Modify storage key or data structure
   * Dependencies: localStorage
   */
  function loadUserSelections() {
    try {
      const saved = localStorage.getItem('flicklet:custom:genres');
      if (saved) {
        userSelections = JSON.parse(saved);
        console.log('🎭 Loaded user selections:', userSelections);
      } else {
        // Initialize with default empty selections
        userSelections = [{ genre: '', subgenre: '' }, { genre: '', subgenre: '' }, { genre: '', subgenre: '' }];
      }
    } catch (error) {
      console.error('🎭 Error loading user selections:', error);
      userSelections = [{ genre: '', subgenre: '' }, { genre: '', subgenre: '' }, { genre: '', subgenre: '' }];
    }
  }

  /**
   * Process: User Selections Saving
   * Purpose: Saves current genre selections to localStorage
   * Data Source: userSelections array
   * Update Path: Modify storage key or data structure
   * Dependencies: localStorage
   */
  function saveUserSelections() {
    try {
      localStorage.setItem('flicklet:custom:genres', JSON.stringify(userSelections));
      console.log('🎭 Saved user selections:', userSelections);
    } catch (error) {
      console.error('🎭 Error saving user selections:', error);
    }
  }

  /**
   * Process: Genre Data Export
   * Purpose: Exports current selections for use by curated rows system
   * Data Source: userSelections array
   * Update Path: Modify export format or add new data fields
   * Dependencies: userSelections
   */
  function exportGenreSelections() {
    console.log('🎭 Exporting genre selections, current userSelections:', userSelections);
    const filtered = userSelections.filter(selection => selection.genre);
    console.log('🎭 Filtered selections with genres:', filtered);
    
    const result = filtered.map(selection => ({
      genre: selection.genre,
      subgenre: selection.subgenre,
      displayName: getDisplayName(selection)
    }));
    
    console.log('🎭 Final exported selections:', result);
    return result;
  }

  /**
   * Process: Display Name Generation
   * Purpose: Creates a human-readable name for a genre selection
   * Data Source: genreCache and userSelections
   * Update Path: Modify naming logic or add new display formats
   * Dependencies: genreCache
   */
  function getDisplayName(selection) {
    if (!selection.genre) return '';

    // Find genre name
    const allGenres = [...(genreCache.movies || []), ...(genreCache.tv || [])];
    const genre = allGenres.find(g => g.id == selection.genre);
    const genreName = genre ? genre.name : 'Unknown';

    if (selection.subgenre) {
      // Find subgenre name
      const subgenre = genreCache.subgenres[selection.genre]?.find(s => s.id === selection.subgenre);
      const subgenreName = subgenre ? subgenre.name : 'Unknown';
      return `${genreName} & ${subgenreName}`;
    }

    return genreName;
  }

  // Expose functions for use by other modules
  window.CustomGenreSelector = {
    initialize: initializeGenreSelector,
    fetchGenreData: fetchGenreData,
    exportSelections: exportGenreSelections,
    getDisplayName: getDisplayName
  };

  // Test function to add sample genre selections
  window.addTestGenres = function() {
    console.log('🧪 Adding test genre selections...');
    userSelections = [
      { genre: '28', subgenre: '' }, // Action
      { genre: '35', subgenre: '' }, // Comedy
      { genre: '18', subgenre: '' }  // Drama
    ];
    saveUserSelections();
    renderGenreDropdowns();
    console.log('🧪 Test genres added:', userSelections);
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeGenreSelector();
      fetchGenreData();
    });
  } else {
    initializeGenreSelector();
    fetchGenreData();
  }

})();
