/* ========== search-tips.js ==========
   Tiny popover for search tips with persistence and a11y. */
(function(){
  if (window.__tipsInit__) return; window.__tipsInit__ = true;

  const KEY = 'flicklet:searchTips:hidden';
  const wrap = document.getElementById('searchTips');
  if (!wrap) return;

  const trigger = document.getElementById('tipsTrigger');
  const pop = document.getElementById('tipsPop');
  const closeBtn = document.getElementById('tipsClose');
  const dontShow = document.getElementById('tipsDontShow');

  // Respect user's previous choice
  const hidden = localStorage.getItem(KEY) === '1';
  if (hidden) wrap.style.display = 'none';

  // Open/close
  function openPop(){
    if (wrap.style.display === 'none') return;
    positionPop();
    pop.hidden = false;
    trigger.setAttribute('aria-expanded','true');
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('click', onDocClick, true);
    // focus the close button for accessibility
    setTimeout(() => closeBtn.focus(), 0);
  }
  function closePop(){
    pop.hidden = true;
    trigger.setAttribute('aria-expanded','false');
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('click', onDocClick, true);
    trigger.focus();
  }
  function onKey(e){
    if (e.key === 'Escape'){ e.preventDefault(); closePop(); }
  }
  function onDocClick(e){
    if (pop.hidden) return;
    if (e.target === trigger) return;
    // Don't close if clicking on modal elements
    if (e.target.closest('.modal-backdrop') || e.target.closest('.modal')) return;
    if (!pop.contains(e.target)) closePop();
  }

  // Keep popover near the trigger, but use viewport coords (fixed)
  function positionPop(){
    const r = trigger.getBoundingClientRect();
    const pad = 8;
    const top = Math.min(window.innerHeight - pad - 10, r.bottom + pad);
    const left = Math.min(window.innerWidth - 10 - 320, Math.max(10, r.left)); // clamp
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;
  }
  window.addEventListener('resize', () => { if (!pop.hidden) positionPop(); });

  // Persist "don't show again"
  dontShow.addEventListener('change', () => {
    if (dontShow.checked){
      localStorage.setItem(KEY, '1');
      closePop();
      wrap.style.display = 'none';
      window.Notify?.info?.('Search tips hidden');
    } else {
      localStorage.removeItem(KEY);
      window.Notify?.info?.('Search tips will show');
    }
  });

  // Wire
  trigger.addEventListener('click', () => pop.hidden ? openPop() : closePop());
  closeBtn.addEventListener('click', closePop);

  // Optional first-run nudge: auto-open once if user hasn't dismissed
  if (!hidden) {
    setTimeout(() => {
      // only open if input is focused – feels contextual, not spammy
      const active = document.activeElement;
      if (active && (active.matches('input[type="search"]') || active.matches('.top-search input'))) {
        openPop();
      }
    }, 500);
  }
})();

