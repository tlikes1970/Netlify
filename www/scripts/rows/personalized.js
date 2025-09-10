/**
 * Process: Personalized Rows Renderer
 * Purpose: Render ghost placeholders and populated preset rows on the home screen
 * Data Source: User row selections from user-settings.js, content from api/content.js
 * Update Path: mountPersonalizedSection function and row rendering logic
 * Dependencies: ROW_PRESETS, getMyRows, Card v2, i18n, existing list actions
 */

(function() {
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
    const username = (window.appData && window.appData.settings && window.appData.settings.username) || 'Your';
    
    // Get row type display name
    let typeDisplay = '';
    if (rowType) {
      // Map row types to display names
      const typeMap = {
        'anime': 'anime',
        'horror': 'horror', 
        'trending': 'trending',
        'staff_picks': 'staff picks',
        'comedy': 'comedy',
        'action': 'action',
        'drama': 'drama',
        'sci-fi': 'sci-fi',
        'romance': 'romance',
        'thriller': 'thriller'
      };
      typeDisplay = typeMap[rowType] || rowType;
    } else {
      typeDisplay = 'suggestions';
    }
    
    // Format: "Username's type suggestions" or "Username's suggestions" for ghost rows
    return `${username}'s ${typeDisplay} suggestions`;
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
        const preset = (window.ROW_PRESETS || []).find(p => p.key === selection.key);
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
  function renderGhostRow(idx){
    const ghost = document.createElement('div');
    ghost.className = 'row row--ghost';
    ghost.innerHTML = `
      <div class="row__header"><h4>${getPersonalizedRowTitle(idx+1)}</h4></div>
      <div class="row__ghost-cards">${Array.from({length:8}).map(()=>`<div class="ghost-card"></div>`).join('')}</div>
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
          ${Array.from({length: 8}).map(() => '<div class="ghost-card"></div>').join('')}
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
          ${Array.from({length: 8}).map(() => '<div class="ghost-card"></div>').join('')}
        </div>
      `;

      // Fetch content
      const data = await preset.fetch(1);
      
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid data structure returned from preset');
      }

      // Clear skeleton and render cards
      scrollerEl.innerHTML = '';
      
      const items = data.results.slice(0, 20); // Limit to 20 items
      console.log(`🎯 Rendering ${items.length} items for ${preset.key}`);

      items.forEach(item => {
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
          ${window.t ? window.t('rows.load_error') : 'Couldn\'t load this row. Please try again.'}
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
    const title = item.title || item.name || 'Unknown Title';
    const year = item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '';
    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : '';
    const rating = item.vote_average || 0;

    return window.Card({
      variant: 'compact',
      id: item.id,
      posterUrl: posterUrl,
      title: title,
      subtitle: year,
      rating: rating,
      badges: [],
      primaryAction: {
        label: window.t ? window.t('common.add') : 'Add',
        onClick: () => addToList(item)
      },
      overflowActions: [{
        label: window.t ? window.t('common.more') : 'More',
        onClick: () => openMore(item)
      }],
      onOpenDetails: () => openDetails(item)
    });
  }

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
    
    card.innerHTML = `
      <div class="card__poster" onclick="openDetails(${item.id})">
        ${posterUrl ? `<img src="${posterUrl}" alt="${title}" loading="lazy">` : '<div class="card__placeholder">📺</div>'}
      </div>
      <div class="card__content">
        <h3 class="card__title" onclick="openDetails(${item.id})">${title}</h3>
        <p class="card__subtitle">${year}</p>
        <div class="card__actions">
          <button class="btn btn-sm btn-primary" onclick="addToList(${item.id})">
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
      if (window.openDetails) {
        window.openDetails(item);
      } else if (window.showDetails) {
        window.showDetails(item);
      } else {
        console.warn('No openDetails function available');
      }
    } catch (error) {
      console.error('❌ Failed to open details:', error);
    }
  }

})();
