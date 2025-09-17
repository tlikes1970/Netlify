/**
 * EMERGENCY FUNCTION RESTORATION - v23.1
 * Purpose: Ensure critical functions are available even if main scripts fail
 * Data Source: Fallback implementations for critical functionality
 * Update Path: Replace with proper implementations once syntax errors are fixed
 * Dependencies: TMDB_CONFIG, FlickletDebug
 */

(function() {
  'use strict';
  
  FlickletDebug.info('🚨 Emergency functions loading - ensuring critical functionality');
  
  // Emergency tmdbGet function
  if (typeof window.tmdbGet !== 'function') {
    FlickletDebug.warn('⚠️ tmdbGet not available, creating emergency fallback');
    
    window.tmdbGet = async function(endpoint, params = "", tryFallback = true) {
      try {
        const config = window.TMDB_CONFIG || {};
        const apiKey = config.apiKey || 'b7247bb415b50f25b5e35e2566430b96';
        const baseUrl = config.baseUrl || 'https://api.themoviedb.org/3';
        
        const lang = '&language=en-US';
        const url = `${baseUrl}/${endpoint}?api_key=${apiKey}${params}${lang}`;
        
        FlickletDebug.info('🌐 Emergency tmdbGet request:', url);
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          FlickletDebug.info('✅ Emergency tmdbGet success');
          return data;
        }
        
        throw new Error(`TMDB request failed: ${response.status}`);
      } catch (error) {
        FlickletDebug.error('❌ Emergency tmdbGet failed:', error);
        return { results: [] }; // Return empty results to prevent crashes
      }
    };
    
    FlickletDebug.info('✅ Emergency tmdbGet function created');
  }
  
  // Emergency loadUserDataFromCloud function
  if (typeof window.loadUserDataFromCloud !== 'function') {
    FlickletDebug.warn('⚠️ loadUserDataFromCloud not available, creating emergency fallback');
    
    window.loadUserDataFromCloud = async function(uid) {
      try {
        FlickletDebug.info('🔄 Emergency loadUserDataFromCloud called for uid:', uid);
        
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.firestore) {
          FlickletDebug.warn('⚠️ Firebase not available, skipping cloud load');
          return;
        }
        
        const db = firebase.firestore();
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          FlickletDebug.info('✅ Emergency cloud data loaded');
          
          // Merge with existing appData
          if (window.appData) {
            window.appData = { ...window.appData, ...userData };
            FlickletDebug.info('✅ Emergency data merged with appData');
          }
        } else {
          FlickletDebug.info('ℹ️ No cloud data found for user');
        }
      } catch (error) {
        FlickletDebug.error('❌ Emergency loadUserDataFromCloud failed:', error);
        // Don't throw - just log and continue
      }
    };
    
    FlickletDebug.info('✅ Emergency loadUserDataFromCloud function created');
  }
  
  // Emergency addToList function
  if (typeof window.addToList !== 'function') {
    FlickletDebug.warn('⚠️ addToList not available, creating emergency fallback');
    
    window.addToList = function(item, listName) {
      try {
        FlickletDebug.info('➕ Emergency addToList called:', { item: item?.id, listName });
        
        if (!item || !item.id) {
          FlickletDebug.warn('⚠️ Invalid item for addToList');
          return false;
        }
        
        // Basic implementation - add to appData
        if (!window.appData) {
          window.appData = { tv: {}, movies: {} };
        }
        
        const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        const category = mediaType === 'tv' ? 'tv' : 'movies';
        
        if (!window.appData[category]) {
          window.appData[category] = {};
        }
        
        if (!window.appData[category][listName]) {
          window.appData[category][listName] = [];
        }
        
        // Check if already exists
        const exists = window.appData[category][listName].some(existing => 
          Number(existing.id) === Number(item.id)
        );
        
        if (!exists) {
          window.appData[category][listName].push(item);
          FlickletDebug.info('✅ Emergency addToList success');
          
          // Trigger UI update if available
          if (typeof window.updateUI === 'function') {
            window.updateUI();
          }
          
          return true;
        } else {
          FlickletDebug.info('ℹ️ Item already exists in list');
          return false;
        }
      } catch (error) {
        FlickletDebug.error('❌ Emergency addToList failed:', error);
        return false;
      }
    };
    
    FlickletDebug.info('✅ Emergency addToList function created');
  }
  
  // Emergency saveAppData function
  if (typeof window.saveAppData !== 'function') {
    FlickletDebug.warn('⚠️ saveAppData not available, creating emergency fallback');
    
    window.saveAppData = function() {
      try {
        FlickletDebug.info('💾 Emergency saveAppData called');
        
        if (!window.appData) {
          FlickletDebug.warn('⚠️ No appData to save');
          return;
        }
        
        // Save to localStorage
        localStorage.setItem('flicklet-app-data', JSON.stringify(window.appData));
        FlickletDebug.info('✅ Emergency saveAppData success');
        
        // Try to save to Firebase if available
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
          const user = firebase.auth().currentUser;
          const db = firebase.firestore();
          
          db.collection('users').doc(user.uid).set(window.appData, { merge: true })
            .then(() => FlickletDebug.info('✅ Emergency Firebase save success'))
            .catch(error => FlickletDebug.error('❌ Emergency Firebase save failed:', error));
        }
      } catch (error) {
        FlickletDebug.error('❌ Emergency saveAppData failed:', error);
      }
    };
    
    FlickletDebug.info('✅ Emergency saveAppData function created');
  }
  
  FlickletDebug.info('🚨 Emergency functions loaded successfully');
  
})();



