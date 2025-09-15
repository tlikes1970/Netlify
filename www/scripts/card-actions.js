/**
 * Process: Global Card Actions
 * Purpose: Unified card action system for "Not interested" functionality across all lists
 * Data Source: window.appData, localStorage for persistence
 * Update Path: Modify action handlers or add new actions in this file
 * Dependencies: window.Toast, AppEvents, window.appData
 */

(function(){
  'use strict';
  
  if (window.CardActions) return; // Prevent double initialization
  
  console.log('🔧 Initializing global card actions system...');
  
  // Storage keys
  const STORAGE_KEYS = {
    NOT_INTERESTED: 'flicklet:notInterested',
    APP_DATA: 'flicklet-data'
  };
  
  // Initialize not interested list
  function initNotInterestedList() {
    if (!window.appData) {
      console.warn('🔧 CardActions: appData not available, initializing...');
      window.appData = {
        settings: { lang: 'en', theme: 'light', pro: false, notif: {} },
        tv: { watching: [], wishlist: [], watched: [] },
        movies: { watching: [], wishlist: [], watched: [] },
        searchCache: [],
        activeTagFilters: new Set(),
        notInterested: []
      };
    }
    
    if (!window.appData.notInterested) {
      window.appData.notInterested = [];
    }
  }
  
  // Save not interested item
  function saveNotInterested(itemId, mediaType, sourceList, itemData = null) {
    try {
      const item = {
        id: itemId,
        mediaType: mediaType || 'tv',
        sourceList: sourceList || 'unknown',
        timestamp: Date.now(),
        dateAdded: new Date().toISOString(),
        // Store full item data if available
        title: itemData?.title || itemData?.name || 'Unknown Title',
        poster: itemData?.poster_path || itemData?.poster_src || null,
        overview: itemData?.overview || null,
        year: itemData?.first_air_date ? new Date(itemData.first_air_date).getFullYear() : 
              itemData?.release_date ? new Date(itemData.release_date).getFullYear() : 
              itemData?.year || null
      };
      
      // Check if already exists
      const exists = window.appData.notInterested.some(entry => 
        entry.id === itemId && entry.mediaType === mediaType
      );
      
      if (!exists) {
        window.appData.notInterested.push(item);
        
        // Persist to localStorage
        if (typeof window.saveAppData === 'function') {
          window.saveAppData();
        } else {
          localStorage.setItem(STORAGE_KEYS.APP_DATA, JSON.stringify(window.appData));
        }
        
        console.log('🔧 Saved not interested item:', item);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('🔧 Failed to save not interested item:', error);
      return false;
    }
  }
  
  // Remove card from DOM
  function removeCardFromDOM(card) {
    if (!card) return;
    
    // Add removal animation
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateX(-100%)';
    
    setTimeout(() => {
      if (card.parentNode) {
        card.parentNode.removeChild(card);
      }
    }, 300);
  }
  
  // Show success notification
  function showSuccessNotification(itemTitle) {
    if (window.Toast && window.Toast.show) {
      window.Toast.show(`"${itemTitle}" hidden from your results`, 'success');
    } else if (window.showNotification) {
      window.showNotification(`"${itemTitle}" hidden from your results`, 'success');
    } else {
      console.log('🔧 Item hidden:', itemTitle);
    }
  }
  
  // Main not interested handler
  function handleNotInterested(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const btn = event.target.closest('[data-action="not-interested"], .btn-not-interested');
    if (!btn) return;
    
    const card = btn.closest('.curated-card, .list-card, .list-row, .card, .show-card');
    if (!card) return;
    
    // Prevent multiple clicks
    if (btn.disabled) {
      console.log('🔧 Button already disabled, ignoring click');
      return;
    }
    
    // Disable button and show loading state
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Removing…';
    
    try {
      // Extract item data
      const itemId = card.dataset.id || card.getAttribute('data-id');
      const mediaType = card.dataset.mediaType || card.getAttribute('data-media-type') || 'tv';
      const sourceList = card.dataset.sourceList || card.getAttribute('data-source-list') || 'unknown';
      const title = card.querySelector('h3, .title, .card-title, .show-title')?.textContent || 'Unknown item';
      
      if (!itemId) {
        console.warn('🔧 No item ID found for card:', card);
        btn.disabled = false;
        btn.textContent = originalText;
        return;
      }
      
      // Extract full item data for storage
      const imgElement = card.querySelector('img');
      const posterSrc = imgElement?.src || null;
      
      // Try to extract the original poster path from the image URL
      let posterPath = null;
      if (posterSrc && posterSrc.includes('image.tmdb.org')) {
        // Extract the path from the full TMDB URL
        const urlParts = posterSrc.split('/t/p/');
        if (urlParts.length > 1) {
          const pathWithSize = urlParts[1];
          const sizeMatch = pathWithSize.match(/^w\d+\/(.+)$/);
          if (sizeMatch) {
            posterPath = sizeMatch[1];
          }
        }
      }
      
      const itemData = {
        id: itemId,
        title: title,
        name: title, // Some systems use 'name' instead of 'title'
        media_type: mediaType,
        mediaType: mediaType,
        poster_path: posterPath,
        poster_src: posterSrc,
        overview: card.querySelector('.show-overview, .overview, .description')?.textContent || null,
        first_air_date: card.dataset.firstAirDate || null,
        release_date: card.dataset.releaseDate || null,
        year: card.dataset.year || null
      };
      
      // Debug: Log the extracted data
      console.log('🔧 Extracted item data for storage:', itemData);
      
      // Save to not interested list with full data
      const saved = saveNotInterested(itemId, mediaType, sourceList, itemData);
      
      if (saved) {
        // Remove from DOM
        removeCardFromDOM(card);
        
        // Show success notification
        showSuccessNotification(title);
        
        // Emit data change event
        if (window.AppEvents && window.AppEvents.emit) {
          window.AppEvents.emit('data:changed', { 
            reason: 'not-interested', 
            id: itemId, 
            mediaType: mediaType,
            sourceList: sourceList
          });
        }
        
        // Update counts if function exists
        if (typeof window.updateTabCounts === 'function') {
          window.updateTabCounts();
        }
        
        console.log('🔧 Successfully marked as not interested:', { itemId, mediaType, title });
      } else {
        // Item already in not interested list
        btn.textContent = 'Already hidden';
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = originalText;
        }, 2000);
      }
      
    } catch (error) {
      console.error('🔧 Error handling not interested:', error);
      btn.disabled = false;
      btn.textContent = originalText;
      
      // Show error notification
      if (window.Toast && window.Toast.show) {
        window.Toast.show('Failed to hide item. Please try again.', 'error');
      }
    }
  }
  
  // Check if item is not interested
  function isNotInterested(itemId, mediaType) {
    if (!window.appData || !window.appData.notInterested) return false;
    
    return window.appData.notInterested.some(entry => 
      entry.id == itemId && entry.mediaType === mediaType
    );
  }
  
  // Filter out not interested items from a list
  function filterNotInterested(items, mediaType) {
    if (!window.appData || !window.appData.notInterested) return items;
    
    return items.filter(item => !isNotInterested(item.id, mediaType));
  }
  
  // Initialize the system
  function init() {
    initNotInterestedList();
    
    // Add global event listener
    document.addEventListener('click', handleNotInterested);
    
    console.log('🔧 Global card actions system initialized');
  }
  
  // Public API
  window.CardActions = {
    notInterested: function(itemId, mediaType, sourceList, itemData) {
      const card = document.querySelector(`[data-id="${itemId}"]`);
      if (card) {
        const event = new Event('click', { bubbles: true });
        event.target = card.querySelector('[data-action="not-interested"], .btn-not-interested');
        if (event.target) {
          handleNotInterested(event);
        }
      } else if (itemData) {
        // Direct save if no card found but itemData provided
        saveNotInterested(itemId, mediaType, sourceList, itemData);
      }
    },
    isNotInterested: isNotInterested,
    filterNotInterested: filterNotInterested,
    saveNotInterested: saveNotInterested
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
