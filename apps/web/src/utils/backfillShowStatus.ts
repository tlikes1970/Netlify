// Backfill show status for existing TV shows in the library
import { Library } from '../lib/storage';
import { fetchShowStatus } from '../tmdb/tv';
// ⚠️ REMOVED: debugGate diagnostics disabled

export async function backfillShowStatus() {
  // ⚠️ REMOVED: debugGate diagnostics disabled
  
  // Get all items from the library state
  const watchingItems = Library.getByList('watching');
  const wishlistItems = Library.getByList('wishlist');
  const watchedItems = Library.getByList('watched');
  const notItems = Library.getByList('not');
  
  const allItems = watchingItems.concat(wishlistItems).concat(watchedItems).concat(notItems);
  
  const tvShows = allItems.filter(item => 
    item.mediaType === 'tv' && 
    (!item.showStatus || item.showStatus === undefined)
  );
  
  for (const show of tvShows) {
    try {
      const statusData = await fetchShowStatus(Number(show.id));
      
      if (statusData) {
        // Update the show with status data
        Library.upsert({
          ...show,
          showStatus: statusData.status as 'Ended' | 'Returning Series' | 'In Production' | 'Canceled' | 'Planned' | undefined,
          lastAirDate: statusData.lastAirDate || undefined
        }, show.list);
        
        // ⚠️ REMOVED: debugGate diagnostics disabled
      } else {
        // ⚠️ REMOVED: debugGate diagnostics disabled
      }
      
      // Small delay to avoid overwhelming TMDB API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error fetching status for ${show.title}:`, error);
    }
  }
  
  // ⚠️ REMOVED: debugGate diagnostics disabled
}

