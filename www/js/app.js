/* ============== Flicklet App (Cleaned Core) ==============
   Single source of truth for initialization & lifecycle.
   This build removes duplicate init paths and normalizes tab/UI/render behavior.
*/

(function () {
  const App = {
    // Runtime state (references the global appData defined in utils.cleaned.js)
    currentUser: null,
    currentTab: 'home',
    genresLoaded: false,
    authInitialized: false,
    firebaseInitialized: false,

    init() {
      console.log('🚀 [FlickletApp] init');
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

        // 4) Bind global UI listeners
        this.setupEventListeners();

        // 5) Ensure a default active tab and initial render
        this.switchToTab('home');
        this.updateUI();

        // Auth listener handled in initFirebase()

        // 6) Optional: feature blocks that rely on DOM (after first paint)
        setTimeout(() => {
          this.initializeFlickWord?.();
          // checkAndPromptLogin removed - handled in auth listener
        }, 150);

        // Initialize search functionality
        this.initializeSearch();

        console.log('✅ [FlickletApp] ready');
      } catch (e) {
        console.error('💥 [FlickletApp] init failed:', e);
      }
    },

    // ---------- Visual / Theme ----------
    applyTheme() {
      const local = localStorage.getItem('flicklet-theme');
      const chosen = local || (appData?.settings?.theme || 'light');
      document.body.classList.toggle('dark-mode', chosen === 'dark');
      // keep both in sync
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
        console.warn('i18n not available yet, continuing.');
      }
    },

    // ---------- Integrations ----------
    // Old initFirebase removed - using new unified system below

    // setupAuthListener() removed - auth handled in initFirebase()

    initFirebase() {
      // Prevent multiple initializations
      if (this.firebaseInitialized) {
        console.log('⚠️ Firebase already initialized, skipping');
        return;
      }
      
      console.log('🔥 Initializing Firebase...');
      this.firebaseInitialized = true;
      
      // Clear any existing username prompt modals
      this.clearExistingUsernameModals();
      
      // Wait for Firebase ready event with timeout
      this.waitForFirebaseReady()
        .then(() => {
          console.log('✅ Firebase available, setting up auth listener');
          this.setupAuthListener();
        })
        .catch(() => {
          console.error('❌ Firebase initialization timeout after 8 seconds');
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
      console.log('🔄 Setting up fallback authentication system');
      this.currentUser = null;
      this.firebaseInitialized = false;
      
      // Update account button to show fallback message
      const accountBtn = document.getElementById('accountBtn');
      if (accountBtn) {
        accountBtn.textContent = '🔒 Offline Mode';
        accountBtn.title = 'Authentication unavailable - working in offline mode';
      }
      
      // Show a notification about offline mode
      this.showNotification('Working in offline mode - data will be stored locally only', 'info');
    },

    setupAuthListener() {
      try {
        firebase.auth().onAuthStateChanged(async (user) => {
          console.log('👤 Firebase auth state changed:', user ? `User: ${user.email}` : 'No user');
          this.currentUser = user;
          // Also update the global currentUser for compatibility with existing code
          if (typeof window !== 'undefined') {
            window.currentUser = user;
          }
          
          // Only process auth changes if this is a new sign-in, not page load
          if (!this.authInitialized) {
            console.log('🔧 Auth listener initialized, checking current state');
            this.authInitialized = true;
            
            if (user) {
              console.log('🔍 User already signed in on page load, updating UI silently');
              this.setAccountButtonLabel(user.displayName || user.email.split('@')[0] || 'User');
            } else {
              this.setAccountButtonLabel('Sign In');
              this.setLeftSnark('');
            }
            // Don't return early - continue to username check logic below
          }
          
          if (!user) {
            this.setAccountButtonLabel('Sign In');
            this.setLeftSnark('');
            return;
          }

          // Handle both page load and new sign-ins
          if (this.authInitialized) {
            console.log('✅ User signed in, updating UI');
            this.showNotification(t('signed_in_successfully'), 'success');

            // 1) Close ALL auth modals here (you already tag data-modal="login")
            document.querySelectorAll('.modal-backdrop[data-modal="login"]').forEach(n => n.remove());
            window.__currentAuthModal = null;
          }

          // 2) BUTTON LABEL = Firebase displayName (fallback email prefix)
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

          // 3) WELCOME/SNARK = Firestore settings.username (prompt once if missing)
          try {
            const settings = await this.readSettings(user.uid);
            let username = (settings.username || '').trim();

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

            // 3. Update left snark AFTER username is set
            this.setLeftSnark(username ? this.makeSnark(username) : '');

            // Run migration once per user
            await this.runMigration();
            
            // Run cleanup for stray field
            await this.cleanupStrayField();
            
            // Migrate legacy name fields
            await this.migrateLegacyNameFields(user.uid);
            
            // Load user data from Firebase
            if (typeof loadUserDataFromCloud === 'function') {
              console.log('🔄 Loading user data from Firebase...');
              await loadUserDataFromCloud(user.uid);
              console.log('✅ User data loaded from Firebase');
              
              // Refresh the UI after data is loaded
              if (typeof updateUI === 'function') {
                console.log('🔄 Refreshing UI after data load');
                updateUI();
              }
              
              // Refresh the current tab content
              setTimeout(() => {
                if (typeof switchToTab === 'function') {
                  console.log('🔄 Refreshing current tab after data load');
                  switchToTab(this.currentTab);
                }
              }, 200);
            }
          } catch (error) {
            console.error('❌ Error in auth state change handler:', error);
            this.showNotification(t('error_loading_user_data'), 'error');
          }
        });
      } catch (error) {
        console.error('❌ Error setting up auth listener:', error);
        this.showNotification(t('auth_system_error'), 'error');
      }
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
      
      // Clear search when switching tabs (only if search is active)
      const searchResults = document.getElementById('searchResults');
      if (searchResults && searchResults.style.display !== 'none' && typeof window.clearSearch === 'function') {
        console.log('🧹 Clearing search due to tab switch');
        window.clearSearch();
      }

      // Tab button classes - show all tabs, mark current as active
      const ids = ['home','watching','wishlist','watched','discover','settings'];
      ids.forEach(name => {
        const btn = document.getElementById(`${name}Tab`);
        if (btn) {
          // Show all tabs (remove hidden class)
          btn.classList.remove('hidden');
          // Mark current tab as active, remove active from others
          btn.classList.toggle('active', name === tab);
          console.log(`✅ ${name}Tab hidden: false, active: ${name === tab}`);
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

      // Hide/show home-specific sections (curated, trivia, spotlight, series, flickword)
      const homeSections = [
        'curatedSections',
        'triviaTile', 
        'videoSpotlight',
        'seriesOrg',
        'quote-flickword-container',
        'quoteCard',
        'randomQuoteCard',
        'flickwordCard',
        'bingeBanner'
      ];
      
      homeSections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.style.display = tab === 'home' ? 'block' : 'none';
          console.log(`✅ ${sectionId} visibility: ${tab === 'home' ? 'visible' : 'hidden'}`);
        } else {
          console.warn(`⚠️ Home section not found: ${sectionId}`);
        }
      });

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
        const allowed = ['home','watching','wishlist','watched','discover','settings'];
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
            document.getElementById('searchInput')?.focus();
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
          default:
            console.warn(t('unknown_data_action') + ':', action);
        }
      });

      // Theme toggle
      document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);

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
          console.log('🔐 Account button clicked, currentUser:', this.currentUser);
          
          if (this.currentUser) {
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
      
      console.log('✅ Search functionality initialized');
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
  };

  // Expose singleton
  window.FlickletApp = App;
  
  // Also expose as instance for compatibility
  window.FlickletAppInstance = App;
})();
