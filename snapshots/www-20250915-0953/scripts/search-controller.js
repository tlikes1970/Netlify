/* scripts/search-controller.js */
(function(){
  if (window.SearchController) return;
  const $ = (s)=>document.querySelector(s);

  // Grab a snapshot of any pre-existing search function (if defined before this file).
  // We also allow late-binding via window.legacyPerformSearch (see Patch B).
  let earlyLegacy = (typeof window.performSearch === 'function') ? window.performSearch.bind(window) : null;

  function showResultsUI(){
    // Get the current active tab section
    const currentTab = AppState.activeTab || 'home';
    const currentSection = document.getElementById(`${currentTab}Section`);
    
    if (currentSection) {
      // Hide all content within the current tab section
      const tabContent = currentSection.querySelectorAll('.section, .stats, .binge-banner, .section-header, .list-container');
      tabContent.forEach(el => {
        if (el) {
          el.style.display = 'none';
          el.classList.add('hidden');
        }
      });
      
      // Show search results - they're already positioned correctly in HTML
      const searchResults = $('#searchResults');
      if (searchResults) {
        // DON'T move search results - they're already in the right place
        searchResults.style.display = 'block';
        searchResults.classList.remove('hidden');
      }
    }
  }

  function hideResultsUI(){
    // Hide search results
    const searchResults = $('#searchResults');
    if (searchResults) {
      searchResults.style.display = 'none';
      searchResults.classList.add('hidden');
      
      // DON'T move search results - they're already in the right place
    }
    
    // Restore content in the current tab section
    const currentTab = AppState.activeTab || 'home';
    const currentSection = document.getElementById(`${currentTab}Section`);
    
    if (currentSection) {
      // Show all content within the current tab section
      const tabContent = currentSection.querySelectorAll('.section, .stats, .binge-banner, .section-header, .list-container');
      tabContent.forEach(el => {
        if (el) {
          el.style.display = 'block';
          el.classList.remove('hidden');
        }
      });
    }
      
    // optional: clear inputs
    const q = document.querySelector('#q'); if (q) q.value = '';
    const g = document.querySelector('#genre'); if (g) g.value = '';
  }

  function enterSearch(){
    if (!AppState.searchActive){
      AppState.searchActive = true;
      
      // Update tab system search state
      if (window.FlickletApp && typeof window.FlickletApp.setSearching === 'function') {
        window.FlickletApp.setSearching(true);
      }
      
      AppEvents.emit('search:enter', {});
    }
  }

  // Single, non-recursive entry-point
  function doSearch(query){
    // Prefer late-bound legacy, then early snapshot.
    const legacy = (typeof window.legacyPerformSearch === 'function')
      ? window.legacyPerformSearch
      : earlyLegacy;

    if (typeof legacy === 'function') {
      try { 
        // The legacy function reads from DOM, so we need to set the input value first
        if (query && typeof query === 'string') {
          const searchInput = document.querySelector('#searchInput');
          if (searchInput) {
            searchInput.value = query;
          }
        }
        legacy(); // Call without parameters since it reads from DOM
      }
      catch (e) { console.error('performSearch error', e); }
      return;
    }

    // Fallback: if no legacy exists, emit an event and let another module handle it.
    AppEvents.emit('search:request', { query });
  }

  window.SearchController = {
    perform(query){
      enterSearch();
      showResultsUI();
      doSearch(query);
    },
    clear(){
      hideResultsUI();
      
      // Reset search state
      AppState.searchActive = false;
      if (window.FlickletApp && typeof window.FlickletApp.setSearching === 'function') {
        window.FlickletApp.setSearching(false);
      }
      
      if (typeof window.clearSearchResults === 'function') {
        window.clearSearchResults();
      }
    }
  };

  // Events
  AppEvents.on('search:enter', showResultsUI);
  AppEvents.on('search:exit',  ()=> SearchController.clear());
  AppEvents.on('tab:change',   (e)=> { if (e.detail.tab !== 'search') hideResultsUI(); });

  // Compatibility adapter for old click handlers without touching window.performSearch
  if (!window.performSearchAdapter) {
    window.performSearchAdapter = (params)=> {
      // If params is an object with q and genre, extract the query
      const query = (typeof params === 'object' && params.q) ? params.q : params;
      window.SearchController.perform(query);
    };
  }

})();
