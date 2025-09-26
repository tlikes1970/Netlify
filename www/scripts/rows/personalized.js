/**
 * Process: Personalized Rows Renderer
 * Purpose: Render ghost placeholders and populated preset rows on the home screen
 * Data Source: User row selections from user-settings.js, content from api/content.js
 * Update Path: mountPersonalizedSection function and row rendering logic
 * Dependencies: ROW_PRESETS, getMyRows, Card v2, i18n, existing list actions
 */

(function () {
  'use strict';

  console.log('🎯 Personalized rows module loaded');

  // Defensive guard for Card v2
  const USE_CARD_V2 = !!(window.FLAGS && window.FLAGS.cards_v2 && window.Card);

  /**
   * Generate personalized row title with username and row type
   * @param {number} rowNumber - Row number (1-based)
   * @param {string} rowType - Row type key (e.g., 'anime', 'horror')
   * @returns {string} Formatted title like "Travis' anime suggestions"
   */
  function getPersonalizedRowTitle(rowNumber, rowType = null) {
    // Get username from appData settings
    const username =
      (window.appData && window.appData.settings && window.appData.settings.username) || 'Your';

    // Get row type display name using translation system
    let typeDisplay = '';
    if (rowType) {
      // Map row types to translation keys
      const typeMap = {
        anime: 'your_anime_suggestions',
        horror: 'your_horror_suggestions',
        trending: 'trending',
        staff_picks: 'staff_picks',
        comedy: 'comedy',
        action: 'action',
        drama: 'drama',
        'sci-fi': 'sci-fi',
        romance: 'romance',
        thriller: 'thriller',
      };

      const translationKey = typeMap[rowType] || 'your_suggestions';
      typeDisplay =
        typeof window.t === 'function'
          ? window.t(translationKey)
          : `${username}'s ${rowType} suggestions`;
    } else {
      typeDisplay =
        typeof window.t === 'function' ? window.t('your_suggestions') : `${username}'s suggestions`;
    }

    // Return the translated display name
    return typeDisplay;
  }

  /**
   * Mount the personalized section with ghost or populated rows
   * @param {HTMLElement} sectionEl - Section element to populate
   */
  window.mountPersonalizedSection = function mountPersonalizedSection(sectionEl) {
    console.log('🎯 mountPersonalizedSection called with:', sectionEl);

    if (!sectionEl) {
      console.error('❌ No section element provided for personalized rows');
      return;
    }

    console.log('🎯 Mounting personalized section');

    const body = sectionEl.querySelector('.section__body');
    console.log('🎯 Section body found:', !!body);

    if (!body) {
      console.error('❌ No section body found in element:', sectionEl);
      console.error('❌ Element HTML:', sectionEl.outerHTML);
      return;
    }

    // Clear existing content
    body.innerHTML = '';

    // Get user's row selections
    const selections = window.getMyRows ? window.getMyRows() : [null, null];
    console.log('🎯 User row selections:', selections);

    // Render each row slot
    selections.forEach((selection, index) => {
      if (!selection) {
        // Render ghost row
        body.appendChild(renderGhostRow(index));
      } else {
        // Find the preset and render populated row
        const preset = (window.ROW_PRESETS || []).find((p) => p.key === selection.key);
        if (preset) {
          body.appendChild(renderPresetRow(index, preset));
        } else {
          // Fallback to ghost if preset not found
          body.appendChild(renderGhostRow(index));
        }
      }
    });
  };

  /**
   * Render a ghost placeholder row
   * @param {number} index - Row index (0 or 1)
   * @returns {HTMLElement} Ghost row element
   */
  function renderGhostRow(idx) {
    const ghost = document.createElement('div');
    ghost.className = 'row row--ghost';
    ghost.innerHTML = `
      <div class="row__header"><h4>${getPersonalizedRowTitle(idx + 1)}</h4></div>
      <div class="row__ghost-cards">${Array.from({ length: 8 })
        .map(() => `<div class="ghost-card"></div>`)
        .join('')}</div>
      <button type="button" class="row__cta" data-action="open-settings-my-rows">
        ${window.t ? window.t('rows.configure_cta') : 'Go to Settings to configure'}
      </button>
    `;
    return ghost;
  }

  /**
   * Render a populated preset row
   * @param {number} index - Row index (0 or 1)
   * @param {Object} preset - Preset configuration
   * @returns {HTMLElement} Preset row element
   */
  function renderPresetRow(index, preset) {
    const row = document.createElement('div');
    row.className = 'row row--personalized';
    row.innerHTML = `
      <div class="row__header">
        <h4>
          ${getPersonalizedRowTitle(index + 1, preset.key)}
        </h4>
      </div>
      <div class="row__scroller" data-slot="${index}">
        <div class="row__skeleton">
          ${Array.from({ length: 8 })
            .map(() => '<div class="ghost-card"></div>')
            .join('')}
        </div>
      </div>
    `;

    // Load content asynchronously
    loadPresetContent(row.querySelector('.row__scroller'), preset);

    return row;
  }

  /**
   * Load and render content for a preset row
   * @param {HTMLElement} scrollerEl - Scroller container element
   * @param {Object} preset - Preset configuration
   */
  async function loadPresetContent(scrollerEl, preset) {
    if (!scrollerEl || !preset || !preset.fetch) {
      console.error('❌ Invalid parameters for loadPresetContent');
      return;
    }

    try {
      console.log(`🎯 Loading content for preset: ${preset.key}`);

      // Show skeleton while loading
      scrollerEl.innerHTML = `
        <div class="row__skeleton">
          ${Array.from({ length: 8 })
            .map(() => '<div class="ghost-card"></div>')
            .join('')}
        </div>
      `;

      // Fetch content
      const data = await preset.fetch(1);

      if (!data || !data.results || !Array.isArray(data.results)) {
        console.warn('[personalized] Invalid data from preset; skipping row');
        return;
      }

      // Clear skeleton and render cards
      scrollerEl.innerHTML = '';

      const items = data.results.slice(0, 20); // Limit to 20 items
      console.log(`🎯 Rendering ${items.length} items for ${preset.key}`);

      items.forEach((item) => {
        const cardElement = createCardElement(item);
        if (cardElement) {
          scrollerEl.appendChild(cardElement);
        }
      });
    } catch (error) {
      console.error(`❌ Failed to load content for preset ${preset.key}:`, error);

      // Show error state
      scrollerEl.innerHTML = `
        <div class="row__error">
          ${window.t ? window.t('rows.load_error') : "Couldn't load this row. Please try again."}
        </div>
      `;
    }
  }

  /**
   * Create a card element for an item
   * @param {Object} item - TMDB item data
   * @returns {HTMLElement|null} Card element or null if creation failed
   */
  function createCardElement(item) {
    if (!item) return null;

    try {
      // Use Card v2 if available, otherwise fallback to legacy
      if (USE_CARD_V2) {
        return createCardV2(item);
      } else {
        return createLegacyCard(item);
      }
    } catch (error) {
      console.error('❌ Failed to create card element:', error);
      return null;
    }
  }

  /**
   * Create a Card v2 element
   * @param {Object} item - TMDB item data
   * @returns {HTMLElement} Card v2 element
   */
  function createCardV2(item) {
    // Use Card system
    if (window.Card) {
      return window.Card({
        variant: 'poster',
        id: item.id || item.tmdb_id || item.tmdbId,
        title: item.title || item.name,
        subtitle: item.release_date
          ? `${new Date(item.release_date).getFullYear()} • ${item.media_type === 'tv' ? 'TV Series' : 'Movie'}`
          : item.media_type === 'tv'
            ? 'TV Series'
            : 'Movie',
        posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : null,
        rating: item.vote_average || 0,
        badges: [{ label: 'Personalized', kind: 'status' }],
        onOpenDetails: () => {
          if (window.openTMDBLink) {
            window.openTMDBLink(item.id, item.media_type || 'movie');
          }
        },
      });
    }

    // Fallback to legacy system
    return null;
  }

  /**
   * Add item to list (Card v2 action handler)
   * @param {Object} item - TMDB item data
   * @param {string} list - List name (wishlist, watching, watched)
   */
  function addToList(item, list = 'wishlist') {
    console.log('Adding to list:', item, list);

    // Create a synthetic event for the centralized handler
    const syntheticEvent = {
      target: {
        closest: (selector) => {
          if (selector === '[data-action="add"]') {
            return {
              getAttribute: (attr) => {
                if (attr === 'data-action') return 'add';
                if (attr === 'data-id') return item.id;
                return null;
              },
              dataset: {
                id: item.id,
                list: list,
              },
            };
          }
          return null;
        },
      },
      preventDefault: () => {},
      stopPropagation: () => {},
    };

    // Trigger the centralized handler
    if (typeof window.handleAddClick === 'function') {
      window.handleAddClick(syntheticEvent);
    } else if (typeof window.addToListFromCache === 'function') {
      window.addToListFromCache(item.id, list);
    } else {
      console.warn('No add handler available');
    }
  }

  /**
   * Open more options menu (Card v2 action handler)
   * @param {Object} item - TMDB item data
   */
  function openMore(item) {
    console.log('Opening more options for:', item);

    // Create overflow menu
    const menu = document.createElement('div');
    menu.className = 'overflow-menu';
    menu.innerHTML = `
      <div class="overflow-menu-content">
        <button data-action="add" data-id="${item.id}" data-list="wishlist">Add to Wishlist</button>
        <button data-action="add" data-id="${item.id}" data-list="watching">Add to Watching</button>
        <button data-action="not-interested" data-id="${item.id}">Not Interested</button>
        <button data-action="open" data-id="${item.id}" data-media-type="${item.media_type || 'movie'}">View Details</button>
      </div>
    `;

    // Position and show menu
    menu.style.cssText = `
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 1000;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 8px 0;
      min-width: 150px;
    `;

    // Add to card element
    const cardElement = document.querySelector(`[data-id="${item.id}"]`);
    if (cardElement) {
      cardElement.style.position = 'relative';
      cardElement.appendChild(menu);

      // Close menu when clicking outside
      setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
          if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          }
        });
      }, 0);
    }
  }

  /**
   * Open item details (Card v2 action handler)
   * @param {Object} item - TMDB item data
   */
  function openDetails(item) {
    console.log('Opening details for:', item);

    // Open TMDB link if available
    if (typeof window.openTMDBLink === 'function') {
      window.openTMDBLink(item.id, item.media_type || 'movie');
    } else {
      // Fallback to TMDB website
      const tmdbUrl = `https://www.themoviedb.org/${item.media_type || 'movie'}/${item.id}`;
      window.open(tmdbUrl, '_blank');
    }
  }

  // Expose functions globally
  window.addToList = addToList;
  window.openMore = openMore;
  window.openDetails = openDetails;

  /**
   * Create a legacy card element (fallback)
   * @param {Object} item - TMDB item data
   * @returns {HTMLElement} Legacy card element
   */
  function createLegacyCard(item) {
    const card = document.createElement('div');
    card.className = 'card card--compact';

    const title = item.title || item.name || 'Unknown Title';
    const year = item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '';
    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : '';

    // Generate srcset for responsive images
    const srcset =
      item.poster_path && typeof window.tmdbSrcset === 'function'
        ? window.tmdbSrcset(item.poster_path)
        : '';

    card.innerHTML = `
      <div class="card__poster" onclick="openDetails(${item.id})">
        ${posterUrl ? `<img src="${posterUrl}" ${srcset ? `srcset="${srcset}"` : ''} sizes="(max-width: 480px) 148px, 200px" alt="${title}" loading="lazy">` : '<div class="card__placeholder">📺</div>'}
      </div>
      <div class="card__content">
        <h3 class="card__title" onclick="openDetails(${item.id})">${title}</h3>
        <p class="card__subtitle">${year}</p>
        <div class="card__actions">
          <button class="btn btn-sm btn-primary" data-action="add" data-id="${item.id}" data-list="watching">
            ${window.t ? window.t('common.add') : 'Add'}
          </button>
        </div>
      </div>
    `;

    return card;
  }

  /**
   * Add item to user's list (delegate to existing function)
   * @param {Object} item - Item to add
   */
  function addToList(item) {
    try {
      if (window.addToList) {
        window.addToList(item);
      } else if (window.addToWishlist) {
        window.addToWishlist(item);
      } else {
        console.warn('No addToList function available');
      }
    } catch (error) {
      console.error('❌ Failed to add item to list:', error);
    }
  }

  /**
   * Open more options for item (delegate to existing function)
   * @param {Object} item - Item for more options
   */
  function openMore(item) {
    try {
      if (window.openMore) {
        window.openMore(item);
      } else {
        console.warn('No openMore function available');
      }
    } catch (error) {
      console.error('❌ Failed to open more options:', error);
    }
  }

  /**
   * Open item details (delegate to existing function)
   * @param {Object} item - Item to show details for
   */
  function openDetails(item) {
    try {
      console.log('🔗 Card v2 openDetails called:', item);

      // Extract media type and ID for TMDB link
      const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
      const id = item.id || item.tmdb_id || item.tmdbId;

      if (!id) {
        console.error('❌ No ID found for item:', item);
        return;
      }

      // Use our enhanced openTMDBLink function
      if (typeof window.openTMDBLink === 'function') {
        console.log('🔗 Calling openTMDBLink from Card v2:', { id, mediaType });
        window.openTMDBLink(id, mediaType);
      } else {
        console.warn('⚠️ openTMDBLink function not available, falling back to window.open');
        window.open(`https://www.themoviedb.org/${mediaType}/${id}`, '_blank');
      }
    } catch (error) {
      console.error('❌ Failed to open details:', error);
    }
  }
})();
