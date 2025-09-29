// www/js/marquee.js
export const Marquee = (() => {
  let el, timer = null, quotes = [], idx = 0, intervalMs = 8000;

  function bind() {
    el = document.querySelector('[data-role="marquee"]') || document.querySelector('#quoteText.quote-text');
    if (el) {
      el.removeAttribute('data-i18n'); // prevent i18n from stomping
      el.dataset.role = el.dataset.role || 'marquee';
      el.classList.add('ready','is-ready');
    }
    return !!el;
  }

  function setQuote(text) {
    if (!el && !bind()) return;
    el.textContent = text;
  }

  function detectCycleMs() {
    if (!el && !bind()) return 8000;

    // 1) If CSS animation is used, trust its duration
    const cs = getComputedStyle(el);
    const durStr = cs.animationDuration || cs.webkitAnimationDuration || '';
    const dur = parseDuration(durStr);
    if (dur > 0) return clamp(Math.ceil(dur * 1.15), 6000, 60000);

    // 2) Fallback: estimate distance / speed
    const container = el.closest('.marquee-container, .marquee, .home-group, main, body') || document.body;
    const distance = (el.scrollWidth || el.clientWidth) + (container.clientWidth || 0);
    // Try a CSS var for speed (px/s) if present
    const speedVar = parseFloat(cs.getPropertyValue('--marquee-speed')) || parseFloat(getComputedStyle(container).getPropertyValue('--marquee-speed')) || 90;
    const seconds = distance / Math.max(speedVar, 40); // prevent absurdly fast
    return clamp(Math.ceil(seconds * 1.15 * 1000), 6000, 60000);
  }

  function parseDuration(s) {
    // supports "12s, 12s" or "12000ms"
    const first = String(s).split(',')[0].trim();
    if (first.endsWith('ms')) return parseFloat(first);
    if (first.endsWith('s')) return parseFloat(first) * 1000;
    const n = parseFloat(first);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  function startRotation(list, ms) {
    stopRotation();
    if (!el && !bind()) return;

    quotes = Array.isArray(list) && list.length ? list : quotes;
    intervalMs = Number.isFinite(ms) && ms > 0 ? ms : detectCycleMs();

    idx = 0;
    setQuote(quotes[idx]);
    timer = setInterval(() => {
      idx = (idx + 1) % quotes.length;
      setQuote(quotes[idx]);
    }, intervalMs);
  }

  function stopRotation() { if (timer) clearInterval(timer), timer = null; }

  function init({ list = [], interval = null } = {}) {
    bind();
    startRotation(list, interval);
  }

  return { init, startRotation, stopRotation, setQuote };
})();