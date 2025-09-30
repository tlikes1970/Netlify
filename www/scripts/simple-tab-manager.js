/* ============== Simple Tab Manager ==============
   Simplified tab visibility management to prevent conflicts
*/

(function () {
  'use strict';

  const SimpleTabManager = {
    isSearching: false,
    currentTab: 'home',

    // Set search state
    setSearching: function (searching) {
      this.isSearching = searching;
      this.updateTabVisibility();
      FlickletDebug.info('🔍 Search state changed:', searching);
    },

    // Set current tab
    setCurrentTab: function (tab) {
      this.currentTab = tab;
      this.updateTabVisibility();
      FlickletDebug.info('🔄 Current tab changed:', tab);
    },

    // Update tab visibility based on current state
    updateTabVisibility: function () {
      const allTabs = ['homeTab', 'watchingTab', 'wishlistTab', 'watchedTab', 'discoverTab'];

      allTabs.forEach((tabId) => {
        const tab = document.getElementById(tabId);
        if (!tab) return;

        if (this.isSearching) {
          // During search: show all tabs
          tab.classList.remove('hidden', 'active');
          FlickletDebug.info(`🔍 Search mode - showing tab: ${tabId}`);
        } else {
          // Normal mode: hide current tab, show others
          const isCurrentTab = tabId === `${this.currentTab}Tab`;
          if (isCurrentTab) {
            tab.classList.add('hidden');
            tab.classList.remove('active');
            FlickletDebug.info(`✅ Hidden current tab: ${tabId}`);
          } else {
            tab.classList.remove('hidden', 'active');
            FlickletDebug.info(`✅ Shown tab: ${tabId}`);
          }
        }
      });
    },

    // Switch to a tab
    switchToTab: function (tab) {
      this.setCurrentTab(tab);

      // Clear search when switching tabs (unless switching to home while already searching)
      if (this.isSearching && tab !== 'home') {
        FlickletDebug.info('🧹 Clearing search due to tab switch to:', tab);
        this.clearSearch();
      }

      // Update section visibility
      const allSections = [
        'homeSection',
        'watchingSection',
        'wishlistSection',
        'watchedSection',
        'discoverSection',
        'settingsSection',
      ];
      allSections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.classList.toggle('active', sectionId === `${tab}Section`);
          section.style.display = '';
        }
      });

      // Update home sections visibility
      this.updateHomeSections(tab === 'home');
    },

    // Clear search
    clearSearch: function () {
      FlickletDebug.info('🧹 SimpleTabManager clearing search');

      // Clear search input
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.value = '';
      }

      // Hide search results
      const searchResults = document.getElementById('searchResults');
      if (searchResults) {
        searchResults.style.display = 'none';
      }

      // Set search state to false
      this.setSearching(false);

      // Show home sections
      this.updateHomeSections(true);

      // Call global clearSearch if available
      if (typeof window.clearSearch === 'function') {
        window.clearSearch();
      }
    },

    // Update home sections visibility
    updateHomeSections: function (showHome) {
      const homeSections = [
        'curatedSections',
        'currentlyWatchingPreview',
        'up-next-row',
        'spotlight-row',
        'quote-flickword-container',
        'feedbackSection',
        'theaters-section',
      ];

      homeSections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.style.display = showHome ? 'block' : 'none';
        }
      });
    },
  };

  // Expose globally
  window.SimpleTabManager = SimpleTabManager;

  // Override the complex systems
  if (window.FlickletApp) {
    // Override the complex tab switching
    const originalSwitchToTab = window.FlickletApp.switchToTab;
    window.FlickletApp.switchToTab = function (tab) {
      FlickletDebug.info('🔄 SimpleTabManager handling tab switch:', tab);
      SimpleTabManager.switchToTab(tab);

      // Call original for other functionality
      if (originalSwitchToTab) {
        originalSwitchToTab.call(this, tab);
      }
    };

    // Override search state management
    Object.defineProperty(window.FlickletApp, 'isSearching', {
      get: function () {
        return SimpleTabManager.isSearching;
      },
      set: function (value) {
        SimpleTabManager.setSearching(value);
      },
    });
  }

  FlickletDebug.info('🧩 Simple Tab Manager loaded');
})();
