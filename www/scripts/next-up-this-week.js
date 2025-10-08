/**
 * Process: Next Up This Week Row
 * Purpose: Displays TV shows from user's Watching list with next episode air dates (any future date)
 * Data Source: appData.tv.watching, TMDB API for next_episode_to_air data
 * Update Path: Modify filtering logic, date range, or display format
 * Dependencies: tmdbGet function, appData, home page elements
 */

// No retry logic - single data path

// Helper function to get next air date from TMDB
async function fetchNextAirDate(showId) {
  try {
    if (typeof window.tmdbGet !== 'function') {
      console.warn('📺 tmdbGet not available for next air date');
      return null;
    }

    console.log('📺 Fetching TMDB data for show ID:', showId);
    const data = await window.tmdbGet(`tv/${showId}`, {});
    console.log('📺 TMDB response for', showId, ':', data);

    const nextAirDate = data.next_episode_to_air?.air_date || null;
    console.log('📺 Next air date extracted:', nextAirDate);
    return nextAirDate;
  } catch (error) {
    console.warn('📺 Failed to fetch next air date for show', showId, error);
    return null;
  }
}

// Helper function to get show data (including poster) from TMDB
async function fetchShowData(showId, mediaType) {
  try {
    if (typeof window.tmdbGet !== 'function') {
      console.warn('📺 tmdbGet not available for show data');
      return null;
    }

    const endpoint = mediaType === 'tv' ? `tv/${showId}` : `movie/${showId}`;
    const data = await window.tmdbGet(endpoint, {});
    return data;
  } catch (error) {
    console.warn('📺 Failed to fetch show data for', showId, error);
    return null;
  }
}

// Helper functions for date calculations
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function daysUntil(date) {
  const ms = startOfDay(date) - startOfDay(new Date());
  return Math.ceil(ms / 86400000);
}

// Get watching items and filter for next up shows
async function getNextUpItems(watchingItems) {
  // Include items that are explicitly TV shows (first_air_date is optional)
  const tvShows = watchingItems.filter((it) => 
    it.media_type === 'tv'
  );
  console.log('📺 TV shows found:', tvShows.length, tvShows);

  const enriched = await Promise.all(
    tvShows.map(async (it) => {
      console.log('📺 Checking show:', it.name || it.title, 'ID:', it.id);
      
      // Fetch both air date and poster data from TMDB
      const [airDateISO, tmdbData] = await Promise.all([
        fetchNextAirDate(it.id),
        fetchShowData(it.id, it.media_type)
      ]);
      
      console.log('📺 Next air date for', it.name || it.title, ':', airDateISO);
      
      // Update item with poster data if missing
      if (tmdbData && tmdbData.poster_path && !it.poster_path) {
        it.poster_path = tmdbData.poster_path;
        console.log('📺 Fetched poster data for', it.name || it.title, ':', tmdbData.poster_path);
      }
      
      // Create show object with next_episode_to_air data
      const show = {
        ...it,
        next_episode_to_air: airDateISO ? { air_date: airDateISO } : null,
        status: it.status || 'Returning Series'
      };
      
      return { item: it, show: show, airDate: airDateISO ? new Date(airDateISO) : null };
    }),
  );

  console.log('📺 Enriched data:', enriched);

  // Import the airdate utility
  const { getNextAirInfo } = await import('/js/utils/airdate-utils.js');
  
  // Compute air info for each show
  const withAirInfo = enriched.map(({ item, show, airDate }) => {
    const air = getNextAirInfo(show);
    console.log(`📺 Show: ${item.name || item.title} - Air info:`, air);
    return {
      item,
      show,
      air,
      airDate
    };
  });

  console.log('📺 Shows with air info:', withAirInfo);

  // Filter to show items where air.ended === false || air.label === 'Ended' || air.label.startsWith('Up next')
  const filtered = withAirInfo.filter(x => 
    x.air.ended === false || 
    x.air.label === 'Ended' || 
    x.air.label.startsWith('Up next')
  );

  console.log('📺 Filtered results:', filtered);

  // Sort by date where available: dated first ascending, then TBA, then Ended
  const dated = filtered.filter(x => x.air.date);
  const tba = filtered.filter(x => !x.air.date && !x.air.ended && x.air.label.includes('TBA'));
  const ended = filtered.filter(x => x.air.ended);

  dated.sort((a, b) => new Date(a.air.date) - new Date(b.air.date));
  const sorted = [...dated, ...tba, ...ended];

  console.log('📺 Sorted results:', sorted);
  console.log('📺 Final count - dated:', dated.length, 'tba:', tba.length, 'ended:', ended.length);

  return sorted.slice(0, 10);
}

// Format the label for display
function formatNextLabel(epNumber, airDate) {
  const d = airDate;
  const n = daysUntil(d);

  if (n >= 0 && n <= 7) {
    if (n === 0) return 'Today';
    if (n === 1) return 'in 1 day';
    return `in ${n} days`;
  }

  // Fallback short date
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Get poster source using existing helper
function getPosterSrc(item) {
  if (item.poster_path && item.poster_path !== 'null' && item.poster_path !== '') {
    // Clean up the poster path
    const cleanPath = item.poster_path.startsWith('/') ? item.poster_path : `/${item.poster_path}`;
    return `https://image.tmdb.org/t/p/w300${cleanPath}`; // Use w300 to match srcset
  }
  if (item.backdrop_path && item.backdrop_path !== 'null' && item.backdrop_path !== '') {
    // Clean up the backdrop path
    const cleanPath = item.backdrop_path.startsWith('/')
      ? item.backdrop_path
      : `/${item.backdrop_path}`;
    return `https://image.tmdb.org/t/p/w300${cleanPath}`; // Use w300 to match srcset
  }

  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgdmlld0JveD0iMCAwIDUwMCA3NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNzUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yNTAgMzAwSDI3NVY0NTBIMjUwVjMwMFoiIGZpbGw9IiNDQ0NDQ0MiLz4KPHBhdGggZD0iTTIwMCAzNzVIMzAwVjQwMEgyMDBWMzc1WiIgZmlsbD0iI0NDQ0NDQyIvPgo8L3N2Zz4K';
}

// Open show detail using existing handler
function openShowDetail(item) {
  if (typeof window.openShowDetail === 'function') {
    window.openShowDetail(item);
  } else if (typeof window.showDetailModal === 'function') {
    window.showDetailModal(item);
  } else {
    console.warn('📺 No show detail handler found');
  }
}

// Main render function
async function renderNextUpRow() {
  if (!window.FLAGS?.homeRowNextUp) {
    console.log('📺 Next Up This Week disabled by feature flag');
    return;
  }

  const section = document.getElementById('up-next-row');
  if (!section) {
    console.warn('📺 Next Up section not found');
    return;
  }

  const inner = section.querySelector('.row-inner');
  if (!inner) {
    console.warn('📺 Next Up inner container not found');
    return;
  }

  // Get watching items using unified data loader
  const watchingItems = window.UnifiedDataLoader 
    ? await window.UnifiedDataLoader.getCurrentlyWatchingItems()
    : [];

  console.log('📺 Found watching items:', watchingItems.length);
  console.log('📺 Watching items details:', watchingItems);

  const nextUp = await getNextUpItems(watchingItems);
  console.log('📺 Next up items:', nextUp.length);
  console.log('📺 Next up details:', nextUp);

  if (!nextUp.length) {
    console.log('📺 No upcoming episodes, hiding section');
    section.style.display = 'none';
    return;
  }

  // Show section and populate
  section.style.display = 'block';
  inner.innerHTML = '';

  // Use V2 renderer directly
  for (const { item, show, air } of nextUp) {
    // Use V2 renderer if available
    if (window.renderCardV2) {
      const container = document.createElement('div');
      const props = {
        id: show.id,
        mediaType: show.media_type || 'tv',
        title: show.title || show.name || 'Unknown',
        poster: getPosterSrc(item),
        releaseDate: show.release_date || show.first_air_date || '',
        genre: (show.genres && show.genres[0]?.name) || '',
        seasonEpisode: air.epNumber || '',
        nextAirDate: air.date || air.label || ''
      };
      
      const card = window.renderCardV2(container, props, {
        listType: 'next-up',
        context: 'home'
      });
      
      if (card) {
        card.classList.add('nu-card', 'preview-card');
        inner.appendChild(card);
      }
    } else {
      console.warn('📺 V2 renderer not available for Next Up cards');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for app data to be loaded, then wait a bit more for DOM to be populated
  const checkData = () => {
    if (window.appData && (window.appData.tv || window.appData.movies)) {
      // Wait a bit more for the Currently Watching section to populate the DOM
      setTimeout(() => {
        renderNextUpRow();
      }, 2000);
    } else {
      setTimeout(checkData, 100);
    }
  };
  checkData();
});

// Listen for data changes
document.addEventListener('appDataUpdated', renderNextUpRow);
document.addEventListener('curated:rerender', renderNextUpRow);

// Listen for UI updates (when updateUI is called)
const originalUpdateUI = window.updateUI;
if (originalUpdateUI) {
  window.updateUI = function (...args) {
    const result = originalUpdateUI.apply(this, args);
    // Trigger our preview update after a short delay
    setTimeout(renderNextUpRow, 100);
    return result;
  };
}

// Expose for manual triggering
window.renderNextUpRow = renderNextUpRow;
