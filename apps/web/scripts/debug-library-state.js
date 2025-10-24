// Enhanced debug script to check Library state and UI connection
// Run this in the browser console

console.log('🔍 Debugging Library State (Enhanced)...');

// Check localStorage data
const libraryData = localStorage.getItem('flicklet.library.v2');
if (libraryData) {
  const parsed = JSON.parse(libraryData);
  const watchingItems = Object.values(parsed).filter(item => item.list === 'watching');
  const wishlistItems = Object.values(parsed).filter(item => item.list === 'wishlist');
  const watchedItems = Object.values(parsed).filter(item => item.list === 'watched');
  
  console.log('📚 localStorage data:');
  console.log('- Total items:', Object.keys(parsed).length);
  console.log('- Watching items:', watchingItems.length);
  console.log('- Wishlist items:', wishlistItems.length);
  console.log('- Watched items:', watchedItems.length);
  
  if (watchingItems.length > 0) {
    console.log('- Sample watching item:', {
      title: watchingItems[0].title,
      mediaType: watchingItems[0].mediaType,
      list: watchingItems[0].list
    });
  }
  
  // Try to manually trigger Library reload
  console.log('🔄 Attempting manual Library reload...');
  
  // Dispatch multiple events to trigger updates
  window.dispatchEvent(new CustomEvent('library:updated'));
  window.dispatchEvent(new CustomEvent('library:reloaded'));
  
  console.log('✅ Library update events dispatched');
  
  // Check if we can access the Library through the window (if exposed)
  if (window.Library) {
    console.log('🔍 Found Library on window, checking state...');
    const libraryWatching = window.Library.getByList('watching');
    console.log('- Library.getByList("watching"):', libraryWatching.length, 'items');
  } else {
    console.log('ℹ️ Library not exposed on window (normal for React V2)');
  }
  
} else {
  console.log('❌ No library data in localStorage');
}

// Check for Firebase sync logs
console.log('🔍 Check browser console for Firebase sync logs:');
console.log('- "📥 Loading data from Firebase for user:"');
console.log('- "✅ Firebase data loaded and merged"');
console.log('- "🔄 Library state reloaded from localStorage"');
console.log('- "🔄 Firebase sync - forcing second Library reload..."');

// Check for Library hook logs
console.log('🔍 Check browser console for Library hook logs:');
console.log('- "🔍 useLibrary(watching) initial state: X items"');
console.log('- "🔍 useLibrary(watching) effect - current items: X items"');
console.log('- "🔔 Library.subscribe(watching) triggered: X items"');
console.log('- "🔍 useLibrary(watching) returning: X items"');

// Manual test function
window.testLibraryReload = function() {
  console.log('🧪 Manual Library reload test...');
  
  // Try to trigger a reload by dispatching events
  window.dispatchEvent(new CustomEvent('library:updated'));
  window.dispatchEvent(new CustomEvent('library:reloaded'));
  
  // Check localStorage again
  const data = localStorage.getItem('flicklet.library.v2');
  if (data) {
    const parsed = JSON.parse(data);
    const watching = Object.values(parsed).filter(item => item.list === 'watching');
    console.log('📊 Current watching items in localStorage:', watching.length);
  }
  
  console.log('✅ Manual reload test completed - check console for Library logs');
};

console.log('🎯 Run window.testLibraryReload() to manually test Library reload');
console.log('🎯 If localStorage has data but UI is empty, the issue is likely:');
console.log('1. Library singleton not reloading properly');
console.log('2. useLibrary hook not subscribing to updates');
console.log('3. React components not re-rendering after state change');
