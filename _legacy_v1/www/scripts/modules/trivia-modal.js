/**
 * Process: Trivia Modal Module
 * Purpose: Trivia modal functionality with draggable/resizable support
 * Data Source: DOM elements
 * Update Path: Update modal selectors if needed
 * Dependencies: DOM API, DraggableModal
 */

import { DraggableModal } from './draggable-modal.js';

let triviaDraggableModal = null;

export function initializeTriviaModal() {
  // Trivia Modal Functions
  function openTriviaModal(triviaData) {
    console.log('🧠 Opening Trivia modal with data:', triviaData);
    const modal = document.getElementById('modal-trivia');
    const gameContainer = document.getElementById('dailytrivia-game');

    if (modal && gameContainer) {
      // Initialize draggable modal if not already done
      if (!triviaDraggableModal) {
        triviaDraggableModal = new DraggableModal('modal-trivia', {
          minWidth: 400,
          minHeight: 500,
          maxWidth: window.innerWidth * 0.95,
          maxHeight: window.innerHeight * 0.95
        });
      }

      // Show modal using draggable modal
      triviaDraggableModal.openModal();

      // Mount the Trivia game
      if (window.DailyTriviaBridge && typeof window.DailyTriviaBridge.mount === 'function') {
        try {
          window.DailyTriviaBridge.mount('#dailytrivia-game');
          console.log('🧠 Trivia game mounted successfully');
        } catch (error) {
          console.error('🧠 Error mounting Trivia game:', error);
        }
      } else {
        console.error('🧠 DailyTriviaBridge not available');
      }

      // Focus management
      const firstFocusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    } else {
      console.error('❌ Trivia modal elements not found');
    }
  }

  function closeTriviaModal() {
    console.log('🧠 Closing Trivia modal');
    const modal = document.getElementById('modal-trivia');

    if (modal) {
      // Close modal using draggable modal
      if (triviaDraggableModal) {
        triviaDraggableModal.closeModal();
      }

      // Unmount the Trivia game
      if (window.DailyTriviaBridge && typeof window.DailyTriviaBridge.unmount === 'function') {
        try {
          window.DailyTriviaBridge.unmount();
          console.log('🧠 Trivia game unmounted successfully');
        } catch (error) {
          console.error('🧠 Error unmounting Trivia game:', error);
        }
      }
    }
  }

  // Provide a single, idempotent closer with message
  window.closeTriviaModalWithError = (msg) => {
    try {
      const modal = document.getElementById('modal-trivia');
      if (modal) {
        modal.setAttribute('aria-hidden', 'true');
        modal.style.display = 'none';
        modal.classList.remove('show');
      }
    } catch {}
    // Non-blocking notice
    try {
      console.warn('[Trivia] ' + (msg || 'Trivia unavailable.'));
    } catch {}
  };

  // Expose globally
  window.openTriviaModal = openTriviaModal;
  window.closeTriviaModal = closeTriviaModal;

  // Initialize event listeners immediately (not waiting for DOMContentLoaded)
  function initializeEventListeners() {
    console.log('🧠 Initializing Trivia modal event listeners...');

    const openBtn = document.querySelector('[data-action="start-trivia"]');
    const closeBtn = document.querySelector('#modal-trivia .gm-close');
    const overlay = document.querySelector('#modal-trivia .gm-overlay');

    console.log('🧠 Found elements:', { openBtn, closeBtn, overlay });

    if (openBtn) {
      console.log('🧠 Adding click listener to open button');
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openTriviaModal();
      });
    }

    if (closeBtn) {
      console.log('🧠 Adding click listener to close button');
      closeBtn.addEventListener('click', (e) => {
        console.log('🧠 Close button clicked!');
        closeTriviaModal();
      });
    }

    if (overlay) {
      console.log('🧠 Adding click listener to overlay');
      overlay.addEventListener('click', (e) => {
        console.log('🧠 Overlay clicked!');
        closeTriviaModal();
      });
    }

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('modal-trivia');
        if (modal && modal.getAttribute('aria-hidden') === 'false') {
          closeTriviaModal();
        }
      }
    });

    // Handle messages from iframe
    window.addEventListener('message', (e) => {
      console.log('🧠 Received message:', e.data);
      if (e.data && e.data.type === 'trivia:close') {
        console.log('🧠 Received close message from iframe');
        closeTriviaModal();
      }
    });
  }

  // Initialize immediately if DOM is ready, otherwise wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventListeners);
  } else {
    initializeEventListeners();
  }
}
