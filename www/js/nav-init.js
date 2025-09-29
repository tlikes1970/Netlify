// www/js/nav-init.js
// Minimal, robust tab navigation initializer

export function initTabs() {
  const bar = document.querySelector('#navigation[role="tablist"], nav[role="tablist"]');
  if (!bar) {
    console.warn('[nav-init] No tab bar found');
    return;
  }

  // Discover panels by ID; adjust list only if needed
  const panelIds = ['homeSection', 'watchingSection', 'wishlistSection', 'watchedSection', 'discoverSection', 'settingsSection']
    .filter(id => document.getElementById(id));

  const panels = new Map(panelIds.map(id => [id, document.getElementById(id)]));
  const tabs = [...bar.querySelectorAll('[role="tab"]')].filter(t => panels.has(t.getAttribute('aria-controls')));
  
  // Ensure each tab has a visible text label
  tabs.forEach(t => {
    if (!t.querySelector('.tab-label')) {
      const span = document.createElement('span');
      span.className = 'tab-label';
      span.textContent = (t.textContent || t.getAttribute('aria-label') || 'Tab').trim();
      
      // Preserve existing badges when clearing innerHTML
      const existingBadges = [...t.querySelectorAll('.badge')];
      t.innerHTML = '';
      t.appendChild(span);
      
      // Re-add existing badges
      existingBadges.forEach(badge => t.appendChild(badge));
    }
    // If any stray number nodes exist, wrap as badge
    const textOnly = t.querySelector('.tab-label');
    [...t.childNodes].forEach(n => {
      if (n.nodeType === 3 && n.textContent.trim().match(/^\d+$/)) {
        const b = document.createElement('span');
        b.className = 'badge';
        b.textContent = n.textContent.trim();
        t.appendChild(b);
        n.remove();
      }
    });
  });

  function activate(id) {
    // Hide all panels
    panels.forEach((p, k) => {
      if (p) {
        p.hidden = (k !== id);
        p.style.display = (k !== id) ? 'none' : '';
      }
    });
    
    // Update tab states - show all tabs with active styling
    tabs.forEach(t => {
      const isActive = t.getAttribute('aria-controls') === id;
      t.classList.toggle('is-active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }

  // Initial activation: if a panel is already visible, respect it; else default to first
  const visible = panelIds.find(id => panels.get(id) && !panels.get(id).hidden);
  const initial = visible || 'homeSection';
  if (panels.has(initial)) {
    activate(initial);
    console.log('[nav-init] Activated initial tab:', initial);
  } else {
    // Fallback to first available panel
    const fallback = panels.keys().next().value || panelIds[0];
    if (fallback) {
      activate(fallback);
      console.log('[nav-init] Activated fallback tab:', fallback);
    }
  }

  // Wire events
  tabs.forEach(t => {
    t.addEventListener('click', ev => {
      ev.preventDefault();
      const id = t.getAttribute('aria-controls');
      if (panels.has(id)) {
        activate(id);
        console.log('[nav-init] Switched to tab:', id);
      }
    }, { capture: true });

    // Arrow navigation for accessibility
    t.addEventListener('keydown', ev => {
      const i = tabs.indexOf(t);
      if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        const next = tabs[(i + 1) % tabs.length];
        next?.focus();
        next?.click();
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        const prev = tabs[(i - 1 + tabs.length) % tabs.length];
        prev?.focus();
        prev?.click();
      }
    });
  });

  console.log('[nav-init] Tab navigation initialized with', tabs.length, 'tabs');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTabs);
} else {
  initTabs();
}
