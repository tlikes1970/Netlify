/**
 * Debug Token Gate Script
 * Purpose: Debug why the gate logic isn't working in the browser
 */

console.log('🔍 Debug Token Gate Logic');
console.log('=========================');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('✅ Browser environment detected');
  
  // Check flag function
  try {
    const flagValue = localStorage.getItem('flag:mobile_compact_v1');
    console.log('Flag value:', flagValue);
  } catch (e) {
    console.log('❌ Error reading flag:', e.message);
  }
  
  // Check mobile detection
  try {
    const isMobile = matchMedia('(max-width: 768px)').matches;
    console.log('Is mobile:', isMobile);
  } catch (e) {
    console.log('❌ Error checking mobile:', e.message);
  }
  
  // Check density attribute
  const density = document.documentElement.dataset.density;
  console.log('Density attribute:', density);
  
  // Check compact attribute
  const compactAttr = document.documentElement.dataset.compactMobileV1;
  console.log('Compact attribute:', compactAttr);
  
  // Check computed style
  try {
    const posterW = getComputedStyle(document.documentElement).getPropertyValue('--poster-w').trim();
    console.log('Computed --poster-w:', posterW);
  } catch (e) {
    console.log('❌ Error getting computed style:', e.message);
  }
  
} else {
  console.log('❌ Not in browser environment');
}
