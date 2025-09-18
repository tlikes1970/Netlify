
    // === Daily Trivia <-> Modal bridge (iframe mount/unmount) ===
    window.DailyTriviaBridge = (() => {
      let handle = null;
      const TRIVIA_SRC = 'features/trivia.html'; // change here if your path differs

      function todayISO(){ return new Date().toISOString().slice(0,10); }

      function mount(rootSel){
        const root = typeof rootSel === 'string' ? document.querySelector(rootSel) : rootSel;
        if (!root) throw new Error('DailyTrivia root not found');
        if (handle) return handle;

        const iframe = document.createElement('iframe');
        iframe.id = 'triviaFrame_new';
        iframe.title = 'Daily Trivia Game';
        iframe.loading = 'eager';
        iframe.referrerPolicy = 'no-referrer';
        iframe.allow = '';
        iframe.sandbox = 'allow-scripts';
        iframe.style.width = '100%';
        /* Height now managed by card system */
        iframe.style.border = 'none';
        iframe.style.borderRadius = '10px';

        // If your trivia uses a daily seed, pass date (safe even if ignored)
        iframe.src = `${TRIVIA_SRC}?date=${todayISO()}`;

        root.replaceChildren(iframe);

        const onLoad = () => { try { iframe.focus(); } catch {} };
        iframe.addEventListener('load', onLoad);

        // Listen for results and update teaser stats
        const onMsg = (event) => {
          const data = event.data;
          if (!data || data.type !== 'trivia:result') return;
          // Expect payload like { streak, best, acc } — adjust if your keys differ
          try {
            const prev = JSON.parse(localStorage.getItem('trivia:stats') || '{}');
            const next = { ...prev, ...data.payload };
            localStorage.setItem('trivia:stats', JSON.stringify(next));
          } catch {}

          try {
            const $ = (s)=>document.querySelector(s);
            const stats = JSON.parse(localStorage.getItem('trivia:stats') || '{}');
            $('[data-tv-streak]') && $('[data-tv-streak]').replaceChildren(String(stats.streak ?? 0));
            $('[data-tv-best]')   && $('[data-tv-best]').replaceChildren(String(stats.best ?? 0));
            $('[data-tv-acc]')    && $('[data-tv-acc]').replaceChildren(String(stats.acc ?? '—'));
          } catch {}
        };
        window.addEventListener('message', onMsg);

        handle = {
          iframe,
          destroy(){
            try { iframe.removeEventListener('load', onLoad); } catch {}
            try { window.removeEventListener('message', onMsg); } catch {}
            try { iframe.src = 'about:blank'; } catch {}
            if (iframe.parentNode) iframe.parentNode.replaceChildren();
            handle = null;
          }
        };
        return handle;
      }

      function unmount(){ if (handle) handle.destroy(); }

      return { mount, unmount };
    })();

    // === Wire to modal lifecycle ===
    (function wireTriviaToModal(){
      document.addEventListener('modal:open', (e)=>{
        if (e.detail?.id === 'modal-trivia') {
          try { window.DailyTriviaBridge.mount('#dailytrivia-game'); }
          catch(err){ console.error('Trivia mount failed', err); }
        }
      });
      document.addEventListener('modal:close', (e)=>{
        if (e.detail?.id === 'modal-trivia') {
          try { window.DailyTriviaBridge.unmount(); }
          catch(err){ console.error('Trivia unmount failed', err); }
        }
      });
    })();

    // === Initialize teaser with any saved stats (runs once at startup) ===
    (function initTriviaTeaserNew(){
      try {
        const stats = JSON.parse(localStorage.getItem('trivia:stats') || '{}');
        const set = (sel, val)=>{ const el=document.querySelector(sel); if (el) el.textContent = String(val); };
        set('[data-tv-streak]', stats.streak ?? 0);
        set('[data-tv-best]',   stats.best   ?? 0);
        set('[data-tv-acc]',    stats.acc    ?? '—');
      } catch {}
    })();
    