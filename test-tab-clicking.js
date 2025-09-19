// Test: Tab clicking functionality
// Quick test to verify tab clicking works after fixes

console.log("🧪 Testing tab clicking functionality...");

// Test 1: Check if tab buttons exist
const tabButtons = ['homeTab', 'watchingTab', 'wishlistTab', 'watchedTab', 'discoverTab', 'settingsTab'];
console.log("🔍 Checking tab buttons...");
tabButtons.forEach(buttonId => {
  const button = document.getElementById(buttonId);
  if (button) {
    console.log(`✅ ${buttonId} exists`);
  } else {
    console.error(`❌ ${buttonId} missing`);
  }
});

// Test 2: Check if FlickletApp exists
if (window.FlickletApp) {
  console.log("✅ FlickletApp exists");
  if (typeof window.FlickletApp.switchToTab === 'function') {
    console.log("✅ switchToTab function exists");
  } else {
    console.error("❌ switchToTab function missing");
  }
} else {
  console.error("❌ FlickletApp not found");
}

// Test 3: Test tab switching programmatically
if (window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
  console.log("🔄 Testing programmatic tab switching...");
  
  const testTabs = ['watching', 'wishlist', 'watched', 'discover', 'settings'];
  let currentTest = 0;
  
  function testNextTab() {
    if (currentTest < testTabs.length) {
      const tab = testTabs[currentTest];
      console.log(`🔄 Switching to ${tab}...`);
      
      try {
        window.FlickletApp.switchToTab(tab);
        
        // Check if tab section is active
        setTimeout(() => {
          const section = document.getElementById(`${tab}Section`);
          if (section) {
            const isActive = section.classList.contains('active');
            console.log(`${isActive ? '✅' : '❌'} ${tab}Section active: ${isActive}`);
          }
          currentTest++;
          testNextTab();
        }, 500);
      } catch (error) {
        console.error(`❌ Error switching to ${tab}:`, error);
        currentTest++;
        testNextTab();
      }
    } else {
      // Return to home
      console.log("🔄 Returning to home...");
      window.FlickletApp.switchToTab('home');
      console.log("✅ Tab switching tests completed");
    }
  }
  
  testNextTab();
} else {
  console.error("❌ Cannot test tab switching - FlickletApp or switchToTab not available");
}

// Test 4: Test actual button clicks
console.log("🔄 Testing actual button clicks...");
const homeButton = document.getElementById('homeTab');
if (homeButton) {
  console.log("🖱️ Clicking home button...");
  homeButton.click();
  console.log("✅ Home button click dispatched");
} else {
  console.error("❌ Home button not found");
}

console.log("🧪 Tab clicking tests completed");
