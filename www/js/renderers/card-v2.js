// Card V2 Renderer - Unified card rendering system
(function() {
  'use strict';
  
  const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMGYxMTE3Ii8+CjxwYXRoIGQ9Ik01NiA2MEw2NCA2OEw3MiA2MEw4MCA2OEw4OCA2MEw5NiA2OEwxMDQgNjBMMTEyIDY4VjEwMEw5NiAxMTJMODAgMTAwTDY0IDExMkw0OCAxMDBWNjZaIiBmaWxsPSIjMjQyYTMzIi8+Cjx0ZXh0IHg9IjYwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2E5YjNjMSI+Tm8gUG9zdGVyPC90ZXh0Pgo8L3N2Zz4K';

  // Get context-appropriate actions based on list type
  function getActionsForListType(listType) {
    switch (listType) {
      case 'watching':
        return [
          { id: 'watched', label: 'Mark watched', action: 'watched' },
          { id: 'wishlist', label: 'Add to wishlist', action: 'wishlist' },
          { id: 'remove', label: 'Remove from Watching', action: 'remove-watching' }
        ];
      case 'wishlist':
        return [
          { id: 'watching', label: 'Start watching', action: 'watching' },
          { id: 'watched', label: 'Mark watched', action: 'watched' },
          { id: 'remove', label: 'Remove from wishlist', action: 'remove-wishlist' }
        ];
      case 'watched':
        return [
          { id: 'watching', label: 'Start watching', action: 'watching' },
          { id: 'wishlist', label: 'Add to wishlist', action: 'wishlist' },
          { id: 'remove', label: 'Remove from watched', action: 'remove-watched' }
        ];
      default:
        // Default actions for search/discover
        return [
          { id: 'watched', label: 'Mark watched', action: 'watched' },
          { id: 'wishlist', label: 'Add to wishlist', action: 'wishlist' },
          { id: 'watching', label: 'Start watching', action: 'watching' }
        ];
    }
  }

  function renderCardV2(container, props, options = {}) {
    // Clear container
    container.innerHTML = '';
    
    // Determine card type based on options or props
    const cardType = options.listType === 'watching' ? 'cw-card' : 
                    options.listType === 'curated' ? 'curated-card' : 
                    options.listType === 'wishlist' || options.listType === 'watched' ? 'cw-card' :
                    'search-card';
    
    // Create card element
    const card = document.createElement('div');
    card.className = `${cardType} v2`;
    
    // Create poster
    const poster = document.createElement('div');
    poster.className = 'poster-wrap';
    
    const img = document.createElement('img');
    // Construct proper poster URL if it's a poster_path
    let posterUrl = props.poster;
    if (props.poster && props.poster.startsWith('/')) {
      posterUrl = `https://image.tmdb.org/t/p/w200${props.poster}`;
    }
    img.src = posterUrl || PLACEHOLDER_SVG;
    img.alt = props.title || 'Unknown';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    
    poster.appendChild(img);
    
    // Create meta section
    const meta = document.createElement('div');
    meta.className = 'meta';
    
    const title = document.createElement('h3');
    title.className = 'title';
    title.textContent = props.title || 'Unknown';
    
    const date = document.createElement('p');
    date.className = 'date';
    date.textContent = props.releaseDate || '';
    
    meta.appendChild(title);
    meta.appendChild(date);
    
    // Create actions
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'actions';
    
    // Get context-appropriate actions based on list type
    const actions = getActionsForListType(options.listType);
    
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.dataset.action = action.action;
      btn.className = 'btn btn--sm btn--secondary';
      btn.addEventListener('click', () => {
        if (window.emitCardAction) {
          window.emitCardAction(action.action, {
            id: props.id,
            mediaType: props.mediaType,
            source: 'card-v2',
            // Pass full item data for proper storage
            itemData: {
              id: props.id,
              media_type: props.mediaType,
              title: props.title,
              name: props.title,
              poster_path: props.poster ? props.poster.replace('https://image.tmdb.org/t/p/w200', '') : null,
              release_date: props.releaseDate,
              first_air_date: props.releaseDate
            }
          });
        }
      });
      actionsWrap.appendChild(btn);
    });
    
    // Assemble card
    card.appendChild(poster);
    card.appendChild(meta);
    card.appendChild(actionsWrap);
    
    // Append to container
    container.appendChild(card);
    
    return card;
  }

  // Legacy compatibility
  function renderSearchCardV2(item, capabilities) {
    const container = document.createElement('div');
    
    // Construct proper poster URL
    let posterUrl = '';
    if (item.poster_path) {
      posterUrl = `https://image.tmdb.org/t/p/w200${item.poster_path}`;
    } else if (item.posterUrl) {
      posterUrl = item.posterUrl;
    }
    
    const props = {
      id: item.id,
      mediaType: item.media_type || 'movie',
      title: item.title || item.name || 'Unknown',
      poster: posterUrl,
      releaseDate: item.release_date || item.first_air_date || ''
    };
    return renderCardV2(container, props);
  }

  // Expose globally
  window.renderCardV2 = renderCardV2;
  window.renderSearchCardV2 = renderSearchCardV2;
  
  console.log('✅ Card V2 renderer loaded');
})();