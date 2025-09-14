/**
 * Process: Modal Core System
 * Purpose: Centralized modal management to prevent stuck overlays and ensure proper cleanup
 * Data Source: DOM manipulation and event handling
 * Update Path: Modal open/close functions and cleanup mechanisms
 * Dependencies: DOM, event listeners, CSS classes
 */

(function() {
  'use strict';

  console.log('🪟 Modal core system loaded');

  // Modal management system
  window.Modals = window.Modals || {
    /**
     * Open a modal with proper cleanup
     * @param {string} html - HTML content for the modal
     * @returns {Object} Modal control object with close method
     */
    open(html) {
      // Close any existing modals first
      this.closeAll();

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = html;
      document.body.appendChild(overlay);
      document.body.classList.add('has-modal');

      // Close function
      const close = () => {
        overlay.remove();
        document.body.classList.remove('has-modal');
      };

      // Click outside to close
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          close();
        }
      });

      // Close button
      const closeBtn = overlay.querySelector('[data-close]');
      if (closeBtn) {
        closeBtn.addEventListener('click', close);
      }

      // Escape key to close
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          close();
          window.removeEventListener('keydown', escapeHandler);
        }
      };
      window.addEventListener('keydown', escapeHandler);

      return { close };
    },

    /**
     * Close all modals and clean up
     */
    closeAll() {
      document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.remove());
      document.body.classList.remove('has-modal');
    },

    /**
     * Check if any modals are open
     * @returns {boolean} True if modals are open
     */
    isOpen() {
      return document.querySelectorAll('.modal-overlay').length > 0;
    }
  };

  // Ensure modals are closed when switching tabs
  const originalSwitchToTab = window.switchToTab;
  if (originalSwitchToTab) {
    window.switchToTab = function(tab) {
      window.Modals?.closeAll();
      return originalSwitchToTab(tab);
    };
  }

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    window.Modals?.closeAll();
  });

})();
