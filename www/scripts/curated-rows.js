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
  const MAX_SECTIONS = 3; // Limit to prevent overwhelming the UI
  const sections = window.CURATED_SECTIONS || [];
  const limitedSections = sections.slice(0, MAX_SECTIONS);

  console.log('🎯 Rendering curated sections:', limitedSections.length);

  // Clear existing content
  mount.innerHTML = '';

  limitedSections.forEach((section, index) => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'curated-section';
    sectionEl.innerHTML = `
      <h3 class="curated-section-title">${section.title}</h3>
      <div class="curated-items" data-section="${index}"></div>
    `;

    mount.appendChild(sectionEl);
    
    // Make the container visible
    mount.style.display = 'block';

    // Render items for this section
    const itemsContainer = sectionEl.querySelector('.curated-items');
    if (section.items && section.items.length > 0) {
      section.items.forEach(item => {
        if (USE_CARD && window.Card) {
          const card = window.Card({
            variant: 'poster',
            id: item.id,
            title: item.title,
            posterUrl: item.posterPath ? `https://image.tmdb.org/t/p/w200${item.posterPath}` : null,
            subtitle: item.year ? `${item.year} • Movie` : 'Movie',
            rating: item.rating
          });
          itemsContainer.appendChild(card);
        } else {
          // Fallback to simple item display
          const itemEl = document.createElement('div');
          itemEl.className = 'curated-item';
          const posterUrl = item.posterPath ? 
            `https://image.tmdb.org/t/p/w200${item.posterPath}` : 
            '/icons/icon-192.png';
          itemEl.innerHTML = `
            <img src="${posterUrl}" alt="${item.title}" onerror="this.src='/icons/icon-192.png'" />
            <span>${item.title}</span>
          `;
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
})();