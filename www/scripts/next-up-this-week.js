/**
 * Process: Next Up This Week Row
 * Purpose: Displays TV shows from user's Watching list with next episode air dates (any future date)
 * Data Source: appData.tv.watching, TMDB API for next_episode_to_air data
 * Update Path: Modify filtering logic, date range, or display format
 * Dependencies: tmdbGet function, appData, home page elements
 */

// Retry counter to prevent infinite loops
let nextUpRetryCount = 0;
const MAX_RETRIES = 5;

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
  const tvShows = watchingItems.filter((it) => it.media_type === 'tv' || it.first_air_date);
  console.log('📺 TV shows found:', tvShows.length, tvShows);

  const enriched = await Promise.all(
    tvShows.map(async (it) => {
      console.log('📺 Checking show:', it.name || it.title, 'ID:', it.id);
      const airDateISO = await fetchNextAirDate(it.id);
      console.log('📺 Next air date for', it.name || it.title, ':', airDateISO);
      
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

  // Get watching items - use same method as Currently Watching section
  const watchingItems = [];

  // Try appData first
  if (window.appData?.tv?.watching) {
    watchingItems.push(
      ...window.appData.tv.watching.map((item) => ({
        ...item,
        media_type: 'tv',
      })),
    );
  }
  if (window.appData?.movies?.watching) {
    watchingItems.push(
      ...window.appData.movies.watching.map((item) => ({
        ...item,
        media_type: item.media_type || 'movie',
      })),
    );
  }

  // If no items found in appData, try DOM extraction (same as Currently Watching)
  if (watchingItems.length === 0) {
    console.log('📺 No items in appData, trying DOM extraction...');
    const watchingList = document.getElementById('watchingList');
    if (watchingList) {
      const cards = watchingList.querySelectorAll('.show-card');
      console.log('📺 Found', cards.length, 'cards in watchingList DOM');

      cards.forEach((card) => {
        const id = card.getAttribute('data-id');
        const titleEl = card.querySelector('.show-title, .card-title, h3');
        const title = titleEl
          ? titleEl.textContent.trim().replace('🔗', '').trim()
          : 'Unknown Title';
        const posterImg = card.querySelector('img.show-poster, img.poster');
        const posterSrc = posterImg ? posterImg.src : '';
        const posterPath = posterSrc ? posterSrc.split('/').pop().split('?')[0] : '';

        if (id) {
          watchingItems.push({
            id: parseInt(id),
            name: title,
            title: title,
            poster_path: posterPath,
            media_type: 'tv', // Assume TV shows for now
          });
        }
      });
    }
  }

  console.log('📺 Found watching items:', watchingItems.length);
  console.log('📺 Watching items details:', watchingItems);

  const nextUp = await getNextUpItems(watchingItems);
  console.log('📺 Next up items:', nextUp.length);
  console.log('📺 Next up details:', nextUp);

  if (!nextUp.length) {
    console.log('📺 No upcoming episodes, hiding section');
    section.style.display = 'none';

    // If we found 0 watching items, retry after a delay (like Currently Watching does)
    if (watchingItems.length === 0 && nextUpRetryCount < MAX_RETRIES) {
      nextUpRetryCount++;
      console.log(
        `📺 No watching items found, will retry in 2 seconds... (attempt ${nextUpRetryCount}/${MAX_RETRIES})`,
      );
      setTimeout(() => {
        console.log('🔄 Retrying Next Up This Week after delay...');
        renderNextUpRow();
      }, 2000);
    } else if (nextUpRetryCount >= MAX_RETRIES) {
      console.log('📺 Max retries reached, stopping Next Up This Week retries');
    }
    return;
  }

  // Reset retry counter on success
  nextUpRetryCount = 0;

  // Show section and populate
  section.style.display = 'block';
  inner.innerHTML = '';

  // Import the card renderer
  const { renderNextUpCard } = await import('/js/renderers/card-templates.js');

  for (const { item, show, air } of nextUp) {
    // Add posterUrl to the show object for the renderer
    const showWithPoster = {
      ...show,
      posterUrl: getPosterSrc(item)
    };
    
    const card = renderNextUpCard(showWithPoster, air);
    inner.appendChild(card);
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
