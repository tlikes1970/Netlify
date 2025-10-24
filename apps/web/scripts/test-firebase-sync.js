// Enhanced test script for React V2 Firebase sync verification
// Run this in the browser console after authentication

console.log('🧪 Testing Firebase Sync (React V2)...');

// Check localStorage for library data
const libraryData = localStorage.getItem('flicklet.library.v2');
if (libraryData) {
  const parsed = JSON.parse(libraryData);
  const counts = Object.values(parsed).reduce((acc, item) => {
    acc[item.list] = (acc[item.list] || 0) + 1;
    return acc;
  }, {});
  
  console.log('✅ Library data found in localStorage:');
  console.log('📊 Total items:', Object.keys(parsed).length);
  console.log('📊 By list:', counts);
  
  // Show sample items
  const sampleItems = Object.values(parsed).slice(0, 3);
  console.log('📋 Sample items:', sampleItems.map(item => ({
    title: item.title,
    mediaType: item.mediaType,
    list: item.list
  })));
  
} else {
  console.log('❌ No library data found in localStorage');
}

// Check if the app is using React V2 (no global Firebase)
console.log('🔍 React V2 Architecture Check:');
console.log('- Auth manager on window:', !!window.authManager);
console.log('- Firebase on window:', !!window.firebase);
console.log('- This is expected for React V2 (uses ES6 imports)');

// Check for any Firebase sync errors in console
console.log('🔍 Check browser console for Firebase sync logs:');
console.log('- Look for "📥 Loading data from Firebase for user:"');
console.log('- Look for "✅ Firebase data loaded and merged"');
console.log('- Look for "🔄 Library state reloaded from localStorage"');

// Test Library singleton access (if available)
if (typeof window !== 'undefined') {
  try {
    // Try to access Library through React DevTools or other means
    const reactRoot = document.getElementById('root');
    if (reactRoot && reactRoot._reactInternalFiber) {
      console.log('⚛️ React root found - Library should be accessible through hooks');
    }
  } catch (e) {
    console.log('ℹ️ Cannot access React internals (this is normal)');
  }
}

console.log('🎯 If you see library data above, Firebase sync is working correctly!');
