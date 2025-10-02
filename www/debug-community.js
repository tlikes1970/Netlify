// Debug script for Community Rotator
// Run this in the browser console to see what's happening

console.log('🔍 Debugging Community Rotator...');

// Test 1: Check if elements exist
(() => {
  console.log('=== ELEMENT DETECTION ===');
  const root = document.getElementById('group-2-community');
  console.log('Root (group-2-community):', root);
  
  if (root) {
    const content = root.querySelector('.community-content');
    const left = root.querySelector('.community-left');
    const right = root.querySelector('.community-right');
    const player = root.querySelector('#community-player');
    
    console.log('Content (.community-content):', content);
    console.log('Left (.community-left):', left);
    console.log('Right (.community-right):', right);
    console.log('Player (#community-player):', player);
    
    if (player) {
      console.log('Player innerHTML:', player.innerHTML);
      console.log('Player children:', [...player.children]);
    }
  }
})();

// Test 2: Check if scripts loaded
(() => {
  console.log('=== SCRIPT LOADING ===');
  const scripts = [...document.querySelectorAll('script[src*="community"]')];
  console.log('Community scripts found:', scripts.map(s => s.src));
})();

// Test 3: Check for rotator initialization
(() => {
  console.log('=== ROTATOR STATE ===');
  console.log('Window rotator:', window.rotator);
  console.log('Community namespace in console:', console.log.toString().includes('[community]'));
})();

// Test 4: Manual data fetch test
(() => {
  console.log('=== DATA FETCH TEST ===');
  fetch('/data/community-seed.json')
    .then(res => res.json())
    .then(data => {
      console.log('Community data loaded:', data);
      console.log('Rotation items count:', data.rotation?.length || 0);
    })
    .catch(err => console.error('Data fetch failed:', err));
})();

// Test 5: Force initialization
(() => {
  console.log('=== FORCE INIT ===');
  // Try to trigger the rotator manually
  document.dispatchEvent(new Event('app:data:ready'));
  document.dispatchEvent(new Event('community:changed'));
  console.log('Events dispatched');
})();

console.log('🔍 Debug complete - check results above');








