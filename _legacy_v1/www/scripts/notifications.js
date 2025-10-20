/* ========== notifications.js ==========
   Minimal notification engine with ARIA, queueing, and safe defaults.
   Public API: Notify.success/info/error(msg, opts), Notify.toast(msg, opts),
               Notify.banner(msg, type='info', opts), Notify.clearBanner()
*/

(function () {
  const toastRegion = document.getElementById('toastRegion');
  const bannerRegion = document.getElementById('bannerRegion');

  if (!toastRegion || !bannerRegion) {
    console.warn('Notifications: regions missing. Did you paste the HTML block into index.html?');
    return;
  }

  const queue = [];
  let activeToast = null;
  let toastTimer = null;

  function createToast(message, type = 'info', { duration = 4000, closeable = true } = {}) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.dataset.type = type;

    const msg = document.createElement('div');
    msg.className = 'msg';
    msg.textContent = message;

    el.appendChild(msg);

    if (closeable) {
      const btn = document.createElement('button');
      btn.className = 'close';
      btn.setAttribute('aria-label', 'Close notification');
      btn.innerHTML = '&times;';
      btn.addEventListener('click', () => hideToast(el, true));
      el.appendChild(btn);
    }

    return { el, duration };
  }

  function showNext() {
    if (activeToast || queue.length === 0) return;
    const { el, duration } = queue.shift();
    activeToast = el;
    toastRegion.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));

    if (el.dataset.type !== 'error') {
      // errors shouldn't auto-dismiss
      toastTimer = setTimeout(() => hideToast(el), duration);
    }
  }

  function hideToast(el, manual = false) {
    if (!el || el !== activeToast) return;
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    el.classList.remove('show');
    setTimeout(() => {
      el.remove();
      activeToast = null;
      showNext();
    }, 180);
  }

  function enqueueToast(message, type, opts) {
    const { el, duration } = createToast(message, type, opts);
    queue.push({ el, duration });
    showNext();
  }

  // Banner APIs
  function setBanner(message, type = 'info', { closeable = true } = {}) {
    clearBanner(); // one at a time
    const bar = document.createElement('div');
    bar.className = 'banner';
    bar.dataset.type = type;

    const msg = document.createElement('div');
    msg.className = 'msg';
    msg.textContent = message;

    bar.appendChild(msg);

    if (closeable) {
      const btn = document.createElement('button');
      btn.className = 'close';
      btn.setAttribute('aria-label', 'Close banner');
      btn.innerHTML = '&times;';
      btn.addEventListener('click', clearBanner);
      bar.appendChild(btn);
    }

    bannerRegion.appendChild(bar);
    document.body.classList.add('has-banner');
  }

  function clearBanner() {
    while (bannerRegion.firstChild) {
      bannerRegion.firstChild.remove();
    }
    document.body.classList.remove('has-banner');
  }

  // Public API
  window.Notify = {
    toast(message, opts) {
      enqueueToast(message, 'info', opts);
    },
    success(message, opts) {
      enqueueToast(message, 'success', opts);
    },
    info(message, opts) {
      enqueueToast(message, 'info', opts);
    },
    error(message, opts) {
      enqueueToast(message, 'error', Object.assign({ duration: 0 }, opts));
    }, // no auto-dismiss
    banner(message, type = 'info', opts) {
      setBanner(message, type, opts);
    },
    clearBanner,
  };
})();
