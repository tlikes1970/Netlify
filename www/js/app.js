/* ============== Flicklet App (Cleaned Core) ==============
   Single source of truth for initialization & lifecycle.
   This build removes duplicate init paths and normalizes tab/UI/render behavior.
*/

(function () {
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
        this.displayName = user.displayName || user.email?.split('@')[0] || 'User';
        this.alias = user.displayName || user.email?.split('@')[0] || 'User';
        this.avatarUrl = user.photoURL || '';
        this.email = user.email || '';
      } else {
        this.displayName = '';
        this.alias = '';
        this.avatarUrl = '';
        this.email = '';
      }
      
      // Notify all UI components of auth state change
      this.notifyUI();
    },
    
    notifyUI() {
      // Update account button
      const accountBtn = document.getElementById('accountBtn');
      if (accountBtn) {
        accountBtn.textContent = this.isAuthenticated ? `👤 ${this.displayName}` : '👤 Sign In';
        accountBtn.title = this.isAuthenticated ? 
          `Signed in as ${this.email}. Click to sign out.` : 
          'Click to sign in';
      }
      
      // Update snark text
      const snarkElement = document.querySelector('[data-snark]');
      if (snarkElement && this.isAuthenticated) {
        const snarks = [
          `Welcome back, ${this.alias}!`,
          `Ready to discover, ${this.alias}?`,
          `Let's find your next favorite show, ${this.alias}!`
        ];
        snarkElement.textContent = snarks[Math.floor(Math.random() * snarks.length)];
      } else if (snarkElement) {
        snarkElement.textContent = '';
      }
      
      // Update settings access
      const settingsElements = document.querySelectorAll('[data-requires-auth]');
      settingsElements.forEach(el => {
        if (this.isAuthenticated) {
          el.style.display = '';
          el.removeAttribute('disabled');
        } else {
          el.style.display = 'none';
          el.setAttribute('disabled', 'true');
        }
      });
    }
  };

  const App = {
    // Runtime state (references the global appData defined in utils.cleaned.js)
    currentUser: null,
    currentTab: 'home',
    genresLoaded: false,
    authInitialized: false,
    firebaseInitialized: false,

    init() {
      FlickletDebug.info('🚀 [FlickletApp] init');
      try {
        // 1) Load persisted data
        if (typeof loadAppData === 'function') {
          loadAppData();
        }

        // 2) Apply theme & language
        this.applyTheme();
        this.applyLanguage();

        // 3) Initialize Firebase auth listener
        this.initFirebase();

        // 3.5) Setup auth button sync
        this.setupAuthButtonSync();

        // 4) Bind global UI listeners
        this.setupEventListeners();

        // 5) Ensure a default active tab and initial render
        this.switchToTab('home');
        this.updateUI();
        
        // 6) Update tab badges after UI is ready
        setTimeout(() => {
          if (typeof window.updateTabCounts === 'function') {
            console.log('🔢 Calling updateTabCounts during initialization');
            window.updateTabCounts();
          }
        }, 500);

        // Auth listener handled in initFirebase()

        // 6) Optional: feature blocks that rely on DOM (after first paint)
        setTimeout(() => {
          this.initializeFlickWord?.();
          // checkAndPromptLogin removed - handled in auth listener
        }, 150);

        // Initialize search functionality after a delay to ensure search functions are loaded
        setTimeout(() => {
          this.initializeSearch();
          this.ensureSearchFunctionsAvailable();
        }, 1000);

        // Initialize genres
        this.initializeGenres();

        FlickletDebug.info('✅ [FlickletApp] ready');
      } catch (e) {
        FlickletDebug.error('💥 [FlickletApp] init failed:', e);
      }
    },

    // ---------- Visual / Theme ----------
    applyTheme() {
      const local = localStorage.getItem('flicklet-theme');
      const chosen = local || (appData?.settings?.theme || 'light');
      
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
      if (window.__NO_FIREBASE__ || !(window.firebase && typeof window.firebase.initializeApp === 'function')) {
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
        accountBtn.title = t('auth_unavailable_offline') || 'Authentication unavailable - working in offline mode';
      }
      
      // Show a notification about offline mode
      this.showNotification(t('working_offline_mode') || 'Working in offline mode - data will be stored locally only', 'info');
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
              if (e.target === e.currentTarget) { /* click on backdrop */ }
            });
            
            const done = (val) => { 
              console.log('[promptForUsername] done called with:', val);
              wrap.remove(); 
              resolve(val); 
            };
            
            // Expose the done callback for global [data-action] handler
            wrap._usernameDone = done;
            console.log('[promptForUsername] _usernameDone callback set on wrapper');
            
            // Note: Event handlers are now managed by the global [data-action] delegate
          });
        }

        // Firestore helpers (guarded)
        function userDocRef(uid) {
          if (!window.db || !uid) return null;
          return db.collection('users').doc(uid); // simple structure: users/{uid}
        }
        async function readUsername(uid) {
          const ref = userDocRef(uid);
          if (!ref) throw new Error('Firestore not available');
          const snap = await ref.get();
          return snap.exists ? (snap.data()?.username || null) : null;
        }
        async function writeUsername(uid, name) {
          const ref = userDocRef(uid);
          if (!ref) throw new Error('Firestore not available');
          await ref.set({ username: name }, { merge: true });
        }

        function updateWelcome(name) {
          const el = document.getElementById('welcomeNote') || (() => {
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
            try { uname = await readUsername(user.uid); } catch {}
            if (!uname) {
              const picked = await promptForUsername(display);
              if (picked) {
                try { await writeUsername(user.uid, picked); } catch {}
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
          if (!window.firebase || !firebase.auth) { console.warn('[auth] Firebase not available'); return; }
          const auth = firebase.auth();
          const provider = new firebase.auth.GoogleAuthProvider();
          auth.signInWithPopup(provider).catch(err => console.error('[auth] Sign-in failed', err));
        }

        // Click handler
        btn.addEventListener('click', async () => {
          if (!window.firebase || !firebase.auth) return;
          const auth = firebase.auth();
          if (auth.currentUser) auth.signOut().catch(e => console.error('[auth] Sign-out failed', e));
          else triggerSignIn();
        });

        // onAuthStateChanged: sync button + flows; show first-load prompt when unsigned
        if (window.firebase && firebase.auth) {
          const auth = firebase.auth();
          // First paint
          if (auth.currentUser) setAuthButtonSignedIn(auth.currentUser.displayName || auth.currentUser.email || '');
          else { setAuthButtonSignedOut(); showFirstLoadSignInPrompt(); }

          auth.onAuthStateChanged((user) => {
            if (user) ensureUsernameFlow(user);
            else { setAuthButtonSignedOut(); }
          });
        } else {
          setAuthButtonSignedOut();
        }
      })();
    },

    async processUserSignIn(user) {
      try {
        FlickletDebug.info('✅ User signed in, processing...');
        
        // 1) Close ALL auth modals
        document.querySelectorAll('.modal-backdrop[data-modal="login"]').forEach(n => n.remove());
        window.__currentAuthModal = null;

        // 2) CREATE USER DATABASE ENTRY (CRITICAL FOR FIREBASE STORAGE)
        FlickletDebug.info('🔄 Creating user database entry...');
        try {
          const db = firebase.firestore();
          await db.collection("users").doc(user.uid).set({
            profile: {
              email: user.email || "",
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
            },
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          FlickletDebug.info('✅ User database entry created successfully');
        } catch (error) {
          FlickletDebug.error('❌ Failed to create user database entry:', error);
        }

        // 3) LOAD USER DATA FROM CLOUD (CRITICAL FOR DATA RESTORATION)
        FlickletDebug.info('🔄 Loading user data from Firebase cloud storage...');
        try {
          if (typeof window.loadUserDataFromCloud === 'function') {
            await window.loadUserDataFromCloud(user.uid);
            FlickletDebug.info('✅ User data loaded from cloud successfully');
            
            // CRITICAL: Refresh UI after data is loaded to prevent "already in list" errors
            if (typeof window.updateUI === 'function') {
              FlickletDebug.info('🔄 Refreshing UI after cloud data load...');
              window.updateUI();
            }
            
            // Update tab badges after data is loaded
            if (typeof window.updateTabCounts === 'function') {
              FlickletDebug.info('🔢 Updating tab counts after cloud data load...');
              window.updateTabCounts();
            }
            
            // Also refresh the current tab content
            if (typeof window.FlickletApp?.updateTabContent === 'function') {
              const currentTab = window.FlickletApp?.currentTab || 'home';
              FlickletDebug.info('🔄 Refreshing current tab content:', currentTab);
              window.FlickletApp.updateTabContent(currentTab);
            }
          } else {
            FlickletDebug.error('❌ loadUserDataFromCloud function not available');
          }
        } catch (error) {
          FlickletDebug.error('❌ Failed to load user data from cloud:', error);
        }

        // 4) BUTTON LABEL = Firebase displayName (fallback email prefix)
        console.log('🔍 User signed in, Firebase user data:', {
          displayName: user.displayName,
          email: user.email,
          providerData: user.providerData
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
          const settings = await this.readSettings(user.uid);
          let username = (settings.username || '').trim();

          // Load existing username into window.appData.settings for personalized rows
          if (username) {
            window.appData = window.appData || {};
            window.appData.settings = { ...(window.appData.settings||{}), username };
            console.log('✅ Loaded existing username into appData:', username);
          }

          // single prompt gate stored in Firestore so it works across devices
          const alreadyPrompted = !!settings.usernamePrompted;
          console.log('🔍 Username check:', { username, alreadyPrompted, settings });
          
          if (!username && !alreadyPrompted) {
            console.log('🔧 Prompting for username...', {username, alreadyPrompted, settings});
            username = await this.promptForUsernameOnce(user.displayName);  // returns string or null
            console.log('🔧 Username prompt result:', username);
            
            if (username && username.trim()) {
              await this.writeSettings(user.uid, { username: username.trim(), usernamePrompted: true });
              // keep local appData in sync (if you use it)
              window.appData = window.appData || {};
              window.appData.settings = { ...(window.appData.settings||{}), username: username.trim() };
              console.log('✅ Username saved:', username.trim());
            } else {
              await this.writeSettings(user.uid, { usernamePrompted: true });
              console.log('✅ Username prompt marked as completed (skipped)');
            }
          } else {
            console.log('🔍 Username already exists or was prompted:', { username, alreadyPrompted });
          }

          // Update left snark AFTER username is set
          this.setLeftSnark(username ? this.makeSnark(username) : '');

          // Run migration once per user
          await this.runMigration();
          
          // Run cleanup for stray field
          await this.cleanupStrayField();
          
          // Migrate legacy name fields
          await this.migrateLegacyNameFields(user.uid);
          
        } catch (error) {
          console.error('❌ Error in user sign-in processing:', error);
          this.showNotification(t('error_loading_user_data'), 'error');
        }
        
      } catch (error) {
        console.error('❌ Error in processUserSignIn:', error);
        this.showNotification(t('error_processing_sign_in'), 'error');
      }
    },

    clearUserData() {
      // Clear user data when signing out
      this.currentUser = null;
      window.currentUser = null;
      
      // Clear any cached user data
      if (window.appData) {
        window.appData.settings = window.appData.settings || {};
        window.appData.settings.username = '';
      }
      
      // Update UI to reflect signed out state
      if (window.UserViewModel) {
        window.UserViewModel.update(null);
      }
      
      console.log('🧹 User data cleared');
    },

    // Firestore settings helpers
    settingsDoc(uid) {
      if (!firebase.firestore) {
        throw new Error(t('firestore_not_available'));
      }
      return firebase.firestore().doc(`users/${uid}/meta/settings`);
    },
    
    async readSettings(uid) {
      try {
        console.log('🔥 Reading from Firestore:', { uid });
        const snap = await this.settingsDoc(uid).get();
        const data = snap.exists ? snap.data() : {};
        console.log('✅ Firestore read successful:', data);
        return data;
      } catch (error) {
        console.error('❌ Firestore read failed:', error);
        return {};
      }
    },
    
    async writeSettings(uid, data) {
      try {
        console.log('🔥 Writing to Firestore:', { uid, data });
        await this.settingsDoc(uid).set(data, { merge: true });
        console.log('✅ Firestore write successful');
      } catch (error) {
        console.error('❌ Firestore write failed:', error);
        throw error;
      }
    },

    // Migration to clean up legacy fields
    async migrateLegacyNameFields(uid) {
      const s = await this.readSettings(uid);
      if (s && s.displayName && !s.username) {
        await this.writeSettings(uid, { username: s.displayName });
      }
      // Optional: remove displayName field
      try { 
        await this.settingsDoc(uid).update({ displayName: firebase.firestore.FieldValue.delete() }); 
      } catch (e) {
        console.log(t('no_displayname_field') + ':', e.message);
      }
    },

    clearExistingUsernameModals() {
      // Clear any existing username prompt modals
      const existingModals = document.querySelectorAll('.modal-backdrop[data-modal="username-prompt-modal"]');
      existingModals.forEach(modal => {
        console.log('🧹 Clearing existing username prompt modal');
        modal.remove();
      });
    },

    async promptForUsernameOnce(suggest='') {
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
        const body = this.openModal(t('what_should_we_call_you'), `
          <div style="min-width:280px">
            <label for="usernameInput" style="font-weight:600">${t('your_handle')}</label>
            <input id="usernameInput" type="text" autocomplete="nickname" value="${suggest.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]))}" style="display:block;width:100%;padding:10px;border:1px solid var(--color-border);border-radius:8px;margin-top:8px">
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
              <button id="uCancel" class="btn secondary" type="button" style="pointer-events: auto !important;">Skip</button>
              <button id="uSave" class="btn primary" type="button" style="pointer-events: auto !important;">Save</button>
            </div>
          </div>
        `, 'username-modal');

        // tag so it's distinct from login modal
        const wrap = document.querySelector('.modal-backdrop[data-testid="username-modal"]');
        if (wrap) wrap.setAttribute('data-modal','username');

        let isDone = false;
        const done = (v) => { 
          if (isDone) {
            console.log('🔧 Username modal already closed, ignoring duplicate call');
            return;
          }
          isDone = true;
          console.log('🔧 Username modal closing with value:', v);
          document.querySelectorAll('.modal-backdrop[data-modal="username"]').forEach(n=>n.remove()); 
          this._usernameModalPromise = null; // Clear the promise
          resolve(v); 
        };

        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          const input  = document.getElementById('usernameInput');
          const save   = document.getElementById('uSave');
          const cancel = document.getElementById('uCancel');
          
          console.log('🔧 Setting up username modal buttons:', { input: !!input, save: !!save, cancel: !!cancel });
          
          if (cancel) {
            cancel.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔧 Cancel button clicked');
              done(null);
            });
          }
          
          if (save) {
            // Remove any existing listeners to prevent duplicates
            save.removeEventListener('click', save._clickHandler);
            save._clickHandler = (e) => {
              e.preventDefault();
              e.stopPropagation();
              const value = input?.value || '';
              console.log('🔧 Save button clicked with value:', value);
              console.log('🔧 Save button event details:', { 
                target: e.target, 
                currentTarget: e.currentTarget,
                button: save,
                input: input,
                inputValue: input?.value
              });
              done(value.trim());
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
                done(value.trim());
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
          email 
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
        `${username}, your couch has a permanent dent`
      ];
      return snarks[Math.floor(Math.random() * snarks.length)];
    },

    openModal(title, html, testId = "generic-modal") {
      console.log('🔧 openModal called:', { title, testId });
      
      // Guard against modal stacking
      if (testId === 'auth-modal' && document.querySelector('.modal-backdrop[data-modal="login"]')) {
        console.log('⚠️ Auth modal already exists, not creating another');
        return null;
      }
      
      const wrap = document.createElement("div");
      wrap.className = "modal-backdrop";
      wrap.setAttribute("data-testid", "modal-backdrop");
      if (testId === 'auth-modal') {
        wrap.setAttribute("data-modal", "login");
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
          ${showDefaultClose ? `
          <div class="modal-actions" data-modal-actions style="pointer-events: auto !important;">
            <button class="btn secondary" data-testid="modal-close" type="button" style="width: 120px !important; flex: 0 0 120px !important; font-size: 14px !important; padding: 12px 18px !important; height: 44px !important; min-height: 44px !important; pointer-events: auto !important;">Close</button>
          </div>
          ` : ''}
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

    async runMigration() {
      if (!this.currentUser) {
        return;
      }

      try {
        console.log('🔄 Running Firebase document migration...');
        const db = firebase.firestore();
        const ref = db.collection('users').doc(this.currentUser.uid);
        
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
      if (!this.currentUser) {
        return;
      }

      try {
        console.log('🧹 Running cleanup for stray field...');
        const db = firebase.firestore();
        const ref = db.collection('users').doc(this.currentUser.uid);
        
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
      // Update tab counts
      if (typeof updateTabCounts === 'function') {
        updateTabCounts();
      }
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
     * Process: Tab Navigation with Search Clearing
     * Purpose: Switches the active tab and clears any active search to show normal tab content
     * Data Source: this.currentTab tracks current state, DOM elements control visibility
     * Update Path: Modify tab IDs in the 'ids' array, update clearSearch logic if search behavior changes
     * Dependencies: clearSearch function, tab button elements, section elements, loadListContent function
     */
    switchToTab(tab) {
      console.log(`🔄 Switching to tab: ${tab}`);
      this.currentTab = tab;
      
      // Dispatch custom event for other scripts to listen to
      document.dispatchEvent(new CustomEvent('tabSwitched', { 
        detail: { tab: tab, previousTab: this.previousTab } 
      }));
      this.previousTab = tab;
      
      // Clear search when switching tabs (except when staying on home)
      if (this.isSearching && tab !== 'home') {
        console.log('🧹 Clearing search due to tab switch to:', tab);
        if (typeof window.clearSearch === 'function') {
          window.clearSearch();
        }
      }

      // Tab button classes - hide current tab, show others evenly spaced
      // BUT: During search, show all tabs for navigation
      const ids = ['home','watching','wishlist','watched','discover','settings'];
      ids.forEach(name => {
        const btn = document.getElementById(`${name}Tab`);
        if (btn) {
          if (this.isSearching) {
            // During search, show all tabs for navigation
            btn.classList.remove('hidden');
            btn.classList.remove('active');
            console.log(`🔍 Search mode - showing tab: ${name}Tab`);
          } else if (name === tab) {
            // Hide the current tab (normal mode)
            btn.classList.add('hidden');
            btn.classList.remove('active');
            console.log(`✅ ${name}Tab hidden: true (current tab)`);
          } else {
            // Show other tabs (normal mode)
            btn.classList.remove('hidden');
            btn.classList.remove('active');
            console.log(`✅ ${name}Tab hidden: false, active: false`);
          }
        }
      });

      // Sections use .tab-section + .active
      ids.forEach(name => {
        const section = document.getElementById(`${name}Section`);
        if (section) {
          section.classList.toggle('active', name === tab);
          // keep inline display off; class controls visibility
          section.style.display = '';
          console.log(`✅ ${name}Section active: ${name === tab}`);
        } else {
          console.error(`❌ Section not found: ${name}Section`);
        }
      });

      // Hide/show home-specific sections using unified visibility management
      if (window.VisibilityManager) {
        const results = window.VisibilityManager.manageHomeSections(
          tab === 'home', 
          `tab-switch-${tab}`
        );
        
        results.forEach(result => {
          if (result.success) {
            FlickletDebug.info(`✅ ${result.sectionId} visibility: ${tab === 'home' ? 'visible' : 'hidden'}`);
          } else {
            FlickletDebug.warn(`⚠️ Failed to update visibility for: ${result.sectionId}`);
          }
        });
      } else {
        // Fallback to original method if VisibilityManager not available
        const homeSections = window.HomeSectionsConfig.getSections('tab-switch');
        const sectionElements = window.HomeSectionsConfig.getSectionElements('tab-switch');
        
        homeSections.forEach(sectionId => {
          const section = sectionElements[sectionId];
          if (section) {
            section.style.display = tab === 'home' ? 'block' : 'none';
            FlickletDebug.info(`✅ ${sectionId} visibility: ${tab === 'home' ? 'visible' : 'hidden'}`);
          } else {
            FlickletDebug.warn(`⚠️ Home section not found: ${sectionId}`);
          }
        });
      }

      // Hide/show search bar based on tab
      const searchContainer = document.querySelector('.top-search');
      if (searchContainer) {
        if (tab === 'settings') {
          searchContainer.style.display = 'none';
          console.log('🔍 Search bar hidden for settings tab');
        } else {
          searchContainer.style.display = '';
          console.log('🔍 Search bar shown for', tab, 'tab');
        }
      }

      // Render content for this tab
      this.updateUI();
      
      // Load content for this tab
      if (typeof updateTabContent === 'function') {
        updateTabContent(tab);
      }
    },

    // ---------- UX Helpers ----------
    // STEP 3.1 — Delegated tab click handler (one place, works for all tab buttons/links)
    bindTabClicks() {
      // Delegate on document to catch future buttons too
      document.addEventListener('click', (ev) => {
        const el = ev.target.closest('[data-tab]');
        if (!el) return;

        const tab = el.getAttribute('data-tab');
        if (!tab) return;

        // Stop links from navigating and buttons from bubbling into overlays
        ev.preventDefault();
        ev.stopPropagation();

        // Only handle known tabs
        const allowed = ['home','watching','wishlist','watched','discover','search','settings'];
        if (!allowed.includes(tab)) return;

        try {
          if (typeof this.switchToTab === 'function') {
            this.switchToTab(tab);
          } else if (typeof window.switchToTab === 'function') {
            window.switchToTab(tab);
          } else {
            console.warn('No switchToTab available; cannot switch to', tab);
          }
        } catch (e) {
          console.error('Tab switch failed:', tab, e);
        }
      }, { capture: true }); // capture reduces interference from other handlers
    },

    setupEventListeners() {
      // STEP 3.1 — Delegated tab click handler (one place, works for all tab buttons/links)
      this.bindTabClicks();

      // Tab clicks (id-based) - keeping for backward compatibility
      const bind = (id, fn) => {
        const el = document.getElementById(id);
        if (el) {
          console.log(`🔧 Binding ${id}`);
          el.addEventListener('click', fn);
        } else {
          console.warn(`🔧 Element ${id} not found`);
        }
      };

      bind('homeTab',     () => this.switchToTab('home'));
      bind('watchingTab', () => this.switchToTab('watching'));
      bind('wishlistTab', () => this.switchToTab('wishlist'));
      bind('watchedTab',  () => this.switchToTab('watched'));
      bind('discoverTab', () => this.switchToTab('discover'));
      bind('settingsTab', () => this.switchToTab('settings'));

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

      // Delegated actions for dynamic content
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;

        // Route actions
        switch (action) {
          case 'addFromCache':
            addToListFromCache?.(Number(btn.dataset.id), btn.dataset.list);
            break;
          case 'move':
            moveItem?.(Number(btn.dataset.id), btn.dataset.list);
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
            // Handled by auth.js - do nothing here
            break;
          case 'share-lists':
            // Handled by inline-script-01.js - do nothing here
            break;
          case 'username-skip':
            // Username modal skip
            e.preventDefault();
            e.stopPropagation();
            console.log('[data-action] username-skip clicked');
            // Find the username modal and trigger skip
            const usernameModal = document.getElementById('username-modal');
            if (usernameModal) {
              // Find the parent wrapper (the div that was created in promptForUsername)
              const wrapper = usernameModal.parentElement;
              if (wrapper && wrapper._usernameDone) {
                console.log('[data-action] calling _usernameDone(null)');
                wrapper._usernameDone(null);
              } else {
                console.warn('[data-action] wrapper or _usernameDone not found');
              }
            } else {
              console.warn('[data-action] username modal not found');
            }
            break;
          case 'username-save':
            // Username modal save
            e.preventDefault();
            e.stopPropagation();
            console.log('[data-action] username-save clicked');
            // Find the username modal and trigger save
            const usernameModal2 = document.getElementById('username-modal');
            if (usernameModal2) {
              const input = document.getElementById('username-input');
              const value = input ? input.value.trim() : '';
              console.log('[data-action] input value:', value);
              // Find the parent wrapper (the div that was created in promptForUsername)
              const wrapper = usernameModal2.parentElement;
              if (wrapper && wrapper._usernameDone) {
                console.log('[data-action] calling _usernameDone with value:', value);
                wrapper._usernameDone(value || null);
              } else {
                console.warn('[data-action] wrapper or _usernameDone not found');
              }
            } else {
              console.warn('[data-action] username modal not found');
            }
            break;
          default:
            console.warn(t('unknown_data_action') + ':', action);
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

      // Account button - ensure only one event listener
      const accountBtn = document.getElementById('accountBtn');
      if (accountBtn) {
        // Remove any existing event listeners to prevent conflicts
        const newAccountBtn = accountBtn.cloneNode(true);
        accountBtn.parentNode.replaceChild(newAccountBtn, accountBtn);
        
        newAccountBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentUser = this.currentUser || window.currentUser;
          console.log('🔐 Account button clicked, currentUser:', currentUser);
          
          if (currentUser) {
            // User is signed in, show sign out modal
            console.log('👤 User signed in, showing sign out modal');
            if (typeof this.showSignOutModal === 'function') {
              this.showSignOutModal();
            } else {
              console.error('❌ showSignOutModal function not available');
            }
          } else if (this.firebaseInitialized) {
            // User is not signed in, show sign in modal
            console.log('🔑 User not signed in, showing sign in modal');
            // Use FlickletAuth system for sign-in
            if (window.FlickletAuth && typeof window.FlickletAuth.loginWithGoogle === 'function') {
              this.showSignInModal();
            } else {
              console.error('❌ FlickletAuth not available, retrying in 500ms...');
              // Retry after a short delay in case auth.js is still loading
              setTimeout(() => {
                if (window.FlickletAuth && typeof window.FlickletAuth.loginWithGoogle === 'function') {
                  console.log('✅ FlickletAuth now available, showing sign in modal');
                  this.showSignInModal();
                } else {
                  console.error('❌ FlickletAuth still not available after retry');
                  // Fallback: show a simple error message
                  this.showNotification(t('auth_system_loading'), 'error');
                }
              }, 500);
            }
          } else {
            // Firebase not available, show offline mode message
            console.log('🔒 Firebase not available, showing offline mode message');
            this.showNotification('Authentication is currently unavailable. Your data is stored locally and will sync when Firebase is available.', 'info');
          }
        });
        console.log('✅ Account button event listener set up (conflict-free)');
      } else {
        console.warn('⚠️ Account button not found');
      }
    },

    // Account management
    showSignInModal() {
      console.log('🔐 showSignInModal called - using FlickletAuth');
      
      // Check if offline mode is active
      if (!this.firebaseInitialized) {
        console.log('🔒 Offline mode active, not showing sign-in modal');
        this.showNotification('Authentication is currently unavailable. Your data is stored locally and will sync when Firebase is available.', 'info');
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
          "auth-modal"
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
              if (typeof window.emailLogin === 'function') {
                window.emailLogin();
              } else {
                console.error('❌ emailLogin function not available');
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
      
      const confirmed = confirm(`${t('sign_out_confirmation')} ${displayName}?\n\n${t('email_label')}: ${email}`);
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
        firebase.auth().signOut().then(() => {
          console.log('✅ User signed out successfully');
          showNotification?.(t('signed_out_successfully'), 'success');
        }).catch((error) => {
          console.error('❌ Sign out failed:', error);
          showNotification?.(t('sign_out_failed'), 'error');
        });
      } else {
        console.error('❌ Firebase auth not available for sign out');
      }
    },

    // Optional feature hooks (no-ops here, but left for compatibility)
    initializeFlickWord() {},
    // checkAndPromptLogin() removed - handled in auth listener
    
    /**
     * Process: Search Functionality Initialization
     * Purpose: Binds search and clear search buttons to their respective functions for user interaction
     * Data Source: DOM elements (searchBtn, clearSearchBtn), global window.performSearch and window.clearSearch functions
     * Update Path: Modify button IDs here if HTML changes, update function calls if search behavior changes
     * Dependencies: performSearch function, clearSearch function, search button elements, search input elements
     */
    initializeSearch() {
      console.log('🔍 Initializing search functionality...');
      
      // Set up search controls
      const searchBtn = document.getElementById("searchBtn");
      const clearSearchBtn = document.getElementById("clearSearchBtn");
      
      if (searchBtn) {
        console.log('✅ Search button found, binding performSearch');
        searchBtn.onclick = () => {
          console.log('🔍 Search button clicked, calling performSearch');
          if (typeof window.performSearch === 'function') {
            window.performSearch();
          } else {
            console.error('❌ performSearch function not available');
          }
        };
      } else {
        console.log('❌ Search button not found');
      }
      
      if (clearSearchBtn) {
        console.log('✅ Clear search button found, binding clearSearch');
        clearSearchBtn.onclick = () => {
          console.log('🔍 Clear search button clicked, calling clearSearch');
          if (typeof window.clearSearch === 'function') {
            window.clearSearch();
          } else {
            console.error('❌ clearSearch function not available');
          }
        };
      } else {
        console.log('❌ Clear search button not found');
      }
      
      // Set up Enter key functionality
      this.setupSearchEnterKey();
      
      console.log('✅ Search functionality initialized');
    },

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

    // STEP 3.5 — Make Enter in search box trigger the search
    setupSearchEnterKey() {
      const searchInput = document.getElementById('search');
      const searchBtn = document.getElementById('searchBtn');
      if (searchInput && searchBtn) {
        searchInput.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            ev.stopPropagation();
            console.log('🔎 Enter pressed in search box — running search');
            searchBtn.click(); // triggers the same onclick handler
          }
        });
      }
    },

    // Ensure performSearch is available on window for robust bindings
    ensureSearchFunctionsAvailable() {
      // Make performSearch available on window if it exists
      if (typeof window.performSearch === 'function') {
        window.performSearch = window.performSearch;
        console.log('✅ performSearch already available on window');
      } else {
        // Create a basic performSearch function if it doesn't exist
        window.performSearch = function() {
          console.log('🔍 performSearch called');
          const searchInput = document.getElementById('search');
          if (searchInput && searchInput.value.trim()) {
            console.log('Searching for:', searchInput.value.trim());
            // Basic search functionality - can be enhanced later
            alert('Search functionality: ' + searchInput.value.trim());
          } else {
            console.log('No search term entered');
          }
        };
        console.log('✅ performSearch function created and available on window');
      }

      // Create a basic clearSearch function if it doesn't exist
      if (typeof window.clearSearch !== 'function') {
        window.clearSearch = function() {
          console.log('🧹 clearSearch called');
          const searchInput = document.getElementById('search');
          if (searchInput) {
            searchInput.value = '';
            console.log('Search input cleared');
          }
        };
        console.log('✅ clearSearch function created and available on window');
      }

      // Defensive handlers specifically for #desktop-search-row
      (function () {
        const row = document.getElementById('desktop-search-row');
        if (!row) return;

        const input = row.querySelector('#search');
        const searchBtn = row.querySelector('#searchBtn');
        const clearBtn = row.querySelector('#clearSearchBtn');
        const genre = row.querySelector('#genreSelect');

        if (searchBtn) {
          searchBtn.onclick = () => {
            if (typeof window.performSearch === 'function') window.performSearch();
            else console.warn('[desktop-search-row] performSearch not available');
          };
        }

        if (input) {
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && typeof window.performSearch === 'function') {
              window.performSearch();
            }
          });
        }

        if (clearBtn && input) {
          clearBtn.onclick = () => {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          };
        }

        // Optional: ensure genre select doesn't force wrapping
        if (genre) genre.style.maxWidth = genre.style.maxWidth || 'unset';
      })();

      // Defensive binding for search button
      const searchBtn = document.getElementById('searchBtn') || document.querySelector('[data-action="search"]');
      if (searchBtn) {
        searchBtn.onclick = () => {
          if (typeof window.performSearch === 'function') {
            window.performSearch();
          } else {
            console.warn('performSearch not available');
          }
        };
      }

      // Enter-to-search (if you support it)
      const searchInput = document.getElementById('search') || document.querySelector('input[type="search"]');
      if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            if (typeof window.performSearch === 'function') {
              window.performSearch();
            } else {
              console.warn('performSearch not available');
            }
          }
        });
      }
    },

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
          email: this.currentUser?.email
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
        firebaseInitialized: this.firebaseInitialized
      });
    },
    
    // Language change function - delegates to centralized LanguageManager
    changeLanguage(newLang) {
      console.log('🌐 FlickletApp.changeLanguage delegating to LanguageManager:', newLang);
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
        FlickletDebug.info('💾 FlickletApp.saveData: Starting data save to Firebase');
        FlickletDebug.info('💾 FlickletApp.saveData: currentUser status:', { 
          hasCurrentUser: !!this.currentUser, 
          currentUserUid: this.currentUser?.uid,
          firebaseAuth: !!firebase?.auth,
          authState: firebase?.auth?.currentUser?.uid 
        });
        
        // Ensure we have a current user - try to get from Firebase auth if not set
        if (!this.currentUser && firebase?.auth?.currentUser) {
          FlickletDebug.info('💾 No this.currentUser, but Firebase auth has user, updating...');
          this.currentUser = firebase.auth.currentUser;
          window.currentUser = this.currentUser;
        }
        
        if (!this.currentUser) {
          FlickletDebug.warn('💾 No current user, saving to localStorage only');
          localStorage.setItem("flicklet-data", JSON.stringify(window.appData));
          return;
        }

        // Get Firebase services
        console.log('🔥 Getting Firebase Firestore instance...');
        const db = firebase.firestore();
        console.log('✅ Firebase Firestore instance obtained');
        
        // Prepare data payload with undefined value filtering
        const cleanData = (obj) => {
          if (obj === null || obj === undefined) return null;
          if (Array.isArray(obj)) {
            return obj.map(cleanData).filter(item => item !== null && item !== undefined);
          }
          if (typeof obj === 'object') {
            const cleaned = {};
            for (const [key, value] of Object.entries(obj)) {
              if (value !== undefined) {
                cleaned[key] = cleanData(value);
              }
            }
            return cleaned;
          }
          return obj;
        };

        const payload = {
          watchlists: { 
            tv: cleanData(window.appData.tv) || { watching: [], wishlist: [], watched: [] },
            movies: cleanData(window.appData.movies) || { watching: [], wishlist: [], watched: [] }
          },
          settings: cleanData(window.appData.settings) || {},
          pro: !!window.appData.settings?.pro,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // Debug: Log the payload structure to identify any remaining undefined values
        FlickletDebug.info('💾 Payload structure before Firebase save:', {
          watchlists: {
            tv: payload.watchlists.tv,
            movies: payload.watchlists.movies
          },
          settings: payload.settings,
          pro: payload.pro
        });

        // Save to Firebase
        await db.collection("users").doc(this.currentUser.uid).set(payload, { merge: true });
        
        // Also save to localStorage as backup
        localStorage.setItem("flicklet-data", JSON.stringify(window.appData));
        
        FlickletDebug.info('✅ FlickletApp.saveData: Data saved successfully to Firebase and localStorage');
        
      } catch (error) {
        FlickletDebug.error('❌ FlickletApp.saveData failed:', error);
        
        // Fallback to localStorage only
        try {
          localStorage.setItem("flicklet-data", JSON.stringify(window.appData));
          FlickletDebug.info('💾 Fallback: Data saved to localStorage only');
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
     * Data Source: DOM query for .tab-section.active and FAB elements
     * Update Path: Automatically triggered on tab switches
     * Dependencies: CSS .fab-dock class, tab switching system
     */
    dockFABsToActiveTab() {
      const FAB_SELECTORS = '.fab, .fab-left'; // include all FAB variants
      const ACTIVE_PANEL_SELECTOR = '.tab-section.active';

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
        console.log('🔧 FAB Docking: Starting moveFABsToDock');
        const panel = getActivePanel();
        console.log('🔧 FAB Docking: Active panel:', panel);
        if (!panel) return;
        const dock = ensureDock(panel);
        console.log('🔧 FAB Docking: Dock created/found:', dock);
        if (!dock) return;

        // Move settings FAB (fab-left) to left side
        const settingsFab = document.querySelector('.fab-left');
        console.log('🔧 FAB Docking: Settings FAB found:', settingsFab);
        if (settingsFab && !dock.contains(settingsFab)) {
          settingsFab.style.display = ''; // Show the FAB
          dock.appendChild(settingsFab);
          console.log('🔧 FAB Docking: Settings FAB moved to dock');
        }

        // Move fab-stack (theme buttons) to right side
        const fabStack = document.querySelector('.fab-stack');
        console.log('🔧 FAB Docking: Fab stack found:', fabStack);
        if (fabStack && !dock.contains(fabStack)) {
          fabStack.style.display = 'flex'; // Show the stack
          dock.appendChild(fabStack);
          console.log('🔧 FAB Docking: Fab stack moved to dock');
        }

        // Move any individual FABs that aren't in a stack
        const individualFabs = Array.from(document.querySelectorAll('.fab'))
          .filter(btn => !btn.closest('.fab-stack') && !dock.contains(btn));
        
        if (individualFabs.length > 0) {
          // Create a stack for individual FABs if it doesn't exist
          let individualStack = dock.querySelector('.individual-fab-stack');
          if (!individualStack) {
            individualStack = document.createElement('div');
            individualStack.className = 'fab-stack individual-fab-stack';
            dock.appendChild(individualStack);
          }
          
          individualFabs.forEach(btn => individualStack.appendChild(btn));
        }
        
        console.log('🔧 FAB Docking: Dock contents after move:', dock.innerHTML);
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
  };

  // Expose singleton
  window.FlickletApp = App;
  
  // Also expose as instance for compatibility
  window.FlickletAppInstance = App;
  
  // Expose UserViewModel globally for verification
  window.UserViewModel = UserViewModel;
})();
