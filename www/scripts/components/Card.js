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
   * Create a unified card element for Home and Curated sections
   * @param {Object} options - Card configuration
   * @param {string} options.variant - 'unified' (for home/curated) | 'compact' | 'expanded' | 'poster'
   * @param {string|number} options.id - Unique item ID
   * @param {string} options.posterUrl - Poster image URL
   * @param {string} options.title - Item title
   * @param {string} options.subtitle - Year • type info
   * @param {number} options.rating - Rating 0-10 or 0-5 (normalized to stars)
   * @param {string} options.mediaType - 'tv' or 'movie'
   * @param {Function} options.onOpenDetails - Click handler for poster/title
   * @param {boolean} options.isDisabled - Disabled state
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
    isDisabled = false
  }) {
    const card = document.createElement('article');
    card.className = `unified-card unified-card--${variant}`;
    card.dataset.id = id;
    card.dataset.variant = variant;
    card.dataset.mediaType = mediaType;
    
    if (isDisabled) {
      card.classList.add('unified-card--disabled');
    }

    // Normalize rating to 0-5 scale for stars
    const normalizedRating = rating ? Math.min(5, Math.max(0, rating / 2)) : 0;
    const stars = '★'.repeat(Math.floor(normalizedRating)) + '☆'.repeat(5 - Math.floor(normalizedRating));

    // Get proper poster URL using TMDB utilities
    const finalPosterUrl = posterUrl || (posterPath && window.getPosterUrl ? window.getPosterUrl(posterPath) : null);
    
    // Build unified card HTML
    const cardHTML = `
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

    // Add action button handlers
    const actionButtons = card.querySelectorAll('.unified-card-action-btn');
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
   * @param {string} section - UI section ('home', 'search', etc.)
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
    
    return {
      id: item.id || item.tmdb_id || item.tmdbId,
      title: item.title || item.name,
      subtitle: year ? `(${year}) • ${mediaType === 'tv' ? 'TV Show' : 'Movie'}` : (mediaType === 'tv' ? 'TV Show' : 'Movie'),
      posterUrl: posterUrl,
      posterPath: item.posterPath || item.poster_path,
      rating: item.rating || item.vote_average,
      mediaType: mediaType,
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
