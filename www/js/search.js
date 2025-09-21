/**
 * Search Module - Clean, consolidated search functionality
 * Purpose: Handle all search operations with proper state management
 * Data Source: TMDB API via searchTMDB function
 * Update Path: Modify search behavior here
 * Dependencies: tmdb.js, searchTMDB function
 */

(function() {
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
      displayResults(results);
      
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
    
    // Clear input
    searchInput.value = '';
    currentQuery = '';
    isSearching = false;
    
    // Hide results
    if (searchResults) {
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
    }
    
    // Show other tabs when search is cleared
    showOtherTabs();
    
    // Return to previous tab if available
    if (previousTab && window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
      log(`Returning to previous tab: ${previousTab}`);
      window.FlickletApp.switchToTab(previousTab);
      previousTab = null;
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
    
    searchResults.style.display = 'block';
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
    
    searchResults.style.display = 'block';
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
  function displayResults(results) {
    if (!searchResults) return;
    
    if (!results || !results.results || results.results.length === 0) {
      showNoResults();
      return;
    }
    
    // Filter out person results
    const filteredResults = results.results.filter(item => item.media_type !== 'person');
    
    if (filteredResults.length === 0) {
      showNoResults();
      return;
    }
    
    // Update count
    if (resultsCount) {
      resultsCount.textContent = filteredResults.length;
    }
    
    // Hide other tabs when showing search results
    hideOtherTabs();
    
    // Show results
    searchResults.style.display = 'block';
    
    // Use Card system
    if (window.Card) {
      renderWithCard(filteredResults);
    } else {
      renderWithFallback(filteredResults);
    }
  }
  
  // Render with Card system
  function renderWithCard(results) {
    log('Rendering with Card system');
    
    searchResults.innerHTML = `
      <h4>🎯 Search Results <span class="count">${results.length}</span></h4>
      <div class="poster-cards-grid" id="searchResultsGrid"></div>
    `;
    
    const searchGrid = document.getElementById('searchResultsGrid');
    if (!searchGrid) return;
    
    results.forEach(item => {
      try {
        const card = window.Card({
          variant: 'poster',
          id: item.id,
          title: item.title || item.name,
          subtitle: item.release_date ? `${new Date(item.release_date).getFullYear()} • ${item.media_type === 'tv' ? 'TV Series' : 'Movie'}` : 
                   (item.media_type === 'tv' ? 'TV Series' : 'Movie'),
          posterUrl: item.poster_path ? (window.getPosterUrl ? window.getPosterUrl(item.poster_path, 'w200') : `https://image.tmdb.org/t/p/w200${item.poster_path}`) : null,
          rating: item.vote_average || 0,
          badges: [{ label: 'Search Result', kind: 'status' }],
          primaryAction: {
            label: 'View Details',
            onClick: () => {
              if (window.openTMDBLink) {
                window.openTMDBLink(item.id, item.media_type || 'movie');
              }
            }
          },
          overflowActions: [
            {
              label: 'Add to Watching',
              onClick: () => {
                if (window.addToWatching) {
                  window.addToWatching(item);
                }
              },
              icon: '➕'
            },
            {
              label: 'Add to Wishlist',
              onClick: () => {
                if (window.addToWishlist) {
                  window.addToWishlist(item);
                }
              },
              icon: '📖'
            }
          ],
          onOpenDetails: () => {
            if (window.openTMDBLink) {
              window.openTMDBLink(item.id, item.media_type || 'movie');
            }
          }
        });
        
        searchGrid.appendChild(card);
      } catch (error) {
        warn('Error creating Card:', error);
      }
    });
  }
  
  // Legacy function removed - using Card component instead
  
  // Fallback rendering
  function renderWithFallback(results) {
    log('Rendering with fallback system');
    
    const resultsHtml = results.map(item => {
      const title = item.title || item.name || 'Unknown';
      const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                  item.first_air_date ? new Date(item.first_air_date).getFullYear() : '';
      const mediaType = item.media_type || 'movie';
      const poster = item.poster_path ? (window.getPosterUrl ? window.getPosterUrl(item.poster_path, 'w200') : `https://image.tmdb.org/t/p/w200${item.poster_path}`) : '';
      
      return `
        <div class="search-result-item" data-id="${item.id}" data-media-type="${mediaType}" style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="window.SearchModule.openItemDetails(${item.id}, '${mediaType}')">
          ${poster ? `<img src="${poster}" style="width: 60px; height: 90px; object-fit: cover; margin-right: 15px; border-radius: 4px;" alt="${title}">` : 
            '<div style="width: 60px; height: 90px; background: #f0f0f0; margin-right: 15px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📺</div>'}
          <div style="flex: 1;">
            <h4 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">${title} ${year ? `(${year})` : ''}</h4>
            <p style="margin: 0; color: #666; text-transform: capitalize; font-size: 14px;">${mediaType}</p>
          </div>
        </div>
      `;
    }).join('');
    
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
    
    searchResults.style.display = 'block';
    searchResults.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 24px; margin-bottom: 10px;">🔍</div>
        <div>No results found for "${currentQuery}"</div>
        <div style="margin-top: 10px; color: #666; font-size: 14px;">Try different keywords or check your spelling</div>
      </div>
    `;
  }
  
  // Hide other tabs when search results are shown
  function hideOtherTabs() {
    // Remember current tab before hiding
    if (window.FlickletApp && window.FlickletApp.currentTab) {
      previousTab = window.FlickletApp.currentTab;
      log(`Remembered previous tab: ${previousTab}`);
    }
    
    // Use same tab IDs as app.js for consistency
    const TAB_IDS = ['home', 'watching', 'wishlist', 'watched', 'discover', 'settings'];
    TAB_IDS.forEach(tabId => {
      const section = document.getElementById(`${tabId}Section`);
      if (section) {
        section.style.display = 'none';
        log(`Hidden tab: ${tabId}Section`);
      } else {
        log(`Tab section not found: ${tabId}Section`);
      }
    });
  }
  
  // Show other tabs when search is cleared
  function showOtherTabs() {
    // Use same tab IDs as app.js for consistency
    const TAB_IDS = ['home', 'watching', 'wishlist', 'watched', 'discover', 'settings'];
    TAB_IDS.forEach(tabId => {
      const section = document.getElementById(`${tabId}Section`);
      if (section) {
        section.style.display = '';
        log(`Shown tab: ${tabId}Section`);
      } else {
        log(`Tab section not found: ${tabId}Section`);
      }
    });
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
      hasResults: searchResults && searchResults.style.display !== 'none'
    };
  }
  
  // Public API
  window.SearchModule = {
    init,
    performSearch,
    clearSearch,
    getSearchState,
    openItemDetails
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
