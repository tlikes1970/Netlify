/* ============== Utilities (Cleaned) ============== */

// ---- Global app data (single source of truth) ----
window.appData = {
  settings: {
    displayName: '',
    lang: 'en',
    theme: 'light',
    pro: false,
    notif: {},
  },
  tv: {
    watching: [],
    wishlist: [],
    watched: [],
  },
  movies: {
    watching: [],
    wishlist: [],
    watched: [],
  },
  searchCache: [],
  activeTagFilters: new Set(),
};

// ---- Persistence ----
// Keep a single-session guard to avoid repeated heavy work after quota hit
let __lsDisabled = false;

// Compute bytes for payload size checking
function computeBytes(str) {
  try {
    return new TextEncoder().encode(str).length;
  } catch {
    return (str || '').length;
  }
}

// Minimal, unified list item schema
function pruneListItem(x) {
  const isTV = x?.media_type === 'tv';
  return {
    id: Number(x?.id ?? 0),
    media_type: isTV ? 'tv' : 'movie',
    title: String(x?.title || x?.name || '').slice(0, 200),
    poster_path: x?.poster_path || null,
    release_date: String(x?.release_date || x?.first_air_date || ''),
    vote_average: typeof x?.vote_average === 'number' ? x.vote_average : null,
    added_date: x?.added_date || null,
    user_notes: x?.user_notes ? String(x.user_notes).slice(0, 500) : null,
  };
}

// Lean watchlists shape with comprehensive pruning
function pruneWatchlistsShape(data) {
  const d = JSON.parse(JSON.stringify(data || {}));
  d.watchlists = d.watchlists || {};
  d.watchlists.movies = d.watchlists.movies || {};
  d.watchlists.tv = d.watchlists.tv || {};

  // Also process direct tv and movies fields (where actual data is stored)
  d.movies = d.movies || {};
  d.tv = d.tv || {};

  const lists = ['watched', 'watching', 'wishlist'];
  for (const k of lists) {
    // Process watchlists structure (legacy)
    if (Array.isArray(d.watchlists.movies[k])) {
      d.watchlists.movies[k] = d.watchlists.movies[k]
        .filter(Boolean)
        .filter((it) => it?.media_type === 'movie' || !it?.media_type) // drop persons
        .map(pruneListItem);
    }
    if (Array.isArray(d.watchlists.tv[k])) {
      d.watchlists.tv[k] = d.watchlists.tv[k]
        .filter(Boolean)
        .map((it) => ({ ...it, media_type: 'tv' }))
        .map(pruneListItem);
    }

    // Process direct movies and tv fields (current data structure)
    if (Array.isArray(d.movies[k])) {
      d.movies[k] = d.movies[k]
        .filter(Boolean)
        .filter((it) => it?.media_type === 'movie' || !it?.media_type) // drop persons
        .map(pruneListItem);
    }
    if (Array.isArray(d.tv[k])) {
      d.tv[k] = d.tv[k]
        .filter(Boolean)
        .map((it) => ({ ...it, media_type: 'tv' }))
        .map(pruneListItem);
    }
  }
  if (d.watchlists.tv && d.watchlists.tv.undefined) delete d.watchlists.tv.undefined;
  if (d.tv && d.tv.undefined) delete d.tv.undefined;
  return d;
}

// Legacy function for backward compatibility
function pruneAppData(data) {
  return pruneWatchlistsShape(data);
}

// Exported save with guard and lean serializer
window.saveAppData = function saveAppData(key = 'flicklet-data', data = window.appData) {
  if (__lsDisabled) return false;
  try {
    // Set local timestamp before saving
    if (data && data.settings) {
      data.settings.lastUpdated = Date.now();
    }

    const pruned = pruneWatchlistsShape(data);
    const s = JSON.stringify(pruned);
    const bytes = computeBytes(s);

    // Log size for monitoring
    if (bytes > 100 * 1024) {
      // Log if > 100KB
      console.info('[saveAppData] Size:', (bytes / 1024).toFixed(1), 'KB');
    }

    localStorage.setItem(key, s);
    return true;
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e)))) {
      console.warn(
        '[saveAppData] LocalStorage quota exceeded; disabling LS saves for this session.',
      );
      __lsDisabled = true;
      return false;
    }
    console.error('[saveAppData] failed:', e);
    return false;
  }
};

window.loadAppData = function loadAppData() {
  try {
    const saved =
      localStorage.getItem('flicklet-data') || localStorage.getItem('tvMovieTrackerData');
    console.log('🔍 Loading appData from localStorage:', { saved: saved ? 'found' : 'not found' });

    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('🔍 Parsed appData:', {
        tv: parsed.tv,
        movies: parsed.movies,
        settings: parsed.settings,
      });

      // Validate data structure
      const validatedData = validateAppData(parsed);
      Object.assign(window.appData, validatedData);

      console.log('🔍 Final appData after load:', {
        tv: window.appData.tv,
        movies: window.appData.movies,
        settings: window.appData.settings,
      });
      return true;
    }
    console.log('🔍 No saved data found, using defaults');
    return false;
  } catch (e) {
    console.error('[loadAppData] failed:', e);
    return false;
  }
};

// Data validation function
function validateAppData(data) {
  if (!data || typeof data !== 'object') {
    console.warn('[validateAppData] Invalid data structure, using defaults');
    return {
      settings: { displayName: '', lang: 'en', theme: 'light', pro: false, notif: {} },
      tv: { watching: [], wishlist: [], watched: [] },
      movies: { watching: [], wishlist: [], watched: [] },
      searchCache: [],
      activeTagFilters: new Set(),
    };
  }

  // Validate settings
  let settings = data.settings || {};
  if (typeof settings !== 'object') {
    settings = {};
  }

  // Validate TV data
  let tv = data.tv || {};
  if (typeof tv !== 'object') {
    tv = {};
  }
  ['watching', 'wishlist', 'watched'].forEach((listType) => {
    if (!Array.isArray(tv[listType])) {
      tv[listType] = [];
    }
  });

  // Validate movies data
  let movies = data.movies || {};
  if (typeof movies !== 'object') {
    movies = {};
  }
  ['watching', 'wishlist', 'watched'].forEach((listType) => {
    if (!Array.isArray(movies[listType])) {
      movies[listType] = [];
    }
  });

  // Validate search cache
  const searchCache = Array.isArray(data.searchCache) ? data.searchCache : [];

  // Validate active tag filters
  const activeTagFilters = data.activeTagFilters instanceof Set ? data.activeTagFilters : new Set();

  return {
    settings,
    tv,
    movies,
    searchCache,
    activeTagFilters,
  };
}

// ---- DOM Helpers ----
window.bind = function bind(id, fn) {
  const el = document.getElementById(id);
  if (el) {
    el.onclick = fn;
    return true;
  }
  return false;
};

window.debounce = function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

window.throttle = function throttle(fn, limit) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ---- Notifications ----
window.showNotification = function showNotification(message, type = 'info', duration = 4000) {
  // Remove existing notifications
  document.querySelectorAll('.notification').forEach((n) => n.remove());

  // Create notification element
  const n = document.createElement('div');
  n.className = `notification ${type}`;
  n.setAttribute('role', 'alert');
  n.setAttribute('aria-live', 'polite');

  n.innerHTML = `<span class="notification-message">${message}</span>`;

  // Add to DOM
  document.body.appendChild(n);

  // Auto-remove after duration with fade out animation
  setTimeout(() => {
    if (n.parentNode) {
      n.style.animation = 'fadeOutScale 0.3s ease-in forwards';
      setTimeout(() => n.remove(), 300);
    }
  }, duration);

  // Log for debugging
  console.log(`🔔 Notification: ${message} (${type})`);
};

// ---- Theme & Language Helpers ----
window.toggleDarkMode = function toggleDarkMode() {
  const next = document.body.classList.toggle('dark-mode');
  appData.settings.theme = next ? 'dark' : 'light';
  localStorage.setItem('flicklet-theme', appData.settings.theme);

  // Update the theme icon
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.textContent = next ? '☀️' : '🌙';
  }
};

// changeLanguage function moved to language-manager.js for centralized management

// ---- TMDB Helpers ----
window.openTMDBLink = function openTMDBLink(id, mediaType) {
  try {
    console.log('🔗 openTMDBLink called with:', { id, mediaType });
    const base = 'https://www.themoviedb.org'; // Always use TMDB website directly
    const type = mediaType === 'tv' ? 'tv' : 'movie';
    const url = `${base}/${type}/${id}`;
    console.log('🔗 Opening URL:', url);
    window.open(url, '_blank', 'noopener');
  } catch (error) {
    console.error('❌ openTMDBLink error:', error);
    // Fallback: try to open URL anyway
    window.open(
      `https://www.themoviedb.org/${mediaType === 'tv' ? 'tv' : 'movie'}/${id}`,
      '_blank',
    );
  }
};

// ---- List & Item Utilities ----
window.findItemMediaType = function findItemMediaType(id) {
  const inTV = ['watching', 'wishlist', 'watched'].some((list) =>
    (window.appData.tv?.[list] || []).some((i) => i.id === id),
  );
  if (inTV) return 'tv';
  const inMovies = ['watching', 'wishlist', 'watched'].some((list) =>
    (window.appData.movies?.[list] || []).some((i) => i.id === id),
  );
  if (inMovies) return 'movies';
  return null;
};

window.findItemList = function findItemList(id, mediaType) {
  const lists = ['watching', 'wishlist', 'watched'];
  for (const list of lists) {
    const arr = window.appData[mediaType]?.[list] || [];
    if (arr.some((i) => i.id === id)) return list;
  }
  return null;
};

// ---- Expose utility functions globally ----
window.computeBytes = computeBytes;
window.pruneListItem = pruneListItem;
window.pruneWatchlistsShape = pruneWatchlistsShape;
