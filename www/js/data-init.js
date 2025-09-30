(function () {
  const NS = '[data-init]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => {
    try {
      console.warn(NS, ...a);
    } catch (e) {
      console.error('[data-init] warn function error:', e);
    }
  };
  const err = (...a) => console.error(NS, ...a);

  // Public flags
  window.__CLOUD_ENABLED__ = false;
  window.__AUTH_READY__ = false;

  // Local state
  let app = window.firebaseApp || null;
  let auth = window.firebaseAuth || null;
  let db = window.firebaseDb || null;

  // Helper: safe JSON storage
  const storage = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, val) {
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch {}
    },
  };

  // Helper: read appData safely
  function readLocalAppData() {
    return storage.get('flicklet-data', {
      tv: { watching: [], wishlist: [], watched: [] },
      movies: { watching: [], wishlist: [], watched: [] },
      settings: {
        pro: false, // Default to false - only true if user account has Pro
        isPro: false, // Alias for pro
        episodeTracking: false,
        theme: 'light',
        lang: 'en',
      },
    });
  }

  // Helper: write appData safely
  function writeLocalAppData(data) {
    if (!data || typeof data !== 'object') return;
    storage.set('flicklet-data', data);
  }

  // Helper: clear user data on sign out
  function clearUserData() {
    try {
      // Clear localStorage data
      localStorage.removeItem('flicklet-data');
      localStorage.removeItem('tvMovieTrackerData');
      localStorage.removeItem('flicklet_lists');
      localStorage.removeItem('flicklet_notes');
      localStorage.removeItem('flicklet_prefs');

      // Reset appData to empty state
      const emptyData = {
        tv: { watching: [], wishlist: [], watched: [] },
        movies: { watching: [], wishlist: [], watched: [] },
        settings: {
          pro: false, // Default to false - only true if user account has Pro
          isPro: false, // Alias for pro
          episodeTracking: false,
          theme: 'light',
          lang: 'en',
        },
      };

      // Update window.appData if it exists
      if (window.appData) {
        window.appData.tv = emptyData.tv;
        window.appData.movies = emptyData.movies;
        window.appData.settings = emptyData.settings;
      }

      // Write empty data to localStorage
      writeLocalAppData(emptyData);

      // Update UI
      document.dispatchEvent(new CustomEvent('app:data:ready', { detail: { source: 'cleared' } }));

      log('User data cleared successfully');
    } catch (e) {
      err('Failed to clear user data:', e?.message || e);
    }
  }

  // Expose a manual loader used by logs you've seen
  window.loadUserDataAndReplaceCards = async function loadUserDataAndReplaceCards() {
    try {
      const A = readLocalAppData();
      // no DOM mutation here—functions.js handles rendering.
      log('local appData loaded:', { hasTV: !!A?.tv, hasMovies: !!A?.movies });
      document.dispatchEvent(
        new CustomEvent('app:data:ready', { detail: { source: 'localStorage' } }),
      );
      // Do not call trySync here - it will be called after auth is ready
    } catch (e) {
      err('loadUserDataAndReplaceCards failed:', e?.message || e);
    }
  };

  // --- compat helpers (data-init.js) ---
  const getUser = () => (firebase.auth && firebase.auth().currentUser) || null;
  const getDb = () => window.db; // compat Firestore instance

  async function waitForAuthReady() {
    const u = getUser();
    if (u) return u;
    // Prefer AuthStateManager if present
    if (window.AuthStateManager?.init) {
      await window.AuthStateManager.init();
      return window.AuthStateManager.getCurrentUser?.() || getUser();
    }
    return await new Promise((resolve) => {
      // Wait for auth:ready event instead of direct listener
      const handleAuthReady = () => {
        document.removeEventListener('auth:ready', handleAuthReady);
        resolve(window.currentUser || null);
      };
      document.addEventListener('auth:ready', handleAuthReady);
    });
  }

  // Guarded Firebase import + readiness
  (async function init() {
    try {
      log('ready');
      app = window.firebaseApp || null;
      auth = window.firebaseAuth || null;
      db = window.firebaseDb || null;

      if (!app || !auth || !db) {
        // Attempt modular imports lazily (won't throw if CSP blocks—caught)
        try {
          const [{ getAuth }, { getFirestore }] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js'),
          ]);
          if (!app) app = window.firebaseApp || null;
          if (!auth) auth = window.firebaseAuth || getAuth(app);
          if (!db) db = window.firebaseDb || getFirestore(app);
        } catch (e) {
          // This is expected when CSP blocks dynamic imports - not an error
          log('modular import skipped (CSP policy):', e?.message || e);
        }
      }

      window.__AUTH_READY__ = !!auth;
      // Cloud is "enabled" only if all parts present
      window.__CLOUD_ENABLED__ = !!(app && auth && db);

      // Always surface local data immediately
      await window.loadUserDataAndReplaceCards();

      // If cloud is enabled, auth state changes are now handled by AuthManager
      if (window.__CLOUD_ENABLED__) {
        log('Cloud enabled - auth state changes handled by centralized AuthManager');
      } else {
        log('cloud disabled (auth/db not ready) — local-only mode');

        // Listen for Firebase ready event
        window.addEventListener('firebase:ready', async () => {
          log('Firebase ready event received, re-evaluating cloud status');

          // Re-check Firebase availability
          const app = window.firebaseApp;
          const auth = window.firebaseAuth;
          const db = window.firebaseDb;

          if (app && auth && db) {
            window.__CLOUD_ENABLED__ = true;
            window.__AUTH_READY__ = true;
            log('Cloud sync enabled after Firebase ready event');

            // Subscribe to auth events instead of direct listener
            document.addEventListener('auth:changed', async (event) => {
              const user = event.detail.user;
              log('auth state:', user ? 'signed-in' : 'signed-out');

              if (user) {
                try {
                  await trySync('auth-change');

                  // Trigger UI refresh after data sync
                  setTimeout(() => {
                    if (typeof window.updateUI === 'function') {
                      log('Triggering UI refresh after auth change (ready event)');
                      window.updateUI();
                    }
                    // Emit cards:changed event for centralized count updates
                    document.dispatchEvent(
                      new CustomEvent('cards:changed', {
                        detail: { source: 'data-init-ready' },
                      }),
                    );
                    log('Emitted cards:changed event after auth change (ready event)');
                  }, 500);
                } catch (e) {
                  warn('sync on auth-change failed:', e?.message || e);
                }
              } else {
                // Check if this is a redirect sign-in in progress
                const isRedirectInProgress =
                  window.location.search.includes('auth') ||
                  window.location.hash.includes('auth') ||
                  document.referrer.includes('accounts.google.com') ||
                  document.referrer.includes('google.com');

                // Check if sign-in was actually attempted
                const signInAttempted = window.__SIGN_IN_ATTEMPTED__;

                log('🔍 Checking redirect status (ready event):', {
                  search: window.location.search,
                  hash: window.location.hash,
                  referrer: document.referrer,
                  isRedirectInProgress,
                  signInAttempted,
                });

                if (isRedirectInProgress) {
                  log(
                    '⏳ Auth state change during redirect (ready event) - waiting for redirect result',
                  );
                  return;
                }

                // Only clear data if sign-in was actually attempted
                if (signInAttempted) {
                  log(
                    '🧹 User signed out after sign-in attempt (ready event) - clearing local data',
                  );
                  clearUserData();
                } else {
                  log('ℹ️ No sign-in attempt detected (ready event) - keeping existing data');
                }
              }
            });

            // Try immediate sync if user is already signed in
            if (auth.currentUser) {
              try {
                await trySync('firebase-ready');
              } catch (e) {
                warn('immediate sync failed:', e?.message || e);
              }
            }
          }
        });

        // Fallback auth listener removed - now handled by centralized AuthManager
      }
    } catch (e) {
      err('init failure:', e?.message || e);
    }
  })();

  // Safe Firestore doc accessor (compat API)
  function getUserDocRef(kind) {
    if (!window.__CLOUD_ENABLED__) throw new Error('cloud-disabled');
    const currentAuth = window.firebaseAuth || auth;
    const uid = currentAuth?.currentUser?.uid;
    if (!uid) throw new Error('no-user');

    // Use window.firebaseDb directly instead of captured db variable
    const db = window.firebaseDb;
    if (!db) throw new Error('no-db');

    if (kind === 'settings')
      return db.collection('users').doc(uid).collection('settings').doc('app');
    if (kind === 'lists') return db.collection('users').doc(uid); // Read from user root document
    throw new Error('bad-kind');
  }

  // Backoff helper
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Sync routine (pull settings + lists into localStorage); never throws out
  async function trySync(reason = 'manual') {
    try {
      // Guard: ensure user - use current auth state, not captured variable
      const user = getUser();
      if (!user) {
        warn('sync skipped:', reason, '- no user');
        return;
      }

      const db = getDb();
      if (!db) {
        warn('sync skipped:', reason, '- no db');
        return;
      }

      log('sync: starting (auth ready)');

      // Read local data first to check timestamps
      const local = readLocalAppData();
      const localLastUpdated = local.settings?.lastUpdated || 0;

      // Pull remote using compat API
      const [settingsRef, listsRef] = [getUserDocRef('settings'), getUserDocRef('lists')];

      const [settingsSnap, listsSnap] = await Promise.all([settingsRef.get(), listsRef.get()]);

      // Check if local data is newer than Firebase data
      let shouldOverwriteLocal = true;
      // Handle both DocumentSnapshot (.exists()) and QuerySnapshot (.empty) cases
      // Detect snapshot type
      const isDoc = typeof listsSnap.exists === 'function';
      const hasData = isDoc ? listsSnap.exists() : !listsSnap.empty;

      if (hasData) {
        let remote = {};
        if (isDoc) {
          remote = listsSnap.data() || {};
        } else if (!listsSnap.empty) {
          // Merge the first doc, or all docs depending on your schema
          remote = listsSnap.docs[0]?.data() || {};
        }

        const remoteLastUpdated = remote.lastUpdated?.toMillis?.() || remote.lastUpdated || 0;

        if (localLastUpdated > remoteLastUpdated) {
          log('Local data is newer than Firebase data, skipping overwrite:', {
            localLastUpdated,
            remoteLastUpdated,
            reason,
          });
          shouldOverwriteLocal = false;
        } else {
          log('Firebase data is newer or equal, will sync:', {
            localLastUpdated,
            remoteLastUpdated,
            reason,
          });
        }
      }

      // Only overwrite local data if Firebase data is newer AND has actual content
      if (shouldOverwriteLocal) {
        if (settingsSnap.exists()) {
          local.settings = { ...(local.settings || {}), ...(settingsSnap.data() || {}) };
        }
        // Handle both DocumentSnapshot (.exists()) and QuerySnapshot (.empty) cases
        const isDoc2 = typeof listsSnap.exists === 'function';
        const hasListsData = isDoc2 ? listsSnap.exists() : !listsSnap.empty;
        if (hasListsData) {
          let remote = {};
          if (isDoc2) {
            remote = listsSnap.data() || {};
          } else {
            remote = listsSnap.docs[0]?.data() || {};
          }

          const watchlists = remote.watchlists || {};

          // Check if Firebase data has actual content before overwriting
          const firebaseHasContent = 
            (watchlists.tv?.watching?.length > 0) ||
            (watchlists.tv?.wishlist?.length > 0) ||
            (watchlists.tv?.watched?.length > 0) ||
            (watchlists.movies?.watching?.length > 0) ||
            (watchlists.movies?.wishlist?.length > 0) ||
            (watchlists.movies?.watched?.length > 0);

          if (firebaseHasContent) {
            // Transform Firestore structure to app structure
            local.tv = {
              watching: watchlists.tv?.watching || [],
              wishlist: watchlists.tv?.wishlist || [],
              watched: watchlists.tv?.watched || [],
            };

            local.movies = {
              watching: watchlists.movies?.watching || [],
              wishlist: watchlists.movies?.wishlist || [],
              watched: watchlists.movies?.watched || [],
            };
          } else {
            log('Firebase data is empty, preserving local data to prevent data loss');
          }

          log('Data transformation complete:', {
            tvWatching: local.tv.watching.length,
            tvWishlist: local.tv.wishlist.length,
            tvWatched: local.tv.watched.length,
            moviesWatching: local.movies.watching.length,
            moviesWishlist: local.movies.wishlist.length,
            moviesWatched: local.movies.watched.length,
          });
        }

        writeLocalAppData(local);

        // Update window.appData from localStorage after sync
        if (typeof window.loadAppData === 'function') {
          window.loadAppData();
          log('window.appData updated from localStorage after sync');
        }
      } else {
        log('Skipping Firebase sync - local data is newer');
      }

      document.dispatchEvent(new CustomEvent('app:data:ready', { detail: { source: 'cloud' } }));
      log('sync complete:', reason, {
        tvCounts: Object.fromEntries(Object.entries(local.tv).map(([k, v]) => [k, v.length])),
        movieCounts: Object.fromEntries(
          Object.entries(local.movies).map(([k, v]) => [k, v.length]),
        ),
      });
    } catch (e) {
      warn('sync error:', e?.message || e || 'Unknown error');
      // light backoff if network-related; do not spin forever
      const msg = (e && (e.code || e.message || '')) + '';
      if (/network|unavailable|deadline/i.test(msg)) {
        await sleep(1000);
      }
    }
  }

  // Export init function that waits for auth readiness
  async function init() {
    const user = await waitForAuthReady();
    if (!user) {
      console.warn('[data-init] init: no auth user after wait; aborting sync');
      return;
    }
    console.info('[data-init] sync: starting (auth ready)');
    await trySync();
  }

  // Export minimal API
  window.DataInit = { init, trySync, readLocalAppData, writeLocalAppData };
})();
