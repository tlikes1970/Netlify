/**
 * Process: Settings Manager
 * Purpose: Single source of truth for all settings load/save operations
 * Data Source: localStorage and Firebase (when authenticated)
 * Update Path: Modify settings here to update across entire application
 * Dependencies: All settings consumers should listen to settings:changed event
 */

(function () {
  'use strict';

  const NS = '[settings-manager]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  // Default settings - Pro is OFF by default unless user account says otherwise
  const DEFAULT_SETTINGS = {
    theme: 'light',
    lang: 'en',
    pro: false, // Default to false - only true if user account has Pro
    isPro: false, // Alias for pro
    episodeTracking: false,
    username: '',
    displayName: '',
    usernamePrompted: false,
    notif: {
      theme: 'light',
      episodes: false,
      digest: false,
      discover: false,
      pro: false,
    },
  };

  // Settings manager instance
  const SettingsManager = {
    _settings: null,
    _initialized: false,

    /**
     * Initialize settings manager
     */
    init() {
      if (this._initialized) return;

      log('Initializing settings manager');

      // Load settings from localStorage
      this._loadFromLocalStorage();

      // Listen for auth changes to sync Pro status
      document.addEventListener('auth:changed', (event) => {
        this._handleAuthChange(event.detail.user);
      });

      this._initialized = true;
      log('Settings manager initialized');
    },

    /**
     * Load settings from localStorage
     */
    _loadFromLocalStorage() {
      try {
        const stored = localStorage.getItem('flicklet-data');
        if (stored) {
          const data = JSON.parse(stored);
          this._settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
        } else {
          this._settings = { ...DEFAULT_SETTINGS };
        }

        // Ensure Pro is false by default unless explicitly set
        if (this._settings.pro === undefined) {
          this._settings.pro = false;
        }
        if (this._settings.isPro === undefined) {
          this._settings.isPro = this._settings.pro;
        }

        log('Settings loaded from localStorage:', this._settings);
      } catch (e) {
        warn('Failed to load settings from localStorage:', e);
        this._settings = { ...DEFAULT_SETTINGS };
      }
    },

    /**
     * Save settings to localStorage
     */
    _saveToLocalStorage() {
      try {
        const stored = localStorage.getItem('flicklet-data');
        const data = stored ? JSON.parse(stored) : {};
        data.settings = this._settings;
        localStorage.setItem('flicklet-data', JSON.stringify(data));
        log('Settings saved to localStorage');
      } catch (e) {
        err('Failed to save settings to localStorage:', e);
      }
    },

    /**
     * Handle auth state changes
     */
    _handleAuthChange(user) {
      if (user) {
        // User signed in - check if they have Pro status
        this._checkProStatus(user);
      } else {
        // User signed out - reset Pro to false
        this.set('pro', false);
        this.set('isPro', false);
        log('User signed out - Pro reset to false');
      }
    },

    /**
     * Check Pro status from user account
     */
    async _checkProStatus(user) {
      try {
        // Check Firebase for Pro status
        if (window.firebaseDb && user.uid) {
          const userDoc = await window.firebaseDb.collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const hasPro = userData.pro === true || userData.settings?.pro === true;

            if (hasPro !== this._settings.pro) {
              this.set('pro', hasPro);
              this.set('isPro', hasPro);
              log('Pro status updated from Firebase:', hasPro);
            }
          }
        }
      } catch (e) {
        warn('Failed to check Pro status from Firebase:', e);
      }
    },

    /**
     * Get a setting value
     */
    get(key, defaultValue = null) {
      if (!this._initialized) {
        this.init();
      }

      if (key === undefined) {
        return { ...this._settings };
      }

      return this._settings[key] !== undefined ? this._settings[key] : defaultValue;
    },

    /**
     * Set a setting value
     */
    set(key, value) {
      if (!this._initialized) {
        this.init();
      }

      const oldValue = this._settings[key];
      this._settings[key] = value;

      // Sync isPro with pro
      if (key === 'pro') {
        this._settings.isPro = value;
      } else if (key === 'isPro') {
        this._settings.pro = value;
      }

      // Save to localStorage
      this._saveToLocalStorage();

      // Emit settings changed event
      this._emitSettingsChanged(key, value, oldValue);

      log(`Setting changed: ${key} = ${value} (was: ${oldValue})`);
    },

    /**
     * Update multiple settings at once
     */
    update(settings) {
      if (!this._initialized) {
        this.init();
      }

      const changes = [];

      for (const [key, value] of Object.entries(settings)) {
        const oldValue = this._settings[key];
        this._settings[key] = value;

        // Sync isPro with pro
        if (key === 'pro') {
          this._settings.isPro = value;
        } else if (key === 'isPro') {
          this._settings.pro = value;
        }

        changes.push({ key, value, oldValue });
      }

      // Save to localStorage
      this._saveToLocalStorage();

      // Emit settings changed event
      this._emitSettingsChanged('bulk', changes);

      log('Multiple settings updated:', changes);
    },

    /**
     * Emit settings changed event
     */
    _emitSettingsChanged(key, value, oldValue) {
      const event = new CustomEvent('settings:changed', {
        detail: {
          key,
          value,
          oldValue,
          settings: { ...this._settings },
          timestamp: Date.now(),
        },
      });

      document.dispatchEvent(event);
      log('Emitted settings:changed event:', { key, value, oldValue });
    },

    /**
     * Reset settings to defaults
     */
    reset() {
      this._settings = { ...DEFAULT_SETTINGS };
      this._saveToLocalStorage();
      this._emitSettingsChanged('reset', this._settings, null);
      log('Settings reset to defaults');
    },

    /**
     * Check if Pro is enabled
     */
    isPro() {
      return this.get('pro', false);
    },

    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature) {
      const featureFlags = {
        pro: this.isPro(),
        episodeTracking: this.get('episodeTracking', false),
        notifications: this.get('notif.episodes', false),
        digest: this.get('notif.digest', false),
        discover: this.get('notif.discover', false),
      };

      return featureFlags[feature] || false;
    },
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SettingsManager.init());
  } else {
    SettingsManager.init();
  }

  // Expose globally
  window.SettingsManager = SettingsManager;

  log('Settings manager module loaded');
})();
