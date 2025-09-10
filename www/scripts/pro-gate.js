/* ========== pro-gate.js ==========
   Minimal Pro gating with hide/disable modes, tooltip, and upsell modal.
*/
(function(){
  if (window.__proInit__) return; window.__proInit__ = true;

  const KEY = 'flicklet:pro'; // '1' = active
  const isPro = () => localStorage.getItem(KEY) === '1';
  const setPro = (v) => localStorage.setItem(KEY, v ? '1' : '0');

  // Public QA helpers (type in console):
  window.enablePro = () => { setPro(true); applyGates(); Notify?.success?.('Pro ON'); };
  window.disablePro = () => { setPro(false); applyGates(); Notify?.info?.('Pro OFF'); };

  // Find all gated elements
  function applyGates(){
    const gated = document.querySelectorAll('[data-pro="required"]');
    gated.forEach(el => {
      const mode = (el.getAttribute('data-pro-mode') || 'disable').toLowerCase();
      // Clean previous state
      el.classList.remove('pro-locked');
      el.removeAttribute('aria-disabled');
      const tip = el.querySelector('.pro-lock-tip');
      if (tip) tip.remove();

      if (isPro()) {
        // show/enable everything
        el.hidden = false;
        el.disabled = false;
        return;
      }

      // Not Pro: hide or disable + tip
      if (mode === 'hide') {
        el.hidden = true;
        return;
      }
      // disable mode (default)
      el.hidden = false;
      el.disabled = true;
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('pro-locked');

      const msg = tipText(el);
      const tipEl = document.createElement('div');
      tipEl.className = 'pro-lock-tip';
      tipEl.textContent = msg;
      el.appendChild(tipEl);

      // Clicking a disabled gated control opens upsell
      el.addEventListener('click', onLockedClick, { once: false });
    });
  }

  function tipText(el){
    const feat = el.getAttribute('data-pro-feature') || 'this feature';
    return `Pro required for ${feat}.`;
  }

  function onLockedClick(e){
    if (isPro()) return; // safety
    e.preventDefault();
    e.stopPropagation();
    openUpsell();
  }

  // --- Upsell modal (reuses modal styles from Step 12) ---
  const modal = document.getElementById('proUpsellModal');
  const closeBtns = modal ? modal.querySelectorAll('[data-close]') : [];
  const startBtn = document.getElementById('proActivateBtn');
  let prevActive = null;

  function openUpsell(){
    if (!modal) return;
    prevActive = document.activeElement;
    modal.hidden = false;
    document.addEventListener('keydown', onKey, true);
    requestAnimationFrame(() => startBtn?.focus());
  }
  function closeUpsell(){
    if (!modal) return;
    modal.hidden = true;
    document.removeEventListener('keydown', onKey, true);
    prevActive?.focus?.();
  }
  function onKey(e){
    if (e.key === 'Escape'){ e.preventDefault(); closeUpsell(); }
  }
  closeBtns.forEach(b => b.addEventListener('click', closeUpsell));
  modal?.querySelector('.modal-backdrop')?.addEventListener('click', closeUpsell);

  startBtn?.addEventListener('click', () => {
    // In real life, you'd kick off checkout here and set flag on success.
    setPro(true);
    applyGates();
    Notify?.success?.('Pro activated');
    closeUpsell();
  });

  // Initial apply
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGates, { once: true });
  } else {
    applyGates();
  }
})();












