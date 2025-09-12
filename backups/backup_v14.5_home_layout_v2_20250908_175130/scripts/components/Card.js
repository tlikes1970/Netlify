/**
 * Card Component - Phase 1 Standardization
 * 
 * Process: Card Component
 * Purpose: Unified card component with compact/expanded variants for all Home rows and search results
 * Data Source: Item data from various sources (curated, user lists, search)
 * Update Path: Card component API and CSS variables
 * Dependencies: i18n.js, components.css, row renderers
 */

(function() {
  'use strict';

  console.log('🎴 Card component loaded');

  // Feature flag check
  if (!window.FLAGS?.cards_v2) {
    console.log('🚫 Card v2 disabled by feature flag');
    return;
  }

  /**
   * Create a standardized card element
   * @param {Object} options - Card configuration
   * @param {string} options.variant - 'compact' | 'expanded'
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
    const normalizedRating = rating ? (rating > 5 ? rating / 2 : rating) : 0;
    const stars = generateStars(normalizedRating);
    
    // Generate badges HTML
    const badgesHTML = badges.map(badge => 
      `<span class="card__badge card__badge--${badge.kind || 'default'}" aria-label="${badge.label}">${badge.label}</span>`
    ).join('');

    // Generate overflow menu HTML
    const overflowHTML = overflowActions.length > 0 ? `
      <div class="card__more">
        <button class="card__more-btn" aria-label="${t('more_actions')}" aria-expanded="false">
          <span class="card__more-dots">•••</span>
        </button>
        <div class="card__more-menu" role="menu" aria-hidden="true">
          ${overflowActions.map(action => `
            <button class="card__more-item" role="menuitem" data-action="${action.label.toLowerCase().replace(/\s+/g, '-')}">
              ${action.icon ? `<span class="card__more-icon">${action.icon}</span>` : ''}
              <span class="card__more-label">${action.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Generate primary action HTML
    const primaryActionHTML = primaryAction ? `
      <button class="card__primary-action btn primary" data-action="primary">
        ${primaryAction.label}
      </button>
    ` : '';

    // Build card HTML based on variant
    if (variant === 'compact') {
      card.innerHTML = `
        <div class="card__poster" role="button" tabindex="0" aria-label="${title}">
          ${posterUrl ? 
            `<img src="${posterUrl}" alt="${title} poster" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
            ''
          }
          <div class="card__poster-placeholder" style="display: ${posterUrl ? 'none' : 'flex'};">
            🎬
          </div>
          <div class="card__overlay">
            <div class="card__overlay-content">
              <h3 class="card__title">${title}</h3>
              ${subtitle ? `<p class="card__subtitle">${subtitle}</p>` : ''}
              ${stars ? `<div class="card__rating" aria-label="Rating ${normalizedRating}/5">${stars}</div>` : ''}
              ${primaryActionHTML}
            </div>
          </div>
          ${badgesHTML}
        </div>
        ${overflowHTML}
      `;
    } else {
      // Expanded variant
      card.innerHTML = `
        <div class="card__poster" role="button" tabindex="0" aria-label="${title}">
          ${posterUrl ? 
            `<img src="${posterUrl}" alt="${title} poster" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
            ''
          }
          <div class="card__poster-placeholder" style="display: ${posterUrl ? 'none' : 'flex'};">
            🎬
          </div>
          ${badgesHTML}
        </div>
        <div class="card__content">
          <h3 class="card__title">${title}</h3>
          ${subtitle ? `<p class="card__subtitle">${subtitle}</p>` : ''}
          ${stars ? `<div class="card__rating" aria-label="Rating ${normalizedRating}/5">${stars}</div>` : ''}
          <div class="card__actions">
            ${primaryActionHTML}
            ${overflowHTML}
          </div>
        </div>
      `;
    }

    // Add event listeners
    setupCardEventListeners(card, { onOpenDetails, primaryAction, overflowActions });

    return card;
  }

  /**
   * Generate star rating HTML
   * @param {number} rating - Rating 0-5
   * @returns {string} Stars HTML
   */
  function generateStars(rating) {
    if (!rating || rating <= 0) return '';
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '☆';
    stars += '☆'.repeat(emptyStars);
    
    return `<span class="card__stars">${stars}</span>`;
  }

  /**
   * Set up event listeners for card interactions
   * @param {HTMLElement} card - Card element
   * @param {Object} handlers - Event handlers
   */
  function setupCardEventListeners(card, { onOpenDetails, primaryAction, overflowActions }) {
    // Poster/title click for details
    const poster = card.querySelector('.card__poster');
    const title = card.querySelector('.card__title');
    
    if (poster && onOpenDetails) {
      poster.addEventListener('click', () => onOpenDetails(card.dataset.id));
      poster.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails(card.dataset.id);
        }
      });
    }

    if (title && onOpenDetails) {
      title.addEventListener('click', () => onOpenDetails(card.dataset.id));
    }

    // Primary action
    const primaryBtn = card.querySelector('.card__primary-action');
    if (primaryBtn && primaryAction?.onClick) {
      primaryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        primaryAction.onClick(card.dataset.id);
      });
    }

    // Overflow menu
    const moreBtn = card.querySelector('.card__more-btn');
    const moreMenu = card.querySelector('.card__more-menu');
    
    if (moreBtn && moreMenu) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = moreMenu.getAttribute('aria-hidden') === 'false';
        moreMenu.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
        moreBtn.setAttribute('aria-expanded', !isOpen);
        
        if (!isOpen) {
          // Close other open menus
          document.querySelectorAll('.card__more-menu[aria-hidden="false"]').forEach(menu => {
            if (menu !== moreMenu) {
              menu.setAttribute('aria-hidden', 'true');
              menu.previousElementSibling.setAttribute('aria-expanded', 'false');
            }
          });
        }
      });

      // Menu item clicks
      moreMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.card__more-item');
        if (!item) return;
        
        e.stopPropagation();
        const action = item.dataset.action;
        const handler = overflowActions.find(a => 
          a.label.toLowerCase().replace(/\s+/g, '-') === action
        );
        
        if (handler?.onClick) {
          handler.onClick(card.dataset.id);
        }
        
        // Close menu
        moreMenu.setAttribute('aria-hidden', 'true');
        moreBtn.setAttribute('aria-expanded', 'false');
      });
    }

    // Close overflow menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!card.contains(e.target)) {
        if (moreMenu) {
          moreMenu.setAttribute('aria-hidden', 'true');
          moreBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  /**
   * Helper function to create card data from various item formats
   * @param {Object} item - Raw item data
   * @param {string} variant - Card variant
   * @returns {Object} Card configuration
   */
  function createCardData(item, variant = 'compact') {
    const id = item.id || item.tmdb_id || item.tmdbId;
    const title = item.title || item.name || 'Unknown Title';
    
    // Extract year and type
    const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                 item.first_air_date ? new Date(item.first_air_date).getFullYear() : 
                 item.year || '';
    const type = item.media_type || item.mediaType || (item.first_air_date ? 'TV' : 'Movie');
    const subtitle = year ? `${year} • ${type}` : type;

    // Handle poster URL
    let posterUrl = item.poster_src || item.poster;
    if (!posterUrl && item.poster_path) {
      posterUrl = `https://image.tmdb.org/t/p/w342${item.poster_path}`;
    }

    // Normalize rating
    const rating = item.userRating || item.rating || 
                  (item.vote_average ? item.vote_average / 2 : null);

    // Generate badges
    const badges = [];
    if (item.status === 'watching') badges.push({ label: t('currently_watching'), kind: 'status' });
    if (item.status === 'completed') badges.push({ label: t('series_complete'), kind: 'status' });
    if (item.status === 'upcoming') badges.push({ label: t('coming_soon'), kind: 'status' });

    // Generate actions based on context
    const primaryAction = {
      label: item.status === 'watching' ? t('continue') : t('add'),
      onClick: (id) => {
        if (item.status === 'watching') {
          // Continue watching logic
          console.log('Continue watching:', id);
        } else {
          // Add to list logic
          if (window.addToList) {
            window.addToList(item, 'watching');
          }
        }
      }
    };

    const overflowActions = [
      {
        label: t('notes_tags'),
        icon: '📝',
        onClick: (id) => console.log('Open notes for:', id)
      },
      {
        label: t('remove'),
        icon: '🗑️',
        onClick: (id) => {
          if (window.removeItemFromCurrentList) {
            window.removeItemFromCurrentList(Number(id));
          }
        }
      }
    ];

    return {
      variant,
      id,
      posterUrl,
      title,
      subtitle,
      rating,
      badges,
      primaryAction,
      overflowActions,
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
