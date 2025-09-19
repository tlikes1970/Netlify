// Test: Search Enter key functionality
// Tests that pressing Enter in search input triggers search

console.log("🧪 Testing search Enter key functionality...");

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

// Test 3: Test Enter key event
if (searchInput && searchBtn) {
  // Set up a mock click handler to track if button click is triggered
  let buttonClicked = false;
  const originalClick = searchBtn.onclick;
  searchBtn.onclick = function() {
    buttonClicked = true;
    console.log("✅ Search button click triggered by Enter key");
    if (originalClick) originalClick.call(this);
  };

  // Set search input value
  searchInput.value = 'test query';
  console.log("✅ Search input value set");

  // Create and dispatch Enter key event
  const enterEvent = new KeyboardEvent('keydown', { 
    key: 'Enter',
    bubbles: true,
    cancelable: true
  });
  
  console.log("🔍 Dispatching Enter key event...");
  searchInput.dispatchEvent(enterEvent);
  
  // Check if button was clicked
  setTimeout(() => {
    if (buttonClicked) {
      console.log("✅ Enter key successfully triggered search button click");
    } else {
      console.error("❌ Enter key did not trigger search button click");
    }
    
    // Restore original click handler
    searchBtn.onclick = originalClick;
  }, 100);
} else {
  console.error("❌ Cannot test Enter key - missing search input or button");
}

// Test 4: Check if performSearch function exists
if (typeof window.performSearch === 'function') {
  console.log("✅ performSearch function exists");
} else {
  console.error("❌ performSearch function missing");
}

console.log("🧪 Search Enter key tests completed");
