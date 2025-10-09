/* ========== curated-rows.js ==========
   Renders multiple curated rows from config.
   Expects items with { id, title, posterPath }. Map your data if needed.
*/

console.log('🚨 CURATED-ROWS.JS LOADED - SCRIPT IS RUNNING!');

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

    // Limit to 24 items per section
    const limitedItems = allItems.slice(0, 24);

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

  // Find the preview-row-container (the actual scroll container)
  const previewContainer = mount.closest('.preview-row-container');
  if (!previewContainer) {
    console.error('🎯 No preview-row-container found!');
    return;
  }
  
  console.log('🎯 Found preview-row-container:', previewContainer);

  // Make the container visible and set it up for vertical layout
  mount.style.display = 'block';
  
  // Create a vertical container for all genre rows
  const verticalContainer = document.createElement('div');
  verticalContainer.style.display = 'flex';
  verticalContainer.style.flexDirection = 'column';
  verticalContainer.style.width = '100%';
  verticalContainer.style.minHeight = '600px'; // Ensure it has height
  verticalContainer.style.gap = '32px';
  verticalContainer.style.padding = '16px';
  
  // Clear the preview container and add our vertical container
  previewContainer.innerHTML = '';
  previewContainer.style.height = 'auto'; // Allow it to grow
  previewContainer.style.minHeight = '600px'; // Ensure minimum height
  previewContainer.style.overflow = 'visible'; // Override the hidden overflow
  previewContainer.appendChild(verticalContainer);
  
  console.log('🎯 Preview container setup complete');

  // Load dynamic content for each section
  for (let index = 0; index < limitedSections.length; index++) {
    const section = limitedSections[index];

    // Load dynamic content for this section
    try {
      const items = await loadDynamicContent(section, index);

      if (items && items.length > 0) {
        console.log(`🎯 Loaded ${items.length} dynamic items for section: ${section.title}`);

        // Create a separate horizontal row for this genre
        const genreRow = document.createElement('div');
        genreRow.className = 'curated-genre-row';
        genreRow.style.width = '100%';
        genreRow.style.minHeight = '300px'; // Ensure each row has height
        
        // Create genre header (title to the left and above)
        const genreHeader = document.createElement('div');
        genreHeader.style.marginBottom = '16px';
        genreHeader.style.paddingLeft = '16px';
        
        const genreTitle = document.createElement('h3');
        genreTitle.textContent = section.title;
        genreTitle.style.color = '#ffffff';
        genreTitle.style.fontSize = '20px';
        genreTitle.style.fontWeight = '600';
        genreTitle.style.margin = '0';
        genreTitle.style.padding = '0';
        
        genreHeader.appendChild(genreTitle);
        
            // Create horizontal scrollable cards container
            const cardsContainer = document.createElement('div');
            cardsContainer.style.display = 'flex';
            cardsContainer.style.gap = '12px';
            cardsContainer.style.overflowX = 'auto';
            cardsContainer.style.overflowY = 'hidden';
            cardsContainer.style.paddingBottom = '8px';
            cardsContainer.style.scrollSnapType = 'x mandatory';
            cardsContainer.style.scrollbarWidth = 'thin';
            // Use responsive width to expand with viewport
            cardsContainer.style.width = '100%';
            cardsContainer.style.minWidth = '100%';
            cardsContainer.style.maxWidth = '100%';
            cardsContainer.style.paddingLeft = '16px';
            cardsContainer.style.paddingRight = '16px';
            cardsContainer.style.boxSizing = 'border-box';
        
        // Add cards to this genre's container (limit to 24 cards per row)
        const limitedItems = items.slice(0, 24);
        for (const item of limitedItems) {
          try {
            console.log(`🎯 Creating SIMPLE card for item: ${item.title}`);
            
              // Create a simple, working card directly
              const card = document.createElement('div');
              card.className = 'card v2 v2-home-curated curated-card';
              card.style.width = '200px';
              card.style.minWidth = '200px';
              card.style.maxWidth = '200px';
              card.style.display = 'flex';
              card.style.flexDirection = 'column';
              card.style.alignItems = 'center';
              card.style.background = '#ffffff';
              card.style.border = '1px solid #e5e7eb';
              card.style.borderRadius = '14px';
              card.style.padding = '12px';
              card.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)';
              card.style.flexShrink = '0';
            
            // Create poster
            const posterWrap = document.createElement('div');
            posterWrap.style.width = '100%';
            posterWrap.style.aspectRatio = '2/3';
            posterWrap.style.overflow = 'hidden';
            posterWrap.style.borderRadius = '10px';
            posterWrap.style.marginBottom = '8px';
            
            const img = document.createElement('img');
            img.src = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : '/assets/img/poster-placeholder.png';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';
            posterWrap.appendChild(img);
            
                // Create title
                const title = document.createElement('div');
                const titleText = item.title || item.name || item.original_title || item.original_name || 'Unknown Title';
                title.textContent = titleText;
                title.style.color = '#1f2937';
                title.style.fontSize = '14px';
                title.style.fontWeight = '600';
                title.style.textAlign = 'center';
                title.style.marginBottom = '8px';
                title.style.lineHeight = '1.2';
                
                console.log(`🎯 Card title set to: "${titleText}" for item:`, item);
            
            // Create button
            const button = document.createElement('button');
            button.textContent = 'Want to Watch';
            button.style.width = '100%';
            button.style.padding = '8px 12px';
            button.style.background = '#ff4c8d';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '8px';
            button.style.fontSize = '12px';
            button.style.fontWeight = '500';
            button.style.cursor = 'pointer';
            
            // Assemble card
            card.appendChild(posterWrap);
            card.appendChild(title);
            card.appendChild(button);
            
            // Add card to this genre's container
            cardsContainer.appendChild(card);
            console.log(`🎯 SIMPLE card added to ${section.title} row for ${item.title}`);
            
          } catch (error) {
            console.error('🎯 Error creating simple card for item:', item.title, error);
          }
        }
        
        // Assemble the genre row
        genreRow.appendChild(genreHeader);
        genreRow.appendChild(cardsContainer);
        
        // Append the entire genre row to the vertical container
        verticalContainer.appendChild(genreRow);
        console.log(`🎯 Genre row appended to vertical container for ${section.title}`);
        
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
  console.log('🚨 initCuratedSections called!');
  try {
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
  } catch (error) {
    console.error('🚨 Error in initCuratedSections:', error);
  }
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
console.log('🚨 About to check DOM ready state:', document.readyState);
if (document.readyState === 'loading') {
  console.log('🚨 DOM still loading, adding DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', initCuratedSections);
} else {
  console.log('🚨 DOM already ready, calling initCuratedSections in 100ms');
  // DOM is already ready, initialize immediately
  setTimeout(() => {
    console.log('🚨 Calling initCuratedSections now...');
    initCuratedSections().catch(error => {
      console.error('🚨 Error in initCuratedSections:', error);
    });
  }, 100);
}
