/**
 * Process: Inline Script 02 - Core App Functions
 * Purpose: Essential app functionality including Firebase data loading
 * Data Source: User data from Firebase Firestore
 * Update Path: Modify when app logic or data structure changes
 * Dependencies: Firebase SDK, appData global, FlickletDebug
 */

// Firebase data loading functions
(function() {
  'use strict';

  // Sanitize data for Firestore compatibility
  function sanitizeForFirestore(value) {
    if (value === null || value === undefined) return null;
    
    if (Array.isArray(value)) {
      return value.map(item => sanitizeForFirestore(item));
    }
    
    if (typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        if (v !== null && v !== undefined) {
          out[k] = sanitizeForFirestore(v);
        }
      }
      return out;
    }
    
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    
    return undefined;
  }

  async function loadUserDataFromCloud(uid) {
    try {
      const snap = await db.collection("users").doc(uid).get();
      if (!snap.exists) {
        FlickletDebug.info('🔄 No Firebase document found, clearing local data');
        // Clear local data when no Firebase document exists
        appData.tv = { watching: [], wishlist: [], watched: [] };
        appData.movies = { watching: [], wishlist: [], watched: [] };
        return;
      }
      const cloud = snap.data() || {};
      
      // CRITICAL: Always clear local data when user signs in, then load from Firebase
      FlickletDebug.info('🔄 User signed in - clearing local data and loading from Firebase');
      
      // Preserve only essential settings (not user data)
      const localLanguage = (appData.settings?.lang || "en");
      const localTheme = (appData.settings?.theme || "light");
      
      // Clear all user data first
      appData.tv = { watching: [], wishlist: [], watched: [] };
      appData.movies = { watching: [], wishlist: [], watched: [] };
      
      // Load from Firebase (even if empty)
      if (cloud.watchlists) {
        if (cloud.watchlists.tv) {
          FlickletDebug.info('🔄 Loading TV data from Firebase');
          FlickletDebug.info('🔍 Firebase TV watching count:', cloud.watchlists.tv.watching?.length || 0);
          appData.tv = cloud.watchlists.tv;
        } else {
          FlickletDebug.info('🔄 No TV data in Firebase, using empty arrays');
        }
        
        if (cloud.watchlists.movies) {
          FlickletDebug.info('🔄 Loading movie data from Firebase');
          FlickletDebug.info('🔍 Firebase movie watching count:', cloud.watchlists.movies.watching?.length || 0);
          appData.movies = cloud.watchlists.movies;
        } else {
          FlickletDebug.info('🔄 No movie data in Firebase, using empty arrays');
        }
      }
      
      // Load settings from Firebase
      if (cloud.settings) {
        appData.settings = { ...(appData.settings || {}), ...cloud.settings };
      }
      
      // Restore local settings
      if (localLanguage) appData.settings.lang = localLanguage;
      if (localTheme) appData.settings.theme = localTheme;
      
      // Save to localStorage
      localStorage.setItem("tvMovieTrackerData", JSON.stringify(appData));
      
      // Sync to FlickletApp if available
      if (window.FlickletApp && window.FlickletApp.appData) {
        window.FlickletApp.appData.tv = appData.tv;
        window.FlickletApp.appData.movies = appData.movies;
        window.FlickletApp.appData.settings = appData.settings;
        localStorage.setItem('flicklet-data', JSON.stringify(window.FlickletApp.appData));
      }
      
      // Update UI
      if (typeof updateUI === "function") updateUI();
      if (typeof applyTranslations === "function") applyTranslations();
      
      FlickletDebug.info('✅ User data loaded from Firebase successfully');
    } catch (e) {
      FlickletDebug.error('❌ Failed to load user data from Firebase:', e);
    }
  }

  // Expose functions globally
  window.loadUserDataFromCloud = loadUserDataFromCloud;

  // App state management
  window.AppState = {
    currentUser: null,
    isLoading: false,
    
    setLoading: function(loading) {
      this.isLoading = loading;
      const loader = document.getElementById('loading-indicator');
      if (loader) {
        loader.style.display = loading ? 'block' : 'none';
      }
    },
    
    setUser: function(user) {
      this.currentUser = user;
      this.updateUI();
    },
    
    updateUI: function() {
      const userElements = document.querySelectorAll('[data-user]');
      userElements.forEach(el => {
        el.style.display = this.currentUser ? 'block' : 'none';
      });
    }
  };

  // Search functionality
  window.Search = {
    perform: function(query) {
      if (!query || query.length < 2) return;
      
      console.log('🔍 Searching for:', query);
      AppState.setLoading(true);
      
      // Simulate search (replace with actual implementation)
      setTimeout(() => {
        AppState.setLoading(false);
        console.log('✅ Search completed');
      }, 500);
    }
  };

})();

// Initialize app functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ App functionality initialized');
  
  // Initialize search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      Search.perform(e.target.value);
    });
  }
});
