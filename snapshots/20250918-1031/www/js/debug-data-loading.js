/**
 * Data Loading Debug Script
 * 
 * Process: Data Loading Debug
 * Purpose: Debug why user data isn't loading from Firebase
 * Data Source: Firebase Firestore, appData, console logs
 * Update Path: Modify debug output as needed
 * Dependencies: Firebase Firestore, appData
 */

(function() {
  'use strict';

  console.log('🔍 Data Loading Debug Script loaded');

  /**
   * Debug data loading process
   */
  async function debugDataLoading() {
    console.log('🔍 === DATA LOADING DEBUG ===');
    
    // Check if user is signed in
    const auth = window.firebase?.auth();
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
      console.log('❌ No user signed in - cannot load data');
      return;
    }
    
    console.log('✅ User signed in:', currentUser.email);
    console.log('🔍 User UID:', currentUser.uid);
    
    // Check if loadUserDataFromCloud function exists
    console.log('🔍 loadUserDataFromCloud available:', typeof window.loadUserDataFromCloud === 'function');
    
    // Check if processUserSignIn was called
    console.log('🔍 FlickletApp available:', !!window.FlickletApp);
    console.log('🔍 processUserSignIn available:', !!(window.FlickletApp && typeof window.FlickletApp.processUserSignIn === 'function'));
    
    // Check current appData state
    console.log('🔍 Current appData:', {
      tv: window.appData?.tv,
      movies: window.appData?.movies,
      settings: window.appData?.settings
    });
    
    // Check Firebase document directly
    try {
      const db = window.firebase?.firestore();
      if (db) {
        console.log('🔍 Checking Firebase document directly...');
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log('✅ Firebase document exists');
          console.log('🔍 Firebase document data:', userData);
          console.log('🔍 Firebase watchlists:', userData.watchlists);
          
          if (userData.watchlists) {
            console.log('🔍 TV data in Firebase:', {
              watching: userData.watchlists.tv?.watching?.length || 0,
              wishlist: userData.watchlists.tv?.wishlist?.length || 0,
              watched: userData.watchlists.tv?.watched?.length || 0
            });
            console.log('🔍 Movie data in Firebase:', {
              watching: userData.watchlists.movies?.watching?.length || 0,
              wishlist: userData.watchlists.movies?.wishlist?.length || 0,
              watched: userData.watchlists.movies?.watched?.length || 0
            });
          } else {
            console.log('❌ No watchlists data in Firebase document');
          }
        } else {
          console.log('❌ Firebase document does not exist for user');
        }
      } else {
        console.log('❌ Firebase Firestore not available');
      }
    } catch (error) {
      console.error('❌ Error checking Firebase document:', error);
    }
    
    // Check if UI update functions exist
    console.log('🔍 updateUI available:', typeof window.updateUI === 'function');
    console.log('🔍 updateTabCounts available:', typeof window.updateTabCounts === 'function');
    console.log('🔍 updateTabContent available:', !!(window.FlickletApp && typeof window.FlickletApp.updateTabContent === 'function'));
    
    console.log('🔍 === END DATA LOADING DEBUG ===');
  }

  /**
   * Force data loading
   */
  async function forceDataLoading() {
    console.log('🔄 Forcing data loading...');
    
    const auth = window.firebase?.auth();
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
      console.log('❌ No user signed in');
      return;
    }
    
    try {
      // Call processUserSignIn manually
      if (window.FlickletApp && typeof window.FlickletApp.processUserSignIn === 'function') {
        console.log('🔄 Calling processUserSignIn manually...');
        await window.FlickletApp.processUserSignIn(currentUser);
        console.log('✅ processUserSignIn completed');
      } else {
        console.log('❌ processUserSignIn not available');
      }
      
      // Also try calling loadUserDataFromCloud directly
      if (typeof window.loadUserDataFromCloud === 'function') {
        console.log('🔄 Calling loadUserDataFromCloud directly...');
        await window.loadUserDataFromCloud(currentUser.uid);
        console.log('✅ loadUserDataFromCloud completed');
      } else {
        console.log('❌ loadUserDataFromCloud not available');
      }
      
    } catch (error) {
      console.error('❌ Error forcing data loading:', error);
    }
  }

  /**
   * Check if data is actually in localStorage
   */
  function checkLocalStorage() {
    console.log('🔍 === LOCAL STORAGE DEBUG ===');
    
    try {
      const localData = localStorage.getItem('flicklet-data');
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log('✅ Local storage data exists');
        console.log('🔍 Local storage data:', {
          tv: parsed.tv,
          movies: parsed.movies,
          settings: parsed.settings
        });
      } else {
        console.log('❌ No data in local storage');
      }
    } catch (error) {
      console.error('❌ Error reading local storage:', error);
    }
    
    console.log('🔍 === END LOCAL STORAGE DEBUG ===');
  }

  // Expose debug functions globally
  window.debugDataLoading = {
    check: debugDataLoading,
    force: forceDataLoading,
    localStorage: checkLocalStorage
  };

  // Auto-run debug on load
  setTimeout(() => {
    debugDataLoading();
    checkLocalStorage();
  }, 3000);

  console.log('✅ Data Loading Debug Script ready. Use window.debugDataLoading.check() to debug');

})();

