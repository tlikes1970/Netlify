/* ========== curated-rows.js ==========
   Renders multiple curated rows from config.
   Expects items with { id, title, posterPath }. Map your data if needed.
*/

/**
 * Load dynamic content for a curated section based on user's genre preferences
 */
async function loadDynamicContent(section, sectionIndex) {
  try {
    console.log(`🎯 Loading dynamic content for: ${section.title}`);

    // Get user's genre preferences
    const preferences = window.CuratedGenreSettings?.getCurrentGenrePreferences() || [];
    const userPreference = preferences[sectionIndex];
    
    if (!userPreference || !userPreference.mainGenre) {
      console.warn(`🎯 No user preference found for section ${sectionIndex}, using fallback`);
      return loadFallbackContent(section);
    }

    console.log(`🎯 Using user preference for section ${sectionIndex}:`, userPreference);

    // Determine which genres to use based on media type
    let movieGenreId = userPreference.mainGenre;
    let tvGenreId = userPreference.mainGenre;
    
    // Use sub-genre if specified
    if (userPreference.subGenre) {
      if (userPreference.mediaType === 'movie') {
        movieGenreId = userPreference.subGenre;
      } else if (userPreference.mediaType === 'tv') {
        tvGenreId = userPreference.subGenre;
      } else {
        // For 'both', use sub-genre for both
        movieGenreId = userPreference.subGenre;
        tvGenreId = userPreference.subGenre;
      }
    }

    // Get current language
    const currentLang = window.appData?.settings?.lang || 'en';
    const tmdbLang = currentLang === 'es' ? 'es-ES' : 'en-US';

    // Fetch content based on user preferences
    const promises = [];
    
    if (userPreference.mediaType === 'movie' || userPreference.mediaType === 'both') {
      promises.push(
        window.tmdbGet('discover/movie', {
          with_genres: movieGenreId,
          sort_by: 'popularity.desc',
          page: 1,
          language: tmdbLang,
        })
      );
    }
    
    if (userPreference.mediaType === 'tv' || userPreference.mediaType === 'both') {
      promises.push(
        window.tmdbGet('discover/tv', {
          with_genres: tvGenreId,
          sort_by: 'popularity.desc',
          page: 1,
          language: tmdbLang,
        })
      );
    }

    const results = await Promise.all(promises);
    const [moviesData, tvData] = results;

    console.log(`🎯 TMDB API responses for ${section.title}:`, {
      moviesData: moviesData ? `Found ${moviesData.results?.length || 0} movies` : 'undefined',
      tvData: tvData ? `Found ${tvData.results?.length || 0} TV shows` : 'undefined'
    });

    // Debug: Log the actual response structure
    console.log(`🎯 Raw TMDB responses for ${section.title}:`, {
      moviesData: moviesData,
      tvData: tvData
    });

    // Extract results from wrapped response format
    const extractResults = (data) => {
      if (data && data.ok && data.data && data.data.results) {
        return data.data.results;
      } else if (data && data.results) {
        return data.results;
      }
      return [];
    };

    const movieResults = extractResults(moviesData);
    const tvResults = extractResults(tvData);

    console.log(`🎯 Extracted results for ${section.title}:`, {
      movieResults: movieResults.length,
      tvResults: tvResults.length
    });

    // Combine and format results - check for valid data first
    const allItems = [
      ...movieResults.map((item) => ({
        ...item,
        media_type: 'movie',
        mediaType: 'movie',
        title: item.title,
        year: new Date(item.release_date).getFullYear(),
        posterPath: item.poster_path,
      })),
      ...tvResults.map((item) => ({
        ...item,
        media_type: 'tv',
        mediaType: 'tv',
        title: item.name,
        year: new Date(item.first_air_date).getFullYear(),
        posterPath: item.poster_path,
      })),
    ];

    // Limit to 12 items per section
    const limitedItems = allItems.slice(0, 12);

    console.log(`🎯 Dynamic content loaded: ${limitedItems.length} items for ${section.title}`);
    
    // If no dynamic content was loaded, fall back to static data
    if (limitedItems.length === 0) {
      console.log(`🎯 No dynamic content found, falling back to static data for ${section.title}`);
      return loadFallbackContent(section);
    }
    
    return limitedItems;
  } catch (error) {
    console.error(`🎯 Error loading dynamic content for ${section.title}:`, error);
    console.log(`🎯 Falling back to static data for ${section.title}`);
    return loadFallbackContent(section);
  }
}

/**
 * Load fallback content when user preferences fail
 */
function loadFallbackContent(section) {
  // Map section titles to TMDB genre IDs (fallback)
  const genreMap = {
    'Drama & Crime': { movie: 18, tv: 18 }, // Drama
    'Comedy & Sitcoms': { movie: 35, tv: 35 }, // Comedy
    'Sci-Fi & Fantasy': { movie: 878, tv: 10765 }, // Sci-Fi & Fantasy
  };

  const genre = genreMap[section.title];
  if (!genre) {
    console.warn(`🎯 No fallback genre mapping found for: ${section.title}`);
    return [];
  }

  // Return static data from window.CURATED_SECTIONS
  const staticSection = window.CURATED_SECTIONS?.find(s => s.title === section.title);
  if (staticSection && staticSection.items) {
    console.log(`🎯 Using static data: ${staticSection.items.length} items for ${section.title}`);
    return staticSection.items;
  }
  
  return [];
}

// Define initializeCurated function first
async function initializeCurated() {
  // Check feature flag
  if (!window.FLAGS?.homeRowCurated) {
    console.log('🎯 Curated sections disabled by feature flag');
    return;
  }

  // Prevent duplicate renders
  if (window.render_curated) {
    console.log('🎯 Skipping duplicate curated render');
    return;
  }
  window.render_curated = true;

  let mount = document.getElementById('curatedSections');
  if (!mount) {
    mount = document.getElementById('curatedSections');
    if (!mount) {
      window.render_curated = false;
      return;
    }
  }

  // Defensive guard for Card component
  const USE_CARD = !!window.Card;

  // ---- Dynamic section limiting ----
  // Read the curated rows count from localStorage setting (use correct key from settings wiring)
  const storedRows =
    localStorage.getItem('pref_homeListsCount') || localStorage.getItem('flicklet:curated:rows');
  const MAX_SECTIONS = storedRows ? Math.max(1, Math.min(3, parseInt(storedRows, 10))) : 3;
  const sections = window.CURATED_SECTIONS || [];
  const limitedSections = sections.slice(0, MAX_SECTIONS);

  console.log(
    '🎯 Rendering curated sections:',
    limitedSections.length,
    'from setting:',
    storedRows,
  );

  // Clear existing content
  mount.innerHTML = '';

  // Load dynamic content for each section
  for (let index = 0; index < limitedSections.length; index++) {
    const section = limitedSections[index];
    // Create horizontal row container
    const rowEl = document.createElement('div');
    rowEl.className = 'curated-row';
    rowEl.setAttribute('data-section', index);

    // Create row header
    const headerEl = document.createElement('div');
    headerEl.className = 'curated-row-header';
    headerEl.innerHTML = `<h3 class="curated-row-title">${section.title}</h3>`;

    // Create horizontal scroll container
    const scrollEl = document.createElement('div');
    scrollEl.className = 'curated-row-scroll';
    scrollEl.setAttribute('role', 'region');
    scrollEl.setAttribute('aria-label', `${section.title} horizontal scroll`);

    // Create items container inside scroll
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'curated-items-container';

    scrollEl.appendChild(itemsContainer);
    rowEl.appendChild(headerEl);
    rowEl.appendChild(scrollEl);
    mount.appendChild(rowEl);

    // Make the container visible
    mount.style.display = 'block';

    // Load dynamic content for this section
    try {
      const items = await loadDynamicContent(section, index);

      if (items && items.length > 0) {
        console.log(`🎯 Loaded ${items.length} dynamic items for section: ${section.title}`);

        for (const item of items) {
          try {
            console.log(`🎯 Creating card for item: ${item.title}`, item);
            
            // Use Cards V2 system if available
            let card;
            if (window.renderCuratedCardV2) {
              console.log('🎯 Using renderCuratedCardV2');
              card = window.renderCuratedCardV2(item);
            } else if (window.renderSearchCardV2) {
              console.log('🎯 Using renderSearchCardV2');
              card = window.renderSearchCardV2(item);
            } else if (USE_CARD && window.Card && window.createCardData) {
              console.log('🎯 Using old Card component');
              // Fallback to old Card component
              const cardData = window.createCardData(item, 'tmdb', 'curated');
              card = window.Card({
                variant: 'unified',
                ...cardData,
              });
            } else {
              console.log('🎯 Using simple fallback card');
              // Fallback to simple item display with click handler
              const itemEl = document.createElement('div');
              itemEl.className = 'unified-card';
              itemEl.setAttribute('tabindex', '0');
              itemEl.setAttribute('role', 'button');
              itemEl.setAttribute('aria-label', `View details for ${item.title}`);
              itemEl.innerHTML = `<div class="card-title">${item.title}</div>`;
              card = itemEl;
            }
            
            console.log(`🎯 Card created for ${item.title}:`, card);
            if (card) {
              itemsContainer.appendChild(card);
              console.log(`🎯 Card appended for ${item.title}`);
            } else {
              console.warn(`🎯 No card created for ${item.title}`);
            }
          } catch (error) {
            console.error('🎯 Error creating card for item:', item.title, error);
          }
        }
      } else {
        console.log(`🎯 No dynamic content loaded for section: ${section.title}`);
      }
    } catch (error) {
      console.error(`🎯 Error loading dynamic content for ${section.title}:`, error);
    }
  }

  // Dispatch event to notify that curated cards have been rendered
  // Note: Count will be updated as dynamic content loads
  window.dispatchEvent(
    new CustomEvent('cards:rendered', {
      detail: {
        count: 0, // Will be updated as content loads
        section: 'curated',
      },
    }),
  );

  // Clear render flag after a short delay
  setTimeout(() => {
    window.render_curated = false;
  }, 100);
}

// Initialize curated sections
async function initCuratedSections() {
  console.log('🎯 initCuratedSections called');
  console.log('🎯 Feature flag check:', window.FLAGS?.homeRowCurated);
  
  let mount = document.getElementById('curatedSections');
  console.log('🎯 Mount element found:', !!mount);
  if (!mount) {
    // Wait for element to be created by V2 system
    const checkForMount = async () => {
      mount = document.getElementById('curatedSections');
      if (mount) {
        console.log('🎯 Curated sections element found, initializing');
        await initializeCurated();
      } else {
        setTimeout(checkForMount, 100);
      }
    };
    await checkForMount();
    return;
  }

  await initializeCurated();
}

// Listen for curated:rerender event to update when settings change
document.addEventListener('curated:rerender', async () => {
  console.log('🎯 Curated rerender event received, updating sections');
  await initializeCurated();
});

// Listen for genre preferences updates
document.addEventListener('curated:genres:updated', async () => {
  console.log('🎯 Genre preferences updated, refreshing curated sections');
  await initializeCurated();
});

// Export refresh function for manual triggering
window.refreshCuratedRows = async () => {
  console.log('🎯 Manual curated rows refresh triggered');
  await initializeCurated();
};

// Initialize curated sections when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCuratedSections);
} else {
  // DOM is already ready, initialize immediately
  setTimeout(initCuratedSections, 100);
}
