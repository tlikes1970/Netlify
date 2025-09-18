
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
        if (!m) {
          console.error('🎮 Modal not found:', id);
          return;
        }
        lastOpener = opener || document.activeElement;
        m.setAttribute('aria-hidden', 'false');
        console.log('🎮 Modal opened:', m.id, 'aria-hidden:', m.getAttribute('aria-hidden'));
        
        // Set up FlickWord iframe with today's date
        if (id === 'modal-flickword') {
          const frame = qs('#flickword-game-frame');
          if (frame) {
            const today = new Date().toISOString().split('T')[0];
            frame.src = `features/flickword-v2.html?date=${today}`;
          }
        }

        // Focus trap
        const focusables = qsa('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', m);
        const first = focusables[0], last = focusables[focusables.length - 1];
        (first || qs('[data-close]', m) || m).focus();

        function trap(e){
          if (e.key !== 'Tab') return;
          if (!focusables.length) return;
          if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
        }
        m._trap = trap;
        m.addEventListener('keydown', trap);
      }
      function closeModal(m) {
        console.log('🔴 Closing modal:', m?.id);
        if (!m) return;
        m.setAttribute('aria-hidden', 'true');
        m.removeEventListener('keydown', m._trap || (()=>{}));
        if (lastOpener && typeof lastOpener.focus === 'function') lastOpener.focus();
      }

      // Wire card + CTA triggers
      function wireCard(cardId, modalId){
        console.log('🎮 Wiring card:', cardId, 'to modal:', modalId);
        const card = qs('#' + cardId);
        if (!card) {
          console.error('🎮 Card not found:', cardId);
          return;
        }
        const open = (e) => { 
          console.log('🎮 Card clicked:', cardId);
          e.preventDefault(); 
          openModal(modalId, card); 
        };
        card.addEventListener('click', open);
        card.addEventListener('keydown', (e)=>{ if (e.key === 'Enter' || e.key === ' ') open(e); });
        const btn = qs('#' + cardId + ' .gc-cta');
        if (btn) {
          console.log('🎮 CTA button found for:', cardId);
          btn.addEventListener('click', open);
        } else {
          console.warn('🎮 CTA button not found for:', cardId);
        }
      }
      // Check if modals exist
      console.log('🎮 Available modals:', qsa('.game-modal').map(m => m.id));
      console.log('🎮 FlickWord modal:', qs('#modal-flickword'));
      console.log('🎮 Trivia modal:', qs('#modal-trivia'));
      
      wireCard('flickwordTile', 'modal-flickword');
      wireCard('triviaTile', 'modal-trivia');

      // Overlay & close buttons
      qsa('.game-modal').forEach(m => {
        qsa('[data-close]', m).forEach(el => {
          el.addEventListener('click', (e) => {
            console.log('🔴 Close button clicked for modal:', m.id);
            e.preventDefault();
            e.stopPropagation();
            closeModal(m);
          });
        });
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
      window.closeGameModal = closeModal;
      
      // Listen for game close messages
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'flickword:close') {
          const modal = qs('#modal-flickword');
          if (modal) closeModal(modal);
        }
        if (event.data && event.data.type === 'trivia:close') {
          const modal = qs('#modal-trivia');
          if (modal) closeModal(modal);
        }
      });

      // Handle new data-action buttons
      document.addEventListener('click', function(event) {
        const action = event.target.getAttribute('data-action');
        if (action === 'start-flickword') {
          event.preventDefault();
          event.stopPropagation();
          openModal('modal-flickword');
        } else if (action === 'start-trivia') {
          event.preventDefault();
          event.stopPropagation();
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
      closeModal = function(m) {
        const id = m?.id;
        originalCloseModal(m);
        if (id) {
          document.dispatchEvent(new CustomEvent('modal:close', { detail: { id } }));
        }
      };

      // ---- Reliable close: X, overlay, ESC ----
      (function wireModalCloseDelegation(){
        if (window.__modalCloseWired) return;
        window.__modalCloseWired = true;

        document.addEventListener('click', (e)=>{
          const t = e.target;
          if (t.classList?.contains('gm-overlay') || t.closest?.('[data-close]')){
            e.preventDefault();
            closeModal(t.closest('.game-modal'));
          }
        });
        document.addEventListener('keydown', (e)=>{
          if (e.key === 'Escape') {
            const openModal = document.querySelector('.game-modal[aria-hidden="false"]');
            if (openModal) closeModal(openModal);
          }
        });
      })();

      // ---- Exact iframe sizing on open + resize ----
      (function sizeIframesOnModalOpen(){
        function sizeIframe(modalId){
          const modal = document.getElementById(modalId);
          if (!modal) return;
          const body = modal.querySelector('.gm-body');
          const iframe = body?.querySelector('iframe');
          if (!iframe || !body) return;
          /* Height now managed by card system */
        }

        const needsResize = new Set();

        document.addEventListener('modal:open', (e)=>{
          const id = e.detail?.id;
          if (!id) return;
          requestAnimationFrame(()=> sizeIframe(id));
          needsResize.add(id);
        });

        document.addEventListener('modal:close', (e)=>{
          const id = e.detail?.id;
          if (!id) return;
          needsResize.delete(id);
        });

        window.addEventListener('resize', ()=>{
          for (const id of needsResize) sizeIframe(id);
        });
      })();

      // Stats hooks (wire real data later)
      window.GameStats = {
        set(data){
          if (data.flickword){
            if ('streak' in data.flickword) qs('[data-fw-streak]')?.replaceChildren(String(data.flickword.streak));
            if ('best'   in data.flickword) qs('[data-fw-best]')?.replaceChildren(String(data.flickword.best));
            if ('win'    in data.flickword) qs('[data-fw-win]')?.replaceChildren(String(data.flickword.win));
          }
          if (data.trivia){
            if ('streak' in data.trivia) qs('[data-tv-streak]')?.replaceChildren(String(data.trivia.streak));
            if ('best'   in data.trivia) qs('[data-tv-best]')?.replaceChildren(String(data.trivia.best));
            if ('acc'    in data.trivia) qs('[data-tv-acc]')?.replaceChildren(String(data.trivia.acc));
          }
        }
      };
    })();
    