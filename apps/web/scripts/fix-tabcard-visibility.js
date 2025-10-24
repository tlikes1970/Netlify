// Quick Fix for TabCard Visibility Issue
// Run this in the browser console

console.log('🔧 Applying TabCard Visibility Fix...');

// Enable the actions_split flag to show proper compact actions
localStorage.setItem('flag:actions_split', 'true');

// Force the gate to re-evaluate
window.dispatchEvent(new Event('storage'));

console.log('✅ Actions split flag enabled');
console.log('🔄 Reloading page to apply changes...');

// Reload the page to apply the changes
setTimeout(() => {
  location.reload();
}, 1000);
