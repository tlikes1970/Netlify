/**
 * Enable Mobile Flags - Browser Console Script
 * Run this in the browser console to enable mobile card components
 */

console.log('🚀 Enabling mobile flags...');

// Set the required flags in localStorage
localStorage.setItem('flag:mobile_compact_v1', 'true');
localStorage.setItem('flag:mobile_actions_split_v1', 'true');

console.log('✅ Mobile flags enabled:');
console.log('- flag:mobile_compact_v1 =', localStorage.getItem('flag:mobile_compact_v1'));
console.log('- flag:mobile_actions_split_v1 =', localStorage.getItem('flag:mobile_actions_split_v1'));

// Check if flags are now active
console.log('🔍 Checking flag status:');
console.log('- document.documentElement.dataset.compactMobileV1 =', document.documentElement.dataset.compactMobileV1);
console.log('- document.documentElement.dataset.actionsSplit =', document.documentElement.dataset.actionsSplit);
console.log('- window.innerWidth =', window.innerWidth);

// Force refresh the page to apply changes
console.log('🔄 Refreshing page to apply changes...');
window.location.reload();

