/**
 * Notes Modal - Simple Note Taking
 *
 * Process: Notes Modal
 * Purpose: Simple note taking modal with textarea and save/cancel
 * Data Source: localStorage for user notes
 * Update Path: Modify modal structure or note storage
 * Dependencies: localStorage, modal system
 */

(function () {
  'use strict';

  console.log('📝 Notes Modal loaded');

  /**
   * Open notes modal for an item
   * @param {Object} item - Item data
   */
  function openNotesModal(item) {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.dataset.modal = 'notes';

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal modal--notes';

    const itemTitle = item.title || item.name || 'Unknown Title';
    const itemId = item.id || item.tmdb_id || item.tmdbId;

    // Get existing notes
    const existingNotes = getItemNotes(itemId);

    modal.innerHTML = `
      <div class="modal__header">
        <h3 class="modal__title">Notes for ${itemTitle}</h3>
        <button class="modal__close" aria-label="Close modal">×</button>
      </div>
      <div class="modal__body">
        <div class="notes-modal">
          <label for="notesTextarea" class="notes-modal__label">Your notes:</label>
          <textarea 
            id="notesTextarea" 
            class="notes-modal__textarea" 
            placeholder="Add your thoughts, ratings, or any notes about this show or movie..."
            rows="8"
          >${existingNotes}</textarea>
          <div class="notes-modal__char-count">
            <span id="charCount">0</span> characters
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--secondary modal__cancel">Cancel</button>
        <button class="btn btn--primary modal__save">Save Notes</button>
      </div>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Add event listeners
    const closeBtn = modal.querySelector('.modal__close');
    const cancelBtn = modal.querySelector('.modal__cancel');
    const saveBtn = modal.querySelector('.modal__save');
    const textarea = modal.querySelector('#notesTextarea');
    const charCount = modal.querySelector('#charCount');

    const closeModal = () => {
      backdrop.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    // Handle character count
    textarea.addEventListener('input', (e) => {
      const count = e.target.value.length;
      charCount.textContent = count;

      // Update save button state
      if (count > 0 && count !== existingNotes.length) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Notes';
      } else if (count === 0) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Clear Notes';
      } else {
        saveBtn.disabled = true;
        saveBtn.textContent = 'No Changes';
      }
    });

    // Handle save
    saveBtn.addEventListener('click', () => {
      const notes = textarea.value.trim();
      saveItemNotes(itemId, notes);

      // Update note indicator on cards
      updateNoteIndicator(itemId, notes.length > 0);

      if (notes.length > 0) {
        showToast('success', 'Notes Saved', `Notes saved for ${itemTitle}`);
      } else {
        showToast('success', 'Notes Cleared', `Notes cleared for ${itemTitle}`);
      }

      closeModal();
    });

    // Focus textarea
    setTimeout(() => {
      textarea.focus();
      textarea.select();
    }, 100);
  }

  /**
   * Get item notes from localStorage
   * @param {string|number} itemId - Item ID
   * @returns {string} Notes text
   */
  function getItemNotes(itemId) {
    try {
      const notes = localStorage.getItem(`flicklet-notes-${itemId}`);
      return notes || '';
    } catch (error) {
      console.error('Failed to get item notes:', error);
      return '';
    }
  }

  /**
   * Save item notes to localStorage
   * @param {string|number} itemId - Item ID
   * @param {string} notes - Notes text
   */
  function saveItemNotes(itemId, notes) {
    try {
      if (notes.trim()) {
        localStorage.setItem(`flicklet-notes-${itemId}`, notes);
      } else {
        localStorage.removeItem(`flicklet-notes-${itemId}`);
      }
    } catch (error) {
      console.error('Failed to save item notes:', error);
    }
  }

  /**
   * Update note indicator on cards
   * @param {string|number} itemId - Item ID
   * @param {boolean} hasNotes - Whether item has notes
   */
  function updateNoteIndicator(itemId, hasNotes) {
    // Find all cards with this item ID
    const cards = document.querySelectorAll(`[data-id="${itemId}"]`);

    cards.forEach((card) => {
      let indicator = card.querySelector('.unified-poster-card__note-indicator');

      if (hasNotes && !indicator) {
        // Add indicator
        indicator = document.createElement('div');
        indicator.className = 'unified-poster-card__note-indicator';
        indicator.title = 'Has notes';
        indicator.textContent = '📝';

        const poster = card.querySelector('.unified-poster-card__poster');
        if (poster) {
          poster.appendChild(indicator);
        }
      } else if (!hasNotes && indicator) {
        // Remove indicator
        indicator.remove();
      }
    });
  }

  /**
   * Show toast notification
   * @param {string} type - Toast type
   * @param {string} title - Toast title
   * @param {string} message - Toast message
   */
  function showToast(type, title, message) {
    if (window.showToast) {
      window.showToast(type, title, message);
    } else {
      console.log(`Toast [${type}]: ${title} - ${message}`);
    }
  }

  // Expose globally
  window.openNotesModal = openNotesModal;

  console.log('✅ Notes Modal ready');
})();
