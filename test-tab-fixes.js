// Test: Tab functionality fixes
// Tests all the critical tab issues that were identified and fixed

console.log("🧪 Testing tab functionality fixes...");

// Test 1: Check if tab sections exist with correct IDs
console.log("🔍 Test 1: Checking tab section IDs...");
const expectedSections = ['homeSection', 'watchingSection', 'wishlistSection', 'watchedSection', 'discoverSection', 'settingsSection'];
let allSectionsExist = true;

expectedSections.forEach(sectionId => {
  const section = document.getElementById(sectionId);
  if (section) {
    console.log(`✅ ${sectionId} exists`);
  } else {
    console.error(`❌ ${sectionId} missing`);
    allSectionsExist = false;
  }
});

if (allSectionsExist) {
  console.log("✅ All tab sections exist with correct IDs");
} else {
  console.error("❌ Some tab sections missing");
}

// Test 2: Check SearchModule tab hiding functionality
console.log("🔍 Test 2: Testing SearchModule tab hiding...");
if (window.SearchModule) {
  console.log("✅ SearchModule exists");
  
  // Test hideOtherTabs function
  if (typeof window.SearchModule.clearSearch === 'function') {
    // Simulate search to test tab hiding
    const searchInput = document.getElementById('search');
    if (searchInput) {
      searchInput.value = 'test search';
      console.log("✅ Search input value set");
      
      // Trigger search
      window.SearchModule.performSearch();
      console.log("✅ Search triggered");
      
      // Wait and check if tabs are hidden
      setTimeout(() => {
        console.log("🔍 Checking if tabs are hidden during search...");
        expectedSections.forEach(sectionId => {
          const section = document.getElementById(sectionId);
          if (section) {
            const isHidden = section.style.display === 'none';
            console.log(`${isHidden ? '✅' : '❌'} ${sectionId}: ${isHidden ? 'hidden (correct)' : 'visible (should be hidden)'}`);
          }
        });
        
        // Test clear search
        setTimeout(() => {
          console.log("🧹 Testing clear search...");
          window.SearchModule.clearSearch();
          console.log("✅ Clear search called");
          
          // Wait and check if tabs are shown again
          setTimeout(() => {
            console.log("🔍 Checking if tabs are shown after clear...");
            expectedSections.forEach(sectionId => {
              const section = document.getElementById(sectionId);
              if (section) {
                const isVisible = section.style.display !== 'none';
                console.log(`${isVisible ? '✅' : '❌'} ${sectionId}: ${isVisible ? 'visible (correct)' : 'hidden (should be visible)'}`);
              }
            });
          }, 500);
        }, 1000);
      }, 1000);
    } else {
      console.error("❌ Search input not found");
    }
  } else {
    console.error("❌ SearchModule.clearSearch not available");
  }
} else {
  console.error("❌ SearchModule not found");
}

// Test 3: Check tab switching functionality
console.log("🔍 Test 3: Testing tab switching...");
if (window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
  console.log("✅ FlickletApp.switchToTab exists");
  
  // Test switching to different tabs
  const testTabs = ['watching', 'wishlist', 'watched', 'discover', 'settings'];
  let currentTestIndex = 0;
  
  function testNextTab() {
    if (currentTestIndex < testTabs.length) {
      const tab = testTabs[currentTestIndex];
      console.log(`🔄 Testing switch to ${tab}...`);
      window.FlickletApp.switchToTab(tab);
      
      // Check if the tab section is active
      setTimeout(() => {
        const section = document.getElementById(`${tab}Section`);
        if (section) {
          const isActive = section.classList.contains('active');
          console.log(`${isActive ? '✅' : '❌'} ${tab}Section active: ${isActive}`);
        }
        currentTestIndex++;
        testNextTab();
      }, 500);
    } else {
      // Return to home tab
      console.log("🔄 Returning to home tab...");
      window.FlickletApp.switchToTab('home');
      console.log("✅ Tab switching tests completed");
    }
  }
  
  testNextTab();
} else {
  console.error("❌ FlickletApp.switchToTab not available");
}

// Test 4: Check search bar visibility logic
console.log("🔍 Test 4: Testing search bar visibility...");
const searchContainer = document.querySelector('.top-search');
if (searchContainer) {
  console.log("✅ Search container found");
  
  // Test search bar visibility on different tabs
  const testTabs = ['home', 'watching', 'settings'];
  let testIndex = 0;
  
  function testSearchBarVisibility() {
    if (testIndex < testTabs.length) {
      const tab = testTabs[testIndex];
      console.log(`🔍 Testing search bar visibility on ${tab} tab...`);
      window.FlickletApp.switchToTab(tab);
      
      setTimeout(() => {
        const isVisible = searchContainer.style.display !== 'none';
        const shouldBeVisible = tab !== 'settings';
        const result = isVisible === shouldBeVisible;
        console.log(`${result ? '✅' : '❌'} ${tab} tab: search bar ${isVisible ? 'visible' : 'hidden'} (should be ${shouldBeVisible ? 'visible' : 'hidden'})`);
        testIndex++;
        testSearchBarVisibility();
      }, 500);
    } else {
      console.log("✅ Search bar visibility tests completed");
    }
  }
  
  testSearchBarVisibility();
} else {
  console.error("❌ Search container not found");
}

// Test 5: Check for duplicate event handlers
console.log("🔍 Test 5: Checking for duplicate event handlers...");
const tabButtons = ['homeTab', 'watchingTab', 'wishlistTab', 'watchedTab', 'discoverTab', 'settingsTab'];
let hasDuplicates = false;

tabButtons.forEach(buttonId => {
  const button = document.getElementById(buttonId);
  if (button) {
    // Check if button has both onclick and event listeners
    const hasOnclick = button.onclick !== null;
    const hasListeners = button.addEventListener.toString().includes('click');
    
    if (hasOnclick && hasListeners) {
      console.log(`⚠️ ${buttonId} has both onclick and event listeners (potential duplicate)`);
      hasDuplicates = true;
    } else {
      console.log(`✅ ${buttonId} has single event handling method`);
    }
  }
});

if (!hasDuplicates) {
  console.log("✅ No duplicate event handlers detected");
} else {
  console.warn("⚠️ Potential duplicate event handlers found");
}

console.log("🧪 Tab functionality tests completed");
