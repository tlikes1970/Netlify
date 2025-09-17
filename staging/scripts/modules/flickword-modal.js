/**
 * Process: FlickWord Modal Module
 * Purpose: FlickWord modal functionality
 * Data Source: DOM elements
 * Update Path: Update modal selectors if needed
 * Dependencies: DOM API
 */

export function initializeFlickWordModal() {
  // FlickWord Modal Functions
  function openFlickWordModal() {
    console.log('🎯 Opening FlickWord modal');
    const modal = document.getElementById('flickwordModal');
    const frame = document.getElementById('flickwordFrame');
    
    if (modal && frame) {
      // Set iframe source
      frame.src = 'features/flickword.html';
      
      // Show modal
      modal.style.display = 'block';
      modal.classList.add('show');
      
      // Focus management
      const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    } else {
      console.error('❌ FlickWord modal elements not found');
    }
  }

  function closeFlickWordModal() {
    console.log('🎯 Closing FlickWord modal');
    const modal = document.getElementById('flickwordModal');
    const frame = document.getElementById('flickwordFrame');
    
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
      
      // Clear iframe source to stop any running processes
      if (frame) {
        frame.src = 'about:blank';
      }
    }
  }

  // Expose globally
  window.openFlickWordModal = openFlickWordModal;
  window.closeFlickWordModal = closeFlickWordModal;

  // Initialize event listeners
  document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.querySelector('[data-action="open-flickword"]');
    const closeBtn = document.querySelector('[data-action="close-flickword"]');
    
    if (openBtn) {
      openBtn.addEventListener('click', openFlickWordModal);
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeFlickWordModal);
    }
  });
}








