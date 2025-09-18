/**
 * Clean Poster Card Component - KISS Design
 * 
 * Process: Clean Poster Card
 * Purpose: Single poster card template used everywhere with KISS design principles
 * Data Source: Item data from TMDB, user lists, search results
 * Update Path: Modify card structure, overflow menus, or mobile behavior
 * Dependencies: CSS variables, mobile detection, PRO features
 */

(function() {
  'use strict';

  console.log('🎴 Clean Poster Card component loaded');

  /**
   * Create clean poster card element following KISS design
   * @param {Object} item - Item data
   * @param {string} section - Section type ('watching', 'wishlist', 'watched', 'discover', 'search')
   * @returns {HTMLElement} Poster card element
   */
  function createCleanPosterCard(item, section = 'discover') {
    if (!item) {
      console.log('❌ createCleanPosterCard: No item provided');
      return null;
    }

    console.log('🎴 createCleanPosterCard called with:', { item, section });

    try {
      const card = document.createElement('article');
      card.className = `clean-poster-card clean-poster-card--${section}`;
      card.dataset.id = item.id || item.tmdb_id || item.tmdbId;
      card.dataset.section = section;
      card.draggable = ['watching', 'wishlist', 'watched'].includes(section); // Enable drag-reorder for list sections

      // Extract data
      const id = item.id || item.tmdb_id || item.tmdbId;
      const title = item.title || item.name || 'Unknown Title';
      const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                   item.first_air_date ? new Date(item.first_air_date).getFullYear() : 
                   item.year || '';
      const mediaType = item.media_type || item.mediaType || (item.first_air_date ? 'TV' : 'Movie');
      
      // Handle poster URL with responsive sizing
      const posterUrl = getPosterUrl(item);
      const srcset = getPosterSrcset(item);

      // Rating (0-10 scale from TMDB, convert to 0-5 for display)
      const rating = item.vote_average ? Math.round(item.vote_average * 10) / 10 : null;
      const userRating = item.userRating || item.rating;

      // Next episode info for watching section
      const nextEpisodeInfo = getNextEpisodeInfo(item, section);
      
      // Availability info
      const availability = item.availability || item.provider || '';
      
      // Check if item has notes
      const hasNotes = checkForNotes(id);

      // Build card HTML following KISS design
      card.innerHTML = `
        <div class="clean-poster-card__poster" role="button" tabindex="0" aria-label="${title}">
          ${posterUrl ? 
            `<img src="${posterUrl}" ${srcset ? `srcset="${srcset}"` : ''} sizes="(max-width: 480px) 120px, 200px" alt="${title} poster" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
            ''
          }
          <div class="clean-poster-card__placeholder" style="display: ${posterUrl ? 'none' : 'flex'};">
            🎬
          </div>
          ${hasNotes ? '<div class="clean-poster-card__note-indicator" title="Has notes">📝</div>' : ''}
        </div>
        <div class="clean-poster-card__content">
          <h3 class="clean-poster-card__title" title="${title}">${title.toUpperCase()}${year ? ` (${year})` : ''}</h3>
          ${rating ? `<div class="clean-poster-card__rating">★${rating}</div>` : ''}
          ${nextEpisodeInfo}
          ${availability ? `<div class="clean-poster-card__availability">${availability}</div>` : ''}
          <div class="clean-poster-card__actions">
            ${generateSectionActions(section)}
            <button class="clean-poster-card__overflow-btn" aria-label="More actions" aria-expanded="false">
              <span class="clean-poster-card__overflow-dots">•••</span>
            </button>
          </div>
        </div>
      `;

      // Add event listeners
      setupCleanCardEventListeners(card, { item, section });

      return card;
    } catch (error) {
      console.error('❌ Failed to create clean poster card:', error);
      return null;
    }
  }

  /**
   * Get poster URL with proper sizing
   * @param {Object} item - Item data
   * @returns {string} Poster URL
   */
  function getPosterUrl(item) {
    if (item.poster_src || item.poster) {
      return item.poster_src || item.poster;
    }
    
    if (item.poster_path) {
      return `https://image.tmdb.org/t/p/w200${item.poster_path}`;
    }
    
    return null;
  }

  /**
   * Get responsive poster srcset
   * @param {Object} item - Item data
   * @returns {string} Srcset string
   */
  function getPosterSrcset(item) {
    if (!item.poster_path) return '';
    
    return `https://image.tmdb.org/t/p/w92${item.poster_path} 92w,
            https://image.tmdb.org/t/p/w154${item.poster_path} 154w,
            https://image.tmdb.org/t/p/w185${item.poster_path} 185w,
            https://image.tmdb.org/t/p/w342${item.poster_path} 342w,
            https://image.tmdb.org/t/p/w500${item.poster_path} 500w`;
  }

  /**
   * Get next episode information for watching section
   * @param {Object} item - Item data
   * @param {string} section - Section type
   * @returns {string} Next episode HTML
   */
  function getNextEpisodeInfo(item, section) {
    if (section !== 'watching') return '';
    
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
        <div class="clean-poster-card__next-episode">
          <span class="clean-poster-card__next-label">NEXT:</span>
          <span class="clean-poster-card__next-details">S${nextEpisode.season_number}E${nextEpisode.episode_number}${formattedDate ? ` (${formattedDate})` : ''}</span>
        </div>
      `;
    }
    
    // Fallback to series status
    if (status) {
      const statusText = getStatusText(status);
      return `
        <div class="clean-poster-card__next-episode">
          <span class="clean-poster-card__next-label">STATUS:</span>
          <span class="clean-poster-card__next-details">${statusText}</span>
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
   * Generate section-specific action buttons
   * @param {string} section - Section type
   * @returns {string} Action buttons HTML
   */
  function generateSectionActions(section) {
    const actions = {
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

    const sectionActions = actions[section] || [];
    
    return sectionActions.map(action => 
      `<button class="clean-poster-card__action-btn btn btn--sm ${action.class}" 
               data-action="move" 
               data-target="${action.target}"
               aria-label="${action.label}">
         ${action.label}
       </button>`
    ).join('');
  }

  /**
   * Check if item has notes
   * @param {string|number} itemId - Item ID
   * @returns {boolean} Has notes
   */
  function checkForNotes(itemId) {
    try {
      const notes = localStorage.getItem(`flicklet-notes-${itemId}`);
      return notes && notes.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Set up event listeners for clean card interactions
   * @param {HTMLElement} card - Card element
   * @param {Object} options - Event handler options
   */
  function setupCleanCardEventListeners(card, { item, section }) {
    // Poster/title click for details
    const poster = card.querySelector('.clean-poster-card__poster');
    const title = card.querySelector('.clean-poster-card__title');
    
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

    // Action buttons
    const actionButtons = card.querySelectorAll('.clean-poster-card__action-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = button.dataset.target;
        handleMoveItem(item, section, target);
      });
    });

    // Overflow menu
    const overflowBtn = card.querySelector('.clean-poster-card__overflow-btn');
    
    if (overflowBtn) {
      overflowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOverflowMenu(card, item, section);
      });
    }

    // Drag and drop for reordering
    setupDragAndDrop(card, item, section);
  }

  /**
   * Set up drag and drop functionality
   * @param {HTMLElement} card - Card element
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  function setupDragAndDrop(card, item, section) {
    // Only enable drag for list sections (not discover/search)
    if (!['watching', 'wishlist', 'watched'].includes(section)) {
      card.draggable = false;
      return;
    }

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', card.outerHTML);
      e.dataTransfer.setData('application/json', JSON.stringify({ item, section }));
      
      card.classList.add('clean-poster-card--dragging');
      
      // Add visual feedback
      const container = card.closest('.clean-poster-cards-grid');
      if (container) {
        container.classList.add('clean-poster-cards-grid--reordering');
      }
    });

    card.addEventListener('dragend', (e) => {
      card.classList.remove('clean-poster-card--dragging');
      
      // Remove visual feedback
      const container = card.closest('.clean-poster-cards-grid');
      if (container) {
        container.classList.remove('clean-poster-cards-grid--reordering');
      }
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const afterElement = getDragAfterElement(card.parentElement, e.clientY);
      if (afterElement == null) {
        card.parentElement.appendChild(card);
      } else {
        card.parentElement.insertBefore(card, afterElement);
      }
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const { item: draggedItem, section: draggedSection } = JSON.parse(data);
        
        // Update the underlying data order
        updateListOrder(card.parentElement, draggedItem, draggedSection);
        
        // Show success feedback
        showToast('success', 'Reordered', 'List order updated');
      }
    });
  }

  /**
   * Get the element after which to insert the dragged element
   * @param {HTMLElement} container - Container element
   * @param {number} y - Y coordinate
   * @returns {HTMLElement|null} Element after which to insert
   */
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.clean-poster-card:not(.clean-poster-card--dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  /**
   * Update the underlying data order after drag-reorder
   * @param {HTMLElement} container - Container element
   * @param {Object} draggedItem - Dragged item data
   * @param {string} section - Section type
   */
  function updateListOrder(container, draggedItem, section) {
    if (!window.appData) return;
    
    const mediaType = draggedItem.media_type || (draggedItem.first_air_date ? 'tv' : 'movie');
    const mediaKey = mediaType === 'tv' ? 'tv' : 'movies';
    
    if (!window.appData[mediaKey] || !window.appData[mediaKey][section]) return;
    
    // Get new order from DOM
    const cards = container.querySelectorAll('.clean-poster-card');
    const newOrder = Array.from(cards).map(card => {
      const itemId = card.dataset.id;
      return window.appData[mediaKey][section].find(item => item.id == itemId);
    }).filter(Boolean);
    
    // Update the data
    window.appData[mediaKey][section] = newOrder;
    
    // Save to localStorage
    if (window.saveAppData) {
      window.saveAppData();
    } else {
      localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
    }
  }

  /**
   * Toggle overflow menu (desktop dropdown or mobile bottom sheet)
   * @param {HTMLElement} card - Card element
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  function toggleOverflowMenu(card, item, section) {
    // Close any existing overflow menus
    closeAllOverflowMenus();
    
    // Check if mobile viewport
    const isMobile = window.innerWidth <= 767;
    
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
   * Create overflow menu element with section-specific actions
   * @param {Object} item - Item data
   * @param {string} section - Section type
   * @returns {HTMLElement} Menu element
   */
  function createOverflowMenu(item, section) {
    const menu = document.createElement('div');
    menu.className = 'clean-overflow-menu';
    
    const menuItems = getSectionMenuItems(item, section);
    
    const menuHTML = menuItems
      .filter(menuItem => menuItem.available)
      .map(menuItem => `
        <button class="clean-overflow-menu__item ${menuItem.destructive ? 'clean-overflow-menu__item--destructive' : ''} ${menuItem.pro ? 'clean-overflow-menu__item--pro' : ''}" 
                data-action="${menuItem.action}">
          <span class="clean-overflow-menu__icon">${menuItem.icon}</span>
          <span class="clean-overflow-menu__label">${menuItem.label}</span>
          ${menuItem.pro ? '<span class="clean-overflow-menu__pro-badge">PRO</span>' : ''}
        </button>
      `).join('');
    
    menu.innerHTML = menuHTML;
    
    // Add event listeners
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const button = e.target.closest('.clean-overflow-menu__item');
      if (button) {
        const action = button.dataset.action;
        handleOverflowAction(action, item, section);
        closeAllOverflowMenus();
      }
    });
    
    return menu;
  }

  /**
   * Get section-specific menu items
   * @param {Object} item - Item data
   * @param {string} section - Section type
   * @returns {Array} Menu items
   */
  function getSectionMenuItems(item, section) {
    const baseItems = [
      { 
        label: 'Details', 
        icon: '🔍', 
        action: 'details',
        available: true
      },
      { 
        label: 'Notes', 
        icon: '📝', 
        action: 'notes',
        available: true
      }
    ];

    const sectionSpecificItems = {
      watching: [
        { 
          label: 'Move to Wishlist', 
          icon: '📋', 
          action: 'move-wishlist',
          available: true
        },
        { 
          label: 'Move to Watched', 
          icon: '✅', 
          action: 'move-watched',
          available: true
        },
        { 
          label: 'Remove from Watching', 
          icon: '🗑️', 
          action: 'remove',
          available: true,
          destructive: true
        },
        { 
          label: 'Episode Guide', 
          icon: '📺', 
          action: 'episodes',
          available: item.media_type === 'tv' || item.first_air_date
        },
        { 
          label: 'Bloopers', 
          icon: '🎬', 
          action: 'bloopers',
          available: true,
          pro: true
        }
      ],
      wishlist: [
        { 
          label: 'Move to Watching', 
          icon: '▶️', 
          action: 'move-watching',
          available: true
        },
        { 
          label: 'Move to Watched', 
          icon: '✅', 
          action: 'move-watched',
          available: true
        },
        { 
          label: 'Remove from Wishlist', 
          icon: '🗑️', 
          action: 'remove',
          available: true,
          destructive: true
        },
        { 
          label: 'Bloopers', 
          icon: '🎬', 
          action: 'bloopers',
          available: true,
          pro: true
        },
        { 
          label: 'Availability Check', 
          icon: '🔍', 
          action: 'availability',
          available: true,
          pro: true
        }
      ],
      watched: [
        { 
          label: 'Move to Watching', 
          icon: '▶️', 
          action: 'move-watching',
          available: true
        },
        { 
          label: 'Move to Wishlist', 
          icon: '📋', 
          action: 'move-wishlist',
          available: true
        },
        { 
          label: 'Remove from Watched', 
          icon: '🗑️', 
          action: 'remove',
          available: true,
          destructive: true
        },
        { 
          label: 'Bloopers', 
          icon: '🎬', 
          action: 'bloopers',
          available: true,
          pro: true
        },
        { 
          label: 'Rate & Export History', 
          icon: '📊', 
          action: 'rate-export',
          available: true,
          pro: true
        }
      ],
      discover: [
        { 
          label: 'Add to Watching', 
          icon: '▶️', 
          action: 'add-watching',
          available: true
        },
        { 
          label: 'Add to Wishlist', 
          icon: '📋', 
          action: 'add-wishlist',
          available: true
        },
        { 
          label: 'Not Interested', 
          icon: '❌', 
          action: 'not-interested',
          available: true
        },
        { 
          label: 'Bloopers', 
          icon: '🎬', 
          action: 'bloopers',
          available: true,
          pro: true
        }
      ],
      search: [
        { 
          label: 'Add to Watching', 
          icon: '▶️', 
          action: 'add-watching',
          available: true
        },
        { 
          label: 'Add to Wishlist', 
          icon: '📋', 
          action: 'add-wishlist',
          available: true
        },
        { 
          label: 'Not Interested', 
          icon: '❌', 
          action: 'not-interested',
          available: true
        }
      ]
    };

    return [...baseItems, ...(sectionSpecificItems[section] || [])];
  }

  /**
   * Create mobile bottom sheet
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  function createMobileBottomSheet(item, section) {
    const bottomSheet = document.createElement('div');
    bottomSheet.className = 'clean-mobile-bottom-sheet';
    
    const menuItems = getSectionMenuItems(item, section);
    const availableItems = menuItems.filter(item => item.available);
    
    bottomSheet.innerHTML = `
      <div class="clean-mobile-bottom-sheet__backdrop"></div>
      <div class="clean-mobile-bottom-sheet__content">
        <div class="clean-mobile-bottom-sheet__handle"></div>
        <div class="clean-mobile-bottom-sheet__header">
          <h3 class="clean-mobile-bottom-sheet__title">${item.title || item.name}</h3>
          <button class="clean-mobile-bottom-sheet__close">×</button>
        </div>
        <div class="clean-mobile-bottom-sheet__body">
          ${availableItems.map(menuItem => `
            <button class="clean-mobile-bottom-sheet__item ${menuItem.destructive ? 'clean-mobile-bottom-sheet__item--destructive' : ''} ${menuItem.pro ? 'clean-mobile-bottom-sheet__item--pro' : ''}" 
                    data-action="${menuItem.action}">
              <span class="clean-mobile-bottom-sheet__icon">${menuItem.icon}</span>
              <span class="clean-mobile-bottom-sheet__label">${menuItem.label}</span>
              ${menuItem.pro ? '<span class="clean-mobile-bottom-sheet__pro-badge">PRO</span>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(bottomSheet);
    
    // Add event listeners
    const backdrop = bottomSheet.querySelector('.clean-mobile-bottom-sheet__backdrop');
    const closeBtn = bottomSheet.querySelector('.clean-mobile-bottom-sheet__close');
    const items = bottomSheet.querySelectorAll('.clean-mobile-bottom-sheet__item');
    
    const closeBottomSheet = () => {
      bottomSheet.classList.add('clean-mobile-bottom-sheet--closing');
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
      bottomSheet.classList.add('clean-mobile-bottom-sheet--visible');
    }, 10);
  }

  /**
   * Handle overflow menu action
   * @param {string} action - Action type
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  function handleOverflowAction(action, item, section) {
    switch (action) {
      case 'details':
        openDetails(item);
        break;
      case 'notes':
        openNotesModal(item);
        break;
      case 'episodes':
        openEpisodeGuideModal(item);
        break;
      case 'bloopers':
        openBloopersModal(item);
        break;
      case 'availability':
        openAvailabilityModal(item);
        break;
      case 'rate-export':
        openRateExportModal(item);
        break;
      case 'not-interested':
        addToNotInterested(item);
        break;
      case 'move-watching':
        handleMoveItem(item, section, 'watching');
        break;
      case 'move-wishlist':
        handleMoveItem(item, section, 'wishlist');
        break;
      case 'move-watched':
        handleMoveItem(item, section, 'watched');
        break;
      case 'add-watching':
        handleAddItem(item, 'watching');
        break;
      case 'add-wishlist':
        handleAddItem(item, 'wishlist');
        break;
      case 'remove':
        confirmRemoveItem(item, section);
        break;
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
   * Handle adding an item to a list
   * @param {Object} item - Item data
   * @param {string} toSection - Target section
   */
  function handleAddItem(item, toSection) {
    try {
      console.log(`➕ Adding item to ${toSection}:`, item.title);
      
      // Add to store
      addItemToStore(item, toSection);
      
      // Update UI if target section is visible
      const targetContainer = document.getElementById(`${toSection}List`);
      if (targetContainer && targetContainer.closest('.tab-section').style.display !== 'none') {
        const newCard = createCleanPosterCard(item, toSection);
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
      
      // Update tab counts
      updateTabCounts();
      
      // Show success toast
      showToast('success', `Added to ${toSection}`, `${item.title || item.name} added successfully`);
      
    } catch (error) {
      console.error('❌ Failed to add item:', error);
      showToast('error', 'Add Failed', 'Failed to add item. Please try again.');
    }
  }

  /**
   * Add item to store
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  function addItemToStore(item, section) {
    if (!window.appData) {
      window.appData = { tv: { watching: [], wishlist: [], watched: [] }, movies: { watching: [], wishlist: [], watched: [] } };
    }

    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const mediaKey = mediaType === 'tv' ? 'tv' : 'movies';
    
    // Ensure media structure exists
    if (!window.appData[mediaKey]) {
      window.appData[mediaKey] = { watching: [], wishlist: [], watched: [] };
    }
    
    // Add to target list
    const targetList = window.appData[mediaKey][section] || [];
    targetList.push(item);
    
    // Save to localStorage
    if (window.saveAppData) {
      window.saveAppData();
    } else {
      localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
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
      const newCard = createCleanPosterCard(item, toSection);
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
      const card = createCleanPosterCard(item, fromSection);
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
   * Close all overflow menus
   */
  function closeAllOverflowMenus() {
    const menus = document.querySelectorAll('.clean-overflow-menu');
    menus.forEach(menu => menu.remove());
    
    const bottomSheets = document.querySelectorAll('.clean-mobile-bottom-sheet');
    bottomSheets.forEach(sheet => sheet.remove());
    
    const cards = document.querySelectorAll('.clean-poster-card[data-overflow-open="true"]');
    cards.forEach(card => {
      card.dataset.overflowOpen = 'false';
    });
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
   * Open bloopers modal (PRO feature)
   * @param {Object} item - Item data
   */
  function openBloopersModal(item) {
    if (window.FLAGS?.proEnabled) {
      if (window.openBloopersModal) {
        window.openBloopersModal(item);
      } else {
        console.log('Bloopers modal not implemented yet for:', item.title);
      }
    } else {
      showProTeaser('Bloopers and Behind the Scenes content');
    }
  }

  /**
   * Open availability modal (PRO feature)
   * @param {Object} item - Item data
   */
  function openAvailabilityModal(item) {
    if (window.FLAGS?.proEnabled) {
      if (window.openAvailabilityModal) {
        window.openAvailabilityModal(item);
      } else {
        console.log('Availability modal not implemented yet for:', item.title);
      }
    } else {
      showProTeaser('Advanced availability checking');
    }
  }

  /**
   * Open rate & export modal (PRO feature)
   * @param {Object} item - Item data
   */
  function openRateExportModal(item) {
    if (window.FLAGS?.proEnabled) {
      if (window.openRateExportModal) {
        window.openRateExportModal(item);
      } else {
        console.log('Rate & export modal not implemented yet for:', item.title);
      }
    } else {
      showProTeaser('Rate & export history features');
    }
  }

  /**
   * Add item to not interested list
   * @param {Object} item - Item data
   */
  function addToNotInterested(item) {
    try {
      const notInterested = JSON.parse(localStorage.getItem('flicklet-not-interested') || '[]');
      const exists = notInterested.some(notItem => 
        notItem.id === item.id && notItem.media_type === item.media_type
      );
      
      if (!exists) {
        notInterested.push({
          id: item.id,
          title: item.title || item.name,
          media_type: item.media_type,
          added_date: new Date().toISOString()
        });
        
        localStorage.setItem('flicklet-not-interested', JSON.stringify(notInterested));
        showToast('success', 'Added to Not Interested', `${item.title || item.name} won't appear in recommendations`);
      }
    } catch (error) {
      console.error('Failed to add to not interested:', error);
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
   * Show PRO teaser
   * @param {string} feature - Feature name
   */
  function showProTeaser(feature) {
    if (window.openProTeaserModal) {
      window.openProTeaserModal();
    } else {
      showToast('info', 'PRO Feature', `${feature} is available with Flicklet PRO`);
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

  // Expose createCleanPosterCard globally
  window.createCleanPosterCard = createCleanPosterCard;
  
  // Also expose as createPosterCard for backward compatibility
  window.createPosterCard = createCleanPosterCard;
  
  console.log('✅ Clean Poster Card component ready');

})();

