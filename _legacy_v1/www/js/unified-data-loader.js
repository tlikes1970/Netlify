/* Unified Data Loader - Centralized data loading system */

(function() {
  'use strict';
  
  // UnifiedDataLoader implementation
  window.UnifiedDataLoader = {
    /**
     * Get currently watching items from app data
     */
    async getCurrentlyWatchingItems() {
      try {
        // Use existing app data if available
        if (window.appData && window.appData.tv && window.appData.movies) {
          const tvWatching = window.appData.tv.watching || [];
          const movieWatching = window.appData.movies.watching || [];
          return [...tvWatching, ...movieWatching];
        }
        
        // Fallback to localStorage
        const localData = localStorage.getItem('flicklet-data');
        if (localData) {
          const data = JSON.parse(localData);
          const tvWatching = data.tv?.watching || [];
          const movieWatching = data.movies?.watching || [];
          return [...tvWatching, ...movieWatching];
        }
        
        return [];
      } catch (error) {
        console.warn('UnifiedDataLoader: Error loading currently watching items:', error);
        return [];
      }
    },
    
    /**
     * Get wishlist items from app data
     */
    async getWishlistItems() {
      try {
        if (window.appData && window.appData.tv && window.appData.movies) {
          const tvWishlist = window.appData.tv.wishlist || [];
          const movieWishlist = window.appData.movies.wishlist || [];
          return [...tvWishlist, ...movieWishlist];
        }
        
        const localData = localStorage.getItem('flicklet-data');
        if (localData) {
          const data = JSON.parse(localData);
          const tvWishlist = data.tv?.wishlist || [];
          const movieWishlist = data.movies?.wishlist || [];
          return [...tvWishlist, ...movieWishlist];
        }
        
        return [];
      } catch (error) {
        console.warn('UnifiedDataLoader: Error loading wishlist items:', error);
        return [];
      }
    },
    
    /**
     * Get watched items from app data
     */
    async getWatchedItems() {
      try {
        if (window.appData && window.appData.tv && window.appData.movies) {
          const tvWatched = window.appData.tv.watched || [];
          const movieWatched = window.appData.movies.watched || [];
          return [...tvWatched, ...movieWatched];
        }
        
        const localData = localStorage.getItem('flicklet-data');
        if (localData) {
          const data = JSON.parse(localData);
          const tvWatched = data.tv?.watched || [];
          const movieWatched = data.movies?.watched || [];
          return [...tvWatched, ...movieWatched];
        }
        
        return [];
      } catch (error) {
        console.warn('UnifiedDataLoader: Error loading watched items:', error);
        return [];
      }
    }
  };
  
  function initUnifiedDataLoader() {
    console.log('Unified data loader initialized');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUnifiedDataLoader);
  } else {
    initUnifiedDataLoader();
  }
})();