/**
 * Card Component - Unified Card System
 * 
 * Process: Card Component
 * Purpose: Unified card component with compact/expanded/poster variants for all Home rows and search results
 * Data Source: Item data from various sources (curated, user lists, search)
 * Update Path: Card component API and CSS variables
 * Dependencies: i18n.js, components.css, row renderers
 */

(function() {
  'use strict';

  console.log('🎴 Card component loaded');

  /**
   * Generate action buttons for detail variant cards
   * @param {string|number} id - Item ID
   * @param {string} currentList - Current list type
   * @param {boolean} isPro - Pro account status
   * @param {boolean} episodeTrackingEnabled - Episode tracking toggle
   * @param {number} userRating - User's current rating
   * @param {string} userNote - User's current note
   * @returns {string} HTML for action buttons
   */
  function generateDetailActions(id, currentList, isPro, episodeTrackingEnabled, userRating, userNote) {
    const actions = [];
    
    // Core actions based on current list
    if (currentList !== 'wishlist') {
      actions.push(`
        <button class="unified-card-action-btn" 
                data-action="want-to-watch" 
                data-id="${id}" 
                aria-label="Add to Want to Watch"
                title="Add to Want to Watch">
          <span class="unified-card-action-icon">📖</span>
          <span class="unified-card-action-label">Want to Watch</span>
        </button>
      `);
    }
    
    if (currentList !== 'watching') {
      actions.push(`
        <button class="unified-card-action-btn" 
                data-action="start-watching" 
                data-id="${id}" 
                aria-label="Start Watching"
                title="Start Watching">
          <span class="unified-card-action-icon">▶️</span>
          <span class="unified-card-action-label">Watching</span>
        </button>
      `);
    }
    
    if (currentList !== 'watched') {
      actions.push(`
        <button class="unified-card-action-btn" 
                data-action="mark-watched" 
                data-id="${id}" 
                aria-label="Mark as Watched"
                title="Mark as Watched">
          <span class="unified-card-action-icon">✅</span>
          <span class="unified-card-action-label">Watched</span>
        </button>
      `);
    }
    
    // Not Interested (only for Discover)
    if (currentList === 'discover') {
      actions.push(`
        <button class="unified-card-action-btn" 
                data-action="not-interested" 
                data-id="${id}" 
                aria-label="Not Interested"
                title="Not Interested">
          <span class="unified-card-action-icon">👎</span>
          <span class="unified-card-action-label">Not Interested</span>
        </button>
      `);
    }
    
    // Details button
    actions.push(`
      <button class="unified-card-action-btn" 
              data-action="details" 
              data-id="${id}" 
              aria-label="View Details"
              title="View Details">
        <span class="unified-card-action-icon">ℹ️</span>
        <span class="unified-card-action-label">Details</span>
      </button>
    `);
    
    // Episode Tracking (if enabled)
    if (episodeTrackingEnabled && currentList === 'watching') {
      actions.push(`
        <button class="unified-card-action-btn" 
                data-action="episode-tracking" 
                data-id="${id}" 
                aria-label="Episode Tracking"
                title="Episode Tracking">
          <span class="unified-card-action-icon">📺</span>
          <span class="unified-card-action-label">Episodes</span>
        </button>
      `);
    }
    
    // Pro features
    if (isPro) {
      actions.push(`
        <button class="unified-card-action-btn unified-card-action-btn--pro" 
                data-action="show-trivia" 
                data-id="${id}" 
                aria-label="Show Trivia"
                title="Show Trivia (Pro)">
          <span class="unified-card-action-icon">🎭</span>
          <span class="unified-card-action-label">Trivia</span>
        </button>
      `);
      
      actions.push(`
        <button class="unified-card-action-btn unified-card-action-btn--pro" 
                data-action="behind-scenes" 
                data-id="${id}" 
                aria-label="Behind the Scenes"
                title="Behind the Scenes (Pro)">
          <span class="unified-card-action-icon">🎬</span>
          <span class="unified-card-action-label">Behind Scenes</span>
        </button>
      `);
      
      actions.push(`
        <button class="unified-card-action-btn unified-card-action-btn--pro" 
                data-action="bloopers" 
                data-id="${id}" 
                aria-label="Bloopers"
                title="Bloopers (Pro)">
          <span class="unified-card-action-icon">😂</span>
          <span class="unified-card-action-label">Bloopers</span>
        </button>
      `);
    }
    
    // Rating system
    actions.push(`
      <div class="unified-card-rating-input">
        <label for="rating-${id}">Rate:</label>
        <select id="rating-${id}" data-action="rate" data-id="${id}" class="unified-card-rating-select">
          <option value="0" ${userRating === 0 ? 'selected' : ''}>No Rating</option>
          <option value="1" ${userRating === 1 ? 'selected' : ''}>⭐</option>
          <option value="2" ${userRating === 2 ? 'selected' : ''}>⭐⭐</option>
          <option value="3" ${userRating === 3 ? 'selected' : ''}>⭐⭐⭐</option>
          <option value="4" ${userRating === 4 ? 'selected' : ''}>⭐⭐⭐⭐</option>
          <option value="5" ${userRating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐</option>
        </select>
      </div>
    `);
    
    // Notes system
    actions.push(`
      <div class="unified-card-notes">
        <label for="note-${id}">Note:</label>
        <textarea id="note-${id}" 
                  data-action="note" 
                  data-id="${id}" 
                  class="unified-card-note-input" 
                  placeholder="Add a note..."
                  rows="2">${userNote}</textarea>
      </div>
    `);
    
    // Remove button
    actions.push(`
      <button class="unified-card-action-btn unified-card-action-btn--danger" 
              data-action="remove" 
              data-id="${id}" 
              aria-label="Remove from List"
              title="Remove from List">
        <span class="unified-card-action-icon">🗑️</span>
        <span class="unified-card-action-label">Remove</span>
      </button>
    `);
    
    return actions.join('');
  }

  /**
   * Create a unified card element for Home and Curated sections
   * @param {Object} options - Card configuration
   * @param {string} options.variant - 'unified' (for home/curated) | 'detail' (for tabs) | 'compact' | 'expanded' | 'poster'
   * @param {string|number} options.id - Unique item ID
   * @param {string} options.posterUrl - Poster image URL
   * @param {string} options.title - Item title
   * @param {string} options.subtitle - Year • type info
   * @param {number} options.rating - Rating 0-10 or 0-5 (normalized to stars)
   * @param {string} options.mediaType - 'tv' or 'movie'
   * @param {Function} options.onOpenDetails - Click handler for poster/title
   * @param {boolean} options.isDisabled - Disabled state
   * @param {string} options.currentList - Current list type (watching, wishlist, watched, discover)
   * @param {Array} options.overflowActions - Additional action buttons
   * @param {Object} options.userRating - User's personal rating (1-5 stars)
   * @param {string} options.userNote - User's personal note
   * @param {boolean} options.isPro - Pro account status
   * @param {boolean} options.episodeTrackingEnabled - Episode tracking toggle
   * @returns {HTMLElement} Card element
   */
  function Card({
    variant = 'unified',
    id,
    posterUrl,
    posterPath,
    title,
    subtitle,
    rating,
    mediaType = 'movie',
    onOpenDetails,
    isDisabled = false,
    currentList = 'watching',
    overflowActions = [],
    userRating = 0,
    userNote = '',
    isPro = false,
    episodeTrackingEnabled = false
  }) {
    const card = document.createElement('article');
    card.className = `unified-card unified-card--${variant}`;
    card.dataset.id = id;
    card.dataset.variant = variant;
    card.dataset.mediaType = mediaType;
    
    // Add drag functionality for user-owned lists
    if (variant === 'detail' && ['watching', 'wishlist', 'watched'].includes(currentList)) {
      card.draggable = true;
      card.classList.add('draggable');
    }
    
    if (isDisabled) {
      card.classList.add('unified-card--disabled');
    }

    // Normalize rating to 0-5 scale for stars
    const normalizedRating = rating ? Math.min(5, Math.max(0, rating / 2)) : 0;
    const stars = '★'.repeat(Math.floor(normalizedRating)) + '☆'.repeat(5 - Math.floor(normalizedRating));

    // Get proper poster URL using TMDB utilities
    const finalPosterUrl = posterUrl || (posterPath && window.getPosterUrl ? window.getPosterUrl(posterPath) : null);
    
    // Build card HTML based on variant
    let cardHTML;
    
    if (variant === 'detail') {
      // Horizontal detail layout for tabs
      cardHTML = `
        <div class="unified-card-poster" role="button" tabindex="0" aria-label="${title}">
          <div class="unified-card-poster-container">
            ${finalPosterUrl ? 
              `<img src="${finalPosterUrl}" alt="${title} poster" loading="lazy" class="unified-card-poster-image">` : 
              ''
            }
            <div class="unified-card-poster-placeholder">
              <div class="unified-card-poster-skeleton"></div>
              <div class="unified-card-poster-brand">🎬</div>
            </div>
          </div>
        </div>
        <div class="unified-card-content">
          <div class="unified-card-header">
            <h3 class="unified-card-title">${title}</h3>
            <div class="unified-card-subtitle">${subtitle || ''}</div>
            ${rating ? `<div class="unified-card-rating">${stars}</div>` : ''}
          </div>
          <div class="unified-card-actions">
            ${generateDetailActions(id, currentList, isPro, episodeTrackingEnabled, userRating, userNote)}
          </div>
        </div>
      `;
    } else {
      // Standard vertical layout for home/curated
      cardHTML = `
        <div class="unified-card-poster" role="button" tabindex="0" aria-label="${title}">
          <div class="unified-card-poster-container">
            ${finalPosterUrl ? 
              `<img src="${finalPosterUrl}" alt="${title} poster" loading="lazy" class="unified-card-poster-image">` : 
              ''
            }
            <div class="unified-card-poster-placeholder">
              <div class="unified-card-poster-skeleton"></div>
              <div class="unified-card-poster-brand">🎬</div>
            </div>
          </div>
          <div class="unified-card-actions">
            <button class="unified-card-action-btn" 
                    data-action="mark-watched" 
                    data-id="${id}" 
                    aria-label="Mark as Watched"
                    title="Mark as Watched">
              <span class="unified-card-action-icon">✅</span>
              <span class="unified-card-action-label" data-i18n="mark_watched">Mark Watched</span>
            </button>
            <button class="unified-card-action-btn" 
                    data-action="want-to-watch" 
                    data-id="${id}" 
                    aria-label="Add to Want to Watch"
                    title="Add to Want to Watch">
              <span class="unified-card-action-icon">📖</span>
              <span class="unified-card-action-label" data-i18n="want_to_watch">Want to Watch</span>
            </button>
            <button class="unified-card-action-btn" 
                    data-action="remove" 
                    data-id="${id}" 
                    aria-label="Remove from List"
                    title="Remove from List">
              <span class="unified-card-action-icon">🗑️</span>
              <span class="unified-card-action-label" data-i18n="remove">Remove</span>
            </button>
          </div>
        </div>
        <div class="unified-card-content">
          <h3 class="unified-card-title">${title}</h3>
          <div class="unified-card-subtitle">${subtitle || ''}</div>
          ${rating ? `<div class="unified-card-rating">${stars}</div>` : ''}
        </div>
      `;
    }

    card.innerHTML = cardHTML;

    // Add click handler for poster
    const poster = card.querySelector('.unified-card-poster');
    if (poster && onOpenDetails) {
      poster.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (!e.target.closest('.unified-card-action-btn')) {
          onOpenDetails(id);
        }
      });
    }

    // Add drag event handlers for reordering
    if (card.classList.contains('draggable')) {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', id);
        card.classList.add('dragging');
      });
      
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
      
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-over');
      });
      
      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });
      
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== id && window.reorderItems) {
          window.reorderItems(Number(draggedId), Number(id), currentList);
        }
      });
    }

    // Add action button handlers
    const actionButtons = card.querySelectorAll('.unified-card-action-btn, .unified-card-rating-select, .unified-card-note-input');
    actionButtons.forEach(element => {
      if (element.tagName === 'BUTTON') {
        element.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = element.dataset.action;
          const itemId = element.dataset.id;
          
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
            case 'start-watching':
              if (window.moveItem) {
                window.moveItem(Number(itemId), 'watching');
              }
              break;
            case 'not-interested':
              if (window.removeItemFromCurrentList) {
                window.removeItemFromCurrentList(Number(itemId));
              }
              break;
            case 'details':
              if (onOpenDetails) {
                onOpenDetails(Number(itemId));
              }
              break;
            case 'episode-tracking':
              if (window.openEpisodeTrackingModal) {
                window.openEpisodeTrackingModal(Number(itemId));
              }
              break;
            case 'show-trivia':
              if (window.showTrivia) {
                window.showTrivia(Number(itemId));
              }
              break;
            case 'behind-scenes':
              if (window.showBehindScenes) {
                window.showBehindScenes(Number(itemId));
              }
              break;
            case 'bloopers':
              if (window.showBloopers) {
                window.showBloopers(Number(itemId));
              }
              break;
            case 'remove':
              if (window.removeItemFromCurrentList) {
                window.removeItemFromCurrentList(Number(itemId));
              }
              break;
          }
        });
      } else if (element.tagName === 'SELECT') {
        // Rating select handler
        element.addEventListener('change', (e) => {
          e.stopPropagation();
          const rating = parseInt(e.target.value);
          const itemId = element.dataset.id;
          if (window.updateUserRating) {
            window.updateUserRating(Number(itemId), rating);
          }
        });
      } else if (element.tagName === 'TEXTAREA') {
        // Notes textarea handler
        element.addEventListener('blur', (e) => {
          e.stopPropagation();
          const note = e.target.value;
          const itemId = element.dataset.id;
          if (window.updateUserNote) {
            window.updateUserNote(Number(itemId), note);
          }
        });
      }
    });

    // Handle image loading for skeleton animation
    if (finalPosterUrl) {
      const img = card.querySelector('.unified-card-poster-image');
      const placeholder = card.querySelector('.unified-card-poster-placeholder');
      const skeleton = card.querySelector('.unified-card-poster-skeleton');
      const brand = card.querySelector('.unified-card-poster-brand');
      
      if (img && placeholder && skeleton && brand) {
        // Initially show skeleton, hide brand
        skeleton.style.display = 'block';
        brand.style.display = 'none';
        placeholder.style.display = 'flex';
        
        img.addEventListener('load', () => {
          // Image loaded successfully - hide placeholder
          placeholder.style.display = 'none';
        });
        
        img.addEventListener('error', () => {
          // Image failed to load - show brand placeholder
          skeleton.style.display = 'none';
          brand.style.display = 'flex';
          placeholder.style.display = 'flex';
        });
      }
    } else {
      // No poster URL - show brand placeholder immediately
      const placeholder = card.querySelector('.unified-card-poster-placeholder');
      const skeleton = card.querySelector('.unified-card-poster-skeleton');
      const brand = card.querySelector('.unified-card-poster-brand');
      
      if (placeholder && skeleton && brand) {
        skeleton.style.display = 'none';
        brand.style.display = 'flex';
        placeholder.style.display = 'flex';
      }
    }

    return card;
  }

  /**
   * Create card data object for consistent API
   * @param {Object} item - Raw item data
   * @param {string} source - Data source ('tmdb', 'firebase', etc.)
   * @param {string} section - UI section ('home', 'search', 'watching', 'wishlist', 'watched', 'discover')
   * @returns {Object} Normalized card data
   */
  function createCardData(item, source = 'tmdb', section = 'home') {
    const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                 item.first_air_date ? new Date(item.first_air_date).getFullYear() : 
                 item.year || '';
    const mediaType = item.media_type || item.mediaType || (item.first_air_date ? 'tv' : 'movie');
    
    // Construct proper poster URL using TMDB utilities
    const posterUrl = item.posterUrl || item.poster_src || 
                     (item.poster_path && window.getPosterUrl ? window.getPosterUrl(item.poster_path, 'w200') : 
                      item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : null);
    
    // Determine variant based on section
    const variant = ['watching', 'wishlist', 'watched', 'discover'].includes(section) ? 'detail' : 'unified';
    
    // Get user data from appData if available
    const appData = window.appData || {};
    const userRating = item.userRating || 0;
    const userNote = item.userNote || '';
    const isPro = appData.settings?.isPro || true; // Default to true for dev testing
    const episodeTrackingEnabled = appData.settings?.episodeTracking || true; // Default to true for dev testing
    
    return {
      variant: variant,
      id: item.id || item.tmdb_id || item.tmdbId,
      title: item.title || item.name,
      subtitle: year ? `(${year}) • ${mediaType === 'tv' ? 'TV Show' : 'Movie'}` : (mediaType === 'tv' ? 'TV Show' : 'Movie'),
      posterUrl: posterUrl,
      posterPath: item.posterPath || item.poster_path,
      rating: item.rating || item.vote_average,
      mediaType: mediaType,
      currentList: section,
      userRating: userRating,
      userNote: userNote,
      isPro: isPro,
      episodeTrackingEnabled: episodeTrackingEnabled,
      onOpenDetails: (id) => {
        // Open TMDB details
        if (window.openTMDBLink) {
          window.openTMDBLink(Number(id), mediaType);
        }
      }
    };
  }

  // Expose Card component globally
  window.Card = Card;
  window.createCardData = createCardData;
  
  // Ensure global availability
  if (typeof window !== 'undefined') {
    window.Card = window.Card || Card;
  }

  console.log('✅ Card component ready');

})();
