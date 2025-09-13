/* ============== Home Sections Configuration (Single Source of Truth) ==============
   Centralized configuration for all home page sections
   This ensures consistency across the entire application
*/

(function() {
  'use strict';
  
  // Single source of truth for home sections
  window.HomeSectionsConfig = {
    // All home sections that should be shown/hidden based on tab
    // ORDER (LOCKED): 1. My Library 2. Community 3. Curated 4. Personalized 5. Theaters 6. Additional 7. Feedback
    ALL_SECTIONS: [
      'currentlyWatchingPreview', 
      'next-up-row',
      'community-section',
      'spotlight-row',
      'curated-section',
      'curatedSections',
      'personalized-section',
      'theaters-section',
      'upcomingEpisodes',
      'quote-flickword-container',
      'quoteCard',
      'randomQuoteCard',
      'bingeBanner',
      'feedbackSection'
    ],
    
    // Sections that are hidden during search
    SEARCH_HIDDEN_SECTIONS: [
      'currentlyWatchingPreview',
      'next-up-row',
      'community-section',
      'spotlight-row',
      'curated-section',
      'curatedSections',
      'personalized-section',
      'theaters-section',
      'upcomingEpisodes',
      'triviaTile',
      'flickwordTile', 
      'quote-flickword-container',
      'feedbackSection'
    ],
    
    // Tab content sections
    TAB_SECTIONS: [
      'homeSection',
      'watchingSection', 
      'wishlistSection',
      'watchedSection',
      'discoverSection'
    ],
    
    // Get sections for a specific context
    getSections: function(context) {
      switch(context) {
        case 'tab-switch':
          return this.ALL_SECTIONS;
        case 'search-hide':
          return this.SEARCH_HIDDEN_SECTIONS;
        case 'search-show':
          return this.SEARCH_HIDDEN_SECTIONS;
        case 'tab-content':
          return this.TAB_SECTIONS;
        default:
          FlickletDebug.warn('Unknown home sections context:', context);
          return [];
      }
    },
    
    // Check if a section is a home section
    isHomeSection: function(sectionId) {
      return this.ALL_SECTIONS.includes(sectionId);
    },
    
    // Get all section elements safely with caching
    getSectionElements: function(context) {
      const sectionIds = this.getSections(context);
      
      // Use DOM cache for better performance
      if (window.DOMCache) {
        return window.DOMCache.getMultiple(sectionIds);
      }
      
      // Fallback to direct DOM queries
      const elements = {};
      sectionIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          elements[id] = element;
        } else {
          FlickletDebug.warn('Home section not found:', id);
        }
      });
      
      return elements;
    }
  };
  
  FlickletDebug.info('🏠 Home Sections Configuration loaded');
})();
