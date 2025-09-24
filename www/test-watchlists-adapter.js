// Test script for WatchlistsAdapter v28.18
// This script tests the WatchlistsAdapter functionality

console.log('🧪 Testing WatchlistsAdapter v28.18...');

// Test 1: Check if WatchlistsAdapter exists
if (typeof window.WatchlistsAdapter === 'undefined') {
  console.error('❌ WatchlistsAdapter not found');
} else {
  console.log('✅ WatchlistsAdapter found');
}

// Test 2: Check feature flag
if (window.FLAGS && window.FLAGS.useWatchlistsAdapter) {
  console.log('✅ Feature flag useWatchlistsAdapter is enabled');
} else {
  console.warn('⚠️ Feature flag useWatchlistsAdapter is disabled');
}

// Test 3: Test adapter methods
if (window.WatchlistsAdapter) {
  console.log('🔍 Testing adapter methods...');
  
  // Test load method
  if (typeof window.WatchlistsAdapter.load === 'function') {
    console.log('✅ load method exists');
  } else {
    console.error('❌ load method missing');
  }
  
  // Test moveItem method
  if (typeof window.WatchlistsAdapter.moveItem === 'function') {
    console.log('✅ moveItem method exists');
  } else {
    console.error('❌ moveItem method missing');
  }
  
  // Test removeItem method
  if (typeof window.WatchlistsAdapter.removeItem === 'function') {
    console.log('✅ removeItem method exists');
  } else {
    console.error('❌ removeItem method missing');
  }
  
  // Test invalidate method
  if (typeof window.WatchlistsAdapter.invalidate === 'function') {
    console.log('✅ invalidate method exists');
  } else {
    console.error('❌ invalidate method missing');
  }
}

// Test 4: Check if debug exposure exists
if (window.__wl) {
  console.log('✅ Debug exposure window.__wl found:', window.__wl);
} else {
  console.log('ℹ️ Debug exposure window.__wl not yet available (will be set after first load)');
}

// Test 5: Check version in title
const title = document.title;
if (title.includes('v28.18')) {
  console.log('✅ Version v28.18 confirmed in title');
} else {
  console.warn('⚠️ Version v28.18 not found in title:', title);
}

console.log('🧪 WatchlistsAdapter tests complete');
