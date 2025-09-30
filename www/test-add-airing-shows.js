/**
 * Test script to add currently airing TV shows to Currently Watching list
 * This will fetch real data from TMDB and add shows that are currently airing
 */

async function addCurrentlyAiringShows() {
  console.log('🎬 Starting to add currently airing shows...');
  
  // Check if we have the required functions
  if (typeof window.tmdbGet !== 'function') {
    console.error('❌ tmdbGet function not available');
    return;
  }
  
  if (!window.appData) {
    console.error('❌ appData not available');
    return;
  }
  
  try {
    // Fetch currently airing TV shows from TMDB
    console.log('📺 Fetching currently airing TV shows from TMDB...');
    const response = await window.tmdbGet('tv/on_the_air', { page: 1 });
    
    if (!response.results || !Array.isArray(response.results)) {
      console.error('❌ Invalid response from TMDB');
      return;
    }
    
    console.log(`📺 Found ${response.results.length} currently airing shows`);
    
    // Take the first 20 shows
    const showsToAdd = response.results.slice(0, 20);
    
    // Initialize appData if needed
    if (!window.appData.tv) {
      window.appData.tv = { watching: [], wishlist: [], watched: [] };
    }
    if (!window.appData.tv.watching) {
      window.appData.tv.watching = [];
    }
    
    // Add each show to Currently Watching
    let addedCount = 0;
    for (const show of showsToAdd) {
      // Check if already in list
      const existingIndex = window.appData.tv.watching.findIndex(item => item.id === show.id);
      if (existingIndex >= 0) {
        console.log(`⏭️ Skipping ${show.name} - already in list`);
        continue;
      }
      
      // Transform TMDB data to app format
      const showData = {
        id: show.id,
        name: show.name,
        title: show.name,
        media_type: 'tv',
        first_air_date: show.first_air_date,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        overview: show.overview,
        vote_average: show.vote_average,
        vote_count: show.vote_count,
        genre_ids: show.genre_ids,
        original_language: show.original_language,
        original_name: show.original_name,
        origin_country: show.origin_country,
        popularity: show.popularity,
        adult: show.adult,
        video: show.video
      };
      
      // Add to Currently Watching
      window.appData.tv.watching.push(showData);
      addedCount++;
      console.log(`✅ Added: ${show.name} (ID: ${show.id})`);
    }
    
    console.log(`🎉 Successfully added ${addedCount} shows to Currently Watching`);
    
    // Save the data
    if (typeof window.saveAppData === 'function') {
      window.saveAppData();
      console.log('💾 Data saved');
    }
    
    // Trigger UI update
    if (typeof window.updateUI === 'function') {
      window.updateUI();
      console.log('🔄 UI updated');
    }
    
    // Trigger Next Up refresh
    if (typeof window.renderNextUpRow === 'function') {
      setTimeout(() => {
        window.renderNextUpRow();
        console.log('📺 Next Up row refreshed');
      }, 1000);
    }
    
    console.log('🎬 Done! Check your Currently Watching and Next Up sections.');
    
  } catch (error) {
    console.error('❌ Error adding shows:', error);
  }
}

// Make it available globally
window.addCurrentlyAiringShows = addCurrentlyAiringShows;

console.log('🎬 Test script loaded. Run addCurrentlyAiringShows() in console to add shows.');

