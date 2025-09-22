/**
 * Base Poster Card Component - Unified Card System
 * 
 * Process: Base Poster Card
 * Purpose: Single template for all poster-focused cards with 2:3 aspect ratio, unified layout
 * Data Source: Item data from various sources (FlickWord, Trivia, etc.)
 * Update Path: BasePosterCard component API and CSS variables
 * Dependencies: components.css, i18n.js
 */

(function() {
  'use strict';

  console.log('🎴 Base Poster Card component loaded');

  /**
   * Create a standardized base poster card element
   * @param {Object} options - Card configuration
   * @param {string|number} options.id - Unique item ID
   * @param {string} options.posterUrl - Poster image URL
   * @param {string} options.title - Item title (will be converted to ALL CAPS)
   * @param {string} options.year - Year (optional)
   * @param {number} options.rating - Rating 0-10 (optional, only shown if > 0)
   * @param {Array} options.overflowActions - [{label, onClick, icon?}] (optional)
   * @param {Function} options.onClick - Click handler for card
   * @param {boolean} options.isDisabled - Disabled state
   * @param {string} options.subline - Subline text (for Trivia cards)
   * @param {boolean} options.hideRating - Hide rating line (for Trivia cards)
   * @returns {HTMLElement} Card element
   */
  function BasePosterCard({
    id,
    posterUrl,
    title,
    year,
    rating,
    overflowActions = [],
    onClick,
    isDisabled = false,
    subline,
    hideRating = false
  }) {
    const card = document.createElement('button');
    card.className = 'base-poster-card';
    card.dataset.id = id;
    card.dataset.testid = 'poster-card';
    
    if (isDisabled) {
      card.classList.add('base-poster-card--disabled');
    }

    // Format title as ALL CAPS
    const formattedTitle = title ? title.toUpperCase() : '';
    const titleWithYear = year ? `${formattedTitle} (${year})` : formattedTitle;

    // Format rating as stars (only if > 0 and not hidden)
    const showRating = !hideRating && rating && rating > 0;
    const roundedRating = showRating ? Math.round(rating * 10) / 10 : 0;

    // Build card HTML
    const cardHTML = `
      <div class="base-poster-card__poster" data-testid="poster-image">
        ${posterUrl ? 
          `<img src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
          '<div class="base-poster-card__placeholder">🎬</div>'
        }
        <div class="base-poster-card__placeholder" style="display: ${posterUrl ? 'none' : 'flex'};">🎬</div>
      </div>
      <div class="base-poster-card__content">
        <h3 class="base-poster-card__title" data-testid="poster-title">${titleWithYear}</h3>
        ${subline ? `<p class="base-poster-card__subline">${subline}</p>` : ''}
        ${showRating ? `<div class="base-poster-card__rating" data-testid="poster-rating">★${roundedRating}</div>` : ''}
        ${overflowActions.length > 0 ? `
          <div class="base-poster-card__overflow" data-testid="poster-menu">
            <button class="base-poster-card__overflow-btn" aria-label="More options">
              <span class="base-poster-card__overflow-dots">•••</span>
            </button>
            <div class="base-poster-card__overflow-menu" aria-hidden="true">
              ${overflowActions.map(action => `
                <button class="base-poster-card__overflow-item" onclick="(${action.onClick.toString()})()">
                  ${action.icon ? `<span class="base-poster-card__overflow-icon">${action.icon}</span>` : ''}
                  <span class="base-poster-card__overflow-label">${action.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    card.innerHTML = cardHTML;

    // Add click handler
    if (onClick) {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking overflow menu
        if (!e.target.closest('.base-poster-card__overflow')) {
          onClick(id);
        }
      });
    }

    // Add overflow menu toggle
    const overflowBtn = card.querySelector('.base-poster-card__overflow-btn');
    const overflowMenu = card.querySelector('.base-poster-card__overflow-menu');
    
    if (overflowBtn && overflowMenu) {
      overflowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = overflowMenu.getAttribute('aria-hidden') === 'false';
        overflowMenu.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!card.contains(e.target)) {
          overflowMenu.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Set accessibility attributes
    card.setAttribute('aria-label', `${title}${year ? ` (${year})` : ''}`);

    return card;
  }

  /**
   * Create skeleton loading cards
   * @param {number} count - Number of skeleton cards to create
   * @returns {Array<HTMLElement>} Array of skeleton card elements
   */
  function createSkeletonCards(count = 6) {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'base-poster-card base-poster-card--skeleton';
      skeleton.innerHTML = `
        <div class="base-poster-card__poster base-poster-card__skeleton-shimmer"></div>
        <div class="base-poster-card__content">
          <div class="base-poster-card__title base-poster-card__skeleton-shimmer"></div>
          <div class="base-poster-card__subline base-poster-card__skeleton-shimmer"></div>
        </div>
      `;
      skeletons.push(skeleton);
    }
    return skeletons;
  }

  /**
   * Create empty state card
   * @param {string} message - Empty state message
   * @returns {HTMLElement} Empty state card element
   */
  function createEmptyState(message = 'Nothing here yet') {
    const emptyState = document.createElement('div');
    emptyState.className = 'base-poster-card base-poster-card--empty';
    emptyState.innerHTML = `
      <div class="base-poster-card__empty-content">
        <div class="base-poster-card__empty-icon">📭</div>
        <p class="base-poster-card__empty-message">${message}</p>
      </div>
    `;
    return emptyState;
  }

  // Expose Base Poster Card component globally
  window.BasePosterCard = BasePosterCard;
  window.createSkeletonCards = createSkeletonCards;
  window.createEmptyState = createEmptyState;
  
  // Ensure global availability
  if (typeof window !== 'undefined') {
    window.BasePosterCard = window.BasePosterCard || BasePosterCard;
    window.createSkeletonCards = window.createSkeletonCards || createSkeletonCards;
    window.createEmptyState = window.createEmptyState || createEmptyState;
  }

  console.log('✅ Base Poster Card component ready');

})();
