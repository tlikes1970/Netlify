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
  
  // Don't replace the entire content - just initialize the existing sections
  console.log('🏠 Loading home content - initializing existing sections');
  
  // Initialize the existing sections
  setTimeout(() => {
    try { startDailyCountdown?.(); } catch {}
    try { updateFlickWordStats?.(); } catch {}
    try { loadHoroscope?.(); } catch {}
  }, 50);
};

// ---- Lists ----
window.loadListContent = function loadListContent(listType) {
  const container = document.getElementById(`${listType}List`);
  if (!container) {
    console.error(`Container not found: ${listType}List`);
    return;
  }

  const tvItems = appData.tv?.[listType] || [];
  const movieItems = appData.movies?.[listType] || [];
  const items = [...tvItems, ...movieItems];

  console.log(`📋 Loading ${listType} content: ${items.length} items`);

  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><h3>No ${listType} items yet</h3><p>Search and add shows or movies to get started.</p></div>`;
    return;
  }

  container.innerHTML = items.map(createItemCard).join('');
  console.log(`✅ ${listType} content loaded with ${items.length} items`);
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

// ---- Modal Functions ----
window.closeAccountModal = function closeAccountModal() {
  const modal = document.getElementById('accountModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('modal-backdrop');
  }
};

window.closeSignInModal = function closeSignInModal() {
  const modal = document.getElementById('signInModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('modal-backdrop');
  }
};

window.showAccountModal = function showAccountModal() {
  const modal = document.getElementById('accountModal');
  if (modal) {
    modal.style.display = 'block';
    modal.classList.add('modal-backdrop');
  }
};

window.showSignInModal = function showSignInModal() {
  const modal = document.getElementById('signInModal');
  if (modal) {
    modal.style.display = 'block';
    modal.classList.add('modal-backdrop');
  }
};

// ---- Home Page Functions ----
window.startDailyCountdown = function startDailyCountdown() {
  const countdownElement = document.getElementById('flickwordCountdown');
  if (!countdownElement) return;
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const updateCountdown = () => {
    const timeLeft = tomorrow - new Date();
    if (timeLeft <= 0) {
      countdownElement.textContent = 'New word available!';
      return;
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    countdownElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  updateCountdown();
  setInterval(updateCountdown, 1000);
};

window.updateFlickWordStats = function updateFlickWordStats() {
  const todayScore = document.getElementById('todayScore');
  const bestStreak = document.getElementById('bestStreak');
  const gamesPlayed = document.getElementById('gamesPlayed');
  
  if (todayScore) todayScore.textContent = appData.flickword?.todayScore || 0;
  if (bestStreak) bestStreak.textContent = appData.flickword?.bestStreak || '-';
  if (gamesPlayed) gamesPlayed.textContent = appData.flickword?.gamesPlayed || 0;
};

window.loadHoroscope = function loadHoroscope() {
  const horoscopeText = document.getElementById('horoscopeText');
  if (!horoscopeText) return;
  
  const horoscopes = [
    "Your binge-watching energy is high today. Perfect for starting that new series!",
    "The stars suggest you'll discover a hidden gem in your recommendations.",
    "A classic rewatch is in your future. Time to revisit an old favorite!",
    "Your streaming karma is excellent. Expect great new releases today.",
    "The algorithm gods smile upon you. Your next obsession awaits!",
    "A perfect day for catching up on that show everyone's talking about."
  ];
  
  const randomHoroscope = horoscopes[Math.floor(Math.random() * horoscopes.length)];
  horoscopeText.textContent = randomHoroscope;
};

window.startFlickWordGame = function startFlickWordGame() {
  showNotification('FlickWord game starting soon! 🎮', 'success');
};

window.submitFeedback = function submitFeedback() {
  const feedbackText = document.getElementById('feedbackText');
  if (!feedbackText || !feedbackText.value.trim()) {
    showNotification('Please enter some feedback first!', 'warning');
    return;
  }
  
  showNotification('Thanks for your feedback! 💬', 'success');
  feedbackText.value = '';
};

// ---- Search Results ----
window.displaySearchResults = function displaySearchResults(results) {
  const container = document.getElementById('searchResults');
  if (!container) return;
  
  if (!results || results.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  container.innerHTML = results.map(createSearchResultCard).join('');
  
  // Show tabs for search results
  if (typeof showTabsForSearch === 'function') {
    showTabsForSearch();
  }
};

window.createSearchResultCard = function createSearchResultCard(item) {
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTIiIGhlaWdodD0iMTM4IiB2aWV3Qm94PSIwIDAgOTIgMTM4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI5MiIgaGVpZ2h0PSIxMzgiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI0NiIgeT0iNjkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
  
  const title = item.name || item.title || 'Untitled';
  const date = item.first_air_date || item.release_date || '';
  const mediaType = item.name ? 'tv' : 'movie';
  const lang = appData?.settings?.lang || 'en';
  
  // Language-specific button text
  const buttonTexts = {
    en: {
      addWatching: 'Add to Watching',
      addWishlist: 'Add to Wishlist', 
      addWatched: 'Add to Watched',
      notInterested: 'Not Interested'
    },
    es: {
      addWatching: 'Agregar a Viendo',
      addWishlist: 'Agregar a Lista',
      addWatched: 'Agregar a Visto',
      notInterested: 'No Interesado'
    }
  };
  
  const texts = buttonTexts[lang] || buttonTexts.en;
  
  return `
    <div class="show-card" data-id="${item.id}" data-media-type="${mediaType}">
      <img src="${posterUrl}" alt="${title}" class="show-poster" data-action="open" data-id="${item.id}" data-media-type="${mediaType}">
      <div class="show-details">
        <h3 class="show-title" data-action="open" data-id="${item.id}" data-media-type="${mediaType}">${title}</h3>
        <div class="show-meta">${date}</div>
        <p class="show-overview">${item.overview || 'No description available.'}</p>
        <div class="show-actions">
          <button class="btn" data-action="addFromCache" data-id="${item.id}" data-list="watching">${texts.addWatching}</button>
          <button class="btn" data-action="addFromCache" data-id="${item.id}" data-list="wishlist">${texts.addWishlist}</button>
          <button class="btn" data-action="addFromCache" data-id="${item.id}" data-list="watched">${texts.addWatched}</button>
          <button class="btn" data-action="notInterested" data-id="${item.id}">${texts.notInterested}</button>
        </div>
      </div>
    </div>`;
};

window.showTabsForSearch = function showTabsForSearch() {
  const tabContainer = document.querySelector('.tab-container');
  if (tabContainer) {
    tabContainer.style.display = 'flex';
  }
};

window.hideTabsForSearch = function hideTabsForSearch() {
  const tabContainer = document.querySelector('.tab-container');
  if (tabContainer) {
    tabContainer.style.display = 'flex';
  }
};

// ---- Item Actions ----
window.addToListFromCache = function addToListFromCache(itemId, listType) {
  const item = appData.searchCache.find(item => item.id === itemId);
  if (!item) {
    showNotification('Item not found in search cache', 'error');
    return;
  }
  
  const mediaType = item.name ? 'tv' : 'movie';
  
  if (!appData[mediaType]) {
    appData[mediaType] = {};
  }
  if (!appData[mediaType][listType]) {
    appData[mediaType][listType] = [];
  }
  
  // Check if already exists
  if (appData[mediaType][listType].some(existing => existing.id === itemId)) {
    showNotification('Item already in this list', 'warning');
    return;
  }
  
  appData[mediaType][listType].push(item);
  saveAppData();
  updateUI();
  showNotification(`Added to ${listType} list!`, 'success');
};

window.notInterested = function notInterested(itemId) {
  const item = appData.searchCache.find(item => item.id === itemId);
  if (!item) {
    showNotification('Item not found in search cache', 'error');
    return;
  }
  
  if (!appData.notInterested) {
    appData.notInterested = [];
  }
  
  if (appData.notInterested.some(existing => existing.id === itemId)) {
    showNotification('Already marked as not interested', 'warning');
    return;
  }
  
  appData.notInterested.push(item);
  saveAppData();
  showNotification('Item marked as not interested', 'success');
};

// ---- Account Functions ----
window.handleAccountClick = function handleAccountClick() {
  if (appData.settings.displayName) {
    showAccountModal();
  } else {
    showSignInModal();
  }
};

// ---- Username Prompt ----
window.promptForUsername = function promptForUsername() {
  const currentName = appData.settings.displayName || '';
  const newName = prompt('What should we call you?', currentName);
  
  if (newName && newName.trim()) {
    appData.settings.displayName = newName.trim();
    saveAppData();
    updateHeaderWithUsername();
    showNotification(`Welcome, ${newName}! 👋`, 'success');
  }
};

window.updateHeaderWithUsername = function updateHeaderWithUsername() {
  const name = appData.settings.displayName || 'User';
  const usernameElement = document.getElementById('dynamicUsername');
  const snarkElement = document.getElementById('dynamicSnark');
  
  if (usernameElement) {
    usernameElement.textContent = `Welcome back, ${name}! 👋`;
  }
  
  if (snarkElement) {
    const snarkyMessages = [
      'Let\'s find something to watch.',
      'Ready to track your shows',
      'Time to binge responsibly',
      'Your watchlist awaits',
      'Let\'s discover something amazing'
    ];
    const randomSnark = snarkyMessages[Math.floor(Math.random() * snarkyMessages.length)];
    snarkElement.textContent = randomSnark;
  }
};
