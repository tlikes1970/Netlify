/**
 * Search Module - Clean, consolidated search functionality
 * Purpose: Handle all search operations with proper state management
 * Data Source: TMDB API via searchTMDB function
 * Update Path: Modify search behavior here
 * Dependencies: tmdb.js, searchTMDB function
 */

(function () {
  'use strict';

  const NS = '[search]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  // Search state management
  let isSearching = false;
  let currentQuery = '';
  let searchTimeout = null;
  let previousTab = null; // Remember which tab was active before search

  // DOM elements cache
  let searchInput = null;
  let searchBtn = null;
  let clearBtn = null;
  let searchResults = null;
  let resultsList = null;
  let resultsCount = null;

  // Initialize search module
  function init() {
    log('Initializing search module...');

    // Cache DOM elements
    searchInput = document.getElementById('search');
    searchBtn = document.getElementById('searchBtn');
    clearBtn = document.getElementById('clearSearchBtn');
    searchResults = document.getElementById('searchResults');
    resultsList = document.getElementById('searchResultsList');
    resultsCount = document.getElementById('resultsCount');

    if (!searchInput || !searchBtn || !searchResults) {
      err('Required search elements not found');
      return false;
    }

    // Attach event listeners (only once)
    attachEventListeners();

    log('Search module initialized');
    return true;
  }

  // Attach all event listeners
  function attachEventListeners() {
    // Search button click
    searchBtn.addEventListener('click', handleSearchClick);

    // Clear button click
    if (clearBtn) {
      clearBtn.addEventListener('click', handleClearClick);
    }

    // Enter key in search input
    searchInput.addEventListener('keydown', handleKeyDown);

    // Input change for debouncing
    searchInput.addEventListener('input', handleInputChange);

    log('Event listeners attached');
  }

  // Handle search button click
  function handleSearchClick() {
    log('Search button clicked');
    performSearch();
  }

  // Handle clear button click
  function handleClearClick() {
    log('Clear button clicked');
    clearSearch();
  }

  // Handle key down events
  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      log('Enter key pressed');
      performSearch();
    }
  }

  // Handle input changes with debouncing
  function handleInputChange() {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debouncing (optional - can be removed if not needed)
    searchTimeout = setTimeout(() => {
      // Auto-search could be implemented here if desired
    }, 500);
  }

  // Main search function
  async function performSearch() {
    try {
      const query = searchInput.value.trim();

      if (!query) {
        log('No search query provided');
        return;
      }

      if (query === currentQuery && isSearching) {
        log('Same query already searching, skipping');
        return;
      }

      currentQuery = query;
      isSearching = true;

      // Notify FlickletApp of search state change
      if (window.FlickletApp && typeof window.FlickletApp.setSearching === 'function') {
        window.FlickletApp.setSearching(true);
      }

      log('Performing search for:', query);

      // Show loading state
      showLoadingState();

      // Check if searchTMDB is available
      if (typeof window.searchTMDB !== 'function') {
        throw new Error('searchTMDB function not available');
      }

      // Perform search
      const results = await window.searchTMDB(query);
      log('Search results received:', results);

      // Display results
      log('About to call displayResults with:', results);
      await displayResults(results);
      log('displayResults completed successfully');
    } catch (error) {
      err('Search failed:', error);
      showErrorState(error.message);
    } finally {
      isSearching = false;
    }
  }

  // Clear search
  function clearSearch() {
    log('Clearing search');

    // Prevent infinite loops by checking if already clearing
    if (isSearching === false && !searchResults.classList.contains('active') && searchInput.value === '') {
      log('Search already cleared, skipping');
      return;
    }

    // Clear input
    searchInput.value = '';
    currentQuery = '';
    isSearching = false;

    // Notify FlickletApp of search state change (only once)
    if (window.FlickletApp && typeof window.FlickletApp.setSearching === 'function') {
      window.FlickletApp.setSearching(false);
    }

    // Hide results
    if (searchResults) {
      searchResults.hidden = true;
      searchResults.classList.remove('active');
      searchResults.innerHTML = '';
      
      // Reset positioning styles
      searchResults.style.position = '';
      searchResults.style.top = '';
      searchResults.style.left = '';
      searchResults.style.right = '';
      searchResults.style.zIndex = '';
      searchResults.style.backgroundColor = '';
      searchResults.style.border = '';
      searchResults.style.borderRadius = '';
      searchResults.style.boxShadow = '';
    }

    // Show other tabs when search is cleared
    showOtherTabs();

    // Return to previous tab if available (but don't trigger another clear)
    if (previousTab && window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
      log(`Returning to previous tab: ${previousTab}`);
      const tabToSwitch = previousTab;
      previousTab = null; // Clear before switching to prevent loop
      window.FlickletApp.switchToTab(tabToSwitch);
    }

    // Clear timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }

    // Focus back to input
    searchInput.focus();
  }

  // Show loading state
  function showLoadingState() {
    if (!searchResults) return;

    // Hide other tabs when showing loading state
    hideOtherTabs();

    searchResults.hidden = false;
    searchResults.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 24px; margin-bottom: 10px;">🔍</div>
        <div>Searching for "${currentQuery}"...</div>
      </div>
    `;
  }

  // Show error state
  function showErrorState(message) {
    if (!searchResults) return;

    // Hide other tabs when showing error state
    hideOtherTabs();

    searchResults.hidden = false;
    searchResults.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #e74c3c;">
        <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
        <div>Search failed: ${message}</div>
        <button onclick="window.SearchModule.clearSearch()" style="margin-top: 10px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Try Again
        </button>
      </div>
    `;
  }

  // Display search results
  async function displayResults(results) {
    log('displayResults called with:', results);
    if (!searchResults) {
      log('ERROR: searchResults element not found');
      return;
    }

    log('Checking results structure:', {
      hasResults: !!results,
      hasResultsProperty: !!(results && results.results),
      hasDataProperty: !!(results && results.data),
      hasDataResults: !!(results && results.data && results.data.results),
      resultsLength: results?.results?.length || 0,
      dataResultsLength: results?.data?.results?.length || 0,
      resultsType: typeof results,
      resultsKeys: results ? Object.keys(results) : 'none',
      dataKeys: results?.data ? Object.keys(results.data) : 'none'
    });
    
    // Check for results in the correct structure
    const actualResults = results?.data?.results || results?.results;
    
    if (!results || !actualResults || actualResults.length === 0) {
      log('No results found, showing no results message');
      showNoResults();
      return;
    }

    // Filter out person results
    log('Filtering results, original count:', actualResults.length);
    const filteredResults = actualResults.filter((item) => item.media_type !== 'person');
    log('After filtering, count:', filteredResults.length);

    if (filteredResults.length === 0) {
      log('All results filtered out, showing no results message');
      showNoResults();
      return;
    }

    // Sort by popularity first, then by date for better relevance
    const sortedResults = filteredResults.sort((a, b) => {
      // Primary sort: by popularity (highest first) - this puts popular shows like Friends at the top
      const popularityA = a.popularity || 0;
      const popularityB = b.popularity || 0;
      const popularityComparison = popularityB - popularityA;
      if (popularityComparison !== 0) {
        return popularityComparison;
      }
      
      // Secondary sort: by vote average (highest first) - quality indicator
      const voteA = a.vote_average || 0;
      const voteB = b.vote_average || 0;
      const voteComparison = voteB - voteA;
      if (voteComparison !== 0) {
        return voteComparison;
      }
      
      // Tertiary sort: by date (newest first) - only if popularity and votes are equal
      const dateA = a.release_date || a.first_air_date || '';
      const dateB = b.release_date || b.first_air_date || '';
      const dateObjA = dateA ? new Date(dateA) : new Date(0);
      const dateObjB = dateB ? new Date(dateB) : new Date(0);
      return dateObjB - dateObjA;
    });

    // Update count
    if (resultsCount) {
      resultsCount.textContent = sortedResults.length;
    }

    // Hide ALL other content when showing search results
    hideAllContent();

    // Show search results section
    searchResults.hidden = false;
    searchResults.classList.add('active');

    // Use Cards V2 system if available, otherwise fallback to basic HTML
    log('Checking card rendering systems:', {
      renderSearchCardV2: typeof window.renderSearchCardV2,
      renderWithFallback: typeof renderWithFallback
    });
    
    if (window.renderSearchCardV2) {
      log('Using Cards V2 system');
      await renderWithCardsV2(sortedResults);
    } else {
      log('Using fallback system');
      renderWithFallback(sortedResults);
    }
  }

  // Render with Cards V2 system
  async function renderWithCardsV2(results) {
    log('Rendering with Cards V2 system');
    log('Cards V2 availability:', {
      renderSearchCardV2: typeof window.renderSearchCardV2,
      V2_ACTIONS: !!window.V2_ACTIONS
    });

    searchResults.innerHTML = `
      <h4>🎯 Search Results <span class="count">${results.length}</span></h4>
      <div class="poster-cards-grid" id="searchResultsGrid"></div>
    `;

    const searchGrid = document.getElementById('searchResultsGrid');
    if (!searchGrid) {
      log('ERROR: searchResultsGrid not found!');
      return;
    }

    log('Processing', results.length, 'results...');
    for (const item of results) {
      try {
        // Use toCardProps adapter to properly extract metadata
        const props = window.toCardProps ? window.toCardProps(item) : {
          id: item.id,
          mediaType: item.media_type || 'movie',
          title: item.title || item.name || 'Unknown',
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : '/assets/img/poster-placeholder.png',
          releaseDate: item.release_date || item.first_air_date || '',
          genre: item.genre || (item.genres && item.genres[0]?.name) || '',
          seasonEpisode: item.seasonEpisode || item.sxxExx || '',
          overview: item.overview || '',
          badges: [{ label: 'Search Result', type: 'default' }],
          whereToWatch: item.whereToWatch || '',
          userRating: item.userRating || item.rating || 0
        };
        
        // Enhance the item with detailed TMDB data if available
        let enhancedItem = item;
        if (window.enhanceTMDBItem && typeof window.enhanceTMDBItem === 'function') {
          try {
            log('Enhancing search item with detailed TMDB data...');
            enhancedItem = await window.enhanceTMDBItem(item);
            log('Enhanced search item:', enhancedItem);
            
            // Re-run toCardProps with enhanced data
            if (enhancedItem && enhancedItem !== item) {
              const enhancedProps = window.toCardProps ? window.toCardProps(enhancedItem) : props;
              Object.assign(props, enhancedProps);
            }
          } catch (error) {
            log('Failed to enhance search item, using original data:', error);
          }
        }
        
        const container = document.createElement('div');
        // Design spec: Search uses compact horizontal search variant with user stars, no Pro buttons
        const card = window.renderCardV2(container, props, { listType: 'search', context: 'search' });
        
        if (card) {
          // Store the enhanced item data in the card for addToListFromCache to access
          card.dataset.itemData = JSON.stringify(enhancedItem);
          searchGrid.appendChild(card);
          log('Added card for:', item.title || item.name);
        } else {
          log('WARNING: renderCardV2 returned null for:', item.title || item.name);
        }
      } catch (e) {
        log('Cards V2 render error:', e);
      }
    }
    log('Cards V2 rendering complete. Grid children:', searchGrid.children.length);
  }


  // Render with Cards V2 system
  function renderWithCard(results) {
    log('Rendering with Cards V2 system');

    searchResults.innerHTML = `
      <h4>🎯 Search Results <span class="count">${results.length}</span></h4>
      <div class="poster-cards-grid" id="searchResultsGrid"></div>
    `;

    const searchGrid = document.getElementById('searchResultsGrid');
    if (!searchGrid) return;

    results.forEach(async (item) => {
      try {
        // Use toCardProps adapter to properly extract metadata
        const props = window.toCardProps ? window.toCardProps(item) : {
          id: item.id,
          mediaType: item.media_type || 'movie',
          title: item.title || item.name || 'Unknown',
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : '/assets/img/poster-placeholder.png',
          releaseDate: item.release_date || item.first_air_date || '',
          genre: item.genre || (item.genres && item.genres[0]?.name) || '',
          seasonEpisode: item.seasonEpisode || item.sxxExx || '',
          overview: item.overview || '',
          badges: [{ label: 'Search Result', type: 'default' }],
          whereToWatch: item.whereToWatch || '',
          userRating: item.userRating || item.rating || 0
        };
        
        // Enhance the item with detailed TMDB data if available
        let enhancedItem = item;
        if (window.enhanceTMDBItem && typeof window.enhanceTMDBItem === 'function') {
          try {
            log('Enhancing search item with detailed TMDB data...');
            enhancedItem = await window.enhanceTMDBItem(item);
            log('Enhanced search item:', enhancedItem);
            
            // Re-run toCardProps with enhanced data
            if (enhancedItem && enhancedItem !== item) {
              const enhancedProps = window.toCardProps ? window.toCardProps(enhancedItem) : props;
              Object.assign(props, enhancedProps);
            }
          } catch (error) {
            log('Failed to enhance search item, using original data:', error);
          }
        }
        
        const container = document.createElement('div');
        // Design spec: Search uses compact horizontal search variant with user stars, no Pro buttons
        const card = window.renderCardV2(container, props, { listType: 'search', context: 'search' });
        
        if (card) {
          // Store the enhanced item data in the card for addToListFromCache to access
          card.dataset.itemData = JSON.stringify(enhancedItem);
          searchGrid.appendChild(card);
        }
      } catch (error) {
        warn('Error creating V2 card:', error);
      }
    });
  }

  // Legacy function removed - using Card component instead

  // Fallback rendering
  function renderWithFallback(results) {
    log('Rendering with fallback system');

    const resultsHtml = results
      .map((item) => {
        const title = item.title || item.name || 'Unknown';
        const year = item.release_date
          ? new Date(item.release_date).getFullYear()
          : item.first_air_date
            ? new Date(item.first_air_date).getFullYear()
            : '';
        const mediaType = item.media_type || 'movie';
        const poster = item.poster_path
          ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
          : '/assets/img/poster-placeholder.png';

        return `
        <div class="search-result-item" data-id="${item.id}" data-media-type="${mediaType}" style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="window.SearchModule.openItemDetails(${item.id}, '${mediaType}')">
          ${
            poster
              ? `<img src="${poster}" style="width: 60px; height: 90px; object-fit: cover; margin-right: 15px; border-radius: 4px;" alt="${title}">`
              : '<div style="width: 60px; height: 90px; background: #f0f0f0; margin-right: 15px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📺</div>'
          }
          <div style="flex: 1;">
            <h4 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">${title} ${year ? `(${year})` : ''}</h4>
            <p style="margin: 0; color: #666; text-transform: capitalize; font-size: 14px;">${mediaType}</p>
          </div>
        </div>
      `;
      })
      .join('');

    searchResults.innerHTML = `
      <h4>🎯 Search Results <span class="count">${results.length}</span></h4>
      <div class="search-results-list">${resultsHtml}</div>
    `;
  }

  // Show no results
  function showNoResults() {
    if (!searchResults) return;

    // Hide other tabs when showing no results
    hideOtherTabs();

    searchResults.hidden = false;
    searchResults.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 24px; margin-bottom: 10px;">🔍</div>
        <div>No results found for "${currentQuery}"</div>
        <div style="margin-top: 10px; color: #666; font-size: 14px;">Try different keywords or check your spelling</div>
      </div>
    `;
  }

  // Hide other tabs when search results are shown (but keep home tab visible)
  function hideOtherTabs() {
    // Remember current tab before hiding
    if (window.FlickletApp && window.FlickletApp.currentTab) {
      previousTab = window.FlickletApp.currentTab;
      log(`Remembered previous tab: ${previousTab}`);
    }

    // Use same tab IDs as app.js for consistency, but exclude home tab
    const TAB_IDS = ['watching', 'wishlist', 'watched', 'discover', 'settings'];
    TAB_IDS.forEach((tabId) => {
      const section = document.getElementById(`${tabId}Section`);
      if (section) {
        section.style.display = 'none';
        log(`Hidden tab: ${tabId}Section`);
      } else {
        log(`Tab section not found: ${tabId}Section`);
      }
    });

    // Hide home section during search (but keep tab button available)
    const homeSection = document.getElementById('homeSection');
    if (homeSection) {
      homeSection.hidden = true;
      log(`Home section hidden during search`);
    }
  }

  // Hide ALL content when search is active - more aggressive hiding
  function hideAllContent() {
    // Remember current tab before hiding
    if (window.FlickletApp && window.FlickletApp.currentTab) {
      previousTab = window.FlickletApp.currentTab;
      log(`Remembered previous tab: ${previousTab}`);
    }

    // Hide ALL main content sections including home
    const allSections = ['homeSection', 'watchingSection', 'wishlistSection', 'watchedSection', 'discoverSection', 'settingsSection'];
    allSections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.hidden = true;
        section.style.display = 'none';
        section.style.visibility = 'hidden';
        log(`Hidden content: ${sectionId}`);
      }
    });
    
    // Also hide any other content containers
    const contentContainers = document.querySelectorAll('.content, .main-content, .tab-content, [class*="content"]');
    contentContainers.forEach(container => {
      if (container.id !== 'searchResults') {
        container.style.display = 'none';
        container.style.visibility = 'hidden';
        log(`Hidden container: ${container.className || container.tagName}`);
      }
    });
  }

  // Show other tabs when search is cleared - clear inline styles and let tab system handle visibility
  function showOtherTabs() {
    // Clear inline styles that were set by hideAllContent()
    const allSections = ['homeSection', 'watchingSection', 'wishlistSection', 'watchedSection', 'discoverSection', 'settingsSection'];
    allSections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.style.display = '';
        section.style.visibility = '';
        log(`Cleared inline style for tab: ${sectionId}`);
      }
    });

    // Restore content containers
    const contentContainers = document.querySelectorAll('.content, .main-content, .tab-content, [class*="content"]');
    contentContainers.forEach(container => {
      if (container.id !== 'searchResults') {
        container.style.display = '';
        container.style.visibility = '';
        log(`Restored container: ${container.className || container.tagName}`);
      }
    });

    log(`Search cleared - tab system will handle panel visibility`);
  }

  // Open item details
  function openItemDetails(id, mediaType) {
    log('Opening item details:', id, mediaType);
    if (window.openTMDBLink) {
      window.openTMDBLink(id, mediaType);
    }
  }

  // Get search state
  function getSearchState() {
    return {
      isSearching: isSearching,
      currentQuery: currentQuery,
      hasResults: searchResults && searchResults.style.display !== 'none',
    };
  }

  // Public API
  window.SearchModule = {
    init,
    performSearch,
    clearSearch,
    getSearchState,
    openItemDetails,
  };

  // Expose performSearch globally for SearchController compatibility
  window.performSearch = performSearch;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
