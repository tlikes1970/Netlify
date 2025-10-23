// Backfill show status for existing TV shows in the library
import { Library } from '../lib/storage';
import { fetchShowStatus } from '../tmdb/tv';

console.log('🔄 backfillShowStatus module loaded');

export async function backfillShowStatus() {
  console.log('🔄 Starting show status backfill...');
  
  // Get all items from the library state
  const watchingItems = Library.getByList('watching');
  const wishlistItems = Library.getByList('wishlist');
  const watchedItems = Library.getByList('watched');
  const notItems = Library.getByList('not');
  
  console.log('📊 Library contents:', {
    watching: watchingItems.length,
    wishlist: wishlistItems.length,
    watched: watchedItems.length,
    not: notItems.length
  });
  
  const allItems = watchingItems.concat(wishlistItems).concat(watchedItems).concat(notItems);
  
  // Debug: Log all TV shows and their showStatus
  const allTvShows = allItems.filter(item => item.mediaType === 'tv');
  console.log('📺 All TV shows in library:', allTvShows.map(show => ({
    title: show.title,
    showStatus: show.showStatus,
    hasShowStatus: show.showStatus !== undefined,
    lastAirDate: show.lastAirDate,
    id: show.id,
    mediaType: show.mediaType
  })));
  
  // Debug: Log first few shows in detail
  const firstThree = allTvShows.slice(0, 3);
  console.log('🔍 First 3 TV shows detailed:', firstThree);
  console.log('🔍 First show showStatus:', firstThree[0]?.showStatus);
  console.log('🔍 First show showStatus type:', typeof firstThree[0]?.showStatus);
  console.log('🔍 First show showStatus === undefined:', firstThree[0]?.showStatus === undefined);
  
  const tvShows = allItems.filter(item => 
    item.mediaType === 'tv' && 
    (!item.showStatus || item.showStatus === undefined)
  );
  
  console.log(`📺 Found ${tvShows.length} TV shows without show status`);
  
  for (const show of tvShows) {
    try {
      console.log(`🔍 Fetching status for: ${show.title}`);
      const statusData = await fetchShowStatus(Number(show.id));
      
      if (statusData) {
        // Update the show with status data
        Library.upsert({
          ...show,
          showStatus: statusData.status as 'Ended' | 'Returning Series' | 'In Production' | 'Canceled' | 'Planned' | undefined,
          lastAirDate: statusData.lastAirDate || undefined
        }, show.list);
        
        console.log(`✅ Updated ${show.title}: ${statusData.status}`);
      } else {
        console.log(`❌ No status data for ${show.title}`);
      }
      
      // Small delay to avoid overwhelming TMDB API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error fetching status for ${show.title}:`, error);
    }
  }
  
  console.log('✅ Show status backfill completed');
}

