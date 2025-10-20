/**
 * Process: Settings Tie-ins System
 * Purpose: Fix Spanish persistence, FOBs visibility, and Episode Tracking toggle integration
 * Data Source: Language settings, FAB system, Episode tracking settings
 * Update Path: Modify persistence or toggle behavior in this file
 * Dependencies: Language manager, FAB system, Episode tracking system
 */

(function () {
  'use strict';

  if (window.SettingsTieIns) return; // Prevent double initialization

  console.log('⚙️ Initializing settings tie-ins system...');

  // Spanish persistence across reload
  function ensureSpanishPersistence() {
    console.log('🌍 Ensuring Spanish persistence...');

    // Get current language from appData
    const currentLang = window.appData?.settings?.lang || 'en';

    // Set HTML lang attribute
    document.documentElement.lang = currentLang;

    // Ensure language is saved to localStorage
    if (currentLang !== 'en') {
      localStorage.setItem('flicklet-language', currentLang);
    }

    // Update language manager if available
    if (window.LanguageManager) {
      try {
        window.LanguageManager.saveLanguage(currentLang);
      } catch (error) {
        console.warn('🌍 Language manager save failed:', error);
      }
    }

    // Apply translations
    if (typeof applyTranslations === 'function') {
      applyTranslations();
    }

    console.log('🌍 Spanish persistence ensured:', currentLang);
  }

  // Ensure FOBs are visible and actionable
  function ensureFOBsVisibility() {
    console.log('🔘 Ensuring FOBs visibility...');

    // Find FAB elements
    const fabs = document.querySelectorAll('.fab, .fab-left, .fab-stack');

    fabs.forEach((fab) => {
      // Ensure FABs are visible
      fab.style.display = '';
      fab.style.visibility = 'visible';
      fab.style.opacity = '1';

      // Ensure FABs are actionable
      fab.style.pointerEvents = 'auto';
      fab.style.cursor = 'pointer';

      // Remove any disabled states
      fab.disabled = false;
      fab.removeAttribute('aria-disabled');

      // Ensure proper positioning
      if (fab.classList.contains('fab-left')) {
        fab.style.position = 'relative';
        fab.style.marginRight = 'auto';
      }

      if (fab.classList.contains('fab-stack')) {
        fab.style.display = 'flex';
        fab.style.flexDirection = 'column';
        fab.style.gap = '12px';
        fab.style.marginLeft = 'auto';
      }
    });

    // Ensure FAB dock exists and is properly positioned
    const activePanel = document.querySelector('.tab-section:not([style*="display: none"])');
    if (activePanel) {
      let fabDock = activePanel.querySelector('.fab-dock');
      if (!fabDock) {
        fabDock = document.createElement('div');
        fabDock.className = 'fab-dock';
        fabDock.style.cssText = `
          position: sticky;
          bottom: 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          z-index: 30;
          pointer-events: none;
          padding: 0;
          padding-bottom: env(safe-area-inset-bottom, 0);
          margin-top: 20px;
          width: 100%;
        `;
        activePanel.appendChild(fabDock);
      }

      // Move FABs to dock
      const settingsFab = document.querySelector('.fab-left');
      const fabStack = document.querySelector('.fab-stack');

      if (settingsFab && !fabDock.contains(settingsFab)) {
        fabDock.appendChild(settingsFab);
      }

      if (fabStack && !fabDock.contains(fabStack)) {
        fabDock.appendChild(fabStack);
      }
    }

    console.log('🔘 FOBs visibility ensured');
  }

  // Episode Tracking toggle integration
  function ensureEpisodeTrackingIntegration() {
    console.log('📺 Ensuring Episode Tracking integration...');

    // Find episode tracking toggle
    const toggle = document.getElementById('enableEpisodeTracking');
    if (!toggle) {
      console.warn('📺 Episode tracking toggle not found');
      return;
    }

    // Load saved value
    const stored = localStorage.getItem('flicklet:episodeTracking:enabled');
    if (stored !== null) {
      toggle.checked = stored === 'true';
    } else {
      toggle.checked = false;
    }

    // Apply setting
    applyEpisodeTrackingSetting();

    // Add event listener
    toggle.addEventListener('change', () => {
      console.log('📺 Episode tracking toggle changed:', toggle.checked);
      applyEpisodeTrackingSetting();
    });

    console.log('📺 Episode Tracking integration ensured');
  }

  // Apply episode tracking setting
  function applyEpisodeTrackingSetting() {
    const toggle = document.getElementById('enableEpisodeTracking');
    if (!toggle) return;

    const enabled = toggle.checked;
    console.log('📺 Setting episode tracking to:', enabled);

    // Save to localStorage
    localStorage.setItem('flicklet:episodeTracking:enabled', String(enabled));

    // Update appData
    if (window.appData && window.appData.settings) {
      window.appData.settings.episodeTracking = enabled;

      // Save appData
      if (typeof window.saveAppData === 'function') {
        window.saveAppData();
      }
    }

    // Update UI based on setting
    setTimeout(() => {
      updateEpisodeTrackingUI(enabled);
    }, 100);
  }

  // Update episode tracking UI
  function updateEpisodeTrackingUI(enabled) {
    console.log('📺 Updating episode tracking UI:', enabled);

    // Find all episode tracking buttons
    const episodeButtons = document.querySelectorAll('[data-action="track-episodes"]');

    episodeButtons.forEach((button) => {
      if (enabled) {
        button.style.display = 'inline-block';
        button.disabled = false;
        button.removeAttribute('aria-disabled');
      } else {
        button.style.display = 'none';
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      }
    });

    // Update episode tracking modal if it exists
    const episodeModal = document.getElementById('episodeModal');
    if (episodeModal) {
      if (enabled) {
        episodeModal.style.display = 'block';
      } else {
        episodeModal.style.display = 'none';
      }
    }

    // Update episode tracking indicators
    const episodeIndicators = document.querySelectorAll('.episode-tracking-indicator');
    episodeIndicators.forEach((indicator) => {
      indicator.style.display = enabled ? 'block' : 'none';
    });

    console.log('📺 Episode tracking UI updated');
  }

  // Ensure settings persistence
  function ensureSettingsPersistence() {
    console.log('💾 Ensuring settings persistence...');

    // Language persistence
    ensureSpanishPersistence();

    // Theme persistence
    const theme = window.appData?.settings?.theme || 'light';
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Pro status persistence
    const isPro = window.appData?.settings?.pro || false;
    if (isPro) {
      localStorage.setItem('flicklet:pro', '1');
    } else {
      localStorage.setItem('flicklet:pro', '0');
    }

    // Notification settings persistence
    const notifSettings = window.appData?.settings?.notif || {};
    Object.entries(notifSettings).forEach(([key, value]) => {
      localStorage.setItem(`flicklet:notif:${key}`, String(value));
    });

    console.log('💾 Settings persistence ensured');
  }

  // Initialize all settings tie-ins
  function init() {
    // Ensure settings persistence
    ensureSettingsPersistence();

    // Ensure FOBs visibility
    ensureFOBsVisibility();

    // Ensure episode tracking integration
    ensureEpisodeTrackingIntegration();

    // Re-run FAB docking if available
    if (window.App && window.App.dockFABsToActiveTab) {
      window.App.dockFABsToActiveTab();
    }

    // Re-run FAB docking if available in FlickletApp
    if (window.FlickletApp && window.FlickletApp.dockFABsToActiveTab) {
      window.FlickletApp.dockFABsToActiveTab();
    }

    console.log('⚙️ Settings tie-ins system initialized');
  }

  // Public API
  window.SettingsTieIns = {
    ensureSpanishPersistence: ensureSpanishPersistence,
    ensureFOBsVisibility: ensureFOBsVisibility,
    ensureEpisodeTrackingIntegration: ensureEpisodeTrackingIntegration,
    applyEpisodeTrackingSetting: applyEpisodeTrackingSetting,
    updateEpisodeTrackingUI: updateEpisodeTrackingUI,
    ensureSettingsPersistence: ensureSettingsPersistence,
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run on tab changes
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-tab]') || e.target.closest('.tab-button')) {
      setTimeout(() => {
        ensureFOBsVisibility();
        ensureEpisodeTrackingIntegration();
      }, 100);
    }
  });
})();
