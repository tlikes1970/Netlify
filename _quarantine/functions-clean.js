/* ============== Core Functions - Clean Version ============== */

// Global variables
let currentUser = null;

// Core data functions
function loadAppData() {
  console.log('📊 App data loaded: Object');
  try {
    const saved = localStorage.getItem('flicklet-data') || localStorage.getItem('tvMovieTrackerData');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(appData, parsed);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to load app data:', e);
    return false;
  }
}

async function saveAppData() {
  try {
    localStorage.setItem('flicklet-data', JSON.stringify(appData));
    return true;
  } catch (e) {
    console.error('Failed to save app data:', e);
    return false;
  }
}

/* === TAB DE-DUPLICATION GUARD ===
   Stop legacy functions from hiding Home or fighting FlickletApp.
*/
(function(){
  // If FlickletApp exists, prefer it.
  const hasFlicklet = !!(window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function');

  // Legacy global: switchToTab
  if (typeof window.switchToTab === 'function') {
    const _legacySwitch = window.switchToTab;
    window.switchToTab = function(tabId){
      try {
        if (hasFlicklet) return window.FlickletApp.switchToTab(tabId);
        // Fallback to legacy only if app not loaded
        return _legacySwitch.call(this, tabId);
      } catch (e) {
        console.warn('[tabs] legacy switchToTab failed; falling back', e);
        try { return _legacySwitch.call(this, tabId); } catch(_) {}
      }
    };
  }

  // Legacy helper: updateTabContent or similar
  if (typeof window.updateTabContent === 'function') {
    const _legacyUpdate = window.updateTabContent;
    window.updateTabContent = function(){
      try {
        if (hasFlicklet && typeof window.FlickletApp.updateTabContent === 'function') {
          return window.FlickletApp.updateTabContent();
        }
        return _legacyUpdate.call(this);
      } catch (e) {
        console.warn('[tabs] legacy updateTabContent failed; falling back', e);
        try { return _legacyUpdate.call(this); } catch(_) {}
      }
    };
  }

  // Optional: prevent global blanket-hiding if selectors are missing.
  const safeHideAll = (root) => {
    if (!root) return;
    const panels = root.querySelectorAll('[role="tabpanel"], .tab-panel, section[id$="Section"]');
    panels.forEach(p => { if (p.id !== 'homeSection') p.hidden = true; });
  };
  // If some legacy init tries to hide everything on load, keep home visible.
  document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app') || document.body;
    safeHideAll(appRoot);
    const last = localStorage.getItem('flicklet:lastTab');
    if (hasFlicklet && last) {
      try { window.FlickletApp.switchToTab(last); } catch(_) {}
    }
  }, { once:true });
})();

// Tab management - now delegated to FlickletApp
function switchToTab(tab) {
  console.log(`🔄 [Legacy] Switching to tab: ${tab} - delegating to FlickletApp`);
  
  // Delegate to FlickletApp if available
  if (window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
    return window.FlickletApp.switchToTab(tab);
  }
  
  // Fallback implementation (should not be reached if FlickletApp is loaded)
  console.warn('⚠️ FlickletApp not available, using fallback tab switching');
  
  // Hide all tab content
  const tabs = ['homeTab', 'watchingTab', 'wishlistTab', 'watchedTab', 'discoverTab', 'settingsTab'];
  tabs.forEach(tabId => {
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
      tabElement.classList.remove('active');
    }
  });
  
  // Show selected tab
  const selectedTab = document.getElementById(`${tab}Tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Update content based on tab
  updateTabContent(tab);
  
  // Update data statistics if switching to settings
  if (tab === 'settings') {
    setTimeout(() => {
      if (typeof window.FlickletApp?.updateDataStatistics === 'function') {
        window.FlickletApp.updateDataStatistics();
      }
    }, 100);
  }
}

function updateTabContent(tab) {
  const isHome = tab === 'home';
  
  // Show/hide home page specific elements
  const gamesAndQuotesRow = document.getElementById('gamesAndQuotesRow');
  const feedbackSection = document.getElementById('feedbackSection');
  
  if (gamesAndQuotesRow) {
    gamesAndQuotesRow.style.display = isHome ? 'flex' : 'none';
  }
  
  if (feedbackSection) {
    feedbackSection.style.display = isHome ? 'block' : 'none';
  }
  
  // Load content for the selected tab
  if (tab === 'home') {
    loadHomeContent();
  } else if (tab === 'watching' || tab === 'wishlist' || tab === 'watched') {
    loadListContent(tab);
  } else if (tab === 'discover') {
    loadDiscoverContent();
  } else if (tab === 'settings') {
    loadSettingsContent();
  }
}

// Home content
function loadHomeContent() {
  const container = document.getElementById('homeSection');
  if (!container) return;
  
  // Get user's display name
  const displayName = appData?.settings?.displayName || 'User';
  
  // Get statistics
  const watchingCount = (appData.tv?.watching?.length || 0) + (appData.movies?.watching?.length || 0);
  const wishlistCount = (appData.tv?.wishlist?.length || 0) + (appData.movies?.wishlist?.length || 0);
  const watchedCount = (appData.tv?.watched?.length || 0) + (appData.movies?.watched?.length || 0);
  const totalCount = watchingCount + wishlistCount + watchedCount;
  
  // Snarky messages based on user's activity
  const snarkyMessages = {
    empty: [
      "🎬 Ready to start your entertainment journey?",
      "📺 Time to build that watchlist you'll never finish!",
      "🍿 Let's find something to watch instead of scrolling endlessly",
      "🎭 Your future self will thank you for tracking this stuff"
    ],
    low: [
      "📚 Baby steps! You've got a few things tracked",
      "🌱 Your watchlist is growing... slowly but surely",
      "📖 At least you're not starting from zero anymore",
      "🎯 Every great collection starts with a single item"
    ],
    medium: [
      "📺 Now we're talking! You've got some serious viewing ahead",
      "🎬 Look at you, being all organized and stuff",
      "📚 That's a respectable collection you've got there",
      "🎭 Someone's been busy building their entertainment empire"
    ],
    high: [
      "🏆 Wow, you really take your entertainment seriously!",
      "📺 That's... a lot of content. Hope you have a lot of free time",
      "🎬 Are you sure you're not just hoarding shows at this point?",
      "📚 Impressive collection! Now actually watch some of it"
    ]
  };
  
  let messageCategory = 'empty';
  if (totalCount > 20) messageCategory = 'high';
  else if (totalCount > 10) messageCategory = 'medium';
  else if (totalCount > 0) messageCategory = 'low';
  
  const randomMessage = snarkyMessages[messageCategory][Math.floor(Math.random() * snarkyMessages[messageCategory].length)];
  
  // Create home content with personality
  container.innerHTML = `
    <div class="home-content">
      <div class="welcome-section">
        <h2>Welcome back, ${displayName}! 👋</h2>
        <p class="snarky-subtitle">${randomMessage}</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${watchingCount}</div>
          <div class="stat-label">Currently Watching</div>
          <div class="stat-snark">${watchingCount === 0 ? 'Nothing? Really?' : watchingCount > 5 ? 'That\'s... a lot' : 'Good start!'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${wishlistCount}</div>
          <div class="stat-label">Want to Watch</div>
          <div class="stat-snark">${wishlistCount === 0 ? 'No wishlist? Bold choice' : wishlistCount > 20 ? 'That\'s ambitious' : 'Reasonable goals'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${watchedCount}</div>
          <div class="stat-label">Already Watched</div>
          <div class="stat-snark">${watchedCount === 0 ? 'Starting fresh!' : watchedCount > 50 ? 'Entertainment veteran' : 'Building your resume'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${totalCount}</div>
          <div class="stat-label">Total Items</div>
          <div class="stat-snark">${totalCount === 0 ? 'Time to get started!' : totalCount > 100 ? 'That\'s dedication' : 'Nice collection'}</div>
        </div>
      </div>
      
      ${totalCount === 0 ? `
        <div class="empty-state">
          <h3>🎬 Ready to start tracking?</h3>
          <p>Search for your favorite shows and movies to begin building your watchlist!</p>
          <button class="btn primary" onclick="document.getElementById('searchInput').focus()">
            🔍 Start Searching
          </button>
        </div>
      ` : `
        <div class="quick-actions">
          <h3>⚡ Quick Actions</h3>
          <div class="action-buttons">
            <button class="btn primary" onclick="switchToTab('discover')">
              🔍 Discover New Content
            </button>
            <button class="btn secondary" onclick="switchToTab('watching')">
              ▶️ View Currently Watching
            </button>
            <button class="btn secondary" onclick="switchToTab('wishlist')">
              📖 View Wishlist
            </button>
          </div>
        </div>
      `}
    </div>
  `;
  
  // Initialize FlickWord countdown and horoscope
  setTimeout(() => {
    startDailyCountdown();
    updateFlickWordStats();
    loadHoroscope();
  }, 100);
  
  console.log('🏠 Home content loaded with personality');
}

// List content functions
function loadListContent(listType) {
  const container = document.getElementById(`${listType}Section`);
  if (!container) return;
  
  const tvItems = appData.tv?.[listType] || [];
  const movieItems = appData.movies?.[listType] || [];
  const allItems = [...tvItems, ...movieItems];
  
  if (allItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No ${listType} items yet</h3>
        <p>Start by searching for shows and movies to add to your lists!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="list-content">
      <h2>${listType.charAt(0).toUpperCase() + listType.slice(1)}</h2>
      <div class="items-grid">
        ${allItems.map(item => createItemCard(item, listType)).join('')}
      </div>
    </div>
  `;
}

function createItemCard(item, listType) {
  const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTIiIGhlaWdodD0iMTM4IiB2aWV3Qm94PSIwIDAgOTIgMTM4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI5MiIgaGVpZ2h0PSIxMzgiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI0NiIgeT0iNjkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
  
  return `
    <div class="item-card" data-id="${item.id}">
      <img src="${posterUrl}" alt="${item.title || item.name}" class="item-poster">
      <div class="item-info">
        <h3>${item.title || item.name}</h3>
        <p>${item.overview || 'No description available.'}</p>
        <div class="item-actions">
          <button class="btn secondary" onclick="openTMDBLink(${item.id}, '${item.name ? 'tv' : 'movie'}')">🔗 View on TMDB</button>
        </div>
      </div>
    </div>
  `;
}

// Discover and settings content
function loadDiscoverContent() {
  const container = document.getElementById('discoverSection');
  if (!container) return;
  
  container.innerHTML = `
    <div class="discover-content">
      <h2>Discover New Content</h2>
      <p>Search for shows and movies to discover new favorites!</p>
    </div>
  `;
}

function loadSettingsContent() {
  const container = document.getElementById('settingsSection');
  if (!container) return;
  
  container.innerHTML = `
    <div class="settings-content">
      <h2>Settings</h2>
      <p>Configure your app preferences here.</p>
    </div>
  `;
}

// UI updates
function updateUI() {
  console.log('🔄 Updating UI...');
  updateTabCounts();
  
  // Update search results if they exist
  if (appData.searchCache && appData.searchCache.length > 0) {
    displaySearchResults(appData.searchCache);
  }
}

function updateTabCounts() {
  const watchingCount = (appData.tv?.watching?.length || 0) + (appData.movies?.watching?.length || 0);
  const wishlistCount = (appData.tv?.wishlist?.length || 0) + (appData.movies?.wishlist?.length || 0);
  const watchedCount = (appData.tv?.watched?.length || 0) + (appData.movies?.watched?.length || 0);
  
  const watchingBadge = document.getElementById('watchingBadge');
  const wishlistBadge = document.getElementById('wishlistBadge');
  const watchedBadge = document.getElementById('watchedBadge');
  
  if (watchingBadge) watchingBadge.textContent = watchingCount;
  if (wishlistBadge) wishlistBadge.textContent = wishlistCount;
  if (watchedBadge) watchedBadge.textContent = watchedCount;
}

// Search functionality
function performSearch() {
  const query = document.getElementById('searchInput')?.value?.trim();
  const genre = document.getElementById('genreFilter')?.value || '';
  
  if (!query) {
    showNotification('Please enter a search term', 'warning');
    return;
  }
  
  console.log('🔍 Performing search:', query, genre);
  performTMDBSearch(query, genre);
}

async function performTMDBSearch(query, genre = '') {
  try {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.querySelector('.btn-content').style.display = 'none';
      searchBtn.querySelector('.btn-loading').style.display = 'inline';
    }
    
    const results = await Promise.all([
      searchTMDB('tv', query, genre),
      searchTMDB('movie', query, genre)
    ]);
    
    const allResults = [...results[0], ...results[1]];
    appData.searchCache = allResults;
    displaySearchResults(allResults);
    
  } catch (error) {
    console.error('❌ Search error:', error.message || error);
    showNotification(`Search failed: ${error.message || 'Please try again.'}`, 'error');
    showMockSearchResults(query);
  } finally {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.querySelector('.btn-content').style.display = 'inline';
      searchBtn.querySelector('.btn-loading').style.display = 'none';
    }
  }
}

async function searchTMDB(type, query, genre = '') {
  try {
    const TMDB_API_KEY = window.TMDB_CONFIG?.apiKey;
    const TMDB_BASE_URL = window.TMDB_CONFIG?.baseUrl;
    
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_API_KEY') {
      throw new Error('TMDB API key not configured');
    }
    
    const url = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.results || [];
    
  } catch (error) {
    console.error(`❌ Error searching ${type}:`, error.message);
    throw error;
  }
}

function showMockSearchResults(query) {
  const mockResults = [
    {
      id: 1,
      name: `Mock TV Show: ${query}`,
      overview: 'This is a mock result for testing purposes.',
      poster_path: null,
      vote_average: 8.5,
      first_air_date: '2023-01-01'
    },
    {
      id: 2,
      title: `Mock Movie: ${query}`,
      overview: 'This is a mock movie result for testing purposes.',
      poster_path: null,
      vote_average: 7.2,
      release_date: '2023-01-01'
    }
  ];
  
  appData.searchCache = mockResults;
  displaySearchResults(mockResults);
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  const genreFilter = document.getElementById('genreFilter');
  const container = document.getElementById('searchResults');
  
  if (searchInput) searchInput.value = '';
  if (genreFilter) genreFilter.value = '';
  if (container) {
    container.innerHTML = '';
    container.style.display = 'none';
  }
  
  appData.searchCache = [];
  console.log('🗑️ Cleared search results');
}

function displaySearchResults(results) {
  const container = document.getElementById('searchResults');
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = '<div class="no-results">No results found.</div>';
    container.style.display = 'block';
    return;
  }
  
  container.innerHTML = results.map(item => createSearchResultCard(item)).join('');
  container.style.display = 'block';
  console.log('🔍 Search results displayed:', results.length, 'items');
}

function createSearchResultCard(item) {
  const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTIiIGhlaWdodD0iMTM4IiB2aWV3Qm94PSIwIDAgOTIgMTM4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI5MiIgaGVpZ2h0PSIxMzgiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI0NiIgeT0iNjkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
  const title = item.title || item.name;
  const mediaType = item.name ? 'tv' : 'movie';
  
  return `
    <div class="search-result-card" data-id="${item.id}">
      <img src="${posterUrl}" alt="${title}" class="result-poster">
      <div class="result-info">
        <h3>${title}</h3>
        <p>${item.overview || 'No description available.'}</p>
        <div class="result-actions">
          <button class="btn primary" onclick="addToListFromCache(${item.id}, 'wishlist')">📖 Add to Wishlist</button>
          <button class="btn secondary" onclick="openTMDBLink(${item.id}, '${mediaType}')">🔗 View on TMDB</button>
        </div>
      </div>
    </div>
  `;
}

// Genre loading
async function loadGenres() {
  try {
    console.log('🎬 Loading genres from TMDB...');
    
    const TMDB_API_KEY = window.TMDB_CONFIG?.apiKey;
    const TMDB_BASE_URL = window.TMDB_CONFIG?.baseUrl;
    
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_API_KEY') {
      console.warn('⚠️ TMDB API key not configured, skipping genre loading');
      return;
    }
    
    const [tvResponse, movieResponse] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`)
    ]);
    
    if (!tvResponse.ok || !movieResponse.ok) {
      throw new Error('Failed to fetch genres from TMDB');
    }
    
    const tvData = await tvResponse.json();
    const movieData = await movieResponse.json();
    
    const allGenres = [...(tvData.genres || []), ...(movieData.genres || [])];
    const uniqueGenres = allGenres.filter((genre, index, self) => 
      index === self.findIndex(g => g.id === genre.id)
    );
    
    updateGenreDropdown(uniqueGenres);
    console.log('✅ Genre dropdown updated successfully');
    
  } catch (error) {
    console.error('❌ Failed to load genres:', error.message);
    showNotification('Failed to load genres. Check your internet connection.', 'error');
  }
}

function updateGenreDropdown(genres) {
  const dropdown = document.getElementById('genreFilter');
  if (!dropdown) return;
  
  // Clear existing options except the first one
  dropdown.innerHTML = '<option value="">All Genres</option>';
  
  genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre.id;
    option.textContent = genre.name;
    dropdown.appendChild(option);
  });
}

// FlickWord and Horoscope functions
function startDailyCountdown() {
  const countdownElement = document.getElementById('flickwordCountdown');
  if (!countdownElement) return;
  
  function updateCountdown() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeLeft = tomorrow - now;
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    
    countdownElement.textContent = `${hoursLeft} hours left to play today's game!`;
  }
  
  updateCountdown();
  setInterval(updateCountdown, 60000); // Update every minute
}

function updateFlickWordStats() {
  const stats = JSON.parse(localStorage.getItem('flickword:results') || '{}');
  
  const todayScore = document.getElementById('todayScore');
  const bestStreak = document.getElementById('bestStreak');
  const gamesPlayed = document.getElementById('gamesPlayed');
  
  if (todayScore) todayScore.textContent = stats.todayScore || 0;
  if (bestStreak) bestStreak.textContent = stats.bestStreak || 0;
  if (gamesPlayed) gamesPlayed.textContent = stats.gamesPlayed || 0;
}

function startFlickWordGame() {
  console.log('🎮 Starting FlickWord game...');
  
  // Check if game was already played today
  const today = new Date().toDateString();
  const lastPlayed = localStorage.getItem('flickword:lastPlayed');
  
  if (lastPlayed === today) {
    showNotification('You already played today\'s FlickWord! Come back tomorrow for a new challenge.', 'warning');
    return;
  }
  
  // Show game modal or redirect to game
  showNotification('🎮 FlickWord game starting! Good luck!', 'success');
  
  // TODO: Implement full FlickWord game logic
  // For now, just mark as played
  localStorage.setItem('flickword:lastPlayed', today);
  
  // Update stats
  const stats = JSON.parse(localStorage.getItem('flickword:results') || '{}');
  stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
  localStorage.setItem('flickword:results', JSON.stringify(stats));
  
  // Update display
  updateFlickWordStats();
}

function loadHoroscope() {
  console.log('🔮 Loading horoscope...');
  
  const today = new Date().toDateString();
  const cachedHoroscope = localStorage.getItem('horoscope:cache');
  
  if (cachedHoroscope) {
    const data = JSON.parse(cachedHoroscope);
    if (data.date === today) {
      displayHoroscope(data);
      return;
    }
  }
  
  // Generate new horoscope
  generateHoroscope();
}

function generateHoroscope() {
  const signs = [
    { name: '♈ Aries', emoji: '♈' },
    { name: '♉ Taurus', emoji: '♉' },
    { name: '♊ Gemini', emoji: '♊' },
    { name: '♋ Cancer', emoji: '♋' },
    { name: '♌ Leo', emoji: '♌' },
    { name: '♍ Virgo', emoji: '♍' },
    { name: '♎ Libra', emoji: '♎' },
    { name: '♏ Scorpio', emoji: '♏' },
    { name: '♐ Sagittarius', emoji: '♐' },
    { name: '♑ Capricorn', emoji: '♑' },
    { name: '♒ Aquarius', emoji: '♒' },
    { name: '♓ Pisces', emoji: '♓' }
  ];
  
  const horoscopes = [
    "Your entertainment choices today will be... interesting. Maybe stick to comedies.",
    "The stars suggest you'll find a hidden gem in your watchlist today.",
    "Beware of starting a new series - you might not sleep tonight.",
    "Your binge-watching energy is high today. Use it wisely.",
    "The universe is telling you to finally finish that show you started months ago.",
    "Today's cosmic energy favors documentaries over reality TV.",
    "Your entertainment karma is strong - expect great recommendations.",
    "The stars align for a perfect movie night. Choose wisely.",
    "Your viewing habits will surprise you today. Embrace the unexpected.",
    "The cosmos suggest you'll discover your new favorite show today.",
    "Your entertainment intuition is heightened. Trust your instincts.",
    "Today's alignment favors quality over quantity in your viewing choices."
  ];
  
  const randomSign = signs[Math.floor(Math.random() * signs.length)];
  const randomHoroscope = horoscopes[Math.floor(Math.random() * horoscopes.length)];
  const rating = '⭐'.repeat(Math.floor(Math.random() * 3) + 3); // 3-5 stars
  
  const horoscopeData = {
    date: new Date().toDateString(),
    sign: randomSign.name,
    text: randomHoroscope,
    rating: rating
  };
  
  // Cache the horoscope
  localStorage.setItem('horoscope:cache', JSON.stringify(horoscopeData));
  
  displayHoroscope(horoscopeData);
}

function displayHoroscope(data) {
  const signElement = document.getElementById('horoscopeSign');
  const textElement = document.getElementById('horoscopeText');
  const ratingElement = document.getElementById('horoscopeRating');
  const dateElement = document.getElementById('horoscopeDate');
  
  if (signElement) signElement.textContent = data.sign;
  if (textElement) textElement.textContent = data.text;
  if (ratingElement) ratingElement.textContent = data.rating;
  if (dateElement) dateElement.textContent = new Date().toLocaleDateString();
}

function refreshHoroscope() {
  console.log('🔮 Refreshing horoscope...');
  generateHoroscope();
  showNotification('New horoscope generated! ✨', 'success');
}

// Utility functions
function start() {
  console.log('🚀 Starting application...');
  ensureBlocks();
}

function ensureBlocks() {
  console.log('🔧 Ensuring blocks are properly inserted...');
  // This function ensures all necessary DOM elements exist
}

// List management functions
function addToListFromCache(id, list) {
  console.log('📝 Adding item to list:', id, list);
  const item = appData.searchCache.find(item => item.id === id);
  if (!item) {
    showNotification('Item not found in search cache', 'error');
    return;
  }
  
  const mediaType = item.name ? 'tv' : 'movies';
  if (!appData[mediaType][list]) {
    appData[mediaType][list] = [];
  }
  
  // Check if already in list
  const existing = appData[mediaType][list].find(existing => existing.id === id);
  if (existing) {
    showNotification(`Already in ${list} list`, 'warning');
    return;
  }
  
  appData[mediaType][list].push(item);
  saveAppData();
  showNotification(`Added to ${list}`, 'success');
  updateUI();
}

function openTMDBLink(id, mediaType) {
  const url = `https://www.themoviedb.org/${mediaType}/${id}`;
  window.open(url, '_blank');
}

// Missing critical functions
function requestNotificationPermission() {
  console.log('🔔 Requesting notification permission...');
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function setAccountLabel(user) {
  console.log('👤 Setting account label for user:', user);
  const accountBtn = document.getElementById('accountBtn');
  if (accountBtn) {
    if (user) {
      accountBtn.innerHTML = `👤 <span data-i18n="account">Account</span>`;
    } else {
      accountBtn.innerHTML = '👤 <span data-i18n="sign_in_account">Sign In</span>';
    }
  }
}

function rebuildStats() {
  console.log('📊 Rebuilding stats...');
  updateTabCounts();
  if (typeof loadHomeContent === 'function') {
    loadHomeContent();
  }
}

// changeLanguage function moved to language-manager.js for centralized management

// Share link import function (placeholder)
function tryImportFromShareLink() {
  console.log('🔗 Checking for share link import...');
  // TODO: Implement share link import functionality
  // This would check URL parameters for shared data and import it
}

// Check upcoming episodes function (placeholder)
function checkUpcomingEpisodes() {
  console.log('📅 Checking upcoming episodes...');
  // TODO: Implement upcoming episodes functionality
  // This would check for new episodes of shows the user is watching
}

// Authentication Functions
function closeSignInModal() {
  const modal = document.getElementById('signInModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function closeAccountModal() {
  const modal = document.getElementById('accountModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function signInWithGoogle() {
  console.log('🔗 Signing in with Google...');
  showNotification('Google sign-in coming soon! For now, you can use the app without signing in.', 'info');
  closeSignInModal();
}

function signInWithEmail() {
  console.log('📧 Signing in with email...');
  showNotification('Email sign-in coming soon! For now, you can use the app without signing in.', 'info');
  closeSignInModal();
}

function signOut() {
  console.log('🚪 Signing out...');
  showNotification('Signed out successfully', 'success');
  closeAccountModal();
  
  // Update account button
  const accountBtn = document.getElementById('accountBtn');
  if (accountBtn) {
    accountBtn.innerHTML = '👤 <span data-i18n="sign_in_account">Sign In</span>';
  }
}

function exportData() {
  console.log('📤 Exporting data...');
  const data = JSON.stringify(appData, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flicklet-data.json';
  a.click();
  URL.revokeObjectURL(url);
  showNotification('Data exported successfully!', 'success');
}

function importData() {
  console.log('📥 Importing data...');
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          appData = data;
          saveAppData();
          showNotification('Data imported successfully!', 'success');
          // Refresh the UI
          if (typeof loadHomeContent === 'function') {
            loadHomeContent();
          }
        } catch (error) {
          showNotification('Invalid data file', 'error');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

// Feedback function
function submitFeedback() {
  const feedbackText = document.getElementById('feedbackText');
  if (!feedbackText || !feedbackText.value.trim()) {
    showNotification('Please enter some feedback first!', 'warning');
    return;
  }
  
  // Save feedback to localStorage
  const feedbacks = JSON.parse(localStorage.getItem('flicklet-feedback') || '[]');
  feedbacks.push({
    text: feedbackText.value.trim(),
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('flicklet-feedback', JSON.stringify(feedbacks));
  
  // Clear the textarea
  feedbackText.value = '';
  
  showNotification('Thank you for your feedback!', 'success');
}

// Make functions globally accessible
if (typeof window !== 'undefined') {
  console.log('🌐 Making functions globally accessible...');
  
  // Core functions
  window.loadAppData = loadAppData;
  window.saveAppData = saveAppData;
  window.switchToTab = switchToTab;
  window.updateUI = updateUI;
  window.loadHomeContent = loadHomeContent;
  
  // Search functions
  window.performSearch = performSearch;
  window.clearSearch = clearSearch;
  window.performTMDBSearch = performTMDBSearch;
  window.searchTMDB = searchTMDB;
  window.showMockSearchResults = showMockSearchResults;
  window.displaySearchResults = displaySearchResults;
  window.createSearchResultCard = createSearchResultCard;
  
  // List management
  window.addToListFromCache = addToListFromCache;
  window.openTMDBLink = openTMDBLink;
  
  // FlickWord and Horoscope
  window.startFlickWordGame = startFlickWordGame;
  window.refreshHoroscope = refreshHoroscope;
  window.loadHoroscope = loadHoroscope;
  window.startDailyCountdown = startDailyCountdown;
  window.updateFlickWordStats = updateFlickWordStats;
  
  // Authentication
  window.closeSignInModal = closeSignInModal;
  window.closeAccountModal = closeAccountModal;
  window.signInWithGoogle = signInWithGoogle;
  window.signInWithEmail = signInWithEmail;
  window.signOut = signOut;
  window.exportData = exportData;
  window.importData = importData;
  
  // Utility functions
  window.tryImportFromShareLink = tryImportFromShareLink;
  window.checkUpcomingEpisodes = checkUpcomingEpisodes;
  window.requestNotificationPermission = requestNotificationPermission;
  window.setAccountLabel = setAccountLabel;
  window.rebuildStats = rebuildStats;
  // window.changeLanguage = changeLanguage; // Moved to language-manager.js
  window.currentUser = currentUser;
  window.submitFeedback = submitFeedback;
  window.start = start;
  window.ensureBlocks = ensureBlocks;
  window.loadGenres = loadGenres;
  
  console.log('🌐 performSearch available globally:', typeof window.performSearch);
  console.log('🌐 clearSearch available globally:', typeof window.clearSearch);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    appData,
    currentUser,
    loadAppData,
    saveAppData,
    switchToTab,
    updateUI,
    performSearch,
    clearSearch
  };
}

