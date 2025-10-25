/**
 * Enable Mobile Flags Script
 * Sets the required localStorage flags to enable mobile card components
 */

console.log('🚀 Enabling mobile flags...');

// Set the required flags in localStorage
localStorage.setItem('flag:mobile_compact_v1', 'true');
localStorage.setItem('flag:mobile_actions_split_v1', 'true');

console.log('✅ Mobile flags enabled:');
console.log('- flag:mobile_compact_v1 =', localStorage.getItem('flag:mobile_compact_v1'));
console.log('- flag:mobile_actions_split_v1 =', localStorage.getItem('flag:mobile_actions_split_v1'));

// Force refresh the page to apply changes
console.log('🔄 Refreshing page to apply changes...');
window.location.reload();
