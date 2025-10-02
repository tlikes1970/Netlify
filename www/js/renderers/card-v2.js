// Card V2 Renderer - Unified card rendering system
(function() {
  'use strict';
  
  const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMGYxMTE3Ii8+CjxwYXRoIGQ9Ik01NiA2MEw2NCA2OEw3MiA2MEw4MCA2OEw4OCA2MEw5NiA2OEwxMDQgNjBMMTEyIDY4VjEwMEw5NiAxMTJMODAgMTAwTDY0IDExMkw0OCAxMDBWNjZaIiBmaWxsPSIjMjQyYTMzIi8+Cjx0ZXh0IHg9IjYwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2E5YjNjMSI+Tm8gUG9zdGVyPC90ZXh0Pgo8L3N2Zz4K';

  // Get context-appropriate actions based on design specs
  function getActionsForListType(listType, context = 'default') {
    // Use the centralized configuration from cards-v2-config.js
    const configKey = `${listType}-${context}`;
    
    if (context === 'home' && listType === 'watching') {
      // Design spec: Home Currently Watching - 2x2 grid
      // Top: "Want to Watch" | "Watched"
      // Bottom: "Not Interested" | "Delete"
      return [
        { id: 'wishlist', label: 'Want to Watch', action: 'wishlist' },
        { id: 'watched', label: 'Watched', action: 'watched' },
        { id: 'not-interested', label: 'Not Interested', action: 'not-interested' },
        { id: 'delete', label: 'Delete', action: 'delete' }
      ];
    }
    
    // Use configuration from cards-v2-config.js
    if (window.V2_ACTION_CONFIGS && window.V2_ACTION_CONFIGS[configKey]) {
      return window.V2_ACTION_CONFIGS[configKey];
    }
    
    // Fallback for search context
    if (context === 'search') {
      return window.V2_ACTION_CONFIGS?.['search'] || [];
    }
    
    // Fallback for other contexts
    switch (listType) {
      case 'watching':
        return window.V2_ACTION_CONFIGS?.['watching-tab'] || [];
      case 'wishlist':
        return window.V2_ACTION_CONFIGS?.['wishlist-tab'] || [];
      case 'watched':
        return window.V2_ACTION_CONFIGS?.['watched-tab'] || [];
      case 'discover':
        return window.V2_ACTION_CONFIGS?.['search'] || [];
      case 'curated':
        // Design spec: Curated - single button only
        return [
          { id: 'wishlist', label: 'Want to Watch', action: 'wishlist' }
        ];
      case 'next-up':
        // Design spec: Next Up - no buttons
        return [];
      case 'search':
        // Design spec: Search - standard actions, no Pro buttons
        return [
          { id: 'wishlist', label: 'Want to Watch', action: 'wishlist' },
          { id: 'watching', label: 'Currently Watching', action: 'watching' },
          { id: 'watched', label: 'Watched', action: 'watched' },
          { id: 'not-interested', label: 'Not Interested', action: 'not-interested' },
          { id: 'review', label: 'Review/Notes', action: 'review' },
          { id: 'tag', label: 'Add Tag', action: 'tag' }
        ];
      default:
        // Fallback for unknown types
        return [
          { id: 'wishlist', label: 'Want to Watch', action: 'wishlist' },
          { id: 'watching', label: 'Currently Watching', action: 'watching' },
          { id: 'watched', label: 'Watched', action: 'watched' },
          { id: 'not-interested', label: 'Not Interested', action: 'not-interested' }
        ];
    }
  }

  // Get Pro actions for tab contexts
  function getProActions(listType) {
    const proActions = [
      { id: 'trailer', label: 'Trailer / Extras', action: 'trailer' }
    ];
    
    if (listType === 'watching') {
      proActions.push({ id: 'remind', label: 'Remind Me (Configurable)', action: 'remind' });
    }
    
    return proActions;
  }

  // Render user rating stars
  function renderUserRating(rating = 0, onRatingChange = null) {
    const stars = document.createElement('div');
    stars.className = 'user-rating';
    
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = `star ${i <= rating ? 'filled' : ''}`;
      star.textContent = '★';
      star.dataset.rating = i;
      
      if (onRatingChange) {
        star.addEventListener('click', () => onRatingChange(i));
      }
      
      stars.appendChild(star);
    }
    
    const label = document.createElement('span');
    label.className = 'rating-label';
    label.textContent = '(Your rating)';
    stars.appendChild(label);
    
    return stars;
  }

  // Render status badges
  function renderStatusBadges(badges = []) {
    if (!badges.length) return null;
    
    const container = document.createElement('div');
    container.className = 'status-badges';
    
    badges.forEach(badge => {
      const span = document.createElement('span');
      span.className = `badge ${badge.type || 'default'}`;
      span.textContent = badge.label;
      container.appendChild(span);
    });
    
    return container;
  }

  // Format meta information
  function formatMeta(item) {
    const parts = [];
    
    // Add genre
    if (item.genre) {
      parts.push(item.genre);
    }
    
    // Add SxxExx for TV shows
    if (item.seasonEpisode) {
      parts.push(item.seasonEpisode);
    }
    
    // Add runtime for movies
    if (item.runtime) {
      parts.push(`Runtime: ${item.runtime}m`);
    }
    
    // Add next air date for TV shows
    if (item.nextAirDate) {
      parts.push(`Next: ${item.nextAirDate}`);
    }
    
    return parts.join(' • ');
  }

  function renderCardV2(container, props, options = {}) {
    // Clear container
    container.innerHTML = '';
    
    // Determine card type and layout based on design specs
    const listType = options.listType || 'default';
    const context = options.context || 'default';
    
    // Design specs: Home sections use vertical, tabs/search use horizontal
    const isVertical = context === 'home' && ['watching', 'curated', 'next-up'].includes(listType);
    const isHorizontal = !isVertical;
    
    // Debug logging
    console.log(`[card-v2] Rendering card: listType=${listType}, context=${context}, isVertical=${isVertical}, isHorizontal=${isHorizontal}`);
    
    // Card type classes per design specs - context-aware
    const cardType = (listType === 'watching' && context === 'home') ? 'v2-home-cw' : 
                    (listType === 'curated' && context === 'home') ? 'v2-home-curated' : 
                    (listType === 'next-up' && context === 'home') ? 'v2-home-nextup' :
                    (listType === 'watching' && context === 'tab') ? 'v2-tab-card' :
                    (listType === 'wishlist' || listType === 'watched' || listType === 'discover') ? 'v2-tab-card' :
                    (listType === 'search' && context === 'search') ? 'v2-search-card' :
                    'v2-tab-card'; // fallback
    
    // Create card element with proper classes
    const card = document.createElement('div');
    card.className = `card v2 ${cardType}`;
    
    // Debug logging
    console.log(`[card-v2] Card type selected: ${cardType}, className: ${card.className}`);
    
    // Create poster with proper sizing per design specs
    const poster = document.createElement('div');
    poster.className = 'poster-wrap';
    
    // Handle TMDB linking for curated cards only
    if (listType === 'curated' && props.tmdbId) {
      const posterLink = document.createElement('a');
      posterLink.href = `https://www.themoviedb.org/${props.mediaType || 'movie'}/${props.tmdbId}`;
      posterLink.target = '_blank';
      posterLink.rel = 'noopener noreferrer';
      posterLink.title = 'Opens in TMDB';
      
      const img = document.createElement('img');
      // Use poster URL as-is since card data adapter already handles URL resolution
      img.src = (props.poster && props.poster.trim()) ? props.poster : PLACEHOLDER_SVG;
      img.alt = props.title || 'Unknown';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      
      posterLink.appendChild(img);
      poster.appendChild(posterLink);
    } else {
      const img = document.createElement('img');
      // Use poster URL as-is since card data adapter already handles URL resolution
      img.src = (props.poster && props.poster.trim()) ? props.poster : PLACEHOLDER_SVG;
      img.alt = props.title || 'Unknown';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      
      poster.appendChild(img);
    }
    
    // Create content section
    const content = document.createElement('div');
    content.className = 'card-content';
    
    // Create title with year (Title (Year) format)
    const title = document.createElement('h3');
    title.className = 'title';
    const year = props.releaseDate ? ` (${new Date(props.releaseDate).getFullYear()})` : '';
    title.textContent = `${props.title || 'Unknown'}${year}`;
    
    // Create meta information (Genre • SxxExx format)
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = formatMeta(props);
    
    content.appendChild(title);
    content.appendChild(meta);
    
    // Add specific content based on design specs
    if (listType === 'next-up' && props.nextAirDate) {
      // Next Up: single "Up next: <date>" line
      const nextAir = document.createElement('div');
      nextAir.className = 'next-air';
      // Handle both cases: raw date and pre-formatted label
      const airText = props.nextAirDate.startsWith('Up next:') ? props.nextAirDate : `Up next: ${props.nextAirDate}`;
      nextAir.textContent = airText;
      content.appendChild(nextAir);
    }
    
    if (listType === 'curated') {
      // Curated: Where to Watch and curator blurb
      if (props.whereToWatch) {
        const whereToWatch = document.createElement('div');
        whereToWatch.className = 'where-to-watch';
        whereToWatch.textContent = `Where to Watch: ${props.whereToWatch}`;
        content.appendChild(whereToWatch);
      }
      
      if (props.curatorBlurb) {
        const blurb = document.createElement('div');
        blurb.className = 'curator-blurb';
        blurb.textContent = props.curatorBlurb;
        content.appendChild(blurb);
      }
    }
    
    if (isHorizontal) {
      // Add overview for horizontal cards
      if (props.overview) {
        const overview = document.createElement('div');
        overview.className = 'overview';
        overview.textContent = props.overview;
        content.appendChild(overview);
      }
      
      // Add where to watch for horizontal cards
      if (props.whereToWatch) {
        const whereToWatch = document.createElement('div');
        whereToWatch.className = 'where-to-watch';
        whereToWatch.textContent = `Where to Watch: ${props.whereToWatch}`;
        content.appendChild(whereToWatch);
      }
      
      // Add status badges
      if (props.badges && props.badges.length) {
        const badges = renderStatusBadges(props.badges);
        if (badges) content.appendChild(badges);
      }
      
      // Add user rating
      if (props.userRating !== undefined) {
        const rating = renderUserRating(props.userRating, (newRating) => {
          if (window.emitCardAction) {
            window.emitCardAction('rate', {
              id: props.id,
              rating: newRating,
              source: 'card-v2'
            });
          }
        });
        content.appendChild(rating);
      }
      
      // Add progress summary for watching tab
      if (listType === 'watching' && props.progress) {
        const progress = document.createElement('div');
        progress.className = 'progress-summary';
        progress.textContent = `Progress: ${props.progress}`;
        content.appendChild(progress);
      }
    }
    
    // Create actions section based on design specs
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'actions';
    
    // Get context-appropriate actions
    const actions = getActionsForListType(listType, context);
    
    if (actions.length > 0) {
      if (isVertical && listType === 'watching' && context === 'home') {
        // Design spec: 2x2 grid for home currently watching
        // Top: "Want to Watch" | "Watched"
        // Bottom: "Not Interested" | "Delete"
        const grid = document.createElement('div');
        grid.className = 'action-grid-2x2';
        
        const topRow = document.createElement('div');
        topRow.className = 'action-row';
        const bottomRow = document.createElement('div');
        bottomRow.className = 'action-row';
        
        actions.forEach((action, index) => {
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
          
          if (index < 2) {
            topRow.appendChild(btn);
          } else {
            bottomRow.appendChild(btn);
          }
        });
        
        grid.appendChild(topRow);
        grid.appendChild(bottomRow);
        actionsWrap.appendChild(grid);
      } else if (isVertical && listType === 'curated' && context === 'home') {
        // Design spec: Single "Want to Watch" button for curated
        const singleBtn = document.createElement('button');
        singleBtn.textContent = 'Want to Watch';
        singleBtn.dataset.action = 'wishlist';
        singleBtn.className = 'btn btn--sm btn--secondary';
        singleBtn.addEventListener('click', () => {
          if (window.emitCardAction) {
            window.emitCardAction('wishlist', {
              id: props.id,
              mediaType: props.mediaType,
              source: 'card-v2',
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
        actionsWrap.appendChild(singleBtn);
      } else {
        // Design spec: Group actions into free-actions and pro-actions containers
        const freeActions = document.createElement('div');
        freeActions.className = 'free-actions';
        
        const proActions = document.createElement('div');
        proActions.className = 'pro-actions';
        
        // Separate free actions from pro actions
        const freeActionsList = actions.filter(action => !action.isPro);
        const proActionsList = actions.filter(action => action.isPro);
        
        // Render free actions
        freeActionsList.forEach(action => {
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
          freeActions.appendChild(btn);
        });
        
        // Render pro actions
        proActionsList.forEach(action => {
          const btn = document.createElement('button');
          btn.textContent = action.label;
          btn.dataset.action = action.action;
          btn.className = 'btn btn--sm btn--secondary btn--pro-outline';
          btn.addEventListener('click', () => {
            if (window.emitCardAction) {
              window.emitCardAction(action.action, {
                id: props.id,
                mediaType: props.mediaType,
                source: 'card-v2',
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
          proActions.appendChild(btn);
        });
        
        // Append containers to actions wrap
        if (freeActionsList.length > 0) {
          actionsWrap.appendChild(freeActions);
        }
        if (proActionsList.length > 0) {
          actionsWrap.appendChild(proActions);
        }
      }
    }
    
    // Add delete button for tab contexts only (not home)
    if (isHorizontal && context !== 'home' && listType !== 'curated' && listType !== 'next-up' && listType !== 'search') {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        if (window.emitCardAction) {
          window.emitCardAction('delete', {
            id: props.id,
            mediaType: props.mediaType,
            source: 'card-v2'
          });
        }
      });
      card.appendChild(deleteBtn);
    }
    
    // Add drag handle for tab contexts (right side)
    if (isHorizontal && listType !== 'curated' && listType !== 'next-up' && listType !== 'search') {
      const dragHandle = document.createElement('div');
      dragHandle.className = 'drag-handle';
      dragHandle.textContent = '≡';
      dragHandle.title = 'Drag to reorder';
      dragHandle.setAttribute('draggable', 'true');
      dragHandle.setAttribute('aria-label', 'Drag to reorder');
      card.appendChild(dragHandle);
    }
    
    // Assemble card
    card.appendChild(poster);
    card.appendChild(content);
    if (actionsWrap.children.length > 0) {
      card.appendChild(actionsWrap);
    }
    
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