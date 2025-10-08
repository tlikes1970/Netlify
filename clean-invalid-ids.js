/**
 * Clean Invalid TV Show IDs Script
 * Removes invalid TV show IDs that are causing 404 errors
 */

// Invalid TV show IDs that are causing 404 errors
const INVALID_TV_IDS = [
  328037,
  472192, 
  450132,
  1207571,
  490949,
  1271089
];

console.log('🧹 Starting cleanup of invalid TV show IDs...');
console.log('Invalid IDs to remove:', INVALID_TV_IDS);

// Get current data from localStorage
const currentData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
console.log('📊 Current data structure:', Object.keys(currentData));

let removedCount = 0;

// Clean TV watching list
if (currentData.tv?.watching) {
  const originalLength = currentData.tv.watching.length;
  currentData.tv.watching = currentData.tv.watching.filter(item => {
    const shouldKeep = !INVALID_TV_IDS.includes(item.id);
    if (!shouldKeep) {
      console.log(`🗑️ Removing invalid TV show: ${item.name || item.title} (ID: ${item.id})`);
      removedCount++;
    }
    return shouldKeep;
  });
  console.log(`📺 TV watching: ${originalLength} → ${currentData.tv.watching.length} items`);
}

// Clean TV wishlist
if (currentData.tv?.wishlist) {
  const originalLength = currentData.tv.wishlist.length;
  currentData.tv.wishlist = currentData.tv.wishlist.filter(item => {
    const shouldKeep = !INVALID_TV_IDS.includes(item.id);
    if (!shouldKeep) {
      console.log(`🗑️ Removing invalid TV show from wishlist: ${item.name || item.title} (ID: ${item.id})`);
      removedCount++;
    }
    return shouldKeep;
  });
  console.log(`📺 TV wishlist: ${originalLength} → ${currentData.tv.wishlist.length} items`);
}

// Clean TV watched list
if (currentData.tv?.watched) {
  const originalLength = currentData.tv.watched.length;
  currentData.tv.watched = currentData.tv.watched.filter(item => {
    const shouldKeep = !INVALID_TV_IDS.includes(item.id);
    if (!shouldKeep) {
      console.log(`🗑️ Removing invalid TV show from watched: ${item.name || item.title} (ID: ${item.id})`);
      removedCount++;
    }
    return shouldKeep;
  });
  console.log(`📺 TV watched: ${originalLength} → ${currentData.tv.watched.length} items`);
}

// Clean movies lists (in case any invalid IDs got mixed in)
if (currentData.movies?.watching) {
  const originalLength = currentData.movies.watching.length;
  currentData.movies.watching = currentData.movies.watching.filter(item => {
    const shouldKeep = !INVALID_TV_IDS.includes(item.id);
    if (!shouldKeep) {
      console.log(`🗑️ Removing invalid item from movies watching: ${item.name || item.title} (ID: ${item.id})`);
      removedCount++;
    }
    return shouldKeep;
  });
  console.log(`🎬 Movies watching: ${originalLength} → ${currentData.movies.watching.length} items`);
}

// Save cleaned data back to localStorage
localStorage.setItem('flicklet-data', JSON.stringify(currentData));

console.log(`✅ Cleanup complete! Removed ${removedCount} invalid items.`);
console.log('🔄 Please refresh the page to see the changes.');

// Also update window.appData if it exists
if (window.appData) {
  console.log('🔄 Updating window.appData...');
  window.appData = currentData;
}

return {
  success: true,
  removedCount,
  invalidIds: INVALID_TV_IDS
};



