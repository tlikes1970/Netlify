/* ========== curated-rows.js ==========
   Renders multiple curated rows from config.
   Expects items with { id, title, posterPath }. Map your data if needed.
*/

/**
 * Load dynamic content for a curated section based on genre
 */
async function loadDynamicContent(section, sectionIndex) {
  try {
    console.log(`🎯 Loading dynamic content for: ${section.title}`);
    
    // Map section titles to TMDB genre IDs
    const genreMap = {
      'Drama & Crime': { movie: 18, tv: 18 }, // Drama
      'Comedy & Sitcoms': { movie: 35, tv: 35 }, // Comedy  
      'Sci-Fi & Fantasy': { movie: 878, tv: 10765 } // Sci-Fi & Fantasy
    };
    
    const genre = genreMap[section.title];
    if (!genre) {
      console.warn(`🎯 No genre mapping found for: ${section.title}`);
      return [];
    }
    
    // Get API key
    const apiKey = window.__TMDB_API_KEY__ || window.TMDB_CONFIG?.apiKey;
    if (!apiKey) {
      console.error('🎯 TMDB API key not available');
      return [];
    }
    
    // Get current language
    const currentLang = window.appData?.settings?.lang || 'en';
    const tmdbLang = currentLang === 'es' ? 'es-ES' : 'en-US';
    
    // Load both movies and TV shows for this genre
    const [moviesResponse, tvResponse] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genre.movie}&sort_by=popularity.desc&page=1&language=${tmdbLang}`),
      fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=${genre.tv}&sort_by=popularity.desc&page=1&language=${tmdbLang}`)
    ]);
    
    if (!moviesResponse.ok || !tvResponse.ok) {
      throw new Error('Failed to fetch dynamic content');
    }
    
    const moviesData = await moviesResponse.json();
    const tvData = await tvResponse.json();
    
    // Combine and format results
    const allItems = [
      ...moviesData.results.map(item => ({ 
        ...item, 
        media_type: 'movie',
        mediaType: 'movie',
        title: item.title,
        year: new Date(item.release_date).getFullYear(),
        posterPath: item.poster_path
      })),
      ...tvData.results.map(item => ({ 
        ...item, 
        media_type: 'tv',
        mediaType: 'tv', 
        title: item.name,
        year: new Date(item.first_air_date).getFullYear(),
        posterPath: item.poster_path
      }))
    ];
    
    // Limit to 12 items per section
    const limitedItems = allItems.slice(0, 12);
    
    console.log(`🎯 Dynamic content loaded: ${limitedItems.length} items for ${section.title}`);
    return limitedItems;
    
  } catch (error) {
    console.error(`🎯 Error loading dynamic content for ${section.title}:`, error);
    return [];
  }
}

// Define initializeCurated function first
function initializeCurated() {
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
  const USE_CARD = !!(window.Card);

  // ---- Dynamic section limiting ----
  // Read the curated rows count from localStorage setting (use correct key from settings wiring)
  const storedRows = localStorage.getItem('pref_homeListsCount') || localStorage.getItem('flicklet:curated:rows');
  const MAX_SECTIONS = storedRows ? Math.max(1, Math.min(3, parseInt(storedRows, 10))) : 3;
  const sections = window.CURATED_SECTIONS || [];
  const limitedSections = sections.slice(0, MAX_SECTIONS);

  console.log('🎯 Rendering curated sections:', limitedSections.length, 'from setting:', storedRows);

  // Clear existing content
  mount.innerHTML = '';

  // Load dynamic content for each section
  limitedSections.forEach(async (section, index) => {
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
        
        items.forEach(item => {
        if (USE_CARD && window.Card && window.createCardData) {
          // Use unified card component
          const cardData = window.createCardData(item, 'tmdb', 'curated');
          const card = window.Card({
            variant: 'unified',
            ...cardData
          });
          itemsContainer.appendChild(card);
        } else {
          // Fallback to simple item display with click handler
          const itemEl = document.createElement('div');
          itemEl.className = 'unified-card';
          itemEl.setAttribute('tabindex', '0');
          itemEl.setAttribute('role', 'button');
          itemEl.setAttribute('aria-label', `View details for ${item.title}`);
          
          const posterUrl = item.posterPath ? 
            `https://image.tmdb.org/t/p/w200${item.posterPath}` : 
            null;
          
          const year = item.year || '';
          const mediaType = item.mediaType || 'movie';
          
          itemEl.innerHTML = `
            <div class="unified-card-poster" role="button" tabindex="0" aria-label="${item.title}">
              <div class="unified-card-poster-container">
                ${posterUrl ? 
                  `<img src="${posterUrl}" alt="${item.title} poster" loading="lazy" class="unified-card-poster-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                  ''
                }
                <div class="unified-card-poster-placeholder" style="display: ${posterUrl ? 'none' : 'flex'};">
                  <div class="unified-card-poster-skeleton"></div>
                  <div class="unified-card-poster-brand">🎬</div>
                </div>
              </div>
              <div class="unified-card-actions">
                <button class="unified-card-action-btn" 
                        data-action="mark-watched" 
                        data-id="${item.id}" 
                        aria-label="Mark as Watched"
                        title="Mark as Watched">
                  <span class="unified-card-action-icon">✅</span>
                  <span class="unified-card-action-label">Mark Watched</span>
                </button>
                <button class="unified-card-action-btn" 
                        data-action="want-to-watch" 
                        data-id="${item.id}" 
                        aria-label="Add to Want to Watch"
                        title="Add to Want to Watch">
                  <span class="unified-card-action-icon">📖</span>
                  <span class="unified-card-action-label">Want to Watch</span>
                </button>
                <button class="unified-card-action-btn" 
                        data-action="remove" 
                        data-id="${item.id}" 
                        aria-label="Remove from List"
                        title="Remove from List">
                  <span class="unified-card-action-icon">🗑️</span>
                  <span class="unified-card-action-label">Remove</span>
                </button>
              </div>
            </div>
            <div class="unified-card-content">
              <h3 class="unified-card-title">${item.title}</h3>
              <div class="unified-card-subtitle">${year ? `(${year}) • ${mediaType === 'tv' ? 'TV Show' : 'Movie'}` : (mediaType === 'tv' ? 'TV Show' : 'Movie')}</div>
            </div>
          `;
          
          // Add click handler for poster
          const poster = itemEl.querySelector('.unified-card-poster');
          if (poster && window.openTMDBLink) {
            poster.addEventListener('click', (e) => {
              // Don't trigger if clicking on action buttons
              if (!e.target.closest('.unified-card-action-btn')) {
                window.openTMDBLink(item.id, mediaType);
              }
            });
          }
          
          // Add action button handlers
          const actionButtons = itemEl.querySelectorAll('.unified-card-action-btn');
          actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
              e.stopPropagation();
              const action = button.dataset.action;
              const itemId = button.dataset.id;
              
              switch (action) {
                case 'mark-watched':
                  if (window.moveItem) {
                    window.moveItem(Number(itemId), 'watched');
                  }
                  break;
                case 'want-to-watch':
                  if (window.moveItem) {
                    window.moveItem(Number(itemId), 'wishlist');
                  }
                  break;
                case 'remove':
                  if (window.removeItemFromCurrentList) {
                    window.removeItemFromCurrentList(Number(itemId));
                  }
                  break;
              }
            });
          });
          
          itemsContainer.appendChild(itemEl);
        }
      });
    } else {
      console.log(`🎯 No dynamic content loaded for section: ${section.title}`);
    }
    } catch (error) {
      console.error(`🎯 Error loading dynamic content for ${section.title}:`, error);
    }
  });
  
  // Dispatch event to notify that curated cards have been rendered
  // Note: Count will be updated as dynamic content loads
  window.dispatchEvent(new CustomEvent('cards:rendered', { 
    detail: { 
      count: 0, // Will be updated as content loads
      section: 'curated' 
    } 
  }));
  
  // Clear render flag after a short delay
  setTimeout(() => {
    window.render_curated = false;
  }, 100);
}

// Export init function for idle import
export function init() {
  let mount = document.getElementById('curatedSections');
  if (!mount) {
    // Wait for element to be created by V2 system
    const checkForMount = () => {
      mount = document.getElementById('curatedSections');
      if (mount) {
        console.log('🎯 Curated sections element found, initializing');
        initializeCurated();
      } else {
        setTimeout(checkForMount, 100);
      }
    };
    checkForMount();
    return;
  }
  
  initializeCurated();
}

// Listen for curated:rerender event to update when settings change
document.addEventListener('curated:rerender', () => {
  console.log('🎯 Curated rerender event received, updating sections');
  initializeCurated();
});

// Also support IIFE for backward compatibility
(function(){
  let mount = document.getElementById('curatedSections');
  if (!mount) {
    // Wait for element to be created by V2 system
    const checkForMount = () => {
      mount = document.getElementById('curatedSections');
      if (mount) {
        console.log('🎯 Curated sections element found, initializing');
        initializeCurated();
      } else {
        setTimeout(checkForMount, 100);
      }
    };
    checkForMount();
    return;
  }
  
  initializeCurated();
  
  // Listen for curated:rerender event to update when settings change
  document.addEventListener('curated:rerender', () => {
    console.log('🎯 Curated rerender event received (IIFE), updating sections');
    initializeCurated();
  });
})();