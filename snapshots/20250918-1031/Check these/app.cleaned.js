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

        // 3) Bind global UI listeners
        this.setupEventListeners();

        // 4) Ensure a default active tab and initial render
        this.switchToTab('home');
        this.updateUI();

        // 5) Initialize external integrations (safe stubs if missing)
        this.initFirebase();

        // 6) Optional: feature blocks that rely on DOM (after first paint)
        setTimeout(() => {
          this.initializeFlickWord?.();
          this.checkAndPromptLogin?.();
        }, 150);

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
    initFirebase() {
      if (typeof initializeFirebase === 'function') {
        try {
          initializeFirebase();
        } catch (e) {
          console.warn('Firebase init failed (continuing):', e);
        }
      } else {
        // harmless stub to prevent runtime breaks
        window.initializeFirebase = () => {};
      }
    },

    // ---------- UI Lifecycle ----------
    updateUI() {
      // Update tab counts
      if (typeof updateTabCounts === 'function') {
        updateTabCounts();
      }
      // Render active tab content
      const active = this.currentTab || 'home';
      if (typeof updateTabContent === 'function') {
        updateTabContent(active);
      }
    },

    switchToTab(tab) {
      this.currentTab = tab;

      // Tab button classes
      const ids = ['home','watching','wishlist','watched','discover','settings'];
      ids.forEach(name => {
        const btn = document.getElementById(`${name}Tab`);
        if (btn) btn.classList.toggle('active', name === tab);
      });

      // Sections use .tab-section + .active
      ids.forEach(name => {
        const section = document.getElementById(`${name}Section`);
        if (section) {
          section.classList.toggle('active', name === tab);
          // keep inline display off; class controls visibility
          section.style.display = '';
        }
      });

      // Render content for this tab
      this.updateUI();
    },

    // ---------- UX Helpers ----------
    setupEventListeners() {
      // Tab clicks (id-based)
      const bind = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
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
          default:
            console.warn('Unknown data-action:', action);
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
    },

    // Optional feature hooks (no-ops here, but left for compatibility)
    initializeFlickWord() {},
    checkAndPromptLogin() {}
  };

  // Expose singleton
  window.FlickletApp = App;
})();
