/* ============== Flicklet App (Cleaned Core) ==============
   Single source of truth for initialization & lifecycle.
   This build removes duplicate init paths and normalizes tab/UI/render behavior.
*/

// Card action handlers will be loaded via global functions

// Fallback for FlickletDebug if not loaded
window.FlickletDebug = window.FlickletDebug || {
  info: console.log,
  warn: console.warn,
  error: console.error,
  log: console.log,
};

// Feature flag for tab system - defaults to new system
window.__useLegacyTabs = false;

(function () {
  // Helper function to get translation
  function t(key) {
    // Use the global t function from i18n.js
    if (typeof window.t === 'function') {
      return window.t(key);
    }
    // Fallback to key if translation not available
    return key;
  }

  // Centralized User ViewModel - Single Source of Truth for Auth State
  const UserViewModel = {
    isAuthenticated: false,
    displayName: '',
    alias: '',
    avatarUrl: '',
    email: '',

    update(user) {
      this.isAuthenticated = !!user;
      if (user) {
        // Check if we just saved a username - don't override it
        if (window.__USERNAME_JUST_SAVED__) {
          console.log('🔄 Username just saved, preserving:', window.__USERNAME_JUST_SAVED__);
          this.displayName = window.__USERNAME_JUST_SAVED__;
          this.alias = window.__USERNAME_JUST_SAVED__;
          this.avatarUrl = user.photoURL || '';
          this.email = user.email || '';
        } else {
          // Check for display name in settings first, then fall back to Firebase user data
          const settingsDisplayName = window.appData?.settings?.displayName || 
                                     window.appData?.settings?.username ||
                                     window.SettingsManager?.get('displayName');
          
          // Always prioritize the most recent settings over Firebase user data
          this.displayName = settingsDisplayName || user.displayName || user.email?.split('@')[0] || 'User';
          this.alias = settingsDisplayName || user.displayName || user.email?.split('@')[0] || 'User';
          this.avatarUrl = user.photoURL || '';
          this.email = user.email || '';
          
          console.log('✅ UserViewModel updated with display name:', this.displayName, 'from settings:', !!settingsDisplayName);
        }
      } else {
        this.displayName = '';
        this.alias = '';
        this.avatarUrl = '';
        this.email = '';
      }

      // Notify all UI components of auth state change
      this.notifyUI();
    },

    // Method to update just the display name/username
    updateDisplayName(newName) {
      this.displayName = newName;
      this.alias = newName;
      this.notifyUI();
    },

    notifyUI() {
      // Update account button
      const accountBtn = document.getElementById('accountButton');
      const accountLabel = document.getElementById('accountButtonLabel');
      if (accountBtn && accountLabel) {
        accountLabel.textContent = this.isAuthenticated ? `👤 ${this.displayName}` : 'Sign In';
        accountBtn.title = this.isAuthenticated
          ? `Signed in as ${this.email}. Click to sign out.`
          : 'Click to sign in';
      }

      // Update snark text (username + snarky message)
      const snarkElement = document.getElementById('leftSnark');
      if (snarkElement && this.isAuthenticated) {
        const snarks = [
          `${this.alias}, your couch has a permanent dent`,
          `${this.alias}, ready to binge?`,
          `${this.alias}, what's next on your list?`,
          `${this.alias}, time to discover something new`,
          `${this.alias}, your watchlist is calling`,
        ];
        snarkElement.textContent = snarks[Math.floor(Math.random() * snarks.length)];
      } else if (snarkElement) {
        snarkElement.textContent = '';
      }

      // Update settings access
      const settingsElements = document.querySelectorAll('[data-requires-auth]');
      settingsElements.forEach((el) => {
        if (this.isAuthenticated) {
          el.style.display = '';
          el.removeAttribute('disabled');
        } else {
          el.style.display = 'none';
          el.setAttribute('disabled', 'true');
        }
      });
    },
  };

  const App = {
    // Runtime state (references the global appData defined in utils.cleaned.js)
    currentUser: null,
    currentTab: 'home',
    genresLoaded: false,
    authInitialized: false,
    firebaseInitialized: false,

    async init() {
      // Fallback for FlickletDebug if not loaded
      const debug = window.FlickletDebug || {
        info: console.log,
        warn: console.warn,
        error: console.error,
      };
      debug.info('🚀 [FlickletApp] init');
      try {
        // 1) Load persisted data
        if (typeof loadAppData === 'function') {
          loadAppData();
        }

        // 2) Apply theme & language
        this.applyTheme();
        this.applyLanguage();

        // 2.5) Re-initialize language manager after appData is loaded
        if (window.LanguageManager && typeof window.LanguageManager.reinitialize === 'function') {
          window.LanguageManager.reinitialize();
        }

        // 2.6) Initialize FAB icons
        this.initializeFABIcons();

        // 2.7) Initialize Counter Bootstrap System
        if (window.CounterBootstrap) {
          window.CounterBootstrap.init();
        }

        // 2.8) Install centralized card action handlers
        if (window.installCardActionHandlers) {
          window.installCardActionHandlers({
            addToList: (id, list, ctx) => window.addToListFromCacheV2?.(id, list, ctx),
            removeFromList: (id, list, ctx) => window.removeItemFromCurrentList?.(id, list, ctx),
            markWatched: (id, ctx) => window.addToListFromCacheV2?.(id, 'watched', ctx),
          });
        }

        // 3) Initialize Firebase auth listener
        this.initFirebase();

        // 3.5) Setup auth button sync
        this.setupAuthButtonSync();

        // 4) Wait for data-init to complete
        await this.waitForDataInit();

        // 5) Bind global UI listeners
        this.setupEventListeners();

        // 6) Setup settings tabs
        this.setupSettingsTabs();

        // 7) Ensure a default active tab and initial render
        this.switchToTab('home');
        this.updateUI();

        // 7.5) Dock FABs to active tab
        this.dockFABsToActiveTab();

        // 6) Emit cards:changed event for centralized count updates
        setTimeout(() => {
          document.dispatchEvent(
            new CustomEvent('cards:changed', {
              detail: { source: 'app-initialization' },
            }),
          );
          console.log('🔢 Emitted cards:changed event during initialization');

          // Emit app:lists-rendered event for counter system
          document.dispatchEvent(
            new CustomEvent('app:lists-rendered', {
              detail: { source: 'initialization' },
            }),
          );

          // Ensure FABs are docked after everything is ready
          this.dockFABsToActiveTab();
        }, 500);

        // Auth listener handled in initFirebase()

        // 6) Optional: feature blocks that rely on DOM (after first paint)
        setTimeout(() => {
          this.initializeFlickWord?.();
          this.initializeFlickWordModal?.();
          this.initializeTriviaModal?.();
          // checkAndPromptLogin removed - handled in auth listener
        }, 150);

        // Search functionality is now handled by search.js module
        // No initialization needed here

        // Initialize genres
        this.initializeGenres();

        FlickletDebug.info('✅ [FlickletApp] ready');
      } catch (e) {
        FlickletDebug.error('💥 [FlickletApp] init failed:', e);
      }
    },

    // Wait for data-init to complete before proceeding
    async waitForDataInit() {
      return new Promise((resolve) => {
        // If data-init already completed, resolve immediately
        if (window.appData && typeof window.appData === 'object') {
          resolve();
          return;
        }

        // Wait for app:data:ready event with timeout
        const timeout = setTimeout(() => {
          console.warn('[FlickletApp] Data init timeout, proceeding anyway');
          resolve();
        }, 2000);

        window.addEventListener(
          'app:data:ready',
          () => {
            clearTimeout(timeout);
            // Data initialization completed
            resolve();
          },
          { once: true },
        );
      });
    },

    // ---------- Visual / Theme ----------
    applyTheme() {
      const local = localStorage.getItem('flicklet-theme');
      const chosen = local || appData?.settings?.theme || 'light';

      // Apply data-theme attribute for new token system
      document.documentElement.setAttribute('data-theme', chosen);

      // Keep legacy dark-mode class for backward compatibility
      document.body.classList.toggle('dark-mode', chosen === 'dark');

      // Keep both in sync
      appData.settings.theme = chosen;
      localStorage.setItem('flicklet-theme', chosen);
    },

    applyLanguage() {
      const lang = appData?.settings?.lang || 'en';
      try {
        if (typeof applyTranslations === 'function') {
          applyTranslations(lang);
        }
      } catch (e) {
        FlickletDebug.warn('i18n not available yet, continuing.');
      }
    },

    // ---------- Integrations ----------
    // Old initFirebase removed - using new unified system below

    // setupAuthListener() removed - auth handled in initFirebase()

    initFirebase() {
      if (window.__NO_FIREBASE__ || !window.firebaseApp) {
        console.info('initFirebase skipped (SDK not present)');
        return;
      }

      // Prevent multiple initializations
      if (this.firebaseInitialized) {
        FlickletDebug.info('⚠️ Firebase already initialized, skipping');
        return;
      }

      FlickletDebug.info('🔥 Initializing Firebase...');
      this.firebaseInitialized = true;

      // Clear any existing username prompt modals
      this.clearExistingUsernameModals();

      // Wait for Firebase ready event with timeout
      this.waitForFirebaseReady()
        .then(() => {
          FlickletDebug.info('✅ Firebase available, setting up auth listener');
          this.setupAuthListener();
        })
        .catch(() => {
          FlickletDebug.error('❌ Firebase initialization timeout after 8 seconds');
          this.setupFallbackAuth();
        });
    },

    waitForFirebaseReady() {
      return new Promise((resolve, reject) => {
        // ✅ If Firebase is already ready, resolve immediately (avoids race with early event)
        try {
          if (
            window.firebaseInitialized === true ||
            (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0)
          ) {
            resolve(true);
            return;
          }
        } catch (e) {
          // ignore state check errors; fall through to event wait
        }

        const timeout = setTimeout(() => {
          reject(new Error('Firebase initialization timeout'));
        }, 8000);

        const handleFirebaseReady = () => {
          clearTimeout(timeout);
          window.removeEventListener('firebase-ready', handleFirebaseReady);
          if (window.firebaseInitialized) {
            resolve(true);
          } else {
            reject(new Error('Firebase initialization failed'));
          }
        };

        // Listen once for the readiness signal
        window.addEventListener('firebase-ready', handleFirebaseReady, { once: true });
      });
    },

    setupFallbackAuth() {
      FlickletDebug.info('🔄 Setting up fallback authentication system');
      this.currentUser = null;
      this.firebaseInitialized = false;

      // Update account button to show fallback message
      const accountBtn = document.getElementById('accountBtn');
      if (accountBtn) {
        accountBtn.textContent = `🔒 ${t('offline_mode') || 'Offline Mode'}`;
        accountBtn.title =
          t('auth_unavailable_offline') || 'Authentication unavailable - working in offline mode';
      }

      // Show a notification about offline mode
      this.showNotification(
        t('working_offline_mode') || 'Working in offline mode - data will be stored locally only',
        'info',
      );
    },

    setupAuthListener() {
      try {
        console.log('🔥 Auth listener setup - using single observer from auth.js');
        // Auth state changes are now handled by the single observer in auth.js
        // This method is kept for compatibility but no longer registers its own observer

        // Get current user state for initialization
        const user = firebase.auth().currentUser;
        FlickletDebug.info('👤 Current user on init:', user ? `User: ${user.email}` : 'No user');
        this.currentUser = user;

        // Also update the global currentUser for compatibility with existing code
        if (typeof window !== 'undefined') {
          window.currentUser = user;
        }

        // Update centralized UserViewModel
        UserViewModel.update(user);

        // Initialize auth state
        this.authInitialized = true;

        // If user is already signed in, process their data
        if (user) {
          this.processUserSignIn(user);
        }
      } catch (error) {
        FlickletDebug.error('❌ Auth listener setup failed:', error);
      }
    },

    // Complete login flow with Firestore integration
    setupAuthButtonSync() {
      (function () {
        const btn = document.getElementById('signIn');
        if (!btn) return;

        // Small UI helpers
        function setAuthButtonSignedIn(emailOrName) {
          btn.textContent = emailOrName || '👤 Sign Out';
          btn.dataset.state = 'signed-in';
          btn.title = emailOrName ? `Signed in as ${emailOrName}` : 'Signed in';
          showSignOutHint(true);
        }
        function setAuthButtonSignedOut() {
          btn.textContent = '👤 Sign In';
          btn.dataset.state = 'signed-out';
          btn.title = 'Sign in';
          showSignOutHint(false);
        }
        function showSignOutHint(show) {
          let hint = document.getElementById('signOutHint');
          if (!hint) {
            hint = document.createElement('div');
            hint.id = 'signOutHint';
            hint.style.cssText = 'font-size:12px;opacity:.8;margin-top:2px;';
            btn.parentElement?.insertBefore(hint, btn);
          }
          hint.textContent = show ? 'Sign out' : '';
          hint.style.display = show ? '' : 'none';
        }

        // First-load prompt for unsigned users
        function showFirstLoadSignInPrompt() {
          if (sessionStorage.getItem('firstSignInPromptShown') === '1') return;
          sessionStorage.setItem('firstSignInPromptShown', '1');

          const wrap = document.createElement('div');
          wrap.innerHTML = `
            <div id="signin-info-modal" style="position:fixed;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.35);z-index:9999">
              <div style="background:#fff;padding:16px 20px;border-radius:10px;max-width:420px;width:92%;box-shadow:0 10px 30px rgba(0,0,0,.2)">
                <h3 style="margin:0 0 8px 0;">Save your shows</h3>
                <p style="margin:0 0 14px 0;">Sign in to keep your watchlists and pick up on any device.</p>
                <div style="display:flex;gap:8px;justify-content:flex-end">
                  <button id="signin-skip" class="btn btn--sm">Not now</button>
                  <button id="signin-go" class="btn btn--sm">Sign in</button>
                </div>
              </div>
            </div>`;
          document.body.appendChild(wrap);
          document.getElementById('signin-skip')?.addEventListener('click', () => wrap.remove());
          document.getElementById('signin-go')?.addEventListener('click', () => {
            wrap.remove();
            triggerSignIn();
          });
        }

        // Username prompt when missing
        function promptForUsername(defaultName) {
          return new Promise((resolve) => {
            const wrap = document.createElement('div');
            wrap.innerHTML = `
              <div id="username-modal" style="position:fixed;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.35);z-index:9999">
                <div style="background:#fff;padding:16px 20px;border-radius:10px;max-width:480px;width:92%;box-shadow:0 10px 30px rgba(0,0,0,.2)">
                  <h3 style="margin:0 0 8px 0;">what should we call you?</h3>
                  <input id="username-input" style="width:100%;padding:10px 12px;border:1px solid #ccc;border-radius:8px" value="${defaultName || ''}" />
                  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
                    <button id="username-skip" type="button" class="btn btn--sm" data-action="username-skip">Skip</button>
                    <button id="username-save" type="button" class="btn btn--sm" data-action="username-save">Save</button>
                  </div>
                </div>
              </div>`;
            document.body.appendChild(wrap);

            // prevent overlay click from bubbling to app-level handlers
            wrap.querySelector('#username-modal')?.addEventListener('click', (e) => {
              if (e.target === e.currentTarget) {
                /* click on backdrop */
              }
            });

            const done = (val) => {
              wrap.remove();
              resolve(val);
            };

            // Expose the done callback for global [data-action] handler
            wrap._usernameDone = done;

            // Note: Event handlers are now managed by the global [data-action] delegate
          });
        }

        // Firestore helpers (guarded)
        function userDocRef(uid) {
          if (!uid) return null;
          return firebase.firestore().collection('users').doc(uid); // simple structure: users/{uid}
        }
        async function readUsername(uid) {
          const ref = userDocRef(uid);
          if (!ref) throw new Error('Firestore not available');
          const snap = await ref.get();
          return snap.exists ? snap.data()?.username || null : null;
        }
        async function writeUsername(uid, name) {
          const ref = userDocRef(uid);
          if (!ref) throw new Error('Firestore not available');
          await ref.set({ username: name }, { merge: true });
        }

        function updateWelcome(name) {
          const el =
            document.getElementById('welcomeNote') ||
            (() => {
              const n = document.createElement('div');
              n.id = 'welcomeNote';
              n.style.cssText = 'margin:8px 0;font-weight:600;';
              const headerLeft = document.querySelector('#header-left, header .left, body'); // best-effort
              (headerLeft || document.body).prepend(n);
              return n;
            })();
          el.innerHTML = name
            ? `${name}<div style="font-weight:400;opacity:.8">I have a PhD in binge-watching.</div>`
            : '';
        }

        async function ensureUsernameFlow(user) {
          try {
            const display = user.displayName || user.email || 'Signed in';
            setAuthButtonSignedIn(display);
            let uname = null;
            try {
              uname = await readUsername(user.uid);
            } catch {}
            if (!uname) {
              const picked = await promptForUsername(display);
              if (picked) {
                try {
                  await writeUsername(user.uid, picked);
                } catch {}
                uname = picked;
              }
            }
            updateWelcome(uname || display);
            // TODO: also reflect into your local Flicklet Settings if needed
          } catch (e) {
            console.error('[auth] username flow failed', e);
          }
        }

        function triggerSignIn() {
          if (!window.firebase || !firebase.auth) {
            console.warn('[auth] Firebase not available');
            return;
          }
          const auth = firebase.auth();
          const provider = new firebase.auth.GoogleAuthProvider();
          auth
            .signInWithPopup(provider)
            .catch((err) => console.error('[auth] Sign-in failed', err));
        }

        // Click handler
        btn.addEventListener('click', async () => {
          if (!window.firebase || !firebase.auth) return;
          const auth = firebase.auth();
          if (auth.currentUser)
            auth.signOut().catch((e) => console.error('[auth] Sign-out failed', e));
          else triggerSignIn();
        });

        // onAuthStateChanged: sync button + flows; show first-load prompt when unsigned
        if (window.firebase && firebase.auth) {
          const auth = firebase.auth();
          // First paint
          if (auth.currentUser)
            setAuthButtonSignedIn(auth.currentUser.displayName || auth.currentUser.email || '');
          else {
            setAuthButtonSignedOut();
            showFirstLoadSignInPrompt();
          }

          // Auth state changes are now handled centrally by AuthManager
          // This listener has been removed to prevent race conditions
        } else {
          setAuthButtonSignedOut();
        }
      })();
    },

    async processUserSignIn(user) {
      // Race condition protection - prevent concurrent processing
      if (window.__PROCESS_USER_SIGNIN_LOCK__) {
        console.warn('[app] processUserSignIn already in progress, skipping duplicate call');
        return;
      }

      window.__PROCESS_USER_SIGNIN_LOCK__ = true;

      try {
        FlickletDebug.info('✅ User signed in, processing...');

        // ✅ 2-line guard: wait for a real user, then get uid
        const authUser = await window.ensureUser();
        const uid = authUser.uid;

        // 1) Close ALL auth modals
        document.querySelectorAll('.modal-backdrop[data-modal="login"]').forEach((n) => n.remove());
        window.__currentAuthModal = null;

        // 2) CREATE USER DATABASE ENTRY (CRITICAL FOR FIREBASE STORAGE)
        FlickletDebug.info('🔄 Creating user database entry...');
        try {
          const db = firebase.firestore();
          await db
            .collection('users')
            .doc(uid)
            .set(
              {
                profile: {
                  email: user.email || '',
                  displayName: user.displayName || '',
                  photoURL: user.photoURL || '',
                },
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          FlickletDebug.info('✅ User database entry created successfully');
        } catch (error) {
          FlickletDebug.error('❌ Failed to create user database entry:', error);
        }

        // 3) LOAD USER DATA FROM CLOUD (CRITICAL FOR DATA RESTORATION)
        FlickletDebug.info('🔄 Loading user data from Firebase cloud storage...');
        try {
          // Use the trySync function from data-init.js to load user data
          if (typeof window.DataInit?.trySync === 'function') {
            await window.DataInit.trySync('user-sign-in');
            FlickletDebug.info('✅ User data loaded from cloud successfully');

            // CRITICAL: Refresh UI after data is loaded to prevent "already in list" errors
            if (typeof window.updateUI === 'function') {
              FlickletDebug.info('🔄 Refreshing UI after cloud data load...');
              window.updateUI();
            }

            // Emit cards:changed event for centralized count updates
            document.dispatchEvent(
              new CustomEvent('cards:changed', {
                detail: { source: 'cloud-data-load' },
              }),
            );
            FlickletDebug.info('🔢 Emitted cards:changed event after cloud data load...');

            // Also refresh the current tab content
            if (typeof window.FlickletApp?.updateTabContent === 'function') {
              const currentTab = window.FlickletApp?.currentTab || 'home';
              FlickletDebug.info('🔄 Refreshing current tab content:', currentTab);
              window.FlickletApp.updateTabContent(currentTab);
            }
          } else {
            FlickletDebug.warn(
              '⚠️ DataInit.trySync function not available - user data not loaded from cloud',
            );
          }
        } catch (error) {
          FlickletDebug.error('❌ Failed to load user data from cloud:', error);
        }

        // 4) BUTTON LABEL = Firebase displayName (fallback email prefix)
        console.log('🔍 User signed in, Firebase user data:', {
          displayName: user.displayName,
          email: user.email,
          providerData: user.providerData,
        });

        // Set account button with Firebase displayName (this method will prioritize Firebase displayName)
        console.log('🔍 Setting account button label with Firebase displayName:', user.displayName);
        this.setAccountButtonLabel(user.displayName);

        // Also update the account button to ensure it's using the latest Firebase data
        setTimeout(() => {
          console.log('🔍 Refreshing account button after sign-in');
          this.updateAccountButton();
        }, 100);

        // 5) WELCOME/SNARK = Firestore settings.username (prompt once if missing)
        try {
          const settings = await this.readSettings(uid);
          let username = (settings.username || '').trim();

          // Load existing username into window.appData.settings for personalized rows
          if (username) {
            window.appData = window.appData || {};
            window.appData.settings = { ...(window.appData.settings || {}), username };
            console.log('✅ Loaded existing username into appData:', username);
          }

          // single prompt gate stored in Firestore so it works across devices
          const alreadyPrompted = !!settings.usernamePrompted;
          console.log('🔍 Username check:', { username, alreadyPrompted, settings });

          if (!username && !alreadyPrompted) {
            console.log('🔧 Prompting for username...', { username, alreadyPrompted, settings });
            username = await this.promptForUsernameOnce(user.displayName); // returns string or null
            console.log('🔧 Username prompt result:', username);

            if (username && username.trim()) {
              await this.writeSettings(uid, { username: username.trim(), usernamePrompted: true });
              // keep local appData in sync (if you use it)
              window.appData = window.appData || {};
              window.appData.settings = {
                ...(window.appData.settings || {}),
                username: username.trim(),
              };
              console.log('✅ Username saved:', username.trim());
            } else {
              await this.writeSettings(uid, { usernamePrompted: true });
              console.log('✅ Username prompt marked as completed (skipped)');
            }
          } else {
            console.log('🔍 Username already exists or was prompted:', {
              username,
              alreadyPrompted,
            });
          }

          // Update left snark AFTER username is set
          this.setLeftSnark(username ? this.makeSnark(username) : '');

          // Run migration once per user
          await this.runMigration();

          // Run cleanup for stray field
          await this.cleanupStrayField();

          // Migrate legacy name fields
          await this.migrateLegacyNameFields(uid);
        } catch (error) {
          console.error('❌ Error in user sign-in processing:', error);
          this.showNotification(t('error_loading_user_data'), 'error');
        }
      } catch (error) {
        console.error('❌ Error in processUserSignIn:', error);
        this.showNotification(t('error_processing_sign_in'), 'error');
      } finally {
        // Always release the lock
        window.__PROCESS_USER_SIGNIN_LOCK__ = false;
      }
    },

    clearUserData() {
      console.log('🧹 FlickletApp.clearUserData called');

      // Clear user references
      this.currentUser = null;
      window.currentUser = null;

      // Clear localStorage data
      try {
        localStorage.removeItem('flicklet-data');
        localStorage.removeItem('tvMovieTrackerData');
        localStorage.removeItem('flicklet_lists');
        localStorage.removeItem('flicklet_notes');
        localStorage.removeItem('flicklet_prefs');
        localStorage.removeItem('flicklet-language');
        localStorage.removeItem('flicklet-theme');
        localStorage.removeItem('flicklet:pro');
        localStorage.removeItem('flicklet:episodeTracking:enabled');
        localStorage.removeItem('flicklet:episodeTracking:series');
        console.log('🧹 localStorage cleared');
      } catch (e) {
        console.warn('🧹 Failed to clear localStorage:', e);
      }

      // Reset appData to empty state
      if (window.appData) {
        window.appData.tv = { watching: [], wishlist: [], watched: [] };
        window.appData.movies = { watching: [], wishlist: [], watched: [] };
        window.appData.settings = {
          pro: false, // Default to false - only true if user account has Pro
          isPro: false, // Alias for pro
          episodeTracking: false,
          username: '',
          displayName: '',
          lang: 'en',
          theme: 'light',
        };
        window.appData.searchCache = [];
        window.appData.activeTagFilters = new Set();
        console.log('🧹 appData reset to empty state');
      }

      // Clear render flags
      Object.keys(window).forEach((key) => {
        if (key.startsWith('render_')) {
          window[key] = false;
        }
      });

      // Update UI to reflect signed out state
      if (window.UserViewModel) {
        window.UserViewModel.update(null);
      }

      // Clear username snark and restore generic greeting
      const leftSnark = document.getElementById('leftSnark');
      const headerGreeting = document.getElementById('headerGreeting');
      if (leftSnark) {
        leftSnark.textContent = 'Welcome back!';
      }
      if (headerGreeting) {
        headerGreeting.style.display = '';
        headerGreeting.textContent = 'Ready to discover your next favorite show?';
      }

      // Clear any duplicate cards
      if (typeof window.cleanupDuplicateCards === 'function') {
        window.cleanupDuplicateCards();
      }

      // Trigger UI refresh
      if (typeof window.updateUI === 'function') {
        window.updateUI();
      }

      console.log('✅ FlickletApp user data cleared');
    },

    // Firestore settings helpers - now using direct path structure

    async readSettings(uid) {
      try {
        // Auth guard: Ensure auth is ready before any Firestore operations
        if (typeof window.ensureUser !== 'function') {
          throw new Error('ensureUser function not available');
        }
        const user = await window.ensureUser();
        const authUid = user.uid;

        console.log('🔥 Reading from Firestore:', { uid, authUid });
        const db = firebase.firestore();
        const ref = db.collection('users').doc(authUid).collection('settings').doc('app');
        const snap = await ref.get();

        if (snap.exists) {
          const data = snap.data();
          console.log('✅ Firestore read successful:', data);

          // Emit userDataLoaded event for other components
          document.dispatchEvent(
            new CustomEvent('userDataLoaded', {
              detail: { uid: authUid, data: data },
            }),
          );

          return data;
        } else {
          // Seed defaults so the next read always has data
          const defaults = { theme: 'light', lang: 'en', createdAt: Date.now() };
          await ref.set(defaults, { merge: true });
          console.log('✅ Firestore defaults created:', defaults);
          return defaults;
        }
      } catch (error) {
        console.error('❌ Firestore read failed:', error);
        return {};
      }
    },

    async writeSettings(uid, data) {
      try {
        // Auth guard: Ensure auth is ready before any Firestore operations
        if (typeof window.ensureUser !== 'function') {
          throw new Error('ensureUser function not available');
        }
        const user = await window.ensureUser();
        const authUid = user.uid;

        console.log('🔥 Writing to Firestore:', { uid, authUid, data });
        const db = firebase.firestore();
        const ref = db.collection('users').doc(authUid).collection('settings').doc('app');
        await ref.set({ ...data, updatedAt: Date.now() }, { merge: true });
        console.log('✅ Firestore write successful');
      } catch (error) {
        console.error('❌ Firestore write failed:', error);
        throw error;
      }
    },

    // Migration to clean up legacy fields
    async migrateLegacyNameFields(uid) {
      // Auth guard: Ensure auth is ready before any Firestore operations
      const user = await window.ensureUser();
      const authUid = user.uid;

      const s = await this.readSettings(authUid);
      if (s && s.displayName && !s.username) {
        await this.writeSettings(authUid, { username: s.displayName });
      }
      // Optional: remove displayName field
      try {
        const db = firebase.firestore();
        const ref = db.collection('users').doc(authUid).collection('settings').doc('app');
        await ref.set({ displayName: null }, { merge: true });
      } catch (e) {
        console.log(t('no_displayname_field') + ':', e.message);
      }
    },

    /**
     * Handle post-auth success pipeline
     * Called by AuthManager after successful authentication
     */
    async handlePostAuthSuccess(user) {
      // Handling post-auth success for user

      // Phase D: Auto-close auth modal on successful sign-in
      if (
        window.AUTH_MANAGER &&
        window.AUTH_MANAGER._authModalManager &&
        window.AUTH_MANAGER._authModalManager.isModalOpen()
      ) {
        // Auto-closing auth modal on sign-in
        window.AUTH_MANAGER._authModalManager.close();
      }

      try {
        const uid = user.uid;
        const db = window.firebaseDb || firebase.firestore();

        // 1) Create/update Firestore user doc
        await this.createOrUpdateUserDoc(user);

        // 2) Cloud-first load
        const gotCloud = await this.cloudFirstLoad(db, uid);

        // 3) If no cloud doc, seed from local minimal
        if (!gotCloud) {
          await this.seedCloudIfNeeded(db, uid);
          window.__cloudHydrated = true;
          window.saveAppData('flicklet-data', window.pruneWatchlistsShape(window.appData || {}));
        }

        // 4) Handle identity (username vs displayName)
        await this.handleUserIdentity(user);

        // 5) Update UI
        this.updateUI();
      } catch (error) {
        console.error('❌ [FlickletApp] handlePostAuthSuccess failed:', error);
      }
    },

    /**
     * Create or update Firestore user document
     */
    async createOrUpdateUserDoc(user) {
      try {
        const uid = user.uid;
        const userDoc = {
          uid: uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        // Update Firestore user doc
        if (window.firebaseDb) {
          await window.firebaseDb.collection('users').doc(uid).set(userDoc, { merge: true });
          console.log('✅ User doc updated in Firestore');
        }
      } catch (error) {
        console.error('❌ Failed to update user doc:', error);
      }
    },

    /**
     * Cloud-first load with LocalStorage mirroring
     */
    async cloudFirstLoad(db, uid) {
      try {
        const ref = db.doc(`users/${uid}`);
        const snap = await ref.get();
        if (snap.exists) {
          const cloud = window.pruneWatchlistsShape({ ...(snap.data() || {}) });
          window.appData = { ...(window.appData || {}), ...cloud };
          window.saveAppData('flicklet-data', window.appData);
          window.__cloudHydrated = true;
          console.info(
            '[CloudLoad] Hydrated from Firestore. Bytes:',
            window.computeBytes(JSON.stringify(window.appData)),
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error('[CloudLoad] Failed:', error);
        return false;
      }
    },

    /**
     * Seed cloud with minimal local data if no cloud doc exists
     */
    async seedCloudIfNeeded(db, uid) {
      try {
        const minimal = window.pruneWatchlistsShape(window.appData || {});
        const payload = {
          ...minimal,
          uid,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp?.(),
        };
        const json = JSON.stringify(payload);
        const bytes = window.computeBytes(json);

        // Keep a safety margin well below 1 MiB doc limit
        if (bytes > 900 * 1024) {
          console.warn(
            '[SeedCloud] payload too large, aborting seed:',
            (bytes / 1024).toFixed(1),
            'KB',
          );
          return false;
        }

        await db.doc(`users/${uid}`).set(payload, { merge: true });
        console.info(
          '[SeedCloud] Seeded cloud with minimal shape:',
          (bytes / 1024).toFixed(1),
          'KB',
        );
        return true;
      } catch (error) {
        console.error('[SeedCloud] Failed:', error);
        return false;
      }
    },

    /**
     * Load and merge cloud data (legacy - now uses cloud-first approach)
     */
    async loadAndMergeCloudData(uid) {
      try {
        if (window.firebaseDb) {
          const userDoc = await window.firebaseDb.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const cloudData = userDoc.data();

            // Merge cloud data with local
            if (cloudData.watchlists) {
              console.log('🔄 Merging cloud watchlists data:', cloudData.watchlists);

              // Merge TV data
              if (cloudData.watchlists.tv) {
                if (cloudData.watchlists.tv.watching) {
                  window.appData.tv.watching = [
                    ...new Set([
                      ...window.appData.tv.watching,
                      ...cloudData.watchlists.tv.watching,
                    ]),
                  ];
                }
                if (cloudData.watchlists.tv.wishlist) {
                  window.appData.tv.wishlist = [
                    ...new Set([
                      ...window.appData.tv.wishlist,
                      ...cloudData.watchlists.tv.wishlist,
                    ]),
                  ];
                }
                if (cloudData.watchlists.tv.watched) {
                  window.appData.tv.watched = [
                    ...new Set([...window.appData.tv.watched, ...cloudData.watchlists.tv.watched]),
                  ];
                }
              }

              // Merge Movies data
              if (cloudData.watchlists.movies) {
                if (cloudData.watchlists.movies.watching) {
                  window.appData.movies.watching = [
                    ...new Set([
                      ...window.appData.movies.watching,
                      ...cloudData.watchlists.movies.watching,
                    ]),
                  ];
                }
                if (cloudData.watchlists.movies.wishlist) {
                  window.appData.movies.wishlist = [
                    ...new Set([
                      ...window.appData.movies.wishlist,
                      ...cloudData.watchlists.movies.wishlist,
                    ]),
                  ];
                }
                if (cloudData.watchlists.movies.watched) {
                  window.appData.movies.watched = [
                    ...new Set([
                      ...window.appData.movies.watched,
                      ...cloudData.watchlists.movies.watched,
                    ]),
                  ];
                }
              }

              // Persist merged data
              if (typeof window.saveAppData === 'function') {
                window.saveAppData();
              }

              console.log('✅ Cloud data merged with local');

              // Emit firebaseDataLoaded event for other components
              document.dispatchEvent(
                new CustomEvent('firebaseDataLoaded', {
                  detail: { uid: uid, watchlists: cloudData.watchlists },
                }),
              );
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to load/merge cloud data:', error);
      }
    },

    /**
     * Handle user identity (username vs displayName)
     */
    async handleUserIdentity(user) {
      try {
        const uid = user.uid;

        // Get username from settings
        const username = await this.getUsername(uid);

        if (username) {
          this.renderSnark(username);
        } else {
          console.info('[identity] username:missing → prompt');
          const suggestedName = user.displayName || user.email?.split('@')[0] || 'User';
          const pickedUsername = await this.promptForUsernameOnce(suggestedName);

          if (pickedUsername) {
            await this.setUsername(uid, pickedUsername);
            this.renderSnark(pickedUsername);
          }
        }
      } catch (error) {
        console.error('❌ Failed to handle user identity:', error);
      }
    },

    /**
     * Get username from settings
     */
    async getUsername(uid) {
      try {
        const settings = await this.readSettings(uid);
        const username = (settings.username || '').trim();
        if (username) {
          console.info(`[identity] username:found=${username}`);
        }
        return username;
      } catch (error) {
        console.error('❌ Failed to get username:', error);
        return null;
      }
    },

    /**
     * Set username in settings
     */
    async setUsername(uid, username) {
      try {
        const trimmedUsername = username.trim();
        await this.writeSettings(uid, {
          username: trimmedUsername,
          displayName: trimmedUsername, // Also save as displayName
          usernamePrompted: true,
        });

        // Update local appData
        if (window.appData) {
          window.appData.settings.username = trimmedUsername;
          window.appData.settings.displayName = trimmedUsername; // Also update displayName
          if (typeof window.saveAppData === 'function') {
            window.saveAppData();
          }
        }

        console.info(`[identity] username:saved=${trimmedUsername}`);
        return true;
      } catch (error) {
        console.error('❌ Failed to set username:', error);
        return false;
      }
    },

    /**
     * Render snarky header message
     */
    renderSnark(username) {
      const leftSnark = document.getElementById('leftSnark');
      const headerGreeting = document.getElementById('headerGreeting');
      
      if (leftSnark && username) {
        const snarkText = this.makeSnark(username);
        // Make username bold in the snark text
        const boldSnarkText = snarkText.replace(username, `<strong>${username}</strong>`);
        leftSnark.innerHTML = boldSnarkText;
        leftSnark.style.textAlign = 'left';
        leftSnark.style.zIndex = 'auto';
        leftSnark.style.pointerEvents = 'none';

        // Hide the generic greeting when username is displayed
        if (headerGreeting) {
          headerGreeting.style.display = 'none';
        }

        console.info(`[identity] snark:render=${snarkText}`);
      } else if (leftSnark && !username) {
        // Show generic greeting when no username
        if (headerGreeting) {
          headerGreeting.style.display = '';
        }
      }
    },

    clearExistingUsernameModals() {
      // Clear any existing username prompt modals
      const existingModals = document.querySelectorAll(
        '.modal-backdrop[data-modal="username-prompt-modal"]',
      );
      existingModals.forEach((modal) => {
        console.log('🧹 Clearing existing username prompt modal');
        modal.remove();
      });
    },

    async promptForUsernameOnce(suggest = '') {
      // Check if username modal is already open
      if (document.querySelector('.modal-backdrop[data-modal="username"]')) {
        console.log('⚠️ Username modal already open, skipping duplicate');
        return null;
      }

      // Prevent multiple simultaneous calls
      if (this._usernameModalPromise) {
        console.log('⚠️ Username modal already in progress, waiting for existing promise');
        return this._usernameModalPromise;
      }

      this._usernameModalPromise = new Promise((resolve) => {
        console.log('🔧 Creating username modal...');
        const body = this.openModal(
          'What do I call you?',
          `
          <div style="min-width:320px; max-width:480px;">
            <p style="margin:0 0 16px; color:#666; font-size:14px;">Choose a name to personalize your experience</p>
            <input id="usernameInput" type="text" autocomplete="nickname" placeholder="Enter your name" value="${suggest.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m])}" style="display:block;width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;margin-bottom:16px;font-size:16px;">
            <div style="display:flex;gap:12px;justify-content:flex-end;">
              <button id="uCancel" class="btn secondary" type="button" style="padding:8px 16px; border:1px solid #ddd; background:#f5f5f5; color:#333; border-radius:6px; cursor:pointer;">Skip</button>
              <button id="uSave" class="btn primary" type="button" style="padding:8px 16px; background:#1976d2; color:white; border:none; border-radius:6px; cursor:pointer;">Save</button>
            </div>
          </div>
        `,
          'username-modal',
        );

        // tag so it's distinct from login modal
        const wrap = document.querySelector('.modal-backdrop[data-testid="username-modal"]');
        if (wrap) {
          wrap.setAttribute('data-modal', 'username');

          // Add click outside to close
          wrap.addEventListener('click', (e) => {
            if (e.target === wrap) {
              console.log('🔧 Modal backdrop clicked, closing');
              done(null);
            }
          });
        }

        let isDone = false;
        const done = (v) => {
          if (isDone) {
            console.log('🔧 Username modal already closed, ignoring duplicate call');
            return;
          }
          isDone = true;
          console.log('🔧 Username modal closing with value:', v);

          // Close the modal properly
          this.closeModal();

          // Also remove any remaining username modals
          document
            .querySelectorAll('.modal-backdrop[data-modal="username"]')
            .forEach((n) => n.remove());

          this._usernameModalPromise = null; // Clear the promise
          resolve(v);
        };

        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          const input = document.getElementById('usernameInput');
          const save = document.getElementById('uSave');
          const cancel = document.getElementById('uCancel');

          console.log('🔧 Setting up username modal buttons:', {
            input: !!input,
            save: !!save,
            cancel: !!cancel,
          });

          if (cancel) {
            cancel.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔧 Cancel button clicked');
              if (!isDone) {
                done(null);
              }
            });
          }

          if (save) {
            // Remove any existing listeners to prevent duplicates
            save.removeEventListener('click', save._clickHandler);
            save._clickHandler = (e) => {
              e.preventDefault();
              e.stopPropagation();
              const value = input?.value?.trim() || '';
              console.log('🔧 Save button clicked with value:', value);

              // Validate input
              if (value.length < 1) {
                console.log('🔧 Username too short, showing error');
                const errorEl = document.querySelector('[data-auth-msg]');
                if (errorEl) {
                  errorEl.textContent = 'Please enter a name or click Skip';
                }
                return;
              }

              if (value.length > 50) {
                console.log('🔧 Username too long, showing error');
                const errorEl = document.querySelector('[data-auth-msg]');
                if (errorEl) {
                  errorEl.textContent = 'Name must be 50 characters or less';
                }
                return;
              }

              console.log('🔧 Username validated, closing modal');
              if (!isDone) {
                done(value);
              }
            };
            save.addEventListener('click', save._clickHandler);
            console.log('🔧 Save button event listener attached');
          } else {
            console.error('❌ Save button not found!');
          }

          if (input) {
            input.addEventListener('keydown', (e) => {
              if (e.key === t('enter_key')) {
                e.preventDefault();
                e.stopPropagation();
                const value = input.value || '';
                console.log('🔧 Enter key pressed with value:', value);
                if (!isDone) {
                  done(value.trim());
                }
              }
            });
          }

          // Focus the input
          if (input) {
            input.focus();
            input.select();
          }

          // Add backdrop click handler to close modal
          const backdrop = document.querySelector('.modal-backdrop[data-modal="username"]');
          if (backdrop) {
            backdrop.addEventListener('click', (e) => {
              if (e.target === backdrop) {
                console.log('🔧 Backdrop clicked, closing modal');
                done(null);
              }
            });
          }
        }, 100);
      });

      return this._usernameModalPromise;
    },

    setAccountButtonLabel(displayName) {
      const accountBtn = document.getElementById('accountBtn');
      if (accountBtn) {
        const email = this.currentUser?.email || t('account');
        const emailPrefix = email.split('@')[0];

        // Priority: Firebase displayName > passed displayName > email prefix
        let finalName;
        if (this.currentUser?.displayName?.trim()) {
          finalName = this.currentUser.displayName.trim();
          console.log('🔍 Using Firebase displayName:', finalName);
        } else if (displayName?.trim()) {
          finalName = displayName.trim();
          console.log('🔍 Using passed displayName:', finalName);
        } else {
          finalName = emailPrefix || t('user');
          console.log('🔍 Using email prefix:', finalName);
        }

        accountBtn.innerHTML = `👤 ${finalName}`;
        accountBtn.title = `${t('signed_in_as')} ${email}. ${t('click_to_sign_out')}`;
        console.log('🔍 Account button updated:', {
          firebaseDisplayName: this.currentUser?.displayName,
          passedDisplayName: displayName,
          finalName,
          email,
        });
      }
    },

    setLeftSnark(username) {
      const leftSnark = document.getElementById('leftSnark');
      if (leftSnark && username) {
        leftSnark.textContent = this.makeSnark(username);
      }
    },

    makeSnark(username) {
      const snarks = [
        `${username}, try not to binge 12 seasons tonight`,
        `${username}, your watchlist is judging you`,
        `${username}, remember to eat between episodes`,
        `${username}, sleep is also important`,
        `${username}, your couch has a permanent dent`,
      ];
      return snarks[Math.floor(Math.random() * snarks.length)];
    },

    openModal(title, html, testId = 'generic-modal') {
      console.log('🔧 openModal called:', { title, testId });

      // Guard against modal stacking
      if (
        testId === 'auth-modal' &&
        document.querySelector('.modal-backdrop[data-modal="login"]')
      ) {
        console.log('⚠️ Auth modal already exists, not creating another');
        return null;
      }

      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.setAttribute('data-testid', 'modal-backdrop');
      if (testId === 'auth-modal') {
        wrap.setAttribute('data-modal', 'login');
        wrap.id = `auth-modal-${Date.now()}`;
        window.__currentAuthModal = wrap;
      }
      wrap.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.5) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 99999 !important;
        pointer-events: auto !important;
        visibility: visible !important;
        opacity: 1 !important;
      `;

      // Don't add default close button for username modals
      const showDefaultClose = testId !== 'username-modal';

      wrap.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-testid="${testId}" data-modal-body tabindex="-1" style="position:relative; z-index:100000; pointer-events: auto !important;">
          <h3 id="modal-title">${title}</h3>
          <div class="modal-body" style="pointer-events: auto !important;">${html}</div>
          <div data-auth-msg aria-live="polite" style="min-height:1em; margin:8px 0; color:var(--color-error,#b00020); pointer-events: auto !important;"></div>
          ${
            showDefaultClose
              ? `
          <div class="modal-actions" data-modal-actions style="pointer-events: auto !important;">
            <button class="btn secondary" data-testid="modal-close" type="button" style="width: 120px !important; flex: 0 0 120px !important; font-size: 14px !important; padding: 12px 18px !important; height: 44px !important; min-height: 44px !important; pointer-events: auto !important;">Close</button>
          </div>
          `
              : ''
          }
        </div>
      `;

      document.body.appendChild(wrap);

      // Focus the modal for accessibility
      const modal = wrap.querySelector('[data-modal-body]');
      if (modal) {
        modal.focus();
      }

      return wrap.querySelector('[data-modal-body]');
    },

    closeModal() {
      console.log('🔧 closeModal called');

      // Close any modal backdrop
      const modals = document.querySelectorAll('.modal-backdrop');
      modals.forEach((modal) => {
        if (modal && modal.parentNode) {
          console.log('🔧 Removing modal:', modal.id || modal.className);
          modal.remove();
        }
      });

      // Clear any global modal references
      if (window.__currentAuthModal) {
        window.__currentAuthModal = null;
      }

      console.log('🔧 Modal closed');
    },

    async runMigration() {
      try {
        // Auth guard: Ensure auth is ready before any Firestore operations
        const user = await window.ensureUser();
        const uid = user.uid;

        console.log('🔄 Running Firebase document migration...');
        const db = firebase.firestore();
        const ref = db.collection('users').doc(uid);

        const snap = await ref.get();
        if (!snap.exists) {
          console.log('📄 No document to migrate');
          this._migrationCompleted = true;
          return;
        }

        const data = snap.data();
        let needsUpdate = false;
        const updates = {};

        // Check for empty settings.displayName and remove it
        if (data.settings && data.settings.displayName === '') {
          updates['settings.displayName'] = firebase.firestore.FieldValue.delete();
          needsUpdate = true;
        }

        if (needsUpdate) {
          await ref.update(updates);
          console.log('✅ Migration completed');
        } else {
          console.log('✅ No migration needed');
        }

        this._migrationCompleted = true;
      } catch (error) {
        console.error('❌ Migration failed:', error);
      }
    },

    async cleanupStrayField() {
      try {
        // Auth guard: Ensure auth is ready before any Firestore operations
        const user = await window.ensureUser();
        const uid = user.uid;

        console.log('🧹 Running cleanup for stray field...');
        const db = firebase.firestore();
        const ref = db.collection('users').doc(uid);

        const snap = await ref.get();
        if (!snap.exists) {
          console.log('📄 No document to clean up');
          return;
        }

        const data = snap.data();
        let needsUpdate = false;
        const updates = {};

        // Remove stray displayName field if it exists
        if (data.displayName) {
          updates.displayName = firebase.firestore.FieldValue.delete();
          needsUpdate = true;
        }

        if (needsUpdate) {
          await ref.update(updates);
          console.log('✅ Cleanup completed');
        } else {
          console.log('✅ No cleanup needed');
        }
      } catch (error) {
        console.error('❌ Cleanup failed:', error);
      }
    },

    showNotification(message, type = 'info') {
      // Simple notification implementation
      console.log(`🔔 ${type.toUpperCase()}: ${message}`);

      // Avoid circular calls - don't call window.showNotification
      // This prevents the recursive loop with inline-script-02.js

      // Fallback: create a simple toast notification
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 100000;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      toast.textContent = message;
      document.body.appendChild(toast);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 5000);
    },

    updateAccountButton() {
      const accountBtn = document.getElementById('accountBtn');
      const accountHint = document.getElementById('accountHint');
      if (!accountBtn) return;

      if (!this.currentUser) {
        accountBtn.innerHTML = `👤 <span data-i18n="sign_in_account">${t('sign_in_account')}</span>`;
        accountBtn.title = t('sign_in_account_title');
        if (accountHint) accountHint.textContent = '';
        return;
      }

      // Use the same logic as setAccountButtonLabel for consistency
      const email = this.currentUser.email || t('account');
      const emailPrefix = email.split('@')[0];

      // Priority: Firebase displayName > email prefix
      let finalName;
      if (this.currentUser.displayName?.trim()) {
        finalName = this.currentUser.displayName.trim();
        console.log('🔍 updateAccountButton using Firebase displayName:', finalName);
      } else {
        finalName = emailPrefix || t('user');
        console.log('🔍 updateAccountButton using email prefix:', finalName);
      }

      accountBtn.innerHTML = `👤 ${finalName}`;
      accountBtn.title = `${t('signed_in_as')} ${email}. ${t('click_to_sign_out')}`;
      if (accountHint) accountHint.textContent = t('click_to_sign_out');
    },

    // ---------- UI Lifecycle ----------
    updateUI() {
      // Emit cards:changed event for centralized count updates
      document.dispatchEvent(
        new CustomEvent('cards:changed', {
          detail: { source: 'FlickletApp-updateUI' },
        }),
      );
      // Note: updateTabContent is called directly from switchToTab to avoid loops
    },

    updateTabContent(tab) {
      // Delegate to the global updateTabContent function if it exists
      if (typeof window.updateTabContent === 'function') {
        return window.updateTabContent(tab);
      }
      console.warn('updateTabContent function not available');
    },

    /**
     * Process: Tab Navigation - Legacy Shim
     * Purpose: Thin wrapper that delegates to nav-init.js engine
     * Data Source: nav-init.js manages [aria-selected] and [hidden] attributes
     * Update Path: All tab logic moved to nav-init.js - this is temporary shim
     * Dependencies: nav-init.js activate function
     */
    switchToTab(tab) {
      console.log(`[app.js] LEGACY SHIM: Delegating tab switch to nav engine: ${tab}`);
      
      // Feature flag check
      if (window.__useLegacyTabs) {
        console.warn('[app.js] LEGACY MODE: Using old tab system');
        return this._legacySwitchToTab(tab);
      }
      
      // Delegate to nav-init.js engine
      const targetId = `${tab}Section`;
      if (window.navEngine && typeof window.navEngine.activate === 'function') {
        window.navEngine.activate(targetId);
      } else {
        console.error('[app.js] Nav engine not available - falling back to legacy');
        return this._legacySwitchToTab(tab);
      }
    },

    // Legacy implementation (kept for rollback)
    _legacySwitchToTab(tab) {
      console.log(`🔄 LEGACY: Switching to tab: ${tab}`);
      this.currentTab = tab;

      // Dispatch single tab:switched event for all systems
      document.dispatchEvent(
        new CustomEvent('tab:switched', {
          detail: { tab: tab, previousTab: this.previousTab },
        }),
      );

      this.previousTab = tab;

      // Clear search when switching tabs (including when switching to home)
      if (window.SearchModule && typeof window.SearchModule.getSearchState === 'function') {
        try {
          const searchState = window.SearchModule.getSearchState();
          console.log('🔍 Search state check:', searchState);
          if (searchState.isSearching || searchState.hasResults) {
            console.log('🧹 Clearing search due to tab switch to:', tab);
            window.SearchModule.clearSearch();
          } else {
            console.log('🔍 Search not active, no clearing needed');
          }
        } catch (error) {
          console.warn('⚠️ Error checking search state:', error);
        }
      } else {
        console.warn('⚠️ SearchModule not available for search clearing');
      }

      // If we're switching away from search, make sure the target tab is visible
      if (window.SearchModule && typeof window.SearchModule.getSearchState === 'function') {
        try {
          const searchState = window.SearchModule.getSearchState();
          if (!searchState.isSearching) {
            const targetSection = document.getElementById(`${tab}Section`);
            if (targetSection) {
              targetSection.style.display = '';
              console.log(`✅ Showing target tab: ${tab}Section`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Error checking search state for tab visibility:', error);
        }
      }

      // Tab button classes - hide current tab, show others evenly spaced
      // BUT: During search, show all tabs for navigation
      const TAB_IDS = ['home', 'watching', 'wishlist', 'watched', 'discover', 'settings'];
      const ids = TAB_IDS;
      let isSearching = false;
      if (this.isSearching !== undefined) {
        isSearching = this.isSearching;
      } else if (window.SearchModule && typeof window.SearchModule.getSearchState === 'function') {
        try {
          const searchState = window.SearchModule.getSearchState();
          isSearching = searchState.isSearching;
        } catch (error) {
          console.warn('⚠️ Error getting search state for tab visibility:', error);
        }
      }
      ids.forEach((name) => {
        const btn = document.getElementById(`${name}Tab`);
        if (btn) {
          if (isSearching) {
            // During search, show all tabs for navigation
            btn.classList.remove('hidden');
            btn.classList.remove('is-active');
            btn.classList.remove('active'); // Remove old active class
            console.log(`🔍 Search mode - showing tab: ${name}Tab`);
          } else if (name === tab) {
            // Show current tab with active styling (new system)
            btn.classList.remove('hidden');
            btn.classList.add('is-active');
            btn.classList.remove('active'); // Remove old active class
            btn.setAttribute('aria-selected', 'true');
            btn.setAttribute('tabindex', '0');
            console.log(`✅ ${name}Tab is-active: true (current tab)`);
          } else {
            // Show other tabs without active styling
            btn.classList.remove('hidden');
            btn.classList.remove('is-active');
            btn.classList.remove('active'); // Remove old active class
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('tabindex', '-1');
            console.log(`✅ ${name}Tab is-active: false`);
          }
        }
      });

      // Sections use .tab-section + .active
      ids.forEach((name) => {
        const section = document.getElementById(`${name}Section`);
        if (section) {
          section.classList.toggle('active', name === tab);
          // Let CSS classes control visibility, don't override with inline styles
          console.log(`✅ ${name}Section active: ${name === tab}`);
        } else {
          console.error(`❌ Section not found: ${name}Section`);
        }
      });

      // Hide/show home-specific sections using unified visibility management
      if (window.VisibilityManager) {
        const results = window.VisibilityManager.manageHomeSections(
          tab === 'home',
          `tab-switch-${tab}`,
        );

        results.forEach((result) => {
          if (result.success) {
            const debug = window.FlickletDebug || {
              info: console.log,
              warn: console.warn,
              error: console.error,
            };
            debug.info(
              `✅ ${result.sectionId} visibility: ${tab === 'home' ? 'visible' : 'hidden'}`,
            );
          } else {
            const debug = window.FlickletDebug || {
              info: console.log,
              warn: console.warn,
              error: console.error,
            };
            debug.warn(`⚠️ Failed to update visibility for: ${result.sectionId}`);
          }
        });
      } else {
        // Fallback to original method if VisibilityManager not available
        if (
          window.HomeSectionsConfig &&
          typeof window.HomeSectionsConfig.getSections === 'function'
        ) {
          const homeSections = window.HomeSectionsConfig.getSections('tab-switch');
          const sectionElements = window.HomeSectionsConfig.getSectionElements('tab-switch');

          homeSections.forEach((sectionId) => {
            const section = sectionElements[sectionId];
            if (section) {
              section.style.display = tab === 'home' ? 'block' : 'none';
              const debug = window.FlickletDebug || {
                info: console.log,
                warn: console.warn,
                error: console.error,
              };
              debug.info(`✅ ${sectionId} visibility: ${tab === 'home' ? 'visible' : 'hidden'}`);
            } else {
              const debug = window.FlickletDebug || {
                info: console.log,
                warn: console.warn,
                error: console.error,
              };
              debug.warn(`⚠️ Home section not found: ${sectionId}`);
            }
          });
        } else {
          // Ultimate fallback - just log that we can't manage home sections
          console.log('⚠️ HomeSectionsConfig not available, skipping home section management');
        }
      }

      // Hide/show search bar based on tab configuration
      const searchContainer = document.querySelector('.top-search');
      if (searchContainer) {
        // Define which tabs should hide the search bar
        const TABS_WITHOUT_SEARCH = ['settings'];
        const shouldHideSearch = TABS_WITHOUT_SEARCH.includes(tab);

        if (shouldHideSearch) {
          searchContainer.style.display = 'none';
          console.log('🔍 Search bar hidden for', tab, 'tab');
        } else {
          searchContainer.style.display = '';
          console.log('🔍 Search bar shown for', tab, 'tab');
        }
      }

      // Load content for this tab first
      if (typeof updateTabContent === 'function') {
        updateTabContent(tab);
      }

      // Then update UI (including tab counts) after content is loaded
      this.updateUI();

      // Trigger counter system update after tab content is loaded
      if (window.CounterBootstrap && typeof window.CounterBootstrap.directRecount === 'function') {
        setTimeout(() => {
          window.CounterBootstrap.directRecount();
        }, 200);
      }

      // Dock FABs to the new active tab
      this.dockFABsToActiveTab();
    },

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
      if (!window.ThemeManager) {
        console.warn('⚠️ ThemeManager not available');
        return;
      }

      const currentTheme = window.ThemeManager.theme;
      let newTheme;

      if (currentTheme === 'system') {
        newTheme = window.ThemeManager.effectiveTheme === 'dark' ? 'light' : 'dark';
      } else if (currentTheme === 'light') {
        newTheme = 'dark';
      } else {
        newTheme = 'light';
      }

      window.ThemeManager.theme = newTheme;

      // Update FAB icon
      const themeFab = document.getElementById('themeToggleFab');
      if (themeFab) {
        const icon = themeFab.querySelector('span');
        if (icon) {
          icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
      }

      console.log(`🌙 Theme switched to: ${newTheme}`);
      this.showNotification(`Theme switched to ${newTheme}`, 'info');
    },

    /**
     * Toggle Mardi Gras mode
     */
    toggleMardiGras() {
      console.log('🎭 toggleMardiGras called');

      if (!window.ThemeManager) {
        console.warn('⚠️ ThemeManager not available');
        return;
      }

      const currentMardi = window.ThemeManager.mardi;
      console.log('🎭 Current Mardi Gras state:', currentMardi);

      const newMardi = currentMardi === 'on' ? 'off' : 'on';
      console.log('🎭 New Mardi Gras state:', newMardi);

      window.ThemeManager.mardi = newMardi;

      // Debug: Check if the body attribute is being set
      console.log('🎭 Body data-mardi attribute:', document.body.getAttribute('data-mardi'));
      console.log('🎭 Body classes:', document.body.className);

      // Update FAB icon
      const mardiFab = document.getElementById('mardiGrasFab');
      console.log('🎭 Mardi Gras FAB element:', mardiFab);
      if (mardiFab) {
        const icon = mardiFab.querySelector('span');
        console.log('🎭 Mardi Gras FAB icon element:', icon);
        if (icon) {
          icon.textContent = newMardi === 'on' ? '🎉' : '🎭';
          console.log('🎭 Updated icon to:', icon.textContent);
        }
      }

      console.log(`🎭 Mardi Gras mode: ${newMardi}`);
      this.showNotification(
        `Mardi Gras mode ${newMardi === 'on' ? 'enabled' : 'disabled'}`,
        'info',
      );
    },

    /**
     * Initialize FAB icons based on current theme state
     */
    initializeFABIcons() {
      // Wait for ThemeManager to be available
      if (!window.ThemeManager) {
        setTimeout(() => this.initializeFABIcons(), 100);
        return;
      }

      // Set theme toggle icon
      const themeFab = document.getElementById('themeToggleFab');
      if (themeFab) {
        const icon = themeFab.querySelector('span');
        if (icon) {
          const currentTheme = window.ThemeManager.effectiveTheme;
          icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
      }

      // Set Mardi Gras toggle icon
      const mardiFab = document.getElementById('mardiGrasFab');
      if (mardiFab) {
        const icon = mardiFab.querySelector('span');
        if (icon) {
          const currentMardi = window.ThemeManager.mardi;
          icon.textContent = currentMardi === 'on' ? '🎉' : '🎭';
        }
      }

      console.log('🎨 FAB icons initialized');
    },

    // ---------- UX Helpers ----------
    // Tab clicks are now handled by nav-init.js - single delegated listener
    // Legacy bindTabClicks removed to prevent conflicts

    setupEventListeners() {
      // Tab clicks are now handled by nav-init.js - no need to bind here
      // Legacy bindTabClicks() call removed to prevent conflicts

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === 'k') {
            e.preventDefault();
            document.getElementById('search')?.focus();
          } else if (e.key === 't') {
            e.preventDefault();
            toggleDarkMode();
          }
        }
      });

      // Overflow toggle functionality for MediaCard system
      document.addEventListener('click', (e) => {
        const t = e.target.closest('[data-overflow-toggle]');
        if (t) {
          const host = t.closest('.overflow');
          const exp = host.getAttribute('aria-expanded') === 'true';
          host.setAttribute('aria-expanded', !exp);
          e.preventDefault();
          return;
        }
        document.querySelectorAll('.overflow[aria-expanded="true"]').forEach(o => 
          o.setAttribute('aria-expanded', 'false')
        );
      });

      // Delegated actions for dynamic content
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;

        // Skip handling if this is a MediaCard button (new system handles its own events)
        if (btn.closest('.media-card')) {
          return;
        }

        // Debug logging for button clicks
        console.log('[App] Button clicked:', {
          action: action,
          id: btn.dataset.id,
          element: btn,
          target: e.target,
        });

        // Route actions
        switch (action) {
          case 'addFromCache':
            addToListFromCache?.(Number(btn.dataset.id), btn.dataset.list);
            break;
          case 'move':
            moveItem?.(Number(btn.dataset.id), btn.dataset.list);
            break;
          case 'mark-watched':
            if (window.moveItem) {
              window.moveItem(Number(btn.dataset.id), 'watched');
            }
            break;
          case 'want-to-watch':
            if (window.moveItem) {
              window.moveItem(Number(btn.dataset.id), 'wishlist');
            }
            break;
          case 'start-watching':
            if (window.moveItem) {
              window.moveItem(Number(btn.dataset.id), 'watching');
            }
            break;
          case 'remove':
            removeItemFromCurrentList?.(Number(btn.dataset.id));
            break;
          case 'rate':
            setRating?.(Number(btn.dataset.id), Number(btn.dataset.rating));
            break;
          case 'like':
            setLikeStatus?.(Number(btn.dataset.id), 'like');
            break;
          case 'dislike':
            setLikeStatus?.(Number(btn.dataset.id), 'dislike');
            break;
          case 'open':
            openTMDBLink?.(Number(btn.dataset.id), btn.dataset.mediaType);
            break;
          case 'not-interested':
            // Handled by list-actions.js - do nothing here
            break;
          case 'track-episodes':
            // Handled by inline-script-03.js - do nothing here
            break;
          case 'sign-in':
            console.log('🔐 Sign-in button clicked');
            if (window.showSignInModal) {
              window.showSignInModal();
            } else {
              console.error('❌ showSignInModal not available');
            }
            break;
          case 'share-lists':
            // Handled by inline-script-01.js - do nothing here
            break;
          case 'username-skip':
            // Username modal skip
            e.preventDefault();
            break;
          case 'add':
            // Handle add actions
            const id = btn.dataset.id || btn.getAttribute('data-id');
            const list = btn.dataset.list || btn.getAttribute('data-list') || 'wishlist';
            if (id && typeof window.addToListFromCache === 'function') {
              window.addToListFromCache(Number(id), list);
            }
            break;
          case 'open-flickword':
            // Handle FlickWord game opening
            console.log('🎯 FlickWord button clicked');
            if (typeof window.openFlickWordModal === 'function') {
              window.openFlickWordModal();
            } else {
              console.error('❌ openFlickWordModal function not available');
            }
            break;
          case 'start-trivia':
            // Handle Trivia game opening
            console.log('🧠 Trivia button clicked');
            if (typeof window.openTriviaModal === 'function') {
              window.openTriviaModal();
            } else {
              console.error('❌ openTriviaModal function not available');
            }
            break;
          case 'username-save':
            // Username modal save
            e.preventDefault();
            e.stopPropagation();
            // Find the username modal and trigger save
            const usernameModal2 = document.getElementById('username-modal');
            if (usernameModal2) {
              const input = document.getElementById('username-input');
              const value = input ? input.value.trim() : '';
              // Find the parent wrapper (the div that was created in promptForUsername)
              const wrapper = usernameModal2.parentElement;
              if (wrapper && wrapper._usernameDone) {
                wrapper._usernameDone(value || null);
              }
            }
            break;
          case 'toggle-theme': {
            // mirror FAB behavior
            if (typeof window.applyThemeToggle === 'function') {
              window.applyThemeToggle();
            } else {
              // Fallback: read current and flip
              const cur = document.documentElement.getAttribute('data-theme') || 'light';
              const next = cur === 'light' ? 'dark' : 'light';
              document.documentElement.setAttribute('data-theme', next);
            }
            break;
          }
          default:
            console.warn(t('unknown_data_action') + ':', action);
        }
      });

      // FAB Event Handlers
      document.addEventListener('click', (e) => {
        // Settings FAB
        if (e.target.closest('#btnSettings')) {
          e.preventDefault();
          e.stopPropagation();
          console.log('⚙️ Settings FAB clicked');
          this.switchToTab('settings');
        }

        // Theme Toggle FAB
        if (e.target.closest('#themeToggleFab')) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🌙 Theme toggle FAB clicked');
          this.toggleTheme();
        }

        // Mardi Gras Toggle FAB
        if (e.target.closest('#mardiGrasFab')) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🎭 Mardi Gras FAB clicked - event handler triggered');
          this.toggleMardiGras();
        }
      });

      // DISABLED: Theme toggle - now handled in inline-script-03.js
      // document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);

      // Language select
      const langSel = document.getElementById('langToggle');
      if (langSel) {
        langSel.addEventListener('change', (e) => {
          changeLanguage(e.target.value);
        });
      }

      // Account button is now handled by AuthManager via onclick attribute
      // No need to set up event listeners here
    },

    // Account management
    showSignInModal() {
      console.log('🔐 showSignInModal called - using FlickletAuth');

      // Check if offline mode is active
      if (!this.firebaseInitialized) {
        console.log('🔒 Offline mode active, not showing sign-in modal');
        this.showNotification(
          'Authentication is currently unavailable. Your data is stored locally and will sync when Firebase is available.',
          'info',
        );
        return;
      }

      // Check if modal already exists
      if (document.querySelector('.modal-backdrop[data-modal="login"]')) {
        console.log('⚠️ Auth modal already exists, not creating another');
        return;
      }

      // Use the existing openModal function from inline-script-02.js
      if (typeof window.openModal === 'function') {
        this.createSignInModal();
      } else {
        this.waitForOpenModal()
          .then(() => {
            console.log('✅ openModal now available, creating sign-in modal');
            this.createSignInModal();
          })
          .catch(() => {
            console.error('❌ openModal function not available after timeout');
            this.showNotification('Sign-in system is not ready. Please refresh the page.', 'error');
          });
      }
    },

    waitForOpenModal() {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('openModal function not available'));
        }, 5000);

        const handleModalReady = () => {
          clearTimeout(timeout);
          window.removeEventListener('modal-api-ready', handleModalReady);
          resolve();
        };

        window.addEventListener('modal-api-ready', handleModalReady);
      });
    },

    // Helper function to wait for settings section to be ready
    onSettingsReady(callback) {
      const settingsSection = document.getElementById('settingsSection');
      if (settingsSection) {
        callback();
        return;
      }

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const settingsSection = document.getElementById('settingsSection');
            if (settingsSection) {
              observer.disconnect();
              callback();
            }
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    },

    createSignInModal() {
      console.log('🔐 Creating sign-in modal...');
      try {
        window.openModal(
          t('sign_in_to_sync'),
          `
            <p style="margin-bottom: 20px;">${t('sign_in_subtitle_text')}</p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; justify-content:center; align-items:center; max-width:320px; margin:0 auto;">
              <button id="googleBtn" type="button" class="btn" style="font-size:14px; padding:12px 18px; min-height:44px;">🔒 Google</button>
              <button id="appleBtn" type="button" class="btn secondary" style="font-size:14px; padding:12px 18px; min-height:44px;">🍎 Apple</button>
              <button id="emailBtn" type="button" class="btn secondary" style="font-size:14px; padding:12px 18px; min-height:44px; grid-column: 1 / -1;">✉️ Email</button>
            </div>
          `,
          'auth-modal',
        );

        // Set up event listeners for the modal buttons
        setTimeout(() => {
          const googleBtn = document.getElementById('googleBtn');
          const appleBtn = document.getElementById('appleBtn');
          const emailBtn = document.getElementById('emailBtn');

          if (googleBtn) {
            googleBtn.addEventListener('click', () => {
              if (window.FlickletAuth && window.FlickletAuth.loginWithGoogle) {
                window.FlickletAuth.loginWithGoogle();
              } else {
                console.error('❌ FlickletAuth.loginWithGoogle not available');
                this.showNotification(t('google_signin_unavailable'), 'error');
              }
            });
          }

          if (appleBtn) {
            appleBtn.addEventListener('click', () => {
              if (window.FlickletAuth && window.FlickletAuth.loginWithApple) {
                window.FlickletAuth.loginWithApple();
              } else {
                console.error('❌ FlickletAuth.loginWithApple not available');
                this.showNotification(t('apple_signin_unavailable'), 'error');
              }
            });
          }

          if (emailBtn) {
            emailBtn.addEventListener('click', () => {
              if (window.FlickletAuth && window.FlickletAuth.loginWithEmail) {
                window.FlickletAuth.loginWithEmail();
              } else {
                console.error('❌ FlickletAuth.loginWithEmail not available');
                this.showNotification(t('email_signin_unavailable'), 'error');
              }
            });
          }
        }, 100);
      } catch (error) {
        console.error('❌ Error creating sign-in modal:', error);
        this.showNotification(t('unable_to_show_signin'), 'error');
      }
    },

    showSignOutModal() {
      console.log('🚪 showSignOutModal called, currentUser:', this.currentUser);
      if (!this.currentUser) {
        console.log('❌ No current user, cannot show sign out modal');
        return;
      }

      const email = this.currentUser.email || t('unknown');
      const displayName = this.currentUser.displayName || email.split('@')[0] || t('user');

      const confirmed = confirm(
        `${t('sign_out_confirmation')} ${displayName}?\n\n${t('email_label')}: ${email}`,
      );
      if (confirmed) {
        console.log('✅ User confirmed sign out');
        // Call the new sign out method
        this.signOut();
      } else {
        console.log('❌ User cancelled sign out');
      }
    },

    signOut() {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase
          .auth()
          .signOut()
          .then(() => {
            console.log('✅ User signed out successfully');
            showNotification?.(t('signed_out_successfully'), 'success');
          })
          .catch((error) => {
            console.error('❌ Sign out failed:', error);
            showNotification?.(t('sign_out_failed'), 'error');
          });
      } else {
        console.error('❌ Firebase auth not available for sign out');
      }
    },

    // Optional feature hooks (no-ops here, but left for compatibility)
    initializeFlickWord() {
      // Guard: Check if required containers exist before initializing
      const flickwordTile = document.getElementById('flickwordTile');
      const triviaTile = document.getElementById('triviaTile');

      if (!flickwordTile && !triviaTile) {
        console.warn('[FlickletApp] Games containers not found, skipping games initialization');
        return;
      }

      // Log once if containers are missing
      if (!flickwordTile) {
        console.warn('[FlickletApp] flickwordTile not found');
      }
      if (!triviaTile) {
        console.warn('[FlickletApp] triviaTile not found');
      }
    },

    initializeFlickWordModal() {
      console.log('🎯 Initializing FlickWord modal...');
      try {
        // Import and initialize the flickword modal module
        import('/scripts/modules/flickword-modal.js')
          .then((module) => {
            if (module.initializeFlickWordModal) {
              module.initializeFlickWordModal();
              console.log('✅ FlickWord modal initialized successfully');
            } else {
              console.warn('⚠️ initializeFlickWordModal function not found in module');
            }
          })
          .catch((error) => {
            console.error('❌ Failed to load FlickWord modal module:', error);
          });
      } catch (error) {
        console.error('❌ Error initializing FlickWord modal:', error);
      }
    },

    initializeTriviaModal() {
      console.log('🧠 Initializing Trivia modal...');
      try {
        // Import and initialize the trivia modal module
        import('/scripts/modules/trivia-modal.js')
          .then((module) => {
            if (module.initializeTriviaModal) {
              module.initializeTriviaModal();
              console.log('✅ Trivia modal initialized successfully');
            } else {
              console.warn('⚠️ initializeTriviaModal function not found in module');
            }
          })
          .catch((error) => {
            console.error('❌ Failed to load Trivia modal module:', error);
          });
      } catch (error) {
        console.error('❌ Error initializing Trivia modal:', error);
      }
    },
    // checkAndPromptLogin() removed - handled in auth listener

    // Search functionality moved to search.js module

    // ---------- Genres ----------
    initializeGenres() {
      console.log('🎬 Initializing genres...');

      // Call loadGenres if available
      if (typeof window.loadGenres === 'function') {
        console.log('✅ loadGenres function found, calling it');
        window.loadGenres();
      } else {
        console.log('❌ loadGenres function not available');
      }

      console.log('✅ Genres initialization complete');
    },

    // Enter key functionality moved to search.js module

    // Search functions moved to search.js module

    // Debug method to check account button state
    debugAccountButton() {
      const accountBtn = document.getElementById('accountBtn');
      if (accountBtn) {
        console.log('🔍 Account button debug info:', {
          textContent: accountBtn.textContent,
          innerHTML: accountBtn.innerHTML,
          title: accountBtn.title,
          currentUser: this.currentUser,
          firebaseDisplayName: this.currentUser?.displayName,
          email: this.currentUser?.email,
        });
      }
    },

    // Test method to verify sign-in modal works
    testSignInModal() {
      console.log('🧪 Testing sign-in modal...');
      try {
        this.showSignInModal();
        console.log('✅ Sign-in modal test successful');
      } catch (error) {
        console.error('❌ Sign-in modal test failed:', error);
      }
    },

    // Debug method to check authentication system status
    debugAuthSystem() {
      console.log('🔍 Authentication system debug info:', {
        FlickletAuth: !!window.FlickletAuth,
        FlickletAuthMethods: window.FlickletAuth ? Object.keys(window.FlickletAuth) : 'N/A',
        openModal: typeof window.openModal,
        emailLogin: typeof window.emailLogin,
        firebase: typeof firebase,
        firebaseAuth: typeof firebase?.auth,
        currentUser: this.currentUser,
        authInitialized: this.authInitialized,
        firebaseInitialized: this.firebaseInitialized,
      });
    },

    // Language change function - delegates to centralized LanguageManager
    changeLanguage(newLang) {
      console.log('🌐 FlickletApp.changeLanguage delegating to LanguageManager:', newLang);

      // Emit language:changed event for counter system
      document.dispatchEvent(
        new CustomEvent('language:changed', {
          detail: { newLang: newLang },
        }),
      );

      if (window.LanguageManager) {
        return window.LanguageManager.changeLanguage(newLang);
      } else {
        console.warn('🌐 LanguageManager not available, falling back to window.changeLanguage');
        if (typeof window.changeLanguage === 'function') {
          return window.changeLanguage(newLang);
        }
      }
    },

    // CRITICAL: Save app data to Firebase (missing function that was causing sync issues)
    async saveData() {
      try {
        // Auth guard: Ensure auth is ready before any Firestore operations
        const user = await window.ensureUser();
        const uid = user.uid;
        const db = firebase.firestore();

        FlickletDebug.info('💾 FlickletApp.saveData: Starting lean save to Firebase');

        // Use lean serializer for minimal payload
        const minimal = window.pruneWatchlistsShape(window.appData || {});
        const payload = {
          ...minimal,
          uid,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp?.(),
        };
        const json = JSON.stringify(payload);
        const bytes = window.computeBytes(json);

        // Abort if payload is still too large
        if (bytes > 900 * 1024) {
          console.warn(
            '[saveData] payload too large, skipping Firestore save:',
            (bytes / 1024).toFixed(1),
            'KB',
          );
          // Still try to save locally with lean data
          window.saveAppData('flicklet-data', minimal);
          return;
        }

        // Save to Firestore
        await db.doc(`users/${uid}`).set(payload, { merge: true });
        console.info('[saveData] Firestore save OK:', (bytes / 1024).toFixed(1), 'KB');

        // Mirror to LocalStorage (guarded)
        window.saveAppData('flicklet-data', payload);

        FlickletDebug.info(
          '✅ FlickletApp.saveData: Lean data saved successfully to Firebase and localStorage',
        );
      } catch (error) {
        FlickletDebug.error('❌ FlickletApp.saveData failed:', error);

        // Fallback to localStorage only with lean data
        try {
          const minimal = window.pruneWatchlistsShape(window.appData || {});
          window.saveAppData('flicklet-data', minimal);
          FlickletDebug.info('💾 Fallback: Lean data saved to localStorage only');
        } catch (localError) {
          FlickletDebug.error('❌ Even localStorage save failed:', localError);
        }

        throw error;
      }
    },

    // ---------- SEARCH STATE MANAGEMENT ----------
    /**
     * Process: Search State Management
     * Purpose: Track search state and ensure tabs remain visible during search
     * Data Source: Search controller calls this method
     * Update Path: Called by search-controller.js when entering/exiting search
     * Dependencies: Tab visibility system, search controller
     */
    setSearching(searching) {
      this.isSearching = searching;
      console.log('🔍 FlickletApp search state changed:', searching);

      // Ensure tabs remain visible during search
      if (searching) {
        const tabContainer = document.querySelector('.tab-container');
        if (tabContainer) {
          tabContainer.style.display = 'flex';
          console.log('🔍 Tab container made visible during search');
        }
      }
    },

    // ---------- FAB DOCKING SYSTEM ----------
    /**
     * Process: FAB Docking
     * Purpose: Dock all FABs to the currently active tab container
     * Data Source: DOM query for .tab-section:not([hidden]) and FAB elements
     * Update Path: Automatically triggered on tab switches
     * Dependencies: CSS .fab-dock class, tab switching system
     */
    dockFABsToActiveTab() {
      const FAB_SELECTORS = '.fab, .fab-left'; // include all FAB variants
      const ACTIVE_PANEL_SELECTOR = '.tab-section:not([hidden])';

      function getActivePanel() {
        return document.querySelector(ACTIVE_PANEL_SELECTOR);
      }

      function ensureDock(panel) {
        if (!panel) return null;
        let dock = panel.querySelector(':scope > .fab-dock');
        if (!dock) {
          dock = document.createElement('div');
          dock.className = 'fab-dock';
          panel.appendChild(dock);
        }
        return dock;
      }

      function moveFABsToDock() {
        const panel = getActivePanel();
        if (!panel) return;
        const dock = ensureDock(panel);
        if (!dock) return;

        // Move settings FAB (fab-left) to left side
        const settingsFab = document.querySelector('.fab-left');
        if (settingsFab && !dock.contains(settingsFab)) {
          settingsFab.style.display = ''; // Show the FAB
          dock.appendChild(settingsFab);
        }

        // Move fab-stack (theme buttons) to right side
        const fabStack = document.querySelector('.fab-stack');
        if (fabStack && !dock.contains(fabStack)) {
          fabStack.style.display = 'flex'; // Show the stack
          dock.appendChild(fabStack);
        }

        // Move any individual FABs that aren't in a stack
        const individualFabs = Array.from(document.querySelectorAll('.fab')).filter(
          (btn) => !btn.closest('.fab-stack') && !dock.contains(btn),
        );

        if (individualFabs.length > 0) {
          // Create a stack for individual FABs if it doesn't exist
          let individualStack = dock.querySelector('.individual-fab-stack');
          if (!individualStack) {
            individualStack = document.createElement('div');
            individualStack.className = 'fab-stack individual-fab-stack';
            dock.appendChild(individualStack);
          }

          individualFabs.forEach((btn) => individualStack.appendChild(btn));
        }

        // FAB docking completed
      }

      // Initial run - try multiple times to ensure it works
      moveFABsToDock();
      setTimeout(moveFABsToDock, 100);
      setTimeout(moveFABsToDock, 500);

      // Re-run whenever tabs change (click on [data-tab] or programmatic)
      document.addEventListener('click', (e) => {
        // Adjust if your tab triggers differ
        if (e.target.closest?.('[data-tab], .tab, .tab-link')) {
          setTimeout(moveFABsToDock, 0); // let the 'active' class switch first
        }
      });

      // Optional public hook if your code switches tabs programmatically
      window.reDockFABs = moveFABsToDock;

      // If your app fires a custom event on tab switch, hook it:
      document.addEventListener('tab:changed', moveFABsToDock);
    },

    // Settings tab functionality
    setupSettingsTabs() {
      const settingsTabs = document.querySelectorAll('.settings-tabs button[data-target]');
      settingsTabs.forEach((tab) => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const targetId = tab.getAttribute('data-target');
          console.log('Settings tab clicked:', targetId);

          // Remove active class from all tabs
          settingsTabs.forEach((btn) => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
          });

          // Add active class to clicked tab
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');

          // Hide all sections
          const sections = document.querySelectorAll('.settings-section');
          sections.forEach((section) => {
            section.classList.remove('active');
            section.style.display = 'none';
          });

          // Show target section
          const targetSection = document.querySelector(targetId);
          if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
          }
        });
      });
    },
  };

  // Expose singleton
  window.FlickletApp = App;

  // Expose clearUserData function globally for auth manager
  window.clearUserData = () => App.clearUserData();

  // Also expose as instance for compatibility
  window.FlickletAppInstance = App;

  // Initialize the app when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded - initializing FlickletApp');
    App.init().catch((error) => {
      console.error('❌ FlickletApp initialization failed:', error);
    });
  });

  // Expose UserViewModel globally for verification
  window.UserViewModel = UserViewModel;

  // Initialize display name input with current value
  window.initializeDisplayNameInput = function() {
    const input = document.getElementById('displayNameInput');
    if (input) {
      const currentName = window.appData?.settings?.displayName || 
                         window.appData?.settings?.username || 
                         window.SettingsManager?.get('displayName') || '';
      input.value = currentName;
      console.log('✅ Display name input initialized with:', currentName);
    }
  };

  // Listen for data ready events to initialize display name input
  document.addEventListener('app:data:ready', (event) => {
    console.log('📊 Data ready event received:', event.detail?.source);
    // Initialize display name input after data is loaded
    setTimeout(() => {
      window.initializeDisplayNameInput();
      
      // Also update UserViewModel if user is authenticated to pick up display name from settings
      if (window.FlickletApp && window.FlickletApp.currentUser) {
        UserViewModel.update(window.FlickletApp.currentUser);
        console.log('✅ UserViewModel refreshed with settings data');
      }
    }, 100);
  });

  // Ensure user function for auth guards
  window.ensureUser = async function () {
    // Wait for Firebase to be ready
    if (!window.firebase || !window.firebaseAuth) {
      console.log('[ensureUser] Waiting for Firebase...');
      await new Promise((resolve) => {
        const checkFirebase = () => {
          if (window.firebase && window.firebaseAuth) {
            resolve();
          } else {
            setTimeout(checkFirebase, 100);
          }
        };
        checkFirebase();
      });
    }

    const user = window.firebaseAuth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    return user;
  };

  // Custom Yes/No confirmation dialog
  window.showYesNoDialog = function(message) {
    return new Promise((resolve) => {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Create dialog box
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      dialog.innerHTML = `
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.4;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="yesBtn" style="
            background: #ff4c8d;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">Yes</button>
          <button id="noBtn" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">No</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Handle button clicks
      const yesBtn = dialog.querySelector('#yesBtn');
      const noBtn = dialog.querySelector('#noBtn');

      yesBtn.onclick = () => {
        document.body.removeChild(overlay);
        resolve(true);
      };

      noBtn.onclick = () => {
        document.body.removeChild(overlay);
        resolve(false);
      };

      // Handle escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          document.body.removeChild(overlay);
          document.removeEventListener('keydown', handleEscape);
          resolve(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  };

  // Global functions for HTML onclick handlers
  window.saveDisplayName = async function () {
    const input = document.getElementById('displayNameInput');
    if (!input) {
      console.error('Display name input not found');
      return;
    }

    const newName = input.value.trim();
    if (!newName) {
      console.warn('Display name is empty');
      return;
    }

    // Check if this is an overwrite of existing username
    const currentUsername = window.appData?.settings?.username;
    if (currentUsername && currentUsername !== newName) {
      const confirmed = await window.showYesNoDialog(
        `This will change your username from "${currentUsername}" to "${newName}". Are you sure you want to continue?`
      );
      if (!confirmed) {
        console.log('Username change cancelled by user');
        return;
      }
    }

    try {
      console.log('🔄 Starting display name save process for:', newName);
      
      // Update appData
      if (!window.appData) {
        window.appData = { settings: {} };
        console.log('📝 Created new appData object');
      }
      if (!window.appData.settings) {
        window.appData.settings = {};
        console.log('📝 Created new appData.settings object');
      }

      window.appData.settings.username = newName;
      window.appData.settings.displayName = newName;
      console.log('✅ Updated appData.settings:', { username: newName, displayName: newName });

      // Save to SettingsManager for proper persistence
      if (window.SettingsManager && typeof window.SettingsManager.set === 'function') {
        window.SettingsManager.set('displayName', newName);
        window.SettingsManager.set('username', newName);
        console.log('✅ Display name saved to SettingsManager:', newName);
      } else {
        console.warn('⚠️ SettingsManager not available or set method missing');
      }

      // Save to localStorage
      try {
        if (typeof window.saveAppData === 'function') {
          window.saveAppData();
          console.log('✅ Data saved via saveAppData function');
        } else {
          localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
          console.log('✅ Data saved to localStorage directly');
        }
      } catch (storageError) {
        console.error('❌ Failed to save to localStorage:', storageError);
        throw new Error('Failed to save to localStorage: ' + storageError.message);
      }

      // Save to Firebase if user is signed in - use the dedicated setUsername method
      if (window.FlickletApp && window.FlickletApp.currentUser) {
        try {
          // Use the existing setUsername method which handles Firebase properly
          const firebaseSuccess = await window.FlickletApp.setUsername(
            window.FlickletApp.currentUser.uid, 
            newName
          );
          
          if (firebaseSuccess) {
            console.log('✅ Username saved to Firebase via setUsername:', newName);
          } else {
            console.error('❌ setUsername returned false');
            throw new Error('setUsername method returned false');
          }
        } catch (firebaseError) {
          console.error('❌ Failed to save username to Firebase:', firebaseError);
          // Don't continue if Firebase save fails - this is critical
          throw new Error('Failed to save to Firebase: ' + firebaseError.message);
        }
      }

      // Update current user object if authenticated
      if (window.FlickletApp && window.FlickletApp.currentUser) {
        window.FlickletApp.currentUser.displayName = newName;
        console.log('✅ Updated currentUser.displayName:', newName);
      }

      // Set a flag to prevent data loading from overriding our changes
      window.__USERNAME_JUST_SAVED__ = newName;
      setTimeout(() => {
        delete window.__USERNAME_JUST_SAVED__;
      }, 5000); // Clear flag after 5 seconds

      // Update UI immediately using the new method
      try {
        if (window.UserViewModel && typeof window.UserViewModel.updateDisplayName === 'function') {
          window.UserViewModel.updateDisplayName(newName);
          console.log('✅ UserViewModel.updateDisplayName called');
        } else {
          console.warn('⚠️ UserViewModel not available or updateDisplayName method missing');
        }
        
        // Also trigger a full UserViewModel update to ensure consistency
        if (window.FlickletApp && window.FlickletApp.currentUser && window.UserViewModel) {
          window.UserViewModel.update(window.FlickletApp.currentUser);
          console.log('✅ UserViewModel.update called with currentUser');
        }
      } catch (uiError) {
        console.error('❌ Failed to update UI:', uiError);
        // Don't throw here - data is saved, just UI update failed
      }

      console.log('✅ Display name saved:', newName);

      // Show success feedback
      const btn = document.getElementById('saveNameBtn');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Saved!';
        btn.style.background = '#51cf66';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Failed to save display name:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to save display name: ${errorMessage}. Please try again.`);
      
      // Show error feedback
      const btn = document.getElementById('saveNameBtn');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '❌ Error';
        btn.style.background = '#dc3545';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
        }, 3000);
      }
    }
  };

  /**
   * Process: Back to Top Functionality
   * Purpose: Adds floating back-to-top button that appears on scroll
   * Data Source: Window scroll events
   * Update Path: Modify scroll threshold or button styling
   * Dependencies: CSS for .back-to-top class
   */
  FlickletApp.initBackToTop = function initBackToTop() {
    try {
      const NS = '[app]';
      const log = (...a) => console.log(NS, ...a);

      // Wait for DOM to be ready
      if (!document.body) {
        log('DOM not ready, deferring back-to-top initialization');
        setTimeout(() => FlickletApp.initBackToTop(), 100);
        return;
      }

      // Create back-to-top button
      const backToTopBtn = document.createElement('button');
      backToTopBtn.className = 'back-to-top';
      backToTopBtn.innerHTML = '↑';
      backToTopBtn.setAttribute('aria-label', 'Back to top');
      backToTopBtn.setAttribute('title', 'Back to top');

      // Add to body
      document.body.appendChild(backToTopBtn);

      // Scroll handler
      let isVisible = false;
      const scrollThreshold = 300; // Show after scrolling 300px

      function handleScroll() {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const shouldShow = scrollY > scrollThreshold;

        if (shouldShow !== isVisible) {
          isVisible = shouldShow;
          if (isVisible) {
            backToTopBtn.classList.add('visible');
          } else {
            backToTopBtn.classList.remove('visible');
          }
        }
      }

      // Click handler
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      });

      // Add scroll listener
      window.addEventListener('scroll', handleScroll, { passive: true });

      log('Back-to-top functionality initialized');
    } catch (e) {
      console.warn('[app] initBackToTop failed:', e?.message || e);
    }
  };

  // Initialize back-to-top functionality
  FlickletApp.initBackToTop();

  // Expose saveData globally for use by other modules
  window.saveData = FlickletApp.saveData.bind(FlickletApp);
})();
