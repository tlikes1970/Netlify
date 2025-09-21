/* ========== curated-rows.js ==========
   Renders multiple curated rows from config.
   Expects items with { id, title, posterPath }. Map your data if needed.
*/

// Define initializeCurated function first
function initializeCurated() {
  let mount = document.getElementById('curatedSections');
  if (!mount) {
    mount = document.getElementById('curatedSections');
    if (!mount) return;
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

  limitedSections.forEach((section, index) => {
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

    // Render items for this section
    if (section.items && section.items.length > 0) {
      section.items.forEach(item => {
        if (USE_CARD && window.Card) {
          const card = window.Card({
            variant: 'poster',
            id: item.id,
            title: item.title,
            posterUrl: item.posterPath ? `https://image.tmdb.org/t/p/w200${item.posterPath}` : null,
            subtitle: item.year ? `${item.year} • ${item.mediaType === 'tv' ? 'TV Show' : 'Movie'}` : (item.mediaType === 'tv' ? 'TV Show' : 'Movie'),
            rating: item.rating,
            onOpenDetails: () => {
              // Use canonical detail link pattern with correct media type
              if (window.openTMDBLink) {
                window.openTMDBLink(item.id, item.mediaType || 'movie');
              }
            }
          });
          itemsContainer.appendChild(card);
        } else {
          // Fallback to simple item display with click handler
          const itemEl = document.createElement('div');
          itemEl.className = 'curated-item';
          itemEl.setAttribute('tabindex', '0');
          itemEl.setAttribute('role', 'button');
          itemEl.setAttribute('aria-label', `View details for ${item.title}`);
          
          const posterUrl = item.posterPath ? 
            `https://image.tmdb.org/t/p/w200${item.posterPath}` : 
            '/icons/icon-192.png';
          itemEl.innerHTML = `
            <img src="${posterUrl}" alt="${item.title}" onerror="this.src='/icons/icon-192.png'" />
            <span>${item.title}</span>
          `;
          
          // Add click handler for detail navigation
          itemEl.addEventListener('click', () => {
            if (window.openTMDBLink) {
              window.openTMDBLink(item.id, item.mediaType || 'movie');
            }
          });
          
          // Add keyboard support
          itemEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (window.openTMDBLink) {
                window.openTMDBLink(item.id, item.mediaType || 'movie');
              }
            }
          });
          
          itemsContainer.appendChild(itemEl);
        }
      });
    }
  });
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