(function () {
  'use strict';

  // Fallback search initialization to ensure search works
  function initializeSearchFallback() {
    console.log('🔍 Fallback search initialization starting...');

    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchInput = document.getElementById('search');

    if (searchBtn && typeof window.performSearch === 'function') {
      console.log('✅ Setting up search button (fallback)');
      searchBtn.onclick = function () {
        console.log('🔍 Search button clicked (fallback)');
        window.performSearch();
      };
    }

    if (clearSearchBtn && typeof window.clearSearch === 'function') {
      console.log('✅ Setting up clear search button (fallback)');
      clearSearchBtn.onclick = function () {
        console.log('🧹 Clear search button clicked (fallback)');
        window.clearSearch();
      };
    }

    if (searchInput && typeof window.performSearch === 'function') {
      console.log('✅ Setting up search input Enter key (fallback)');
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          console.log('⌨️ Enter key pressed (fallback)');
          e.preventDefault();
          window.performSearch();
        }
      });
    }

    console.log('✅ Fallback search initialization complete');
  }

  // Run immediately and also after a delay
  initializeSearchFallback();
  setTimeout(initializeSearchFallback, 2000);
})();
