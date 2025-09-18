/**
 * Simple Router for Home Layout v2
 * Handles navigation between Home and Search views
 */

(function() {
  'use strict';

  console.log('🛣️ Router loaded');

  // Current route state
  let currentRoute = 'home';
  let currentParams = {};

  // Route handlers
  const routes = {
    home: {
      path: '/',
      handler: showHome
    },
    search: {
      path: '/search',
      handler: showSearch
    }
  };

  // Show Home view
  function showHome() {
    console.log('🏠 Showing Home view');
    currentRoute = 'home';
    
    // Hide search results
    const searchSection = document.getElementById('searchSection');
    if (searchSection) {
      searchSection.style.display = 'none';
    }

    // Home content visibility is now handled by the tab switching system
    // No need to force display here

    // Update URL without page reload
    if (history.pushState) {
      history.pushState({ route: 'home' }, '', '/');
    }
  }

  // Show Search view
  function showSearch(params = {}) {
    console.log('🔍 Showing Search view', params);
    currentRoute = 'search';
    currentParams = params;

    // Hide home content
    const homeSection = document.getElementById('homeSection');
    if (homeSection) {
      homeSection.style.display = 'none';
    }

    // Show search results
    const searchSection = document.getElementById('searchSection');
    if (searchSection) {
      searchSection.style.display = 'block';
    } else {
      createSearchSection();
    }

    // Update URL without page reload
    const searchUrl = params.q ? `/search?q=${encodeURIComponent(params.q)}` : '/search';
    if (history.pushState) {
      history.pushState({ route: 'search', params }, '', searchUrl);
    }

    // Trigger search if query provided
    if (params.q) {
      performSearch(params.q);
    }
  }

  // Create search section if it doesn't exist
  function createSearchSection() {
    const container = document.querySelector('.tab-section-container') || document.body;
    const searchHTML = `
      <div id="searchSection" class="tab-section" style="display: none;">
        <div class="search-results-header">
          <h2 data-i18n="search.results">Search Results</h2>
          <button class="btn btn-secondary" id="back-to-home">
            <span data-i18n="common.back">Back to Home</span>
          </button>
        </div>
        <div id="searchResults" class="search-results-container">
          <p data-i18n="search.no_query">Enter a search term to find shows and movies</p>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', searchHTML);

    // Set up back button
    const backBtn = document.getElementById('back-to-home');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        navigate('/');
      });
    }
  }

  // Perform search
  function performSearch(query) {
    console.log('🔍 Performing search for:', query);
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;

    // Show loading state
    resultsContainer.innerHTML = '<p data-i18n="search.loading">Searching...</p>';

    // Simulate search (replace with actual search implementation)
    setTimeout(() => {
      // For now, show placeholder results
      resultsContainer.innerHTML = `
        <div class="search-results-grid">
          <p>Search results for "${query}" would appear here.</p>
          <p>This will be integrated with your existing search functionality.</p>
        </div>
      `;
    }, 500);
  }

  // Navigate to a route
  function navigate(path, params = {}) {
    console.log('🛣️ Navigating to:', path, params);
    
    if (path === '/' || path === '') {
      showHome();
    } else if (path.startsWith('/search')) {
      const urlParams = new URLSearchParams(path.split('?')[1] || '');
      const searchParams = {};
      if (urlParams.has('q')) {
        searchParams.q = urlParams.get('q');
      }
      showSearch({ ...params, ...searchParams });
    } else {
      console.warn('Unknown route:', path);
    }
  }

  // Handle browser back/forward
  function handlePopState(event) {
    console.log('🛣️ PopState event:', event.state);
    if (event.state) {
      if (event.state.route === 'home') {
        showHome();
      } else if (event.state.route === 'search') {
        showSearch(event.state.params || {});
      }
    } else {
      // Default to home
      showHome();
    }
  }

  // Initialize router
  function initRouter() {
    // Set up popstate handler
    window.addEventListener('popstate', handlePopState);

    // Handle initial route
    const initialPath = window.location.pathname;
    const initialParams = new URLSearchParams(window.location.search);
    const params = {};
    
    if (initialParams.has('q')) {
      params.q = initialParams.get('q');
    }

    navigate(initialPath, params);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouter);
  } else {
    initRouter();
  }

  // Expose globally
  window.router = {
    navigate,
    showHome,
    showSearch,
    getCurrentRoute: () => currentRoute,
    getCurrentParams: () => currentParams
  };

})();
