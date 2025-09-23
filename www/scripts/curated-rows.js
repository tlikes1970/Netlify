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
    }
  });
  
  // Dispatch event to notify that curated cards have been rendered
  window.dispatchEvent(new CustomEvent('cards:rendered', { 
    detail: { 
      count: limitedSections.reduce((total, section) => total + (section.items?.length || 0), 0),
      section: 'curated' 
    } 
  }));
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