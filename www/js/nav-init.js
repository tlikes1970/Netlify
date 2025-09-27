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

  function activate(id) {
    // Hide all panels
    panels.forEach((p, k) => {
      if (p) {
        p.hidden = (k !== id);
        p.style.display = (k !== id) ? 'none' : '';
      }
    });
    
    // Update tab states
    tabs.forEach(t => {
      const isActive = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.classList.toggle('active', isActive);
    });
  }

  // Initial activation - always start with home section
  const initial = 'homeSection';
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
  });

  console.log('[nav-init] Tab navigation initialized with', tabs.length, 'tabs');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTabs);
} else {
  initTabs();
}
