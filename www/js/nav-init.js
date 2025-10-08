// www/js/nav-init.js
// PRIMARY TAB ENGINE - Single source of truth for all tab functionality
// 
// This module is the ONLY system that should handle:
// - Tab activation and state management
// - Panel visibility via [hidden] attributes
// - ARIA attributes (aria-selected, aria-controls)
// - Body class management (tab-* classes)
// - Search visibility (has-search class)
// - Tab switching events (tab:switched)
//
// NAMING CONVENTIONS:
// - activate(id): Primary function for tab switching (nav-init.js)
// - switchToTab(tab): Legacy wrapper that delegates to activate() (app.js, functions.js)
// - setCurrentTab(tab): SimpleTabManager method (deprecated)
// - All functions use consistent tab naming: 'home', 'watching', 'wishlist', 'watched', 'discover', 'settings'
window.__useLegacyTabs = window.__useLegacyTabs || false;

// Robust slug mapping - bulletproof against non-Section endings and hyphens
const slugMap = { 
  homeSection: 'home', 
  watchingSection: 'watching', 
  wishlistSection: 'wishlist', 
  watchedSection: 'watched', 
  discoverSection: 'discover', 
  settingsSection: 'settings' 
};

// Expose nav engine globally for delegation
window.navEngine = {
  activate: null, // Will be set after initialization
  slugMap: slugMap
};

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
  const allTabs = [...bar.querySelectorAll('[role="tab"]:not([aria-disabled="true"])')];
  console.log('[nav-init] All tabs before filtering:', allTabs.map(t => ({
    id: t.id,
    ariaControls: t.getAttribute('aria-controls'),
    ariaDisabled: t.getAttribute('aria-disabled'),
    ariaSelected: t.getAttribute('aria-selected'),
    hasPanel: panels.has(t.getAttribute('aria-controls'))
  })));
  
  // Debug: Check if settings tab exists in DOM
  const settingsTab = document.getElementById('settingsTab');
  console.log('[nav-init] Settings tab in DOM:', {
    exists: !!settingsTab,
    role: settingsTab?.getAttribute('role'),
    ariaDisabled: settingsTab?.getAttribute('aria-disabled'),
    ariaControls: settingsTab?.getAttribute('aria-controls'),
    display: settingsTab?.style.display,
    computedDisplay: settingsTab ? getComputedStyle(settingsTab).display : 'N/A'
  });
  
  const tabs = allTabs.filter(t => panels.has(t.getAttribute('aria-controls')));
  
  // Debug: Log filtered tabs
  console.log('[nav-init] Filtered tabs:', tabs.map(t => ({
    id: t.id,
    ariaControls: t.getAttribute('aria-controls'),
    ariaDisabled: t.getAttribute('aria-disabled'),
    ariaSelected: t.getAttribute('aria-selected')
  })));
  
  // Cache frequently accessed elements for performance
  const searchContainer = document.querySelector('.top-search');
  const fabDock = document.querySelector('.fab-dock');
  
  // Function to re-run tab discovery after authentication
  function refreshTabDiscovery() {
    console.log('[nav-init] Refreshing tab discovery after authentication...');
    const newTabs = [...bar.querySelectorAll('[role="tab"]:not([aria-disabled="true"])')].filter(t => panels.has(t.getAttribute('aria-controls')));
    console.log('[nav-init] New tabs found after auth:', newTabs.map(t => ({
      id: t.id,
      ariaControls: t.getAttribute('aria-controls'),
      ariaDisabled: t.getAttribute('aria-disabled'),
      ariaSelected: t.getAttribute('aria-selected')
    })));
    
    // Update the tabs array
    tabs.length = 0;
    tabs.push(...newTabs);
    
    console.log('[nav-init] Tab discovery refreshed. Total tabs:', tabs.length);
  }
  
  // Expose refresh function globally
  window.refreshTabDiscovery = refreshTabDiscovery;
  
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

  // STATE SYNCHRONIZATION - Ensure single source of truth
  function validateState() {
    const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
    const activePanel = document.querySelector('.tab-section:not([hidden])');
    const bodyTabClass = document.body.className.match(/\btab-([a-z0-9-]+)\b/);
    
    if (activeTab && activePanel) {
      const tabId = activeTab.getAttribute('aria-controls');
      const panelId = activePanel.id;
      
      if (tabId !== panelId) {
        console.error('[nav-init] State mismatch:', { tabId, panelId });
        return false;
      }
    }
    
    return true;
  }

  // ACCEPTANCE CHECKS
  function assertTabState() {
    const tabs = [...document.querySelectorAll('[role="tab"]:not([aria-disabled="true"])')];
    const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls'))).filter(Boolean);
    
    const selectedTabs = tabs.filter(t => t.getAttribute('aria-selected') === 'true');
    const visiblePanels = panels.filter(p => p.offsetParent !== null);
    
    console.assert(selectedTabs.length === 1, 'Exactly one tab should be selected, found:', selectedTabs.length);
    console.assert(visiblePanels.length === 1, 'Exactly one panel should be visible, found:', visiblePanels.length);
    
    if (selectedTabs.length !== 1 || visiblePanels.length !== 1) {
      console.error('[nav-init] Tab state assertion failed:', {
        selectedTabs: selectedTabs.length,
        visiblePanels: visiblePanels.length,
        selectedTab: selectedTabs[0]?.getAttribute('aria-controls'),
        visiblePanel: visiblePanels[0]?.id
      });
    }
    
    // Also validate state synchronization
    validateState();
  }

  function assertFABStability() {
    if (fabDock) {
      const rect = fabDock.getBoundingClientRect();
      const lastX = fabDock.dataset.lastX;
      const lastY = fabDock.dataset.lastY;
      
      if (lastX !== undefined && lastY !== undefined) {
        console.assert(rect.x.toString() === lastX, 'FAB X position changed:', rect.x, 'vs', lastX);
        console.assert(rect.y.toString() === lastY, 'FAB Y position changed:', rect.y, 'vs', lastY);
      }
      
      fabDock.dataset.lastX = rect.x.toString();
      fabDock.dataset.lastY = rect.y.toString();
    }
  }

  function activate(id) {
    // IDEMPOTENCE: Short-circuit if already active
    const currentActive = document.querySelector('[role="tab"][aria-selected="true"]');
    if (currentActive && currentActive.getAttribute('aria-controls') === id) {
      console.log('[nav-init] Tab already active, skipping:', id);
      return;
    }

    console.log('[nav-init] Activating tab:', id);
    console.log('[nav-init] Available panels:', Array.from(panels.keys()));
    console.log('[nav-init] Available tabs:', tabs.map(t => t.getAttribute('aria-controls')));
    
    // Performance monitoring
    const startTime = performance.now();

    // Hide all panels using hidden attribute only
    panels.forEach((p, k) => {
      if (p) {
        p.hidden = (k !== id);
        // Remove any inline style overrides
        p.style.display = '';
      } else {
        console.warn('[nav-init] Panel not found for ID:', k);
      }
    });
    
    // Update tab states - show all tabs with active styling
    tabs.forEach(t => {
      const isActive = t.getAttribute('aria-controls') === id;
      t.classList.toggle('is-active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // Set body class for tab state - remove any existing tab-* class, then add exactly one
    const tabClass = slugMap[id];
    if (!tabClass) {
      console.warn('[nav-init] Unknown tab ID:', id);
      return;
    }
    
    // Remove any existing tab-* classes with regex sweep
    document.body.className = document.body.className.replace(/\btab-[a-z0-9-]+\b/g, '').trim();
    document.body.classList.add(`tab-${tabClass}`);

    // Handle search visibility based on tab policy
    const searchAllowedTabs = ['home', 'discover']; // Define which tabs allow search
    if (searchAllowedTabs.includes(tabClass)) {
      document.body.classList.add('has-search');
    } else {
      document.body.classList.remove('has-search');
    }

    // ACCEPTANCE CHECKS - Run assertions in dev
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('netlify')) {
      assertTabState();
      assertFABStability();
    }

    // Fire event after DOM is stable
    Promise.resolve().then(() => {
      const previousId = currentActive ? currentActive.getAttribute('aria-controls') : null;
      document.dispatchEvent(new CustomEvent('tab:switched', { 
        bubbles: true, 
        composed: true, 
        detail: { id, previousId } 
      }));
      
      // Load content for the new tab
      const tabSlug = slugMap[id];
      if (tabSlug && typeof window.updateTabContent === 'function') {
        console.log('[nav-init] Loading content for tab:', tabSlug);
        // Update FlickletApp.currentTab for compatibility
        if (window.FlickletApp) {
          window.FlickletApp.currentTab = tabSlug;
        }
        window.updateTabContent(tabSlug);
      }
      
      // Performance logging
      const endTime = performance.now();
      console.log(`[nav-init] Tab activation completed in ${(endTime - startTime).toFixed(2)}ms`);
    });
  }

  // Initial activation: if a panel is already visible, respect it; else default to home
  const visible = panelIds.find(id => panels.get(id) && !panels.get(id).hidden);
  const initial = visible || 'homeSection';
  
  // Ensure all panels start hidden except the initial one
  panels.forEach((panel, id) => {
    if (panel) {
      panel.hidden = (id !== initial);
      panel.style.display = ''; // Remove any inline style overrides
    }
  });
  
  if (panels.has(initial)) {
    activate(initial);
    console.log('[nav-init] Activated initial tab:', initial);
  } else {
    // Fallback to first available panel
    const fallback = panels.keys().next().value || panelIds[0];
    if (fallback) {
      panels.get(fallback).hidden = false; // Show fallback panel
      activate(fallback);
      console.log('[nav-init] Activated fallback tab:', fallback);
    }
  }

  // Wire events - SINGLE DELEGATED LISTENER
  bar.addEventListener('click', ev => {
    // Short-circuit for settings scope
    if (ev.target.closest('[data-scope="settings"]')) {
      return; // Don't handle settings sub-tabs
    }

    const tab = ev.target.closest('[role="tab"]');
    if (!tab) return;

    ev.preventDefault();
    const id = tab.getAttribute('aria-controls');
    if (panels.has(id)) {
      activate(id);
      console.log('[nav-init] Switched to tab:', id);
    }
  }, { capture: true });

  // Arrow navigation for accessibility
  bar.addEventListener('keydown', ev => {
    const tab = ev.target.closest('[role="tab"]');
    if (!tab) return;

    const enabledTabs = [...bar.querySelectorAll('[role="tab"]:not([aria-disabled="true"])')];
    const i = enabledTabs.indexOf(tab);
    if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      const next = enabledTabs[(i + 1) % enabledTabs.length];
      next?.focus();
      next?.click();
    } else if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      const prev = enabledTabs[(i - 1 + enabledTabs.length) % enabledTabs.length];
      prev?.focus();
      prev?.click();
    }
  });

  // Expose activate function globally
  window.navEngine.activate = activate;

  console.log('[nav-init] Tab navigation initialized with', tabs.length, 'tabs');
}

// Auto-initialize when DOM is ready - EXPLICIT ORDER
// 1. DOMContentLoaded fires
// 2. Legacy shims get neutered FIRST (app.js, functions.js, SimpleTabManager)
// 3. nav-init attaches LAST to ensure it's the primary system
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Ensure legacy systems are neutered first
    if (window.FlickletApp && window.FlickletApp.switchToTab) {
      console.log('[nav-init] Legacy systems neutered, initializing primary tab engine');
    }
    initTabs();
  });
} else {
  // DOM already ready, initialize immediately
  initTabs();
}
