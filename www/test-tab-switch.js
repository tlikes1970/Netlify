// Test script to verify WatchlistsAdapter works on tab switch
console.log('🧪 Testing tab switch to trigger WatchlistsAdapter...');

// Test switching to watching tab
if (window.FlickletApp && window.FlickletApp.switchToTab) {
  console.log('✅ FlickletApp.switchToTab available');
  
  // Switch to watching tab to trigger WatchlistsAdapter
  console.log('🔄 Switching to watching tab...');
  window.FlickletApp.switchToTab('watching');
  
  // Wait a moment for the async operations to complete
  setTimeout(() => {
    console.log('🔍 Checking results after tab switch...');
    
    // Check if WatchlistsAdapter was called
    if (window.__wl) {
      console.log('✅ WatchlistsAdapter data available:', {
        watching: window.__wl.watchingIds.length,
        wishlist: window.__wl.wishlistIds.length,
        watched: window.__wl.watchedIds.length
      });
    } else {
      console.warn('⚠️ WatchlistsAdapter data not available');
    }
    
    // Check DOM counts
    const domCounts = {
      watching: document.querySelectorAll('#watchingList [data-tmdb-id]').length,
      wishlist: document.querySelectorAll('#wishlistList [data-tmdb-id]').length,
      watched: document.querySelectorAll('#watchedList [data-tmdb-id]').length
    };
    console.log('✅ DOM counts:', domCounts);
    
    // Check header/badge counts
    const headerCounts = {
      watching: parseInt(document.getElementById('watchingCount')?.textContent || '0'),
      wishlist: parseInt(document.getElementById('wishlistCount')?.textContent || '0'),
      watched: parseInt(document.getElementById('watchedCount')?.textContent || '0')
    };
    console.log('✅ Header counts:', headerCounts);
    
    // Check if counts match
    const countsMatch = 
      domCounts.watching === headerCounts.watching &&
      domCounts.wishlist === headerCounts.wishlist &&
      domCounts.watched === headerCounts.watched;
    
    if (countsMatch) {
      console.log('✅ DOM parity achieved! Counts match between DOM and headers');
    } else {
      console.warn('⚠️ Count mismatch detected');
    }
    
  }, 1000);
} else {
  console.error('❌ FlickletApp.switchToTab not available');
}
