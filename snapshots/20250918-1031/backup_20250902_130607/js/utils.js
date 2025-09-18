/* ============== Utilities (Cleaned) ============== */

// ---- Global app data (single source of truth) ----
window.appData = {
  settings: {
    displayName: '',
    lang: 'en',
    theme: 'light',
    pro: false,
    notif: {}
  },
  tv: {
    watching: [],
    wishlist: [],
    watched: []
  },
  movies: {
    watching: [],
    wishlist: [],
    watched: []
  },
  searchCache: [],
  activeTagFilters: new Set()
};

// ---- Persistence ----
window.saveAppData = function saveAppData() {
  try {
    localStorage.setItem('flicklet-data', JSON.stringify(appData));
    return true;
  } catch (e) {
    console.error('[saveAppData] failed:', e);
    return false;
  }
};

window.loadAppData = function loadAppData() {
  try {
    const saved = localStorage.getItem('flicklet-data') || localStorage.getItem('tvMovieTrackerData');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(appData, parsed);
      return true;
    }
    return false;
  } catch (e) {
    console.error('[loadAppData] failed:', e);
    return false;
  }
};

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
window.showNotification = function showNotification(message, type = 'info', duration = 3000) {
  // remove existing
  document.querySelectorAll('.notification').forEach(n => n.remove());
  const n = document.createElement('div');
  n.className = `notification ${type}`;
  n.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" aria-label="Close">×</button>
    </div>`;
  n.querySelector('.notification-close').onclick = () => n.remove();
  document.body.appendChild(n);
  setTimeout(() => n.remove(), duration);
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

window.changeLanguage = function changeLanguage(lang) {
  appData.settings.lang = lang || 'en';
  try {
    if (typeof applyTranslations === 'function') applyTranslations(appData.settings.lang);
  } catch (e) {
    console.warn('changeLanguage: translations not ready');
  }
  // Re-render search results with new language
  if (Array.isArray(appData.searchCache) && appData.searchCache.length) {
    if (typeof displaySearchResults === 'function') {
      displaySearchResults(appData.searchCache);
    }
  }
  
  // Re-render current tab content to update language
  if (typeof updateTabContent === 'function') {
    const activeTab = window.FlickletApp?.currentTab || 'home';
    updateTabContent(activeTab);
  }
  
  // Update list content with new language
  if (typeof loadListContent === 'function') {
    ['watching', 'wishlist', 'watched'].forEach(listType => {
      loadListContent(listType);
    });
  }
  
  // Update home content with new language
  if (typeof loadHomeContent === 'function') {
    loadHomeContent();
  }
  
  showNotification(`Language changed to ${lang === 'en' ? 'English' : 'Spanish'}`, 'success');
};

// ---- TMDB Helpers ----
window.openTMDBLink = function openTMDBLink(id, mediaType) {
  const base = (window.TMDB_CONFIG && window.TMDB_CONFIG.baseUrl) ? window.TMDB_CONFIG.baseUrl : 'https://www.themoviedb.org';
  const type = (mediaType === 'tv') ? 'tv' : 'movie';
  const url = `${base}/${type}/${id}`;
  window.open(url, '_blank', 'noopener');
};

// ---- List & Item Utilities ----
window.findItemMediaType = function findItemMediaType(id) {
  const inTV = ['watching','wishlist','watched'].some(list => (appData.tv?.[list] || []).some(i => i.id === id));
  if (inTV) return 'tv';
  const inMovies = ['watching','wishlist','watched'].some(list => (appData.movies?.[list] || []).some(i => i.id === id));
  if (inMovies) return 'movies';
  return null;
};

window.findItemList = function findItemList(id, mediaType) {
  const lists = ['watching','wishlist','watched'];
  for (const list of lists) {
    const arr = appData[mediaType]?.[list] || [];
    if (arr.some(i => i.id === id)) return list;
  }
  return null;
};
