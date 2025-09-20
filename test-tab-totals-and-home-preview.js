/**
 * Test: Tab Totals and Home Page Currently Watching Preview
 * Purpose: Verify that tab badges show correct counts and home page shows currently watching items
 */

// Test data setup
const testData = {
  tv: {
    watching: [
      { id: 1, title: "Breaking Bad", poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", mediaType: "tv" },
      { id: 2, title: "The Office", poster_path: "/7DJKHzAiZOlkpJQvAjjF4gxX5k.jpg", mediaType: "tv" }
    ],
    wishlist: [
      { id: 3, title: "Stranger Things", poster_path: "/49WJfeN0moxb9IPfGn9AIqCtW6W.jpg", mediaType: "tv" }
    ],
    watched: [
      { id: 4, title: "Friends", poster_path: "/f496cm9enuEsZkSPzCwnTESEK5s.jpg", mediaType: "tv" }
    ]
  },
  movies: {
    watching: [
      { id: 5, title: "Inception", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", mediaType: "movie" }
    ],
    wishlist: [
      { id: 6, title: "The Matrix", poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", mediaType: "movie" }
    ],
    watched: [
      { id: 7, title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", mediaType: "movie" }
    ]
  }
};

// Test functions
function testTabBadgeCounts() {
  console.log("🧪 Testing tab badge counts...");
  
  // Set up test data
  window.appData = testData;
  
  // Call updateTabCounts function
  if (typeof window.updateTabCounts === 'function') {
    const counts = window.updateTabCounts();
    
    // Expected counts
    const expectedCounts = {
      watching: 3, // 2 TV + 1 movie
      wishlist: 2, // 1 TV + 1 movie  
      watched: 2   // 1 TV + 1 movie
    };
    
    // Verify counts
    const watchingBadge = document.getElementById('watchingBadge');
    const wishlistBadge = document.getElementById('wishlistBadge');
    const watchedBadge = document.getElementById('watchedBadge');
    
    console.log("Badge elements found:", {
      watching: !!watchingBadge,
      wishlist: !!wishlistBadge,
      watched: !!watchedBadge
    });
    
    console.log("Badge text content:", {
      watching: watchingBadge?.textContent,
      wishlist: wishlistBadge?.textContent,
      watched: watchedBadge?.textContent
    });
    
    console.log("Expected vs Actual:", {
      watching: { expected: expectedCounts.watching, actual: counts.watching },
      wishlist: { expected: expectedCounts.wishlist, actual: counts.wishlist },
      watched: { expected: expectedCounts.watched, actual: counts.watched }
    });
    
    return {
      watching: counts.watching === expectedCounts.watching,
      wishlist: counts.wishlist === expectedCounts.wishlist,
      watched: counts.watched === expectedCounts.watched
    };
  } else {
    console.error("❌ updateTabCounts function not available");
    return { watching: false, wishlist: false, watched: false };
  }
}

function testCurrentlyWatchingPreview() {
  console.log("🧪 Testing currently watching preview...");
  
  // Set up test data
  window.appData = testData;
  
  // Check if preview section exists
  const previewSection = document.getElementById('currentlyWatchingPreview');
  const scrollContainer = document.getElementById('currentlyWatchingScroll');
  
  console.log("Preview elements found:", {
    previewSection: !!previewSection,
    scrollContainer: !!scrollContainer
  });
  
  if (!previewSection || !scrollContainer) {
    console.error("❌ Preview elements not found");
    return false;
  }
  
  // Trigger preview render
  if (typeof window.renderCurrentlyWatchingPreview === 'function') {
    window.renderCurrentlyWatchingPreview();
    
    // Check if items are rendered
    const cards = scrollContainer.querySelectorAll('.preview-card');
    console.log("Preview cards rendered:", cards.length);
    
    // Check if section is visible
    const isVisible = previewSection.style.display !== 'none';
    console.log("Preview section visible:", isVisible);
    
    return cards.length > 0 && isVisible;
  } else {
    console.error("❌ renderCurrentlyWatchingPreview function not available");
    return false;
  }
}

function testHomePageLayout() {
  console.log("🧪 Testing home page layout...");
  
  // Check if currently watching section is in the top row
  const currentlyWatchingSection = document.getElementById('currentlyWatchingPreview');
  const homeSection = document.getElementById('homeSection');
  
  if (!currentlyWatchingSection || !homeSection) {
    console.error("❌ Required sections not found");
    return false;
  }
  
  // Check if currently watching is the first child of home section
  const firstChild = homeSection.querySelector('.home-group:first-child');
  const currentlyWatchingGroup = currentlyWatchingSection.closest('.home-group');
  
  console.log("Layout check:", {
    firstChild: firstChild?.id,
    currentlyWatchingGroup: currentlyWatchingGroup?.id,
    isFirst: currentlyWatchingGroup === firstChild
  });
  
  return currentlyWatchingGroup === firstChild;
}

// Run all tests
function runAllTests() {
  console.log("🚀 Running all tests...");
  
  const results = {
    tabBadges: testTabBadgeCounts(),
    currentlyWatchingPreview: testCurrentlyWatchingPreview(),
    homePageLayout: testHomePageLayout()
  };
  
  console.log("📊 Test Results:", results);
  
  const allPassed = Object.values(results).every(result => 
    typeof result === 'boolean' ? result : Object.values(result).every(Boolean)
  );
  
  console.log(allPassed ? "✅ All tests passed!" : "❌ Some tests failed!");
  
  return results;
}

// Expose test functions globally
window.testTabBadgeCounts = testTabBadgeCounts;
window.testCurrentlyWatchingPreview = testCurrentlyWatchingPreview;
window.testHomePageLayout = testHomePageLayout;
window.runAllTests = runAllTests;

console.log("🧪 Test functions loaded. Run runAllTests() to execute all tests.");

