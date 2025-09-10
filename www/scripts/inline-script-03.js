
      /* ============== bootstrap ============== */
      
      // Set up click event listener immediately (not inside DOMContentLoaded)
      console.log('🔧 Setting up click event listener in inline-script-03.js');
      
      // Debug: Check if settings tabs exist
      setTimeout(() => {
        const settingsTabs = document.querySelectorAll('.settings-tabs button');
        console.log('🔧 Settings tabs found on page load:', settingsTabs.length);
        settingsTabs.forEach((tab, index) => {
          console.log(`🔧 Tab ${index}:`, tab.textContent, 'classes:', tab.className);
        });
      }, 1000);
      document.addEventListener("click", (e) => {
        console.log('🔧 Click event detected on:', e.target, 'tagName:', e.target.tagName);
        console.log('🔧 Click target classes:', e.target.className);
        console.log('🔧 Click target parent classes:', e.target.parentElement?.className);
        console.log('🔧 Click target parent parent classes:', e.target.parentElement?.parentElement?.className);
        console.log('🔧 Is settings tab button?', e.target.closest('.settings-tabs button'));
        console.log('🔧 All settings tabs found:', document.querySelectorAll('.settings-tabs button').length);
        
        // Handle dark mode button specifically
        if (e.target.id === 'themeIcon' || e.target.id === 'darkModeToggle') {
          console.log('🌙 Dark mode button clicked via event delegation');
          e.preventDefault();
          e.stopPropagation();

          // Toggle dark mode directly
          document.body.classList.toggle("dark-mode");
          
          // Update app data
          if (window.appData?.settings) {
            appData.settings.theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
            if (typeof saveAppData === 'function') {
              saveAppData();
            }
          }
          
          // Update button icon
          const themeIcon = document.getElementById('themeIcon');
          if (themeIcon) {
            const isDark = document.body.classList.contains("dark-mode");
            themeIcon.textContent = isDark ? '☀️' : '🌙';
          }
          
          // Show notification
          if (typeof showNotification === 'function') {
            const isDark = document.body.classList.contains("dark-mode");
            showNotification(`Switched to ${isDark ? 'dark' : 'light'} mode`, 'success');
          }
          
          console.log('✅ Dark mode toggled successfully via event delegation');
          return;
        }

        // Handle Mardi Gras button specifically
        if (e.target.id === 'mardiToggle') {
          console.log('🎭 Mardi Gras button clicked via event delegation');
          e.preventDefault();
          e.stopPropagation();

          // Toggle Mardi Gras mode
          const root = document.getElementById("appRoot");
          if (root) {
            root.classList.toggle("mardi");
            const isMardiGras = root.classList.contains("mardi");
            
            // Update app data
            if (window.appData?.settings) {
              appData.settings.mardiGras = isMardiGras;
              if (typeof saveAppData === 'function') {
                saveAppData();
              }
            }
            
            // Show notification
            if (typeof showNotification === 'function') {
              showNotification(`Mardi Gras mode ${isMardiGras ? 'enabled' : 'disabled'}`, 'success');
            }
            
            console.log('✅ Mardi Gras toggled successfully via event delegation');
          } else {
            console.error('❌ appRoot element not found for Mardi Gras toggle');
          }
          return;
        }

        // Handle settings tab buttons specifically
        if (e.target.closest('.settings-tabs button')) {
          const btn = e.target.closest('.settings-tabs button');
          console.log('⚙️ Settings tab clicked via event delegation:', btn.textContent, 'target:', btn.dataset.target);
          e.preventDefault();
          e.stopPropagation();

          // Update active states
          const tabs = document.querySelectorAll('.settings-tabs button');
          console.log('⚙️ Found tabs:', tabs.length);
          tabs.forEach(b => { 
            b.classList.remove('active'); 
            b.setAttribute('aria-selected','false'); 
          });
          btn.classList.add('active'); 
          btn.setAttribute('aria-selected','true');
          
          // Show/hide sections
          const allSections = document.querySelectorAll('.settings-section');
          console.log('⚙️ Found sections:', allSections.length);
          allSections.forEach(section => {
            section.classList.remove('active');
            console.log('⚙️ Hiding section:', section.id);
          });
          
          const target = document.querySelector(btn.dataset.target);
          console.log('⚙️ Target element:', target, 'for selector:', btn.dataset.target);
          if(target) {
            target.classList.add('active');
            console.log('⚙️ Showing section:', btn.dataset.target);
          } else {
            console.log('❌ Target not found:', btn.dataset.target);
          }
          return;
        }
        
        const btn = e.target.closest("[data-action]");
        if (!btn) {
          console.log('🔧 No data-action element found');
          return;
        }
        
        console.log('🔧 Found data-action element:', btn.dataset.action);
        
        // Handle episode tracking action
        if (btn.dataset.action === "track-episodes") {
          e.preventDefault();
          e.stopPropagation(); // Prevent other handlers from running
          const seriesId = btn.dataset.id;
          const seriesTitle = btn.dataset.title;
          console.log('📺 Opening episode tracking for:', seriesId, seriesTitle);
          console.log('📺 Episode tracking enabled:', localStorage.getItem('flicklet:episodeTracking:enabled'));
          console.log('📺 openEpisodeModal available:', typeof window.openEpisodeModal);
          
          if (typeof window.openEpisodeModal === 'function') {
            try {
              window.openEpisodeModal(seriesId, seriesTitle);
              console.log('📺 Modal function called successfully');
            } catch (error) {
              console.error('📺 Error calling episode modal:', error);
            }
          } else {
            console.warn('📺 Episode tracking modal function not available');
          }
          return;
        }
        
        const action = btn.getAttribute("data-action");
        const id = Number(btn.getAttribute("data-id"));
        const mediaType = btn.getAttribute("data-media-type");
        const rating = btn.getAttribute("data-rating");
        
        if (action === "addFromCache") {
          addToListFromCache(id, btn.getAttribute("data-list"));
        } else if (action === "move") {
          moveItem(id, btn.getAttribute("data-list"));
        } else if (action === "remove") {
          removeItemFromCurrentList(id);
        } else if (action === "rate") {
          setRating(id, rating);
        } else if (action === "like") {
          setLikeStatus(id, "like");
        } else if (action === "dislike") {
          setLikeStatus(id, "dislike");
        } else if (action === "open") {
          openTMDBLink(id, mediaType);
        }
      }, true); // Use capture phase
      
      document.addEventListener("DOMContentLoaded", () => {
        // Use centralized initialization if available
        if (window.FlickletApp && typeof window.FlickletApp.init === 'function') {
          console.log('🚀 Using centralized FlickletApp initialization');
          window.FlickletApp.init(); // <-- CALL IT HERE
          return;
        }

        // --- FALLBACK INITIALIZATION SEQUENCE
        console.log('⚠️ Using fallback initialization sequence');
        
        // 1. Load app data first
        loadAppData?.();
        
        // 2. Try to import from share link (STEP 2.1 — Only import shared content when URL explicitly includes ?share=)
        (function guardedShareImportOnce(){
          try {
            if (window.__shareImportRun) return; // run once per page load
            const p = new URLSearchParams(location.search);
            if (!p.has('share')) return; // explicit opt-in only
            window.__shareImportRun = true;
            tryImportFromShareLink?.();
          } catch (e) {
            console.warn('Share import guard error:', e);
          }
        })();
        
        // 3. Load genres
        loadGenres?.();
        
        // 4. Restore theme from localStorage
        const savedTheme = localStorage.getItem("flicklet-theme");
        if (savedTheme === "dark") {
          document.body.classList.add("dark-mode");
        }
        
        // 5. Ensure language dropdown is properly initialized
        const ensureLanguageDropdown = () => {
          const langToggle = document.getElementById("langToggle");
          if (langToggle && langToggle.children.length < 2) {
            langToggle.innerHTML = `
              <option value="en">EN</option>
              <option value="es">ES</option>
            `;
            // Set the current language
            if (appData?.settings?.lang) {
              langToggle.value = appData.settings.lang;
            }
          }
        };
        
        // Call it immediately and also after a delay to catch any late modifications
        ensureLanguageDropdown();
        setTimeout(ensureLanguageDropdown, 100);
        
        // 6. Show home tab by default
        switchToTab("home");
        
        // 7. Update UI (which will call ensureBlocks)
        updateUI?.();
        
        // 8. Check upcoming episodes
        checkUpcomingEpisodes?.();
        
        // 9. Apply translations to the initial tab content
        setTimeout(() => {
          if (typeof applyTranslations === "function") {
            applyTranslations();
          }
        }, 200);
        
        // 10. Request notification permissions
        requestNotificationPermission?.();
        
        // 11. Initialize file label
        const importFileInput = document.getElementById("importFile");
        if (importFileInput) {
          updateFileLabel(importFileInput);
        }
        
        // 12. Account button is now handled by FlickletApp.updateAccountButton()
        
        // start() function will be called by FlickletApp.init() if available
        // --- SEARCH BAR PROTECTION - Prevent it from disappearing

        
        
        
        // --- SEARCH BAR PROTECTION - CSS sticky positioning handles visibility
        // Removed aggressive visibility enforcement - CSS sticky positioning is sufficient
        
        // --- small util
        const bind = (id, fn) => {
          const el = document.getElementById(id);
          if (el) el.onclick = fn;
        };

        // Duplicate initialization sequence removed - using the one above

        // --- tabs
        // DISABLED: Old tab binding system - now handled by FlickletApp
        // bind("homeTab", () => switchToTab("home"));
        // bind("watchingTab", () => switchToTab("watching"));
        // bind("wishlistTab", () => switchToTab("wishlist"));
        // bind("watchedTab", () => switchToTab("watched"));
        // bind("discoverTab", () => switchToTab("discover"));
        // bind("settingsTab", () => switchToTab("settings"));

        
        // --- delegated actions for cards & search results
        // (Event listener moved outside DOMContentLoaded to ensure it always runs)
        // --- dark mode (HANDLED VIA EVENT DELEGATION ABOVE)
        // Dark mode is now handled in the main click event listener above

        // --- mardi toggle
        const root = document.getElementById("appRoot");
        bind("mardiToggle", () => root && root.classList.toggle("mardi"));
        bind("mardiOnBtn", () => root && root.classList.toggle("mardi"));

        // --- language switch (will be set up after data loads)

        // --- Name prompt moved to post-authentication flow for security best practices
        // No more name prompt on app boot - this was causing the name persistence issue

        // --- Account / Auth entry point (modal) - handled by FlickletApp.setupEventListeners()

        // --- Save name button
        bind("saveNameBtn", () => {
          const val = (document.getElementById("displayNameInput")?.value || "").trim();
          if (!val) return showNotification?.(t("enter_name_first"), "warning");
          if (appData?.settings) {
            appData.settings.displayName = val;
            saveAppData?.();
            // updateWelcomeText?.(); // DISABLED - conflicts with dynamic header system
            showNotification?.(t("name_saved"), "success");
          }
        });
        


        // --- feedback handled by Netlify Forms
        function handleFeedbackSubmit(event) {
          console.log('🔍 Feedback form submit handler called');
          console.log('🔍 Hostname:', window.location.hostname);
          
          // Always prevent default first to avoid any server submission
          event.preventDefault();
          event.stopPropagation();
          
          // Store current theme before form submission
          const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
          const themeInput = document.getElementById("feedbackThemeInput");
          if (themeInput) {
            themeInput.value = currentTheme;
          }
          
          // Store theme in localStorage as backup
          localStorage.setItem("flicklet-theme", currentTheme);
          
          // For local development, show success message
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🏠 Local development mode - showing success message');
            showNotification('Thanks for sharing! Your thoughts have been received. 💭 (Local mode - will work in production)', 'success');
            event.target.reset();
            return false;
          }
          
          // For production, submit to Netlify function
          console.log('🌐 Production mode - submitting to Netlify');
          const form = event.target;
          const formData = new FormData(form);
          
          const feedbackData = {
            message: formData.get('message'),
            theme: formData.get('theme'),
            timestamp: new Date().toISOString()
          };
          
          fetch('/.netlify/functions/feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedbackData)
          })
          .then(response => response.json())
          .then(data => {
            console.log('✅ Feedback submitted successfully:', data);
            showNotification('Thanks for sharing! Your thoughts have been received. 💭', 'success');
            form.reset();
          })
          .catch(error => {
            console.error('❌ Error submitting feedback:', error);
            showNotification('Sorry, there was an error submitting your feedback. Please try again.', 'error');
          });
        }

        // Bind feedback form submit handler with proper timing
        function bindFeedbackForm() {
          const feedbackForm = document.querySelector('form[name="feedback"]');
          if (feedbackForm) {
            console.log('🔗 Binding feedback form submit handler');
            feedbackForm.addEventListener('submit', handleFeedbackSubmit);
          } else {
            console.log('⚠️ Feedback form not found, retrying in 100ms');
            setTimeout(bindFeedbackForm, 100);
          }
        }

        // Bind immediately and also after DOM is ready
        bindFeedbackForm();



        // --- search controls (REMOVED - duplicate code that was breaking search functionality)

        // --- backup / import / clear / share
        bind("exportBtn", () => {
          const blob = new Blob([JSON.stringify(appData, null, 2)], {
            type: "application/json",
          });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "flicklet-backup.json";
          document.body.appendChild(a);
          a.click();
          a.remove();
        });

        // Import handler moved to functions.js with robust implementation

        // Nuclear Option moved to inline-script-01.js (FlickletApp)
        // bind("clearAllBtn", () => { ... });

        // Share button bindings moved to runGlobalInitialization

        // --- notification toggles
        const ep = document.getElementById("notifEpisodes");
        const dp = document.getElementById("notifDiscover");
        const md = document.getElementById("notifDigest");
        if (ep)
          ep.addEventListener("change", (e) => {
            if (appData?.settings?.notif) {
              appData.settings.notif.episodes = !!e.target.checked;
              saveAppData?.();
            }
          });
        if (dp)
          dp.addEventListener("change", (e) => {
            if (appData?.settings?.notif) {
              appData.settings.notif.discover = !!e.target.checked;
              saveAppData?.();
            }
          });
        if (md)
          md.addEventListener("change", (e) => {
            if (appData?.settings?.notif) {
              appData.settings.notif.digest = !!e.target.checked;
              saveAppData?.();
            }
          });

        // --- pro toggle
        const proToggle = document.getElementById("proToggle");
        if (proToggle) {
          proToggle.checked = !!appData?.settings?.pro;
          proToggle.addEventListener("change", (e) => {
            if (appData?.settings) {
              appData.settings.pro = !!e.target.checked;
              saveAppData?.();
              rebuildStats?.();
              
              // Show/hide Pro features explanation
              const proFeatures = document.getElementById("proFeatures");
              if (proFeatures) {
                proFeatures.style.display = e.target.checked ? "block" : "none";
              }
            }
          });
          
          // Show Pro features if already enabled
          const proFeatures = document.getElementById("proFeatures");
          if (proFeatures && proToggle.checked) {
            proFeatures.style.display = "block";
          }
        }

        console.debug("[Flicklet] Boot OK");

        // FlickletApp.init() already called at the beginning if available

      });
    