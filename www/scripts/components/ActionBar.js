/**
 * Action Bar Component - Unified Action System
 *
 * Process: Action Bar Component
 * Purpose: Unified action bar with primary/secondary actions and mobile overflow menu
 * Data Source: Item data and current list context
 * Update Path: Modify action configurations in getActionConfig function
 * Dependencies: i18n.js, components.css, card rendering system
 */

(function () {
  'use strict';

  console.log('🎯 Action Bar component loaded');

  /**
   * Get action configuration based on list type
   * @param {string} listType - Current list type (watching, wishlist, watched)
   * @param {Object} item - Item data
   * @returns {Object} Action configuration with primary and secondary actions
   */
  function getActionConfig(listType, item) {
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const isEpisodeTrackingEnabled = () => {
      return localStorage.getItem('flicklet:episodeTracking:enabled') === 'true';
    };

    const baseActions = {
      // Common actions available in all lists
      remove: {
        label: t('remove'),
        icon: '🗑️',
        action: 'remove',
        className: 'btn danger',
        priority: 'always', // Always available but can drop to overflow
      },
      notes: {
        label: t('notes_tags'),
        icon: '✎',
        action: 'notes',
        className: 'btn secondary',
        priority: 'secondary',
      },
    };

    // List-specific primary actions
    const listConfigs = {
      wishlist: {
        primary: [
          {
            label: t('currently_watching'),
            icon: '▶️',
            action: 'move',
            list: 'watching',
            className: 'btn primary',
            priority: 'primary',
          },
        ],
        secondary: [baseActions.remove, baseActions.notes],
      },
      watching: {
        primary: [
          {
            label: t('already_watched'),
            icon: '✅',
            action: 'move',
            list: 'watched',
            className: 'btn primary',
            priority: 'primary',
          },
        ],
        secondary: [baseActions.notes, baseActions.remove],
      },
      watched: {
        primary: [
          {
            label: t('rate'),
            icon: '⭐',
            action: 'rate',
            className: 'btn primary',
            priority: 'primary',
          },
        ],
        secondary: [baseActions.notes, baseActions.remove],
      },
    };

    // Add TV-specific actions
    if (mediaType === 'tv' && isEpisodeTrackingEnabled()) {
      const trackEpisodes = {
        label: t('track_episodes'),
        icon: '📺',
        action: 'track-episodes',
        className: 'btn secondary',
        priority: 'secondary',
      };

      // Add to secondary actions for all lists
      Object.values(listConfigs).forEach((config) => {
        config.secondary.push(trackEpisodes);
      });
    }

    return listConfigs[listType] || { primary: [], secondary: [] };
  }

  /**
   * Create action bar HTML
   * @param {string} listType - Current list type
   * @param {Object} item - Item data
   * @returns {string} HTML string for action bar
   */
  function createActionBarHTML(listType, item) {
    const config = getActionConfig(listType, item);
    const itemId = item.id;
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');

    // Generate primary actions HTML
    const primaryActionsHTML = config.primary
      .map(
        (action) => `
      <button 
        class="${action.className} action-btn action-btn--primary" 
        data-action="${action.action}" 
        data-id="${itemId}" 
        data-list="${action.list || ''}"
        data-media-type="${mediaType}"
        aria-label="${action.label}"
        title="${action.label}"
      >
        ${action.icon ? `<span class="action-icon" aria-hidden="true">${action.icon}</span>` : ''}
        <span class="action-label">${action.label}</span>
      </button>
    `,
      )
      .join('');

    // Generate secondary actions HTML
    const secondaryActionsHTML = config.secondary
      .map(
        (action) => `
      <button 
        class="${action.className} action-btn action-btn--secondary" 
        data-action="${action.action}" 
        data-id="${itemId}" 
        data-list="${action.list || ''}"
        data-media-type="${mediaType}"
        aria-label="${action.label}"
        title="${action.label}"
      >
        ${action.icon ? `<span class="action-icon" aria-hidden="true">${action.icon}</span>` : ''}
        <span class="action-label">${action.label}</span>
      </button>
    `,
      )
      .join('');

    // Generate overflow menu HTML
    const overflowMenuHTML =
      config.secondary.length > 0
        ? `
      <div class="action-overflow">
        <button 
          class="action-overflow-btn" 
          aria-label="${t('more_actions')}" 
          aria-expanded="false"
          aria-haspopup="true"
        >
          <span class="action-overflow-dots" aria-hidden="true">⋯</span>
        </button>
        <div class="action-overflow-menu" role="menu" aria-hidden="true">
          ${config.secondary
            .map(
              (action) => `
            <button 
              class="action-overflow-item" 
              role="menuitem"
              data-action="${action.action}" 
              data-id="${itemId}" 
              data-list="${action.list || ''}"
              data-media-type="${mediaType}"
              aria-label="${action.label}"
            >
              ${action.icon ? `<span class="action-overflow-icon" aria-hidden="true">${action.icon}</span>` : ''}
              <span class="action-overflow-label">${action.label}</span>
            </button>
          `,
            )
            .join('')}
        </div>
      </div>
    `
        : '';

    return `
      <div class="action-bar" data-list-type="${listType}">
        <div class="action-bar__primary">
          ${primaryActionsHTML}
        </div>
        <div class="action-bar__secondary">
          ${secondaryActionsHTML}
        </div>
        ${overflowMenuHTML}
      </div>
    `;
  }

  /**
   * Initialize action bar event listeners
   */
  function initializeActionBarEvents() {
    // Handle overflow menu toggle
    document.addEventListener('click', (e) => {
      const overflowBtn = e.target.closest('.action-overflow-btn');
      if (overflowBtn) {
        e.preventDefault();
        e.stopPropagation();

        const isOpen = overflowBtn.getAttribute('aria-expanded') === 'true';

        // Close all other overflow menus
        document.querySelectorAll('.action-overflow-btn').forEach((btn) => {
          if (btn !== overflowBtn) {
            btn.setAttribute('aria-expanded', 'false');
            const menu = btn.nextElementSibling;
            if (menu) {
              menu.setAttribute('aria-hidden', 'true');
            }
          }
        });

        // Toggle current menu
        overflowBtn.setAttribute('aria-expanded', !isOpen);
        const menu = overflowBtn.nextElementSibling;
        if (menu) {
          menu.setAttribute('aria-hidden', isOpen);
        }
      }

      // Close overflow menus when clicking outside
      if (!e.target.closest('.action-overflow')) {
        document.querySelectorAll('.action-overflow-btn').forEach((btn) => {
          btn.setAttribute('aria-expanded', 'false');
          const menu = btn.nextElementSibling;
          if (menu) {
            menu.setAttribute('aria-hidden', 'true');
          }
        });
      }
    });

    // Handle action button clicks
    document.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('.action-btn, .action-overflow-item');
      if (!actionBtn) return;

      const action = actionBtn.getAttribute('data-action');
      const id = actionBtn.getAttribute('data-id');
      const list = actionBtn.getAttribute('data-list');
      const mediaType = actionBtn.getAttribute('data-media-type');

      // Close overflow menu after action
      const overflowMenu = actionBtn.closest('.action-overflow-menu');
      if (overflowMenu) {
        const overflowBtn = overflowMenu.previousElementSibling;
        if (overflowBtn) {
          overflowBtn.setAttribute('aria-expanded', 'false');
          overflowMenu.setAttribute('aria-hidden', 'true');
        }
      }

      // Route action to existing handlers
      switch (action) {
        case 'move':
          if (typeof window.moveItem === 'function') {
            window.moveItem(Number(id), list);
          }
          break;
        case 'remove':
          if (typeof window.removeItemFromCurrentList === 'function') {
            window.removeItemFromCurrentList(Number(id));
          }
          break;
        case 'notes':
          if (typeof window.openNotesTagsModal === 'function') {
            window.openNotesTagsModal(Number(id));
          }
          break;
        case 'rate':
          // Handle rating - this would need to be implemented
          console.log('Rating action for item:', id);
          break;
        case 'track-episodes':
          // Handle episode tracking - this would need to be implemented
          console.log('Track episodes action for item:', id);
          break;
        default:
          console.warn('Unknown action:', action);
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeActionBarEvents);
  } else {
    initializeActionBarEvents();
  }

  // Export functions for use in card rendering
  window.ActionBar = {
    createActionBarHTML,
    getActionConfig,
    initializeActionBarEvents,
  };
})();
