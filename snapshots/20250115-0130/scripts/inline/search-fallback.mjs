/**
 * Process: Search Fallback
 * Purpose: Fallback search initialization to ensure search works
 * Data Source: DOM elements
 * Update Path: Runs on DOM ready
 * Dependencies: None
 */

(function() {
  'use strict';
  
  // Fallback search initialization to ensure search works
  function initializeSearchFallback() {
    console.log('🔍 Fallback search initialization starting...');
    
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (!searchBtn || !searchInput) {
      console.warn('🔍 Search elements not found, skipping fallback initialization');
      return;
    }
    
    // Set up search button
    if (searchBtn && !searchBtn.onclick) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          console.log('🔍 Fallback search triggered:', query);
          if (typeof window.performSearch === 'function') {
            window.performSearch();
          } else {
            console.warn('🔍 performSearch function not available');
          }
        }
      });
    }
    
    // Set up clear button
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchInput.value = '';
        searchInput.focus();
        console.log('🔍 Search cleared');
      });
    }
    
    // Set up enter key on input
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchBtn.click();
      }
    });
    
    console.log('✅ Fallback search initialization complete');
  }
  
  // Run immediately and also after a delay
  initializeSearchFallback();
  setTimeout(initializeSearchFallback, 2000);
  
})();
