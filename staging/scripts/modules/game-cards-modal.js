/**
 * Process: Game Cards Modal Module
 * Purpose: Game Cards Modal System
 * Data Source: DOM elements
 * Update Path: Update selectors if needed
 * Dependencies: DOM API
 */

export function initializeGameCardsModal() {
  console.log('🎮 Script starting...');
  console.log('🎮 Initializing Game Cards Modal System');
  
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Game Cards Modal System
  class GameCardsModal {
    constructor() {
      this.modal = qs('#gameCardsModal');
      this.frame = qs('#gameCardsFrame');
      this.openBtn = qs('[data-action="open-game-cards"]');
      this.closeBtn = qs('[data-action="close-game-cards"]');
      
      this.init();
    }

    init() {
      if (!this.modal || !this.frame) {
        console.error('❌ Game Cards modal elements not found');
        return;
      }

      // Event listeners
      if (this.openBtn) {
        this.openBtn.addEventListener('click', () => this.open());
      }
      
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }

      // Close on backdrop click
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.classList.contains('show')) {
          this.close();
        }
      });
    }

    open() {
      console.log('🎮 Opening Game Cards modal');
      
      // Set iframe source
      this.frame.src = 'features/trivia.html';
      
      // Show modal
      this.modal.style.display = 'block';
      this.modal.classList.add('show');
      
      // Focus management
      const firstFocusable = this.modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    close() {
      console.log('🎮 Closing Game Cards modal');
      
      this.modal.style.display = 'none';
      this.modal.classList.remove('show');
      
      // Clear iframe source
      this.frame.src = 'about:blank';
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new GameCardsModal());
  } else {
    new GameCardsModal();
  }
}








