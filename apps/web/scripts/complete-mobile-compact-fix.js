// Complete Mobile Compact Fix
// Run this in the browser console

console.log('🔧 Applying Complete Mobile Compact Fix...');

// Step 1: Enable the correct flag
localStorage.setItem('flag:mobile_actions_split_v1', 'true');
console.log('✅ Enabled mobile_actions_split_v1 flag');

// Step 2: Ensure compact mobile gate is active
localStorage.setItem('flag:mobile_compact_v1', 'true');
console.log('✅ Enabled mobile_compact_v1 flag');

// Step 3: Set density to compact
document.documentElement.dataset.density = 'compact';
console.log('✅ Set density to compact');

// Step 4: Force all gates to re-evaluate
window.dispatchEvent(new Event('storage'));
window.dispatchEvent(new Event('resize'));
window.dispatchEvent(new Event('densitychange'));
console.log('✅ Triggered gate re-evaluation');

// Step 5: Check current state
setTimeout(() => {
  const html = document.documentElement;
  console.log('🔍 Current State:');
  console.log('- data-compact-mobile-v1:', html.dataset.compactMobileV1);
  console.log('- data-actions-split:', html.dataset.actionsSplit);
  console.log('- data-density:', html.dataset.density);
  console.log('- Viewport width:', window.innerWidth);
  console.log('- Is mobile:', window.innerWidth < 768);
  
  // Check if SwipeRow should be active
  const shouldBeActive = html.dataset.compactMobileV1 === 'true' && 
                        html.dataset.actionsSplit === 'true' && 
                        window.innerWidth < 768;
  console.log('- SwipeRow should be active:', shouldBeActive);
  
  if (shouldBeActive) {
    console.log('🎉 Mobile compact should now be working!');
    console.log('🔄 Reloading page to apply changes...');
    location.reload();
  } else {
    console.log('❌ Something is still not right. Check the conditions above.');
  }
}, 1000);
