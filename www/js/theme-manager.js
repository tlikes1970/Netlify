/**
 * Process: Theme Manager
 * Purpose: Manages System/Light/Dark themes and Mardi Gras overlay with persistence
 * Data Source: localStorage keys 'pref_theme' and 'pref_mardi'
 * Update Path: ThemeManager.theme and ThemeManager.mardi setters
 * Dependencies: CSS variables in theme.css, settings modal controls
 */
(() => {
  const THEME_KEY = 'pref_theme'; // 'system' | 'light' | 'dark'
  const MARDI_KEY = 'pref_mardi'; // 'on' | 'off'

  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function getStored(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }
  function setStored(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch {}
  }

  function applyTheme(theme, mardi) {
    const body = document.body;
    body.setAttribute('data-theme', theme);
    body.setAttribute('data-mardi', mardi);

    // Apply Mardi Gras class for CSS styling
    if (mardi === 'on') {
      body.classList.add('mardi');
    } else {
      body.classList.remove('mardi');
    }

    // If theme is 'system', map to light/dark for variables by toggling a helper class
    // We keep data-theme for state, but compute actual dark based on media query.
    if (theme === 'system') {
      body.classList.toggle('system-dark', media.matches);
    } else {
      body.classList.remove('system-dark');
    }

    // No heavy reflow ops here; CSS variables handle the rest.
  }

  function currentComputedTheme(theme) {
    if (theme === 'system') return media.matches ? 'dark' : 'light';
    return theme;
  }

  function init() {
    const theme = getStored(THEME_KEY, 'light');
    const mardi = getStored(MARDI_KEY, 'off');
    applyTheme(theme, mardi);

    // Live-react to OS changes if using system
    media.addEventListener?.('change', (e) => {
      const t = getStored(THEME_KEY, 'light');
      if (t === 'system') applyTheme(t, getStored(MARDI_KEY, 'off'));
    });

    // Expose minimal API
    window.ThemeManager = {
      get theme() {
        return getStored(THEME_KEY, 'light');
      },
      set theme(val) {
        setStored(THEME_KEY, val);
        applyTheme(val, getStored(MARDI_KEY, 'off'));
      },
      get mardi() {
        return getStored(MARDI_KEY, 'off');
      },
      set mardi(val) {
        setStored(MARDI_KEY, val);
        applyTheme(getStored(THEME_KEY, 'light'), val);
      },
      get effectiveTheme() {
        return currentComputedTheme(getStored(THEME_KEY, 'light'));
      },
    };
  }

  document.readyState !== 'loading' ? init() : document.addEventListener('DOMContentLoaded', init);
})();
