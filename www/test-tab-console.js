// Simple console test for tab functionality
// Run this in the browser console after the page loads

console.log("🧪 Running simple tab functionality test...");

// Test 1: Check tab buttons
const tabButtons = ['homeTab', 'watchingTab', 'wishlistTab', 'watchedTab', 'discoverTab', 'settingsTab'];
console.log("\n📋 Tab Button Check:");
tabButtons.forEach(id => {
    const btn = document.getElementById(id);
    const hasTabClass = btn?.classList.contains('tab');
    console.log(`${id}: ${btn ? '✅' : '❌'} ${hasTabClass ? '✅' : '❌'} .tab class`);
});

// Test 2: Check functions
console.log("\n🌐 Function Check:");
console.log(`window.switchToTab: ${typeof window.switchToTab === 'function' ? '✅' : '❌'}`);
console.log(`FlickletApp.switchToTab: ${typeof window.FlickletApp?.switchToTab === 'function' ? '✅' : '❌'}`);

// Test 3: Test a tab click
console.log("\n🖱️ Testing homeTab click:");
const homeTab = document.getElementById('homeTab');
if (homeTab) {
    homeTab.click();
    console.log("✅ homeTab click dispatched");
} else {
    console.log("❌ homeTab not found");
}

// Test 4: Check current tab
console.log("\n📊 Current State:");
console.log(`Current tab: ${window.FlickletApp?.currentTab || 'unknown'}`);
console.log(`Active section: ${document.querySelector('.tab-section.active')?.id || 'none'}`);

console.log("\n✅ Simple test completed!");
