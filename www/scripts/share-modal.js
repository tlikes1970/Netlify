/* ========== share-modal.js ==========
   Idempotent Share modal with Web Share fallback + a11y focus trap.
*/
(function () {
  if (window.__shareModalInit__) return; // idempotent init
  window.__shareModalInit__ = true;

  const modal = document.getElementById('shareModal');
  if (!modal) return;

  const openBtn = document.getElementById('shareOpenBtn'); // example trigger; you can add more with [data-share-url]
  const closeBtns = modal.querySelectorAll('[data-close]');
  const urlInput = document.getElementById('shareUrl');
  const nativeBtn = document.getElementById('shareNativeBtn');
  const copyBtn = document.getElementById('shareCopyBtn');
  const feedback = document.getElementById('shareFeedback');
  const hint = document.getElementById('shareHint');

  // Focus trap
  let prevActive = null;
  const focusablesSel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  // Route guard: don't open in Settings/onboarding if your app exposes flags
  function canOpen() {
    try {
      if (window.flicklet?.isInSettings) return false;
      if (document.body.classList.contains('modal-block-share')) return false; // your own guard hook
    } catch (_) {}
    return true;
  }

  // Derive share payload
  function payloadFromTrigger(btn) {
    const title = btn?.dataset?.shareTitle || document.title || 'Share';
    const url = btn?.dataset?.shareUrl || location.href;
    const text = btn?.dataset?.shareText || '';
    return { title, url, text };
  }

  function setPayload(p) {
    urlInput.value = p.url;
    hint.textContent = p.text ? p.text : 'Share this page or item.';
    nativeBtn.hidden = !canUseWebShare(p);
  }

  function canUseWebShare(p) {
    return !!(navigator.share && navigator.canShare
      ? navigator.canShare({ title: p.title, url: p.url, text: p.text })
      : navigator.share);
  }

  function open(p) {
    // STEP 2.1 (optional) — Prevent accidental double-open even if someone calls twice
    if (window.__shareModalOpened) {
      console.debug('Share modal already opened — skipping');
      return;
    }
    window.__shareModalOpened = true;

    if (!canOpen()) return;
    setPayload(p);
    prevActive = document.activeElement;
    modal.hidden = false;
    feedback.textContent = '';
    // focus first control
    requestAnimationFrame(() => urlInput.focus());
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focus', trapFocus, true);
  }

  function close() {
    modal.hidden = true;
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('focus', trapFocus, true);
    if (prevActive && prevActive.focus) prevActive.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    // trap
    const f = Array.from(modal.querySelectorAll(focusablesSel)).filter(
      (x) => !x.disabled && x.offsetParent !== null,
    );
    if (!f.length) return;
    const first = f[0],
      last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function trapFocus(e) {
    if (!modal.hidden && !modal.contains(e.target)) {
      e.stopPropagation();
      const f = modal.querySelector(focusablesSel);
      f && f.focus();
    }
  }

  async function shareNative() {
    const p = { title: document.title, url: urlInput.value, text: hint.textContent };
    try {
      if (!canUseWebShare(p)) throw new Error('unsupported');
      await navigator.share(p);
      feedback.textContent = 'Shared.';
      window.Notify?.success?.('Shared');
      close();
    } catch (err) {
      // Not fatal; fall back to copy
      copy();
    }
  }

  async function copy() {
    const value = urlInput.value;
    try {
      await navigator.clipboard.writeText(value);
      feedback.textContent = 'Link copied.';
      window.Notify?.success?.('Link copied');
    } catch (_) {
      // legacy fallback
      try {
        urlInput.select();
        document.execCommand('copy');
        feedback.textContent = 'Link copied.';
      } catch {
        feedback.textContent = 'Copy failed — select the link and copy manually.';
        window.Notify?.error?.('Copy failed');
      }
    }
  }

  // Wire one example trigger; also support any future element with data-share-url
  if (openBtn) {
    console.log('🔗 Share button found and bound');
    openBtn.addEventListener('click', () => {
      console.log('🔗 Share button clicked');
      open(payloadFromTrigger(openBtn));
    });
  } else {
    console.warn('🔗 Share button not found');
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-share-url]');
    if (!t) return;
    e.preventDefault();
    open(payloadFromTrigger(t));
  });

  closeBtns.forEach((b) => b.addEventListener('click', close));
  nativeBtn.addEventListener('click', shareNative);
  copyBtn.addEventListener('click', copy);

  // Deep-link support: open modal if URL contains ?share=1
  try {
    const u = new URL(location.href);
    if (u.searchParams.get('share') === '1' && canOpen()) {
      open(payloadFromTrigger(openBtn));
    }
  } catch (_) {}
})();
