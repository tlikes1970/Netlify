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
   * Create a standardized card element
   * @param {Object} options - Card configuration
   * @param {string} options.variant - 'compact' | 'expanded' | 'poster'
   * @param {string|number} options.id - Unique item ID
   * @param {string} options.posterUrl - Poster image URL
   * @param {string} options.title - Item title
   * @param {string} options.subtitle - Year • type info
   * @param {number} options.rating - Rating 0-10 or 0-5 (normalized to stars)
   * @param {Array} options.badges - Badge objects [{label, kind}]
   * @param {Object} options.primaryAction - {label, onClick}
   * @param {Array} options.overflowActions - [{label, onClick, icon?}]
   * @param {Function} options.onOpenDetails - Click handler for poster/title
   * @param {boolean} options.isDisabled - Disabled state
   * @returns {HTMLElement} Card element
   */
  function Card({
    variant = 'compact',
    id,
    posterUrl,
    posterPath,
    title,
    subtitle,
    rating,
    badges = [],
    primaryAction,
    overflowActions = [],
    onOpenDetails,
    isDisabled = false
  }) {
    const card = document.createElement('article');
    card.className = `card card--${variant}`;
    card.dataset.id = id;
    card.dataset.variant = variant;
    
    if (isDisabled) {
      card.classList.add('card--disabled');
    }

    // Normalize rating to 0-5 scale for stars
    const normalizedRating = rating ? Math.min(5, Math.max(0, rating / 2)) : 0;
    const stars = '★'.repeat(Math.floor(normalizedRating)) + '☆'.repeat(5 - Math.floor(normalizedRating));

    // Get proper poster URL using TMDB utilities
    const finalPosterUrl = posterUrl || (posterPath && window.getPosterUrl ? window.getPosterUrl(posterPath) : null);
    
    // Build card HTML based on variant
    let cardHTML = '';
    
    if (variant === 'poster') {
      cardHTML = `
        <div class="card-poster">
          ${finalPosterUrl ? 
            `<img src="${finalPosterUrl}" alt="${title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
            '<div class="card-poster-placeholder">🎬</div>'
          }
          <div class="card-poster-placeholder" style="display: ${finalPosterUrl ? 'none' : 'flex'};">🎬</div>
          ${badges.length > 0 ? `<div class="card-badges">${badges.map(badge => `<span class="card-badge card-badge--${badge.kind}">${badge.label}</span>`).join('')}</div>` : ''}
        </div>
        <div class="card-content">
          <h3 class="card-title">${title}</h3>
          ${subtitle ? `<p class="card-subtitle">${subtitle}</p>` : ''}
          ${rating ? `<div class="card-rating">${stars}</div>` : ''}
          ${primaryAction ? `<button class="card-primary-action" onclick="(${primaryAction.onClick.toString()})()">${primaryAction.label}</button>` : ''}
          ${overflowActions.length > 0 ? `<div class="card-overflow-actions">${overflowActions.map(action => `<button class="card-overflow-action" onclick="(${action.onClick.toString()})()" title="${action.label}">${action.icon || '⋯'}</button>`).join('')}</div>` : ''}
        </div>
      `;
    } else {
      // Compact and expanded variants
      cardHTML = `
        <div class="card-poster">
          ${finalPosterUrl ? 
            `<img src="${finalPosterUrl}" alt="${title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
            '<div class="card-poster-placeholder">🎬</div>'
          }
          <div class="card-poster-placeholder" style="display: ${finalPosterUrl ? 'none' : 'flex'};">🎬</div>
        </div>
        <div class="card-content">
          <h3 class="card-title">${title}</h3>
          ${subtitle ? `<p class="card-subtitle">${subtitle}</p>` : ''}
          ${rating ? `<div class="card-rating">${stars}</div>` : ''}
          ${badges.length > 0 ? `<div class="card-badges">${badges.map(badge => `<span class="card-badge card-badge--${badge.kind}">${badge.label}</span>`).join('')}</div>` : ''}
          ${primaryAction ? `<button class="card-primary-action" onclick="(${primaryAction.onClick.toString()})()">${primaryAction.label}</button>` : ''}
          ${overflowActions.length > 0 ? `<div class="card-overflow-actions">${overflowActions.map(action => `<button class="card-overflow-action" onclick="(${action.onClick.toString()})()" title="${action.label}">${action.icon || '⋯'}</button>`).join('')}</div>` : ''}
        </div>
      `;
    }

    card.innerHTML = cardHTML;

    // Add click handler for poster/title
    if (onOpenDetails) {
      const clickableElements = card.querySelectorAll('.card-poster, .card-title');
      clickableElements.forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => onOpenDetails(id));
      });
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
    return {
      id: item.id || item.tmdb_id || item.tmdbId,
      title: item.title || item.name,
      subtitle: item.subtitle || `${item.year || ''} • ${item.mediaType || 'Movie'}`,
      posterUrl: item.posterUrl || item.poster_src,
      posterPath: item.posterPath || item.poster_path,
      rating: item.rating || item.vote_average,
      badges: item.badges || [],
      primaryAction: item.primaryAction,
      overflowActions: item.overflowActions || [],
      onOpenDetails: (id) => {
        // Open details modal or navigate to details page
        console.log('Open details for:', id);
        if (window.openItemDetails) {
          window.openItemDetails(Number(id));
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
