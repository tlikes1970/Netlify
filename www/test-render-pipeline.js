// Test script for WatchlistsAdapter render pipeline v28.19
// This script tests the DOM rendering and count synchronization

console.log('🧪 Testing WatchlistsAdapter render pipeline v28.19...');

// Test 1: Check if adapter is working
if (window.__wl) {
  console.log('✅ Adapter data available:', {
    watching: window.__wl.watchingIds.length,
    wishlist: window.__wl.wishlistIds.length,
    watched: window.__wl.watchedIds.length
  });
} else {
  console.warn('⚠️ Adapter data not available (window.__wl)');
}

// Test 2: Check header counts
const headerCounts = {
  watching: parseInt(document.getElementById('watchingCount')?.textContent || '0'),
  wishlist: parseInt(document.getElementById('wishlistCount')?.textContent || '0'),
  watched: parseInt(document.getElementById('watchedCount')?.textContent || '0')
};
console.log('✅ Header counts:', headerCounts);

// Test 3: Check badge counts
const badgeCounts = {
  watching: parseInt(document.getElementById('watchingBadge')?.textContent || '0'),
  wishlist: parseInt(document.getElementById('wishlistBadge')?.textContent || '0'),
  watched: parseInt(document.getElementById('watchedBadge')?.textContent || '0')
};
console.log('✅ Badge counts:', badgeCounts);

// Test 4: Check DOM parity (visible cards)
const getVisibleCards = (selector) => {
  return [...document.querySelectorAll(`${selector} [data-tmdb-id]`)]
    .filter(el => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden');
};

const domCounts = {
  watching: getVisibleCards('#watchingList').length,
  wishlist: getVisibleCards('#wishlistList').length,
  watched: getVisibleCards('#watchedList').length
};
console.log('✅ DOM counts (visible cards):', domCounts);

// Test 5: Check for parity
const allCountsMatch = 
  headerCounts.watching === badgeCounts.watching && 
  headerCounts.watching === domCounts.watching &&
  headerCounts.wishlist === badgeCounts.wishlist && 
  headerCounts.wishlist === domCounts.wishlist &&
  headerCounts.watched === badgeCounts.watched && 
  headerCounts.watched === domCounts.watched;

if (allCountsMatch) {
  console.log('✅ All counts match! DOM parity achieved');
} else {
  console.warn('⚠️ Count mismatch detected:', {
    headers: headerCounts,
    badges: badgeCounts,
    dom: domCounts
  });
}

// Test 6: Check feature flag
if (window.FLAGS && window.FLAGS.useWatchlistsAdapter) {
  console.log('✅ Feature flag enabled');
} else {
  console.warn('⚠️ Feature flag disabled');
}

// Test 7: Check version
const title = document.title;
if (title.includes('v28.19')) {
  console.log('✅ Version v28.19 confirmed');
} else {
  console.warn('⚠️ Version mismatch:', title);
}

console.log('🧪 Render pipeline tests complete');

// Helper function for manual testing
window.testRenderPipeline = function() {
  console.log('🔄 Re-running render pipeline tests...');
  // Trigger a re-render by switching tabs
  if (window.FlickletApp && window.FlickletApp.switchToTab) {
    window.FlickletApp.switchToTab('watching');
    setTimeout(() => {
      window.FlickletApp.switchToTab('wishlist');
      setTimeout(() => {
        window.FlickletApp.switchToTab('watched');
        setTimeout(() => {
          console.log('🔄 Tab switching complete, re-check counts');
        }, 100);
      }, 100);
    }, 100);
  }
};
