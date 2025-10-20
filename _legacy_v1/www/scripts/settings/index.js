/**
 * Process: Settings Index
 * Purpose: Mount settings panels and handle hash-based navigation
 * Data Source: URL hash and DOM elements
 * Update Path: Hash change events and settings panel mounting
 * Dependencies: renderMyRowsSettings, DOM elements
 */

(function () {
  function mountMyRowsIfHash() {
    if (location.hash !== '#my-rows' || typeof window.renderMyRowsSettings !== 'function') return;

    // Use the same strict panel finder as the action
    const panelRoot =
      document.getElementById(
        document.getElementById('settingsTab')?.getAttribute('aria-controls'),
      ) ||
      document.querySelector(
        '[role="tabpanel"][aria-labelledby="settingsTab"], #settingsSection, [data-section="settings"], #settings',
      );

    if (!panelRoot) return;

    const inner =
      panelRoot.querySelector('.content, .settings-body, .section__body, .tab-panel__body') ||
      panelRoot;
    let panel = inner.querySelector('#panel-my-rows');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'panel-my-rows';
      inner.appendChild(panel);
    }
    window.renderMyRowsSettings(panel);
  }
  window.addEventListener('hashchange', mountMyRowsIfHash);
  window.mountSettings = ((orig) =>
    function () {
      orig?.();
      mountMyRowsIfHash();
    })(window.mountSettings || null);
})();
