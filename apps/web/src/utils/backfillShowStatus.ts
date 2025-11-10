// Backfill show status for existing TV shows in the library
import { Library } from '../lib/storage';
import { fetchShowStatus } from '../tmdb/tv';
import { dlog } from '../diagnostics/debugGate';

dlog('🔄 backfillShowStatus module loaded');

export async function backfillShowStatus() {
  dlog('🔄 Starting show status backfill...');
  
  // Get all items from the library state
  const watchingItems = Library.getByList('watching');
  const wishlistItems = Library.getByList('wishlist');
  const watchedItems = Library.getByList('watched');
  const notItems = Library.getByList('not');
  
  dlog('📊 Library contents:', {
    watching: watchingItems.length,
    wishlist: wishlistItems.length,
    watched: watchedItems.length,
    not: notItems.length
  });
  
  const allItems = watchingItems.concat(wishlistItems).concat(watchedItems).concat(notItems);
  
  // Debug: Log all TV shows and their showStatus (gated)
  const allTvShows = allItems.filter(item => item.mediaType === 'tv');
  dlog('📺 All TV shows in library:', allTvShows.map(show => ({
    title: show.title,
    showStatus: show.showStatus,
    hasShowStatus: show.showStatus !== undefined,
    lastAirDate: show.lastAirDate,
    id: show.id,
    mediaType: show.mediaType
  })));

  // Debug: Log first few shows in detail (gated)
  const firstThree = allTvShows.slice(0, 3);
  dlog('🔍 First 3 TV shows detailed:', firstThree);
  dlog('🔍 First show showStatus:', firstThree[0]?.showStatus);
  dlog('🔍 First show showStatus type:', typeof firstThree[0]?.showStatus);
  dlog('🔍 First show showStatus === undefined:', firstThree[0]?.showStatus === undefined);
  
  const tvShows = allItems.filter(item => 
    item.mediaType === 'tv' && 
    (!item.showStatus || item.showStatus === undefined)
  );
  
  dlog(`📺 Found ${tvShows.length} TV shows without show status`);
  
  for (const show of tvShows) {
    try {
      dlog(`🔍 Fetching status for: ${show.title}`);
      const statusData = await fetchShowStatus(Number(show.id));
      
      if (statusData) {
        // Update the show with status data
        Library.upsert({
          ...show,
          showStatus: statusData.status as 'Ended' | 'Returning Series' | 'In Production' | 'Canceled' | 'Planned' | undefined,
          lastAirDate: statusData.lastAirDate || undefined
        }, show.list);
        
        dlog(`✅ Updated ${show.title}: ${statusData.status}`);
      } else {
        dlog(`❌ No status data for ${show.title}`);
      }
      
      // Small delay to avoid overwhelming TMDB API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error fetching status for ${show.title}:`, error);
    }
  }
  
  dlog('✅ Show status backfill completed');
}

