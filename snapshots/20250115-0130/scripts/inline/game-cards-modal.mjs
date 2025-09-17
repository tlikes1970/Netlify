/**
 * Process: Game Cards Modal System
 * Purpose: Handle game modal opening and management
 * Data Source: User interactions
 * Update Path: Runs on user interaction
 * Dependencies: None
 */

console.log('🎮 Script starting...');
(function () {
  console.log('🎮 Initializing Game Cards Modal System');
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  // Open/close helpers
  let lastOpener = null;
  function openModal(id, opener) {
    console.log('🎮 Opening modal:', id);
    const m = qs('#' + id);
    if (!m) return;
    
    lastOpener = opener;
    m.style.display = 'block';
    m.classList.add('show');
    
    // Focus management
    const closeBtn = m.querySelector('.close');
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function closeModal(m) {
    if (typeof m === 'string') m = qs('#' + m);
    if (!m) return;
    
    m.style.display = 'none';
    m.classList.remove('show');
    
    // Return focus to opener
    if (lastOpener && lastOpener.focus) {
      lastOpener.focus();
    }
  }

  // Set up modal handlers
  qsa('.game-card').forEach(card => {
    const cardId = card.id;
    if (!cardId) return;
    
    const open = (e) => {
      e.preventDefault();
      openModal('modal-' + cardId, e.target);
    };
    
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e)=>{ if (e.key === 'Enter' || e.key === ' ') open(e); });
    
    const btn = qs('#' + cardId + ' .gc-cta');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        open(e);
      });
    }
  });

  // Set up close handlers
  qsa('.game-modal').forEach(m => {
    const closeBtn = m.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal(m);
      });
    }
    
    m.addEventListener('click', (e) => { 
      if (e.target.classList.contains('gm-overlay')) {
        closeModal(m);
      }
    });
    
    m.addEventListener('keydown', (e) => { 
      if (e.key === 'Escape') {
        closeModal(m);
      }
    });
  });
  
  // Global close function
  window.closeGameModal = (id) => {
    const modal = qs('#' + id);
    if (modal) closeModal(modal);
  };

  // Handle new data-action buttons
  document.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'open-trivia') {
      openModal('modal-trivia');
    }
  });
  
  // Dispatch modal events for other systems to listen to
  const originalOpenModal = openModal;
  openModal = function(id, opener) {
    originalOpenModal(id, opener);
    document.dispatchEvent(new CustomEvent('modal:open', { detail: { id, opener } }));
  };

  const originalCloseModal = closeModal;
  closeModal = function(modal) {
    const id = typeof modal === 'string' ? modal : modal.id;
    originalCloseModal(modal);
    document.dispatchEvent(new CustomEvent('modal:close', { detail: { id } }));
  };

  // Handle escape key globally
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') {
      const openModal = qs('.game-modal.show');
      if (openModal) closeModal(openModal);
    }
  });
})();
