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
    localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
    return true;
  } catch (e) {
    console.error('[saveAppData] failed:', e);
    return false;
  }
};

window.loadAppData = function loadAppData() {
  try {
    const saved = localStorage.getItem('flicklet-data') || localStorage.getItem('tvMovieTrackerData');
    console.log('🔍 Loading appData from localStorage:', { saved: saved ? 'found' : 'not found' });
    
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('🔍 Parsed appData:', {
        tv: parsed.tv,
        movies: parsed.movies,
        settings: parsed.settings
      });
      Object.assign(window.appData, parsed);
      console.log('🔍 Final appData after load:', {
        tv: window.appData.tv,
        movies: window.appData.movies,
        settings: window.appData.settings
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

// changeLanguage function moved to language-manager.js for centralized management

// ---- TMDB Helpers ----
window.openTMDBLink = function openTMDBLink(id, mediaType) {
  try {
    console.log('🔗 openTMDBLink called with:', { id, mediaType });
    const base = 'https://www.themoviedb.org'; // Always use TMDB website directly
    const type = (mediaType === 'tv') ? 'tv' : 'movie';
    const url = `${base}/${type}/${id}`;
    console.log('🔗 Opening URL:', url);
    window.open(url, '_blank', 'noopener');
  } catch (error) {
    console.error('❌ openTMDBLink error:', error);
    // Fallback: try to open URL anyway
    window.open(`https://www.themoviedb.org/${mediaType === 'tv' ? 'tv' : 'movie'}/${id}`, '_blank');
  }
};

// ---- List & Item Utilities ----
window.findItemMediaType = function findItemMediaType(id) {
  const inTV = ['watching','wishlist','watched'].some(list => (window.appData.tv?.[list] || []).some(i => i.id === id));
  if (inTV) return 'tv';
  const inMovies = ['watching','wishlist','watched'].some(list => (window.appData.movies?.[list] || []).some(i => i.id === id));
  if (inMovies) return 'movies';
  return null;
};

window.findItemList = function findItemList(id, mediaType) {
  const lists = ['watching','wishlist','watched'];
  for (const list of lists) {
    const arr = window.appData[mediaType]?.[list] || [];
    if (arr.some(i => i.id === id)) return list;
  }
  return null;
};
