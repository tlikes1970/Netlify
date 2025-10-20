/* ============== Home Sections Configuration (Single Source of Truth) ==============
   Centralized configuration for all home page sections
   This ensures consistency across the entire application
*/

(function () {
  'use strict';

  // Single source of truth for home sections
  window.HomeSectionsConfig = {
    // All home sections that should be shown/hidden based on tab
    // ORDER (LOCKED): 1. Group 1 2. Group 2 3. Group 3 4. Group 4 5. Group 5
    ALL_SECTIONS: [
      'group-1-your-shows',
      'group-2-community',
      'group-3-for-you',
      'group-4-theaters',
      'group-5-feedback',
    ],

    // Sections that are hidden during search
    SEARCH_HIDDEN_SECTIONS: [
      'group-1-your-shows',
      'group-2-community',
      'group-3-for-you',
      'group-4-theaters',
      'group-5-feedback',
    ],

    // Tab content sections
    TAB_SECTIONS: [
      'homeSection',
      'watchingSection',
      'wishlistSection',
      'watchedSection',
      'discoverSection',
    ],

    // Get sections for a specific context
    getSections: function (context) {
      switch (context) {
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
    isHomeSection: function (sectionId) {
      return this.ALL_SECTIONS.includes(sectionId);
    },

    // Get all section elements safely with caching
    getSectionElements: function (context) {
      const sectionIds = this.getSections(context);

      // Use DOM cache for better performance
      if (window.DOMCache) {
        return window.DOMCache.getMultiple(sectionIds);
      }

      // Fallback to direct DOM queries
      const elements = {};
      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          elements[id] = element;
        } else {
          FlickletDebug.warn('Home section not found:', id);
        }
      });

      return elements;
    },
  };

  FlickletDebug.info('🏠 Home Sections Configuration loaded');
})();
