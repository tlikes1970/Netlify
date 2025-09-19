// Test: Search functionality rewrite
// Tests the new search module functionality

console.log("🧪 Testing search functionality rewrite...");

// Test 1: Search module exists
if (window.SearchModule) {
  console.log("✅ SearchModule exists");
} else {
  console.error("❌ SearchModule not found");
}

// Test 2: Search module methods exist
if (window.SearchModule) {
  const methods = ['init', 'performSearch', 'clearSearch', 'getSearchState', 'openItemDetails'];
  methods.forEach(method => {
    if (typeof window.SearchModule[method] === 'function') {
      console.log(`✅ SearchModule.${method} exists`);
    } else {
      console.error(`❌ SearchModule.${method} missing`);
    }
  });
}

// Test 3: Search elements exist
const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearSearchBtn');
const searchResults = document.getElementById('searchResults');

if (searchInput) {
  console.log("✅ Search input found");
} else {
  console.error("❌ Search input not found");
}

if (searchBtn) {
  console.log("✅ Search button found");
} else {
  console.error("❌ Search button not found");
}

if (clearBtn) {
  console.log("✅ Clear button found");
} else {
  console.error("❌ Clear button not found");
}

if (searchResults) {
  console.log("✅ Search results container found");
} else {
  console.error("❌ Search results container not found");
}

// Test 4: Search state
if (window.SearchModule) {
  const state = window.SearchModule.getSearchState();
  console.log("✅ Search state:", state);
} else {
  console.error("❌ Cannot get search state");
}

// Test 5: TMDB functions exist
if (typeof window.searchTMDB === 'function') {
  console.log("✅ searchTMDB function exists");
} else {
  console.error("❌ searchTMDB function missing");
}

if (typeof window.tmdbGet === 'function') {
  console.log("✅ tmdbGet function exists");
} else {
  console.error("❌ tmdbGet function missing");
}

// Test 6: Simulate search input
if (searchInput && window.SearchModule) {
  searchInput.value = 'test movie';
  console.log("✅ Search input value set");
  
  // Test Enter key
  const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
  searchInput.dispatchEvent(enterEvent);
  console.log("✅ Enter key event dispatched");
  
  // Test search button click
  if (searchBtn) {
    searchBtn.click();
    console.log("✅ Search button click dispatched");
  }
}

// Test 7: Test clear search
if (window.SearchModule) {
  setTimeout(() => {
    window.SearchModule.clearSearch();
    console.log("✅ Clear search called");
  }, 1000);
}

console.log("🧪 Search rewrite tests completed");
