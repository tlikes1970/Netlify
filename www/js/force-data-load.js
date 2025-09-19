/**
 * Force Data Loading - Direct Fix
 * 
 * Process: Force Data Loading
 * Purpose: Directly force data loading when auth state changes
 * Data Source: Firebase Firestore, appData
 * Update Path: Remove after data loading is working
 * Dependencies: Firebase Firestore, appData
 */

(function() {
  'use strict';

  console.log('🔄 Force Data Loading script starting...');

  /**
   * Force load user data from Firebase
   */
  async function forceLoadUserData() {
    try {
      console.log('🔄 Force loading user data...');
      
      // Check if user is signed in
      const auth = window.firebase?.auth();
      const currentUser = auth?.currentUser;
      
      if (!currentUser) {
        console.log('❌ No user signed in - cannot load data');
        return;
      }
      
      console.log('✅ User signed in:', currentUser.email);
      console.log('🔍 User UID:', currentUser.uid);
      
      // Check if Firebase Firestore is available
      const db = window.firebase?.firestore();
      if (!db) {
        console.log('❌ Firebase Firestore not available');
        return;
      }
      
      // Load data directly from Firebase
      console.log('🔄 Loading data from Firebase...');
      const userDoc = await db.collection('users').doc(currentUser.uid).get();
      
      if (!userDoc.exists) {
        console.log('❌ No Firebase document found for user');
        return;
      }
      
      const userData = userDoc.data();
      console.log('✅ Firebase document found');
      console.log('🔍 Firebase data:', userData);
      
      // Check if watchlists exist
      if (!userData.watchlists) {
        console.log('❌ No watchlists data in Firebase document');
        return;
      }
      
      // Load TV data
      if (userData.watchlists.tv) {
        console.log('🔄 Loading TV data...');
        console.log('🔍 TV watching count:', userData.watchlists.tv.watching?.length || 0);
        console.log('🔍 TV wishlist count:', userData.watchlists.tv.wishlist?.length || 0);
        console.log('🔍 TV watched count:', userData.watchlists.tv.watched?.length || 0);
        
        // Update appData
        if (window.appData) {
          window.appData.tv = userData.watchlists.tv;
          console.log('✅ TV data loaded into appData');
        }
      }
      
      // Load Movie data
      if (userData.watchlists.movies) {
        console.log('🔄 Loading movie data...');
        console.log('🔍 Movie watching count:', userData.watchlists.movies.watching?.length || 0);
        console.log('🔍 Movie wishlist count:', userData.watchlists.movies.wishlist?.length || 0);
        console.log('🔍 Movie watched count:', userData.watchlists.movies.watched?.length || 0);
        
        // Update appData
        if (window.appData) {
          window.appData.movies = userData.watchlists.movies;
          console.log('✅ Movie data loaded into appData');
        }
      }
      
      // Save to localStorage
      if (window.appData) {
        localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
        console.log('✅ Data saved to localStorage');
      }
      
      // Update UI
      console.log('🔄 Updating UI...');
      if (typeof window.updateUI === 'function') {
        window.updateUI();
        console.log('✅ UI updated');
      }
      
      // Update tab counts
      if (typeof window.updateTabCounts === 'function') {
        window.updateTabCounts();
        console.log('✅ Tab counts updated');
      }
      
      // Update tab content
      if (window.FlickletApp && typeof window.FlickletApp.updateTabContent === 'function') {
        const currentTab = window.FlickletApp.currentTab || 'home';
        window.FlickletApp.updateTabContent(currentTab);
        console.log('✅ Tab content updated:', currentTab);
      }
      
      console.log('✅ Data loading completed successfully!');
      
      // Show success message
      if (window.showToast) {
        window.showToast('success', 'Data Loaded', 'Your shows and movies have been loaded!');
      }
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      if (window.showToast) {
        window.showToast('error', 'Data Load Failed', 'Failed to load your data. Please try again.');
      }
    }
  }

  /**
   * Wait for Firebase to be ready
   */
  function waitForFirebase() {
    return new Promise((resolve) => {
      if (window.firebaseAuth && window.firebaseDb) {
        resolve();
      } else {
        setTimeout(() => waitForFirebase().then(resolve), 100);
      }
    });
  }

  /**
   * Initialize the force loading
   */
  async function init() {
    await waitForFirebase();
    
    // Listen for auth state changes
    const auth = window.firebaseAuth;
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('🔄 Auth state changed - user signed in:', user.email);
        setTimeout(() => {
          forceLoadUserData();
        }, 1000);
      } else {
        console.log('🔄 Auth state changed - user signed out');
      }
    });
    
    // Also check if user is already signed in
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('🔄 User already signed in, loading data...');
      setTimeout(() => {
        forceLoadUserData();
      }, 1000);
    }
  }

  // Start the force loading
  setTimeout(init, 2000);

  // Expose globally for manual use
  window.forceLoadUserData = forceLoadUserData;

  console.log('✅ Force Data Loading script ready. Use window.forceLoadUserData() to manually load data.');

})();

