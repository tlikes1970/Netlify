/**
 * Modal Utility - Centralized modal management
 * Purpose: Provides focus trapping, Esc/overlay closing, and proper cleanup
 * Data Source: DOM elements and event listeners
 * Update Path: Via open/close methods
 * Dependencies: CSS classes, event listeners
 */

(function () {
  'use strict';

  let activeModal = null;
  let previousFocus = null;
  let focusableElements = [];
  let firstFocusable = null;
  let lastFocusable = null;

  // Get all focusable elements within a container
  function getFocusableElements(container) {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];

    return container.querySelectorAll(focusableSelectors.join(', '));
  }

  // Trap focus within modal
  function trapFocus(event) {
    if (!activeModal) return;

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab (backwards)
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  }

  // Close modal and restore focus
  function closeModal() {
    if (!activeModal) return;

    console.log('🔒 [MODAL] Closing modal:', activeModal.id);

    // Remove event listeners
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleOverlayClick);

    // Hide modal
    activeModal.style.display = 'none';
    activeModal.setAttribute('aria-hidden', 'true');

    // Restore focus
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
      console.log('🔒 [MODAL] Focus restored to:', previousFocus);
    }

    // Clear state
    activeModal = null;
    previousFocus = null;
    focusableElements = [];
    firstFocusable = null;
    lastFocusable = null;
  }

  // Handle keyboard events
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    } else if (event.key === 'Tab') {
      trapFocus(event);
    }
  }

  // Handle overlay clicks
  function handleOverlayClick(event) {
    if (
      event.target.classList.contains('modal-overlay') ||
      event.target.classList.contains('modal-backdrop') ||
      event.target.hasAttribute('data-close')
    ) {
      closeModal();
    }
  }

  // Open modal with focus trapping
  function openModal(modalId, openerElement = null) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error('❌ [MODAL] Modal not found:', modalId);
      return false;
    }

    console.log('🔒 [MODAL] Opening modal:', modalId);

    // Store previous focus
    previousFocus = openerElement || document.activeElement;

    // Show modal
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    // Get focusable elements
    focusableElements = getFocusableElements(modal);
    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      modal.focus();
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleOverlayClick);

    // Set active modal
    activeModal = modal;

    return true;
  }

  // Public API
  window.ModalUtility = {
    open: openModal,
    close: closeModal,
    isOpen: function (modalId) {
      // Check if we have an active modal with this ID
      if (!activeModal || activeModal.id !== modalId) {
        console.log(`[MODAL] isOpen(${modalId}): false - no active modal`);
        return false;
      }

      // Check if the modal element exists and is visible
      const modalElement = document.getElementById(modalId);
      if (!modalElement) {
        console.log(`[MODAL] isOpen(${modalId}): false - no modal element`);
        return false;
      }

      // Simple check: modal is open if it's not aria-hidden and has a visible display style
      const isAriaHidden = modalElement.getAttribute('aria-hidden') === 'true';
      const hasVisibleDisplay =
        modalElement.style.display === 'flex' || modalElement.style.display === 'block';

      const isOpen = !isAriaHidden && hasVisibleDisplay;
      console.log(`[MODAL] isOpen(${modalId}): ${isOpen}`, {
        isAriaHidden,
        hasVisibleDisplay,
        displayStyle: modalElement.style.display,
      });

      return isOpen;
    },
    getActiveModal: function () {
      return activeModal;
    },
    forceClose: function (modalId) {
      console.log(`[MODAL] Force closing modal: ${modalId}`);
      activeModal = null;
      previousFocus = null;

      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        modalElement.style.display = 'none';
        modalElement.setAttribute('aria-hidden', 'true');
      }
    },
  };

  console.log('✅ [MODAL] Modal utility loaded');
})();
