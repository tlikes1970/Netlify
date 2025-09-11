
      // Helper function for binding events
      function bind(id, fn) {
        const el = document.getElementById(id);
        if (el) {
          el.onclick = fn;
          return true;
        }
        return false;
      }

      // Utility for safe deep-merge of settings to prevent displayName overwrites
      const safeMergeSettings = (existing = {}, incoming = {}) => {
        const merged = { ...existing, ...incoming };
        
        // STRICT: Never write empty strings to displayName
        if (!incoming.displayName || !incoming.displayName.trim()) {
          // If incoming is empty, preserve existing or delete the field entirely
          if (typeof existing.displayName === 'string' && existing.displayName.trim()) {
            merged.displayName = existing.displayName;
          } else {
            // Remove the field entirely to avoid writing empty strings
            delete merged.displayName;
          }
        } else {
          // Only write if incoming has a valid non-empty value
          merged.displayName = incoming.displayName.trim();
        }
        
        // Additional safety: if somehow we still have an empty string, remove it
        if (merged.displayName === '') {
          delete merged.displayName;
        }
        
        return merged;
      };

      window.FlickletApp = {
        // Centralized state
        currentUser: null,
        currentTab: 'home',
        // Cache for account button to avoid redundant reads and race conditions
        _lastAccountBtnUid: null,
        _lastAccountBtnDoc: null,
        // Migration flag to ensure it only runs once per session
        _migrationCompleted: false,
        appData: {
          settings: {
            displayName: '',
            lang: 'en',
            theme: 'light',
            pro: false,
            notif: {}
          },
          lists: {
            watching: [],
            watched: [],
            wishlist: []
          },
          searchCache: [],
          activeTagFilters: new Set()
        },

        // Core methods
        init() {
          console.log('🚀 Initializing Flicklet App...');
          
          // Wait for DOM to be fully ready
          setTimeout(() => {
            console.log('⏰ DOM ready timeout completed, setting up app...');
            this.loadData();
            this.applyTheme();
            this.applyLanguage();
            this.applyMardiGras(); // Apply Mardi Gras state
            this.initFirebase();
            console.log('🔧 About to call setupEventListeners...');
            this.setupEventListeners();
            this.updateUI();
            
            // Call existing initialization functions for compatibility
            if (typeof loadAppData === 'function') {
              console.log('🔄 Calling existing loadAppData');
              loadAppData();
            }
            if (typeof updateUI === 'function') {
              console.log('🔄 Calling existing updateUI');
              updateUI();
            }
            if (typeof switchToTab === 'function') {
              console.log('🔄 Calling existing switchToTab');
              switchToTab('home');
            }
            
            // Ensure tab visibility is properly set after initialization
            setTimeout(() => {
              this.updateTabVisibility();
            }, 100);
            
            // Call start function to initialize ensureBlocks
            if (typeof start === 'function') {
              console.log('🔄 Calling existing start function');
              start();
            }
            
            // Run global initialization after centralized system is ready
            setTimeout(() => {
              console.log('🌍 Running global initialization after centralized system...');
              this.runGlobalInitialization();
            }, 500);
            
            console.log('✅ App initialized successfully');
            
                    // Initialize the left-side username display if username exists
        if (this.appData?.settings?.displayName) {
          console.log('🆕 Initializing left-side username display');
          this.updateLeftSideUsername();
        }

        // Initialize FlickWord integration
        this.initializeFlickWord();
        
        // Show welcome message for new users
        this.showWelcomeMessage();
            
            // Check if user should be prompted to login AFTER all functions are loaded
            setTimeout(() => {
              this.checkAndPromptLogin();
            }, 200);
          }, 100);
        },

        checkAndPromptLogin() {
          // Check if this is a new user or if they haven't signed in before
          const hasBeenPrompted = localStorage.getItem('flicklet-login-prompted');
          const hasData = localStorage.getItem('flicklet-data') || localStorage.getItem('tvMovieTrackerData');
          const isAuthenticated = this.currentUser !== null;
          
          console.log('🔍 Checking login prompt conditions:');
          console.log('  - hasBeenPrompted:', hasBeenPrompted);
          console.log('  - hasData:', hasData);
          console.log('  - isAuthenticated:', isAuthenticated);
          console.log('  - currentUser:', this.currentUser);
          console.log('  - showSignInModal available:', typeof showSignInModal === 'function');
          
          // Don't show login prompt if user is already authenticated
          if (isAuthenticated) {
            console.log('✅ User is already authenticated, no login prompt needed');
            return;
          }
          
          // If no login prompt has been shown before and no user data exists, show login modal
          if (!hasBeenPrompted && !hasData) {
            console.log('🆕 New user detected, showing login prompt');
            // Mark that we've prompted them
            localStorage.setItem('flicklet-login-prompted', 'true');
            
            // Wait a moment for the UI to settle, then show the login modal
            setTimeout(() => {
              console.log('⏰ Timeout completed, attempting to show login modal');
              if (typeof showSignInModal === 'function') {
                console.log('✅ showSignInModal function available, calling it');
                showSignInModal();
              } else {
                console.error('❌ showSignInModal function not available');
              }
            }, 1000); // Increased timeout to ensure functions are loaded
          } else if (hasBeenPrompted && !hasData) {
            console.log('👤 User has been prompted before but no data exists');
          } else {
            console.log('✅ User has existing data or has been prompted');
          }
        },

        loadData() {
          try {
            // Try to load from centralized storage first
            const saved = localStorage.getItem('flicklet-data');
            if (saved) {
              this.appData = { ...this.appData, ...JSON.parse(saved) };
              console.log('💾 Data loaded from centralized localStorage');
            } else {
              // Fallback to existing storage format
              const oldSaved = localStorage.getItem('tvMovieTrackerData');
              if (oldSaved) {
                const oldData = JSON.parse(oldSaved);
                // Convert old format to new format - load ALL data, not just settings
                this.appData.tv = oldData.tv || { watching: [], wishlist: [], watched: [] };
                this.appData.movies = oldData.movies || { watching: [], wishlist: [], watched: [] };
                this.appData.settings.displayName = (oldData.settings && oldData.settings.displayName) || '';
                this.appData.settings.lang = (oldData.settings && oldData.settings.lang) || 'en';
                this.appData.settings.theme = (oldData.settings && oldData.settings.theme) || 'light';
                this.appData.settings.pro = (oldData.settings && oldData.settings.pro) || false;
                this.appData.settings.notif = oldData.settings?.notif || { enabled: true, types: { success: true, error: true, info: true } };
                console.log('💾 Data loaded from legacy localStorage including TV/movies data');
              }
            }
          } catch (error) {
            console.error('❌ Failed to load data:', error);
          }
        },

        saveData() {
          try {
            // Save to centralized storage
            localStorage.setItem('flicklet-data', JSON.stringify(this.appData));
            
            // Also save to legacy format for compatibility
            const legacyData = {
              settings: {
                displayName: this.appData.settings.displayName,
                lang: this.appData.settings.lang,
                theme: this.appData.settings.theme,
                pro: this.appData.settings.pro,
                notif: this.appData.settings.notif
              },
              tv: this.appData.tv || { watching: [], wishlist: [], watched: [] },
              movies: this.appData.movies || { watching: [], wishlist: [], watched: [] }
            };
            localStorage.setItem('tvMovieTrackerData', JSON.stringify(legacyData));
            
            // Save to Firebase if user is logged in - using safe merge to prevent displayName overwrites
            if (this.currentUser && typeof firebase !== 'undefined' && firebase.firestore) {
              const db = firebase.firestore();
              const ref = db.collection('users').doc(this.currentUser.uid);

              // Get existing document and safely merge settings
              ref.get().then(async (snap) => {
                const existing = snap.exists ? (snap.data() || {}) : {};
                const existingSettings = existing.settings || {};
                const incomingSettings = (this.appData && this.appData.settings) || {};

                const mergedSettings = safeMergeSettings(existingSettings, incomingSettings);

                const payload = {
                  lastLoginAt: new Date(),
                  // Save watchlists data
                  watchlists: {
                    tv: this.appData.tv || { watching: [], wishlist: [], watched: [] },
                    movies: this.appData.movies || { watching: [], wishlist: [], watched: [] }
                  },
                  // only include settings if it has keys (avoid writing empty maps)
                  ...(Object.keys(mergedSettings).length ? { settings: mergedSettings } : {}),
                  // Preserve root displayName if it exists (for Google login)
                  ...(existing.displayName && { displayName: existing.displayName }),
                  // Preserve the entire profile object to prevent it from being cleared (for Email login)
                  ...(existing.profile && { profile: existing.profile })
                };

                console.log('🔥 Saving to Firebase with safe merge:', payload);
                await ref.set(payload, { merge: true });
                console.log('💾 Data saved to Firebase with safe merge successfully');
              }).catch((error) => {
                console.error('❌ Failed to save to Firebase with safe merge:', error);
              });
            } else {
              console.log('⚠️ Cannot save to Firebase - user not logged in or Firebase not available');
            }
            
            console.log('💾 Data saved to both storage formats');
          } catch (error) {
            console.error('❌ Failed to save data:', error);
            this.showNotification('Failed to save data', 'error');
          }
        },

        runGlobalInitialization() {
          console.log('🌍 Running global initialization...');
          
          // Run the global initialization code that was in the fallback sequence
          if (typeof loadAppData === 'function') {
            console.log('🔄 Calling loadAppData');
            loadAppData();
            
            // Update header with username after data is loaded
            setTimeout(() => {
              if (this.updateHeaderWithUsername) {
                this.updateHeaderWithUsername();
              }
            }, 100);
          }
          
          // DISABLED: tryImportFromShareLink is already called during DOMContentLoaded
          // if (typeof tryImportFromShareLink === 'function') {
          //   console.log('🔄 Calling tryImportFromShareLink');
          //   tryImportFromShareLink();
          // }
          
          if (typeof loadGenres === 'function') {
            console.log('🔄 Calling loadGenres');
            loadGenres();
          }
          
          // Set up search controls
          console.log('🔍 Setting up search controls...');
          const searchBtn = document.getElementById("searchBtn");
          if (searchBtn) {
            console.log('✅ Search button found, binding performSearch');
            searchBtn.onclick = performSearch;
          } else {
            console.log('❌ Search button not found');
          }
          
          const clearSearchBtn = document.getElementById("clearSearchBtn");
          if (clearSearchBtn) {
            console.log('✅ Clear search button found, binding clearSearch');
            clearSearchBtn.onclick = clearSearch;
          } else {
            console.log('❌ Clear search button not found');
          }
          
          const searchInput = document.getElementById("searchInput");
          if (searchInput) {
            console.log('✅ Search input found, adding keydown listener');
            searchInput.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                console.log('⌨️ Enter key pressed, calling performSearch');
                performSearch?.();
              }
            });
          } else {
            console.log('❌ Search input not found');
          }
          
          // Set up event delegation for move buttons and other card actions
          console.log('🎯 Setting up event delegation for card actions...');
          document.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-action]");
            if (!btn) {
              return;
            }
            
            const action = btn.getAttribute("data-action");
            const id = Number(btn.getAttribute("data-id"));
            const list = btn.getAttribute("data-list");
            const mediaType = btn.getAttribute("data-media-type");
            
            console.log(`🎯 Action detected: action=${action}, id=${id}, list=${list}, mediaType=${mediaType}`);
            
            if (action === "addFromCache") {
              console.log('➕ Calling addToListFromCache');
              addToListFromCache(id, list);
            } else if (action === "notInterested") {
              console.log('🚫 Calling markAsNotInterested');
              e.preventDefault(); // Prevent any default form submission
              e.stopPropagation(); // Stop event bubbling
              markAsNotInterested(id, mediaType);
            } else if (action === "move") {
              console.log('🔄 Calling moveItem');
              moveItem(id, list);
            } else if (action === "notes") {
              console.log('📝 Calling openNotesTagsModal');
              openNotesTagsModal(id);
            } else if (action === "remove") {
              console.log('🗑️ Calling removeItemFromCurrentList');
              removeItemFromCurrentList(id);
            } else if (action === "rate") {
              console.log('⭐ Calling setRating');
              const rating = Number(btn.getAttribute("data-rating"));
              setRating(id, rating);
            } else if (action === "like") {
              console.log('👍 Calling setLikeStatus');
              setLikeStatus(id, "like");
            } else if (action === "dislike") {
              console.log('👎 Calling setLikeStatus');
              setLikeStatus(id, "dislike");
            } else if (action === "open") {
              console.log('🔗 Calling openTMDBLink');
              openTMDBLink(id, mediaType);
            }
          });
          
          console.log('✅ Global initialization complete');
        
        // Set up share button bindings
        console.log('🔗 Setting up share button bindings...');
        
        // Check if functions exist before binding
        console.log('🔍 Checking function availability:');
        console.log('  - openShareSelectionModal:', typeof openShareSelectionModal);
        console.log('  - generateShareLinkFromSelected:', typeof generateShareLinkFromSelected);
        console.log('  - closeShareSelectionModal:', typeof closeShareSelectionModal);
        
        try {
          // Only bind non-share buttons to avoid conflicts
          bind("generateShareLinkBtn", generateShareLinkFromSelected);
          bind("closeShareModalBtn", closeShareSelectionModal);
          console.log('✅ Share button bindings set up');
          
          // Also add direct event listeners as backup
          const generateBtn = document.getElementById('generateShareLinkBtn');
          if (generateBtn) {
            // Remove any existing listeners first
            generateBtn.removeEventListener('click', generateShareLinkFromSelected);
            generateBtn.addEventListener('click', generateShareLinkFromSelected);
            console.log('✅ Direct event listener added to generate button');
          }
        } catch (error) {
          console.error('❌ Error setting up share button bindings:', error);
        }
        
        // Skip adding direct event listener to share button - let the safety-checked version handle it
        console.log('🔗 Skipping direct share button binding - using safety-checked version');
        
        // Debug: Check all elements with 'share' in the ID
        const allElements = document.querySelectorAll('[id*="share"]');
        console.log('🔍 Found elements with "share" in ID:', allElements);
        },

        applyTheme() {
          if (this.appData.settings.theme === 'dark') {
            document.body.classList.add('dark-mode');
            // Update button to show sun icon for dark mode
            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) themeIcon.textContent = '☀️';
          } else {
            document.body.classList.remove('dark-mode');
            // Update button to show moon icon for light mode
            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) themeIcon.textContent = '🌙';
          }
        },

        applyLanguage() {
          const langSel = document.getElementById('langToggle');
          if (langSel) {
            langSel.value = this.appData.settings.lang || 'en';
          }
          
          // Call the existing applyTranslations function if available
          if (typeof applyTranslations === 'function') {
            applyTranslations();
          } else {
            // Don't call this.applyTranslations() yet - wait for the function to be available
            console.log('🌐 Language set to:', this.appData.settings.lang);
          }
        },

        changeLanguage(newLang) {
          console.log(`🌍 Centralized changeLanguage called with: ${newLang}`);
          
          // Update the centralized app data
          if (this.appData?.settings) {
            this.appData.settings.lang = newLang;
          }
          
          // Apply translations
          this.applyLanguage();
          
          // Handle the complex language change logic directly here
          // Set a flag to prevent dropdown resets during language change
          window.isChangingLanguage = true;
          
          // Update global app data if available
          if (window.appData?.settings) {
            window.appData.settings.lang = newLang;
          }
          if (appData?.settings) {
            appData.settings.lang = newLang;
          }
          
          // Ensure language dropdown options are preserved
          const langToggle = document.getElementById("langToggle");
          if (langToggle && langToggle.children.length < 2) {
            langToggle.innerHTML = `
              <option value="en">EN</option>
              <option value="es">ES</option>
            `;
          }
          
          // Apply translations FIRST (before rehydration)
          if (typeof applyTranslations === 'function') {
            applyTranslations();
          }
          
          // Show loading state for lists
          const currentTab = document.querySelector(".tab.active")?.id?.replace("Tab", "");
          if (currentTab && ["watching", "wishlist", "watched"].includes(currentTab)) {
            const listContainer = document.getElementById(currentTab + "List");
            if (listContainer) {
              listContainer.innerHTML = `<div style="text-align: center; padding: 20px;">${t("loading")}...</div>`;
            }
          }
          
          // Try to rehydrate lists with localized TMDB data
          if (typeof rehydrateListsForLocale === 'function') {
            rehydrateListsForLocale(newLang).then(() => {
              // Save and update UI after rehydration
              if (typeof saveAppData === 'function') saveAppData();
              if (typeof updateUI === 'function') updateUI();
            }).catch(error => {
              console.warn("Failed to rehydrate lists for locale:", error);
              // Still save and update UI even if rehydration fails
              if (typeof saveAppData === 'function') saveAppData();
              if (typeof updateUI === 'function') updateUI();
            });
          } else {
            // Fallback: just save and update UI
            if (typeof saveAppData === 'function') saveAppData();
            if (typeof updateUI === 'function') updateUI();
          }
          
          // Force refresh of genre dropdown
          setTimeout(() => {
            if (typeof loadGenres === "function") {
              loadGenres();
            }
          }, 200);
          
          // Show notification
          const langName = newLang === "es" ? "Spanish" : "English";
          this.showNotification(`Language changed to ${langName}`, "success");
          
          // Clear the flag after operations complete
          setTimeout(() => {
            window.isChangingLanguage = false;
          }, 3000);
          
          // Final refresh of horoscope and quote
          setTimeout(() => {
            const hEl = document.getElementById("fakeFortune");
            const qEl = document.getElementById("randomQuote");
            if (hEl && typeof pickDailyHoroscope === 'function') {
              hEl.textContent = pickDailyHoroscope();
            }
            if (qEl && typeof drawQuote === 'function') {
              qEl.textContent = drawQuote();
            }
            
            const fileInput = document.getElementById("importFile");
            if (fileInput && typeof updateFileLabel === 'function') {
              updateFileLabel(fileInput);
            }
            
            // Clear search cache to force fresh results in new language
            if (typeof window.searchItemCache !== 'undefined' && window.searchItemCache.clear) {
              console.log('🗑️ Clearing search cache for language change');
              console.log('📊 Cache size before clearing:', window.searchItemCache.size);
              window.searchItemCache.clear();
              console.log('📊 Cache size after clearing:', window.searchItemCache.size);
            } else {
              console.log('⚠️ searchItemCache not available globally');
            }
            
            // Refresh search results if they're visible
            if (typeof refreshSearchResults === 'function') {
              console.log('🔄 Refreshing search results for language change');
              refreshSearchResults();
            }
          }, 600);
        },

        applyMardiGras() {
          // Check if Mardi Gras mode should be enabled from localStorage
          const mardiGrasEnabled = localStorage.getItem('flicklet-mardi-gras') === 'true';
          const root = document.getElementById("appRoot");
          if (root && mardiGrasEnabled) {
            root.classList.add("mardi");
            console.log('🎭 Mardi Gras mode restored from localStorage');
          }
        },





        showNotification(message, type = 'info') {
          console.log(`🔔 Centralized showNotification called: "${message}" (${type})`);
          const notification = document.createElement('div');
          notification.className = `notification ${type}`;
          notification.textContent = message;
          
          // Create a centered notification box with proper styling
          notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            padding: 16px 24px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            min-width: 200px;
            word-wrap: break-word;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: notificationSlideIn 0.3s ease-out;
          `;

          // Set background color based on type with proper fallbacks
          switch (type) {
            case 'success':
              notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
              break;
            case 'error':
              notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
              break;
            case 'warning':
              notification.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
              notification.style.color = '#fff';
              break;
            case 'info':
            default:
              notification.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
              break;
          }

          document.body.appendChild(notification);
          
          // Auto-remove after 3 seconds
          setTimeout(() => {
            if (notification.parentNode) {
              notification.style.animation = 'notificationSlideOut 0.3s ease-in forwards';
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.parentNode.removeChild(notification);
                }
              }, 300);
            }
          }, 3000);
        },
        
        setupKeyboardShortcuts() {
          console.log('⌨️ Setting up keyboard shortcuts...');
          
          document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
              return;
            }
            
            // Ctrl/Cmd + K: Focus search input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
              e.preventDefault();
              const searchInput = document.getElementById('searchInput');
              if (searchInput) {
                searchInput.focus();
                searchInput.select();
                this.showNotification('🔍 Search focused - Type to search for shows and movies', 'info');
              }
            }
            
            // Ctrl/Cmd + T: Toggle theme
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
              e.preventDefault();
              this.toggleTheme();
            }
            
            // Ctrl/Cmd + M: Toggle Mardi Gras mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
              e.preventDefault();
              this.toggleMardiGras();
            }
            
            // Number keys 1-5: Switch tabs
            if (e.key >= '1' && e.key <= '5' && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              const tabMap = {
                '1': 'home',
                '2': 'watching',
                '3': 'wishlist',
                '4': 'watched',
                '5': 'discover'
              };
              const tabName = tabMap[e.key];
              if (tabName) {
                this.switchTab(tabName);
                this.showNotification(`📱 Switched to ${tabName} tab`, 'info');
              }
            }
            
            // Escape: Clear search and close modals
            if (e.key === 'Escape') {
              const searchInput = document.getElementById('searchInput');
              if (searchInput && searchInput.value.trim()) {
                searchInput.value = '';
                this.clearSearch();
                this.showNotification('🔍 Search cleared', 'info');
              }
            }
          });
          
          console.log('✅ Keyboard shortcuts set up');
        },
        
        clearSearch() {
          console.log('🧹 Clearing search...');
          const searchInput = document.getElementById('searchInput');
          const searchResults = document.getElementById('searchResults');
          
          if (searchInput) {
            searchInput.value = '';
          }
          
          if (searchResults) {
            searchResults.style.display = 'none';
          }
          
          // Clear any active search filters
          const genreFilter = document.getElementById('genreFilter');
          if (genreFilter) {
            genreFilter.value = '';
          }
          
          console.log('✅ Search cleared');
        },

        switchTab(tabName) {
          this.currentTab = tabName;
          
          console.log(`🔄 Switching to tab: ${tabName}`);
          console.log(`🔧 DEBUG: window.switchToTab exists:`, typeof window.switchToTab);
          
          // Use the existing switchToTab function to ensure proper content rendering
          if (typeof window.switchToTab === 'function') {
            console.log(`🔧 DEBUG: About to call window.switchToTab("${tabName}")`);
            window.switchToTab(tabName);
            console.log(`🔧 DEBUG: window.switchToTab("${tabName}") completed`);
            
            // Update tab visibility after switching
            this.updateTabVisibility();
          } else {
            console.log('⚠️ Using fallback tab switching logic');
            // Fallback tab switching logic to avoid infinite recursion
            document.querySelectorAll('.tab').forEach(tab => {
              tab.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-section').forEach(section => {
              section.style.display = 'none';
            });
            
            // Activate the correct tab and show its section
            if (tabName === 'home') {
              const homeTab = document.getElementById('homeTab');
              if (homeTab) homeTab.classList.add('active');
            } else if (tabName === 'watching') {
              const watchingTab = document.getElementById('watchingTab');
              if (watchingTab) watchingTab.classList.add('active');
            } else if (tabName === 'wishlist') {
              const wishlistTab = document.getElementById('wishlistTab');
              if (wishlistTab) wishlistTab.classList.add('active');
            } else if (tabName === 'watched') {
              const watchedTab = document.getElementById('watchedTab');
              if (watchedTab) watchedTab.classList.add('active');
            } else if (tabName === 'discover') {
              const discoverTab = document.getElementById('discoverTab');
              if (discoverTab) discoverTab.classList.add('active');
            } else if (tabName === 'settings') {
              const settingsTab = document.getElementById('settingsTab');
              if (settingsTab) settingsTab.classList.add('active');
            }
            
            // Update tab visibility after switching
            this.updateTabVisibility();
          }
        },

        updateUI() {
          // Use fallback UI update logic to avoid infinite recursion
          document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
          });
          
          // Activate the correct tab
          if (this.currentTab === 'home') {
            const homeTab = document.getElementById('homeTab');
            if (homeTab) homeTab.classList.add('active');
          } else if (this.currentTab === 'watching') {
            const watchingTab = document.getElementById('watchingTab');
            if (watchingTab) watchingTab.classList.add('active');
          } else if (this.currentTab === 'wishlist') {
            const wishlistTab = document.getElementById('wishlistTab');
            if (wishlistTab) wishlistTab.classList.add('active');
          } else if (this.currentTab === 'watched') {
            const watchedTab = document.getElementById('watchedTab');
            if (watchedTab) watchedTab.classList.add('active');
          } else if (this.currentTab === 'discover') {
            const discoverTab = document.getElementById('discoverTab');
            if (discoverTab) discoverTab.classList.add('active');
          } else if (this.currentTab === 'settings') {
            const settingsTab = document.getElementById('settingsTab');
            if (settingsTab) settingsTab.classList.add('active');
          }
          
          // Update tab visibility based on current tab
          this.updateTabVisibility();
          
          // Update header with username and snarky saying
          this.updateHeaderWithUsername();
        },

        updateTabVisibility() {
          console.log('🎯 updateTabVisibility called, currentTab:', this.currentTab);
          
          // This function manages tab button visibility - hide current tab, show others
          // Section visibility is handled by the old switchToTab function
          
          // Get all tab buttons
          const allTabButtons = ['homeTab', 'watchingTab', 'wishlistTab', 'watchedTab', 'discoverTab'];
          
          // First, remove all classes and show all tabs
          allTabButtons.forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) {
              tab.classList.remove('active', 'hidden');
              console.log(`🔘 Reset tab button: ${tabId}`);
            }
          });
          
          // Determine which tab should be hidden (current tab)
          let currentTabId = '';
          switch (this.currentTab) {
            case 'home':
              currentTabId = 'homeTab';
              break;
            case 'watching':
              currentTabId = 'watchingTab';
              break;
            case 'wishlist':
              currentTabId = 'wishlistTab';
              break;
            case 'watched':
              currentTabId = 'watchedTab';
              break;
            case 'discover':
              currentTabId = 'discoverTab';
              break;
            case 'settings':
              // Settings doesn't have a tab button, show all tabs
              console.log('⚙️ Settings tab active - showing all tab buttons');
              // Don't return early - we still need to handle FlickWord container visibility
              currentTabId = null; // No tab to hide
              break;
            default:
              console.log('⚠️ Unknown currentTab:', this.currentTab);
              return;
          }
          
          // Hide the current tab and add active class to remaining tabs
          if (currentTabId) {
            const currentTab = document.getElementById(currentTabId);
            if (currentTab) {
              currentTab.classList.add('hidden');
              console.log(`🙈 Hidden current tab: ${currentTabId}`);
            }
            
            // Add active class to all remaining visible tabs
            allTabButtons.forEach(tabId => {
              if (tabId !== currentTabId) {
                const tab = document.getElementById(tabId);
                if (tab) {
                  tab.classList.add('active');
                  console.log(`✅ Activated remaining tab: ${tabId}`);
                }
              }
            });
          } else if (this.currentTab === 'settings') {
            // For settings tab, show all tab buttons but keep them in normal (non-active) state
            // This makes them look like settings entries, not clickable tabs
            allTabButtons.forEach(tabId => {
              const tab = document.getElementById(tabId);
              if (tab) {
                tab.classList.remove('active'); // Remove active class to show normal appearance
                console.log(`✅ Showed tab for settings view (normal state): ${tabId}`);
              }
            });
          }
          
          // Also manage FlickWord/quote container visibility
          const quoteFlickwordContainer = document.querySelector('.quote-flickword-container');
          if (quoteFlickwordContainer) {
            if (this.currentTab === 'home') {
              quoteFlickwordContainer.style.display = 'flex';
              console.log('📖 Showing FlickWord/quote container on home tab');
            } else {
              quoteFlickwordContainer.style.display = 'none';
              console.log('🙈 Hiding FlickWord/quote container on', this.currentTab, 'tab');
            }
          }
          
          console.log('🎯 Tab visibility update complete - hidden', currentTabId, 'activated remaining tabs');
        },

        updateHeaderWithUsername() {
          // DISABLED - Old header update system conflicts with new layout
          console.log('🚫 updateHeaderWithUsername disabled - using new independent system');
          return;
        },

        _performHeaderUpdate() {
          // DISABLED - Old header update system conflicts with new layout
          console.log('🚫 _performHeaderUpdate disabled - using new independent system');
          return;
          
          console.log('🔤 _performHeaderUpdate called');
          console.log('🔍 FlickletApp appData:', this.appData);
          console.log('🔍 FlickletApp appData.settings:', this.appData?.settings);
          console.log('🔍 FlickletApp appData.settings.displayName:', this.appData?.settings?.displayName);
          
          // GUARD CLAUSE: Don't run if appData isn't ready yet
          if (!this.appData || !this.appData.settings) {
            console.log('🚫 App data not ready yet, skipping header update');
            return;
          }
          
          const welcomeText = document.getElementById('welcomeText');
          const snarkySubtitle = document.getElementById('snarkySubtitle');
          
          console.log('🔍 Found elements:', { welcomeText: !!welcomeText, snarkySubtitle: !!snarkySubtitle });
          
          if (!welcomeText || !snarkySubtitle) {
            console.log('❌ Missing header elements, returning early');
            return;
          }
          
          // Log what the header currently shows BEFORE updating
          console.log('📝 Header BEFORE update:', {
            title: welcomeText.textContent,
            subtitle: snarkySubtitle.textContent
          });
          
          const displayName = this.appData?.settings?.displayName;
          console.log('👤 Display name found:', displayName);
          
          if (displayName && displayName.trim()) {
            // User has a username - show it with a snarky saying
            console.log('✅ Updating header with username:', displayName);
            
            welcomeText.textContent = displayName;
            
            // Array of snarky sayings
            const snarkySayings = [
              t("apparently_need_help"),
              t("watching_waste_time"),
              t("judging_taste"),
              t("keeping_track_questionable"),
              t("memory_shorter_goldfish"),
              t("helping_remember"),
              t("binge_watching_personality"),
              t("keeping_organized"),
              t("someone_remember"),
              t("personal_tv_memory")
            ];
            
            // Pick a random snarky saying
            const randomSnark = snarkySayings[Math.floor(Math.random() * snarkySayings.length)];
            
            snarkySubtitle.textContent = randomSnark;
            console.log('💬 Updated subtitle with snark:', randomSnark);
            
            // Log what the header shows AFTER updating
            console.log('📝 Header AFTER update:', {
              title: welcomeText.textContent,
              subtitle: snarkySubtitle.textContent
            });

          } else {
            // No username - show default Flicklet title
            console.log('🔄 No username, showing default Flicklet title');
            welcomeText.textContent = 'Flicklet';
            snarkySubtitle.textContent = 'TV & Movie Tracker';
            
            // Log what the header shows AFTER updating
            console.log('📝 Header AFTER update:', {
              title: welcomeText.textContent,
              subtitle: snarkySubtitle.textContent
            });

          }
        },

        // NEW INDEPENDENT USERNAME SYSTEM - Updates left-side container only
        updateLeftSideUsername() {
          console.log('🆕 updateLeftSideUsername called - updating left container only');
          
          // Find the left-side container elements
          const dynamicUsername = document.getElementById('dynamicUsername');
          const dynamicSnark = document.getElementById('dynamicSnark');
          
          console.log('🔍 Left container elements found:', { 
            dynamicUsername: !!dynamicUsername, 
            dynamicSnark: !!dynamicSnark 
          });
          
          if (!dynamicUsername || !dynamicSnark) {
            console.log('❌ Left container elements not found, returning early');
            return;
          }
          
          // Get username from appData or extract from email
          let displayName = this.appData?.settings?.displayName;
          console.log('👤 Display name from appData:', displayName);
          
          if (!displayName || !displayName.trim()) {
            // No custom display name - don't extract from email, show default welcome
            console.log('🔄 No custom username found, showing default welcome message');
          }
          
          if (displayName && displayName.trim()) {
            // User has a username - show it with a snarky saying
            console.log('✅ Updating left container with username:', displayName);
            
            dynamicUsername.textContent = displayName;
            
            // Array of snarky sayings
            const snarkySayings = [
              t("apparently_need_help"),
              t("watching_waste_time"),
              t("judging_taste"),
              t("keeping_track_questionable"),
              t("memory_shorter_goldfish"),
              t("helping_remember"),
              t("binge_watching_personality"),
              t("keeping_organized"),
              t("someone_remember"),
              t("personal_tv_memory")
            ];
            
            // Pick a random snarky saying
            const randomSnark = snarkySayings[Math.floor(Math.random() * snarkySayings.length)];
            
            dynamicSnark.textContent = randomSnark;
            console.log('💬 Updated left container with snark:', randomSnark);
            
          } else {
            // No username or email - show default welcome message
            console.log('🔄 No username or email, showing default welcome message');
            dynamicUsername.textContent = 'Welcome!';
            dynamicSnark.textContent = 'Ready to track your shows';
          }
        },

        // FlickWord Integration Methods
        initializeFlickWord() {
          console.log('🎯 Initializing FlickWord integration');
          
          // Feature flag - set to false to disable FlickWord
          const enableFlickWord = true;
          
          if (!enableFlickWord) {
            console.log('🚫 FlickWord disabled by feature flag');
            return;
          }

          // Only show the FlickWord container if we're on the home tab
          if (this.currentTab === 'home') {
            const quoteFlickwordContainer = document.querySelector('.quote-flickword-container');
            if (quoteFlickwordContainer) {
              quoteFlickwordContainer.style.display = 'flex';
            }
          }

          // Set up event listeners
          this.setupFlickWordEventListeners();
          
          // Start countdown and update stats
          this.startDailyCountdown();
          this.updateFlickWordStats();
        },
        
        // Show welcome message for new users
        showWelcomeMessage() {
          const welcomeMessage = document.getElementById('welcomeMessage');
          if (welcomeMessage) {
            // Check if user has any data (indicating they're not new)
            const hasData = this.appData?.lists?.watching?.length > 0 || 
                           this.appData?.lists?.wishlist?.length > 0 || 
                           this.appData?.lists?.watched?.length > 0;
            
            if (!hasData) {
              welcomeMessage.style.display = 'block';
              // Hide after 10 seconds
              setTimeout(() => {
                welcomeMessage.style.opacity = '0';
                setTimeout(() => {
                  welcomeMessage.style.display = 'none';
                }, 600);
              }, 10000);
            }
          }
        },

        setupFlickWordEventListeners() {
          const playBtn = document.getElementById('playFlickwordBtn');
          if (playBtn) {
            playBtn.addEventListener('click', () => this.openFlickWord());
          }

          // Listen for FlickWord results
          window.addEventListener('message', (e) => {
            const msg = e.data || {};
            if (msg.type === 'flickword:result') {
              this.handleFlickWordResult(msg);
            } else if (msg.type === 'flickword:close') {
              // Handle iframe close if needed
              console.log('🎯 FlickWord closed');
            }
          });
        },

        openFlickWord() {
          console.log('🎯 Opening FlickWord');
          
          // Build URL with today's date for consistency
          const now = new Date();
          const yyyy = now.getUTCFullYear();
          const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(now.getUTCDate()).padStart(2, '0');
          const iso = `${yyyy}-${mm}-${dd}`;
          
          const flickwordUrl = `/features/flickword.html?date=${iso}`;
          
          // Open in new tab
          window.open(flickwordUrl, '_blank');
        },

        startDailyCountdown() {
          const countdownEl = document.getElementById('dailyCountdown');
          if (!countdownEl) return;

          function tick() {
            const now = new Date();
            const endOfDay = new Date(now);
            // Set to end of day in user's timezone (23:59:59)
            endOfDay.setHours(23, 59, 59, 999);
            
            const diff = Math.max(0, endOfDay - now);
            const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
            const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
            
            const h = String(hoursLeft).padStart(2, '0');
            const m = String(minutesLeft).padStart(2, '0');
            const s = String(secondsLeft).padStart(2, '0');
            
            countdownEl.textContent = `${h}:${m}:${s}`;
            
            // Update motivation message with hours left
            const motivationEl = document.getElementById('flickwordMotivation');
            if (motivationEl) {
              const lang = this.appData?.settings?.lang || 'en';
              if (lang === 'es') {
                motivationEl.innerHTML = `<span data-i18n="hours_left_motivation">¡${hoursLeft} horas restantes para jugar el juego de hoy! ¡No te lo pierdas!</span>`;
              } else {
                motivationEl.innerHTML = `<span data-i18n="hours_left_motivation">${hoursLeft} hours left to play today's game! Don't miss out!</span>`;
              }
            }
          }
          
          tick();
          setInterval(tick, 1000);
        },

        updateFlickWordStats() {
          // Load stats from localStorage
          const results = JSON.parse(localStorage.getItem('flickword:results') || '{}');
          
          // Get all game results sorted by date
          const gameResults = Object.values(results).sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // Calculate current streak (consecutive games won in a row)
          let currentStreak = 0;
          for (let i = gameResults.length - 1; i >= 0; i--) {
            if (gameResults[i].won) {
              currentStreak++;
            } else {
              break;
            }
          }
          
          // Calculate best streak (highest consecutive games won since starting)
          let bestStreak = 0;
          let tempStreak = 0;
          
          gameResults.forEach(result => {
            if (result.won) {
              tempStreak++;
              bestStreak = Math.max(bestStreak, tempStreak);
            } else {
              tempStreak = 0;
            }
          });
          
          // Calculate total games played (wins + losses)
          let totalGamesPlayed = gameResults.length;
          
          // Update UI
          const streakEl = document.getElementById('streakCount');
          const bestScoreEl = document.getElementById('bestScore');
          const gamesPlayedEl = document.getElementById('gamesPlayed');
          
          if (streakEl) streakEl.textContent = currentStreak;
          if (bestScoreEl) bestScoreEl.textContent = bestStreak;
          if (gamesPlayedEl) gamesPlayedEl.textContent = totalGamesPlayed;
        },



        handleFlickWordResult(result) {
          console.log('🎯 FlickWord result received:', result);
          
          // Save result to localStorage
          const results = JSON.parse(localStorage.getItem('flickword:results') || '{}');
          results[result.date] = result;
          localStorage.setItem('flickword:results', JSON.stringify(results));
          
          // Update stats display
          this.updateFlickWordStats();
          
          // Show notification
          if (result.won) {
            const message = `🎉 Word solved in ${result.guesses} guesses!`;
            this.showNotification(message, 'success');
          } else {
            const message = `😔 Better luck tomorrow! The word was: ${result.target}`;
            this.showNotification(message, 'info');
          }
        },

        handlePostLoginUsernameSetup(user) {
          console.log('👤 Handling post-login username setup for user:', user.email);
          
          // Check if user already has a username in Firebase
          if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            
            // Add a small delay to ensure Firebase is fully synced
            setTimeout(() => {
              console.log('🔍 DEBUG: About to read Firebase document for username setup');
              db.collection("users").doc(user.uid).get().then((doc) => {
                console.log('🔍 Firebase user document exists:', doc.exists);
                if (doc.exists) {
                  const userData = doc.data();
                  console.log('🔍 DEBUG: Raw Firebase document for username setup:', userData);
                  console.log('🔍 DEBUG: Profile object for username setup:', userData.profile);
                  console.log('🔍 DEBUG: Profile.displayName for username setup:', userData.profile?.displayName);
                  
                  console.log('🔍 Firebase user data:', userData);
                  console.log('🔍 Firebase user data keys:', Object.keys(userData));
                  console.log('🔍 Firebase settings object:', userData?.settings);
                  const existingUsername = userData?.settings?.displayName;
                  const rootDisplayName = userData?.displayName;
                  console.log('🔍 Existing username from Firebase settings:', existingUsername);
                  console.log('🔍 Root displayName from Firebase:', rootDisplayName);
                  
                  // Check if user already has a CUSTOM username (only from settings.displayName, not Google's displayName)
                  const localUsername = (this.appData?.settings?.displayName || "").trim();
                  // Only use settings.displayName (user's custom choice), ignore Google's displayName
                  const finalUsername = existingUsername && existingUsername.trim() ? existingUsername : localUsername;
                  console.log('🔧 DEBUG: finalUsername decision:', { existingUsername, localUsername, finalUsername });
                  
                  if (finalUsername) {
                    // User already has a username - use it
                    const source = existingUsername ? 'Firebase settings' : 'local';
                    console.log('✅ Found existing username:', finalUsername, '(source:', source, ')');
                    
                    // Update local appData with the username
                    if (this.appData && this.appData.settings) {
                      this.appData.settings.displayName = finalUsername;
                    }
                    
                    // Populate the username input field
                    const displayNameInput = document.getElementById('displayNameInput');
                    if (displayNameInput) {
                      displayNameInput.value = finalUsername;
                      console.log('✅ Populated username input field with:', finalUsername);
                    }
                    
                    // Update the left-side container with the username
                    this.updateLeftSideUsername();
                    
                  } else {
                    // No custom username exists - show username prompt modal
                    console.log('❌ No username found, showing username prompt modal');
                    
                    // Show a modal to prompt for username
                    this.showUsernamePromptModal(user.email);
                  }
                } else {
                  // No user document exists - show username prompt modal
                  console.log('❌ No user document found, showing username prompt modal');
                  
                  // Show a modal to prompt for username
                  this.showUsernamePromptModal(user.email);
                }
              }).catch((error) => {
                console.error('❌ Error checking Firebase for username:', error);
                // Fallback - show username prompt modal
                this.showUsernamePromptModal(user.email);
              });
            }, 500); // 500ms delay to ensure Firebase is synced
          } else {
            // Firebase not available - show username prompt modal
            console.log('ℹ️ Firebase not available, showing username prompt modal');
            this.showUsernamePromptModal(user.email);
          }
        },

        showUsernamePromptModal(userEmail) {
          console.log('📝 Showing username prompt modal for:', userEmail);
          
          // Create and show a modal asking for username
          const modalHTML = `
            <div class="modal-backdrop" id="usernamePromptModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
              <div class="modal" style="background: var(--card); border-radius: 12px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                <h3 style="margin: 0 0 16px 0; color: var(--text);">Welcome! 👋</h3>
                <p style="margin: 0 0 20px 0; color: var(--text); line-height: 1.5;">What would you like us to call you?</p>
                <input 
                  type="text" 
                  id="newUsernameInput" 
                  class="search-input" 
                  placeholder="Enter your name"
                  style="width: 100%; margin: 15px 0;"
                />
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                  <button class="btn secondary" onclick="closeUsernamePromptModal()" style="min-width: 80px;">Skip</button>
                  <button class="btn primary" onclick="saveUsernameFromPrompt()" style="min-width: 80px;">Save</button>
                </div>
              </div>
            </div>
          `;
          
          // Insert the modal
          document.body.insertAdjacentHTML('beforeend', modalHTML);
          console.log('✅ Modal HTML inserted into DOM');
          
          // Check if modal was created
          const modal = document.getElementById('usernamePromptModal');
          if (modal) {
            console.log('✅ Modal element found in DOM');
            console.log('🔍 Modal display style:', modal.style.display);
            console.log('🔍 Modal visibility:', modal.style.visibility);
            console.log('🔍 Modal z-index:', modal.style.zIndex);
          } else {
            console.log('❌ Modal element NOT found in DOM');
          }
          
          // Focus the input field
          setTimeout(() => {
            const input = document.getElementById('newUsernameInput');
            if (input) {
              input.focus();
              input.select();
              console.log('✅ Input field focused and selected');
            } else {
              console.log('❌ Input field not found');
            }
          }, 100);
          
          // Add click-outside-to-close functionality
          setTimeout(() => {
            const modal = document.getElementById('usernamePromptModal');
            if (modal) {
              modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                  console.log('🖱️ Clicked outside modal, closing');
                  closeUsernamePromptModal();
                }
              });
              console.log('✅ Click-outside-to-close functionality added');
            }
          }, 200);
        },

        initFirebase() {
          console.log('🔥 Initializing Firebase...');
          
          // Wait for Firebase to be initialized by the old system
          const waitForFirebase = () => {
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
              console.log('✅ Firebase available, setting up auth listener');
              firebase.auth().onAuthStateChanged(async (user) => {
                console.log('👤 Firebase auth state changed:', user ? `User: ${user.email}` : 'No user');
                this.currentUser = user;
                this.updateAccountButton();
                if (user) {
                  console.log('✅ User signed in, updating UI');
                  this.showNotification('Signed in successfully', 'success');
                  
                  // Run migration once per user
                  await this.runMigration();
                  
                  // Run cleanup for stray field
                  await this.cleanupStrayField();
                  
                  // Handle username setup after login
                  this.handlePostLoginUsernameSetup(user);
                  
                  // Update username display after login
                  setTimeout(() => {
                    this.updateLeftSideUsername();
                  }, 100);
                } else {
                  console.log('❌ No user signed in');
                }
              });
            } else {
              console.log('⏳ Waiting for Firebase to be initialized...');
              setTimeout(waitForFirebase, 100);
            }
          };
          
          waitForFirebase();
        },

        // Migration function to clean existing Firebase documents
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
              console.log('🧹 Removing empty settings.displayName');
              updates['settings.displayName'] = firebase.firestore.FieldValue.delete();
              needsUpdate = true;
            }

            // Check for duplicate top-level settings.displayName field and remove it
            if (data['settings.displayName'] !== undefined) {
              console.log('🧹 Removing duplicate top-level settings.displayName field');
              updates['settings.displayName'] = firebase.firestore.FieldValue.delete();
              needsUpdate = true;
            }

            // Check for empty profile.displayName and remove it
            if (data.profile && data.profile.displayName === '') {
              console.log('🧹 Removing empty profile.displayName');
              updates['profile.displayName'] = firebase.firestore.FieldValue.delete();
              needsUpdate = true;
            }

            if (needsUpdate) {
              await ref.update(updates);
              console.log('✅ Migration completed successfully');
            } else {
              console.log('✅ No migration needed');
            }

            // Only mark as completed if no updates were needed
            if (!needsUpdate) {
              this._migrationCompleted = true;
            }
          } catch (error) {
            console.error('❌ Migration failed:', error);
            this._migrationCompleted = true; // Don't retry on error
          }
        },

        // One-time cleanup script to remove stray top-level settings.displayName field
        async cleanupStrayField() {
          const uid = this.currentUser?.uid;
          if (!uid) return;
          
          try {
            const ref = firebase.firestore().collection('users').doc(uid);
            const snap = await ref.get();
            if (!snap.exists) return;
            
            const data = snap.data() || {};
            const stray = data['settings.displayName'];

            // If the mistaken top-level key exists (even if empty), delete it
            if (typeof stray === 'string') {
              await ref.update({ 'settings.displayName': firebase.firestore.FieldValue.delete() });
              console.log('🧹 Deleted stray top-level "settings.displayName" key');
            }
          } catch (error) {
            console.error('❌ Cleanup failed:', error);
          }
        },

        async updateAccountButton() {
          const accountBtn = document.getElementById('accountBtn');
          const accountHint = document.getElementById('accountHint');
          if (!accountBtn) return;

          // Logged out
          if (!this.currentUser) {
            this._lastAccountBtnUid = null;
            this._lastAccountBtnDoc = null;
            accountBtn.textContent = '👤 Sign In';
            accountBtn.title = 'Click to sign in';
            if (accountHint) accountHint.textContent = '';
            return;
          }

          const email = this.currentUser.email || 'Account';
          const providerId = (this.currentUser.providerData?.[0]?.providerId) || '';

          // Helper: capitalize from email prefix if needed
          const fromEmail = (em) => {
            const prefix = (em || '').split('@')[0];
            if (!prefix) return 'Account';
            // split on ., _, - and collapse multi-delims
            const parts = prefix.split(/[._-]+/).filter(Boolean);
            return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          };

          let displayText = '';

          if (providerId === 'google.com') {
            // For Google users, use Google's displayName
            displayText = this.currentUser.displayName?.trim() ||
                         this.currentUser.providerData?.find(p => p.providerId === 'google.com')?.displayName?.trim() ||
                         '';
          } else if (providerId === 'password') {
            // For email users, use profile.displayName (not settings.displayName)
            displayText = await this.getDisplayNameForUser(this.currentUser.uid) || '';
          }

          // Final fallback to email-derived name
          if (!displayText) {
            displayText = fromEmail(email);
          }

          // Paint button and hint
          accountBtn.textContent = `👤 ${displayText}`;
          accountBtn.title = `Signed in as ${email}. Click to sign out.`;
          if (accountHint) accountHint.textContent = 'click to log out';
        },

        async getDisplayNameForUser(uid) {
          const db = firebase.firestore();
          const ref = db.collection('users').doc(uid);
          const snap = await ref.get(); // ok to use cache; we handle both keys
          if (!snap.exists) return null;

          const data = snap.data() || {};
          const nested = (data.settings && typeof data.settings.displayName === 'string')
            ? data.settings.displayName.trim() : '';
          const stray = (typeof data['settings.displayName'] === 'string')
            ? data['settings.displayName'].trim() : '';
          const profileName = (data.profile && typeof data.profile.displayName === 'string')
            ? data.profile.displayName.trim() : '';

          // For account button: prefer profile > nested > stray
          // (profile.displayName is the account identifier, settings.displayName is the personal greeting)
          return profileName || nested || stray || null;
        },

        setupEventListeners() {
          console.log('🔧 Setting up event listeners...');
          
          // Set up tab event listeners
          console.log('🔧 Setting up tab event listeners...');
          const bindTab = (id, fn) => {
            const el = document.getElementById(id);
            if (el) {
              el.addEventListener('click', (e) => {
                console.log(`🔄 Tab clicked: ${id}`);
                fn(e);
              });
              console.log(`✅ Tab event listener set up for ${id}`);
            } else {
              console.error(`❌ Tab element not found: ${id}`);
            }
          };
          
          // Set up keyboard shortcuts
          this.setupKeyboardShortcuts();

          // Bind tab click handlers
          bindTab("homeTab", () => this.switchTab("home"));
          bindTab("watchingTab", () => this.switchTab("watching"));
          bindTab("wishlistTab", () => this.switchTab("wishlist"));
          bindTab("watchedTab", () => this.switchTab("watched"));
          bindTab("discoverTab", () => this.switchTab("discover"));
          
          // Settings button is now in the header, not in tab container
          const settingsBtn = document.getElementById('settingsTab');
          if (settingsBtn) {
            const self = this;
            settingsBtn.addEventListener('click', function(e) {
              self.switchTab("settings");
            });
            console.log('✅ Settings button event listener added');
          } else {
            console.log('❌ Settings button not found!');
          }
          
          console.log('✅ All tab event listeners set up');

          // Language toggle - already handled by HTML onchange attribute
          
          // Set up keyboard shortcuts
          this.setupKeyboardShortcuts();

          // Theme toggle
          const themeBtn = document.getElementById('darkModeToggle');
          if (themeBtn) {
            const self = this;
            themeBtn.addEventListener('click', function() {
              self.toggleTheme();
            });
          }

          // Mardi Gras toggle
          const mardiBtn = document.getElementById('mardiToggle');
          if (mardiBtn) {
            const self = this;
            mardiBtn.addEventListener('click', function() {
              self.toggleMardiGras();
            });
          }

          // Account button - show sign in modal or name modal based on auth state
          const accountBtn = document.getElementById('accountBtn');
          console.log('🔍 Looking for account button:', accountBtn);
          if (accountBtn) {
            console.log('🔧 Setting up account button event listener');
            const self = this; // Preserve 'this' context
            accountBtn.addEventListener('click', function() {
              console.log('🔐 Account button clicked, currentUser:', self.currentUser);
              if (self.currentUser) {
                // User is signed in, show sign out modal
                console.log('👤 User signed in, showing sign out modal');
                self.showSignOutModal();
              } else {
                // User is not signed in, show sign in modal
                console.log('🔑 User not signed in, showing sign in modal');
                console.log('🔍 showSignInModal function type:', typeof showSignInModal);
                if (typeof showSignInModal === 'function') {
                  console.log('✅ Calling showSignInModal');
                  showSignInModal();
                } else {
                  console.error('❌ showSignInModal function not available');
                }
              }
            });
            console.log('✅ Account button event listener set up successfully');
          } else {
            console.error('❌ Account button not found');
          }

          // Nuclear Option button - clear all data
          const clearAllBtn = document.getElementById('clearAllBtn');
          if (clearAllBtn) {
            console.log('🗑️ Setting up Nuclear Option button event listener');
            const self = this;
            clearAllBtn.addEventListener('click', function() {
              console.log('🗑️ Nuclear Option button clicked!');
              self.showNuclearOptionModal();
            });
            console.log('✅ Nuclear Option button event listener set up successfully');
          } else {
            console.log('❌ Nuclear Option button not found');
          }
        },

        toggleTheme() {
          console.log('🎨 Theme toggle clicked, current theme:', this.appData.settings.theme);
          this.appData.settings.theme = this.appData.settings.theme === 'light' ? 'dark' : 'light';
          console.log('🎨 New theme:', this.appData.settings.theme);
          this.saveData();
          this.applyTheme();
          
          // Creative theme change messages
          let message;
          if (this.appData.settings.theme === 'dark') {
            message = '🌙 Welcome to the dark side!';
          } else {
            message = '☀️ Let there be light!';
          }
          
          this.showNotification(message, 'info');
        },

        toggleMardiGras() {
          console.log('🎭 Mardi Gras toggle clicked');
          const root = document.getElementById("appRoot");
          if (root) {
            const isMardiGras = root.classList.contains("mardi");
            if (isMardiGras) {
              root.classList.remove("mardi");
              localStorage.setItem('flicklet-mardi-gras', 'false');
              this.showNotification('🎭 Mardi Gras mode disabled', 'info');
            } else {
              root.classList.add("mardi");
              localStorage.setItem('flicklet-mardi-gras', 'true');
              this.showNotification('🎭 Mardi Gras mode enabled - Let the rainbow begin!', 'info');
            }
          } else {
            console.error('❌ appRoot element not found for Mardi Gras toggle');
          }
        },

        showNameModal() {
          const name = prompt('Enter your display name:');
          if (name && name.trim()) {
            this.appData.settings.displayName = name.trim();
            this.saveData();
            this.updateAccountButton();
            this.showNotification('Display name updated!', 'success');
          }
        },

        showSignOutModal() {
          if (!this.currentUser) return;
          
          const email = this.currentUser.email || 'Account';
          const displayName = this.appData.settings.displayName || email;
          
          // Create a simple modal for sign out
          const modal = document.createElement('div');
          modal.className = 'modal-backdrop';
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
          `;
          
          const modalContent = document.createElement('div');
          modalContent.className = 'modal';
          modalContent.style.cssText = `
            background: white;
            padding: 24px;
            border-radius: 12px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          `;
          
          modalContent.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #333;">Account</h3>
            <p style="margin: 0 0 20px 0; color: #666;">Signed in as <strong>${displayName}</strong></p>
            <p style="margin: 0 0 20px 0; color: #666;">Email: ${email}</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button id="signOutBtn" class="btn" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Sign Out</button>
              <button id="closeModalBtn" class="btn secondary" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Cancel</button>
            </div>
          `;
          
          modal.appendChild(modalContent);
          document.body.appendChild(modal);
          
          // Add event listeners
          const signOutBtn = modal.querySelector('#signOutBtn');
          const closeModalBtn = modal.querySelector('#closeModalBtn');
          
          signOutBtn.addEventListener('click', () => {
            if (typeof firebase !== 'undefined' && firebase.auth) {
              // Don't clear username from Firebase - let it persist for next login
              firebase.auth().signOut().then(() => {
                this.performSignOut();
                modal.remove();
              }).catch((error) => {
                console.error('Sign out error:', error);
                this.showNotification('Failed to sign out', 'error');
              });
            } else {
              // Fallback sign out
              this.performSignOut();
              modal.remove();
            }
          });
          
          closeModalBtn.addEventListener('click', () => {
            modal.remove();
          });
          
          // Close modal when clicking outside
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              modal.remove();
            }
          });
        },

        showNuclearOptionModal() {
          // Create a custom modal for nuclear option confirmation
          const modal = document.createElement('div');
          modal.className = 'modal-backdrop';
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
          `;
          
          const modalContent = document.createElement('div');
          modalContent.className = 'modal';
          modalContent.style.cssText = `
            background: var(--card);
            padding: 24px;
            border-radius: 12px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            border: 2px solid #dc3545;
          `;
          
          modalContent.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--text);">🗑️ Nuclear Option</h3>
            <p style="margin: 0 0 20px 0; color: var(--text-secondary); line-height: 1.5;">
              This will <strong>permanently delete</strong> all your TV shows, movies, and watchlists.<br>
              <span style="color: #dc3545; font-weight: bold;">This action cannot be undone!</span>
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button id="confirmNuclearBtn" class="btn danger" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Yes, Delete Everything</button>
              <button id="cancelNuclearBtn" class="btn secondary" style="background: var(--border); color: var(--text); border: 1px solid var(--border); padding: 10px 20px; border-radius: 6px; cursor: pointer;">Cancel</button>
            </div>
          `;
          
          modal.appendChild(modalContent);
          document.body.appendChild(modal);
          
          // Add event listeners
          const confirmBtn = modal.querySelector('#confirmNuclearBtn');
          const cancelBtn = modal.querySelector('#cancelNuclearBtn');
          
          confirmBtn.addEventListener('click', async () => {
            console.log('🗑️ User confirmed nuclear option');
            modal.remove();
            await this.performNuclearOption();
          });
          
          cancelBtn.addEventListener('click', () => {
            console.log('🗑️ User cancelled nuclear option');
            modal.remove();
          });
          
          // Close modal when clicking outside
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              modal.remove();
            }
          });
        },

        async performNuclearOption() {
          console.log('🗑️ Performing nuclear option - clearing all data');
          
          // Clear all data locally
          if (this.appData?.tv) {
            this.appData.tv = { watching: [], wishlist: [], watched: [] };
          }
          if (this.appData?.movies) {
            this.appData.movies = { watching: [], wishlist: [], watched: [] };
          }
          if (this.appData?.settings) {
            this.appData.settings.displayName = '';
          }
          
          // Save the cleared data locally first
          this.saveData();
          
          // Also clear data from Firebase if user is signed in
          if (this.currentUser && typeof firebase !== 'undefined' && firebase.firestore) {
            console.log('🗑️ Clearing data from Firebase as well');
            const db = firebase.firestore();
            const firebaseData = {
              watchlists: {
                tv: { watching: [], wishlist: [], watched: [] },
                movies: { watching: [], wishlist: [], watched: [] }
              },
              settings: {
                displayName: '',
                lang: this.appData?.settings?.lang || 'en',
                theme: this.appData?.settings?.theme || 'light',
                pro: false,
                notif: {}
              },
              lastUpdated: new Date()
            };
            
            try {
              await db.collection("users").doc(this.currentUser.uid).update(firebaseData);
              console.log('🗑️ Firebase data cleared successfully');
            } catch (error) {
              console.error('❌ Failed to clear Firebase data:', error);
              // If update fails (document doesn't exist), try set with merge
              console.log('🔄 Trying set with merge as fallback...');
              try {
                await db.collection("users").doc(this.currentUser.uid).set(firebaseData, { merge: true });
                console.log('🗑️ Firebase data cleared with set/merge fallback');
              } catch (fallbackError) {
                console.error('❌ Failed to clear Firebase data with fallback:', fallbackError);
              }
            }
          } else {
            console.log('🗑️ No Firebase user or Firebase not available, skipping cloud clear');
          }
          
          // Wait a moment for Firebase to process the update
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update UI - call multiple UI update functions to ensure everything refreshes
          this.updateLeftSideUsername();
          
          // Call the global updateUI function if available
          if (typeof updateUI === 'function') {
            console.log('🔄 Calling global updateUI function');
            updateUI();
          }
          
          // Force refresh all tab content by switching to current tab
          console.log('🔄 Refreshing current tab:', this.currentTab);
          this.switchTab(this.currentTab);
          
          // Also call the global switchToTab to ensure proper rendering
          if (typeof window.switchToTab === 'function') {
            console.log('🔄 Calling global switchToTab function');
            window.switchToTab(this.currentTab);
          }
          
          // Force refresh discover tab if it exists
          if (typeof renderDiscover === 'function') {
            console.log('🔄 Refreshing discover tab');
            renderDiscover();
          }
          
          // Show notification
          this.showNotification('All data cleared successfully (local and cloud)', 'warning');
          
          console.log('🗑️ Nuclear option completed');
          
          // Auto-refresh the page to show cleared data
          setTimeout(() => {
            console.log('🔄 Auto-refreshing page to show cleared data');
            window.location.reload();
          }, 1500); // 1.5 second delay to let user see the success message
        },

        clearUsernameFromFirebase() {
          return new Promise((resolve, reject) => {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
              try {
                const db = firebase.firestore();
                const user = firebase.auth().currentUser;
                if (user) {
                  console.log('🧹 Clearing username from Firebase before sign out...');
                  // Clear the username from Firebase
                  db.collection("users").doc(user.uid).update({
                    settings: {
                      displayName: "",
                      lang: this.appData?.settings?.lang || 'en',
                      theme: this.appData?.settings?.theme || 'light',
                      pro: false,
                      notif: {}
                    }
                  }).then(() => {
                    console.log('✅ Username cleared from Firebase');
                    resolve();
                  }).catch((error) => {
                    console.error('❌ Failed to clear username from Firebase:', error);
                    reject(error);
                  });
                } else {
                  console.log('⚠️ No user found for Firebase clearing');
                  resolve();
                }
              } catch (error) {
                console.error('❌ Error clearing username from Firebase:', error);
                reject(error);
              }
            } else {
              console.log('⚠️ Firebase not available for username clearing');
              resolve();
            }
          });
        },

        performSignOut() {
          console.log('🚪 Performing sign out cleanup...');
          
          // Clear user authentication state
          this.currentUser = null;
          
          // Clear user-specific data from centralized appData
          if (this.appData?.tv) {
            this.appData.tv = { watching: [], wishlist: [], watched: [] };
          }
          if (this.appData?.movies) {
            this.appData.movies = { watching: [], wishlist: [], watched: [] };
          }
          if (this.appData?.settings) {
            this.appData.settings.displayName = '';
          }
          
          // Clear the global appData that the existing system uses
          if (typeof appData !== 'undefined') {
            console.log('🧹 Clearing global appData...');
            appData.tv = { watching: [], wishlist: [], watched: [] };
            appData.movies = { watching: [], wishlist: [], watched: [] };
            appData.settings.displayName = '';
          }
          
          // Save the cleared data
          this.saveData();
          
          // Update the account button
          this.updateAccountButton();
          
          // Clear the username display
          this.updateLeftSideUsername();
          
          // Clear localStorage data
          localStorage.removeItem('flicklet-data');
          localStorage.removeItem('tvMovieTrackerData');
          localStorage.removeItem('flicklet-login-prompted');
          
          // Refresh the UI to show empty lists
          this.updateUI();
          
          // Call existing updateUI function if available to refresh tab counts
          if (typeof updateUI === 'function') {
            console.log('🔄 Calling existing updateUI to refresh tab counts');
            updateUI();
          }
          
          // Force refresh tab counts by calling existing functions
          if (typeof rebuildStats === 'function') {
            console.log('🔄 Calling rebuildStats to refresh tab counts');
            rebuildStats();
          }
          
          // Switch to home tab to show empty state
          this.switchTab('home');
          
          this.showNotification('Signed out successfully - All data cleared', 'success');
          console.log('✅ Sign out cleanup completed');
        },

        // Translation helper
        t(key) {
          const translations = {
            en: {
              signed_in: 'Signed in successfully',
              language_changed: 'Language changed',
              theme_changed: 'Theme changed',
              name_updated: 'Display name updated!'
            },
            es: {
              signed_in: 'Sesión iniciada exitosamente',
              language_changed: 'Idioma cambiado',
              theme_changed: 'Tema cambiado',
              name_updated: '¡Nombre de pantalla actualizado!'
            }
          };
          const lang = this.appData.settings.lang || 'en';
          return translations[lang] && translations[lang][key] ? translations[lang][key] : (translations.en[key] || key);
        }
      };

      // FlickletApp will be initialized after all functions are defined

// ===== SETTINGS FAB HARDENING FIX =====
// Ensure settings FAB never bubbles into other handlers
(() => {
  const btn = document.getElementById('settingsTab');
  if (!btn) return;

  // remove any old listeners you might have attached elsewhere
  btn.replaceWith(btn.cloneNode(true));
  const fresh = document.getElementById('settingsTab');

  fresh.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();   // <-- key: block global delegators
    if (window.FlickletApp?.switchTab) {
      window.FlickletApp.switchTab('settings');
    } else if (typeof self?.switchTab === 'function') {
      self.switchTab('settings');
    }
  }, { capture: true });    // <-- capture to preempt other listeners
})();

// Safety wrapper moved to inline-script-02.js after function definition

// Bind ONLY to the primary Share button; ignore anything else with "share" in id
(() => {
  const shareBtn = document.getElementById('shareListBtn');
  if (!shareBtn) return;

  // Remove any broad delegates you may have (optional safety)
  // document.removeEventListener('click', someOldShareHandler, true);

  shareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();           // do not let generic body handlers run
    if (typeof window.openShareSelectionModal === 'function') {
      window.openShareSelectionModal(e /* pass real event as origin */);
    }
  }, { capture: true });
})();

// Disable any leftover auto-onboarding / URL import while in Settings
(() => {
  const blockIfInSettings = () =>
    window.FlickletApp?.currentTab === 'settings';

  // Patch a common URL-import helper if present
  const tryImport = window.tryImportFromShareLink;
  if (typeof tryImport === 'function') {
    window.tryImportFromShareLink = function () {
      if (blockIfInSettings()) {
        console.debug('🛡️ Skipped URL share import on Settings.');
        return;
      }
      return tryImport.apply(this, arguments);
    };
  }

  // Note: openShareSelectionModal is already patched above with comprehensive safety system

  // Optional: suppress any one-time "onboard to share" prompt if it exists
  // by marking it complete. Safe no-op if you don't use it.
  try { localStorage.setItem('fw_share_onboarded', '1'); } catch (_) {}
})();

// Global safety net: Force close share modal when in settings (but allow legitimate user opens)
(() => {
  // Create a global tracker object
  window.shareModalInteractionTracker = {
    lastUserShareClick: 0,
    userIsInteractingWithModal: false
  };
  
  // Wait for DOM to be ready before setting up event listeners
  const setupShareButtonTracking = () => {
    // Track when user legitimately clicks share button
    const shareBtn = document.getElementById('shareListBtn');
    console.debug('🛡️ Looking for share button:', shareBtn);
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        window.shareModalInteractionTracker.lastUserShareClick = Date.now();
        window.shareModalInteractionTracker.userIsInteractingWithModal = true;
        console.debug('🛡️ User clicked share button, setting interaction flag', e);
      });
      console.debug('🛡️ Share button event listener added');
    } else {
      console.debug('🛡️ Share button not found!');
    }
  };
  
  // Set up immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupShareButtonTracking);
  } else {
    setupShareButtonTracking();
  }
  
  // Track when user interacts with the modal
  const setupModalTracking = () => {
    const shareModal = document.getElementById('shareSelectionModal');
    if (shareModal) {
      shareModal.addEventListener('click', () => {
        window.shareModalInteractionTracker.userIsInteractingWithModal = true;
      });
      
      // Reset interaction flag when modal is closed
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const isHidden = shareModal.style.display === 'none' || 
                            window.getComputedStyle(shareModal).display === 'none';
            if (isHidden) {
              window.shareModalInteractionTracker.userIsInteractingWithModal = false;
            }
          }
        });
      });
      observer.observe(shareModal, { attributes: true, attributeFilter: ['style'] });
    }
  };
  
  // Set up modal tracking with DOM ready check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupModalTracking);
  } else {
    setupModalTracking();
  }
  
  const forceCloseShareModal = () => {
    const shareModal = document.getElementById('shareSelectionModal');
    const timeSinceUserClick = Date.now() - window.shareModalInteractionTracker.lastUserShareClick;
    
    // Only close if we're in settings AND user is not actively interacting with modal
    // AND it's been more than 5 seconds since user clicked share
    if (shareModal && 
        window.FlickletApp?.currentTab === 'settings' && 
        !window.shareModalInteractionTracker.userIsInteractingWithModal && 
        timeSinceUserClick > 5000) {
      console.debug('🛡️ Global safety: Force closing share modal in Settings (no recent user interaction).');
      shareModal.style.setProperty('display', 'none', 'important');
      shareModal.classList.remove('active');
    }
  };
  
  // Run immediately and on any tab change
  forceCloseShareModal();
  
  // Also run periodically as a safety net (less frequently)
  setInterval(forceCloseShareModal, 5000);
})();
    