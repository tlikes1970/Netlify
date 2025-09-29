/**
 * Process: Settings Modal
 * Purpose: Manages Settings modal UI and connects controls to ThemeManager
 * Data Source: ThemeManager API and modal form controls
 * Update Path: User interactions with theme and mardi controls
 * Dependencies: theme-manager.js, modal HTML structure
 */
(() => {
  let firstFocus, lastFocus, previouslyFocused;

  function openModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    previouslyFocused = document.activeElement;
    modal.hidden = false;

    // Initialize controls from state
    const theme = window.ThemeManager?.theme ?? 'light';
    const mardi = window.ThemeManager?.mardi ?? 'off';

    document.getElementById('themeSystem').checked = theme === 'system';
    document.getElementById('themeLight').checked = theme === 'light';
    document.getElementById('themeDark').checked = theme === 'dark';
    document.getElementById('mardiOverlayToggle').checked = mardi === 'on';

    // Focus trap
    const focusables = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocus = focusables[0];
    lastFocus = focusables[focusables.length - 1];
    firstFocus?.focus();

    function onKey(e) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocus) {
          e.preventDefault();
          lastFocus?.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocus) {
          e.preventDefault();
          firstFocus?.focus();
        }
      }
    }
    modal.addEventListener('keydown', onKey, { once: false });
    modal.dataset.keyListener = 'true';
  }

  function closeModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    modal.hidden = true;
    if (previouslyFocused) previouslyFocused.focus();

    // Clean up key listener
    if (modal.dataset.keyListener) {
      modal.removeEventListener('keydown', modal.onKey);
      delete modal.dataset.keyListener;
    }
  }

  function onChange(e) {
    const t = e.target;
    if (t.name === 'theme') {
      window.ThemeManager.theme = t.value; // 'system'|'light'|'dark'
    }
    if (t.id === 'mardiOverlayToggle') {
      window.ThemeManager.mardi = t.checked ? 'on' : 'off';
    }
  }

  function init() {
    const btn = document.getElementById('btnSettings');
    const close = document.getElementById('settingsClose');
    const modal = document.getElementById('settingsModal');

    // NOTE: btnSettings is now a FAB that goes to settings screen, not modal
    // The modal is opened by other means (like the settings tab button)
    // if (btn) {
    //   btn.addEventListener('click', openModal);
    // }

    if (close) {
      close.addEventListener('click', closeModal);
    }

    if (modal) {
      modal.addEventListener('change', onChange);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
  }

  document.readyState !== 'loading' ? init() : document.addEventListener('DOMContentLoaded', init);
})();
