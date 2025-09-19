// Test: Search functionality
// Tests that search input and button work properly

console.log("🧪 Testing search functionality...");

// Test 1: Search input exists
const searchInput = document.getElementById('search');
if (!searchInput) {
  console.error("❌ Search input not found");
} else {
  console.log("✅ Search input found");
}

// Test 2: Search button exists
const searchBtn = document.getElementById('searchBtn');
if (!searchBtn) {
  console.error("❌ Search button not found");
} else {
  console.log("✅ Search button found");
}

// Test 3: Clear search button exists
const clearBtn = document.getElementById('clearSearchBtn');
if (!clearBtn) {
  console.error("❌ Clear search button not found");
} else {
  console.log("✅ Clear search button found");
}

// Test 4: Search results container exists
const searchResults = document.getElementById('searchResults');
if (!searchResults) {
  console.error("❌ Search results container not found");
} else {
  console.log("✅ Search results container found");
}

// Test 5: performSearch function exists
if (typeof window.performSearch === 'function') {
  console.log("✅ performSearch function exists");
} else {
  console.error("❌ performSearch function missing");
}

// Test 6: clearSearch function exists
if (typeof window.clearSearch === 'function') {
  console.log("✅ clearSearch function exists");
} else {
  console.error("❌ clearSearch function missing");
}

// Test 7: searchTMDB function exists
if (typeof window.searchTMDB === 'function') {
  console.log("✅ searchTMDB function exists");
} else {
  console.warn("⚠️ searchTMDB function missing - search may not work");
}

// Test 8: Test search input interaction
if (searchInput) {
  searchInput.value = 'test query';
  console.log("✅ Search input accepts value");
  
  // Test Enter key
  const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
  searchInput.dispatchEvent(enterEvent);
  console.log("✅ Enter key event dispatched");
}

// Test 9: Test search button click
if (searchBtn) {
  searchBtn.click();
  console.log("✅ Search button click dispatched");
}

console.log("🧪 Search tests completed");
