/**
 * Mock Currently Watching Data Generator
 * Creates 12 currently watching shows with upcoming episodes
 * Run this in the browser console to populate test data
 */

(function() {
  'use strict';

  console.log('🎬 Mock Currently Watching Data Generator loaded');
  console.log('💡 Run addMockCurrentlyWatching() to add 12 shows with upcoming episodes');

  // Mock shows with realistic data and upcoming episodes
  const mockShows = [
    {
      id: 1399,
      name: 'Breaking Bad',
      title: 'Breaking Bad',
      media_type: 'tv',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      first_air_date: '2008-01-20',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        episode_number: 1,
        season_number: 6
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 62,
      number_of_seasons: 5
    },
    {
      id: 1402,
      name: 'The Walking Dead',
      title: 'The Walking Dead',
      media_type: 'tv',
      poster_path: '/rqeYML0jc3Dv1Uh4MDI3m4Injp0.jpg',
      first_air_date: '2010-10-31',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days
        episode_number: 2,
        season_number: 12
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 177,
      number_of_seasons: 11
    },
    {
      id: 1396,
      name: 'Breaking Bad',
      title: 'Breaking Bad',
      media_type: 'tv',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      first_air_date: '2008-01-20',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days
        episode_number: 3,
        season_number: 6
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 62,
      number_of_seasons: 5
    },
    {
      id: 1402,
      name: 'The Walking Dead',
      title: 'The Walking Dead',
      media_type: 'tv',
      poster_path: '/rqeYML0jc3Dv1Uh4MDI3m4Injp0.jpg',
      first_air_date: '2010-10-31',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days
        episode_number: 4,
        season_number: 12
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 177,
      number_of_seasons: 11
    },
    {
      id: 1396,
      name: 'Breaking Bad',
      title: 'Breaking Bad',
      media_type: 'tv',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      first_air_date: '2008-01-20',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days
        episode_number: 5,
        season_number: 6
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 62,
      number_of_seasons: 5
    },
    {
      id: 1402,
      name: 'The Walking Dead',
      title: 'The Walking Dead',
      media_type: 'tv',
      poster_path: '/rqeYML0jc3Dv1Uh4MDI3m4Injp0.jpg',
      first_air_date: '2010-10-31',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 days
        episode_number: 6,
        season_number: 12
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 177,
      number_of_seasons: 11
    },
    {
      id: 1396,
      name: 'Breaking Bad',
      title: 'Breaking Bad',
      media_type: 'tv',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      first_air_date: '2008-01-20',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
        episode_number: 7,
        season_number: 6
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 62,
      number_of_seasons: 5
    },
    {
      id: 1402,
      name: 'The Walking Dead',
      title: 'The Walking Dead',
      media_type: 'tv',
      poster_path: '/rqeYML0jc3Dv1Uh4MDI3m4Injp0.jpg',
      first_air_date: '2010-10-31',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 8 days
        episode_number: 8,
        season_number: 12
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 177,
      number_of_seasons: 11
    },
    {
      id: 1396,
      name: 'Breaking Bad',
      title: 'Breaking Bad',
      media_type: 'tv',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      first_air_date: '2008-01-20',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 9 days
        episode_number: 9,
        season_number: 6
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 62,
      number_of_seasons: 5
    },
    {
      id: 1402,
      name: 'The Walking Dead',
      title: 'The Walking Dead',
      media_type: 'tv',
      poster_path: '/rqeYML0jc3Dv1Uh4MDI3m4Injp0.jpg',
      first_air_date: '2010-10-31',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days
        episode_number: 10,
        season_number: 12
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 177,
      number_of_seasons: 11
    },
    {
      id: 1396,
      name: 'Breaking Bad',
      title: 'Breaking Bad',
      media_type: 'tv',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      first_air_date: '2008-01-20',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 11 days
        episode_number: 11,
        season_number: 6
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 62,
      number_of_seasons: 5
    },
    {
      id: 1402,
      name: 'The Walking Dead',
      title: 'The Walking Dead',
      media_type: 'tv',
      poster_path: '/rqeYML0jc3Dv1Uh4MDI3m4Injp0.jpg',
      first_air_date: '2010-10-31',
      next_episode_to_air: {
        air_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 days
        episode_number: 12,
        season_number: 12
      },
      status: 'Returning Series',
      in_production: true,
      number_of_episodes: 177,
      number_of_seasons: 11
    }
  ];

  // Function to add mock currently watching data
  window.addMockCurrentlyWatching = function() {
    console.log('🎬 Adding mock currently watching data...');
    console.log('🎬 Mock shows data:', mockShows);
    
    try {
      // Get current appData or create new structure
      let appData = window.appData || {
        tv: { watching: [], wishlist: [], watched: [] },
        movies: { watching: [], wishlist: [], watched: [] },
        settings: {},
        searchCache: [],
        activeTagFilters: new Set()
      };

      console.log('🎬 Current appData before update:', appData);

      // Clear existing watching data
      appData.tv.watching = [];
      appData.movies.watching = [];

      // Add mock shows to currently watching
      appData.tv.watching = [...mockShows];

      console.log('🎬 Updated appData.tv.watching:', appData.tv.watching);

      // Also update the watchlists structure that tab counts expect
      if (!appData.watchlists) {
        appData.watchlists = {
          tv: { watching: [], wishlist: [], watched: [] },
          movies: { watching: [], wishlist: [], watched: [] }
        };
      }
      appData.watchlists.tv.watching = [...mockShows];
      console.log('🎬 Updated appData.watchlists.tv.watching:', appData.watchlists.tv.watching);

      // Update window.appData
      window.appData = appData;

      // Save to localStorage
      localStorage.setItem('flicklet-data', JSON.stringify(appData));
      console.log('🎬 Saved to localStorage');

      // Invalidate WatchlistsAdapter cache to force reload from appData
      if (window.WatchlistsAdapter && typeof window.WatchlistsAdapter.invalidate === 'function') {
        console.log('🎬 Invalidating WatchlistsAdapter cache...');
        window.WatchlistsAdapter.invalidate();
      }

      // Also save to Firebase if user is signed in
      if (window.FlickletApp && window.FlickletApp.currentUser) {
        console.log('🎬 User is signed in, saving to Firebase...');
        try {
          // Use the same save function that the app uses
          if (typeof window.FlickletApp.saveData === 'function') {
            window.FlickletApp.saveData();
            console.log('🎬 Saved to Firebase via FlickletApp.saveData()');
          } else if (typeof window.saveAppData === 'function') {
            window.saveAppData();
            console.log('🎬 Saved to Firebase via saveAppData()');
          } else {
            console.log('🎬 No Firebase save function available');
          }
        } catch (error) {
          console.error('🎬 Error saving to Firebase:', error);
        }
      } else {
        console.log('🎬 User not signed in, skipping Firebase save');
      }

      // Trigger UI update
      if (typeof window.FlickletApp !== 'undefined' && window.FlickletApp.updateUI) {
        console.log('🎬 Calling FlickletApp.updateUI()');
        window.FlickletApp.updateUI();
      } else {
        console.log('🎬 FlickletApp.updateUI not available, trying alternative');
        // Try alternative UI update methods
        if (typeof window.updateUI === 'function') {
          window.updateUI();
        }
        if (typeof window.updateTabCounts === 'function') {
          window.updateTabCounts();
        }
      }

      // Dispatch watchlists:updated event (new primary system)
      console.log('🎬 Dispatching watchlists:updated event');
      document.dispatchEvent(new CustomEvent('watchlists:updated', {
        detail: { list: 'watching', action: 'add', source: 'mock-data' }
      }));

      // Dispatch data ready event
      console.log('🎬 Dispatching app:data:ready event');
      document.dispatchEvent(new CustomEvent('app:data:ready', {
        detail: { source: 'mock-data' }
      }));

      // Also try dispatching cards:changed event (legacy)
      document.dispatchEvent(new CustomEvent('cards:changed', {
        detail: { source: 'mock-data' }
      }));

      console.log('✅ Mock currently watching data added successfully!');
      console.log('📊 Added', mockShows.length, 'shows to currently watching');
      console.log('📅 Episodes scheduled over the next 12 days');
      console.log('🔄 UI should update automatically');
      console.log('🎬 Final appData:', window.appData);

      // Force refresh the Currently Watching preview after a short delay
      setTimeout(() => {
        console.log('🔄 Force refreshing Currently Watching preview...');
        if (typeof window.refreshCurrentlyWatching === 'function') {
          window.refreshCurrentlyWatching();
        }
      }, 1000);

      return true;
    } catch (error) {
      console.error('❌ Error adding mock data:', error);
      return false;
    }
  };

  // Function to clear mock data
  window.clearMockCurrentlyWatching = function() {
    console.log('🧹 Clearing mock currently watching data...');
    
    try {
      let appData = window.appData || {
        tv: { watching: [], wishlist: [], watched: [] },
        movies: { watching: [], wishlist: [], watched: [] },
        settings: {},
        searchCache: [],
        activeTagFilters: new Set()
      };

      // Clear watching data
      appData.tv.watching = [];
      appData.movies.watching = [];

      // Update window.appData
      window.appData = appData;

      // Save to localStorage
      localStorage.setItem('flicklet-data', JSON.stringify(appData));

      // Trigger UI update
      if (typeof window.FlickletApp !== 'undefined' && window.FlickletApp.updateUI) {
        window.FlickletApp.updateUI();
      }

      console.log('✅ Mock currently watching data cleared!');
      return true;
    } catch (error) {
      console.error('❌ Error clearing mock data:', error);
      return false;
    }
  };

  // Function to force refresh the Currently Watching preview
  window.refreshCurrentlyWatching = function() {
    console.log('🔄 Force refreshing Currently Watching preview...');
    
    // Try to trigger the preview refresh
    if (typeof window.initCurrentlyWatchingPreview === 'function') {
      window.initCurrentlyWatchingPreview();
    }
    
    // Try to trigger render
    if (typeof window.renderCurrentlyWatchingPreview === 'function') {
      window.renderCurrentlyWatchingPreview();
    }
    
    // Dispatch events
    document.dispatchEvent(new CustomEvent('app:data:ready', {
      detail: { source: 'force-refresh' }
    }));
    
    document.dispatchEvent(new CustomEvent('cards:changed', {
      detail: { source: 'force-refresh' }
    }));
    
    console.log('🔄 Refresh triggered');
  };

  console.log('🎬 Mock data functions ready:');
  console.log('  - addMockCurrentlyWatching() - Add 12 shows with upcoming episodes');
  console.log('  - clearMockCurrentlyWatching() - Clear the mock data');
  console.log('  - refreshCurrentlyWatching() - Force refresh the preview');

})();