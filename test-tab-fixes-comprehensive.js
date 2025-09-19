// Test: Comprehensive Tab Functionality After Fixes
// Tests all tab clicking functionality after critical fixes

console.log("🧪 Testing comprehensive tab functionality after fixes...");

// Test 1: Check all tab buttons exist and have correct classes
const tabButtons = [
  'homeTab', 'watchingTab', 'wishlistTab', 'watchedTab', 'discoverTab', 'settingsTab'
];

console.log("\n📋 Testing tab button structure:");
tabButtons.forEach(buttonId => {
  const button = document.getElementById(buttonId);
  if (button) {
    const hasTabClass = button.classList.contains('tab');
    const hasCorrectId = button.id === buttonId;
    console.log(`✅ ${buttonId}: exists=${!!button}, has-tab-class=${hasTabClass}, correct-id=${hasCorrectId}`);
    
    if (!hasTabClass) {
      console.error(`❌ ${buttonId} missing .tab class`);
    }
  } else {
    console.error(`❌ ${buttonId} not found`);
  }
});

// Test 2: Check delegated event handler setup
console.log("\n🎯 Testing delegated event handler:");
const tabContainer = document.querySelector('.tab-container');
if (tabContainer) {
  console.log("✅ Tab container found");
  
  // Check if event listener is attached
  const hasClickListener = tabContainer.onclick !== null;
  console.log(`✅ Tab container click handler: ${hasClickListener ? 'inline' : 'delegated'}`);
} else {
  console.error("❌ Tab container not found");
}

// Test 3: Check global switchToTab function
console.log("\n🌐 Testing global switchToTab function:");
if (typeof window.switchToTab === 'function') {
  console.log("✅ window.switchToTab function exists");
  
  // Test if it calls FlickletApp.switchToTab
  const originalSwitchToTab = window.FlickletApp?.switchToTab;
  if (originalSwitchToTab) {
    let called = false;
    window.FlickletApp.switchToTab = function(tab) {
      called = true;
      console.log(`✅ Global switchToTab called FlickletApp.switchToTab with: ${tab}`);
    };
    
    // Test call
    window.switchToTab('test');
    
    if (called) {
      console.log("✅ Global switchToTab correctly calls FlickletApp.switchToTab");
    } else {
      console.error("❌ Global switchToTab does not call FlickletApp.switchToTab");
    }
    
    // Restore original
    window.FlickletApp.switchToTab = originalSwitchToTab;
  } else {
    console.warn("⚠️ FlickletApp.switchToTab not available for testing");
  }
} else {
  console.error("❌ window.switchToTab function missing");
}

// Test 4: Check FlickletApp.switchToTab function
console.log("\n🏠 Testing FlickletApp.switchToTab function:");
if (window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
  console.log("✅ FlickletApp.switchToTab function exists");
} else {
  console.error("❌ FlickletApp.switchToTab function missing");
}

// Test 5: Simulate tab clicks
console.log("\n🖱️ Testing tab click simulation:");
tabButtons.forEach(buttonId => {
  const button = document.getElementById(buttonId);
  if (button) {
    console.log(`Testing click on ${buttonId}...`);
    
    // Create and dispatch click event
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    try {
      button.dispatchEvent(clickEvent);
      console.log(`✅ ${buttonId} click event dispatched successfully`);
    } catch (error) {
      console.error(`❌ ${buttonId} click event failed:`, error.message);
    }
  }
});

// Test 6: Check tab sections exist
console.log("\n📄 Testing tab sections:");
const tabSections = [
  'homeSection', 'watchingSection', 'wishlistSection', 'watchedSection', 'discoverSection', 'settingsSection'
];

tabSections.forEach(sectionId => {
  const section = document.getElementById(sectionId);
  if (section) {
    console.log(`✅ ${sectionId} exists`);
  } else {
    console.error(`❌ ${sectionId} not found`);
  }
});

// Test 7: Check CSS classes for tab visibility
console.log("\n🎨 Testing CSS classes:");
const homeSection = document.getElementById('homeSection');
if (homeSection) {
  const hasTabSectionClass = homeSection.classList.contains('tab-section');
  const hasActiveClass = homeSection.classList.contains('active');
  console.log(`✅ homeSection: tab-section=${hasTabSectionClass}, active=${hasActiveClass}`);
} else {
  console.error("❌ homeSection not found for CSS testing");
}

// Test 8: Check performance monitor interference
console.log("\n📊 Testing performance monitor interference:");
const performanceMonitor = window.PerformanceMonitor;
if (performanceMonitor) {
  console.log("✅ PerformanceMonitor exists");
  
  // Check if it has the updated observeUserInteractions method
  if (typeof performanceMonitor.observeUserInteractions === 'function') {
    console.log("✅ observeUserInteractions method exists");
  } else {
    console.error("❌ observeUserInteractions method missing");
  }
} else {
  console.warn("⚠️ PerformanceMonitor not available");
}

console.log("\n🧪 Comprehensive tab functionality tests completed!");
console.log("📝 Summary: Check the results above for any ❌ errors that need attention.");
