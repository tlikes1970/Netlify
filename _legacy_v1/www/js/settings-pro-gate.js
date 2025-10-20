(function () {
  const PRO_KEYS = [
    { sel: '#enableEpisodeTracking', type: 'checkbox' }, // cards.episodeTracking
    { sel: '#advOn', type: 'checkbox' }, // pro.advancedNotifications
    { sel: '#themePackSelect', type: 'select' }, // pro.themePack
  ];

  function gate(isPro) {
    PRO_KEYS.forEach(({ sel }) => {
      const el = document.querySelector(sel);
      if (!el) {
        console.warn('[pro-gate] missing control', sel);
        return;
      }
      el.disabled = !isPro;
      el.classList.toggle('pro-locked', !isPro);
      if (!isPro) {
        el.setAttribute('title', 'Pro feature');
        el.setAttribute('aria-disabled', 'true');
      } else {
        el.removeAttribute('title');
        el.removeAttribute('aria-disabled');
      }
    });

    // Optional: mark section for styling
    const sec = document.querySelector('#settingsSection');
    if (sec) sec.dataset.pro = isPro ? 'true' : 'false';
  }

  function readPro() {
    // Prefer runtime flag if present
    if (window.FLAGS && typeof window.FLAGS.proEnabled === 'boolean') {
      return !!window.FLAGS.proEnabled;
    }
    // Fallback to storage if your app mirrors it there
    try {
      const raw = localStorage.getItem('flicklet:pro.enabled');
      return raw ? JSON.parse(raw) === true : false;
    } catch {
      return false;
    }
  }

  // Public hook so other code can flip Pro at runtime
  window.flickletSetPro = function (isPro) {
    try {
      window.FLAGS = window.FLAGS || {};
      window.FLAGS.proEnabled = !!isPro;
    } catch {}
    gate(!!isPro);
  };

  function init() {
    gate(readPro());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
