
      // Helper function for binding events
      function bind(id, fn) {
        const el = document.getElementById(id);
        if (el) {
          el.onclick = fn;
          return true;
        }
        return false;
      }

      // Loading skeletons helper
      window.Skeletons = {
        list: function(containerId, count = 6) {
          if (!window.FLAGS.skeletonsEnabled) return;
          
          const container = document.getElementById(containerId);
          if (!container) return;
          
          const skeletonHTML = Array(count).fill(0).map(() => `
            <div class="skel-card">
              <div class="skel"></div>
              <div class="skel"></div>
              <div class="skel"></div>
            </div>
          `).join('');
          
          container.innerHTML = skeletonHTML;
        },
        
        clear: function(containerId) {
          const container = document.getElementById(containerId);
          if (container) {
            container.innerHTML = '';
          }
        }
      };

      // FlickWord integration
      function initFlickWord() {
        const fwPlayBtn = document.getElementById('fwPlayBtn');
        const fwStreak = document.getElementById('fwStreak');
        const fwBest = document.getElementById('fwBest');
        const fwPlayed = document.getElementById('fwPlayed');
        const fwModal = document.getElementById('fwModal');
        const fwFrame = document.getElementById('fwFrame');
        const fwClose = document.getElementById('fwClose');
        
        if (!fwPlayBtn) return;
        
        // Update FlickWord panel metrics
        function updateFwPanel() {
          const stats = JSON.parse(localStorage.getItem('flickword:stats') || '{}');
          const lastPlay = localStorage.getItem('flickword:last');
          const today = new Date().toISOString().split('T')[0];
          
          fwStreak.textContent = stats.streak || 0;
          fwBest.textContent = stats.best || 0;
          fwPlayed.textContent = stats.played || 0;
        }
        
        // Play button handler
        fwPlayBtn.addEventListener('click', () => {
          const today = new Date().toISOString().split('T')[0];
          const url = `features/flickword-v2.html?date=${today}`;
          
          if (window.FLAGS.flickwordModalEnabled) {
            // Open in modal
            fwFrame.src = url;
            fwModal.style.display = 'block';
          } else {
            // Open in new tab
            window.open(url, '_blank');
          }
        });
        
        // Modal control handlers
        if (fwClose) {
          fwClose.addEventListener('click', () => {
            fwModal.style.display = 'none';
            fwFrame.src = '';
          });
        }

        const fwMinimize = document.getElementById('fwMinimize');
        const fwMaximize = document.getElementById('fwMaximize');
        const fwModalHeader = document.getElementById('fwModalHeader');
        const fwModalContent = fwModal.querySelector('.fw-modal-content');

        // Minimize handler
        if (fwMinimize) {
          fwMinimize.addEventListener('click', () => {
            fwModal.style.display = 'none';
            // Store state for restore
            fwModal.dataset.minimized = 'true';
          });
        }

        // Maximize handler
        if (fwMaximize) {
          fwMaximize.addEventListener('click', () => {
            if (fwModalContent.style.position === 'fixed') {
              // Restore
              fwModalContent.style.position = 'relative';
              fwModalContent.style.top = 'auto';
              fwModalContent.style.left = 'auto';
              fwModalContent.style.width = '95%';
              fwModalContent.style.height = '90%';
              fwMaximize.textContent = '□';
            } else {
              // Maximize
              fwModalContent.style.position = 'fixed';
              fwModalContent.style.top = '0';
              fwModalContent.style.left = '0';
              fwModalContent.style.width = '100%';
              fwModalContent.style.height = '100%';
              fwMaximize.textContent = '❐';
            }
          });
        }

        // Dragging functionality
        if (fwModalHeader) {
          let isDragging = false;
          let currentX;
          let currentY;
          let initialX;
          let initialY;
          let xOffset = 0;
          let yOffset = 0;

          fwModalHeader.addEventListener('mousedown', dragStart);
          document.addEventListener('mousemove', drag);
          document.addEventListener('mouseup', dragEnd);

          function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === fwModalHeader || fwModalHeader.contains(e.target)) {
              isDragging = true;
            }
          }

          function drag(e) {
            if (isDragging) {
              e.preventDefault();
              currentX = e.clientX - initialX;
              currentY = e.clientY - initialY;

              xOffset = currentX;
              yOffset = currentY;

              fwModalContent.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
          }

          function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
          }
        }
        
        // Listen for FlickWord results
        window.addEventListener('message', (event) => {
          if (event.data.type === 'flickword:result') {
            const { date, won, guesses } = event.data;
            const today = new Date().toISOString().split('T')[0];
            
            if (date === today) {
              updateFlickWordStats(today, won, guesses);
              
              // Close modal if open
              if (fwModal && fwModal.style.display === 'block') {
                fwModal.style.display = 'none';
                fwFrame.src = '';
              }
            }
          }
        });

        // Function to update FlickWord stats
        function updateFlickWordStats(date, won, guesses) {
          console.log('🔍 Updating FlickWord stats:', { date, won, guesses });
          
          const stats = JSON.parse(localStorage.getItem('flickword:stats') || '{}');
          stats.lastResult = won ? 'win' : 'miss';
          stats.lastGuesses = guesses;
          stats.played = (stats.played || 0) + 1;
          
          if (won) {
            stats.streak = (stats.streak || 0) + 1;
            stats.best = Math.max(stats.best || 0, stats.streak);
          } else {
            stats.streak = 0;
          }
          
          console.log('🔍 New stats:', stats);
          
          localStorage.setItem('flickword:last', date);
          localStorage.setItem('flickword:stats', JSON.stringify(stats));
          
          // Update panel
          updateFwPanel();
        }

        // Check for results from localStorage (for new tab games)
        function checkForNewResults() {
          const today = new Date().toISOString().split('T')[0];
          const results = JSON.parse(localStorage.getItem('flickword:results') || '{}');
          const lastPlay = localStorage.getItem('flickword:last');
          
          console.log('🔍 Checking for new results:', { today, lastPlay, results });
          
          // Check all dates in results, not just today
          for (const [date, result] of Object.entries(results)) {
            if (lastPlay !== date) {
              console.log('🔍 Found unprocessed result for date:', date, result);
              updateFlickWordStats(date, result.won, result.guesses);
            }
          }
        }
        
        // Initial update
        updateFwPanel();
        
        // Check for any unprocessed results
        checkForNewResults();
      }

      // Initialize FlickWord after DOM is ready
      setTimeout(initFlickWord, 100);

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

      // Only define FlickletApp if it doesn't already exist (new system takes precedence)
      if (!window.FlickletApp) {
        console.log('🚀 Creating FlickletApp object (fallback system)');
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
          
          // Check if the new system is available - if so, don't initialize the old system
          if (window.FlickletApp && window.FlickletApp !== this) {
            console.log('🔄 New FlickletApp detected, skipping old system initialization');
            return;
          }
          
          // Check if this is a class-based FlickletApp (new system)
          if (window.FlickletApp && typeof window.FlickletApp === 'function') {
            console.log('🔄 Class-based FlickletApp detected, skipping object-based initialization');
            return;
          }
          
          // Wait for DOM to be fully ready
          console.log('⏰ Setting up setTimeout for DOM ready...');
          setTimeout(() => {
            console.log('⏰ DOM ready timeout completed, setting up app...');
            this.loadData();
            this.applyTheme();
            this.applyLanguage();
            this.applyMardiGras(); // Apply Mardi Gras state
            // initFirebase() called in FlickletApp.init() - no need to call again
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
              console.log('🌍 this.runGlobalInitialization type:', typeof this.runGlobalInitialization);
              if (typeof this.runGlobalInitialization === 'function') {
                this.runGlobalInitialization();
              } else {
                console.error('❌ runGlobalInitialization method not available');
                // Fallback: set up search controls directly
                console.log('🔍 Setting up search controls (fallback)...');
                const searchBtn = document.getElementById("searchBtn");
                if (searchBtn) {
                  console.log('✅ Search button found (fallback), binding performSearch');
                  searchBtn.onclick = () => {
                    console.log('🔍 Search button clicked (fallback), calling performSearch');
                    if (typeof window.performSearch === 'function') {
                      window.performSearch();
                    } else {
                      console.error('❌ performSearch function not available');
                    }
                  };
                } else {
                  console.log('❌ Search button not found (fallback)');
                }
              }
            }, 500);
            
            console.log('✅ App initialized successfully');
            
                    // Initialize the left-side username display if username exists
        if (this.appData?.settings?.displayName) {
          console.log('🆕 Initializing left-side username display');
          this.updateLeftSideUsername();
        }

        // Initialize FlickWord integration
        this.initializeFlickWord();
        
        // Show welcome message for new users - DISABLED
        // this.showWelcomeMessage();
            
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
              if (window.FlickletAppInstance && typeof window.FlickletAppInstance.showSignInModal === 'function') {
                console.log('✅ FlickletAppInstance.showSignInModal function available, calling it');
                window.FlickletAppInstance.showSignInModal();
              } else if (window.FlickletApp && typeof window.FlickletApp.showSignInModal === 'function') {
                console.log('✅ FlickletApp.showSignInModal function available, calling it');
                window.FlickletApp.showSignInModal();
              } else {
                console.error('❌ FlickletApp.showSignInModal function not available');
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

                // Clean undefined values from data before saving
                const cleanData = (obj) => {
                  if (obj === null || obj === undefined) return null;
                  if (typeof obj !== 'object') return obj;
                  if (Array.isArray(obj)) {
                    return obj.map(cleanData).filter(item => item !== undefined);
                  }
                  const cleaned = {};
                  for (const [key, value] of Object.entries(obj)) {
                    if (value !== undefined) {
                      cleaned[key] = cleanData(value);
                    }
                  }
                  return cleaned;
                };

                const payload = {
                  lastLoginAt: new Date(),
                  // Save watchlists data
                  watchlists: {
                    tv: cleanData(this.appData.tv || { watching: [], wishlist: [], watched: [] }),
                    movies: cleanData(this.appData.movies || { watching: [], wishlist: [], watched: [] })
                  },
                  // only include settings if it has keys (avoid writing empty maps)
                  ...(Object.keys(mergedSettings).length ? { settings: cleanData(mergedSettings) } : {}),
                  // Preserve root displayName if it exists (for Google login)
                  ...(existing.displayName && { displayName: existing.displayName }),
                  // Preserve the entire profile object to prevent it from being cleared (for Email login)
                  ...(existing.profile && { profile: cleanData(existing.profile) })
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
            searchBtn.onclick = () => {
              console.log('🔍 Search button clicked, calling performSearch');
              console.log('🔍 Search input value:', document.getElementById("searchInput")?.value);
              if (typeof window.performSearch === 'function') {
                window.performSearch();
              } else {
                console.error('❌ performSearch function not available');
                console.log('🔍 Available window functions:', Object.keys(window).filter(k => k.includes('search') || k.includes('Search')));
              }
            };
          } else {
            console.log('❌ Search button not found');
          }
          
          const clearSearchBtn = document.getElementById("clearSearchBtn");
          if (clearSearchBtn) {
            console.log('✅ Clear search button found, binding clearSearch');
            clearSearchBtn.onclick = () => {
              console.log('🧹 Clear search button clicked');
              if (typeof window.clearSearch === 'function') {
                window.clearSearch();
              } else {
                console.error('❌ clearSearch function not available');
              }
            };
          } else {
            console.log('❌ Clear search button not found');
          }
          
          const searchInput = document.getElementById("searchInput");
          if (searchInput) {
            console.log('✅ Search input found, adding keydown listener');
            searchInput.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                console.log('⌨️ Enter key pressed, calling performSearch');
                if (typeof window.performSearch === 'function') {
                  window.performSearch();
                } else {
                  console.error('❌ performSearch function not available');
                }
              }
            });
          } else {
            console.log('❌ Search input not found');
          }
          
          // STEP 3.2c — Attach this delegate ONCE and add de-dup guards
          if (!window.__inline01ActionsBound) {
            window.__inline01ActionsBound = true;
            console.log('🎯 Setting up event delegation for card actions (inline-01)…');
          } else {
            console.log('↩︎ Delegate already bound — skipping rebind');
            return;
          }

          // short-window dedupe for addFromCache: ignore second call within 600ms
          const __recentAdds = new Map(); // key `${id}|${list}` -> ts
          function __isDupAdd(id, list) {
            const key = `${id}|${list}`;
            const now = Date.now();
            const last = __recentAdds.get(key) || 0;
            __recentAdds.set(key, now);
            // garbage collect occasionally
            if (__recentAdds.size > 200) {
              for (const [k, ts] of __recentAdds) if (now - ts > 2000) __recentAdds.delete(k);
            }
            return (now - last) < 600;
          }

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
              // Per-button re-entrancy guard
              if (btn.dataset.busy === '1') { 
                console.debug('⏸️ addFromCache ignored (busy)'); 
                return; 
              }
              btn.dataset.busy = '1';
              setTimeout(() => { btn.dataset.busy = '0'; }, 650);

              // Short-window duplicate guard (same id+list)
              if (__isDupAdd(String(id), String(list))) {
                console.debug('⏭️ addFromCache duplicate suppressed');
                return;
              }
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
              console.log('🗑️ Remove clicked — optimistic UI');
              // Find the visual card and its list container
              const card = btn.closest('.show-card,.list-card,.curated-card,.card');
              const listId =
                (btn.getAttribute('data-list') || btn.dataset.list) ||
                (card && card.closest('#watchingList,#wishlistList,#watchedList')?.id) ||
                window.FlickletApp?.currentTab || null;

              // Optimistically remove the card from the DOM
              let parentForRestore = null;
              let nextSiblingForRestore = null;
              if (card) {
                parentForRestore = card.parentNode;
                nextSiblingForRestore = card.nextSibling;
                card.remove();
              }

              try {
                // Update data store
                removeItemFromCurrentList(id);
                // Recount the badge if our helper exists
                if (typeof window.updateCount === 'function' && listId) {
                  const sel = listId.startsWith('#') ? listId : ('#' + listId);
                  try { window.updateCount(sel); } catch (_) {}
                }
                // If the current tab is visible and you've got a renderer, trigger it to stay fresh
                if (typeof window.updateTabContent === 'function' && listId) {
                  try { window.updateTabContent(listId.replace('List','')); } catch (_) {}
                } else if (typeof window.FlickletApp?.updateTabContent === 'function' && listId) {
                  try { window.FlickletApp.updateTabContent(window.FlickletApp.currentTab); } catch (_) {}
                }
              } catch (e) {
                console.error('Remove failed, restoring card', e);
                // Put the card back if something failed
                if (parentForRestore && card) {
                  if (nextSiblingForRestore) parentForRestore.insertBefore(card, nextSiblingForRestore);
                  else parentForRestore.appendChild(card);
                }
              }
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
          console.log(`🌍 FlickletApp.changeLanguage delegating to LanguageManager: ${newLang}`);
          
          // Delegate to centralized LanguageManager
          if (window.LanguageManager) {
            return window.LanguageManager.changeLanguage(newLang);
          } else {
            console.warn('🌍 LanguageManager not available, using fallback');
            // Fallback to basic language change
            if (this.appData?.settings) {
              this.appData.settings.lang = newLang;
            }
            if (window.appData?.settings) {
              window.appData.settings.lang = newLang;
            }
            this.applyLanguage();
            if (typeof applyTranslations === 'function') {
              applyTranslations(newLang);
            }
          }
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
          
          // Show the current tab and add active class to it
          if (currentTabId) {
            const currentTab = document.getElementById(currentTabId);
            if (currentTab) {
              currentTab.classList.remove('hidden');
              currentTab.classList.add('active');
              console.log(`✅ Activated current tab: ${currentTabId}`);
            }
            
            // Remove active class from all other tabs
            allTabButtons.forEach(tabId => {
              if (tabId !== currentTabId) {
                const tab = document.getElementById(tabId);
                if (tab) {
                  tab.classList.remove('active');
                  console.log(`🔘 Reset tab button: ${tabId}`);
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

        
        // UI Helper Functions
        setAccountButtonLabel(displayName) {
          const accountBtn = document.getElementById('accountBtn');
          if (accountBtn) {
            const email = this.currentUser?.email || 'Account';
            const emailPrefix = email.split('@')[0];
            // Use displayName if provided, otherwise fall back to email prefix
            const finalName = displayName || emailPrefix || 'User';
            accountBtn.innerHTML = `👤 ${finalName}`;
            accountBtn.title = `Signed in as ${email}. Click to sign out.`;
            console.log('🔍 Account button updated:', { displayName, finalName, email });
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
        
        escapeHtml(text) {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        },
        
        async promptForUsernameOnce(suggest='') {
          return new Promise((resolve) => {
            const body = this.openModal('What should we call you?', `
              <div style="min-width:280px">
                <label for="usernameInput" style="font-weight:600">Your handle</label>
                <input id="usernameInput" type="text" autocomplete="nickname" value="${suggest.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]))}" style="display:block;width:100%;padding:10px;border:1px solid var(--color-border);border-radius:8px;margin-top:8px">
                <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
                  <button id="uCancel" class="btn secondary" type="button">Skip</button>
                  <button id="uSave" class="btn primary" type="button">Save</button>
                </div>
              </div>
            `, 'username-modal');

            // tag so it's distinct from login modal
            const wrap = document.querySelector('.modal-backdrop[data-testid="username-modal"]');
            if (wrap) wrap.setAttribute('data-modal','username');

            const input  = document.getElementById('usernameInput');
            const save   = document.getElementById('uSave');
            const cancel = document.getElementById('uCancel');
            const done = (v) => { document.querySelectorAll('.modal-backdrop[data-modal="username"]').forEach(n=>n.remove()); resolve(v); };

            cancel?.addEventListener('click', () => done(null));
            save?.addEventListener('click', () => done((input?.value || '').trim()));
            input?.addEventListener('keydown', e => { if (e.key === 'Enter') save.click(); });
            setTimeout(()=>input?.focus(), 0);
          });
        },

        clearExistingUsernameModals() {
          // Clear any existing username prompt modals
          const existingModals = document.querySelectorAll('.modal-backdrop[data-modal="username-prompt-modal"]');
          existingModals.forEach(modal => {
            console.log('🧹 Clearing existing username prompt modal');
            modal.remove();
          });
        },

        // Firestore settings helpers
        settingsDoc(uid) {
          return firebase.firestore().doc(`users/${uid}/meta/settings`);
        },
        
        async readSettings(uid) {
          const snap = await this.settingsDoc(uid).get();
          return snap.exists ? snap.data() : {};
        },
        
        async writeSettings(uid, data) {
          await this.settingsDoc(uid).set(data, { merge: true });
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
            console.log('No displayName field to remove:', e.message);
          }
        },

        // initFirebase() removed - handled by FlickletApp.initFirebase()

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
            
            // Remove any existing event listeners to prevent duplicates
            const newBtn = accountBtn.cloneNode(true);
            accountBtn.parentNode.replaceChild(newBtn, accountBtn);
            
            const self = this; // Preserve 'this' context
            newBtn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔐 Account button clicked, currentUser:', self.currentUser);
              console.log('🔍 FlickletApp instance:', self);
              console.log('🔍 showSignOutModal function:', typeof self.showSignOutModal);
              
              if (self.currentUser) {
                // User is signed in, show sign out modal
                console.log('👤 User signed in, showing sign out modal');
                try {
                  self.showSignOutModal();
                  console.log('✅ showSignOutModal called successfully');
                } catch (error) {
                  console.error('❌ Error calling showSignOutModal:', error);
                }
              } else {
                // User is not signed in, show sign in modal
                console.log('🔑 User not signed in, showing sign in modal');
                console.log('🔍 FlickletApp instance available:', !!window.FlickletAppInstance);
                if (window.FlickletAppInstance && typeof window.FlickletAppInstance.showSignInModal === 'function') {
                  console.log('✅ Calling FlickletAppInstance.showSignInModal');
                  window.FlickletAppInstance.showSignInModal();
                } else if (window.FlickletApp && typeof window.FlickletApp.showSignInModal === 'function') {
                  console.log('✅ Calling FlickletApp.showSignInModal');
                  window.FlickletApp.showSignInModal();
                } else {
                  console.error('❌ FlickletApp.showSignInModal function not available');
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
          console.log('🚪 showSignOutModal called, currentUser:', this.currentUser);
          if (!this.currentUser) {
            console.log('❌ No current user, cannot show sign out modal');
            return;
          }
          
          const email = this.currentUser.email || 'Account';
          const displayName = this.appData.settings.displayName || email;
          console.log('👤 Sign out modal for:', { email, displayName });
          
          // Create a simple modal for sign out
          const modal = document.createElement('div');
          modal.className = 'modal-backdrop';
          modal.style.cssText = `
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
            <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">Account</h3>
            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Signed in as <strong>${displayName}</strong></p>
            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Email: ${email}</p>
            <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
              <button id="signOutBtn" class="btn" style="background: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">Sign Out</button>
              <button id="closeModalBtn" class="btn secondary" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px;">Cancel</button>
            </div>
          `;
          
          modal.appendChild(modalContent);
          document.body.appendChild(modal);
          console.log('✅ Sign out modal created and added to DOM');
          
          // Force visibility immediately after creation
          modal.style.visibility = 'visible';
          modal.style.opacity = '1';
          modal.style.display = 'flex';
          
          // Additional debugging to check modal visibility
          setTimeout(() => {
            const rect = modal.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(modal);
            console.log('🔍 Modal visibility check:', {
              rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
              display: computedStyle.display,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity,
              zIndex: computedStyle.zIndex,
              position: computedStyle.position
            });
            
            // If modal is not visible, try a different approach
            if (rect.width === 0 || rect.height === 0 || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
              console.log('⚠️ Modal appears to be invisible, trying alternative approach');
              modal.style.display = 'flex !important';
              modal.style.visibility = 'visible !important';
              modal.style.opacity = '1 !important';
              modal.style.position = 'fixed !important';
              modal.style.top = '0 !important';
              modal.style.left = '0 !important';
              modal.style.width = '100vw !important';
              modal.style.height = '100vh !important';
              modal.style.zIndex = '99999 !important';
              modal.style.background = 'rgba(0,0,0,0.8) !important';
              
              // If still not visible, try using the existing modal system
              setTimeout(() => {
                const newRect = modal.getBoundingClientRect();
                if (newRect.width === 0 || newRect.height === 0) {
                  console.log('⚠️ Custom modal still not visible, trying existing modal system');
                  modal.remove();
                  
                  // Use the existing showSignInModal system but modify it for sign out
                  if (window.FlickletAppInstance && typeof window.FlickletAppInstance.showSignInModal === 'function') {
                    // Create a simple confirmation dialog
                    const confirmed = confirm(`Sign out as ${displayName}?\n\nEmail: ${email}`);
                    if (confirmed) {
                      console.log('🔥 User confirmed sign out via alert');
                      if (typeof firebase !== 'undefined' && firebase.auth) {
                        firebase.auth().signOut().then(() => {
                          console.log('✅ Firebase sign out successful via alert');
                          this.performSignOut();
                        }).catch((error) => {
                          console.error('❌ Firebase sign out error via alert:', error);
                          this.showNotification('Failed to sign out', 'error');
                        });
                      } else {
                        console.log('⚠️ Firebase not available, using fallback sign out via alert');
                        this.performSignOut();
                      }
                    }
                  }
                }
              }, 200);
            }
          }, 100);
          
          // Add event listeners
          const signOutBtn = modal.querySelector('#signOutBtn');
          const closeModalBtn = modal.querySelector('#closeModalBtn');
          console.log('🔍 Modal buttons found:', { signOutBtn: !!signOutBtn, closeModalBtn: !!closeModalBtn });
          
          signOutBtn.addEventListener('click', () => {
            console.log('🚪 Sign out button clicked');
            if (typeof firebase !== 'undefined' && firebase.auth) {
              console.log('🔥 Firebase available, calling firebase.auth().signOut()');
              // Don't clear username from Firebase - let it persist for next login
              firebase.auth().signOut().then(() => {
                console.log('✅ Firebase sign out successful');
                this.performSignOut();
                modal.remove();
              }).catch((error) => {
                console.error('❌ Firebase sign out error:', error);
                this.showNotification('Failed to sign out', 'error');
              });
            } else {
              console.log('⚠️ Firebase not available, using fallback sign out');
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
          // Also clear the global currentUser for compatibility
          if (typeof window !== 'undefined') {
            window.currentUser = null;
          }
          
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
      } // End of if (!window.FlickletApp) check

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

// === MP-ShareModalSanity (guarded) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.shareModalSanityEnabled === false) {
    console.log('🛡️ ShareModalSanity disabled via FLAGS.shareModalSanityEnabled=false');
    return;
  }
  if (window.__shareModalSanityBound) return;
  window.__shareModalSanityBound = true;

  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  function initShareModalSanity() {
    const opener = qs('#shareOpenBtn');
    const modal  = qs('#shareSelectionModal');          // expected .modal-backdrop
    const dialog = modal ? qs('.modal', modal) : null;  // Fixed: use .modal instead of .modal-dialog

    if (!opener || !modal || !dialog) {
      console.warn('🛡️ ShareModalSanity: missing elements, retrying...', { 
        hasOpener: !!opener, 
        hasModal: !!modal, 
        hasDialog: !!dialog,
        openerId: opener?.id,
        modalId: modal?.id,
        dialogClass: dialog?.className
      });
      // Add a maximum retry limit to prevent infinite loops
      if (window.__shareModalRetryCount >= 10) {
        console.error('🛡️ ShareModalSanity: Max retries reached, giving up');
        return;
      }
      window.__shareModalRetryCount = (window.__shareModalRetryCount || 0) + 1;
      setTimeout(initShareModalSanity, 100);
      return;
    }

    console.log('🛡️ ShareModalSanity: elements found, initializing...');
    
    // Reset retry counter on success
    window.__shareModalRetryCount = 0;

    // A11y attributes (idempotent)
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    if (!dialog.id) dialog.id = 'shareDialog';
    modal.setAttribute('aria-labelledby', dialog.id);
    modal.setAttribute('aria-hidden', 'true');
    modal.dataset.open = 'false';

    let lastActive = null;

    function getFocusable(container) {
      return qsa([
        'a[href]:not([tabindex="-1"])',
        'button:not([disabled]):not([tabindex="-1"])',
        'input:not([disabled]):not([tabindex="-1"])',
        'select:not([disabled]):not([tabindex="-1"])',
        'textarea:not([disabled]):not([tabindex="-1"])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(','), container).filter(el => el.offsetParent !== null || el === document.activeElement);
    }

    function openModalSafe() {
      // Safety: don't open over settings tab (matches existing behavior)
      if (window.currentActiveTab === 'settings') {
        console.log('🛡️ ShareModalSanity: blocking open on settings tab');
        return;
      }
      lastActive = document.activeElement || opener;
      document.body.classList.add('modal-open');

      // Use the existing display method but also set our attributes
      modal.style.display = 'flex';
      modal.dataset.open = 'true';
      modal.setAttribute('aria-hidden', 'false');

      // Focus trap to first focusable
      const f = getFocusable(modal);
      (f[0] || dialog).focus({ preventScroll: true });

      // Key handler
      window.addEventListener('keydown', onKeyDown, { passive: false });
    }

    function closeModalSafe() {
      // Use the existing display method but also set our attributes
      modal.style.display = 'none';
      modal.dataset.open = 'false';
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown, { passive: false });
      // return focus
      (lastActive || opener)?.focus({ preventScroll: true });
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModalSafe();
        return;
      }
      if (e.key === 'Tab') {
        const f = getFocusable(modal);
        if (!f.length) return;
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey) {
          if (i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        } else {
          if (i === f.length - 1) { e.preventDefault(); f[0].focus(); }
        }
      }
    }

    // Backdrop click to close (but ignore clicks inside dialog)
    modal.addEventListener('mousedown', (e) => {
      if (e.target === modal) closeModalSafe();
    });

    // Respect existing open/close functions if they exist, otherwise wire opener directly
    const hasExistingOpen  = typeof window.openShareSelectionModal === 'function';
    const hasExistingClose = typeof window.closeShareSelectionModal === 'function';

    if (hasExistingOpen && !window.__shareModalOpenWrapped) {
      const prevOpen = window.openShareSelectionModal;
      window.openShareSelectionModal = function(...args) {
        try { prevOpen.apply(this, args); } catch(e) { console.error(e); }
        openModalSafe(); // enforce a11y + trap + scroll lock
      };
      window.__shareModalOpenWrapped = true;
    }

    if (hasExistingClose && !window.__shareModalCloseWrapped) {
      const prevClose = window.closeShareSelectionModal;
      window.closeShareSelectionModal = function(...args) {
        try { prevClose.apply(this, args); } catch(e) { console.error(e); }
        closeModalSafe();
      };
      window.__shareModalCloseWrapped = true;
    }

    // Direct binding as a fallback (if no existing open function bound)
    if (!hasExistingOpen) {
      opener.addEventListener('click', openModalSafe, { passive: true });
    }

    // Safety: auto-close on tab switches
    const closeOnTabSwitch = () => { if (modal.dataset.open === 'true') closeModalSafe(); };
    window.addEventListener('tabchange', closeOnTabSwitch);
    // Also observe mutations on the tab container if needed (optional)

    console.log('🛡️ ShareModalSanity initialized');
  }

  // Start initialization - DISABLED to prevent console spam
  // initShareModalSanity();
})();

// === MP-CondensedModeHardening (guarded) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.condensedModeFeatureEnabled === false) {
    console.log('🧪 CondensedModeHardening disabled via flag');
    return;
  }
  if (window.__condensedModeBound) return;
  window.__condensedModeBound = true;

  const STORAGE_KEY = 'flicklet:condensed';

  const getPersisted = () => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  };
  const persist = (v) => {
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0'); } catch {}
    // Mirror to app settings if available (non-fatal)
    try {
      if (window.FlickletApp?.settings) {
        window.FlickletApp.settings.condensed = !!v;
        if (typeof window.FlickletApp.saveSettings === 'function') {
          window.FlickletApp.saveSettings();
        }
      }
    } catch {}
  };

  function applyCondensed(v) {
    document.body.classList.toggle('condensed-v1', !!v);
    console.log(`🧪 Condensed mode ${v ? 'ON' : 'OFF'}`);
  }

  // Initialize from persisted state
  const initial = getPersisted();
  applyCondensed(initial);

  // Expose a safe toggle for other code/tests
  window.setCondensedMode = function setCondensedMode(v) {
    applyCondensed(!!v);
    persist(!!v);
  };

  // Hotkey for dev convenience: Alt+D toggles condensed
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'd' || e.key === 'D')) {
      window.setCondensedMode(!document.body.classList.contains('condensed-v1'));
    }
  }, { passive: true });

  // Inject a Settings row if a container exists (progressive enhancement)
  function injectCondensedSettings() {
    try {
      // Look for the settings section or any existing card to inject into
      const settingsSection = document.getElementById('settingsSection');
      if (settingsSection) {
        // Remove existing condensed row if it exists (in case it's in wrong position)
        const existingRow = document.getElementById('condensedRow');
        if (existingRow) {
          existingRow.remove();
        }
        console.log('🧪 Injecting condensed mode settings...');
        
        // Create a new card for condensed mode settings
        const card = document.createElement('div');
        card.id = 'condensedRow';
        card.className = 'card';
        card.innerHTML = `
          <h4>📐 Display Settings</h4>
          <p style="margin: 0 0 15px 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">
            Adjust the display density of your TV show and movie cards for a more compact view.
          </p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="condensedToggle" ${initial ? 'checked' : ''} aria-label="Enable condensed mode">
              <span>Enable condensed mode</span>
            </label>
          </div>
        `;
        
        // Insert after the Pro Tier card (before Data Tools)
        const allCards = settingsSection.querySelectorAll('.card');
        let insertAfterCard = null;
        
        // Find the Pro Tier card
        for (let i = 0; i < allCards.length; i++) {
          const h4 = allCards[i].querySelector('h4');
          if (h4 && h4.textContent.includes('Pro Tier')) {
            insertAfterCard = allCards[i];
            break;
          }
        }
        
        if (insertAfterCard) {
          // Insert after the Pro Tier card
          insertAfterCard.parentNode.insertBefore(card, insertAfterCard.nextSibling);
        } else {
          // Look for Data Tools card as fallback
          for (let i = 0; i < allCards.length; i++) {
            const h4 = allCards[i].querySelector('h4');
            if (h4 && h4.textContent.includes('Data Tools')) {
              allCards[i].parentNode.insertBefore(card, allCards[i]);
              break;
            }
          }
          
          // Final fallback: append to the end of settings section
          if (!card.parentNode) {
            settingsSection.appendChild(card);
          }
        }
        
        card.querySelector('#condensedToggle').addEventListener('change', (e) => {
          window.setCondensedMode(e.target.checked);
        }, { passive: true });
        
        console.log('🧪 Condensed mode settings injected successfully');
      } else if (!settingsSection) {
        console.log('🧪 Settings section not found, will retry...');
      } else {
        console.log('🧪 Condensed mode settings already exist');
      }
    } catch (e) {
      console.warn('Failed to inject condensed mode settings:', e);
    }
  }

  // Try to inject immediately
  console.log('🧪 Attempting initial injection...');
  injectCondensedSettings();
  
  // Also try when DOM is ready and on window load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🧪 DOMContentLoaded - attempting injection...');
      injectCondensedSettings();
    });
  }
  window.addEventListener('load', () => {
    console.log('🧪 Window load - attempting injection...');
    injectCondensedSettings();
  });
  
  // Also try when settings tab is clicked or when switchToTab is called
  const settingsTab = document.getElementById('settingsTab');
  if (settingsTab) {
    settingsTab.addEventListener('click', () => {
      setTimeout(injectCondensedSettings, 100);
    });
  }
  
  // Hook into the global switchToTab function to detect when settings is shown
  const originalSwitchToTab = window.switchToTab;
  if (typeof originalSwitchToTab === 'function') {
    window.switchToTab = function(tabName) {
      const result = originalSwitchToTab.call(this, tabName);
      if (tabName === 'settings') {
        console.log('🧪 Settings tab switched - attempting injection...');
        setTimeout(injectCondensedSettings, 200);
      }
      return result;
    };
  }
  
  // Also use MutationObserver to watch for settings section visibility changes
  const settingsSection = document.getElementById('settingsSection');
  if (settingsSection) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const isVisible = settingsSection.style.display !== 'none';
          if (isVisible) {
            console.log('🧪 Settings section became visible - attempting injection...');
            setTimeout(injectCondensedSettings, 100);
          }
        }
      });
    });
    observer.observe(settingsSection, { attributes: true, attributeFilter: ['style'] });
  }

  // ARIA normalizer: ensure icon-only buttons speak
  function labelButton(btn) {
    if (btn.hasAttribute('aria-label')) return;
    const fromData = btn.getAttribute('data-label');
    const fromTitle = btn.getAttribute('title');
    // Derive from text content if it seems meaningful
    const fromText = (btn.textContent || '').trim();
    const label = fromData || fromTitle || (fromText && fromText.length <= 28 ? fromText : null);
    if (label) btn.setAttribute('aria-label', label);
  }

  function normalizeAria(root = document) {
    // Heuristic: common card/action buttons
    const candidates = root.querySelectorAll([
      '.show-actions button',
      '.show-actions .btn',
      '.toolbar .btn',
      'button.icon-btn',
      'button[aria-label]:not([aria-label=""])' // keep existing
    ].join(','));
    candidates.forEach((btn) => labelButton(btn));
    // Mark decorative icons
    root.querySelectorAll('.show-card .show-title [class*="icon"], .show-card .show-title span[role="img"]')
      .forEach(n => n.setAttribute('aria-hidden', 'true'));
  }

  // Initial pass & on dynamic updates (if your app dispatches a known event)
  normalizeAria();
  window.addEventListener('cards:rendered', () => normalizeAria(), { passive: true });

  console.log('🧪 CondensedModeHardening initialized');
  console.log('🧪 Feature flag enabled:', FLAGS.condensedModeFeatureEnabled);
  console.log('🧪 Initial condensed state:', initial);
  console.log('🧪 Settings section exists:', !!document.getElementById('settingsSection'));
  console.log('🧪 Condensed row already exists:', !!document.getElementById('condensedRow'));
})();

// === MP-StickySafeAreas (guarded) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.safeAreasSanityEnabled === false) {
    console.log('🧭 SafeAreasSanity disabled via flag');
    return;
  }
  if (window.__safeAreasSanityBound) return;
  window.__safeAreasSanityBound = true;

  const supportsSafeArea = (() => {
    try {
      return CSS.supports('padding-bottom: env(safe-area-inset-bottom)');
    } catch { return false; }
  })();

  if (supportsSafeArea) {
    document.body.classList.add('supports-safe-area');
  }

  // Dev-only sticky ancestor probe: read-only, warns if something can break sticky.
  // Does NOT modify styles; safe to leave in prod as a console warning.
  try {
    const sticky = document.querySelector('.top-search');
    if (sticky) {
      let n = sticky.parentElement;
      while (n && n !== document.body) {
        const cs = getComputedStyle(n);
        const badOverflow = cs.overflow !== 'visible' && cs.overflow !== 'clip';
        const badTransform = cs.transform && cs.transform !== 'none';
        const hasContain = cs.contain && cs.contain !== 'none';
        if (badOverflow || badTransform || hasContain) {
          console.warn('⚠️ StickySearch risk: ancestor may break position:sticky', {
            node: n,
            overflow: cs.overflow,
            transform: cs.transform,
            contain: cs.contain
          });
          break; // one warning is enough
        }
        n = n.parentElement;
      }
    }
  } catch (e) {
    console.debug('SafeAreasSanity probe skipped:', e);
  }

  console.log('🧭 SafeAreasSanity initialized', { supportsSafeArea });
})();

// === MP-A11Y-Polish (guarded) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.a11yPolishEnabled === false) {
    console.log('♿ A11Y polish disabled via flag');
    return;
  }
  if (window.__a11yPolishBound) return;
  window.__a11yPolishBound = true;

  document.body.classList.add('a11y-v1');

  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function deriveLabel(btn) {
    if (btn.hasAttribute('aria-label') && btn.getAttribute('aria-label').trim()) return null;
    const fromData  = btn.getAttribute('data-label');
    const fromTitle = btn.getAttribute('title');
    const txt       = (btn.textContent || '').trim();
    // Prefer explicit data/tooltip; fall back to short text
    return fromData || fromTitle || (txt && txt.length <= 28 ? txt : null);
  }

  function normalizeButtons(root = document) {
    // Likely interactive targets across the app
    const candidates = qsa([
      'button',
      '.btn',
      '.show-actions button',
      '.toolbar .btn',
      '[role="button"]'
    ].join(','), root);

    for (const el of candidates) {
      const label = deriveLabel(el);
      if (label) el.setAttribute('aria-label', label);

      // Ensure focusability is not removed: if tabindex is set, keep it >=0
      if (el.hasAttribute('tabindex') && Number(el.getAttribute('tabindex')) < 0) {
        el.removeAttribute('tabindex');
      }
    }

    // Mark decorative icons inside titles/chips as hidden
    qsa('.show-card .show-title [class*="icon"], .show-card .show-title span[role="img"], .show-card .show-meta [class*="icon"]', root)
      .forEach(n => n.setAttribute('aria-hidden', 'true'));
  }

  // Initial pass
  normalizeButtons();

  // Re-run after dynamic card renders, if app dispatches such an event
  window.addEventListener('cards:rendered', () => normalizeButtons(), { passive: true });

  console.log('♿ A11Y polish initialized');
})();

// === MP-NotifEngineCore (guarded, no-push) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.notifEngineEnabled === false) {
    console.log('🔔 NotifEngineCore disabled via flag');
    return;
  }
  if (window.__notifEngineBound) return;
  window.__notifEngineBound = true;

  const STORAGE_ON_KEY = 'flicklet:notif:on';
  const STORAGE_SEEN_KEY = 'flicklet:notif:seen';

  // Read/persist settings - integrate with existing app settings
  const isOn = () => {
    try { 
      // First check existing app settings
      const appData = window.appData || window.FlickletApp?.data;
      if (appData?.settings?.notif?.episodes !== undefined) {
        return !!appData.settings.notif.episodes;
      }
      // Fallback to localStorage
      return localStorage.getItem(STORAGE_ON_KEY) !== '0'; 
    } catch { return true; }
  };
  const setOn = (v) => {
    try { 
      localStorage.setItem(STORAGE_ON_KEY, v ? '1' : '0'); 
      
      // Mirror to existing app settings structure
      const appData = window.appData || window.FlickletApp?.data;
      if (appData?.settings) {
        if (!appData.settings.notif) appData.settings.notif = {};
        appData.settings.notif.episodes = !!v;
        
        // Save using existing save function
        if (typeof window.saveAppData === 'function') {
          window.saveAppData();
        }
      }
    } catch {}
  };

  const getSeen = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_SEEN_KEY) || '{}'); } catch { return {}; }
  };
  const setSeen = (obj) => {
    try { localStorage.setItem(STORAGE_SEEN_KEY, JSON.stringify(obj)); } catch {}
  };

  // Utilities
  const hoursUntil = (when) => (when.getTime() - Date.now()) / 36e5;
  function parseAirDateLocal(show, ep) {
    // TMDB often provides YYYY-MM-DD without time. Default to 20:00 local.
    const raw = (ep && (ep.air_date || ep.first_air_date)) || show.first_air_date || null;
    if (!raw) return null;
    const [y, m, d] = raw.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 20, 0, 0, 0); // 8pm local default
  }
  const safeTitle = (show, ep) => {
    const t = show.name || show.title || 'Unknown';
    const sn = ep?.season_number, en = ep?.episode_number;
    return sn != null && en != null ? `${t} S${sn}E${en}` : t;
  };
  const epKey = (show, ep) => {
    if (ep?.id != null) return `ep:${ep.id}`;
    const mt = show.media_type || (show.first_air_date ? 'tv' : 'movie');
    return `ep:${mt}:${show.id}:S${ep?.season_number || '?'}:E${ep?.episode_number || '?'}`;
  };

  function findCandidates() {
    const data = (window.FlickletApp?.data) || window.appData || {};
    const tvWatching = data?.tv?.watching || [];
    const list = [];
    for (const show of tvWatching) {
      const ep = show.next_episode_to_air;
      if (!ep) continue;
      const when = parseAirDateLocal(show, ep);
      if (!when) continue;
      const h = hoursUntil(when);
      if (h >= 0 && h <= 24) {
        list.push({ show, ep, when, hours: h, key: epKey(show, ep) });
      }
    }
    return list.sort((a,b) => a.when - b.when);
  }

  function notifyUpcoming(c) {
    const msg = `New episode soon: ${safeTitle(c.show, c.ep)} (${Math.max(0, Math.floor(c.hours))}h)`;
    const type = 'info';
    try {
      if (typeof window.showNotification === 'function') {
        window.showNotification(msg, type);
      } else {
        // Fallback toast
        console.log('🔔', msg);
        alert(msg); // last resort; unlikely to run if toasts exist
      }
    } catch (e) { console.error('Notif toast failed', e); }
  }

  function runScan(reason = 'manual') {
    if (!isOn()) return;
    const seen = getSeen();
    const cands = findCandidates();
    // For debugging
    console.log('🔔 NotifEngineCore scan', { reason, count: cands.length, cands });

    let changed = false;
    for (const c of cands) {
      if (seen[c.key]) continue; // already notified
      notifyUpcoming(c);
      seen[c.key] = { at: Date.now() };
      changed = true;
    }
    if (changed) setSeen(seen);
  }

  // Schedule: on load (deferred), every 30 min, and when tab becomes visible
  const start = () => {
    // Defer startup a bit to let data sync settle
    setTimeout(() => runScan('startup-3s'), 3000);
    setTimeout(() => runScan('startup-20s'), 20000);
    // Periodic
    window.__notifInterval = window.setInterval(() => runScan('interval-30m'), 30 * 60 * 1000);
  };

  // Connect to existing notification checkbox
  function connectToExistingCheckbox() {
    try {
      const existingCheckbox = document.getElementById('notifEpisodes');
      if (existingCheckbox) {
        // Set initial state from our storage
        existingCheckbox.checked = isOn();
        
        // Add event listener to sync with our storage
        existingCheckbox.addEventListener('change', (e) => {
          setOn(e.target.checked);
          // run an immediate scan on enable to catch imminent episodes
          if (e.target.checked) runScan('toggle-on');
        }, { passive: true });
        
        console.log('🔔 Connected to existing notifEpisodes checkbox');
        return true;
      } else {
        console.warn('🔔 Existing notifEpisodes checkbox not found, will retry...');
        return false;
      }
    } catch (e) {
      console.warn('Failed to connect to existing notification checkbox:', e);
      return false;
    }
  }

  // Try to connect immediately, and retry if needed
  if (!connectToExistingCheckbox()) {
    // Retry after a delay to ensure DOM is ready
    setTimeout(() => {
      if (!connectToExistingCheckbox()) {
        // Final retry after longer delay
        setTimeout(connectToExistingCheckbox, 2000);
      }
    }, 1000);
  }

  // Visibility re-scan
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') runScan('visible');
  });

  // Start the engine
  start();

  console.log('🔔 NotifEngineCore initialized');
})();

// === MP-NotifAdvancedPro (guarded, PRO) ===
(() => {
  console.log('🔔 NotifAdvancedPro: IIFE starting...');
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  const IS_ENABLED = !!FLAGS.notifAdvancedEnabled;
  const IS_PRO = !!FLAGS.proEnabled;

  console.log('🔔 NotifAdvancedPro: Flags check', { IS_ENABLED, IS_PRO, FLAGS });

  if (!IS_ENABLED) {
    console.log('🔔 NotifAdvancedPro disabled via flag');
    return;
  }
  if (window.__notifAdvBound) return;
  window.__notifAdvBound = true;

  // --- Storage keys (shared dedupe with Core) ---
  const K_ADV_ON   = 'flicklet:notif:adv:on';
  const K_LEAD_H   = 'flicklet:notif:adv:leadHours';
  const K_LISTS    = 'flicklet:notif:adv:lists';
  const K_SEEN     = 'flicklet:notif:seen'; // shared with Core

  // --- Settings helpers ---
  const getAdvOn = () => {
    if (!IS_PRO) return false; // hard gate
    try { return localStorage.getItem(K_ADV_ON) === '1'; } catch { return false; }
  };
  const setAdvOn = (v) => {
    try { localStorage.setItem(K_ADV_ON, v ? '1' : '0'); } catch {}
    try {
      if (window.FlickletApp?.settings) {
        window.FlickletApp.settings.notifAdvanced = !!v;
        window.FlickletApp.saveSettings?.();
      }
    } catch {}
  };
  const getLeadHours = () => {
    try {
      const n = Number(localStorage.getItem(K_LEAD_H));
      return Number.isFinite(n) && n > 0 ? n : 24;
    } catch { return 24; }
  };
  const setLeadHours = (n) => {
    try { localStorage.setItem(K_LEAD_H, String(Math.max(1, Math.floor(n)))) } catch {}
  };
  const DEF_LISTS = ['tv.watching'];
  const getLists = () => {
    try {
      const v = JSON.parse(localStorage.getItem(K_LISTS) || 'null');
      return Array.isArray(v) && v.length ? v : DEF_LISTS;
    } catch { return DEF_LISTS; }
  };
  const setLists = (arr) => {
    try { localStorage.setItem(K_LISTS, JSON.stringify(arr)); } catch {}
  };
  const getSeen = () => {
    try { return JSON.parse(localStorage.getItem(K_SEEN) || '{}'); } catch { return {}; }
  };
  const setSeen = (obj) => {
    try { localStorage.setItem(K_SEEN, JSON.stringify(obj)); } catch {}
  };

  // --- Utilities (aligned with Core) ---
  const hoursUntil = (when) => (when.getTime() - Date.now()) / 36e5;
  function parseAirDateLocal(show, ep) {
    const raw = (ep && (ep.air_date || ep.first_air_date)) || show.first_air_date || null;
    if (!raw) return null;
    const [y, m, d] = String(raw).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 20, 0, 0, 0); // 8pm local default
  }
  const safeTitle = (show, ep) => {
    const t = show.name || show.title || 'Unknown';
    const sn = ep?.season_number, en = ep?.episode_number;
    return sn != null && en != null ? `${t} S${sn}E${en}` : t;
  };
  const epKey = (show, ep) => {
    if (ep?.id != null) return `ep:${ep.id}`;
    const mt = show.media_type || (show.first_air_date ? 'tv' : 'movie');
    return `ep:${mt}:${show.id}:S${ep?.season_number || '?'}:E${ep?.episode_number || '?'}`;
  };

  // --- Candidate finder (advanced) ---
  function* listSources(listKeys) {
    const data = (window.FlickletApp?.data) || window.appData || {};
    for (const key of listKeys) {
      const path = key.split('.'); // e.g., ['tv','watching']
      let cur = data;
      for (const p of path) cur = cur?.[p];
      if (Array.isArray(cur)) yield { key, items: cur };
    }
  }

  function findCandidatesAdv(leadHours, listKeys) {
    const out = [];
    for (const src of listSources(listKeys)) {
      if (!src.items?.length) continue;
      for (const show of src.items) {
        const ep = show?.next_episode_to_air;
        if (!ep) continue;
        const when = parseAirDateLocal(show, ep);
        if (!when) continue;
        const h = hoursUntil(when);
        if (h >= 0 && h <= leadHours) {
          out.push({ show, ep, when, hours: h, key: epKey(show, ep), src: src.key });
        }
      }
    }
    return out.sort((a,b) => a.when - b.when);
  }

  function notifyUpcoming(c) {
    const msg = `Upcoming (${c.src}): ${safeTitle(c.show, c.ep)} in ${Math.max(0, Math.floor(c.hours))}h`;
    try {
      if (typeof window.showNotification === 'function') {
        window.showNotification(msg, 'info');
      } else {
        console.log('🔔', msg);
      }
    } catch (e) { console.error('Notif toast failed', e); }
  }

  function runScanAdv(reason = 'manual') {
    if (!IS_PRO || !getAdvOn()) return;
    const lead = getLeadHours();
    const lists = getLists();
    const seen = getSeen();
    const cands = findCandidatesAdv(lead, lists);

    console.log('🔔 NotifAdvancedPro scan', { reason, lead, lists, count: cands.length, cands });

    let changed = false;
    for (const c of cands) {
      if (seen[c.key]) continue; // already notified by Core or Advanced
      notifyUpcoming(c);
      seen[c.key] = { at: Date.now(), adv: true };
      changed = true;
    }
    if (changed) setSeen(seen);
  }

  // Schedule (Advanced runs slightly earlier than Core on startup)
  const start = () => {
    setTimeout(() => runScanAdv('startup-2s'), 2000);
    setTimeout(() => runScanAdv('startup-12s'), 12000);
    window.__notifAdvInterval = window.setInterval(() => runScanAdv('interval-30m'), 30 * 60 * 1000);
  };

  // Settings UI (progressive) - with retry logic
  const injectAdvancedSettings = () => {
    try {
      console.log('🔔 NotifAdvancedPro: Attempting settings injection...');
      const settingsSection = document.getElementById('settingsSection');
      console.log('🔔 NotifAdvancedPro: Settings section found:', !!settingsSection);
      if (settingsSection && !document.getElementById('notifAdvRow')) {
      const lists = getLists();
      const lead = getLeadHours();
      const on = getAdvOn();

      const card = document.createElement('div');
      card.id = 'notifAdvRow';
      card.className = 'card';
      const disabled = IS_PRO ? '' : 'disabled';
      const disAttr = IS_PRO ? '' : 'disabled aria-disabled="true"';

      card.innerHTML = `
        <h4>🔔 Advanced Notifications (PRO)</h4>
        <p style="margin: 0 0 15px 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">
          Configure advanced notification settings with custom lead times and list monitoring.
        </p>
        <div class="settings-block ${disabled}" style="display: flex; flex-direction: column; gap: 15px;">
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="advOn" ${on ? 'checked' : ''} ${disAttr}>
              <span>Enable advanced notifications</span>
            </label>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <label for="advLead" style="font-weight: 500;">Lead time (hours):</label>
            <select id="advLead" ${disAttr} aria-label="Notification lead time" style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px;">
              ${[6,12,24,48].map(h=>`<option value="${h}" ${lead===h?'selected':''}>${h}</option>`).join('')}
              <option value="custom" ${![6,12,24,48].includes(lead)?'selected':''}>Custom…</option>
            </select>
            <input type="number" id="advLeadCustom" min="1" step="1" value="${lead}" style="width:88px;padding: 4px 8px;border: 1px solid #ccc;border-radius: 4px;" ${![6,12,24,48].includes(lead)?'':'hidden'} ${disAttr} aria-label="Custom lead hours">
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="font-weight: 500;">Lists to monitor:</div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="advL_tvWatching" ${lists.includes('tv.watching')?'checked':''} ${disAttr}>
                <span>TV — Watching</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="advL_tvWishlist" ${lists.includes('tv.wishlist')?'checked':''} ${disAttr}>
                <span>TV — Wishlist</span>
              </label>
            </div>
          </div>
          ${IS_PRO ? '' : '<div style="font-size: 0.8rem; color: #666; font-style: italic;" role="note">PRO subscription required to use advanced notifications.</div>'}
        </div>
      `;
      
      // Insert after Episode Reminders card (before Data Tools)
      const allCards = settingsSection.querySelectorAll('.card');
      let insertAfterCard = null;
      
      // Find the Episode Reminders card
      for (let i = 0; i < allCards.length; i++) {
        const h4 = allCards[i].querySelector('h4');
        if (h4 && h4.textContent.includes('Episode Reminders')) {
          insertAfterCard = allCards[i];
          break;
        }
      }
      
      if (insertAfterCard) {
        // Insert after the Episode Reminders card
        insertAfterCard.parentNode.insertBefore(card, insertAfterCard.nextSibling);
      } else {
        // Look for Data Tools card as fallback
        for (let i = 0; i < allCards.length; i++) {
          const h4 = allCards[i].querySelector('h4');
          if (h4 && h4.textContent.includes('Data Tools')) {
            allCards[i].parentNode.insertBefore(card, allCards[i]);
            break;
          }
        }
        
        // Final fallback: append to the end of settings section
        if (!card.parentNode) {
          settingsSection.appendChild(card);
        }
      }

      const $ = (id) => card.querySelector(id);
      const onChange = () => {
        if (!IS_PRO) return;
        const on = $('#advOn')?.checked ?? $('#advOn').checked;
        const leadSel = $('#advLead').value;
        const lead = leadSel === 'custom' ? Math.max(1, Number($('#advLeadCustom').value || 24)) : Number(leadSel);
        const l = [];
        if ($('#advL_tvWatching').checked) l.push('tv.watching');
        if ($('#advL_tvWishlist').checked) l.push('tv.wishlist');
        setAdvOn(on);
        setLeadHours(lead);
        setLists(l.length ? l : DEF_LISTS);
        if (on) runScanAdv('settings-change');
      };

      $('#advOn')?.addEventListener('change', onChange, { passive: true });
      $('#advLead')?.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
          $('#advLeadCustom').hidden = false;
          $('#advLeadCustom').focus();
        } else {
          $('#advLeadCustom').hidden = true;
        }
        onChange();
      }, { passive: true });
      $('#advLeadCustom')?.addEventListener('change', onChange, { passive: true });
      $('#advL_tvWatching')?.addEventListener('change', onChange, { passive: true });
      $('#advL_tvWishlist')?.addEventListener('change', onChange, { passive: true });
      
      console.log('🔔 NotifAdvancedPro: Settings card injected successfully');
      return true; // Success
    } else {
      console.log('🔔 NotifAdvancedPro: Settings section not found or card already exists');
      return false; // Will retry
    }
    } catch (e) {
      console.warn('Failed to inject advanced notification settings:', e);
      return false; // Will retry
    }
  };

  // Retry injection with multiple strategies
  const tryInjectAdvancedSettings = () => {
    if (injectAdvancedSettings()) return; // Success
    
    // Use onSettingsReady helper if available, otherwise fall back to retry strategies
    if (window.App && typeof window.App.onSettingsReady === 'function') {
      window.App.onSettingsReady(() => {
        injectAdvancedSettings();
      });
      return;
    }
    
    // Fallback retry strategies
    setTimeout(() => {
      if (injectAdvancedSettings()) return;
      
      // Try again after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => injectAdvancedSettings(), 100);
        });
      }
      
      // Try again after window load
      if (document.readyState !== 'complete') {
        window.addEventListener('load', () => {
          setTimeout(() => injectAdvancedSettings(), 500);
        });
      }
      
      // Try when settings tab is clicked
      const settingsBtn = document.querySelector('[onclick*="settings"]');
      if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
          setTimeout(() => injectAdvancedSettings(), 200);
        });
      }
      
      // Try with window.switchToTab hook
      if (window.switchToTab) {
        const originalSwitchToTab = window.switchToTab;
        window.switchToTab = function(tab) {
          const result = originalSwitchToTab.call(this, tab);
          if (tab === 'settings') {
            setTimeout(() => injectAdvancedSettings(), 100);
          }
          return result;
        };
      }
    }, 100);
  };

  // Initial injection attempt
  tryInjectAdvancedSettings();

  // Visibility re-scan
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') runScanAdv('visible');
  });

  // Start
  start();
  console.log('🔔 NotifAdvancedPro initialized', { pro: IS_PRO });
})();

// === MP-ThemePacks T0 (guarded) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.themePacksEnabled === false) {
    console.log('🎨 ThemePacks disabled via flag');
    return;
  }
  if (window.__themePacksBound) return;
  window.__themePacksBound = true;

  const STORAGE_KEY = 'flicklet:theme';
  const THEMES = [
    { id: 'classic',  label: 'Classic (Free)', pro: false },
    { id: 'sunset',   label: 'Sunset (Pro)',   pro: true  },
    { id: 'midnight', label: 'Midnight (Pro)', pro: true  },
    { id: 'forest',   label: 'Forest (Pro)',   pro: true  }
  ];

  const isPro = !!FLAGS.proEnabled;

  function getSavedTheme() {
    try { return localStorage.getItem(STORAGE_KEY) || 'classic'; } catch { return 'classic'; }
  }
  function saveTheme(id) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    try {
      if (window.FlickletApp?.settings) {
        window.FlickletApp.settings.themePack = id;
        window.FlickletApp.saveSettings?.();
      }
    } catch {}
  }

  function applyTheme(id) {
    // Gate: if not PRO and theme is pro-only, fall back to classic
    const t = THEMES.find(t => t.id === id) || THEMES[0];
    const allowed = isPro || !t.pro;
    const finalId = allowed ? t.id : 'classic';
    
    // For classic theme, remove data-theme to use default dark mode
    if (finalId === 'classic') {
      delete document.body.dataset.theme;
    } else {
      document.body.dataset.theme = finalId;
    }
    
    console.log('🎨 Theme applied:', finalId, '(requested:', id + (allowed ? '' : ', downgraded') + ')');
  }

  // Bootstrap current theme
  applyTheme(getSavedTheme());

  // Expose for quick manual test
  window.setThemePack = function(id) {
    applyTheme(id);
    saveTheme(id);
  };

  // Settings UI (progressive enhancement) - with retry logic
  const injectThemePacksSettings = () => {
    try {
      console.log('🎨 ThemePacks: Attempting settings injection...');
      const settingsSection = document.getElementById('settingsSection');
      console.log('🎨 ThemePacks: Settings section found:', !!settingsSection);
      if (settingsSection && !document.getElementById('themePacksRow')) {
      const card = document.createElement('div');
      card.id = 'themePacksRow';
      card.className = 'card';
      const current = getSavedTheme();

      const options = THEMES.map(t => {
        const dis = (!isPro && t.pro) ? 'disabled aria-disabled="true"' : '';
        const lock = (!isPro && t.pro) ? ' 🔒' : '';
        const sel = (t.id === current) ? 'selected' : '';
        return `<option value="${t.id}" ${sel} ${dis}>${t.label}${lock}</option>`;
      }).join('');

      card.innerHTML = `
        <h4>🎨 Theme Packs</h4>
        <p style="margin: 0 0 15px 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">
          Choose a visual theme for your Flicklet experience. Pro users get access to premium themes.
        </p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
          <label for="themePackSelect" style="font-weight: 500;">Theme:</label>
          <select id="themePackSelect" aria-label="Choose theme" style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px;">${options}</select>
          ${!isPro ? '<div style="font-size: 0.8rem; color: #666; font-style: italic;" role="note">Pro unlocks more themes.</div>' : ''}
        </div>
      `;
      
      // Insert after Notifications card (before Data Tools)
      const allCards = settingsSection.querySelectorAll('.card');
      let insertAfterCard = null;
      
      // Find the Notifications card
      for (let i = 0; i < allCards.length; i++) {
        const h4 = allCards[i].querySelector('h4');
        if (h4 && h4.textContent.includes('Notifications')) {
          insertAfterCard = allCards[i];
          break;
        }
      }
      
      if (insertAfterCard) {
        // Insert after the Notifications card
        insertAfterCard.parentNode.insertBefore(card, insertAfterCard.nextSibling);
      } else {
        // Fallback: append to the end of settings section
        settingsSection.appendChild(card);
      }

      const sel = card.querySelector('#themePackSelect');
      sel.addEventListener('change', (e) => {
        const requested = e.target.value;
        // If non-pro chooses a locked theme, snap back and nudge
        const chosen = THEMES.find(t => t.id === requested);
        if (chosen?.pro && !isPro) {
          // snap back visually
          e.target.value = getSavedTheme();
          // gentle nudge via existing notification system if present
          if (typeof window.showNotification === 'function') {
            window.showNotification('That theme is a Pro feature. Upgrade to unlock.', 'info');
          } else {
            console.log('Pro theme selected without Pro.');
          }
          return;
        }
        applyTheme(requested);
        saveTheme(requested);
      }, { passive: true });
      
      console.log('🎨 ThemePacks: Settings card injected successfully');
      return true; // Success
    } else {
      console.log('🎨 ThemePacks: Settings section not found or card already exists');
      return false; // Will retry
    }
    } catch (e) {
      console.warn('Failed to inject theme packs settings:', e);
      return false; // Will retry
    }
  };

  // Retry injection with multiple strategies
  const tryInjectThemePacksSettings = () => {
    if (injectThemePacksSettings()) return; // Success
    
    // Use onSettingsReady helper if available, otherwise fall back to retry strategies
    if (window.App && typeof window.App.onSettingsReady === 'function') {
      window.App.onSettingsReady(() => {
        injectThemePacksSettings();
      });
      return;
    }
    
    // Fallback retry strategies
    setTimeout(() => {
      if (injectThemePacksSettings()) return;
      
      // Try again after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => injectThemePacksSettings(), 100);
        });
      }
      
      // Try again after window load
      if (document.readyState !== 'complete') {
        window.addEventListener('load', () => {
          setTimeout(() => injectThemePacksSettings(), 500);
        });
      }
      
      // Try when settings tab is clicked
      const settingsBtn = document.querySelector('[onclick*="settings"]');
      if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
          setTimeout(() => injectThemePacksSettings(), 200);
        });
      }
      
      // Try with window.switchToTab hook
      if (window.switchToTab) {
        const originalSwitchToTab = window.switchToTab;
        window.switchToTab = function(tab) {
          const result = originalSwitchToTab.call(this, tab);
          if (tab === 'settings') {
            setTimeout(() => injectThemePacksSettings(), 100);
          }
          return result;
        };
      }
    }, 100);
  };

  // Initial injection attempt
  tryInjectThemePacksSettings();

  console.log('🎨 ThemePacks initialized', { pro: isPro });
})();

// === MP-Playlists v1 (guarded) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.playlistsEnabled === false) {
    console.log('📼 Playlists/Spotlight disabled via flag');
    return;
  }
  if (window.__playlistV1Bound) return;
  window.__playlistV1Bound = true;

  // Seed curated picks (placeholder content for TV tracker)
  const SEED = [
    { id: 'placeholder', title: 'Top 10 Sci-Fi Shows (This Season)', genre: 'Sci-Fi', type: 'placeholder' },
    { id: 'placeholder', title: 'Top 10 Dramas You Missed', genre: 'Drama', type: 'placeholder' },
    { id: 'placeholder', title: 'Top 10 Comedies for Binge Night', genre: 'Comedy', type: 'placeholder' }
  ];

  const LS_KEY = 'flicklet:spotlight:video'; // JSON: { id, title?, genre? }

  // Helpers
  const parseYouTube = (value) => {
    if (!value) return null;
    const v = String(value).trim();
    // Accept raw ID or full URL
    if (/^[\w-]{11}$/.test(v)) return v;
    try {
      const u = new URL(v);
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
      if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '') || null;
    } catch {}
    return null;
  };

  function chooseVideo() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.id && /^[\w-]{11}$/.test(obj.id)) return obj;
      }
    } catch {}
    // Rotate seed by day
    const idx = Math.abs(new Date().toDateString().split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % SEED.length;
    return SEED[idx];
  }

  function findHomeMount() {
    return document.querySelector('#homeSection');
  }

  function renderSpotlight(container, vid) {
    console.log('📼 Playlists: renderSpotlight called', { container: !!container, vid: vid?.id, title: vid?.title });
    if (!container || !vid?.id) return;
    // Idempotent: clear existing instance
    const prev = container.querySelector('.playlist-card[data-mp="v1"]');
    if (prev) prev.remove();

    const card = document.createElement('section');
    card.className = 'playlist-card';
    card.dataset.mp = 'v1';
    
    if (vid.type === 'placeholder') {
      card.innerHTML = `
        <div class="video-embed" role="region" aria-label="Curated content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: bold; text-align: center; padding: 40px;">
          <div>
            <div style="font-size: 48px; margin-bottom: 16px;">📺</div>
            <div>${(vid.title || 'Curated Spotlight').replace(/</g,'&lt;')}</div>
            <div style="font-size: 14px; opacity: 0.8; margin-top: 8px;">Coming Soon</div>
          </div>
        </div>
        <div class="video-meta">
          <div class="video-title">${(vid.title || 'Curated Spotlight').replace(/</g,'&lt;')}</div>
          ${vid.genre ? `<span class="pill" aria-label="Genre">${vid.genre}</span>` : ''}
          <span class="pill" aria-label="Curated by">Curated by Flicklet</span>
          <div class="video-actions">
            <button class="btn-ghost" data-action="dismissSpotlight" aria-label="Hide this card">Hide</button>
          </div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="video-embed" role="region" aria-label="Curated video">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${vid.id}?rel=0&modestbranding=1"
            title="${(vid.title || 'Curated video').replace(/"/g,'&quot;')}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </div>
        <div class="video-meta">
          <div class="video-title">${(vid.title || 'Curated Spotlight').replace(/</g,'&lt;')}</div>
          ${vid.genre ? `<span class="pill" aria-label="Genre">${vid.genre}</span>` : ''}
          <span class="pill" aria-label="Curated by">Curated by Flicklet</span>
          <div class="video-actions">
            <button class="btn-ghost" data-action="openYT" aria-label="Open on YouTube">Open</button>
            <button class="btn-ghost" data-action="dismissSpotlight" aria-label="Hide this card">Hide</button>
          </div>
        </div>
      `;
    }
    
    container.prepend(card);
    console.log('📼 Playlists: Card inserted into home section');

    card.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'openYT') {
        window.open(`https://www.youtube.com/watch?v=${vid.id}`, '_blank', 'noopener');
      } else if (action === 'dismissSpotlight') {
        card.remove();
        try { sessionStorage.setItem('flicklet:spotlight:dismiss', '1'); } catch {}
      }
    }, { passive: true });
  }

  function injectSettingsRow() {
    try {
      const container = document.getElementById('settingsList') || document.querySelector('#settingsTab .settings-list');
      if (!container || document.getElementById('spotlightVideoRow')) return;

      const row = document.createElement('div');
      row.id = 'spotlightVideoRow';
      row.className = 'settings-row';
      const saved = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; } })();

      row.innerHTML = `
        <label class="settings-label" for="spotlightInput">Home video spotlight (test)</label>
        <input id="spotlightInput" type="text" placeholder="Paste YouTube URL or ID"
               value="${saved?.id ? `https://youtu.be/${saved.id}` : ''}" style="min-width:260px">
        <button class="btn" id="spotlightSave">Save</button>
        <button class="btn secondary" id="spotlightUseDefault">Use curated</button>
      `;
      container.appendChild(row);

      const $ = (id) => row.querySelector(id);
      $('#spotlightSave').addEventListener('click', () => {
        const raw = String($('#spotlightInput').value || '').trim();
        const id = parseYouTube(raw);
        if (!id) {
          if (typeof window.showNotification === 'function') {
            window.showNotification('Invalid YouTube URL/ID.', 'warn');
          } else { alert('Invalid YouTube URL/ID.'); }
          return;
        }
        const payload = { id };
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
        if (typeof window.showNotification === 'function') {
          window.showNotification('Spotlight video saved.', 'success');
        }
        // Re-render on Home if visible
        const mount = findHomeMount();
        if (mount && document.visibilityState === 'visible') renderSpotlight(mount, payload);
      }, { passive: true });

      $('#spotlightUseDefault').addEventListener('click', () => {
        localStorage.removeItem(LS_KEY);
        if (typeof window.showNotification === 'function') {
          window.showNotification('Reverted to curated spotlight.', 'info');
        }
        const mount = findHomeMount();
        if (mount && document.visibilityState === 'visible') renderSpotlight(mount, chooseVideo());
      }, { passive: true });
    } catch {}
  }

  function boot() {
    // Respect "Hide" for this session
    try { 
      if (sessionStorage.getItem('flicklet:spotlight:dismiss') === '1') {
        console.log('📼 Playlists v1: Spotlight was dismissed this session, skipping');
        return; 
      } 
    } catch {}

    const mount = findHomeMount();
    console.log('📼 Playlists v1: Looking for home mount', { mount: !!mount, homeSection: !!document.getElementById('homeSection') });
    if (!mount) {
      console.log('📼 Playlists v1: No home mount found, will retry');
      return;
    }
    console.log('📼 Playlists v1: Rendering spotlight video');
    renderSpotlight(mount, chooseVideo());
  }

  // Re-render when home tab becomes active
  function setupHomeTabListener() {
    const homeTab = document.getElementById('homeTab');
    if (homeTab) {
      homeTab.addEventListener('click', () => {
        setTimeout(() => {
          const mount = findHomeMount();
          if (mount && !mount.querySelector('.playlist-card[data-mp="v1"]')) {
            console.log('📼 Playlists: Re-rendering on home tab click');
            boot();
          }
        }, 100);
      });
    }
  }

  // Start with a delay to ensure DOM is ready
  setTimeout(() => {
    boot();
  }, 500);
  
  setupHomeTabListener();
  // Settings row (optional, handy for QA)
  injectSettingsRow();

  console.log('📼 Playlists/Spotlight v1 initialized');
})();

// === MP-Playlists v2 (curated rows, PRO) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.playlistsEnabled === false || FLAGS.playlistsProEnabled === false) {
    console.log('📼 Playlists v2 disabled by flags');
    return;
  }
  if (window.__playlistV2Bound) return;
  window.__playlistV2Bound = true;

  const IS_PRO = !!FLAGS.proEnabled;

  // Minimal curated catalog (IDs only; safe for nocookie embeds)
  const CATALOG = [
    {
      title: 'Top Sci-Fi Today', genre: 'Sci-Fi',
      videos: [
        { id:'dQw4w9WgXcQ', title:'Top 10 Sci-Fi Shows (This Season)' },
        { id:'2vjPBrBU-TM', title:'Hidden Sci-Fi Gems' },
        { id:'3JZ_D3ELwOQ', title:'New Space Epics Ranked' }
      ]
    },
    {
      title: 'Underrated Dramas', genre: 'Drama',
      videos: [
        { id:'5qap5aO4i9A', title:'10 Dramas You Missed' },
        { id:'FTQbiNvZqaY', title:'Modern Classics' },
        { id:'fRh_vgS2dFE', title:'Slow Burns Worth It' }
      ]
    },
    {
      title: 'Bingeable Comedies', genre: 'Comedy',
      videos: [
        { id:'Zi_XLOBDo_Y', title:'Laugh Track: Best Binges' },
        { id:'OPf0YbXqDm0', title:'New Comfort Watches' },
        { id:'9bZkp7q19f0', title:'Crowd Favorites' }
      ]
    }
  ];

  const LS_ROWS = 'flicklet:playlists:rowsCount'; // "1" | "2" | "3"
  const LS_DENSE = 'flicklet:playlists:dense';    // "1" | "0"
  const rowsCount = () => {
    try { const n = Number(localStorage.getItem(LS_ROWS)); return [1,2,3].includes(n) ? n : 2; }
    catch { return 2; }
  };
  const isDense = () => { try { return localStorage.getItem(LS_DENSE) === '1'; } catch { return false; } };

  function findHomeMount() {
    return document.querySelector('#homeSection');
  }

  function ytEmbed(id, title) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1"
                    title="${(title||'Playlist video').replace(/"/g,'&quot;')}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen></iframe>`;
  }

  function renderUpsell(container) {
    const upsell = document.createElement('div');
    upsell.className = 'playlist-upsell';
    upsell.textContent = 'More curated rows are available with Pro.';
    container.appendChild(upsell);
  }

  function renderRow(container, row) {
    const wrap = document.createElement('section');
    wrap.className = 'playlist-row';

    const head = document.createElement('div');
    head.className = 'row-head';
    head.innerHTML = `
      <div class="row-title">${row.title.replace(/</g,'&lt;')}</div>
      ${row.genre ? `<span class="pill">${row.genre}</span>` : ''}
    `;
    wrap.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'playlist-grid';

    // Primary tile
    const primary = document.createElement('div');
    primary.className = 'playlist-item';
    primary.innerHTML = ytEmbed(row.videos[0].id, row.videos[0].title);
    grid.appendChild(primary);

    // Secondary area
    if (isDense()) {
      // multiple small embeds
      const denseCol = document.createElement('div');
      denseCol.className = 'playlist-grid';
      denseCol.style.gridTemplateColumns = '1fr 1fr';
      denseCol.style.gap = '8px';
      row.videos.slice(1).forEach(v => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.innerHTML = ytEmbed(v.id, v.title);
        denseCol.appendChild(item);
      });
      grid.appendChild(denseCol);
    } else {
      // compact link list
      const list = document.createElement('div');
      list.className = 'playlist-list';
      row.videos.slice(1).forEach(v => {
        const a = document.createElement('a');
        a.className = 'playlist-link';
        a.href = `https://www.youtube.com/watch?v=${v.id}`;
        a.target = '_blank'; a.rel='noopener';
        a.textContent = v.title;
        list.appendChild(a);
      });
      grid.appendChild(list);
    }

    wrap.appendChild(grid);
    container.appendChild(wrap);
  }

  function boot() {
    const mount = findHomeMount();
    if (!mount) return;

    // Idempotent re-render
    let section = mount.querySelector('.playlist-section[data-mp="v2"]');
    if (section) section.remove();

    section = document.createElement('section');
    section.className = 'playlist-section';
    section.dataset.mp = 'v2';
    mount.appendChild(section);

    if (!IS_PRO) {
      renderUpsell(section);
      return;
    }

    const count = rowsCount();
    CATALOG.slice(0, count).forEach(row => renderRow(section, row));
  }

  function injectSettings() {
    try {
      const container = document.getElementById('settingsSection');
      if (!container || document.getElementById('playlistRowsSettings')) return;

      const card = document.createElement('div');
      card.className = 'card';
      card.id = 'playlistRowsSettings';
      card.style.display = 'none'; // Hide old curated rows setting
      const rc = rowsCount();
      const dense = isDense();
      card.innerHTML = `
        <div class="card-header">
          <h3>Curated Rows (Home)</h3>
        </div>
        <div class="card-body">
          <div class="settings-row">
            <label class="settings-label" for="rowsCountSel">Rows count</label>
            <select id="rowsCountSel" aria-label="Rows count">
              <option value="1" ${rc===1?'selected':''}>1</option>
              <option value="2" ${rc===2?'selected':''}>2</option>
              <option value="3" ${rc===3?'selected':''}>3</option>
            </select>
          </div>
          <div class="settings-row">
            <label><input id="rowsDenseChk" type="checkbox" ${dense?'checked':''}> Dense tiles</label>
          </div>
        </div>
      `;
      
      // Insert after Theme Packs card
      const themeCard = document.getElementById('themePacksCard');
      if (themeCard) {
        themeCard.insertAdjacentElement('afterend', card);
      } else {
        container.appendChild(card);
      }

      const sel = card.querySelector('#rowsCountSel');
      const chk = card.querySelector('#rowsDenseChk');
      sel.addEventListener('change', () => {
        try { localStorage.setItem(LS_ROWS, sel.value); } catch {}
        boot();
      }, { passive: true });
      chk.addEventListener('change', () => {
        try { localStorage.setItem(LS_DENSE, chk.checked ? '1' : '0'); } catch {}
        boot();
      }, { passive: true });
    } catch {}
  }

  // Start with delay to ensure DOM is ready
  setTimeout(() => {
    boot();
  }, 1000);
  
  // Settings injection with retry
  setTimeout(() => {
    injectSettings();
  }, 1500);

  // Refresh when returning to tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') boot();
  });

  // Global refresh function for PRO state changes
  window.__FlickletRefreshPlaylists = function() {
    console.log('📼 Playlists v2: Refreshing due to PRO state change');
    boot();
  };

  console.log('📼 Playlists v2 (curated rows) initialized', { pro: IS_PRO });
})();

// === MP-Trivia v1 (per-card) + FlickWord Boost (Home) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  const TRIVIA_ON = FLAGS.triviaEnabled !== false;
  const FFACT_ON  = FLAGS.flickwordBoostEnabled !== false;
  if (!TRIVIA_ON && !FFACT_ON) { console.log('🧠 Trivia/FlickFact disabled'); return; }
  if (window.__triviaBound) return; window.__triviaBound = true;

  const PRO = !!FLAGS.proEnabled;

  // Helpers
  const safeDate = (s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) ? new Date(s+'T00:00:00') : null;
  const fmtYear  = (s) => (s ? String(s).slice(0,4) : '');
  const plural   = (n, a, b) => (n===1 ? a : b);
  const daysUntil = (date) => {
    if (!date) return null;
    const MS = 86400000;
    const d0 = new Date(); d0.setHours(0,0,0,0);
    const d1 = new Date(date); d1.setHours(0,0,0,0);
    return Math.round((d1 - d0)/MS);
  };
  const num = (x) => (typeof x === 'number' ? x : (x ? Number(x) : NaN));

  function makeFacts(item) {
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const facts = [];

    // 1) Year / runtime / seasons
    const firstAir = safeDate(item.first_air_date);
    const release  = safeDate(item.release_date);
    const year = fmtYear(item.first_air_date || item.release_date);
    const rt = num(item.runtime || (Array.isArray(item.episode_run_time) && item.episode_run_time[0]));
    const seasons = num(item.number_of_seasons);
    if (year) {
      if (type === 'tv' && seasons) facts.push({ ic:'📆', text:`Since ${year} • ${seasons} ${plural(seasons,'season','seasons')}` });
      else if (type === 'movie' && rt) facts.push({ ic:'⏱️', text:`${year} • ${rt} min` });
      else facts.push({ ic:'📆', text:`${year}` });
    }

    // 2) Networks / origin
    if (Array.isArray(item.networks) && item.networks[0]?.name) {
      facts.push({ ic:'📺', text:`On ${item.networks[0].name}` });
    } else if (Array.isArray(item.origin_country) && item.origin_country[0]) {
      facts.push({ ic:'🌍', text:`From ${item.origin_country[0]}` });
    }

    // 3) Score
    const score = num(item.vote_average);
    if (!isNaN(score) && score > 0) {
      const s = Math.round(score * 10);
      facts.push({ ic: s>=85 ? '🍅' : '⭐', text:`Critics ${s}%` });
    }

    // 4) Next episode countdown (TV)
    if (type === 'tv' && item.next_episode_to_air?.air_date) {
      const d = safeDate(item.next_episode_to_air.air_date);
      const n = daysUntil(d);
      if (typeof n === 'number') {
        if (n > 0) facts.push({ ic:'⏳', text:`Next in ${n} ${plural(n,'day','days')}` });
        else if (n === 0) facts.push({ ic:'🟢', text:'New episode today' });
        else facts.push({ ic:'📺', text:'Last aired' });
      }
    }

    // 5) Language
    if (item.original_language) {
      facts.push({ ic:'🈶', text:`Lang: ${item.original_language.toUpperCase()}` });
    }

    // Deduplicate by text
    const seen = new Set(); 
    return facts.filter(f => !seen.has(f.text) && seen.add(f.text));
  }

  function renderTrivia(slot, facts, locked) {
    if (!slot) return;
    slot.textContent = '';
    if (!facts.length) return;

    const row = document.createElement('div');
    row.className = 'trivia-row';
    if (locked) row.dataset.locked = '1';

    const label = document.createElement('span');
    label.className = 'trivia-label';
    label.textContent = 'Did you know';
    row.appendChild(label);

    const cap = locked ? 1 : Math.min(3, facts.length);
    for (const f of facts.slice(0, cap)) {
      const chip = document.createElement('span');
      chip.className = 'trivia-chip';
      chip.innerHTML = `<span class="ic" aria-hidden="true">${f.ic}</span> ${f.text}`;
      row.appendChild(chip);
    }

    if (locked && facts.length > 0) {
      const n = document.createElement('span');
      n.className = 'nudge';
      n.textContent = ' — upgrade for more';
      row.appendChild(n);
    }

    slot.appendChild(row);
  }

  async function attachTrivia(cardEl, item) {
    if (!TRIVIA_ON || !cardEl || !item) return;
    const slot = cardEl.querySelector('.trivia-slot');
    if (!slot) return;
    try {
      const facts = makeFacts(item);
      if (!facts.length) return;
      renderTrivia(slot, facts, !PRO);
    } catch (e) {
      console.debug('Trivia render failed', e);
    }
  }
  window.__FlickletAttachTrivia = attachTrivia;

  // ---- FlickWord Boost (Home) ----
  function findHomeMount() {
    return document.querySelector('#homeSection');
  }
  function chooseFlickFact() {
    try {
      const app = window.FlickletApp?.data || window.appData;
      const pool = [
        ...(app?.tv?.watching || []),
        ...(app?.movies?.watching || []),
        ...(app?.tv?.wishlist || []),
        ...(app?.movies?.wishlist || [])
      ];
      if (!pool.length) return null;
      const idx = Math.abs(new Date().toDateString().split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % pool.length;
      const item = pool[idx];
      const facts = makeFacts(item);
      if (!facts.length) return null;
      return { title: (item.name || item.title || 'This title'), fact: facts[0].text };
    } catch { return null; }
  }
  function renderFlickFact(container) {
    if (!FFACT_ON) return;
    const prev = container.querySelector('.flickfact-card[data-mp="v1"]');
    if (prev) prev.remove();
    const pick = chooseFlickFact();
    if (!pick) return;

    const card = document.createElement('section');
    card.className = 'flickfact-card';
    card.dataset.mp = 'v1';
    card.innerHTML = `
      <div class="ff-title">FlickFact</div>
      <div class="ff-body"><strong>${pick.title.replace(/</g,'&lt;')}</strong> — ${pick.fact}</div>
    `;
    container.prepend(card);
  }
  function bootHome() {
    const mount = findHomeMount();
    if (!mount) return;
    renderFlickFact(mount);
  }

  if (FFACT_ON) {
    bootHome();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') bootHome();
    });
  }

  // Store item data for refresh purposes
  const itemCache = new Map();
  
  // Enhanced attachTrivia that caches item data
  const originalAttachTrivia = attachTrivia;
  attachTrivia = function(cardEl, item) {
    if (item && item.id) {
      itemCache.set(item.id, item);
    }
    return originalAttachTrivia(cardEl, item);
  };

  // Global refresh function for PRO state changes
  window.__FlickletRefreshTrivia = function() {
    console.log('🧠 Trivia: Refreshing due to PRO state change');
    // Refresh all existing cards
    const cards = document.querySelectorAll('.show-card');
    cards.forEach(card => {
      const slot = card.querySelector('.trivia-slot');
      if (slot) {
        slot.textContent = ''; // Clear existing trivia
        const itemId = card.getAttribute('data-id');
        if (itemId) {
          const item = itemCache.get(Number(itemId));
          if (item) {
            try {
              const facts = makeFacts(item);
              if (facts.length) {
                renderTrivia(slot, facts, !window.FLAGS?.proEnabled);
              }
            } catch (e) {
              console.debug('Trivia refresh failed for card', e);
            }
          }
        }
      }
    });
  };

  console.log('🧠 Trivia + FlickWord boost initialized', { pro: PRO, trivia: TRIVIA_ON, flickfact: FFACT_ON });
})();

// Settings tabs functionality
(function setupSettingsTabs(){
  console.log('⚙️ setupSettingsTabs starting...');
  
  let tabsInitialized = false;
  
  function initTabs() {
    if (tabsInitialized) return;
    
    const settingsSection = document.getElementById('settingsSection');
    const tabs = document.querySelectorAll('.settings-tabs button');
    console.log('⚙️ Settings section found:', !!settingsSection);
    console.log('⚙️ Found tabs:', tabs.length);
    
    if(!tabs.length || !settingsSection) {
      // Use onSettingsReady helper if available, otherwise fall back to retry
      if (window.App && typeof window.App.onSettingsReady === 'function') {
        window.App.onSettingsReady(initTabs);
        return;
      }
      console.log('⚙️ Not ready yet, retrying in 200ms...');
      setTimeout(initTabs, 200);
      return;
    }
    
    tabs.forEach((btn, index) => {
      console.log(`⚙️ Setting up tab ${index}:`, btn.textContent, 'target:', btn.dataset.target);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('⚙️ Tab clicked:', btn.textContent);
        
        // Update active states
        tabs.forEach(b => { 
          b.classList.remove('active'); 
          b.setAttribute('aria-selected','false'); 
        });
        btn.classList.add('active'); 
        btn.setAttribute('aria-selected','true');
        
        // Show/hide sections
        const allSections = document.querySelectorAll('.settings-section');
        allSections.forEach(section => section.classList.remove('active'));
        
        const target = document.querySelector(btn.dataset.target);
        console.log('⚙️ Target element:', target);
        if(target) {
          target.classList.add('active');
          console.log('⚙️ Showing section:', btn.dataset.target);
        } else {
          console.log('⚙️ Target not found:', btn.dataset.target);
        }
      });
    });
    
    // Show the first section by default
    const firstSection = document.querySelector('#general');
    if (firstSection) {
      firstSection.classList.add('active');
    }
    
    tabsInitialized = true;
    console.log('⚙️ setupSettingsTabs ready');
  }
  
  // Try multiple times to ensure it works
  initTabs();
  document.addEventListener('DOMContentLoaded', initTabs);
  
  // Also try when the settings tab is clicked
  const settingsTab = document.getElementById('settingsTab');
  if (settingsTab) {
    settingsTab.addEventListener('click', () => {
      setTimeout(initTabs, 100);
    });
  }
})();

// Data section functionality
(function setupDataSection(){
  console.log('⚙️ setupDataSection starting...');
  
  let dataSectionInitialized = false;
  
  function initDataSection() {
    if (dataSectionInitialized) return;
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');
    const resetBtn = document.getElementById('resetBtn');
    
    console.log('⚙️ Data section elements found:', {
      exportBtn: !!exportBtn,
      importBtn: !!importBtn,
      importInput: !!importInput,
      resetBtn: !!resetBtn
    });
    
    if (!exportBtn || !importBtn || !importInput || !resetBtn) {
      // Use onSettingsReady helper if available, otherwise fall back to retry
      if (window.App && typeof window.App.onSettingsReady === 'function') {
        window.App.onSettingsReady(initDataSection);
        return;
      }
      console.log('⚙️ Data section elements not ready, retrying in 200ms...');
      setTimeout(initDataSection, 200);
      return;
    }

    // EXPORT - Use the existing working export functionality
    if (exportBtn){
      exportBtn.addEventListener('click', async ()=>{
        try{
          console.log('⬇️ Export button clicked');
          
          // Use the existing export function from functions.js
          const btnExport = document.getElementById('btnExport');
          if (btnExport) {
            console.log('⬇️ Using existing btnExport functionality');
            btnExport.click();
          } else {
            // Fallback: use the same logic as functions.js
            const flickletData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
            const legacyData = JSON.parse(localStorage.getItem('tvMovieTrackerData') || '{}');
            
            const data = {
              meta: { app: 'Flicklet', version: window.FlickletApp?.version || 'n/a', exportedAt: new Date().toISOString() },
              appData: flickletData.tv || flickletData.movies ? flickletData : legacyData,
              legacyData: legacyData
            };
            
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flicklet-export-${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            console.log('⬇️ Export complete (flicklet-export.json)');
          }
        }catch(err){
          console.error('Export error:', err);
          if (window.showNotification) {
            window.showNotification('Export failed. Check console for details.', 'error');
          } else if (window.showToast) {
            window.showToast('Export failed. Check console for details.');
          } else {
            alert('Export failed. Check console for details.');
          }
        }
      });
    }

    // IMPORT - Use the existing working import functionality
    if (importBtn && importInput){
      importBtn.addEventListener('click', ()=> importInput.click());

      importInput.addEventListener('change', async (e)=>{
        const file = e.target.files && e.target.files[0];
        if(!file) return;

        try{
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
          if (json.lists)  localStorage.setItem('flicklet_lists', JSON.stringify(json.lists));
          if (json.notes)  localStorage.setItem('flicklet_notes', JSON.stringify(json.notes));
          if (json.prefs)  localStorage.setItem('flicklet_prefs', JSON.stringify(json.prefs));
          
                                // Show success message
                      if (window.showNotification) {
                        window.showNotification('Import complete. Reloading…', 'success');
                      } else if (window.showToast) {
                        window.showToast('Import complete. Reloading…');
                      } else {
                        alert('Import complete. Reloading…');
                      }
          
          console.log('⬆️ Import complete', { keys: Object.keys(json).length });
          
          // Reload the page to apply changes
          setTimeout(()=>location.reload(), 500);
        }catch(err){
          console.error('Import parse error:', err);
                                if (window.showNotification) {
                        window.showNotification('Import failed: invalid file.', 'error');
                      } else if (window.showToast) {
                        window.showToast('Import failed: invalid file.');
                      } else {
                        alert('Invalid JSON file.');
                      }
        }
      });
    }

    // RESET (Danger Zone)
    if (resetBtn){
      resetBtn.addEventListener('click', ()=>{
        const check = prompt('Type DELETE to confirm full reset. This cannot be undone.');
        if(check === 'DELETE'){
          try{
            console.warn('⚠️ Data reset invoked by user');
            
            // First, try to call the app's reset function if available
            if (window.FlickletApp && typeof window.FlickletApp.reset === 'function') {
              console.log('🔄 Calling FlickletApp.reset()');
              window.FlickletApp.reset();
            } else if (window.Flicklet && typeof window.Flicklet.reset === 'function') {
              console.log('🔄 Calling Flicklet.reset()');
              window.Flicklet.reset();
            } else {
              console.warn('⚠️ No app reset function found, clearing localStorage only');
            }
            
            // Clear all Flicklet-related data from localStorage
            const keysToRemove = [
              'flicklet-data',
              'tvMovieTrackerData', 
              'flicklet_lists',
              'flicklet_notes',
              'flicklet_prefs',
              'flicklet_notif_master',
              'flicklet_notif_lead',
              'flicklet_notif_scope',
              'flicklet_last_notif',
              'flicklet-login-prompted'
            ];
            
            keysToRemove.forEach(key => {
              localStorage.removeItem(key);
            });
            
            // Show success message
            if (window.showNotification) {
              window.showNotification('All data wiped. Reloading…', 'success');
            } else if (window.showToast) {
              window.showToast('All data wiped. Reloading…');
            } else {
              alert('All data wiped. Reloading…');
            }
            
            // Reload the page to apply changes
            setTimeout(()=>location.reload(), 500);
          }catch(err){
            console.error('Reset error:', err);
            if (window.showNotification) {
              window.showNotification('Reset failed. See console.', 'error');
            } else if (window.showToast) {
              window.showToast('Reset failed. See console.');
            } else {
              alert('Reset failed. See console.');
            }
          }
        }
      });
    }

    console.log('⚙️ setupDataSection ready');
    dataSectionInitialized = true;
  }
  
  // Try multiple times to ensure it works
  initDataSection();
  document.addEventListener('DOMContentLoaded', initDataSection);
})();