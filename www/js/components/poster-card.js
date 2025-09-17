/**
 * Poster Card Component - Unified Card Template
 * 
 * Process: Poster Card Component
 * Purpose: Unified poster card template for all sections (Watching, Wishlist, Watched, Discover, Search)
 * Data Source: Item data from various sources (TMDB, user lists, search)
 * Update Path: Card component API and CSS classes
 * Dependencies: i18n.js, cards.css
 */

(function() {
  'use strict';

  console.log('🎴 Poster Card component loaded');

  /**
   * Create a unified poster card element
   * @param {Object} item - Item data
   * @param {string} section - Section type ('watching', 'wishlist', 'watched', 'discover', 'search')
   * @returns {HTMLElement} Poster card element
   */
  function createPosterCard(item, section = 'discover') {
    if (!item) return null;

    try {
      const card = document.createElement('article');
      card.className = `poster-card poster-card--${section}`;
      card.dataset.id = item.id || item.tmdb_id || item.tmdbId;
      card.dataset.section = section;

      // Extract data
      const id = item.id || item.tmdb_id || item.tmdbId;
      const title = item.title || item.name || 'Unknown Title';
      const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                   item.first_air_date ? new Date(item.first_air_date).getFullYear() : 
                   item.year || '';
      const mediaType = item.media_type || item.mediaType || (item.first_air_date ? 'TV' : 'Movie');
      
      // Handle poster URL
      const posterUrl = window.getPosterUrl ? window.getPosterUrl(item, 'w342') : 
        (item.poster_src || item.poster || (item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null));

      // Generate srcset for responsive images
      const srcset = item.poster_path && typeof window.tmdbSrcset === 'function' ? 
        window.tmdbSrcset(item.poster_path) : 
        '';

      // Rating (0-5 scale)
      const rating = item.userRating || item.rating || 
                    (item.vote_average ? item.vote_average / 2 : null);

      // Availability text
      const availability = item.availability || item.provider || '';

      // Generate stars HTML
      const stars = generateStars(rating);

      // Build card HTML
      card.innerHTML = `
        <div class="poster-card__poster" role="button" tabindex="0" aria-label="${title}">
          ${posterUrl ? 
            `<img src="${posterUrl}" ${srcset ? `srcset="${srcset}"` : ''} sizes="(max-width: 480px) 148px, 200px" alt="${title} poster" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
            ''
          }
          <div class="poster-card__placeholder" style="display: ${posterUrl ? 'none' : 'flex'};">
            🎬
          </div>
        </div>
        <div class="poster-card__content">
          <h3 class="poster-card__title">${title.toUpperCase()}</h3>
          <div class="poster-card__meta">${year ? `(${year})` : ''} ${mediaType}</div>
          ${stars ? `<div class="poster-card__rating" aria-label="Rating ${rating}/5">${stars}</div>` : ''}
          ${section === 'watching' ? getNextEpisodeStatus(item) : ''}
          ${availability ? `<div class="poster-card__availability">${availability}</div>` : ''}
          <div class="poster-card__actions">
            <div class="poster-card__move-buttons">
              ${generateMoveButtons(section)}
            </div>
            <button class="poster-card__overflow-btn" aria-label="More actions" aria-expanded="false">
              <span class="poster-card__overflow-dots">•••</span>
            </button>
          </div>
        </div>
      `;

      // Add event listeners
      setupPosterCardEventListeners(card, { item, section });

      return card;
    } catch (error) {
      console.error('❌ Failed to create poster card:', error);
      return null;
    }
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
    
    return `<span class="poster-card__stars">${stars}</span>`;
  }

  /**
   * Get next episode status for watching items
   * @param {Object} item - Item data
   * @returns {string} Next episode status HTML
   */
  function getNextEpisodeStatus(item) {
    if (!item) return '';
    
    // Check if we have next episode data
    const nextEpisode = item.next_episode || item.nextEpisode;
    const status = item.status || item.series_status;
    
    if (nextEpisode && nextEpisode.episode_number && nextEpisode.season_number) {
      const episodeDate = nextEpisode.air_date ? new Date(nextEpisode.air_date) : null;
      const formattedDate = episodeDate ? episodeDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }) : '';
      
      return `
        <div class="poster-card__next-episode">
          <span class="poster-card__next-label">NEXT:</span>
          <span class="poster-card__next-details">S${nextEpisode.season_number}E${nextEpisode.episode_number}${formattedDate ? ` (${formattedDate})` : ''}</span>
        </div>
      `;
    }
    
    // Fallback to series status
    if (status) {
      const statusText = getStatusText(status);
      return `
        <div class="poster-card__next-episode">
          <span class="poster-card__next-label">STATUS:</span>
          <span class="poster-card__next-details">${statusText}</span>
        </div>
      `;
    }
    
    return '';
  }

  /**
   * Get human-readable status text
   * @param {string} status - Series status
   * @returns {string} Status text
   */
  function getStatusText(status) {
    const statusMap = {
      'returning_series': 'UPCOMING',
      'in_production': 'UPCOMING',
      'planned': 'UPCOMING',
      'ended': 'ENDED',
      'canceled': 'ENDED',
      'pilot': 'UPCOMING'
    };
    
    return statusMap[status] || 'UPCOMING';
  }

  /**
   * Generate move buttons based on section
   * @param {string} section - Section type
   * @returns {string} Move buttons HTML
   */
  function generateMoveButtons(section) {
    const buttons = {
      watching: [
        { label: 'Move to Wishlist', target: 'wishlist', class: 'btn--secondary' },
        { label: 'Move to Watched', target: 'watched', class: 'btn--success' }
      ],
      wishlist: [
        { label: 'Move to Watching', target: 'watching', class: 'btn--primary' },
        { label: 'Move to Watched', target: 'watched', class: 'btn--success' }
      ],
      watched: [
        { label: 'Move to Watching', target: 'watching', class: 'btn--primary' },
        { label: 'Move to Wishlist', target: 'wishlist', class: 'btn--secondary' }
      ],
      discover: [
        { label: 'Add to Watching', target: 'watching', class: 'btn--primary' },
        { label: 'Add to Wishlist', target: 'wishlist', class: 'btn--secondary' }
      ],
      search: [
        { label: 'Add to Watching', target: 'watching', class: 'btn--primary' },
        { label: 'Add to Wishlist', target: 'wishlist', class: 'btn--secondary' }
      ]
    };

    const sectionButtons = buttons[section] || [];
    
    return sectionButtons.map(button => 
      `<button class="btn btn--sm ${button.class} poster-card__move-btn" 
               data-action="move" 
               data-target="${button.target}"
               aria-label="${button.label}">
         ${button.label}
       </button>`
    ).join('');
  }

  /**
   * Set up event listeners for poster card interactions
   * @param {HTMLElement} card - Card element
   * @param {Object} options - Event handler options
   */
  function setupPosterCardEventListeners(card, { item, section }) {
    // Poster/title click for details
    const poster = card.querySelector('.poster-card__poster');
    const title = card.querySelector('.poster-card__title');
    
    if (poster) {
      poster.addEventListener('click', () => openDetails(item));
      poster.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetails(item);
        }
      });
    }

    if (title) {
      title.addEventListener('click', () => openDetails(item));
    }

    // Move buttons
    const moveButtons = card.querySelectorAll('.poster-card__move-btn');
    moveButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = button.dataset.target;
        handleMoveItem(item, section, target);
      });
    });

    // Overflow menu
    const overflowBtn = card.querySelector('.poster-card__overflow-btn');
    
    if (overflowBtn) {
      overflowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOverflowMenu(card, item, section);
      });
    }
  }

  /**
   * Open item details
   * @param {Object} item - Item data
   */
  function openDetails(item) {
    console.log('Open details for:', item.title);
    if (window.openItemDetails) {
      window.openItemDetails(Number(item.id || item.tmdb_id || item.tmdbId));
    }
  }

  /**
   * Handle moving an item between lists
   * @param {Object} item - Item data
   * @param {string} fromSection - Current section
   * @param {string} toSection - Target section
   */
  function handleMoveItem(item, fromSection, toSection) {
    try {
      console.log(`🔄 Moving item from ${fromSection} to ${toSection}:`, item.title);
      
      // Update UI immediately (optimistic)
      updateUIOptimistically(item, fromSection, toSection);
      
      // Update underlying store
      updateItemInStore(item, fromSection, toSection);
      
      // Update tab counts
      updateTabCounts();
      
      // Show success toast
      showToast('success', `Moved to ${toSection}`, `${item.title || item.name} moved successfully`);
      
    } catch (error) {
      console.error('❌ Failed to move item:', error);
      
      // Roll back UI changes
      rollbackUIChanges(item, fromSection, toSection);
      
      // Show error toast
      showToast('error', 'Move Failed', 'Failed to move item. Please try again.');
    }
  }

  /**
   * Update UI optimistically (immediate visual feedback)
   * @param {Object} item - Item data
   * @param {string} fromSection - Current section
   * @param {string} toSection - Target section
   */
  function updateUIOptimistically(item, fromSection, toSection) {
    // Remove from current section
    const currentContainer = document.getElementById(`${fromSection}List`);
    if (currentContainer) {
      const card = currentContainer.querySelector(`[data-id="${item.id}"]`);
      if (card) {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          card.remove();
        }, 300);
      }
    }
    
    // Add to target section if it's visible
    const targetContainer = document.getElementById(`${toSection}List`);
    if (targetContainer && targetContainer.closest('.tab-section').style.display !== 'none') {
      const newCard = createPosterCard(item, toSection);
      if (newCard) {
        newCard.style.opacity = '0';
        newCard.style.transform = 'scale(0.8)';
        targetContainer.appendChild(newCard);
        
        // Animate in
        setTimeout(() => {
          newCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          newCard.style.opacity = '1';
          newCard.style.transform = 'scale(1)';
        }, 50);
      }
    }
  }

  /**
   * Update item in the underlying store
   * @param {Object} item - Item data
   * @param {string} fromSection - Current section
   * @param {string} toSection - Target section
   */
  function updateItemInStore(item, fromSection, toSection) {
    if (!window.appData) {
      throw new Error('App data not available');
    }

    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const mediaKey = mediaType === 'tv' ? 'tv' : 'movies';
    
    // Ensure media structure exists
    if (!window.appData[mediaKey]) {
      window.appData[mediaKey] = { watching: [], wishlist: [], watched: [] };
    }
    
    // Remove from source list
    const sourceList = window.appData[mediaKey][fromSection] || [];
    const sourceIndex = sourceList.findIndex(i => i.id === item.id);
    if (sourceIndex !== -1) {
      sourceList.splice(sourceIndex, 1);
    }
    
    // Add to target list
    const targetList = window.appData[mediaKey][toSection] || [];
    targetList.push(item);
    
    // Save to localStorage
    if (window.saveAppData) {
      window.saveAppData();
    } else {
      localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
    }
  }

  /**
   * Update tab counts
   */
  function updateTabCounts() {
    if (typeof window.updateTabCounts === 'function') {
      window.updateTabCounts();
    }
  }

  /**
   * Roll back UI changes on error
   * @param {Object} item - Item data
   * @param {string} fromSection - Current section
   * @param {string} toSection - Target section
   */
  function rollbackUIChanges(item, fromSection, toSection) {
    // Re-add to source section
    const sourceContainer = document.getElementById(`${fromSection}List`);
    if (sourceContainer) {
      const card = createPosterCard(item, fromSection);
      if (card) {
        sourceContainer.appendChild(card);
      }
    }
    
    // Remove from target section
    const targetContainer = document.getElementById(`${toSection}List`);
    if (targetContainer) {
      const card = targetContainer.querySelector(`[data-id="${item.id}"]`);
      if (card) {
        card.remove();
      }
    }
  }

  /**
   * Show toast notification
   * @param {string} type - Toast type (success, error, info)
   * @param {string} title - Toast title
   * @param {string} message - Toast message
   */
  function showToast(type, title, message) {
    if (window.showToast) {
      window.showToast(type, title, message);
    } else {
      console.log(`Toast [${type}]: ${title} - ${message}`);
    }
  }

  /**
   * Toggle overflow menu
   * @param {HTMLElement} card - Card element
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  function toggleOverflowMenu(card, item, section) {
    // Close any existing overflow menus
    closeAllOverflowMenus();
    
    // Check if mobile viewport
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Use bottom sheet on mobile
      createMobileBottomSheet(item, section);
    } else {
      // Use dropdown menu on desktop
      const menu = createOverflowMenu(item, section);
      
      // Position menu relative to card
      const cardRect = card.getBoundingClientRect();
      menu.style.position = 'absolute';
      menu.style.top = `${cardRect.bottom + 5}px`;
      menu.style.left = `${cardRect.right - 120}px`;
      menu.style.zIndex = '1000';
      
      // Add to document
      document.body.appendChild(menu);
    }
    
    // Mark as open
    card.dataset.overflowOpen = 'true';
    
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeAllOverflowMenus, { once: true });
    }, 0);
  }

  /**
   * Create overflow menu element
   * @param {Object} item - Item data
   * @param {string} section - Section type
   * @returns {HTMLElement} Menu element
   */
  function createOverflowMenu(item, section) {
    const menu = document.createElement('div');
    menu.className = 'overflow-menu';
    
    const menuItems = [
      { 
        label: 'Notes', 
        icon: '📝', 
        action: 'notes',
        available: true
      },
      { 
        label: 'Episode Guide', 
        icon: '📺', 
        action: 'episodes',
        available: item.media_type === 'tv' || item.first_air_date
      },
      { 
        label: 'Remove', 
        icon: '🗑️', 
        action: 'remove',
        available: true,
        destructive: true
      },
      { 
        label: 'PRO Features', 
        icon: '⭐', 
        action: 'pro',
        available: true,
        pro: true
      }
    ];
    
    const menuHTML = menuItems
      .filter(item => item.available)
      .map(menuItem => `
        <button class="overflow-menu__item ${menuItem.destructive ? 'overflow-menu__item--destructive' : ''} ${menuItem.pro ? 'overflow-menu__item--pro' : ''}" 
                data-action="${menuItem.action}">
          <span class="overflow-menu__icon">${menuItem.icon}</span>
          <span class="overflow-menu__label">${menuItem.label}</span>
          ${menuItem.pro ? '<span class="overflow-menu__pro-badge">PRO</span>' : ''}
        </button>
      `).join('');
    
    menu.innerHTML = menuHTML;
    
    // Add event listeners
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const button = e.target.closest('.overflow-menu__item');
      if (button) {
        const action = button.dataset.action;
        handleOverflowAction(action, item, section);
        closeAllOverflowMenus();
      }
    });
    
    return menu;
  }

  /**
   * Handle overflow menu action
   * @param {string} action - Action type
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  function handleOverflowAction(action, item, section) {
    switch (action) {
      case 'notes':
        openNotesModal(item);
        break;
      case 'episodes':
        openEpisodeGuideModal(item);
        break;
      case 'remove':
        confirmRemoveItem(item, section);
        break;
      case 'pro':
        openProTeaserModal();
        break;
    }
  }

  /**
   * Create mobile bottom sheet
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  function createMobileBottomSheet(item, section) {
    const bottomSheet = document.createElement('div');
    bottomSheet.className = 'mobile-bottom-sheet';
    
    const menuItems = [
      { 
        label: 'Notes', 
        icon: '📝', 
        action: 'notes',
        available: true
      },
      { 
        label: 'Episode Guide', 
        icon: '📺', 
        action: 'episodes',
        available: item.media_type === 'tv' || item.first_air_date
      },
      { 
        label: 'Remove', 
        icon: '🗑️', 
        action: 'remove',
        available: true,
        destructive: true
      },
      { 
        label: 'PRO Features', 
        icon: '⭐', 
        action: 'pro',
        available: true,
        pro: true
      }
    ];
    
    const availableItems = menuItems.filter(item => item.available);
    
    bottomSheet.innerHTML = `
      <div class="mobile-bottom-sheet__backdrop"></div>
      <div class="mobile-bottom-sheet__content">
        <div class="mobile-bottom-sheet__handle"></div>
        <div class="mobile-bottom-sheet__header">
          <h3 class="mobile-bottom-sheet__title">${item.title || item.name}</h3>
          <button class="mobile-bottom-sheet__close">×</button>
        </div>
        <div class="mobile-bottom-sheet__body">
          ${availableItems.map(menuItem => `
            <button class="mobile-bottom-sheet__item ${menuItem.destructive ? 'mobile-bottom-sheet__item--destructive' : ''} ${menuItem.pro ? 'mobile-bottom-sheet__item--pro' : ''}" 
                    data-action="${menuItem.action}">
              <span class="mobile-bottom-sheet__icon">${menuItem.icon}</span>
              <span class="mobile-bottom-sheet__label">${menuItem.label}</span>
              ${menuItem.pro ? '<span class="mobile-bottom-sheet__pro-badge">PRO</span>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(bottomSheet);
    
    // Add event listeners
    const backdrop = bottomSheet.querySelector('.mobile-bottom-sheet__backdrop');
    const closeBtn = bottomSheet.querySelector('.mobile-bottom-sheet__close');
    const items = bottomSheet.querySelectorAll('.mobile-bottom-sheet__item');
    
    const closeBottomSheet = () => {
      bottomSheet.classList.add('mobile-bottom-sheet--closing');
      setTimeout(() => {
        bottomSheet.remove();
      }, 300);
    };
    
    backdrop.addEventListener('click', closeBottomSheet);
    closeBtn.addEventListener('click', closeBottomSheet);
    
    items.forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        handleOverflowAction(action, item, section);
        closeBottomSheet();
      });
    });
    
    // Animate in
    setTimeout(() => {
      bottomSheet.classList.add('mobile-bottom-sheet--visible');
    }, 10);
  }

  /**
   * Close all overflow menus
   */
  function closeAllOverflowMenus() {
    const menus = document.querySelectorAll('.overflow-menu');
    menus.forEach(menu => menu.remove());
    
    const bottomSheets = document.querySelectorAll('.mobile-bottom-sheet');
    bottomSheets.forEach(sheet => sheet.remove());
    
    const cards = document.querySelectorAll('.poster-card[data-overflow-open="true"]');
    cards.forEach(card => {
      card.dataset.overflowOpen = 'false';
    });
  }

  /**
   * Open notes modal
   * @param {Object} item - Item data
   */
  function openNotesModal(item) {
    if (window.openNotesModal) {
      window.openNotesModal(item);
    } else {
      console.log('Notes modal not implemented yet for:', item.title);
    }
  }

  /**
   * Open episode guide modal
   * @param {Object} item - Item data
   */
  function openEpisodeGuideModal(item) {
    if (window.openEpisodeGuideModal) {
      window.openEpisodeGuideModal(item);
    } else {
      console.log('Episode guide modal not implemented yet for:', item.title);
    }
  }

  /**
   * Confirm remove item
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  function confirmRemoveItem(item, section) {
    if (window.confirmRemoveItem) {
      window.confirmRemoveItem(item, section);
    } else {
      console.log('Remove confirmation not implemented yet for:', item.title);
    }
  }

  /**
   * Open PRO teaser modal
   */
  function openProTeaserModal() {
    if (window.openProTeaserModal) {
      window.openProTeaserModal();
    } else {
      console.log('PRO teaser modal not implemented yet');
    }
  }

  // Expose createPosterCard globally
  window.createPosterCard = createPosterCard;
  
  console.log('✅ Poster Card component ready');

})();
