/**
 * Process: FlickWord Modal Functions
 * Purpose: Handle FlickWord modal opening and management
 * Data Source: User interactions
 * Update Path: Runs on user interaction
 * Dependencies: None
 */

// FlickWord Modal Functions
function openFlickWordModal() {
  console.log('🎯 Opening FlickWord modal');
  const modal = document.getElementById('flickwordModal');
  const frame = document.getElementById('flickwordFrame');
  
  if (modal && frame) {
    // Set today's date for the game
    const today = new Date().toISOString().split('T')[0];
    frame.src = `features/flickword-v2.html?date=${today}`;
    
    // Show modal
    modal.style.display = 'block';
    modal.classList.add('show');
    
    // Focus management
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
      closeBtn.focus();
    }
  } else {
    console.warn('FlickWord modal or frame not found');
  }
}

// Close FlickWord modal
function closeFlickWordModal() {
  const modal = document.getElementById('flickwordModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
}

// Export functions globally
window.openFlickWordModal = openFlickWordModal;
window.closeFlickWordModal = closeFlickWordModal;

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    const openBtn = document.querySelector('[data-action="open-flickword"]');
    if (openBtn) {
      openBtn.addEventListener('click', openFlickWordModal);
    }
    
    const closeBtn = document.querySelector('#flickwordModal .close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeFlickWordModal);
    }
  });
} else {
  // DOM already ready
  const openBtn = document.querySelector('[data-action="open-flickword"]');
  if (openBtn) {
    openBtn.addEventListener('click', openFlickWordModal);
  }
  
  const closeBtn = document.querySelector('#flickwordModal .close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeFlickWordModal);
  }
}
