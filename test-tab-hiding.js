// Test: Tab hiding during search
// Tests that other tabs are hidden when search results are shown

console.log("🧪 Testing tab hiding during search...");

// Test 1: Check if SearchModule exists
if (window.SearchModule) {
  console.log("✅ SearchModule exists");
} else {
  console.error("❌ SearchModule not found");
  return;
}

// Test 2: Check if tab sections exist
const tabIds = ['home', 'watching', 'wishlist', 'watched', 'discover', 'settings'];
const tabs = {};
let allTabsExist = true;

tabIds.forEach(tabId => {
  const section = document.getElementById(tabId);
  if (section) {
    tabs[tabId] = section;
    console.log(`✅ Tab section found: ${tabId}`);
  } else {
    console.error(`❌ Tab section not found: ${tabId}`);
    allTabsExist = false;
  }
});

if (!allTabsExist) {
  console.error("❌ Some tab sections missing, cannot test tab hiding");
  return;
}

// Test 3: Check initial state - all tabs should be visible
console.log("🔍 Checking initial tab visibility...");
Object.entries(tabs).forEach(([id, section]) => {
  const isVisible = section.style.display !== 'none';
  console.log(`${isVisible ? '✅' : '❌'} ${id}: ${isVisible ? 'visible' : 'hidden'}`);
});

// Test 4: Simulate search to test tab hiding
console.log("🔍 Simulating search to test tab hiding...");
const searchInput = document.getElementById('search');
if (searchInput) {
  searchInput.value = 'test movie';
  console.log("✅ Search input value set");
  
  // Trigger search
  if (window.SearchModule.performSearch) {
    window.SearchModule.performSearch();
    console.log("✅ Search triggered");
    
    // Wait a moment for search to process
    setTimeout(() => {
      console.log("🔍 Checking tab visibility after search...");
      Object.entries(tabs).forEach(([id, section]) => {
        const isVisible = section.style.display !== 'none';
        console.log(`${isVisible ? '❌' : '✅'} ${id}: ${isVisible ? 'visible (should be hidden)' : 'hidden (correct)'}`);
      });
      
      // Test 5: Clear search to test tab showing
      console.log("🧹 Testing clear search...");
      if (window.SearchModule.clearSearch) {
        window.SearchModule.clearSearch();
        console.log("✅ Clear search called");
        
        // Wait a moment for clear to process
        setTimeout(() => {
          console.log("🔍 Checking tab visibility after clear...");
          Object.entries(tabs).forEach(([id, section]) => {
            const isVisible = section.style.display !== 'none';
            console.log(`${isVisible ? '✅' : '❌'} ${id}: ${isVisible ? 'visible (correct)' : 'hidden (should be visible)'}`);
          });
          
          console.log("🧪 Tab hiding tests completed");
        }, 500);
      }
    }, 1000);
  } else {
    console.error("❌ SearchModule.performSearch not available");
  }
} else {
  console.error("❌ Search input not found");
}

console.log("🧪 Tab hiding test initiated");
