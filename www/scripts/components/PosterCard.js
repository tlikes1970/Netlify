/**
 * Poster Card Component - Unified Card Design
 * 
 * Process: Poster Card Component
 * Purpose: Unified poster card pattern for all content surfaces (Watching, Wishlist, Watched, Discover, Search)
 * Data Source: Normalized item data from various sources
 * Update Path: Card component API and CSS variables
 * Dependencies: i18n.js, components.css, centralized actions
 */

(function() {
  'use strict';

  console.log('🎴 Poster Card component loaded');

  /**
   * Create a unified poster card element
   * @param {Object} options - Card configuration
   * @param {string|number} options.id - Unique item ID
   * @param {string} options.mediaType - 'movie' | 'tv' | 'person'
   * @param {string} options.title - Item title
   * @param {string} options.posterUrl - Poster image URL (w200)
   * @param {string} options.posterPath - TMDB poster path for srcset
   * @param {string} options.year - Release year
   * @param {number} options.rating - Vote average (0-10)
   * @param {string} options.runtime - Runtime in minutes (movies)
   * @param {string} options.season - Season number (TV)
   * @param {string} options.episode - Episode number (TV)
   * @param {Array} options.badges - Badge objects [{label, kind, color?}]
   * @param {Object} options.quickActions - Quick action buttons
   * @param {Array} options.overflowActions - Three-dot menu actions
   * @param {Function} options.onOpenDetails - Details click handler
   * @param {string} options.section - Section context (watching, wishlist, watched, discover, search)
   * @param {Object} options.progress - Progress data for watching items
   * @param {boolean} options.isNew - Released in last 30 days
   * @param {boolean} options.isAvailable - Available on streaming services
   * @returns {HTMLElement} Poster card element
   */
  function PosterCard({
    id,
    mediaType = 'movie',
    title,
    posterUrl,
    posterPath,
    year,
    rating = 0,
    runtime,
    season,
    episode,
    badges = [],
    quickActions = {},
    overflowActions = [],
    onOpenDetails,
    section = 'discover',
    progress = {},
    isNew = false,
    isAvailable = false
  }) {
    const card = document.createElement('article');
    card.className = `poster-card poster-card--${section}`;
    card.dataset.id = id;
    card.dataset.mediaType = mediaType;
    card.dataset.section = section;
    
    // Generate meta line based on media type
    const meta = generateMeta(mediaType, { year, runtime, season, episode });
    
    // Generate badges
    const badgesHTML = generateBadges(rating, isNew, isAvailable, badges);
    
    // Generate quick actions
    const quickActionsHTML = generateQuickActions(quickActions, section);
    
    // Generate three-dot overflow menu
    const overflowHTML = generateOverflowMenu(overflowActions);
    
    // Generate progress bar for watching items
    const progressHTML = generateProgressBar(progress, mediaType);
    
    // Generate srcset for responsive images
    const srcset = posterPath && typeof window.tmdbSrcset === 'function' ? 
      window.tmdbSrcset(posterPath) : '';
    
    // Generate placeholder with title initials
    const placeholder = generatePlaceholder(title);
    
    // Build card HTML
    card.innerHTML = `
      <div class="poster-card__poster" role="button" tabindex="0" aria-label="${title}">
        ${posterUrl ? 
          `<img src="${posterUrl}" ${srcset ? `srcset="${srcset}"` : ''} sizes="(max-width: 480px) 148px, 200px" alt="${title} poster" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
          ''
        }
        <div class="poster-card__placeholder" style="display: ${posterUrl ? 'none' : 'flex'};">
          ${placeholder}
        </div>
        <div class="poster-card__overlay">
          <div class="poster-card__overlay-content">
            <div class="poster-card__title-row">
              <h3 class="poster-card__title" title="${title} (${year})">${title}</h3>
              ${badgesHTML}
            </div>
            <p class="poster-card__meta">${meta}</p>
            ${progressHTML}
            <div class="poster-card__quick-actions">
              ${quickActionsHTML}
            </div>
          </div>
        </div>
      </div>
      <div class="poster-card__content">
        <h3 class="poster-card__title" title="${title} (${year})">${title}</h3>
        <p class="poster-card__meta">${meta}</p>
        ${progressHTML}
        <div class="poster-card__actions">
          <div class="poster-card__quick-actions">
            ${quickActionsHTML}
          </div>
          ${overflowHTML}
        </div>
      </div>
    `;
    
    // Add event listeners
    setupPosterCardEventListeners(card, { onOpenDetails, quickActions, overflowActions });
    
    return card;
  }

  /**
   * Generate meta line based on media type
   */
  function generateMeta(mediaType, { year, runtime, season, episode }) {
    if (mediaType === 'tv') {
      if (season && episode) {
        return `S${season} · E${episode}`;
      } else if (year) {
        const currentYear = new Date().getFullYear();
        return year === currentYear ? `${year}` : `${year}–${currentYear}`;
      }
      return year || '';
    } else if (mediaType === 'movie') {
      if (year && runtime) {
        const hours = Math.floor(runtime / 60);
        const minutes = runtime % 60;
        const runtimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        return `${year} · ${runtimeStr}`;
      }
      return year || '';
    }
    return year || '';
  }

  /**
   * Generate badges HTML
   */
  function generateBadges(rating, isNew, isAvailable, customBadges) {
    const badges = [...customBadges];
    
    // Add rating badge
    if (rating > 0) {
      badges.push({
        label: `★ ${rating.toFixed(1)}`,
        kind: 'rating',
        color: rating >= 7 ? 'green' : rating >= 5 ? 'yellow' : 'red'
      });
    }
    
    // Add new badge
    if (isNew) {
      badges.push({
        label: 'New',
        kind: 'new',
        color: 'blue'
      });
    }
    
    // Add availability badge
    if (isAvailable) {
      badges.push({
        label: 'Available',
        kind: 'available',
        color: 'green'
      });
    }
    
    return badges.map(badge => `
      <span class="poster-card__badge poster-card__badge--${badge.kind} poster-card__badge--${badge.color || 'default'}" 
            aria-label="${badge.label}">${badge.label}</span>
    `).join('');
  }

  /**
   * Generate quick actions HTML
   */
  function generateQuickActions(quickActions, section) {
    const actions = [];
    
    // Add section-specific quick actions
    if (section === 'watching') {
      actions.push({
        label: 'Continue',
        icon: '▶️',
        action: 'continue'
      });
    } else if (section === 'wishlist') {
      actions.push({
        label: 'Add to Watching',
        icon: '➕',
        action: 'add-to-watching'
      });
    } else if (section === 'watched') {
      actions.push({
        label: 'Rewatch',
        icon: '🔄',
        action: 'rewatch'
      });
    } else {
      // Discover/Search
      actions.push({
        label: 'Add to List',
        icon: '➕',
        action: 'add-to-list'
      });
    }
    
    // Add custom quick actions
    Object.entries(quickActions).forEach(([key, action]) => {
      actions.push({
        label: action.label,
        icon: action.icon,
        action: key
      });
    });
    
    return actions.map(action => `
      <button class="poster-card__quick-action" 
              data-action="${action.action}"
              aria-label="${action.label}"
              title="${action.label}">
        <span class="poster-card__quick-action-icon">${action.icon}</span>
        <span class="poster-card__quick-action-label">${action.label}</span>
      </button>
    `).join('');
  }

  /**
   * Generate three-dot overflow menu HTML
   */
  function generateOverflowMenu(overflowActions) {
    if (overflowActions.length === 0) return '';
    
    return `
      <div class="poster-card__overflow">
        <button class="poster-card__overflow-btn" 
                aria-label="More actions" 
                aria-expanded="false"
                title="More actions">
          <span class="poster-card__overflow-dots">•••</span>
        </button>
        <div class="poster-card__overflow-menu" role="menu" aria-hidden="true">
          ${overflowActions.map(action => `
            <button class="poster-card__overflow-item" 
                    role="menuitem" 
                    data-action="${action.action || action.label.toLowerCase().replace(/\s+/g, '-')}"
                    title="${action.label}">
              ${action.icon ? `<span class="poster-card__overflow-icon">${action.icon}</span>` : ''}
              <span class="poster-card__overflow-label">${action.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Generate progress bar for watching items
   */
  function generateProgressBar(progress, mediaType) {
    if (!progress || Object.keys(progress).length === 0) return '';
    
    if (mediaType === 'tv' && progress.nextEpisode) {
      const daysUntil = progress.daysUntil || 0;
      const progressPercent = Math.max(0, Math.min(100, (7 - daysUntil) / 7 * 100));
      
      return `
        <div class="poster-card__progress">
          <div class="poster-card__progress-bar">
            <div class="poster-card__progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <span class="poster-card__progress-text">
            ${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
          </span>
        </div>
      `;
    } else if (mediaType === 'movie' && progress.watchedPercent) {
      return `
        <div class="poster-card__progress">
          <div class="poster-card__progress-bar">
            <div class="poster-card__progress-fill" style="width: ${progress.watchedPercent}%"></div>
          </div>
          <span class="poster-card__progress-text">${progress.watchedPercent}% watched</span>
        </div>
      `;
    }
    
    return '';
  }

  /**
   * Generate placeholder with title initials
   */
  function generatePlaceholder(title) {
    if (!title) return '🎬';
    
    const words = title.split(' ');
    if (words.length >= 2) {
      return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
    }
    return title[0].toUpperCase();
  }

  /**
   * Setup event listeners for poster card
   */
  function setupPosterCardEventListeners(card, { onOpenDetails, quickActions, overflowActions }) {
    // Poster click for details
    const poster = card.querySelector('.poster-card__poster');
    if (poster && onOpenDetails) {
      poster.addEventListener('click', (e) => {
        e.preventDefault();
        onOpenDetails();
      });
      
      poster.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails();
        }
      });
    }
    
    // Quick actions
    const quickActionBtns = card.querySelectorAll('.poster-card__quick-action');
    quickActionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = btn.dataset.action;
        if (quickActions[action] && quickActions[action].onClick) {
          quickActions[action].onClick();
        }
      });
    });
    
    // Overflow menu
    const overflowBtn = card.querySelector('.poster-card__overflow-btn');
    const overflowMenu = card.querySelector('.poster-card__overflow-menu');
    
    if (overflowBtn && overflowMenu) {
      overflowBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = overflowMenu.getAttribute('aria-hidden') === 'false';
        overflowMenu.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
        overflowBtn.setAttribute('aria-expanded', !isOpen);
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!card.contains(e.target)) {
          overflowMenu.setAttribute('aria-hidden', 'true');
          overflowBtn.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Overflow menu items
      const overflowItems = card.querySelectorAll('.poster-card__overflow-item');
      overflowItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const action = item.dataset.action;
          const actionObj = overflowActions.find(a => 
            (a.action || a.label.toLowerCase().replace(/\s+/g, '-')) === action
          );
          if (actionObj && actionObj.onClick) {
            actionObj.onClick();
          }
          // Close menu
          overflowMenu.setAttribute('aria-hidden', 'true');
          overflowBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  // Export to global scope
  window.PosterCard = PosterCard;
  
  console.log('✅ Poster Card component ready');
})();


