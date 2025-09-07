/* ============== Centralized Language Manager ============== */

class LanguageManager {
  constructor() {
    this.isChangingLanguage = false;
    this.currentLang = 'en';
    this.observers = [];
  }

  // Initialize language manager
  init() {
    // Load saved language from appData
    if (window.appData?.settings?.lang) {
      this.currentLang = window.appData.settings.lang;
    }
    
    // Set up language dropdown
    this.setupLanguageDropdown();
    
    // Apply initial translations
    this.applyTranslations(this.currentLang);
    
    console.log('🌍 LanguageManager initialized with language:', this.currentLang);
  }

  // Set up language dropdown event handling
  setupLanguageDropdown() {
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      // Remove any existing event listeners
      langToggle.replaceWith(langToggle.cloneNode(true));
      const newLangToggle = document.getElementById('langToggle');
      
      // Add new event listener
      newLangToggle.addEventListener('change', (e) => {
        this.changeLanguage(e.target.value);
      });
      
      // Set current value
      newLangToggle.value = this.currentLang;
    }
  }

  // Main language change function - single source of truth
  async changeLanguage(newLang) {
    if (this.isChangingLanguage) {
      console.log('🌍 Language change already in progress, ignoring');
      return;
    }

    if (newLang === this.currentLang) {
      console.log('🌍 Language already set to:', newLang);
      return;
    }

    console.log('🌍 Changing language from', this.currentLang, 'to', newLang);
    
    this.isChangingLanguage = true;
    
    try {
      // Update current language
      this.currentLang = newLang;
      
      // Update all app data sources
      this.updateAppData(newLang);
      
      // Apply translations
      this.applyTranslations(newLang);
      
      // Update UI elements
      this.updateLanguageDependentUI(newLang);
      
      // Save to storage
      this.saveLanguage(newLang);
      
      // Show notification
      this.showLanguageChangeNotification(newLang);
      
      // Notify observers
      this.notifyObservers(newLang);
      
      console.log('✅ Language change completed successfully');
      
    } catch (error) {
      console.error('❌ Language change failed:', error);
      // Revert on error
      this.currentLang = this.currentLang; // Keep previous language
    } finally {
      this.isChangingLanguage = false;
    }
  }

  // Update all app data sources consistently
  updateAppData(newLang) {
    // Update window.appData
    if (window.appData?.settings) {
      window.appData.settings.lang = newLang;
    }
    
    // Update FlickletApp if available
    if (window.FlickletApp?.appData?.settings) {
      window.FlickletApp.appData.settings.lang = newLang;
    }
    
    // Update global appData reference
    if (typeof appData !== 'undefined' && appData?.settings) {
      appData.settings.lang = newLang;
    }
  }

  // Comprehensive translation application
  applyTranslations(lang) {
    // Apply to data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key, lang);
      if (translation && translation !== key) {
        el.textContent = translation;
      }
    });
    
    // Apply to placeholder elements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key, lang);
      if (translation && translation !== key) {
        el.placeholder = translation;
      }
    });
    
    // Apply to title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translation = this.t(key, lang);
      if (translation && translation !== key) {
        el.title = translation;
      }
    });
  }

  // Update language-dependent UI elements
  updateLanguageDependentUI(lang) {
    // Update language dropdown
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      langToggle.value = lang;
    }
    
    // Show loading state for lists
    const currentTab = document.querySelector(".tab.active")?.id?.replace("Tab", "");
    if (currentTab && ["watching", "wishlist", "watched"].includes(currentTab)) {
      const listContainer = document.getElementById(currentTab + "List");
      if (listContainer) {
        listContainer.innerHTML = `<div style="text-align: center; padding: 20px;">${this.t("loading", lang)}...</div>`;
      }
    }
    
    // Update search results if they exist
    if (Array.isArray(window.appData?.searchCache) && window.appData.searchCache.length > 0) {
      if (typeof displaySearchResults === 'function') {
        displaySearchResults(window.appData.searchCache);
      }
    }
    
    // Update current tab content
    if (typeof updateTabContent === 'function') {
      const activeTab = window.FlickletApp?.currentTab || 'home';
      updateTabContent(activeTab);
    }
    
    // Update list content
    if (typeof loadListContent === 'function') {
      ['watching', 'wishlist', 'watched'].forEach(listType => {
        loadListContent(listType);
      });
    }
    
    // Update home content
    if (typeof loadHomeContent === 'function') {
      loadHomeContent();
    }
    
    // Update stats
    if (typeof rebuildStats === 'function') {
      rebuildStats();
    }
    
    // Handle complex rehydration logic
    this.handleComplexRehydration(lang);
  }

  // Handle complex rehydration logic that was in the original functions
  async handleComplexRehydration(lang) {
    try {
      console.log('🔄 Starting complex rehydration for language:', lang);
      
      // Try to rehydrate lists with localized TMDB data
      if (typeof rehydrateListsForLocale === 'function') {
        console.log('🔄 Rehydrating lists for locale');
        await rehydrateListsForLocale(lang);
        console.log('✅ Lists rehydrated successfully');
      } else {
        console.warn('🔄 rehydrateListsForLocale function not available');
      }
      
      // Force refresh of genre dropdown
      setTimeout(() => {
        if (typeof loadGenres === "function") {
          console.log('🔄 Refreshing genres');
          loadGenres();
        } else {
          console.warn('🔄 loadGenres function not available');
        }
      }, 200);
      
      // Refresh curated rows (they use TMDB data)
      this.refreshCuratedContent(lang);
      
      // Refresh other dynamic content
      this.refreshDynamicContent(lang);
      
      console.log('✅ Complex rehydration completed');
      
    } catch (error) {
      console.error("❌ Failed to rehydrate lists for locale:", error);
    }
  }

  // Refresh curated content with new language
  refreshCuratedContent(lang) {
    console.log('🔄 Refreshing curated rows for language change');
    
    // Clear curated cache to force fresh data from TMDB
    const curatedKeys = ['curated:trending', 'curated:staff', 'curated:new'];
    curatedKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared ${key} cache`);
    });
    
    // Re-fetch curated data from TMDB in new language
    if (typeof window.seedCuratedData === 'function') {
      console.log('🔄 Re-seeding curated data from TMDB');
      window.seedCuratedData(lang).then(() => {
        console.log('🔄 Re-seeding completed, re-rendering curated rows');
        setTimeout(() => {
          if (typeof window.renderCuratedHomepage === 'function') {
            console.log('🔄 Calling renderCuratedHomepage');
            window.renderCuratedHomepage();
          } else {
            console.warn('🔄 renderCuratedHomepage function not available');
          }
          if (document.dispatchEvent) {
            console.log('🔄 Dispatching curated:rerender event');
            document.dispatchEvent(new CustomEvent('curated:rerender'));
          }
        }, 100);
      }).catch(error => {
        console.error('🔄 Re-seeding failed:', error);
        setTimeout(() => {
          if (typeof window.renderCuratedHomepage === 'function') {
            console.log('🔄 Calling renderCuratedHomepage (fallback)');
            window.renderCuratedHomepage();
          } else {
            console.warn('🔄 renderCuratedHomepage function not available (fallback)');
          }
          if (document.dispatchEvent) {
            console.log('🔄 Dispatching curated:rerender event (fallback)');
            document.dispatchEvent(new CustomEvent('curated:rerender'));
          }
        }, 100);
      });
    } else {
      console.warn('🔄 seedCuratedData function not available');
    }
  }

  // Refresh other dynamic content
  refreshDynamicContent(lang) {
    // Refresh trivia content
    if (typeof window.__FlickletRefreshTrivia === 'function') {
      console.log('🔄 Refreshing trivia content');
      try {
        window.__FlickletRefreshTrivia();
        console.log('✅ Trivia refresh completed');
      } catch (error) {
        console.error('❌ Trivia refresh failed:', error);
      }
    } else {
      console.warn('🔄 __FlickletRefreshTrivia function not available');
    }
    
    // Refresh series organizer content
    if (typeof window.__FlickletRefreshSeriesOrganizer === 'function') {
      console.log('🔄 Refreshing series organizer');
      try {
        window.__FlickletRefreshSeriesOrganizer();
        console.log('✅ Series organizer refresh completed');
      } catch (error) {
        console.error('❌ Series organizer refresh failed:', error);
      }
    } else {
      console.warn('🔄 __FlickletRefreshSeriesOrganizer function not available');
    }
    
    // Refresh tonight on content (upcoming episodes)
    const frontSpotlight = document.getElementById('frontSpotlight');
    if (frontSpotlight && typeof window.loadFrontSpotlight === 'function') {
      console.log('🔄 Refreshing tonight on content');
      window.loadFrontSpotlight();
    }
    
    // Refresh daily countdown and stats
    if (typeof window.startDailyCountdown === 'function') {
      console.log('🔄 Refreshing daily countdown');
      window.startDailyCountdown();
    }
    
    if (typeof window.updateFlickWordStats === 'function') {
      console.log('🔄 Refreshing FlickWord stats');
      window.updateFlickWordStats();
    }
    
    // Refresh spotlight/playlist content
    if (typeof window.__FlickletRefreshSpotlight === 'function') {
      console.log('🔄 Refreshing spotlight content');
      window.__FlickletRefreshSpotlight();
    }
    
    // Final refresh of horoscope and quote
    setTimeout(() => {
      const hEl = document.getElementById("fakeFortune");
      const qEl = document.getElementById("randomQuote");
      if (hEl && typeof pickDailyHoroscope === 'function') {
        hEl.textContent = pickDailyHoroscope();
      }
      if (qEl && typeof drawQuote === 'function') {
        qEl.textContent = drawQuote();
      }
      
      const fileInput = document.getElementById("importFile");
      if (fileInput && typeof updateFileLabel === 'function') {
        updateFileLabel(fileInput);
      }
      
      // Handle search results language change
      this.handleSearchResultsLanguageChange(lang);
    }, 600);
  }

  // Handle search results language change
  handleSearchResultsLanguageChange(lang) {
    const searchResults = document.getElementById('searchResults');
    if (searchResults && searchResults.style.display !== 'none') {
      console.log('🔄 Search results visible, re-performing search in new language');
      
      // Clear search cache to force fresh results in new language
      if (typeof window.searchItemCache !== 'undefined' && window.searchItemCache.clear) {
        console.log('🗑️ Clearing search cache for language change');
        window.searchItemCache.clear();
      }
      
      // Re-perform the search with the new language
      const searchInput = document.getElementById('searchInput');
      if (searchInput && searchInput.value.trim()) {
        console.log('🔍 Re-performing search with query:', searchInput.value);
        setTimeout(() => {
          if (typeof window.performSearch === 'function') {
            window.performSearch();
          }
        }, 100);
      } else {
        // No search query, just show the language change message
        searchResults.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;">
          <p>${this.t("search_results_cleared", lang)}</p>
          <p>${this.t("please_search_again", lang)}</p>
        </div>`;
      }
    }
  }

  // Save language to storage
  saveLanguage(lang) {
    try {
      // Save to localStorage
      if (window.saveAppData && typeof window.saveAppData === 'function') {
        window.saveAppData();
      } else {
        localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
      }
      console.log('🌍 Language saved to storage:', lang);
    } catch (error) {
      console.error('❌ Failed to save language:', error);
    }
  }

  // Translation function
  t(key, lang = this.currentLang) {
    if (window.I18N && window.I18N[lang] && window.I18N[lang][key]) {
      return window.I18N[lang][key];
    }
    if (window.I18N && window.I18N.en && window.I18N.en[key]) {
      return window.I18N.en[key];
    }
    return key;
  }

  // Observer pattern for components that need to react to language changes
  addObserver(callback) {
    this.observers.push(callback);
  }

  removeObserver(callback) {
    const index = this.observers.indexOf(callback);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notifyObservers(newLang) {
    this.observers.forEach(callback => {
      try {
        callback(newLang);
      } catch (error) {
        console.error('❌ Observer callback failed:', error);
      }
    });
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLang;
  }

  // Check if language change is in progress
  isLanguageChangeInProgress() {
    return this.isChangingLanguage;
  }

  // Show language change notification
  showLanguageChangeNotification(lang) {
    const langName = lang === 'es' ? 'Spanish' : 'English';
    let message = this.t('language_changed_to', lang);
    
    // Replace placeholder if it exists
    if (message && message.includes('{lang}')) {
      message = message.replace('{lang}', langName);
    } else {
      message = `Language changed to ${langName}`;
    }
    
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, 'success');
    } else {
      console.log('🌍', message);
    }
  }
}

// Create global instance
window.LanguageManager = new LanguageManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.LanguageManager.init();
  });
} else {
  window.LanguageManager.init();
}

// Expose changeLanguage globally for backward compatibility
window.changeLanguage = (newLang) => {
  return window.LanguageManager.changeLanguage(newLang);
};

// Expose other functions for backward compatibility
window.applyTranslations = (lang) => {
  return window.LanguageManager.applyTranslations(lang);
};

console.log('🌍 Language Manager loaded');
