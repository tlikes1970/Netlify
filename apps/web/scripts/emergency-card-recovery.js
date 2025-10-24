// Emergency Card Recovery
// Run this in the browser console immediately

console.log('🚨 EMERGENCY CARD RECOVERY');

// Disable all compact mobile flags
localStorage.removeItem('flag:mobile_compact_v1');
localStorage.removeItem('flag:mobile_actions_split_v1');

// Set density back to normal
document.documentElement.dataset.density = 'normal';

// Remove all compact attributes
delete document.documentElement.dataset.compactMobileV1;
delete document.documentElement.dataset.actionsSplit;

console.log('✅ Disabled all compact mobile flags');
console.log('✅ Set density to normal');
console.log('✅ Removed compact attributes');

// Force gate re-evaluation
window.dispatchEvent(new Event('storage'));
window.dispatchEvent(new Event('resize'));
window.dispatchEvent(new Event('densitychange'));

console.log('🔄 Reloading page to restore cards...');
location.reload();
