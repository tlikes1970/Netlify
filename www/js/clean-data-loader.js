/**
 * Clean Data Loader - Simple Data Loading and Card Replacement
 * 
 * Process: Clean Data Loader
 * Purpose: Load user data and replace all cards with clean unified cards
 * Data Source: Firebase Firestore, appData
 * Update Path: Modify data loading or card replacement logic
 * Dependencies: clean-poster-card.js, Firebase Firestore
 */

(function() {
  'use strict';

  console.log('🔄 Clean Data Loader starting...');

  /**
   * Load user data from Firebase and replace all cards
   */
  async function loadUserDataAndReplaceCards() {
    try {
      console.log('🔄 Loading user data and replacing cards...');
      
      // Check if user is signed in
      const auth = window.firebase?.auth();
      const currentUser = auth?.currentUser;
      
      if (!currentUser) {
        console.log('❌ No user signed in - cannot load data');
        return;
      }
      
      console.log('✅ User signed in:', currentUser.email);
      
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
      
      // Replace all cards with clean unified cards
      replaceAllCardsWithCleanCards();
      
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
      
      console.log('✅ Data loading and card replacement completed successfully!');
      
      // Show success message
      if (window.showToast) {
        window.showToast('success', 'Data Loaded', 'Your shows and movies have been loaded with the new design!');
      }
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      if (window.showToast) {
        window.showToast('error', 'Data Load Failed', 'Failed to load your data. Please try again.');
      }
    }
  }

  /**
   * Replace all existing cards with clean unified cards
   */
  function replaceAllCardsWithCleanCards() {
    console.log('🔄 Replacing all cards with clean unified cards...');
    
    try {
      // Find all card containers
      const cardContainers = [
        'watchingList',
        'wishlistList', 
        'watchedList',
        'discoverList',
        'searchList'
      ];

      let replacedCount = 0;

      cardContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) {
          console.log(`⚠️ Container ${containerId} not found`);
          return;
        }

        // Clear existing cards
        container.innerHTML = '';
        
        // Get section name
        const section = containerId.replace('List', '');
        
        // Get data for this section
        const sectionData = getSectionData(section);
        
        if (sectionData && sectionData.length > 0) {
          console.log(`🔄 Creating ${sectionData.length} clean cards for ${section} section`);
          
          // Create clean cards
          sectionData.forEach(item => {
            const cleanCard = window.createCleanPosterCard(item, section);
            if (cleanCard) {
              container.appendChild(cleanCard);
              replacedCount++;
            }
          });
        } else {
          // Show empty state
          const emptyState = createEmptyState(section);
          container.appendChild(emptyState);
        }
      });

      console.log(`✅ Card replacement complete: ${replacedCount} cards replaced`);

    } catch (error) {
      console.error('❌ Card replacement failed:', error);
    }
  }

  /**
   * Get data for a specific section
   * @param {string} section - Section name
   * @returns {Array} Section data
   */
  function getSectionData(section) {
    if (!window.appData) return [];
    
    const mediaTypes = ['tv', 'movies'];
    let sectionData = [];
    
    mediaTypes.forEach(mediaType => {
      if (window.appData[mediaType] && window.appData[mediaType][section]) {
        sectionData = sectionData.concat(window.appData[mediaType][section]);
      }
    });
    
    return sectionData;
  }

  /**
   * Create empty state for section
   * @param {string} section - Section name
   * @returns {HTMLElement} Empty state element
   */
  function createEmptyState(section) {
    const emptyState = document.createElement('div');
    emptyState.className = 'clean-poster-cards-empty';
    
    const sectionNames = {
      watching: 'Watching',
      wishlist: 'Wishlist',
      watched: 'Watched',
      discover: 'Discover',
      search: 'Search'
    };
    
    const sectionName = sectionNames[section] || section;
    
    emptyState.innerHTML = `
      <div class="clean-poster-cards-empty__icon">🎬</div>
      <div class="clean-poster-cards-empty__title">Nothing here yet</div>
      <div class="clean-poster-cards-empty__description">Your ${sectionName.toLowerCase()} list is empty</div>
    `;
    
    return emptyState;
  }

  /**
   * Wait for Firebase to be ready
   */
  function waitForFirebase() {
    return new Promise((resolve) => {
      if (window.firebase && window.firebase.auth && window.firebase.firestore) {
        resolve();
      } else {
        setTimeout(() => waitForFirebase().then(resolve), 100);
      }
    });
  }

  /**
   * Wait for clean poster card component to be ready
   */
  function waitForCleanPosterCard() {
    return new Promise((resolve) => {
      if (window.createCleanPosterCard) {
        resolve();
      } else {
        setTimeout(() => waitForCleanPosterCard().then(resolve), 100);
      }
    });
  }

  /**
   * Initialize the clean data loader
   */
  async function init() {
    await waitForFirebase();
    await waitForCleanPosterCard();
    
    // Listen for auth state changes
    const auth = window.firebase.auth();
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('🔄 Auth state changed - user signed in:', user.email);
        setTimeout(() => {
          loadUserDataAndReplaceCards();
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
        loadUserDataAndReplaceCards();
      }, 1000);
    }
  }

  // Start the clean data loader
  setTimeout(init, 2000);

  // Expose globally for manual use
  window.loadUserDataAndReplaceCards = loadUserDataAndReplaceCards;

  console.log('✅ Clean Data Loader ready. Use window.loadUserDataAndReplaceCards() to manually load data.');

})();
