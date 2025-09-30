// Test script for Community Rotator
// Run this in the browser console after the page loads

console.log('🧪 Testing Community Rotator...');

// Test 1: Layout detection
(() => {
  const root = document.getElementById('group-2-community');
  const feed = root?.querySelector('.community-content');
  const player = root?.querySelector('#community-player');
  const left = root?.querySelector('.community-left');
  const right = root?.querySelector('.community-right');
  console.log('✅ Layout Detection:', { 
    hasRoot: !!root, 
    hasFeed: !!feed, 
    hasPlayer: !!player,
    hasLeft: !!left,
    hasRight: !!right
  });
})();

// Test 2: Force refresh
(() => {
  console.log('🔄 Forcing community refresh...');
  document.dispatchEvent(new Event('community:changed'));
  console.log('✅ Refresh event fired');
})();

// Test 3: Check if rotator is running
(() => {
  const player = document.querySelector('#community-player');
  const viewport = player?.querySelector('.player-viewport');
  const controls = player?.querySelector('.player-controls');
  const caption = player?.querySelector('.player-caption');
  
  console.log('✅ Rotator Elements:', {
    hasViewport: !!viewport,
    hasControls: !!controls,
    hasCaption: !!caption,
    viewportContent: viewport?.innerHTML?.length || 0
  });
})();

// Test 4: Manual navigation test
(() => {
  const nextBtn = document.querySelector('#community-player .player-controls .next');
  const prevBtn = document.querySelector('#community-player .player-controls .prev');
  
  if (nextBtn && prevBtn) {
    console.log('✅ Navigation controls found - testing...');
    nextBtn.click();
    setTimeout(() => prevBtn.click(), 1000);
    console.log('✅ Navigation test completed');
  } else {
    console.log('❌ Navigation controls not found');
  }
})();

console.log('🧪 Community Rotator tests completed!');
