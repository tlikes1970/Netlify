/**
 * Games Teaser Modal
 * Shows a modal when game tiles are clicked but games aren't fully implemented yet
 */

(function() {
  'use strict';

  console.log('🎮 Games Teaser Modal loaded');

  // Helper function to get translation
  function t(key) {
    // Handle nested i18n keys
    const keys = key.split('.');
    let value = window.i18n;
    for (let i = 0; i < keys.length; i++) {
      if (value && typeof value === 'object' && keys[i] in value) {
        value = value[keys[i]];
      } else {
        return key; // Return key if not found
      }
    }
    return value;
  }

  // Create and show games teaser modal
  window.showGamesTeaserModal = function(gameType) {
    console.log('🎮 Showing games teaser modal for:', gameType);
    
    const modal = document.createElement('div');
    modal.className = 'modal games-teaser';
    modal.innerHTML = `
      <div class="modal__backdrop"></div>
      <div class="modal__dialog">
        <div class="modal__header">
          <h3>${t('games.teaser_title')}</h3>
          <button class="modal__close" aria-label="Close">×</button>
        </div>
        <div class="modal__body">
          <p>${t('games.teaser_body')}</p>
        </div>
        <div class="modal__actions">
          <button class="btn btn-primary open-trivia">${t('games.open_trivia')}</button>
          <button class="btn btn-secondary open-flickword">${t('games.open_flickword')}</button>
          <button class="btn btn-link close">${t('games.maybe_later')}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

    // Close modal function
    const close = () => {
      modal.remove();
    };

    // Set up event listeners
    modal.querySelector('.modal__close').onclick = close;
    modal.querySelector('.close').onclick = close;
    modal.querySelector('.modal__backdrop').onclick = close;
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Game action buttons
    modal.querySelector('.open-trivia').onclick = () => {
      if (window.openTriviaGame) {
        window.openTriviaGame();
      } else {
        console.log('🎮 Trivia game not available');
        alert('Trivia game coming soon!');
      }
      close();
    };

    modal.querySelector('.open-flickword').onclick = () => {
      if (window.openFlickWordGame) {
        window.openFlickWordGame();
      } else {
        console.log('🎮 FlickWord game not available');
        alert('FlickWord game coming soon!');
      }
      close();
    };

    // Focus management
    const firstButton = modal.querySelector('.open-trivia');
    if (firstButton) {
      firstButton.focus();
    }
  };

})();
