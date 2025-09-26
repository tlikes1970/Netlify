/* ============== Core Application Functions (Cleaned) ============== */
(function () {
  'use strict';
  // Safe polyfill for guard function
  window.guard ||= (cond, fn) => {
    if (cond && typeof fn === 'function') fn();
  };
  // ==== Mobile polish guard (feature-flagged) ====
  // Ensure a FLAGS bucket exists
  window.FLAGS = window.FLAGS || {};
  if (typeof window.FLAGS.mobilePolishGuard === 'undefined') {
    window.FLAGS.mobilePolishGuard = true; // default ON
  }
  // WatchlistsAdapter is now the canonical data source (v28.33)
  window.mobilePolishGate = function mobilePolishGate() {
    if (!window.FLAGS.mobilePolishGuard) {
      FlickletDebug.info('📱 Mobile polish guard disabled via FLAGS.mobilePolishGuard=false');
      return;
    }
    // Prevent multiple initializations
    if (window._mobilePolishInitialized) {
      FlickletDebug.info('📱 Mobile polish already initialized, skipping');
      return;
    }
    window._mobilePolishInitialized = true;
    const MOBILE_BP = 640; // px
    const forced = localStorage.getItem('forceMobileV1') === '1';
    function applyMobileFlag() {
      // Fallback for FlickletDebug if not loaded
      const debug = window.FlickletDebug || {
        info: console.log,
        warn: console.warn,
        error: console.error,
      };
      const viewportWidth = window.innerWidth;
      const isMobileViewport = viewportWidth <= MOBILE_BP;
      // More comprehensive mobile device detection
      const userAgent = navigator.userAgent;
      const isMobileDevice =
        /iPhone|iPad|iPod|Android|Mobile|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i.test(
          userAgent,
        );
      const isMobileSize = viewportWidth <= 640;
      const isIPhone = /iPhone/i.test(userAgent);
      // Debug info (only log once to prevent spam)
      if (!window._mobileDebugLogged) {
        debug.info(`📱 Mobile detection debug:`, {
          viewportWidth,
          userAgent: userAgent.substring(0, 50) + '...',
          isMobileViewport,
          isMobileDevice,
          isMobileSize,
          isIPhone,
          forced,
        });
        window._mobileDebugLogged = true;
      }
      // More aggressive mobile detection - force iPhone to mobile
      const enable =
        forced ||
        isMobileDevice ||
        isMobileViewport ||
        isMobileSize ||
        isIPhone ||
        viewportWidth <= 768;
      document.body.classList.toggle('mobile-v1', enable);
      debug.info(
        `📱 Mobile polish ${enable ? 'ENABLED' : 'DISABLED'} — vw:${viewportWidth} (device: ${isMobileDevice}, viewport: ${isMobileViewport}, size: ${isMobileSize})`,
      );
    }
    // Apply when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyMobileFlag);
    } else {
      applyMobileFlag();
    }
    // Listen for viewport changes (throttled to prevent loops)
    let resizeTimeout;
    window.addEventListener(
      'resize',
      () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(applyMobileFlag, 250); // Throttle to 250ms
      },
      { passive: true },
    );
    window.addEventListener('orientationchange', () => {
      // Delay after orientation change to let viewport settle
      setTimeout(applyMobileFlag, 100);
    });
  };
  // Run mobile polish guard once
  mobilePolishGate(); // Run immediately
  // ---- Data Ready Event Listener ----
  // Re-render when data is ready/updated
  window.addEventListener('app:data:ready', () => {
    console.log('🔄 Data ready event received, updating lists...');
    // Clean up duplicates first
    if (typeof window.cleanupDuplicateCards === 'function') {
      window.cleanupDuplicateCards();
    }
    // Only render if not already rendered
    ['watching', 'wishlist', 'watched'].forEach((listType) => {
      if (!window[`render_${listType}`]) {
        loadListContent(listType);
      }
    });
    // Emit cards:changed event for centralized count updates
    document.dispatchEvent(
      new CustomEvent('cards:changed', {
        detail: { source: 'loadListContent' },
      }),
    );
    // Update home content if on home tab (only if not already rendered)
    if (typeof window.loadHomeContent === 'function' && !window.render_home) {
      window.loadHomeContent();
    }
  });
  // ---- Helper Functions ----
  /**
   * Count actual rendered items in a list container
   */
  function countRenderedItems(listType) {
    try {
      const container = document.getElementById(`${listType}List`);
      if (!container) return 0;
      // Count cards with data attributes
      const cards = container.querySelectorAll('[data-item-id][data-list-type]');
      return cards.length;
    } catch (e) {
      console.warn(`[countRenderedItems] Failed for ${listType}:`, e?.message || e);
      return 0;
    }
  }
  // ---- Tab / Render Pipeline ----
  // Global switchToTab function as fallback
  window.switchToTab = function switchToTab(tab) {
    if (!window.FlickletApp) {
      console.error('[switchToTab] FlickletApp missing');
      return;
    }
    if (typeof window.FlickletApp.switchToTab === 'function') {
      window.FlickletApp.switchToTab(tab);
    } else {
      console.error('[switchToTab] FlickletApp.switchToTab not available');
    }
  };
  window.updateTabContent = function updateTabContent(tab) {
    console.log(`🔄 updateTabContent called for tab: ${tab}`);
    if (tab === 'home') {
      loadHomeContent();
    } else if (tab === 'watching' || tab === 'wishlist' || tab === 'watched') {
      console.log(`🔄 Calling loadListContent for ${tab}`);
      loadListContent(tab);
    } else if (tab === 'discover') {
      loadDiscoverContent();
    } else if (tab === 'settings') {
      loadSettingsContent();
    }
  };
  window.updateUI = function updateUI() {
    // Emit cards:changed event for centralized count updates
    document.dispatchEvent(
      new CustomEvent('cards:changed', {
        detail: { source: 'updateUI' },
      }),
    );
    const tab = window.FlickletApp?.currentTab || 'home';
    updateTabContent(tab);
  };
  // STEP 3.2 — Rerender the active tab's content if it matches a given list
  function rerenderIfVisible(list) {
    const current = window.FlickletApp?.currentTab;
    if (current && current === list) {
      if (typeof window.updateTabContent === 'function') {
        window.updateTabContent(list);
      } else if (typeof window.FlickletApp?.updateTabContent === 'function') {
        window.FlickletApp.updateTabContent(list);
      }
    }
  }
  // Centralized count update system - only called from cards:changed event
  window.updateTabCounts = async function updateTabCounts() {
    try {
      const NS = '[functions]';
      const log = (...a) => console.log(NS, ...a);
      const warn = (...a) => console.warn(NS, ...a);
      log('🔄 [CENTRALIZED] updateTabCounts called from cards:changed event');
      let counts;
      // Use WatchlistsAdapter as canonical data source
      const uid = window.firebaseAuth?.currentUser?.uid || null;
      const watchlists = await window.WatchlistsAdapter.load(uid);
      counts = {
        watching: watchlists.watchingIds.length,
        wishlist: watchlists.wishlistIds.length,
        watched: watchlists.watchedIds.length,
      };
      log(
        `[WL v28.33] Canonical adapter counts - watching: ${counts.watching}, wishlist: ${counts.wishlist}, watched: ${counts.watched}`,
      );
      // Update badges and list header counts
      ['watching', 'wishlist', 'watched'].forEach((list) => {
        const count = counts[list];
        // Update tab badge
        const badge =
          document.getElementById(`${list}Badge`) ||
          document.querySelector(`[data-count="${list}"]`);
        if (badge) {
          badge.textContent = count;
          // Use CSS classes instead of inline styles
          badge.classList.add('tab-badge', 'tab-badge--visible');
          log(`Updated ${list}Badge: ${count}`, {
            element: badge,
            classes: badge.className,
            style: badge.style.cssText,
            display: getComputedStyle(badge).display,
            visibility: getComputedStyle(badge).visibility,
            opacity: getComputedStyle(badge).opacity,
          });
        } else {
          warn(`Badge not found for ${list}: ${list}Badge or [data-count="${list}"]`);
        }
        // Update list header count
        const listCount = document.getElementById(`${list}Count`);
        if (listCount) {
          listCount.textContent = count;
          log(`Updated ${list}Count: ${count}`);
        } else {
          warn(`List count not found for ${list}: ${list}Count`);
        }
      });
      log('[CENTRALIZED] counts updated:', counts);
      return counts;
    } catch (e) {
      console.warn('[functions] updateTabCounts failed:', e?.message || e);
      return { watching: 0, wishlist: 0, watched: 0 };
    }
  };
  // Set up centralized event listener for cards:changed
  document.addEventListener('cards:changed', function (event) {
    console.log('🎯 [CENTRALIZED] cards:changed event received, updating counts');
    if (typeof window.updateTabCounts === 'function') {
      window.updateTabCounts();
    }
  });
  // Respond to data ready events (from data-init)
  // REMOVED DUPLICATE LISTENER - was causing duplicate renders
  // Now handled by the main app:data:ready listener above
  // Ensure counts are updated when the page loads
  document.addEventListener('DOMContentLoaded', function () {
    console.log('🔢 DOMContentLoaded - emitting cards:changed event');
    setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent('cards:changed', {
          detail: { source: 'DOMContentLoaded' },
        }),
      );
    }, 1000);
  });
  // Also call when user data is loaded
  document.addEventListener('userDataLoaded', function () {
    console.log('🔢 userDataLoaded event - emitting cards:changed event');
    setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent('cards:changed', {
          detail: { source: 'userDataLoaded' },
        }),
      );
    }, 500);
  });
  // Note: Tab counts are now updated only when data changes, not periodically
  // ---- Home ----
  window.loadHomeContent = function loadHomeContent() {
    // Prevent duplicate renders
    if (window.render_home) {
      console.log('[functions] Skipping duplicate home render');
      return;
    }
    window.render_home = true;
    const container = document.getElementById('homeSection');
    if (!container) {
      window.render_home = false;
      return;
    }
    FlickletDebug.info('🏠 Loading home content - using improved loading');
    // Start performance monitoring
    if (window.PerformanceMonitor) {
      window.PerformanceMonitor.startHomeLoad();
    }
    // Clean up any existing duplicates first
    if (typeof window.cleanupDuplicateCards === 'function') {
      window.cleanupDuplicateCards();
    }
    // Load content with better sequencing
    setTimeout(() => {
      try {
        startDailyCountdown?.();
      } catch {}
      try {
        updateFlickWordStats?.();
      } catch {}
      // Load currently watching preview
      if (typeof window.renderCurrentlyWatchingPreview === 'function') {
        window.renderCurrentlyWatchingPreview();
      }
      // End performance monitoring
      if (window.PerformanceMonitor) {
        window.PerformanceMonitor.endHomeLoad();
      }
      // Clear render flag
      window.render_home = false;
    }, 50);
  };
  // ---- Duplicate Cleanup ----
  window.cleanupDuplicateCards = function cleanupDuplicateCards() {
    try {
      const NS = '[cleanup]';
      const log = (...a) => console.log(NS, ...a);
      log('Starting duplicate card cleanup...');
      // Get all cards with data attributes
      const allCards = document.querySelectorAll('[data-item-id][data-list-type]');
      const cardMap = new Map();
      let duplicatesRemoved = 0;
      allCards.forEach((card) => {
        const itemId = card.dataset.itemId;
        const listType = card.dataset.listType;
        const key = `${itemId}-${listType}`;
        if (cardMap.has(key)) {
          // This is a duplicate, remove it
          card.remove();
          duplicatesRemoved++;
          log(`Removed duplicate card: ${key}`);
        } else {
          cardMap.set(key, card);
        }
      });
      log(`Cleanup complete. Removed ${duplicatesRemoved} duplicate cards.`);
      return duplicatesRemoved;
    } catch (e) {
      console.warn('[cleanup] Failed:', e?.message || e);
      return 0;
    }
  };
  // ---- WatchlistsAdapter ----
  /**
   * Process: WatchlistsAdapter
   * Purpose: Single source of truth for watchlist data from Firebase users/{uid}.watchlists
   * Data Source: Firebase users/{uid} document with watchlists.movies and watchlists.tv
   * Update Path: Modify load() method if Firebase schema changes, update mutation methods if data structure changes
   * Dependencies: Firebase firestore, window.appData for fallback, moveItem and removeItemFromCurrentList functions
   */
  window.WatchlistsAdapter = {
    _cache: null,
    _lastUid: null,
    _loading: false,
    _loadPromise: null,
    _hasDataInWatchlists(watchlists) {
      if (!watchlists || typeof watchlists !== 'object') return false;
      const hasMoviesData =
        watchlists.movies &&
        ((watchlists.movies.watching && watchlists.movies.watching.length > 0) ||
          (watchlists.movies.wishlist && watchlists.movies.wishlist.length > 0) ||
          (watchlists.movies.watched && watchlists.movies.watched.length > 0));
      const hasTvData =
        watchlists.tv &&
        ((watchlists.tv.watching && watchlists.tv.watching.length > 0) ||
          (watchlists.tv.wishlist && watchlists.tv.wishlist.length > 0) ||
          (watchlists.tv.watched && watchlists.tv.watched.length > 0));
      return hasMoviesData || hasTvData;
    },
    async load(uid) {
      const NS = '[WL v28.19]';
      const log = (...a) => console.log(NS, ...a);
      try {
        // Return cached data if same user and cache exists
        if (this._cache && this._lastUid === uid) {
          log('Using cached watchlists data for uid:', uid);
          return this._cache;
        }
        // Prevent concurrent loads
        if (this._loading && this._loadPromise) {
          log('Load already in progress, waiting...');
          return await this._loadPromise;
        }
        this._loading = true;
        this._loadPromise = this._performLoad(uid);
        const result = await this._loadPromise;
        this._loading = false;
        this._loadPromise = null;
        return result;
      } catch (error) {
        this._loading = false;
        this._loadPromise = null;
        log('WatchlistsAdapter.load failed:', error.message);
        return { watchingIds: [], wishlistIds: [], watchedIds: [] };
      }
    },
    async _performLoad(uid) {
      const NS = '[WL v28.19]';
      const log = (...a) => console.log(NS, ...a);
      log('Loading watchlists for uid:', uid);
      // Try to load from Firebase first
      if (window.firebaseDb && uid) {
        try {
          const userDoc = await window.firebaseDb.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            log(
              'Firebase user doc found, watchlists keys:',
              Object.keys(userData.watchlists || {}),
            );
            if (userData.watchlists && this._hasDataInWatchlists(userData.watchlists)) {
              log(
                'Firebase watchlists structure has data:',
                JSON.stringify(userData.watchlists, null, 2),
              );
              const result = this._normalizeWatchlists(userData.watchlists);
              this._cache = result;
              this._lastUid = uid;
            } else {
              log('Watchlists empty or missing, checking direct movies and tv fields...');
              log('Firebase movies field:', JSON.stringify(userData.movies, null, 2));
              log('Firebase tv field:', JSON.stringify(userData.tv, null, 2));
              // Try to normalize from the direct movies/tv fields
              const directWatchlists = {
                movies: userData.movies || {},
                tv: userData.tv || {},
              };
              log(
                'Created direct watchlists structure:',
                JSON.stringify(directWatchlists, null, 2),
              );
              const result = this._normalizeWatchlists(directWatchlists);
              this._cache = result;
              this._lastUid = uid;
              // Debug exposure
              window.__wl = {
                watchingIds: result.watchingIds,
                wishlistIds: result.wishlistIds,
                watchedIds: result.watchedIds,
              };
              log(
                'Merged counts - watching:',
                result.watchingIds.length,
                'wishlist:',
                result.wishlistIds.length,
                'watched:',
                result.watchedIds.length,
              );
              return result;
            }
          }
        } catch (firebaseError) {
          log('Firebase load failed, falling back to appData:', firebaseError.message);
        }
      }
      try {
        // Fallback to appData structure
        log('Using appData fallback');
        const A = window.appData || {};
        const tv = A.tv || {};
        const movies = A.movies || {};
        const result = {
          watchingIds: [
            ...(Array.isArray(tv.watching)
              ? tv.watching
                  .map((item) => String(item.id || item.tmdb_id || item.tmdbId))
                  .filter(Boolean)
              : []),
            ...(Array.isArray(movies.watching)
              ? movies.watching
                  .map((item) => String(item.id || item.tmdb_id || item.tmdbId))
                  .filter(Boolean)
              : []),
          ],
          wishlistIds: [
            ...(Array.isArray(tv.wishlist)
              ? tv.wishlist
                  .map((item) => String(item.id || item.tmdb_id || item.tmdbId))
                  .filter(Boolean)
              : []),
            ...(Array.isArray(movies.wishlist)
              ? movies.wishlist
                  .map((item) => String(item.id || item.tmdb_id || item.tmdbId))
                  .filter(Boolean)
              : []),
          ],
          watchedIds: [
            ...(Array.isArray(tv.watched)
              ? tv.watched
                  .map((item) => String(item.id || item.tmdb_id || item.tmdbId))
                  .filter(Boolean)
              : []),
            ...(Array.isArray(movies.watched)
              ? movies.watched
                  .map((item) => String(item.id || item.tmdb_id || item.tmdbId))
                  .filter(Boolean)
              : []),
          ],
        };
        // Deduplicate
        result.watchingIds = [...new Set(result.watchingIds)];
        result.wishlistIds = [...new Set(result.wishlistIds)];
        result.watchedIds = [...new Set(result.watchedIds)];
        this._cache = result;
        this._lastUid = uid;
        log(
          'Fallback merged counts - watching:',
          result.watchingIds.length,
          'wishlist:',
          result.wishlistIds.length,
          'watched:',
          result.watchedIds.length,
        );
        return result;
      } catch (error) {
        log('WatchlistsAdapter.load failed:', error.message);
        return { watchingIds: [], wishlistIds: [], watchedIds: [] };
      }
    },
    _normalizeWatchlists(watchlists) {
      const NS = '[WL v28.19]';
      const log = (...a) => console.log(NS, ...a);
      log('_normalizeWatchlists input:', JSON.stringify(watchlists, null, 2));
      // Validate input data
      if (!watchlists || typeof watchlists !== 'object') {
        log('Invalid watchlists data:', watchlists);
        return { watchingIds: [], wishlistIds: [], watchedIds: [] };
      }
      const normalizeList = (list, listName) => {
        log(`normalizeList called for ${listName}:`, list);
        if (Array.isArray(list)) {
          // Firebase structure: each item has an 'id' field (number)
          const result = list
            .map((item) => {
              if (typeof item === 'object' && item !== null) {
                return String(item.id || item.tmdb_id || item.tmdbId);
              }
              return String(item);
            })
            .filter(Boolean);
          log(`${listName} array result:`, result);
          return result;
        } else if (typeof list === 'object' && list !== null) {
          // Fallback for object-based lists (not expected in Firebase)
          const result = Object.keys(list).filter((id) => list[id] === true);
          log(`${listName} object result:`, result);
          return result;
        }
        log(`${listName} empty result`);
        return [];
      };
      const watchingIds = [
        ...normalizeList(watchlists.movies?.watching || [], 'movies.watching'),
        ...normalizeList(watchlists.tv?.watching || [], 'tv.watching'),
      ];
      const wishlistIds = [
        ...normalizeList(watchlists.movies?.wishlist || [], 'movies.wishlist'),
        ...normalizeList(watchlists.tv?.wishlist || [], 'tv.wishlist'),
      ];
      const watchedIds = [
        ...normalizeList(watchlists.movies?.watched || [], 'movies.watched'),
        ...normalizeList(watchlists.tv?.watched || [], 'tv.watched'),
      ];
      // Deduplicate and ensure string IDs
      return {
        watchingIds: [...new Set(watchingIds.map(String))],
        wishlistIds: [...new Set(wishlistIds.map(String))],
        watchedIds: [...new Set(watchedIds.map(String))],
      };
    },
    // Move item between lists
    moveItem(itemId, fromList, toList) {
      const NS = '[WL v28.19]';
      const log = (...a) => console.log(NS, ...a);
      try {
        if (!this._cache) {
          log('No cache available for moveItem');
          return false;
        }
        const id = String(itemId);
        const fromKey = fromList + 'Ids';
        const toKey = toList + 'Ids';
        // Remove from source list
        if (this._cache[fromKey]) {
          const fromIndex = this._cache[fromKey].indexOf(id);
          if (fromIndex > -1) {
            this._cache[fromKey].splice(fromIndex, 1);
            log('Removed item:', id, 'from', fromList, 'new count:', this._cache[fromKey].length);
          }
        }
        // Add to destination list
        if (this._cache[toKey]) {
          if (!this._cache[toKey].includes(id)) {
            this._cache[toKey].push(id);
            log('Added item:', id, 'to', toList, 'new count:', this._cache[toKey].length);
          }
        }
        return true;
      } catch (error) {
        log('moveItem failed:', error.message);
        return false;
      }
    },
    // Remove item from list
    removeItem(itemId, fromList) {
      const NS = '[WL v28.19]';
      const log = (...a) => console.log(NS, ...a);
      try {
        if (!this._cache) {
          log('No cache available for removeItem');
          return false;
        }
        const id = String(itemId);
        const fromKey = fromList + 'Ids';
        if (this._cache[fromKey]) {
          const index = this._cache[fromKey].indexOf(id);
          if (index > -1) {
            this._cache[fromKey].splice(index, 1);
            log('Removed item:', id, 'from', fromList, 'new count:', this._cache[fromKey].length);
            return true;
          }
        }
        return false;
      } catch (error) {
        log('removeItem failed:', error.message);
        return false;
      }
    },
    // Add item to list
    addItem(itemId, toList) {
      const NS = '[WL v28.19]';
      const log = (...a) => console.log(NS, ...a);
      try {
        if (!this._cache) {
          log('No cache available for addItem, creating new cache');
          this._cache = {
            watchingIds: [],
            wishlistIds: [],
            watchedIds: [],
          };
        }
        const id = String(itemId);
        const toKey = toList + 'Ids';
        if (this._cache[toKey]) {
          if (!this._cache[toKey].includes(id)) {
            this._cache[toKey].push(id);
            log('Added item:', id, 'to', toList, 'new count:', this._cache[toKey].length);
            return true;
          } else {
            log('Item already exists in', toList);
            return false;
          }
        }
        return false;
      } catch (error) {
        log('addItem failed:', error.message);
        return false;
      }
    },
    // Clear cache when data changes
    invalidate() {
      this._cache = null;
      this._lastUid = null;
    },
    // Get item data by ID from appData (for rendering)
    getItemData(itemId) {
      const NS = '[WL v28.19]';
      const log = (...a) => console.log(NS, ...a);
      try {
        const id = String(itemId);
        const appData = window.appData || {};
        const tv = appData.tv || {};
        const movies = appData.movies || {};
        // Search through all lists to find the item
        const allLists = [
          ...(Array.isArray(tv.watching) ? tv.watching : []),
          ...(Array.isArray(tv.wishlist) ? tv.wishlist : []),
          ...(Array.isArray(tv.watched) ? tv.watched : []),
          ...(Array.isArray(movies.watching) ? movies.watching : []),
          ...(Array.isArray(movies.wishlist) ? movies.wishlist : []),
          ...(Array.isArray(movies.watched) ? movies.watched : []),
        ];
        const item = allLists.find((item) => String(item.id || item.tmdb_id || item.tmdbId) === id);
        if (item) {
          log(`Found item data for ID ${id}:`, item.title || item.name || 'Unknown');
          return item;
        } else {
          log(`Item not found for ID ${id}`);
          return null;
        }
      } catch (error) {
        log('getItemData failed:', error.message);
        return null;
      }
    },
    // Build appData from adapter as computed snapshot for legacy code
    buildAppDataSnapshot() {
      const NS = '[WL v28.19]';
      const log = (...a) => console.log(NS, ...a);
      try {
        if (!this._cache) {
          log('No cache available for buildAppDataSnapshot');
          return {
            tv: { watching: [], wishlist: [], watched: [] },
            movies: { watching: [], wishlist: [], watched: [] },
          };
        }
        const appData = window.appData || {};
        const tv = appData.tv || {};
        const movies = appData.movies || {};
        // Build TV lists from adapter IDs
        const tvWatching = this._cache.watchingIds
          .map((id) => this.getItemData(id))
          .filter((item) => item && (item.media_type === 'tv' || item.first_air_date))
          .filter(Boolean);
        const tvWishlist = this._cache.wishlistIds
          .map((id) => this.getItemData(id))
          .filter((item) => item && (item.media_type === 'tv' || item.first_air_date))
          .filter(Boolean);
        const tvWatched = this._cache.watchedIds
          .map((id) => this.getItemData(id))
          .filter((item) => item && (item.media_type === 'tv' || item.first_air_date))
          .filter(Boolean);
        // Build movies lists from adapter IDs
        const moviesWatching = this._cache.watchingIds
          .map((id) => this.getItemData(id))
          .filter(
            (item) =>
              item && (item.media_type === 'movie' || (!item.first_air_date && !item.media_type)),
          )
          .filter(Boolean);
        const moviesWishlist = this._cache.wishlistIds
          .map((id) => this.getItemData(id))
          .filter(
            (item) =>
              item && (item.media_type === 'movie' || (!item.first_air_date && !item.media_type)),
          )
          .filter(Boolean);
        const moviesWatched = this._cache.watchedIds
          .map((id) => this.getItemData(id))
          .filter(
            (item) =>
              item && (item.media_type === 'movie' || (!item.first_air_date && !item.media_type)),
          )
          .filter(Boolean);
        const snapshot = {
          tv: {
            watching: tvWatching,
            wishlist: tvWishlist,
            watched: tvWatched,
          },
          movies: {
            watching: moviesWatching,
            wishlist: moviesWishlist,
            watched: moviesWatched,
          },
        };
        log('Built appData snapshot from adapter:', {
          tvWatching: snapshot.tv.watching.length,
          tvWishlist: snapshot.tv.wishlist.length,
          tvWatched: snapshot.tv.watched.length,
          moviesWatching: snapshot.movies.watching.length,
          moviesWishlist: snapshot.movies.wishlist.length,
          moviesWatched: snapshot.movies.watched.length,
        });
        return snapshot;
      } catch (error) {
        log('buildAppDataSnapshot failed:', error.message);
        return {
          tv: { watching: [], wishlist: [], watched: [] },
          movies: { watching: [], wishlist: [], watched: [] },
        };
      }
    },
  };
  // ---- Lists ----
  /**
   * Process: Tab Content Loading with Unified Card Rendering
   * Purpose: Loads and displays list items (watching, wishlist, watched) using WatchlistsAdapter as source of truth
   * Data Source: WatchlistsAdapter (users/{uid}.watchlists) with fallback to appData.tv[listType] and appData.movies[listType] arrays
   * Update Path: Modify listType parameter handling, update createShowCard call if card structure changes
   * Dependencies: WatchlistsAdapter, createShowCard function, appData structure, container elements, moveItem and removeItemFromCurrentList functions
   */
  window.loadListContent = async function loadListContent(listType) {
    try {
      const NS = '[functions]';
      const log = (...a) => console.log(NS, ...a);
      const warn = (...a) => console.warn(NS, ...a);
      log(`🔄 loadListContent called for ${listType}`);
      // Prevent duplicate renders
      const renderKey = `render_${listType}`;
      if (window[renderKey]) {
        log(`Skipping duplicate render for ${listType}`);
        return;
      }
      window[renderKey] = true;
      let items, counts;
      // Use WatchlistsAdapter as canonical data source
      const uid = window.firebaseAuth?.currentUser?.uid || null;
      const watchlists = await window.WatchlistsAdapter.load(uid);
      // Create three local arrays from the adapter (source of truth)
      const ids = {
        watching: watchlists.watchingIds || [],
        wishlist: watchlists.wishlistIds || [],
        watched: watchlists.watchedIds || [],
      };
      // Get the appropriate ID list based on listType
      const idList = ids[listType] || [];
      log(`[WL v28.33] Loaded ${idList.length} IDs for ${listType} from canonical adapter`);
      // Set counts before rendering (counts first, then render, then event bridge)
      counts = {
        watching: ids.watching.length,
        wishlist: ids.wishlist.length,
        watched: ids.watched.length,
      };
      // Update header counts immediately
      ['watching', 'wishlist', 'watched'].forEach((list) => {
        const headerEl = document.getElementById(`${list}Count`);
        if (headerEl) {
          headerEl.textContent = counts[list];
          log(`[WL v28.33] Set header ${list}Count: ${counts[list]}`);
        }
        const badgeEl = document.getElementById(`${list}Badge`);
        if (badgeEl) {
          badgeEl.textContent = counts[list];
          // Use CSS classes instead of inline styles
          badgeEl.classList.remove('tab-badge--hidden', 'tab-badge--visible');
          badgeEl.classList.add(counts[list] > 0 ? 'tab-badge--visible' : 'tab-badge--hidden');
          log(`[WL v28.33] Set badge ${list}Badge: ${counts[list]}`);
        }
      });
      // Map IDs → card data using adapter as source of truth
      log(`[WL v28.33] Looking for ${idList.length} IDs:`, idList);
      // Get items that match the adapter IDs using adapter's getItemData method
      items = idList
        .map((id) => {
          const item = window.WatchlistsAdapter.getItemData(id);
          log(`[WL v28.33] ID ${id} ->`, item ? item.title || item.name || 'Unknown' : 'NOT FOUND');
          return item;
        })
        .filter(Boolean);
      log(`[WL v28.33] Mapped ${idList.length} IDs to ${items.length} items for ${listType}`);
      // If we have missing items, log for debugging
      if (idList.length > items.length) {
        const missingIds = idList.filter((id) => !window.WatchlistsAdapter.getItemData(id));
        log(`[WL v28.33] Missing items for ${listType}:`, missingIds);
      }
      const container =
        document.getElementById(`${listType}List`) ||
        document.querySelector(`[data-section="${listType}"] .section-content`) ||
        (() => {
          const d = document.createElement('div');
          d.className = 'list-container';
          (document.querySelector('main,#app,body') || document.body).appendChild(d);
          return d;
        })();
      log(
        `Container for ${listType}:`,
        container.id || container.className,
        'Children before clear:',
        container.children.length,
      );
      // Use list-container class for tab sections to enable horizontal layout
      container.className = 'list-container';
      // Clear existing content to prevent duplication
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      log(`Children after clear:`, container.children.length);
      // Remove any duplicate cards that might exist elsewhere
      const existingCards = document.querySelectorAll(`[data-list-type="${listType}"]`);
      log(`Found ${existingCards.length} existing cards for ${listType}`);
      existingCards.forEach((card) => {
        if (card.parentNode && card.parentNode !== container) {
          log(`Removing duplicate card from:`, card.parentNode.id || card.parentNode.className);
          card.remove();
        }
      });
      if (!items.length) {
        container.innerHTML = '<div class="poster-cards-empty">Nothing here yet.</div>';
        return;
      }
      // Use unified Card component for tab sections
      if (typeof window.Card === 'function' && typeof window.createCardData === 'function') {
        log(`Rendering ${items.length} items for ${listType} using createCardData + Card`);
        items.forEach((it, index) => {
          try {
            const cardData = window.createCardData(it, 'tmdb', listType);
            log(`Card data for ${it.title || it.name}:`, cardData);
            const card = window.Card({
              variant: 'detail', // Use detail variant for tabs
              ...cardData,
            });
            if (card) {
              // Add unique identifier to prevent duplication
              card.dataset.itemId = cardData.id;
              card.dataset.listType = listType;
              card.dataset.renderIndex = index;
              container.appendChild(card);
              log(`Added card ${index + 1}/${items.length} for ${listType}:`, cardData.title);
            } else {
              warn(`Card creation failed for ${it.title || it.name}`);
            }
          } catch (e) {
            warn('render item failed:', e?.message || e);
          }
        });
      } else if (typeof window.Card === 'function') {
        // Fallback to Card component without createCardData
        log(`Rendering ${items.length} items for ${listType} using fallback Card method`);
        items.forEach((it) => {
          try {
            const cardData = {
              variant: 'detail', // Use detail variant for two-column layout
              id: it.id || it.tmdb_id || it.tmdbId,
              title: it.title || it.name,
              subtitle: it.year
                ? `${it.year} • ${it.mediaType === 'tv' ? 'TV Series' : 'Movie'}`
                : it.mediaType === 'tv'
                  ? 'TV Series'
                  : 'Movie',
              posterUrl: it.posterUrl || it.poster_src,
              rating: it.vote_average || it.rating || 0,
              mediaType: it.mediaType || 'movie',
              currentList: listType, // Pass current list for proper button generation
              onOpenDetails: (id) => {
                if (window.openTMDBLink) {
                  window.openTMDBLink(id, it.mediaType || 'movie');
                }
              },
            };
            const el = window.Card(cardData);
            if (el) container.appendChild(el);
          } catch (e) {
            warn('render item failed:', e?.message || e);
          }
        });
      } else {
        // Fallback to simple HTML
        container.innerHTML =
          '<div class="poster-cards-empty">Card components not available.</div>';
      }
      // Add scroll indicators for horizontal layout
      addScrollIndicators(container);
      // Dispatch event to notify that list cards have been rendered
      window.dispatchEvent(
        new CustomEvent('cards:rendered', {
          detail: {
            count: items.length,
            section: listType,
          },
        }),
      );
      log(`Final children count for ${listType}:`, container.children.length);
      // Emit cards:changed event for counter system (event bridge after render)
      document.dispatchEvent(
        new CustomEvent('cards:changed', {
          detail: { listType: listType, count: container.children.length },
        }),
      );
      // Trigger counter system update after cards are rendered
      if (window.CounterBootstrap && typeof window.CounterBootstrap.directRecount === 'function') {
        setTimeout(() => {
          window.CounterBootstrap.directRecount();
        }, 100);
      }
      // Clear render flag after a short delay to allow for legitimate re-renders
      setTimeout(() => {
        window[renderKey] = false;
      }, 100);
    } catch (e) {
      console.warn('[functions] loadListContent failed:', e?.message || e);
      // Clear render flag on error
      window[renderKey] = false;
    }
  };
  /**
   * Process: Episode Tracking Modal
   * Purpose: Opens modal for tracking TV show episodes with season/episode selection
   * Data Source: TMDB API for episode data, appData for user progress
   * Update Path: Modify modal HTML structure or episode data handling
   * Dependencies: Modal system, TMDB API, appData structure
   */
  window.openEpisodeTrackingModal = function openEpisodeTrackingModal(itemId) {
    try {
      const NS = '[functions]';
      const log = (...a) => console.log(NS, ...a);
      // Find the item using adapter as canonical source
      let item = null;
      let mediaType = 'movie';
      // Use adapter to get item data
      if (window.WatchlistsAdapter) {
        item = window.WatchlistsAdapter.getItemData(itemId);
        if (item) {
          mediaType = item.media_type || item.mediaType || (item.first_air_date ? 'tv' : 'movie');
        }
      }
      // Fallback to appData search if adapter doesn't find it
      if (!item) {
        const appData = window.appData || {};
        const tv = appData.tv || {};
        const movies = appData.movies || {};
        // Search through all lists
        for (const listType of ['watching', 'wishlist', 'watched']) {
          const tvList = tv[listType] || [];
          const movieList = movies[listType] || [];
          item =
            tvList.find((i) => (i.id || i.tmdb_id) == itemId) ||
            movieList.find((i) => (i.id || i.tmdb_id) == itemId);
          if (item) {
            mediaType = item.media_type || item.mediaType || (item.first_air_date ? 'tv' : 'movie');
            break;
          }
        }
      }
      if (!item) {
        log('Item not found for episode tracking:', itemId);
        return;
      }
      if (mediaType !== 'tv') {
        log('Episode tracking only available for TV shows');
        return;
      }
      // Create modal HTML
      const modalHTML = `
      <div class="episode-modal" id="episodeTrackingModal" aria-hidden="false" role="dialog">
        <div class="episode-modal-overlay" data-close></div>
        <div class="episode-modal-dialog" role="document">
          <header class="episode-modal-header">
            <h3>📺 Episode Tracking - ${item.title || item.name}</h3>
            <button class="episode-modal-close" type="button" aria-label="Close" data-close>&times;</button>
          </header>
          <main class="episode-modal-body">
            <div class="episode-progress">
              <label for="currentSeason">Current Season:</label>
              <select id="currentSeason" class="episode-select">
                <option value="1">Season 1</option>
                <option value="2">Season 2</option>
                <option value="3">Season 3</option>
              </select>
            </div>
            <div class="episode-progress">
              <label for="currentEpisode">Current Episode:</label>
              <select id="currentEpisode" class="episode-select">
                <option value="1">Episode 1</option>
                <option value="2">Episode 2</option>
                <option value="3">Episode 3</option>
              </select>
            </div>
            <div class="episode-actions">
              <button class="episode-btn episode-btn--primary" data-action="save-progress">Save Progress</button>
              <button class="episode-btn episode-btn--secondary" data-action="mark-season-complete">Mark Season Complete</button>
              <button class="episode-btn episode-btn--secondary" data-action="mark-series-complete">Mark Series Complete</button>
            </div>
          </main>
        </div>
      </div>
    `;
      // Remove existing modal if present
      const existingModal = document.getElementById('episodeTrackingModal');
      if (existingModal) {
        existingModal.remove();
      }
      // Add modal to body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      // Add event listeners
      const modal = document.getElementById('episodeTrackingModal');
      const closeButtons = modal.querySelectorAll('[data-close]');
      const actionButtons = modal.querySelectorAll('[data-action]');
      closeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          modal.remove();
        });
      });
      actionButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          const season = parseInt(document.getElementById('currentSeason').value);
          const episode = parseInt(document.getElementById('currentEpisode').value);
          switch (action) {
            case 'save-progress':
              log('Save progress:', { itemId, season, episode });
              // TODO: Implement progress saving
              break;
            case 'mark-season-complete':
              log('Mark season complete:', { itemId, season });
              // TODO: Implement season completion
              break;
            case 'mark-series-complete':
              log('Mark series complete:', { itemId });
              if (window.moveItem) {
                window.moveItem(Number(itemId), 'watched');
              }
              modal.remove();
              break;
          }
        });
      });
      // Close on overlay click
      modal.querySelector('.episode-modal-overlay').addEventListener('click', () => {
        modal.remove();
      });
      log('Episode tracking modal opened for:', item.title || item.name);
    } catch (e) {
      console.warn('[functions] openEpisodeTrackingModal failed:', e?.message || e);
    }
  };
  /**
   * Process: User Rating Update
   * Purpose: Updates user's personal rating for an item
   * Data Source: appData structure, localStorage persistence
   * Update Path: Modify rating storage or validation logic
   * Dependencies: appData structure, saveAppData function
   */
  window.updateUserRating = function updateUserRating(itemId, rating) {
    try {
      const NS = '[functions]';
      const log = (...a) => console.log(NS, ...a);
      const appData = window.appData || {};
      // Find and update the item in all lists
      for (const mediaType of ['tv', 'movies']) {
        const media = appData[mediaType] || {};
        for (const listType of ['watching', 'wishlist', 'watched']) {
          const list = media[listType] || [];
          const item = list.find((i) => (i.id || i.tmdb_id) == itemId);
          if (item) {
            item.userRating = rating;
            log('Updated rating for', item.title || item.name, 'to', rating);
            break;
          }
        }
      }
      // Save to localStorage
      if (window.saveAppData) {
        window.saveAppData();
      }
    } catch (e) {
      console.warn('[functions] updateUserRating failed:', e?.message || e);
    }
  };
  /**
   * Process: User Note Update
   * Purpose: Updates user's personal note for an item
   * Data Source: appData structure, localStorage persistence
   * Update Path: Modify note storage or validation logic
   * Dependencies: appData structure, saveAppData function
   */
  window.updateUserNote = function updateUserNote(itemId, note) {
    try {
      const NS = '[functions]';
      const log = (...a) => console.log(NS, ...a);
      const appData = window.appData || {};
      // Find and update the item in all lists
      for (const mediaType of ['tv', 'movies']) {
        const media = appData[mediaType] || {};
        for (const listType of ['watching', 'wishlist', 'watched']) {
          const list = media[listType] || [];
          const item = list.find((i) => (i.id || i.tmdb_id) == itemId);
          if (item) {
            item.userNote = note;
            log('Updated note for', item.title || item.name);
            break;
          }
        }
      }
      // Save to localStorage
      if (window.saveAppData) {
        window.saveAppData();
      }
    } catch (e) {
      console.warn('[functions] updateUserNote failed:', e?.message || e);
    }
  };
  /**
   * Process: Item Reordering
   * Purpose: Reorders items within user-owned lists using drag and drop
   * Data Source: appData structure, localStorage persistence
   * Update Path: Modify reordering logic or validation
   * Dependencies: appData structure, saveAppData function
   */
  window.reorderItems = function reorderItems(draggedId, targetId, listType) {
    try {
      const NS = '[functions]';
      const log = (...a) => console.log(NS, ...a);
      const appData = window.appData || {};
      // Find and reorder items in both TV and movies lists
      for (const mediaType of ['tv', 'movies']) {
        const media = appData[mediaType] || {};
        const list = media[listType] || [];
        const draggedIndex = list.findIndex((i) => (i.id || i.tmdb_id) == draggedId);
        const targetIndex = list.findIndex((i) => (i.id || i.tmdb_id) == targetId);
        if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
          // Remove dragged item
          const draggedItem = list.splice(draggedIndex, 1)[0];
          // Insert at target position
          list.splice(targetIndex, 0, draggedItem);
          log('Reordered', draggedItem.title || draggedItem.name, 'in', listType, 'list');
          // Save to localStorage
          if (window.saveAppData) {
            window.saveAppData();
          }
          // Refresh the UI
          if (window.loadListContent) {
            window.loadListContent(listType);
          }
          break;
        }
      }
    } catch (e) {
      console.warn('[functions] reorderItems failed:', e?.message || e);
    }
  };
  function getNextList(currentList) {
    const lists = ['watching', 'wishlist', 'watched'];
    const currentIndex = lists.indexOf(currentList);
    return lists[(currentIndex + 1) % lists.length];
  }
  // ---- Discover ----
  window.loadDiscoverContent = function loadDiscoverContent() {
    const container = document.getElementById('discoverList');
    if (!container) return;
    // Set up poster card grid layout
    container.className = 'poster-cards-grid';
    // Show loading state
    container.innerHTML = `
    <div class="poster-cards-loading">
      <div class="poster-cards-loading__spinner">⏳</div>
      <div class="poster-cards-loading__text">Loading recommendations...</div>
    </div>
  `;
    // Load recommendations
    loadDiscoverRecommendations();
  };
  /**
   * Load discover recommendations from TMDB
   */
  async function loadDiscoverRecommendations() {
    try {
      const container = document.getElementById('discoverList');
      if (!container) return;
      // Get not interested items to filter out
      const notInterested = getNotInterestedItems();
      // Get current language for TMDB API calls using centralized helper
      const currentLang = window.appData?.settings?.lang || 'en';
      const tmdbLang = window.getTMDBLocale(currentLang);
      // Load popular movies and TV shows using proxy
      const [moviesData, tvData] = await Promise.all([
        window.tmdbGet('movie/popular', { page: 1, language: tmdbLang }),
        window.tmdbGet('tv/popular', { page: 1, language: tmdbLang }),
      ]);
      // Check if we got valid data (tmdbGet returns parsed JSON or empty results on error)
      if (!moviesData || !tvData || !moviesData.results || !tvData.results) {
        console.warn('⚠️ Failed to fetch recommendations - using empty results');
        return [];
      }
      // Combine and filter results
      const allItems = [
        ...moviesData.results.map((item) => ({ ...item, media_type: 'movie' })),
        ...tvData.results.map((item) => ({ ...item, media_type: 'tv' })),
      ];
      // Filter out not interested items
      const filteredItems = allItems.filter(
        (item) =>
          !notInterested.some(
            (notItem) => notItem.id === item.id && notItem.media_type === item.media_type,
          ),
      );
      // Shuffle and take first 20
      const shuffled = filteredItems.sort(() => Math.random() - 0.5);
      const recommendations = shuffled.slice(0, 20);
      // Render recommendations
      if (recommendations.length === 0) {
        container.innerHTML = `
        <div class="poster-cards-empty">
          <div class="poster-cards-empty__icon">✨</div>
          <div class="poster-cards-empty__title">No Recommendations</div>
          <div class="poster-cards-empty__description">Try adjusting your preferences or check back later.</div>
        </div>
      `;
        return;
      }
      // Clear loading state
      container.innerHTML = '';
      // Create poster cards
      recommendations.forEach((item) => {
        const card = createDiscoverCard(item);
        if (card) {
          container.appendChild(card);
        }
      });
    } catch (error) {
      console.error('Failed to load discover recommendations:', error);
      const container = document.getElementById('discoverList');
      if (container) {
        container.innerHTML = `
        <div class="poster-cards-error">
          <div class="poster-cards-error__icon">❌</div>
          <div class="poster-cards-error__title">Failed to Load</div>
          <div class="poster-cards-error__description">Unable to load recommendations. Please try again later.</div>
          <button class="btn btn--primary poster-cards-error__retry" onclick="loadDiscoverContent()">
            Try Again
          </button>
        </div>
      `;
      }
    }
  }
  /**
   * Create discover card with not interested button
   * @param {Object} item - Item data
   * @returns {HTMLElement} Card element
   */
  function createDiscoverCard(item) {
    if (!window.Card) return null;
    const card = window.Card({
      variant: 'poster',
      id: item.id || item.tmdb_id || item.tmdbId,
      title: item.title || item.name,
      subtitle: item.year
        ? `${item.year} • ${item.mediaType === 'tv' ? 'TV Series' : 'Movie'}`
        : item.mediaType === 'tv'
          ? 'TV Series'
          : 'Movie',
      posterUrl: item.posterUrl || item.poster_src,
      rating: item.vote_average || item.rating || 0,
      badges: [{ label: 'Discover', kind: 'status' }],
      primaryAction: {
        label: 'View Details',
        onClick: () => {
          if (window.openTMDBLink) {
            window.openTMDBLink(item.id || item.tmdb_id, item.mediaType || 'movie');
          }
        },
      },
      overflowActions: [
        {
          label: 'Not Interested',
          onClick: () => {
            addToNotInterested(item);
            card.remove();
            showToast(
              'info',
              'Added to Not Interested',
              `${item.title || item.name} won't appear in recommendations`,
            );
          },
          icon: '❌',
        },
      ],
      onOpenDetails: () => {
        if (window.openTMDBLink) {
          window.openTMDBLink(item.id || item.tmdb_id, item.mediaType || 'movie');
        }
      },
    });
    return card;
  }
  // ---- Not Interested Database ----
  /**
   * Get all not interested items
   * @returns {Array} Array of not interested items
   */
  function getNotInterestedItems() {
    try {
      const stored = localStorage.getItem('flicklet-not-interested');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get not interested items:', error);
      return [];
    }
  }
  /**
   * Add item to not interested list
   * @param {Object} item - Item to add
   */
  function addToNotInterested(item) {
    try {
      const notInterested = getNotInterestedItems();
      const exists = notInterested.some(
        (notItem) => notItem.id === item.id && notItem.media_type === item.media_type,
      );
      if (!exists) {
        notInterested.push({
          id: item.id,
          title: item.title || item.name,
          media_type: item.media_type,
          added_date: new Date().toISOString(),
        });
        localStorage.setItem('flicklet-not-interested', JSON.stringify(notInterested));
      }
    } catch (error) {
      console.error('Failed to add to not interested:', error);
    }
  }
  /**
   * Remove item from not interested list
   * @param {string|number} itemId - Item ID
   * @param {string} mediaType - Media type
   */
  function removeFromNotInterested(itemId, mediaType) {
    try {
      const notInterested = getNotInterestedItems();
      const filtered = notInterested.filter(
        (notItem) => !(notItem.id === itemId && notItem.media_type === mediaType),
      );
      localStorage.setItem('flicklet-not-interested', JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from not interested:', error);
    }
  }
  /**
   * Clear all not interested items
   */
  function clearNotInterested() {
    try {
      localStorage.removeItem('flicklet-not-interested');
    } catch (error) {
      console.error('Failed to clear not interested:', error);
    }
  }
  // ---- Modal Functions for Poster Cards ----
  window.openItemDetails = function openItemDetails(id) {
    console.log('Open details for item:', id);
    // TODO: Implement item details modal
  };
  // TODO stubs removed - actual implementations found below
  // TODO stub removed - actual implementation found below
  // ---- Toast Notifications ----
  window.showToast = function showToast(type, title, message) {
    // Remove existing notifications (single notification rule)
    document.querySelectorAll('.notification').forEach((n) => n.remove());
    // Create centered notification
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `<span class="notification-message">${message}</span>`;
    document.body.appendChild(notification);
    // Animate in with scale and fade
    setTimeout(() => {
      notification.classList.add('notification--visible');
    }, 10);
    // Auto-dismiss after 4 seconds with fade out
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove('notification--visible');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 4000);
  };
  // ---- Modal Functions ----
  /**
   * Open notes modal for an item
   * @param {Object} item - Item data
   */
  window.openNotesModal = function openNotesModal(item) {
    // Create modal element if it doesn't exist
    let modal = document.getElementById('notesModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'notesModal';
      modal.className = 'modal modal--notes';
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
      document.body.appendChild(modal);
    }
    // Get existing notes
    const existingNotes = getItemNotes(item.id) || '';
    modal.innerHTML = `
    <div class="modal-overlay" data-close></div>
    <div class="modal-dialog" role="document">
      <div class="modal__header">
        <h3 class="modal__title">Notes for ${item.title || item.name}</h3>
        <button class="modal__close" aria-label="Close modal" data-close>×</button>
      </div>
      <div class="modal__body">
        <textarea class="modal__textarea" placeholder="Add your notes about this show or movie..." rows="8">${existingNotes}</textarea>
      </div>
      <div class="modal__footer">
        <button class="btn btn--secondary modal__cancel" data-close>Cancel</button>
        <button class="btn btn--primary modal__save">Save Notes</button>
      </div>
    </div>
  `;
    // Add save functionality
    const saveBtn = modal.querySelector('.modal__save');
    const textarea = modal.querySelector('.modal__textarea');
    saveBtn.addEventListener('click', () => {
      const notes = textarea.value.trim();
      saveItemNotes(item.id, notes);
      showToast('success', 'Notes Saved', `Notes saved for ${item.title || item.name}`);
      if (window.ModalUtility) {
        window.ModalUtility.close();
      }
    });
    // Use central modal utility
    if (window.ModalUtility) {
      window.ModalUtility.open('notesModal', document.activeElement);
      // Focus textarea after modal opens
      setTimeout(() => textarea.focus(), 100);
    } else {
      console.error('ModalUtility not available');
    }
  };
  /**
   * Open episode guide modal for a TV show
   * @param {Object} item - Item data
   */
  window.openEpisodeGuideModal = function openEpisodeGuideModal(item) {
    // Create modal element if it doesn't exist
    let modal = document.getElementById('episodeGuideModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'episodeGuideModal';
      modal.className = 'modal modal--episodes';
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
    <div class="modal-overlay" data-close></div>
    <div class="modal-dialog" role="document">
      <div class="modal__header">
        <h3 class="modal__title">Episode Guide - ${item.title || item.name}</h3>
        <button class="modal__close" aria-label="Close modal" data-close>×</button>
      </div>
      <div class="modal__body">
        <div class="episode-guide">
          <div class="episode-guide__seasons">
            <label for="seasonSelect">Season:</label>
            <select id="seasonSelect" class="episode-guide__select">
              <option value="1">Season 1</option>
              <option value="2">Season 2</option>
              <option value="3">Season 3</option>
            </select>
          </div>
          <div class="episode-guide__episodes">
            <div class="episode-guide__episode">
              <div class="episode-guide__episode-number">S1E1</div>
              <div class="episode-guide__episode-title">Pilot</div>
              <div class="episode-guide__episode-date">Jan 15, 2023</div>
              <button class="btn btn--sm episode-guide__watch-btn">Mark Watched</button>
            </div>
            <div class="episode-guide__episode">
              <div class="episode-guide__episode-number">S1E2</div>
              <div class="episode-guide__episode-title">The Second Episode</div>
              <div class="episode-guide__episode-date">Jan 22, 2023</div>
              <button class="btn btn--sm episode-guide__watch-btn">Mark Watched</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--secondary" data-close>Close</button>
      </div>
    </div>
  `;
    // Use central modal utility
    if (window.ModalUtility) {
      window.ModalUtility.open('episodeGuideModal', document.activeElement);
    } else {
      console.error('ModalUtility not available');
    }
  };
  /**
   * Confirm remove item
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  window.confirmRemoveItem = function confirmRemoveItem(item, section) {
    // Create modal element if it doesn't exist
    let modal = document.getElementById('confirmRemoveModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirmRemoveModal';
      modal.className = 'modal modal--remove';
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
    <div class="modal-overlay" data-close></div>
    <div class="modal-dialog" role="document">
      <div class="modal__header">
        <h3 class="modal__title">Remove Item</h3>
        <button class="modal__close" aria-label="Close modal" data-close>×</button>
      </div>
      <div class="modal__body">
        <p>Are you sure you want to remove <strong>${item.title || item.name}</strong> from your ${section} list?</p>
        <p class="modal__warning">This action cannot be undone.</p>
      </div>
      <div class="modal__footer">
        <button class="btn btn--secondary modal__cancel" data-close>Cancel</button>
        <button class="btn btn--danger modal__confirm">Remove</button>
      </div>
    </div>
  `;
    // Add confirm functionality
    const confirmBtn = modal.querySelector('.modal__confirm');
    confirmBtn.addEventListener('click', () => {
      // Remove item from store
      removeItemFromStore(item, section);
      // Update UI
      const container = document.getElementById(`${section}List`);
      if (container) {
        const card = container.querySelector(`[data-id="${item.id}"]`);
        if (card) {
          card.remove();
        }
      }
      // Emit cards:changed event for centralized count updates
      document.dispatchEvent(
        new CustomEvent('cards:changed', {
          detail: { source: 'removeItemFromCurrentList', itemId: item.id, section: section },
        }),
      );
      showToast('success', 'Item Removed', `${item.title || item.name} removed from ${section}`);
      if (window.ModalUtility) {
        window.ModalUtility.close();
      }
    });
    // Use central modal utility
    if (window.ModalUtility) {
      window.ModalUtility.open('confirmRemoveModal', document.activeElement);
    } else {
      console.error('ModalUtility not available');
    }
  };
  /**
   * Open PRO teaser modal
   */
  window.openProTeaserModal = function openProTeaserModal() {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.dataset.modal = 'pro';
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal modal--pro';
    modal.innerHTML = `
    <div class="modal__header">
      <h3 class="modal__title">⭐ Flicklet PRO</h3>
      <button class="modal__close" aria-label="Close modal">×</button>
    </div>
    <div class="modal__body">
      <div class="pro-teaser">
        <div class="pro-teaser__icon">⭐</div>
        <h4 class="pro-teaser__title">Unlock Premium Features</h4>
        <ul class="pro-teaser__features">
          <li>📝 Unlimited notes for all shows & movies</li>
          <li>📺 Detailed episode guides with air dates</li>
          <li>📊 Advanced statistics and insights</li>
          <li>🎨 Custom themes and layouts</li>
          <li>☁️ Cloud sync across all devices</li>
        </ul>
        <div class="pro-teaser__price">
          <span class="pro-teaser__amount">$4.99</span>
          <span class="pro-teaser__period">/month</span>
        </div>
      </div>
    </div>
    <div class="modal__footer">
      <button class="btn btn--secondary modal__close">Maybe Later</button>
      <button class="btn btn--primary modal__upgrade">Upgrade to PRO</button>
    </div>
  `;
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    // Add event listeners
    const closeBtn = modal.querySelector('.modal__close');
    const upgradeBtn = modal.querySelector('.modal__upgrade');
    const closeModal = () => {
      backdrop.remove();
    };
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    upgradeBtn.addEventListener('click', () => {
      showToast('info', 'Coming Soon', 'PRO upgrade will be available soon!');
      closeModal();
    });
  };
  /**
   * Get item notes from localStorage
   * @param {string|number} itemId - Item ID
   * @returns {string} Notes text
   */
  function getItemNotes(itemId) {
    try {
      const notes = localStorage.getItem(`flicklet-notes-${itemId}`);
      return notes || '';
    } catch (error) {
      console.error('Failed to get item notes:', error);
      return '';
    }
  }
  /**
   * Save item notes to localStorage
   * @param {string|number} itemId - Item ID
   * @param {string} notes - Notes text
   */
  function saveItemNotes(itemId, notes) {
    try {
      if (notes.trim()) {
        localStorage.setItem(`flicklet-notes-${itemId}`, notes);
      } else {
        localStorage.removeItem(`flicklet-notes-${itemId}`);
      }
    } catch (error) {
      console.error('Failed to save item notes:', error);
    }
  }
  /**
   * Remove item from store
   * @param {Object} item - Item data
   * @param {string} section - Section type
   */
  function removeItemFromStore(item, section) {
    if (!window.appData) return;
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const mediaKey = mediaType === 'tv' ? 'tv' : 'movies';
    if (window.appData[mediaKey] && window.appData[mediaKey][section]) {
      const list = window.appData[mediaKey][section];
      const index = list.findIndex((i) => i.id === item.id);
      if (index !== -1) {
        list.splice(index, 1);
        // Save to localStorage
        if (window.saveAppData) {
          window.saveAppData();
        } else {
          localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
        }
      }
    }
  }
  /**
   * Setup Not Interested management handlers
   */
  function setupNotInterestedHandlers() {
    const viewBtn = document.getElementById('viewNotInterestedBtn');
    const clearBtn = document.getElementById('clearNotInterestedBtn');
    const closeBtn = document.getElementById('closeNotInterestedBtn');
    const listContainer = document.getElementById('notInterestedList');
    const itemsContainer = document.getElementById('notInterestedItems');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        loadNotInterestedList();
        listContainer.style.display = 'block';
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (
          confirm(
            'Are you sure you want to clear all "Not Interested" items? This action cannot be undone.',
          )
        ) {
          clearNotInterested();
          showToast('success', 'Cleared', 'All "Not Interested" items have been removed');
          if (listContainer) {
            listContainer.style.display = 'none';
          }
        }
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (listContainer) {
          listContainer.style.display = 'none';
        }
      });
    }
  }
  /**
   * Load and display Not Interested list
   */
  function loadNotInterestedList() {
    const itemsContainer = document.getElementById('notInterestedItems');
    if (!itemsContainer) return;
    const notInterested = getNotInterestedItems();
    if (notInterested.length === 0) {
      itemsContainer.innerHTML = `
      <div class="not-interested-empty">
        <p>No items marked as "Not Interested"</p>
      </div>
    `;
      return;
    }
    const itemsHTML = notInterested
      .map(
        (item) => `
    <div class="not-interested-item">
      <div class="not-interested-item__info">
        <div class="not-interested-item__title">${item.title}</div>
        <div class="not-interested-item__type">${item.media_type === 'tv' ? 'TV Show' : 'Movie'}</div>
        <div class="not-interested-item__date">Added: ${new Date(item.added_date).toLocaleDateString()}</div>
      </div>
      <button class="btn btn--sm btn--secondary not-interested-item__remove" 
              data-id="${item.id}" 
              data-media-type="${item.media_type}">
        Remove
      </button>
    </div>
  `,
      )
      .join('');
    itemsContainer.innerHTML = itemsHTML;
    // Add remove handlers
    const removeButtons = itemsContainer.querySelectorAll('.not-interested-item__remove');
    removeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const itemId = button.dataset.id;
        const mediaType = button.dataset.mediaType;
        removeFromNotInterested(itemId, mediaType);
        showToast('success', 'Removed', 'Item removed from "Not Interested" list');
        // Reload the list
        loadNotInterestedList();
      });
    });
  }
  /**
   * Setup drag-reorder functionality for lists
   */
  function setupDragReorder() {
    // Add drag-reorder to all list containers
    const listContainers = ['watchingList', 'wishlistList', 'watchedList'];
    listContainers.forEach((containerId) => {
      const container = document.getElementById(containerId);
      if (container) {
        makeSortable(container);
      }
    });
  }
  /**
   * Make a container sortable with drag-reorder
   * @param {HTMLElement} container - Container element
   */
  function makeSortable(container) {
    let draggedElement = null;
    let draggedIndex = -1;
    // Add drag handles to all cards
    const addDragHandles = () => {
      const cards = container.querySelectorAll('.poster-card');
      cards.forEach((card) => {
        if (!card.querySelector('.poster-card__drag-handle')) {
          const dragHandle = document.createElement('div');
          dragHandle.className = 'poster-card__drag-handle';
          dragHandle.innerHTML = '⋮⋮';
          dragHandle.setAttribute('draggable', 'true');
          dragHandle.setAttribute('aria-label', 'Drag to reorder');
          // Add to actions area
          const actions = card.querySelector('.poster-card__actions');
          if (actions) {
            actions.insertBefore(dragHandle, actions.firstChild);
          }
        }
      });
    };
    // Add drag handle styles
    const addDragStyles = () => {
      if (!document.getElementById('drag-reorder-styles')) {
        const style = document.createElement('style');
        style.id = 'drag-reorder-styles';
        style.textContent = `
        .poster-card__drag-handle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--color-surface-2, #f5f5f5);
          border: 1px solid var(--color-border, #e0e0e0);
          border-radius: 4px;
          cursor: grab;
          font-size: 12px;
          color: var(--color-text-muted, #999999);
          transition: all 0.2s ease;
          margin-right: 8px;
        }
        .poster-card__drag-handle:hover {
          background: var(--color-primary-light, #fce4ec);
          border-color: var(--color-primary, #e91e63);
          color: var(--color-primary, #e91e63);
        }
        .poster-card__drag-handle:active {
          cursor: grabbing;
        }
        .poster-card--dragging {
          opacity: 0.5;
          transform: rotate(5deg);
          z-index: 1000;
        }
        .poster-card--drag-over {
          border-color: var(--color-primary, #e91e63);
          background: var(--color-primary-light, #fce4ec);
        }
        .poster-cards-grid--reordering {
          cursor: grabbing;
        }
        .poster-cards-grid--reordering .poster-card {
          transition: transform 0.2s ease;
        }
        @media (max-width: 768px) {
          .poster-card__drag-handle {
            width: 20px;
            height: 20px;
            font-size: 10px;
          }
        }
      `;
        document.head.appendChild(style);
      }
    };
    // Initialize
    addDragStyles();
    addDragHandles();
    // Set up drag events
    container.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('poster-card__drag-handle')) {
        draggedElement = e.target.closest('.poster-card');
        draggedIndex = Array.from(container.children).indexOf(draggedElement);
        draggedElement.classList.add('poster-card--dragging');
        container.classList.add('poster-cards-grid--reordering');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', draggedElement.outerHTML);
      }
    });
    container.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('poster-card__drag-handle')) {
        draggedElement.classList.remove('poster-card--dragging');
        container.classList.remove('poster-cards-grid--reordering');
        // Remove drag-over classes
        const cards = container.querySelectorAll('.poster-card');
        cards.forEach((card) => card.classList.remove('poster-card--drag-over'));
        draggedElement = null;
        draggedIndex = -1;
      }
    });
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const afterElement = getDragAfterElement(container, e.clientY);
      const card = e.target.closest('.poster-card');
      if (card && card !== draggedElement) {
        card.classList.add('poster-card--drag-over');
      }
    });
    container.addEventListener('dragleave', (e) => {
      const card = e.target.closest('.poster-card');
      if (card) {
        card.classList.remove('poster-card--drag-over');
      }
    });
    container.addEventListener('drop', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(container, e.clientY);
      const card = e.target.closest('.poster-card');
      if (card && card !== draggedElement) {
        if (afterElement == null) {
          container.appendChild(draggedElement);
        } else {
          container.insertBefore(draggedElement, afterElement);
        }
        // Update the underlying data
        updateListOrder(container, draggedElement);
      }
      // Clean up
      const cards = container.querySelectorAll('.poster-card');
      cards.forEach((card) => card.classList.remove('poster-card--drag-over'));
    });
    // Re-add drag handles when new cards are added
    const observer = new MutationObserver(() => {
      addDragHandles();
    });
    observer.observe(container, { childList: true, subtree: true });
  }
  /**
   * Get the element after which to insert the dragged element
   * @param {HTMLElement} container - Container element
   * @param {number} y - Y coordinate
   * @returns {HTMLElement|null} Element after which to insert
   */
  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll('.poster-card:not(.poster-card--dragging)'),
    ];
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element;
  }
  /**
   * Update the underlying data order after drag-reorder
   * @param {HTMLElement} container - Container element
   * @param {HTMLElement} draggedElement - Dragged element
   */
  function updateListOrder(container, draggedElement) {
    if (!window.appData) return;
    const containerId = container.id;
    const section = containerId.replace('List', '');
    const mediaType =
      section === 'watching' || section === 'wishlist' || section === 'watched'
        ? containerId.includes('tv')
          ? 'tv'
          : 'movies'
        : 'tv';
    const mediaKey = mediaType === 'tv' ? 'tv' : 'movies';
    if (!window.appData[mediaKey] || !window.appData[mediaKey][section]) return;
    // Get new order from DOM
    const cards = container.querySelectorAll('.poster-card');
    const newOrder = Array.from(cards)
      .map((card) => {
        const itemId = card.dataset.id || card.querySelector('[data-id]')?.dataset.id;
        return window.appData[mediaKey][section].find((item) => item.id == itemId);
      })
      .filter(Boolean);
    // Update the data
    window.appData[mediaKey][section] = newOrder;
    // Save to localStorage
    if (window.saveAppData) {
      window.saveAppData();
    } else {
      localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
    }
    showToast('success', 'Reordered', 'List order updated');
  }
  window.loadSettingsContent = function loadSettingsContent() {
    // Settings content is now in HTML, just add event handlers for new data tools
    FlickletDebug.info('⚙️ Loading settings content - adding data tools handlers');
    // Add Not Interested management handlers
    setupNotInterestedHandlers();
    // Add drag-reorder functionality
    setupDragReorder();
    // New robust export/import handlers
    const btnExport = document.getElementById('btnExport');
    const fileImport = document.getElementById('fileImport');
    FlickletDebug.info('🔍 Debug: btnExport element found:', btnExport);
    FlickletDebug.info('🔍 Debug: fileImport element found:', fileImport);
    FlickletDebug.info('🔍 Debug: window.guard function exists:', typeof window.guard);
    FlickletDebug.info('🔍 Debug: btnExport exists check:', !!btnExport);
    window.guard(!!btnExport, () => {
      FlickletDebug.info('✅ Setting up export/import handlers');
      async function collectExport() {
        // Get data from the actual localStorage keys the app uses
        const flickletData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
        const legacyData = JSON.parse(localStorage.getItem('tvMovieTrackerData') || '{}');
        const data = {
          meta: {
            app: 'Flicklet',
            version: window.FlickletApp?.version || 'n/a',
            exportedAt: new Date().toISOString(),
          },
          // Use the most recent data available
          appData: flickletData.tv || flickletData.movies ? flickletData : legacyData,
          // Also include the legacy format for compatibility
          legacyData: legacyData,
        };
        return data;
      }
      function downloadJSON(obj, filename) {
        const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      btnExport.addEventListener('click', async () => {
        FlickletDebug.info('🚀 Export button clicked!');
        try {
          const data = await collectExport();
          FlickletDebug.info('📊 Export data collected:', data);
          downloadJSON(data, `flicklet-export-${new Date().toISOString().slice(0, 10)}.json`);
          FlickletDebug.info('💾 File download initiated');
          window.showToast?.('Export created.');
        } catch (error) {
          FlickletDebug.error('❌ Export failed:', error);
          window.showToast?.('Export failed: ' + error.message);
        }
      });
      fileImport.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const json = JSON.parse(text);
          // Import the main app data
          if (json.appData) {
            localStorage.setItem('flicklet-data', JSON.stringify(json.appData));
          }
          // Import legacy data for compatibility
          if (json.legacyData) {
            localStorage.setItem('tvMovieTrackerData', JSON.stringify(json.legacyData));
          }
          // Legacy format support (for old exports)
          if (json.lists) localStorage.setItem('flicklet_lists', JSON.stringify(json.lists));
          if (json.notes) localStorage.setItem('flicklet_notes', JSON.stringify(json.notes));
          if (json.prefs) localStorage.setItem('flicklet_prefs', JSON.stringify(json.prefs));
          window.showToast?.('Import complete. Reloading…');
          setTimeout(() => location.reload(), 500);
        } catch (err) {
          FlickletDebug.error(err);
          window.showToast?.('Import failed: invalid file.');
        }
      });
    });
    // Pro preview toggle
    window.guard(!!document.getElementById('btnProTry'), () => {
      document.getElementById('btnProTry').addEventListener('click', () => {
        window.FLAGS.proEnabled = !window.FLAGS.proEnabled;
        document.body.classList.toggle('is-pro', window.FLAGS.proEnabled);
        showNotification?.(
          window.FLAGS.proEnabled ? 'Pro preview ON' : 'Pro preview OFF',
          'success',
        );
        // Update Pro state UI
        window.updateProState?.();
        // Refresh providers, extras, playlists, and trivia when Pro state changes
        FlickletDebug.info(
          '🔄 Pro toggle (btnProTry): Refreshing providers, extras, playlists, and trivia...',
          { pro: window.FLAGS.proEnabled },
        );
        if (window.__FlickletRefreshProviders) {
          window.__FlickletRefreshProviders();
          FlickletDebug.info('✅ Providers refreshed');
        }
        if (window.__FlickletRefreshExtras) {
          window.__FlickletRefreshExtras();
          FlickletDebug.info('✅ Extras refreshed');
        }
        if (window.__FlickletRefreshPlaylists) {
          window.__FlickletRefreshPlaylists();
          console.log('✅ Playlists refreshed');
        }
        if (window.__FlickletRefreshTrivia) {
          window.__FlickletRefreshTrivia();
          console.log('✅ Trivia refreshed');
        }
        if (window.__FlickletRefreshSeriesOrganizer) {
          window.__FlickletRefreshSeriesOrganizer();
          console.log('✅ Series Organizer refreshed');
        }
        // Re-check advanced notifications visibility when Pro state changes
        const advancedCard = document.getElementById('notifAdvancedCard');
        if (advancedCard) {
          if (window.FLAGS.proEnabled || window.FLAGS.notifAdvancedEnabled) {
            advancedCard.style.display = 'block';
            console.log('🔍 Debug: Advanced notifications card shown due to Pro state change');
          } else {
            advancedCard.style.display = 'none';
            console.log('🔍 Debug: Advanced notifications card hidden due to Pro state change');
          }
        }
      });
    });
    // Stats card functionality
    window.guard(!!window.FLAGS.statsEnabled && !!document.getElementById('statsContent'), () => {
      const EL = document.getElementById('statsContent');
      function getCounts() {
        // Get data from actual localStorage keys the app uses
        const flickletData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
        const legacyData = JSON.parse(localStorage.getItem('tvMovieTrackerData') || '{}');
        // Use the most recent data available
        const appData = flickletData.tv || flickletData.movies ? flickletData : legacyData;
        const counts = {
          watching: (appData.tv?.watching?.length || 0) + (appData.movies?.watching?.length || 0),
          wishlist: (appData.tv?.wishlist?.length || 0) + (appData.movies?.wishlist?.length || 0),
          watched: (appData.tv?.watched?.length || 0) + (appData.movies?.watched?.length || 0),
          notes: 0, // Notes feature not implemented yet
        };
        counts.total = counts.watching + counts.wishlist + counts.watched;
        return counts;
      }
      function render() {
        const c = getCounts();
        // Get detailed breakdown for TV and Movies
        const flickletData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
        const legacyData = JSON.parse(localStorage.getItem('tvMovieTrackerData') || '{}');
        const appData = flickletData.tv || flickletData.movies ? flickletData : legacyData;
        const tvWatching = appData.tv?.watching || [];
        const tvWishlist = appData.tv?.wishlist || [];
        const tvWatched = appData.tv?.watched || [];
        const movieWatching = appData.movies?.watching || [];
        const movieWishlist = appData.movies?.wishlist || [];
        const movieWatched = appData.movies?.watched || [];
        const totalShows = tvWatching.length + tvWishlist.length + tvWatched.length;
        const totalMovies = movieWatching.length + movieWishlist.length + movieWatched.length;
        EL.innerHTML = `
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-number">${c.watching}</div>
            <div class="stat-label">Currently Watching</div>
          </div>
          <div class="stat">
            <div class="stat-number">${c.wishlist}</div>
            <div class="stat-label">Want to Watch</div>
          </div>
          <div class="stat">
            <div class="stat-number">${c.watched}</div>
            <div class="stat-label">Already Watched</div>
          </div>
          <div class="stat">
            <div class="stat-number">${c.total}</div>
            <div class="stat-label">Total Items</div>
          </div>
        </div>
        <div class="card-surface" style="margin-top: 15px;">
          <h5 class="heading-subtle">📺 TV Shows Breakdown</h5>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 0.85rem; max-width: 75%;">
            <div><strong>${tvWatching.length}</strong> Watching</div>
            <div><strong>${tvWishlist.length}</strong> Want to Watch</div>
            <div><strong>${tvWatched.length}</strong> Watched</div>
          </div>
          <h5 class="heading-subtle" style="margin: 10px 0;">🎬 Movies Breakdown</h5>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 0.85rem; max-width: 75%;">
            <div><strong>${movieWatching.length}</strong> Watching</div>
            <div><strong>${movieWishlist.length}</strong> Want to Watch</div>
            <div><strong>${movieWatched.length}</strong> Watched</div>
          </div>
        </div>
      `;
      }
      window.addEventListener('storage', render);
      render();
    });
    // Notifications engine
    window.guard(!!window.FLAGS.notifEngineEnabled, () => {
      const masterToggle = document.getElementById('notifMasterToggle');
      // Load master toggle state
      if (masterToggle) {
        masterToggle.checked = localStorage.getItem('flicklet_notif_master') !== 'false';
        masterToggle.addEventListener('change', (e) => {
          localStorage.setItem('flicklet_notif_master', e.target.checked);
          showNotification?.(
            e.target.checked ? 'Notifications enabled' : 'Notifications disabled',
            'success',
          );
        });
      }
      function checkForUpcomingEpisodes() {
        // Skip if master toggle is off
        if (localStorage.getItem('flicklet_notif_master') === 'false') return;
        // Skip if we already checked recently (within 6 hours)
        const lastCheck = localStorage.getItem('flicklet_last_notif');
        const now = new Date();
        if (lastCheck) {
          const lastCheckDate = new Date(lastCheck);
          const hoursSinceLastCheck = (now - lastCheckDate) / (1000 * 60 * 60);
          if (hoursSinceLastCheck < 6) return;
        }
        // Get watching items
        const flickletData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
        const legacyData = JSON.parse(localStorage.getItem('tvMovieTrackerData') || '{}');
        const appData = flickletData.tv || flickletData.movies ? flickletData : legacyData;
        const watchingItems = [
          ...(appData.tv?.watching || []),
          ...(appData.movies?.watching || []),
        ];
        // Check for episodes within 24 hours
        const upcomingEpisodes = watchingItems.filter((item) => {
          if (!item.nextEpisodeAirDate) return false;
          const episodeDate = new Date(item.nextEpisodeAirDate);
          const hoursUntilEpisode = (episodeDate - now) / (1000 * 60 * 60);
          return hoursUntilEpisode > 0 && hoursUntilEpisode <= 24;
        });
        // Show notification if episodes found
        if (upcomingEpisodes.length > 0) {
          const episodeText = upcomingEpisodes.length === 1 ? 'episode' : 'episodes';
          showNotification?.(
            `🎬 ${upcomingEpisodes.length} new ${episodeText} coming soon!`,
            'success',
          );
        }
        // Update last check time
        localStorage.setItem('flicklet_last_notif', now.toISOString());
      }
      // Run check on load
      checkForUpcomingEpisodes();
      // Run check every 6 hours
      setInterval(checkForUpcomingEpisodes, 6 * 60 * 60 * 1000);
    });
    // Accessibility - Add aria-labels to dynamic card action buttons
    function addCardAccessibility() {
      document.querySelectorAll('.card .actions button').forEach((btn) => {
        if (btn.textContent.includes('Remove') && !btn.getAttribute('aria-label')) {
          btn.setAttribute('aria-label', 'Remove this item from your list');
        }
        if (btn.textContent.includes('Move to') && !btn.getAttribute('aria-label')) {
          const targetList = btn.textContent.replace('Move to ', '');
          btn.setAttribute('aria-label', `Move this item to ${targetList} list`);
        }
      });
    }
    // Call accessibility function after a short delay to ensure cards are rendered
    setTimeout(addCardAccessibility, 100);
    // Pro state management
    function updateProState() {
      const isPro = window.FLAGS.proEnabled;
      const proBadge = document.getElementById('proBadge');
      // Show/hide PRO badge
      if (proBadge) {
        proBadge.style.display = isPro ? 'inline-block' : 'none';
      }
      // Update Pro features using centralized settings manager
      const isProFromSettings = window.SettingsManager ? window.SettingsManager.isPro() : false;
      document.querySelectorAll('[data-pro="true"]').forEach((el) => {
        if (isProFromSettings) {
          el.classList.add('pro-enabled');
          el.classList.remove('locked');
          el.removeAttribute('aria-disabled');
        } else {
          el.classList.remove('pro-enabled');
          el.classList.add('locked');
          el.setAttribute('aria-disabled', 'true');
        }
      });
    }
    // Call on load and when Pro state changes
    updateProState();
    window.updateProState = updateProState;
    // Listen for settings changes
    document.addEventListener('settings:changed', (event) => {
      const { key, value } = event.detail;
      // Handle specific setting changes
      if (key === 'pro' || key === 'isPro') {
        updateProState();
      } else if (key === 'theme') {
        // Update theme
        document.documentElement.setAttribute('data-theme', value);
      } else if (key === 'lang') {
        // Update language
        if (typeof window.updateLanguage === 'function') {
          window.updateLanguage(value);
        }
      } else if (key === 'bulk') {
        // Handle bulk updates
        const changes = value;
        changes.forEach((change) => {
          if (change.key === 'pro' || change.key === 'isPro') {
            updateProState();
          } else if (change.key === 'theme') {
            document.documentElement.setAttribute('data-theme', change.value);
          } else if (change.key === 'lang') {
            if (typeof window.updateLanguage === 'function') {
              window.updateLanguage(change.value);
            }
          }
        });
      }
      console.log('Settings changed:', { key, value });
    });
    // Toggle Pro preview function for the top button
    window.toggleProPreview = function () {
      window.FLAGS.proEnabled = !window.FLAGS.proEnabled;
      document.body.classList.toggle('is-pro', window.FLAGS.proEnabled);
      showNotification?.(window.FLAGS.proEnabled ? 'Pro preview ON' : 'Pro preview OFF', 'success');
      // Update Pro state UI
      window.updateProState?.();
      // Update the Pro features list to show locked/unlocked states
      window.renderProFeaturesList?.();
      // Refresh providers, extras, playlists, and trivia when Pro state changes
      console.log(
        '🔄 Pro toggle (toggleProPreview): Refreshing providers, extras, playlists, and trivia...',
        { pro: window.FLAGS.proEnabled },
      );
      if (window.__FlickletRefreshProviders) {
        window.__FlickletRefreshProviders();
        console.log('✅ Providers refreshed');
      }
      if (window.__FlickletRefreshExtras) {
        window.__FlickletRefreshExtras();
        console.log('✅ Extras refreshed');
      }
      if (window.__FlickletRefreshPlaylists) {
        window.__FlickletRefreshPlaylists();
        console.log('✅ Playlists refreshed');
      }
      if (window.__FlickletRefreshTrivia) {
        window.__FlickletRefreshTrivia();
        console.log('✅ Trivia refreshed');
      }
      if (window.__FlickletRefreshSeriesOrganizer) {
        window.__FlickletRefreshSeriesOrganizer();
        console.log('✅ Series Organizer refreshed');
      }
      // Re-check advanced notifications visibility when Pro state changes
      const advancedCard = document.getElementById('notifAdvancedCard');
      if (advancedCard) {
        if (window.FLAGS.proEnabled || window.FLAGS.notifAdvancedEnabled) {
          advancedCard.style.display = 'block';
          console.log('🔍 Debug: Advanced notifications card shown due to Pro state change');
        } else {
          advancedCard.style.display = 'none';
          console.log('🔍 Debug: Advanced notifications card hidden due to Pro state change');
        }
      }
    };
    // Open share modal function
    window.openShareModal = function () {
      const modal = document.getElementById('shareSelectionModal');
      if (modal) {
        modal.style.display = 'flex';
        // Load the share modal content
        if (typeof window.populateShareModal === 'function') {
          window.populateShareModal();
        } else {
          showNotification?.('Share feature loading...', 'info');
        }
      } else {
        showNotification?.('Share feature coming soon!', 'info');
      }
    };
    // Advanced notifications (PRO)
    console.log(
      '🔍 Debug: Checking advanced notifications conditions. FLAGS.notifAdvancedEnabled:',
      window.FLAGS.notifAdvancedEnabled,
      'FLAGS.proEnabled:',
      window.FLAGS.proEnabled,
    );
    window.guard(!!(window.FLAGS.notifAdvancedEnabled || window.FLAGS.proEnabled), () => {
      console.log('🔍 Debug: Advanced notifications guard condition met');
      const advancedCard = document.getElementById('notifAdvancedCard');
      const leadHoursInput = document.getElementById('leadHoursInput');
      const notifScopeSelect = document.getElementById('notifScopeSelect');
      console.log('🔍 Debug: Advanced card element found:', advancedCard);
      if (advancedCard) {
        advancedCard.style.display = 'block';
        console.log('🔍 Debug: Advanced notifications card display set to block');
        // Load saved preferences
        leadHoursInput.value = localStorage.getItem('flicklet_notif_lead') || '24';
        notifScopeSelect.value = localStorage.getItem('flicklet_notif_scope') || 'watching';
        // Save preferences on change
        leadHoursInput.addEventListener('change', (e) => {
          localStorage.setItem('flicklet_notif_lead', e.target.value);
        });
        notifScopeSelect.addEventListener('change', (e) => {
          localStorage.setItem('flicklet_notif_scope', e.target.value);
        });
        // Visual feedback for Pro state
        function updateProState() {
          const isPro = window.FLAGS.proEnabled;
          if (isPro) {
            advancedCard.classList.remove('disabled');
          } else {
            advancedCard.classList.add('disabled');
          }
        }
        updateProState();
        // Update when Pro state changes
        document.addEventListener('click', (e) => {
          if (e.target.id === 'btnProTry') {
            setTimeout(updateProState, 100);
          }
        });
      }
    });
    // ---- Data Import / Export ----
    // Old flaky handlers replaced by robust implementation above
    // ---- Item Management ----
    // addToListFromCache function - finds search result items and adds them to lists
    window.addToListFromCache = async function addToListFromCache(id, list) {
      console.log('📝 addToListFromCache called with:', { id, list });
      // Try to find the item in search results or use a basic item structure
      let item = null;
      // Check if we can find the item in search results
      const searchGrid = document.getElementById('searchResultsGrid');
      if (searchGrid) {
        const card = searchGrid.querySelector(`[data-id="${id}"]`);
        if (card) {
          // Try to get the stored item data first
          if (card.dataset.itemData) {
            try {
              item = JSON.parse(card.dataset.itemData);
              console.log('📝 Found stored item data:', item);
            } catch (e) {
              console.warn('⚠️ Failed to parse stored item data:', e);
            }
          }
          // Fallback: extract item data from the card
          if (!item) {
            const title = card.querySelector('.unified-card-title')?.textContent || 'Unknown';
            const subtitle = card.querySelector('.unified-card-subtitle')?.textContent || '';
            const mediaType = card.dataset.mediaType || 'movie';
            // Create a basic item structure
            item = {
              id: Number(id),
              title: title,
              name: title, // For TV shows
              media_type: mediaType,
              // Add other fields as needed
            };
            console.log('📝 Extracted item data from card:', item);
          }
        }
      }
      // If we couldn't find the item, fetch full data from TMDB
      if (!item) {
        console.log('📝 Item not found in cache, fetching from TMDB...');
        // Try to determine media type from context or default to movie
        const mediaType = 'movie'; // Default, could be enhanced to detect from context
        try {
          // Fetch full item data from TMDB
          const tmdbData = await window.tmdbGet(`${mediaType}/${id}`);
          if (tmdbData && tmdbData.id) {
            item = {
              id: Number(id),
              title: tmdbData.title || tmdbData.name || `Item ${id}`,
              name: tmdbData.name || tmdbData.title || `Item ${id}`,
              media_type: tmdbData.media_type || mediaType,
              poster_path: tmdbData.poster_path,
              release_date: tmdbData.release_date || tmdbData.first_air_date,
              vote_average: tmdbData.vote_average,
              overview: tmdbData.overview,
              // Add other fields as needed
            };
            console.log('📝 Fetched full TMDB data:', item);
          } else {
            throw new Error('No data from TMDB');
          }
        } catch (error) {
          console.warn('⚠️ Failed to fetch TMDB data, creating basic item:', error);
          // Fallback to basic structure
          item = {
            id: Number(id),
            title: `Item ${id}`,
            name: `Item ${id}`,
            media_type: mediaType,
          };
        }
      }
      // Use the existing addToList function or create a fallback
      if (typeof window.addToList === 'function') {
        const success = window.addToList(item, list);
        if (success) {
          console.log('✅ Successfully added item to', list);
          if (typeof window.showNotification === 'function') {
            window.showNotification(`Added to ${list}`, 'success');
          }
        } else {
          console.log('⚠️ Failed to add item to', list);
          if (typeof window.showNotification === 'function') {
            window.showNotification(`Failed to add to ${list}`, 'error');
          }
        }
      } else {
        // Fallback: implement addToList directly here
        console.log('📝 addToList not available, using fallback implementation');
        try {
          // Ensure appData structure exists
          if (!window.appData) {
            window.appData = { tv: {}, movies: {} };
          }
          const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
          const category = mediaType === 'tv' ? 'tv' : 'movies';
          if (!window.appData[category]) {
            window.appData[category] = {};
          }
          if (!window.appData[category][list]) {
            window.appData[category][list] = [];
          }
          // Use adapter as canonical source - check if item already exists
          const uid = window.firebaseAuth?.currentUser?.uid || null;
          const watchlists = await window.WatchlistsAdapter.load(uid);
          const listKey = list + 'Ids';
          const exists = watchlists[listKey] && watchlists[listKey].includes(String(item.id));
          if (!exists) {
            // Add to appData for legacy compatibility
            window.appData[category][list].push(item);
            console.log('✅ Successfully added item to', list, 'using fallback');
            // Update adapter cache
            if (
              window.WatchlistsAdapter &&
              typeof window.WatchlistsAdapter.addItem === 'function'
            ) {
              const adapterResult = window.WatchlistsAdapter.addItem(item.id, list);
              console.log('📝 WatchlistsAdapter.addItem result:', adapterResult);
            }
            // Save data
            if (typeof window.saveAppData === 'function') {
              window.saveAppData();
            }
            // Emit cards:changed event for centralized count updates
            document.dispatchEvent(
              new CustomEvent('cards:changed', {
                detail: { source: 'addToListFromCache', itemId: id, list: list },
              }),
            );
            if (window.FlickletApp && typeof window.FlickletApp.updateUI === 'function') {
              window.FlickletApp.updateUI();
            }
            if (typeof window.showNotification === 'function') {
              window.showNotification(`Added to ${list}`, 'success');
            }
          } else {
            console.log('ℹ️ Item already exists in list');
            if (typeof window.showNotification === 'function') {
              window.showNotification(`Already in ${list}`, 'info');
            }
          }
        } catch (error) {
          console.error('❌ Fallback addToList failed:', error);
          if (typeof window.showNotification === 'function') {
            window.showNotification('Failed to add item', 'error');
          }
        }
      }
    };
    // Create a proper addToList function for general use
    window.addToList = function addToList(item, listName) {
      console.log('📝 addToList called:', { item: item?.id, listName });
      try {
        if (!item || !item.id) {
          console.warn('⚠️ Invalid item for addToList');
          return false;
        }
        // Ensure appData structure exists
        if (!window.appData) {
          window.appData = { tv: {}, movies: {} };
        }
        const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        const category = mediaType === 'tv' ? 'tv' : 'movies';
        if (!window.appData[category]) {
          window.appData[category] = {};
        }
        if (!window.appData[category][listName]) {
          window.appData[category][listName] = [];
        }
        // Check if already exists using WatchlistsAdapter as canonical source
        let exists = false;
        if (window.WatchlistsAdapter && window.WatchlistsAdapter._cache) {
          const cache = window.WatchlistsAdapter._cache;
          const listKey = listName + 'Ids';
          exists = cache[listKey] && cache[listKey].includes(String(item.id));
        } else {
          // Fallback to appData check
          exists = window.appData[category][listName].some(
            (existing) => Number(existing.id) === Number(item.id),
          );
        }
        if (!exists) {
          window.appData[category][listName].push(item);
          console.log('✅ Successfully added item to', listName);
          console.log('📊 Current appData structure:', {
            tv: window.appData.tv,
            movies: window.appData.movies,
          });
          // Update WatchlistsAdapter cache
          if (window.WatchlistsAdapter && typeof window.WatchlistsAdapter.addItem === 'function') {
            const adapterResult = window.WatchlistsAdapter.addItem(item.id, listName);
            console.log('📝 WatchlistsAdapter.addItem result:', adapterResult);
          }
          // Save data to localStorage
          if (typeof window.saveAppData === 'function') {
            window.saveAppData();
          }
          // Also save to Firebase if available
          if (typeof window.saveData === 'function') {
            console.log('🔄 Calling window.saveData() to sync to Firebase...');
            window.saveData();
          }
          // Emit cards:changed event for centralized count updates
          document.dispatchEvent(
            new CustomEvent('cards:changed', {
              detail: { source: 'addToList', itemId: item.id, list: listName },
            }),
          );
          if (window.FlickletApp && typeof window.FlickletApp.updateUI === 'function') {
            console.log('🔄 Calling FlickletApp.updateUI...');
            window.FlickletApp.updateUI();
          }
          return true;
        } else {
          console.log('ℹ️ Item already exists in list');
          return false;
        }
      } catch (error) {
        console.error('❌ addToList failed:', error);
        return false;
      }
    };
    window.moveItem = function moveItem(id, dest) {
      const NS = '[WL v28.19]';
      const log = (...a) => console.log(NS, ...a);
      log('moveItem called:', { id, dest, type: typeof id });
      console.log('✅ [DEBUG] moveItem function is now available on window');
      const mediaType = findItemMediaType(id);
      if (!mediaType) {
        log('No mediaType found for id:', id);
        return;
      }
      const sourceList = findItemList(id, mediaType);
      if (!sourceList) return;
      // Update WatchlistsAdapter cache
      if (window.WatchlistsAdapter.moveItem(id, sourceList, dest)) {
        log('Updated adapter cache for move:', id, sourceList, '→', dest);
      }
      const srcArr = window.appData[mediaType][sourceList];
      const idx = srcArr.findIndex((i) => i.id === id);
      if (idx === -1) return;
      const [item] = srcArr.splice(idx, 1);
      window.appData[mediaType][dest].push(item);
      window.saveAppData();
      // Also save to Firebase if available
      if (typeof window.saveData === 'function') {
        window.saveData();
      }
      // Emit cards:changed event for centralized count updates
      document.dispatchEvent(
        new CustomEvent('cards:changed', {
          detail: {
            source: 'moveItem',
            action: 'move',
            itemId: id,
            fromList: sourceList,
            toList: dest,
          },
        }),
      );
      if (window.FlickletApp) window.FlickletApp.updateUI();
      rerenderIfVisible(sourceList);
      rerenderIfVisible(dest);
      // Trigger home page re-render if available
      if (window.renderHomeRails) window.renderHomeRails();
      showToast('success', 'Item Moved', `Item moved to ${dest}`);
    };
    // Helper functions for search results and other components
    window.addToWatching = function addToWatching(item) {
      console.log('[Search] Adding to watching:', item);
      if (window.moveItem && item.id) {
        window.moveItem(Number(item.id), 'watching');
      } else {
        console.error('[Search] Cannot add to watching - missing moveItem function or item.id');
      }
    };
    window.addToWishlist = function addToWishlist(item) {
      console.log('[Search] Adding to wishlist:', item);
      if (window.moveItem && item.id) {
        window.moveItem(Number(item.id), 'wishlist');
      } else {
        console.error('[Search] Cannot add to wishlist - missing moveItem function or item.id');
      }
    };
    window.removeItemFromCurrentList = async function removeItemFromCurrentList(id) {
      const NS = '[WL v28.23]';
      const log = (...a) => console.log(NS, ...a);
      const uid = firebase.auth().currentUser?.uid;
      const db = window.firebaseDb || firebase.firestore();
      if (!uid || !db) {
        log('No auth or DB available for cloud-confirmed delete');
        return;
      }
      const mediaType = findItemMediaType(id);
      if (!mediaType) return;
      const sourceList = findItemList(id, mediaType);
      if (!sourceList) return;
      // 1) Optimistic local removal
      const prevState = JSON.parse(JSON.stringify(window.appData || {}));
      const ok = adapterRemove(id, sourceList);
      if (!ok) return;
      try {
        // 2) Persist minimal state to Firestore
        const minimal = window.pruneWatchlistsShape(window.appData || {});
        await db.doc(`users/${uid}`).set(
          {
            ...minimal,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp?.(),
          },
          { merge: true },
        );
        log('Cloud confirm OK for', id, 'from', sourceList);
        // 3) Mirror to local (guarded)
        if (typeof window.saveData === 'function') {
          window.saveData();
        }
        showToast('success', 'Item Removed', 'Item removed successfully');
      } catch (e) {
        log('Cloud save failed, rolling back:', e);
        // 4) Rollback local state
        window.appData = prevState;
        // Re-render UI with restored state
        if (window.FlickletApp) window.FlickletApp.updateUI();
        rerenderIfVisible(sourceList);
        if (window.renderHomeRails) window.renderHomeRails();
        // Emit cards:changed event for centralized count updates
        document.dispatchEvent(
          new CustomEvent('cards:changed', {
            detail: {
              source: 'adapterRemove-fallback',
              action: 'remove',
              itemId: id,
              list: sourceList,
            },
          }),
        );
        showToast('error', 'Remove Failed', 'Failed to remove item. Please try again.');
      }
    };
    // Helper that applies existing removal logic; return true if changed
    function adapterRemove(itemId, listKey) {
      try {
        const mediaType = findItemMediaType(itemId);
        if (!mediaType) return false;
        // Update WatchlistsAdapter cache
        if (window.WatchlistsAdapter && window.WatchlistsAdapter.removeItem(itemId, listKey)) {
          console.log('[WL v28.23] Updated adapter cache for removal:', itemId, 'from', listKey);
        }
        const srcArr = window.appData[mediaType][listKey];
        const idx = srcArr.findIndex((i) => i.id === itemId);
        if (idx === -1) return false;
        srcArr.splice(idx, 1);
        // Emit cards:changed event for centralized count updates
        document.dispatchEvent(
          new CustomEvent('cards:changed', {
            detail: {
              source: 'adapterRemove-direct',
              action: 'remove',
              itemId: itemId,
              list: listKey,
            },
          }),
        );
        if (window.FlickletApp) window.FlickletApp.updateUI();
        rerenderIfVisible(listKey);
        // Trigger home page re-render if available
        if (window.renderHomeRails) window.renderHomeRails();
        return true;
      } catch (error) {
        console.error('[WL v28.23] adapterRemove failed:', error);
        return false;
      }
    }
    function findItemMediaType(id) {
      // Use adapter as canonical source
      if (window.WatchlistsAdapter && window.WatchlistsAdapter._cache) {
        const cache = window.WatchlistsAdapter._cache;
        const idStr = String(id);
        // Check if item exists in any list
        if (
          cache.watchingIds?.includes(idStr) ||
          cache.wishlistIds?.includes(idStr) ||
          cache.watchedIds?.includes(idStr)
        ) {
          // Determine media type by checking which list contains the item
          // and looking up the actual item data
          const item = window.WatchlistsAdapter.getItemData(id);
          if (item) {
            return item.media_type === 'tv' ? 'tv' : 'movies';
          }
        }
      }
      // Fallback to appData for legacy compatibility
      const appData = window.appData || {};
      if (
        appData.tv?.watching?.some((i) => i.id === id) ||
        appData.tv?.wishlist?.some((i) => i.id === id) ||
        appData.tv?.watched?.some((i) => i.id === id)
      ) {
        return 'tv';
      }
      if (
        appData.movies?.watching?.some((i) => i.id === id) ||
        appData.movies?.wishlist?.some((i) => i.id === id) ||
        appData.movies?.watched?.some((i) => i.id === id)
      ) {
        return 'movies';
      }
      return null;
    }
    function findItemList(id, mediaType) {
      // Use adapter as canonical source
      if (window.WatchlistsAdapter && window.WatchlistsAdapter._cache) {
        const cache = window.WatchlistsAdapter._cache;
        const idStr = String(id);
        const lists = ['watching', 'wishlist', 'watched'];
        for (const list of lists) {
          const listKey = list + 'Ids';
          if (cache[listKey]?.includes(idStr)) {
            return list;
          }
        }
      }
      // Fallback to appData for legacy compatibility
      const appData = window.appData || {};
      const lists = ['watching', 'wishlist', 'watched'];
      for (const list of lists) {
        if (appData[mediaType]?.[list]?.some((i) => i.id === id)) {
          return list;
        }
      }
      return null;
    }
    // ---- Theme Management ----
    // toggleDarkMode is now centralized in utils.js
    // ---- Language Management ----
    // OLD changeLanguage function removed - now using LanguageManager
    // The new changeLanguage is defined in language-manager.js
    // ---- FlickWord Game ----
    window.startDailyCountdown = function startDailyCountdown() {
      const countdownElement = document.getElementById('flickwordCountdown');
      if (!countdownElement) return;
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const timeLeft = tomorrow - now;
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      countdownElement.textContent = `${hours}h ${minutes}m`;
      // Update every minute
      setTimeout(startDailyCountdown, 60000);
    };
    window.updateFlickWordStats = function updateFlickWordStats() {
      const todayScore = document.getElementById('flickwordTodayScore');
      const bestStreak = document.getElementById('flickwordBestStreak');
      const gamesPlayed = document.getElementById('flickwordGamesPlayed');
      if (todayScore) todayScore.textContent = appData.flickword?.todayScore || 0;
      if (bestStreak) bestStreak.textContent = appData.flickword?.bestStreak || '-';
      if (gamesPlayed) gamesPlayed.textContent = appData.flickword?.gamesPlayed || 0;
    };
    window.startFlickWordGame = function startFlickWordGame() {
      showNotification('FlickWord game starting soon! 🎮', 'success');
    };
    // ---- Scroll Indicators for Horizontal Layout ----
    function addScrollIndicators(container) {
      if (!container || !container.classList.contains('list-container')) return;
      // Add scroll event listener to show/hide scroll indicators
      const updateScrollIndicators = () => {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        if (scrollWidth > clientWidth) {
          container.classList.add('scrollable');
          if (scrollLeft > 0) {
            container.classList.add('scrollable-left');
          } else {
            container.classList.remove('scrollable-left');
          }
        } else {
          container.classList.remove('scrollable', 'scrollable-left');
        }
      };
      // Initial check
      updateScrollIndicators();
      // Add scroll listener
      container.addEventListener('scroll', updateScrollIndicators);
      // Add resize listener to recalculate on window resize
      window.addEventListener('resize', updateScrollIndicators);
    }
    // ---- Stats Card Renderer ----
    window.renderStatsCard = function renderStatsCard() {
      if (!window.FLAGS?.statsEnabled) return;
      const statsContent = document.getElementById('statsContent');
      if (!statsContent) return;
      try {
        const appData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
        const tvWatching = appData.tv?.watching || [];
        const tvWishlist = appData.tv?.wishlist || [];
        const tvWatched = appData.tv?.watched || [];
        const movieWatching = appData.movies?.watching || [];
        const movieWishlist = appData.movies?.wishlist || [];
        const movieWatched = appData.movies?.watched || [];
        const totalShows = tvWatching.length + tvWishlist.length + tvWatched.length;
        const totalMovies = movieWatching.length + movieWishlist.length + movieWatched.length;
        const totalItems = totalShows + totalMovies;
        statsContent.innerHTML = `
      <div class="stats-grid">
        <div class="stat">
          <div class="stat-number">${tvWatching.length + movieWatching.length}</div>
          <div class="stat-label">Currently Watching</div>
        </div>
        <div class="stat">
          <div class="stat-number">${tvWishlist.length + movieWishlist.length}</div>
          <div class="stat-label">Want to Watch</div>
        </div>
        <div class="stat">
          <div class="stat-number">${tvWatched.length + movieWatched.length}</div>
          <div class="stat-label">Already Watched</div>
        </div>
        <div class="stat">
          <div class="stat-number">${totalItems}</div>
          <div class="stat-label">Total Items</div>
        </div>
      </div>
      <div class="card-surface" style="margin-top: 15px;">
        <h5 class="heading-subtle">📺 TV Shows Breakdown</h5>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 0.85rem; max-width: 75%;">
          <div><strong>${tvWatching.length}</strong> Watching</div>
          <div><strong>${tvWishlist.length}</strong> Want to Watch</div>
          <div><strong>${tvWatched.length}</strong> Watched</div>
        </div>
        <h5 class="heading-subtle" style="margin: 10px 0;">🎬 Movies Breakdown</h5>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 0.85rem; max-width: 75%;">
          <div><strong>${movieWatching.length}</strong> Watching</div>
          <div><strong>${movieWishlist.length}</strong> Want to Watch</div>
          <div><strong>${movieWatched.length}</strong> Watched</div>
        </div>
      </div>
    `;
      } catch (error) {
        console.error('Error rendering stats card:', error);
        statsContent.innerHTML = '<div class="error">Failed to load stats</div>';
      }
    };
    // ---- Pro Features List Renderer ----
    window.renderProFeaturesList = function renderProFeaturesList() {
      const proFeaturesList = document.getElementById('proFeaturesList');
      if (!proFeaturesList) return;
      const isProEnabled = window.SettingsManager ? window.SettingsManager.isPro() : false;
      proFeaturesList.innerHTML = `
    <div class="pro-features">
      <div class="pro-feature ${isProEnabled ? 'unlocked' : 'locked'}">
        <div class="pro-feature-icon">🔔</div>
        <div class="pro-feature-content">
          <div class="pro-feature-title">Smart Notifications</div>
          ${isProEnabled ? '<div class="pro-feature-desc">Get notified exactly when you want - set custom lead times for new episodes, choose which lists to monitor, and never miss your favorite shows again.</div>' : ''}
        </div>
        <div class="pro-feature-status">${isProEnabled ? '✅' : '🔒'}</div>
      </div>
      <div class="pro-feature ${isProEnabled ? 'unlocked' : 'locked'}">
        <div class="pro-feature-icon">📊</div>
        <div class="pro-feature-content">
          <div class="pro-feature-title">Your Viewing Journey</div>
          ${isProEnabled ? '<div class="pro-feature-desc">Discover your watching habits with beautiful charts showing your favorite genres, binge patterns, and viewing trends over time.</div>' : ''}
        </div>
        <div class="pro-feature-status">${isProEnabled ? '✅' : '🔒'}</div>
      </div>
      <div class="pro-feature ${isProEnabled ? 'unlocked' : 'locked'}">
        <div class="pro-feature-icon">🎨</div>
        <div class="pro-feature-content">
          <div class="pro-feature-title">Advanced Customization</div>
          ${isProEnabled ? '<div class="pro-feature-desc">Unlock premium color schemes, custom accent colors, and advanced layout options to create your perfect viewing experience.</div>' : ''}
        </div>
        <div class="pro-feature-status">${isProEnabled ? '✅' : '🔒'}</div>
      </div>
      <div class="pro-feature ${isProEnabled ? 'unlocked' : 'locked'}">
        <div class="pro-feature-icon">👥</div>
        <div class="pro-feature-content">
          <div class="pro-feature-title">Social Features</div>
          ${isProEnabled ? '<div class="pro-feature-desc">Connect with friends, compare your taste, share recommendations, and discover what your social circle is watching. See who has similar viewing habits!</div>' : ''}
        </div>
        <div class="pro-feature-status">${isProEnabled ? '✅' : '🔒'}</div>
      </div>
      <div class="pro-feature ${isProEnabled ? 'unlocked' : 'locked'}">
        <div class="pro-feature-icon">⚡</div>
        <div class="pro-feature-content">
          <div class="pro-feature-title">VIP Support</div>
          ${isProEnabled ? '<div class="pro-feature-desc">Get help when you need it with priority support. Our team responds faster to Pro users and provides personalized assistance for any questions or issues.</div>' : ''}
        </div>
        <div class="pro-feature-status">${isProEnabled ? '✅' : '🔒'}</div>
      </div>
    </div>
  `;
    };
    // ---- Upcoming Episodes (Tonight On) ----
    window.loadUpcomingEpisodes = function loadUpcomingEpisodes() {
      if (!window.FLAGS?.upcomingEpisodesEnabled) {
        // Force hide the section if it exists
        const upcomingEpisodes = document.getElementById('upcomingEpisodes');
        if (upcomingEpisodes) {
          upcomingEpisodes.style.display = 'none';
        }
        return;
      }
      const upcomingSectionEl = document.getElementById('upcomingEpisodes');
      const upcomingListEl = document.getElementById('upcomingEpisodesList');
      if (!upcomingSectionEl || !upcomingListEl) return;
      console.log('🌙 Loading upcoming episodes content');
      try {
        const appData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
        // Get watching shows from both tv and movies categories
        const tvWatching = appData.tv?.watching || [];
        const movieWatching = appData.movies?.watching || [];
        const watching = [...tvWatching, ...movieWatching];
        console.log('🔍 Front spotlight data check:', {
          tvWatching: tvWatching.length,
          movieWatching: movieWatching.length,
          totalWatching: watching.length,
          sampleShow: watching[0],
        });
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const episodes = [];
        // Test episode removed - now using real data
        watching.forEach((show) => {
          // Skip shows with invalid data
          if (!show || (!show.name && !show.original_name)) {
            console.log('⚠️ Skipping invalid show:', show);
            return;
          }
          const showName = show.name || show.original_name || 'Unknown Show';
          // Check multiple possible fields for next air date
          const nextAirDate =
            show.nextEpisodeAirDate ||
            show.next_air_date ||
            show.next_episode_to_air?.air_date ||
            show.next_episode_to_air?.first_air_date;
          console.log(
            '🔍 Checking show:',
            showName,
            'nextAirDate:',
            nextAirDate,
            'next_episode_to_air:',
            show.next_episode_to_air,
          );
          if (!nextAirDate) return;
          const airDate = new Date(nextAirDate);
          console.log('🔍 Air date parsed:', airDate, 'is valid:', !isNaN(airDate.getTime()));
          if (airDate >= now && airDate <= nextWeek) {
            console.log('✅ Found upcoming episode:', showName);
            episodes.push({
              showName: showName,
              airDate: airDate,
              episodeInfo: show.nextEpisodeName || 'New Episode',
            });
          }
        });
        episodes.sort((a, b) => a.airDate - b.airDate);
        if (episodes.length === 0) {
          upcomingListEl.innerHTML =
            '<div class="no-episodes">No upcoming episodes this week.</div>';
        } else {
          const top8 = episodes.slice(0, 8);
          upcomingListEl.innerHTML = top8
            .map(
              (episode) => `
        <div class="upcoming-episode-item">
          <div class="show-info">
            <div class="show-name">${episode.showName}</div>
            <div class="episode-info">${episode.episodeInfo}</div>
          </div>
          <div class="air-date">
            ${episode.airDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      `,
            )
            .join('');
        }
        upcomingSectionEl.style.display = 'block';
      } catch (error) {
        console.error('Error loading upcoming episodes:', error);
        upcomingSectionEl.style.display = 'none';
      }
    };
    /**
     * Process: Counter Bootstrap System
     * Purpose: Real-time count updates for tabs and sections based on visible cards
     * Data Source: DOM elements with data-count-for attributes
     * Update Path: MutationObserver watches for DOM changes in target sections
     * Dependencies: data-count-for attributes in HTML, cards:refreshed events
     */
    // Counter Bootstrap System
    window.CounterBootstrap = {
      observers: new Map(),
      updateThrottle: new Map(),
      lastUpdate: new Map(),
      armed: false,
      // Unified card selector - single source of truth
      UNIFIED_CARD_SELECTOR: '[data-item-id][data-list-type]',
      EXCLUSION_SELECTORS: [
        '.unified-card-poster-skeleton',
        '.unified-card-poster-placeholder',
        '.skeleton',
        '.placeholder',
        '.empty',
        '.ad',
        '.hidden',
        '[aria-hidden="true"]',
        '[hidden]',
      ],
      init() {
        // Prevent duplicate initialization
        if (this.initialized) {
          console.log('[Counts v28.17] Counter Bootstrap already initialized, skipping');
          return;
        }
        console.log('[Counts v28.17] Initializing Counter Bootstrap System');
        this.armed = true;
        this.setupGlobalListeners();
        // Try immediate scan, but don't fail if containers aren't ready
        if (this.scanAndAttach()) {
          this.initialized = true;
        } else {
          console.log('[Counts v28.17] Armed but waiting for first render signal');
        }
      },
      scanAndAttach() {
        // Find all elements with data-count-for attributes
        const countElements = document.querySelectorAll('[data-count-for]');
        console.log(`[Counts v28.17] Found ${countElements.length} count elements to attach`);
        let allMapped = true;
        countElements.forEach((element) => {
          const targetSelector = element.getAttribute('data-count-for');
          const targetSection = document.querySelector(targetSelector);
          if (!targetSection) {
            console.warn(`[Counts v28.17] Target section not found: ${targetSelector}`);
            allMapped = false;
            return;
          }
          // Check if observer already exists for this element
          const observerId = `${element.id}-${targetSection.id}`;
          if (this.observers.has(observerId)) {
            console.log(`[Counts v28.17] Observer already exists for ${element.id}, skipping`);
            return;
          }
          // Attach MutationObserver to target section
          this.attachObserver(element, targetSection);
          // Initial count update
          this.updateCount(element, targetSection);
        });
        return allMapped;
      },
      attachObserver(countElement, targetSection) {
        const observerId = `${countElement.id}-${targetSection.id}`;
        // Remove existing observer if any
        if (this.observers.has(observerId)) {
          this.observers.get(observerId).disconnect();
        }
        // Create new observer
        const observer = new MutationObserver((mutations) => {
          this.throttledUpdate(countElement, targetSection);
        });
        // Start observing with reduced sensitivity
        observer.observe(targetSection, {
          childList: true,
          subtree: true,
          attributes: false, // Disable attribute watching to reduce triggers
        });
        this.observers.set(observerId, observer);
        console.log(`🔢 Attached observer for ${countElement.id} -> ${targetSection.id}`);
      },
      throttledUpdate(countElement, targetSection) {
        const key = `${countElement.id}-${targetSection.id}`;
        const now = Date.now();
        // Check if we've updated recently (debounce)
        if (this.lastUpdate.has(key) && now - this.lastUpdate.get(key) < 100) {
          return; // Skip if updated within last 100ms
        }
        // Clear existing timeout
        if (this.updateThrottle.has(key)) {
          clearTimeout(this.updateThrottle.get(key));
        }
        // Set new timeout with reduced debounce
        const timeoutId = setTimeout(() => {
          this.updateCount(countElement, targetSection);
          this.updateThrottle.delete(key);
          this.lastUpdate.set(key, Date.now());
        }, 75); // Reduced to 75ms throttle for responsiveness
        this.updateThrottle.set(key, timeoutId);
      },
      // Direct recount bypassing debounce for UI actions
      directRecount() {
        console.log('[Counts v28.17] Direct recount triggered');
        this.observers.forEach((observer, observerId) => {
          const [elementId, sectionId] = observerId.split('-');
          const element = document.getElementById(elementId);
          const section = document.getElementById(sectionId);
          if (element && section) {
            this.updateCount(element, section);
          }
        });
      },
      updateCount(countElement, targetSection) {
        try {
          // Count visible cards in target section
          let visibleCards = this.countVisibleCards(targetSection);
          // Debug logging
          console.log(`🔢 Counting cards in ${targetSection.id}:`, {
            elementId: countElement.id,
            visibleCards: visibleCards,
            sectionId: targetSection.id,
            sectionChildren: targetSection.children.length,
          });
          // If no visible cards found, use fallback count from WatchlistsAdapter
          if (visibleCards === 0) {
            const fallbackCount = this.getFallbackCount(countElement.id, targetSection.id);
            if (fallbackCount > 0) {
              console.log(`🔢 Using fallback count for ${countElement.id}: ${fallbackCount}`);
              visibleCards = fallbackCount;
            }
          }
          // Only update if count has actually changed
          const currentCount = parseInt(countElement.textContent) || 0;
          if (currentCount === visibleCards) {
            return; // No change, skip update
          }
          // Update count element
          countElement.textContent = visibleCards;
          // Apply badge styling if it's a badge element
          if (
            countElement.classList.contains('tab-badge') ||
            countElement.classList.contains('badge')
          ) {
            this.applyBadgeStyling(countElement);
          }
          // Log all count updates for debugging
          console.log(
            `🔢 Updated count for ${countElement.id}: ${visibleCards} visible cards (was ${currentCount})`,
          );
        } catch (error) {
          console.error(`🔢 Error updating count for ${countElement.id}:`, error);
        }
      },
      getFallbackCount(countElementId, sectionId) {
        // Use WatchlistsAdapter as primary source for accurate counts
        if (window.WatchlistsAdapter && window.WatchlistsAdapter._cache) {
          const cache = window.WatchlistsAdapter._cache;
          // Map count element IDs to list types
          const listTypeMap = {
            watchingBadge: 'watchingIds',
            watchingCount: 'watchingIds',
            wishlistBadge: 'wishlistIds',
            wishlistCount: 'wishlistIds',
            watchedBadge: 'watchedIds',
            watchedCount: 'watchedIds',
          };
          const listKey = listTypeMap[countElementId];
          if (listKey && cache[listKey]) {
            console.log(
              `🔢 Using WatchlistsAdapter cache for ${countElementId}: ${cache[listKey].length}`,
            );
            return cache[listKey].length;
          }
        }
        // Fallback to appData count when WatchlistsAdapter not available
        if (!window.appData) return 0;
        const appData = window.appData;
        const tv = appData.tv || {};
        const movies = appData.movies || {};
        // Map count element IDs to list types
        const listTypeMap = {
          watchingBadge: 'watching',
          watchingCount: 'watching',
          wishlistBadge: 'wishlist',
          wishlistCount: 'wishlist',
          watchedBadge: 'watched',
          watchedCount: 'watched',
        };
        const listType = listTypeMap[countElementId];
        if (!listType) return 0;
        // Use the same deduplication logic as loadListContent
        const allItems = [
          ...(Array.isArray(tv[listType]) ? tv[listType] : []),
          ...(Array.isArray(movies[listType]) ? movies[listType] : []),
        ];
        // Deduplicate items by ID (same logic as loadListContent)
        const items = [];
        const seenIds = new Set();
        allItems.forEach((item) => {
          const id = item.id || item.tmdb_id || item.tmdbId;
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            items.push(item);
          }
        });
        console.log(
          `🔢 Fallback count for ${countElementId}: ${items.length} (deduplicated from ${allItems.length})`,
        );
        return items.length;
      },
      countVisibleCards(section) {
        // Use unified selector - single source of truth
        const cards = section.querySelectorAll(this.UNIFIED_CARD_SELECTOR);
        let visibleCount = 0;
        console.log(`[Counts v28.17] Counting cards in ${section.id}:`, {
          totalCards: cards.length,
          sectionChildren: section.children.length,
        });
        cards.forEach((card) => {
          if (this.isCardVisible(card)) {
            visibleCount++;
          }
        });
        // Log exclusions for debugging
        const excludedCount = cards.length - visibleCount;
        if (excludedCount > 0) {
          console.log(`[Counts v28.17] Excluded ${excludedCount} cards (hidden/inactive)`);
        }
        console.log(`[Counts v28.17] Final count for ${section.id}: ${visibleCount} visible cards`);
        return visibleCount;
      },
      isCardVisible(card) {
        // Check if card is visible (not hidden by common patterns)
        const computedStyle = window.getComputedStyle(card);
        // Check display property
        if (computedStyle.display === 'none') return false;
        // Check visibility property
        if (computedStyle.visibility === 'hidden') return false;
        // Check opacity
        if (parseFloat(computedStyle.opacity) === 0) return false;
        // Check for hidden attributes/classes
        if (card.hasAttribute('hidden')) return false;
        if (card.classList.contains('hidden')) return false;
        if (card.classList.contains('is-hidden')) return false;
        if (card.hasAttribute('aria-hidden') && card.getAttribute('aria-hidden') === 'true')
          return false;
        // Check if card is in an inactive tab pane
        const tabSection = card.closest('.tab-section');
        if (tabSection && !tabSection.classList.contains('active')) {
          return false;
        }
        // Check for exclusion selectors
        for (const exclusionSelector of this.EXCLUSION_SELECTORS) {
          if (card.matches(exclusionSelector)) {
            return false;
          }
        }
        // Check inline styles
        const style = card.style;
        if (style.display === 'none') return false;
        if (style.visibility === 'hidden') return false;
        if (style.opacity === '0') return false;
        return true;
      },
      setupGlobalListeners() {
        // Listen for cards:changed events (emitted after render batches)
        document.addEventListener('cards:changed', () => {
          console.log('[Counts v28.17] cards:changed event received - triggering recount');
          this.directRecount();
        });
        // Listen for app:lists-rendered events
        document.addEventListener('app:lists-rendered', () => {
          console.log('[Counts v28.17] app:lists-rendered event received');
          if (!this.initialized && this.armed) {
            if (this.scanAndAttach()) {
              this.initialized = true;
              console.log('[Counts v28.17] Late bind successful - first real recount complete');
            }
          } else {
            this.directRecount();
          }
        });
        // Listen for tab switches
        document.addEventListener('tab:switched', () => {
          console.log('[Counts v28.17] tab:switched event received - triggering recount');
          this.directRecount();
        });
        // Listen for language changes
        document.addEventListener('language:changed', () => {
          console.log('[Counts v28.17] language:changed event received - triggering recount');
          this.directRecount();
        });
      },
      applyBadgeStyling(badge) {
        // Use CSS classes instead of inline styles
        badge.classList.add('tab-badge', 'tab-badge--visible');
      },
      updateAllCounts() {
        // Update counts for all existing observers without re-scanning
        this.observers.forEach((observer, observerId) => {
          const [elementId, sectionId] = observerId.split('-');
          const element = document.getElementById(elementId);
          const section = document.getElementById(sectionId);
          if (element && section) {
            this.updateCount(element, section);
          }
        });
      },
      destroy() {
        // Clean up all observers
        this.observers.forEach((observer) => observer.disconnect());
        this.observers.clear();
        // Clear all timeouts
        this.updateThrottle.forEach((timeoutId) => clearTimeout(timeoutId));
        this.updateThrottle.clear();
        console.log('🔢 Counter Bootstrap System destroyed');
      },
    };
    // Initialize the counter bootstrap system
    // CounterBootstrap is already defined as an object above, no need to instantiate
    // Main FlickletApp object wrapper
    window.FlickletApp = {
      // All functions are already defined above
      // This wrapper ensures proper namespace
    };
  };
})();
