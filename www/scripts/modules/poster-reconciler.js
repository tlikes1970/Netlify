/**
 * Poster Reconciler Module
 * Purpose: Handle poster/fallback visibility and geometry for home rails
 * Dependencies: None (standalone module)
 */

export function reconcilePosters(root = document) {
  const CONT = '#clean-root .rail .card .poster-container';
  const SEL_POST = 'img.poster';
  const SEL_FBWR = '.poster-fallback';
  const SEL_FBIMG = '.poster-fallback > img.poster-fallback-img';

  const applyGeometry = (el) => {
    if (!el) return;
    el.style.display = 'block';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.objectFit = 'cover';
    el.style.maxWidth = 'none';
    el.style.maxHeight = 'none';
  };

  const onReady = (cont, poster) => {
    applyGeometry(poster);
    cont.classList.add('is-ready'); // hides fallback via CSS
    window.HomeRailsMetrics && window.HomeRailsMetrics.count('poster_loaded');
  };

  const onError = (cont) => {
    cont.classList.remove('is-ready'); // show fallback
    const fbImg = cont.querySelector(SEL_FBIMG);
    applyGeometry(fbImg);
    window.HomeRailsMetrics && window.HomeRailsMetrics.count('poster_failed_zeroSize');
  };

  const wire = (cont) => {
    if (!cont || cont.__reconciled) return;
    cont.__reconciled = true;

    const poster = cont.querySelector(SEL_POST);
    const fbWrap = cont.querySelector(SEL_FBWR);
    const fbImg  = cont.querySelector(SEL_FBIMG);

    // Ensure container contributes geometry early
    cont.style.minHeight = `calc(var(--card-w,154px) * 1.5)`;

    // Start with fallback visible
    cont.classList.remove('is-ready');
    applyGeometry(poster || fbImg);

    if (!poster) {
      // No poster image—fallback stays visible
      window.HomeRailsMetrics && window.HomeRailsMetrics.count('fallback_visible');
      return;
    }

    const hasSrc = !!poster.getAttribute('src');

    // If an old reconciler removed elements, do nothing; our CSS handles visibility.
    if (hasSrc && poster.complete) {
      // Consider 'ready' only if it genuinely rendered
      if (poster.naturalWidth > 0 && poster.naturalHeight > 0) {
        onReady(cont, poster);
      } else {
        onError(cont);
      }
    }

    poster.addEventListener('load', () => {
      if (poster.naturalWidth > 0 && poster.naturalHeight > 0) {
        onReady(cont, poster);
      } else {
        onError(cont);
      }
    });

    poster.addEventListener('error', () => onError(cont));

    // Handle dynamic src changes
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.attributeName === 'src') {
          cont.classList.remove('is-ready');
        }
      }
    });
    mo.observe(poster, { attributes: true, attributeFilter: ['src'] });
  };

  root.querySelectorAll(CONT).forEach(wire);

  // Heal future updates (rails refilling)
  const globalMO = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes?.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches?.(CONT)) wire(node);
        node.querySelectorAll?.(CONT).forEach(wire);
      });
    }
  });
  globalMO.observe(document.body, { childList: true, subtree: true });
}

// Lightweight metrics shim
if (!window.HomeRailsMetrics) {
  window.HomeRailsMetrics = {
    _counters: Object.create(null),
    count(name) { this._counters[name] = (this._counters[name] || 0) + 1; },
    dump() { return { ...this._counters }; }
  };
}


