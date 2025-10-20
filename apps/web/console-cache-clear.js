// Simple cache clearing script - copy and paste this into browser console

function clearAllGameCaches() {
  console.log('🗑️ Clearing all game caches...');
  
  // Clear FlickWord cache
  try {
    localStorage.removeItem('flicklet:daily-word');
    console.log('✅ Cleared FlickWord cache');
  } catch (error) {
    console.warn('❌ Failed to clear FlickWord cache:', error);
  }
  
  // Clear Trivia cache
  try {
    localStorage.removeItem('flicklet:daily-trivia');
    console.log('✅ Cleared Trivia cache');
  } catch (error) {
    console.warn('❌ Failed to clear Trivia cache:', error);
  }
  
  // Clear any other game-related caches
  const gameKeys = Object.keys(localStorage).filter(key => 
    key.includes('flicklet') || key.includes('flickword') || key.includes('trivia')
  );
  
  gameKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`✅ Cleared ${key}`);
    } catch (error) {
      console.warn(`❌ Failed to clear ${key}:`, error);
    }
  });
  
  console.log('🎉 All game caches cleared! Refresh the page to get fresh content.');
}

// Run it immediately
clearAllGameCaches();
