/* ============== Core Application Functions (Cleaned) ============== */

// ---- Tab / Render Pipeline ----
window.switchToTab = function switchToTab(tab) {
  if (!window.FlickletApp) return console.error('[switchToTab] FlickletApp missing');
  window.FlickletApp.switchToTab(tab);
};

window.updateTabContent = function updateTabContent(tab) {
  if (tab === 'home') {
    loadHomeContent();
  } else if (tab === 'watching' || tab === 'wishlist' || tab === 'watched') {
    loadListContent(tab);
  } else if (tab === 'discover') {
    loadDiscoverContent();
  } else if (tab === 'settings') {
    loadSettingsContent();
  }
};

window.updateUI = function updateUI() {
  if (typeof updateTabCounts === 'function') updateTabCounts();
  const tab = window.FlickletApp?.currentTab || 'home';
  updateTabContent(tab);
};

window.updateTabCounts = function updateTabCounts() {
  const counts = {
    watching: (appData.tv?.watching?.length || 0) + (appData.movies?.watching?.length || 0),
    wishlist: (appData.tv?.wishlist?.length || 0) + (appData.movies?.wishlist?.length || 0),
    watched:  (appData.tv?.watched?.length  || 0) + (appData.movies?.watched?.length  || 0),
  };
  ['watching','wishlist','watched'].forEach(list => {
    const badge = document.getElementById(`${list}Badge`);
    if (badge) badge.textContent = counts[list];
  });
};

// ---- Home ----
window.loadHomeContent = function loadHomeContent() {
  const container = document.getElementById('homeSection');
  if (!container) return;
  const name = appData?.settings?.displayName || 'User';

  const watchingCount = (appData.tv?.watching?.length || 0) + (appData.movies?.watching?.length || 0);
  const wishlistCount = (appData.tv?.wishlist?.length || 0) + (appData.movies?.wishlist?.length || 0);
  const watchedCount  = (appData.tv?.watched?.length  || 0) + (appData.movies?.watched?.length  || 0);
  const total = watchingCount + wishlistCount + watchedCount;

  container.innerHTML = `
    <div class="home-content">
      <div class="welcome-section">
        <h2>Welcome back, ${name}! 👋</h2>
        <p class="snarky-subtitle">Let's find something to watch.</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-number">${watchingCount}</div><div class="stat-label">Currently Watching</div></div>
        <div class="stat-card"><div class="stat-number">${wishlistCount}</div><div class="stat-label">Want to Watch</div></div>
        <div class="stat-card"><div class="stat-number">${watchedCount}</div><div class="stat-label">Already Watched</div></div>
        <div class="stat-card"><div class="stat-number">${total}</div><div class="stat-label">Total Items</div></div>
      </div>
    </div>`;

  // Optional extras (safe if missing)
  setTimeout(() => {
    try { startDailyCountdown?.(); } catch {}
    try { updateFlickWordStats?.(); } catch {}
    try { loadHoroscope?.(); } catch {}
  }, 50);
};

// ---- Lists ----
window.loadListContent = function loadListContent(listType) {
  const section = document.getElementById(`${listType}Section`);
  if (!section) return;

  const tvItems = appData.tv?.[listType] || [];
  const movieItems = appData.movies?.[listType] || [];
  const items = [...tvItems, ...movieItems];

  if (!items.length) {
    section.innerHTML = `<div class="empty-state"><h3>No ${listType} items yet</h3><p>Search and add shows or movies to get started.</p></div>`;
    return;
  }

  section.innerHTML = `
    <div class="list-content">
      <h2>${listType.charAt(0).toUpperCase() + listType.slice(1)}</h2>
      <div class="items-grid">${items.map(createItemCard).join('')}</div>
    </div>`;
};

window.createItemCard = function createItemCard(item) {
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTIiIGhlaWdodD0iMTM4IiB2aWV3Qm94PSIwIDAgOTIgMTM4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI5MiIgaGVpZ2h0PSIxMzgiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI0NiIgeT0iNjkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

  const title = item.name || item.title || 'Untitled';
  const date = item.first_air_date || item.release_date || '';
  const mediaType = item.name ? 'tv' : 'movie';

  return `
    <div class="show-card" data-id="${item.id}" data-media-type="${mediaType}">
      <img src="${posterUrl}" alt="${title}" class="show-poster" data-action="open" data-id="${item.id}" data-media-type="${mediaType}">
      <div class="show-details">
        <h3 class="show-title" data-action="open" data-id="${item.id}" data-media-type="${mediaType}">${title}</h3>
        <div class="show-meta">${date}</div>
        <p class="show-overview">${item.overview || 'No description available.'}</p>
        <div class="show-actions">
          <button class="btn" data-action="move" data-id="${item.id}" data-list="watching">Move to Watching</button>
          <button class="btn" data-action="move" data-id="${item.id}" data-list="wishlist">Move to Wishlist</button>
          <button class="btn" data-action="move" data-id="${item.id}" data-list="watched">Move to Watched</button>
          <button class="btn" data-action="remove" data-id="${item.id}">Remove</button>
        </div>
      </div>
    </div>`;
};

// ---- Discover / Settings ----
window.loadDiscoverContent = function loadDiscoverContent() {
  const section = document.getElementById('discoverSection');
  if (!section) return;
  section.innerHTML = `<div class="empty-state"><h3>Discover</h3><p>Recommendations coming soon.</p></div>`;
};

window.loadSettingsContent = function loadSettingsContent() {
  const section = document.getElementById('settingsSection');
  if (!section) return;
  section.innerHTML = `
    <div class="settings-content">
      <h3>⚙️ Settings</h3>
      <div class="settings-section">
        <h4>Theme</h4>
        <button id="darkModeToggle" class="btn secondary"><span id="themeIcon">🌙</span> Toggle Dark/Light Mode</button>
      </div>
      <div class="settings-section">
        <h4>Language</h4>
        <select id="langToggle">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
      <div class="settings-section">
        <h4>Data</h4>
        <button class="btn secondary" id="exportDataBtn">📤 Export Data</button>
        <button class="btn secondary" id="importDataBtn">📥 Import Data</button>
        <input id="importFile" type="file" accept="application/json" style="display:none;">
      </div>
    </div>`;

  document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);
  const langSel = document.getElementById('langToggle');
  if (langSel) {
    langSel.value = appData.settings.lang || 'en';
    langSel.addEventListener('change', (e) => changeLanguage(e.target.value));
  }

  document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
  document.getElementById('importDataBtn')?.addEventListener('click', () => document.getElementById('importFile')?.click());
  document.getElementById('importFile')?.addEventListener('change', importData);
};

// ---- Data Import / Export ----
window.exportData = function exportData() {
  const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'flicklet-export.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

window.importData = function importData(e) {
  const file = e?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      Object.assign(appData, data);
      saveAppData();
      showNotification('Data imported.', 'success');
      if (window.FlickletApp) window.FlickletApp.updateUI();
    } catch (err) {
      console.error('Import failed:', err);
      showNotification('Import failed.', 'error');
    }
  };
  reader.readAsText(file);
};

// ---- Item Management ----
window.addToListFromCache = function addToListFromCache(id, list) {
  const item = (appData.searchCache || []).find(i => i.id === id);
  if (!item) return showNotification('Item not found in cache.', 'warning');

  const mediaType = item.name ? 'tv' : 'movies';
  const target = appData[mediaType]?.[list] || [];
  if (target.some(i => i.id === id)) return showNotification(`Already in ${list}.`, 'warning');

  target.push(item);
  appData[mediaType][list] = target;
  saveAppData();
  if (window.FlickletApp) window.FlickletApp.updateUI();
  showNotification(`Added to ${list}.`, 'success');
};

window.moveItem = function moveItem(id, dest) {
  const mediaType = findItemMediaType(id);
  if (!mediaType) return;

  const sourceList = findItemList(id, mediaType);
  if (!sourceList) return;

  const srcArr = appData[mediaType][sourceList];
  const idx = srcArr.findIndex(i => i.id === id);
  if (idx === -1) return;

  const [item] = srcArr.splice(idx, 1);
  appData[mediaType][dest].push(item);
  saveAppData();
  if (window.FlickletApp) window.FlickletApp.updateUI();
  showNotification(`Moved to ${dest}.`, 'success');
};

window.removeItemFromCurrentList = function removeItemFromCurrentList(id) {
  const mediaType = findItemMediaType(id);
  if (!mediaType) return;
  const list = findItemList(id, mediaType);
  if (!list) return;
  appData[mediaType][list] = appData[mediaType][list].filter(i => i.id !== id);
  saveAppData();
  if (window.FlickletApp) window.FlickletApp.updateUI();
  showNotification('Removed.', 'success');
};

window.setRating = function setRating(id, rating) {
  const mediaType = findItemMediaType(id);
  if (!mediaType) return;
  const list = findItemList(id, mediaType);
  if (!list) return;
  const item = appData[mediaType][list].find(i => i.id === id);
  if (item) {
    item.user_rating = rating;
    saveAppData();
    showNotification('Rating saved.', 'success');
  }
};

window.setLikeStatus = function setLikeStatus(id, status) {
  const mediaType = findItemMediaType(id);
  if (!mediaType) return;
  const list = findItemList(id, mediaType);
  if (!list) return;
  const item = appData[mediaType][list].find(i => i.id === id);
  if (item) {
    item.user_like = status; // 'like' | 'dislike'
    saveAppData();
    showNotification('Preference saved.', 'success');
  }
};
