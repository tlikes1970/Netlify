
      /* ============== bootstrap ============== */
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
        
        // 2. Try to import from share link
        tryImportFromShareLink?.();
        
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
        
        // 12. Paint account button based on currentUser if auth has already resolved
        if (typeof setAccountLabel === "function") setAccountLabel(currentUser);
        
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
        bind("homeTab", () => switchToTab("home"));
        bind("watchingTab", () => switchToTab("watching"));
        bind("wishlistTab", () => switchToTab("wishlist"));
        bind("watchedTab", () => switchToTab("watched"));
        bind("discoverTab", () => switchToTab("discover"));
        bind("settingsTab", () => switchToTab("settings"));

        
        // --- delegated actions for cards & search results

        
        // Try both event delegation and direct binding
        document.addEventListener("click", (e) => {
          
          
          const btn = e.target.closest("[data-action]");
          if (!btn) {
            return;
          }
          
          const action = btn.getAttribute("data-action");
          const id = Number(btn.getAttribute("data-id"));
          const list = btn.getAttribute("data-list");
          const mediaType = btn.getAttribute("data-media-type");
          
  
          if (action === "addFromCache") {
            addToListFromCache(id, list);
          } else if (action === "move") {
            moveItem(id, list);
          } else if (action === "notes") {
            openNotesTagsModal(id);
          } else if (action === "remove") {
            removeItemFromCurrentList(id);
          } else if (action === "rate") {
            const rating = Number(btn.getAttribute("data-rating"));
            setRating(id, rating);
          } else if (action === "like") {
            setLikeStatus(id, "like");
          } else if (action === "dislike") {
            setLikeStatus(id, "dislike");
          } else if (action === "open") {
            openTMDBLink(id, mediaType);
          }
        });
// --- dark mode
        const darkBtn = document.getElementById("darkModeToggle");
        const setDarkLabel = () => {
          if (!darkBtn) return;
          const dark = document.body.classList.contains("dark-mode");
          const label = darkBtn.querySelector('span');
          if (label) {
            label.textContent = t(dark ? "go_light" : "go_dark");
          }
        };
        setDarkLabel();
        if (darkBtn) {
          darkBtn.onclick = () => {
            document.body.classList.toggle("dark-mode");
            if (window.appData?.settings) {
              appData.settings.theme = document.body.classList.contains(
                "dark-mode"
              )
                ? "dark"
                : "light";
              saveAppData?.();
            }
            setDarkLabel();
          };
        }

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
        event.preventDefault(); // Prevent default form submission
        
        // Store current theme before form submission
        const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
        const themeInput = document.getElementById("feedbackThemeInput");
        if (themeInput) {
          themeInput.value = currentTheme;
        }
        
        // Store theme in localStorage as backup
        localStorage.setItem("flicklet-theme", currentTheme);
        
        // Get form data
        const form = event.target;
        const formData = new FormData(form);
        
        // Convert to JSON for the Netlify function
        const feedbackData = {
          message: formData.get('message'),
          theme: formData.get('theme'),
          timestamp: new Date().toISOString()
        };
        
        // For local development, just show success message
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log('Local development mode - showing success message');
          showNotification('Thanks for sharing! Your thoughts have been received. 💭 (Local mode)', 'success');
          form.reset();
          return false;
        }
        
        // Submit to Netlify function (production only)
        fetch('/.netlify/functions/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackData)
        })
        .then(response => {
          if (response.ok) {
            showNotification('Thanks for sharing! Your thoughts have been received. 💭', 'success');
            form.reset();
          } else {
            showNotification('Oops! Something went wrong. Please try sharing again. 😅', 'error');
          }
        })
        .catch(error => {
          console.error('Feedback submission error:', error);
          showNotification('Failed to submit feedback. Please try sharing again. 😅', 'error');
        });
        
        return false;
      }



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

        const importFile = document.getElementById("importFile");
        if (importFile) {
          importFile.onchange = (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => {
              try {
                const d = JSON.parse(r.result);
                Object.assign(appData, d);
                saveAppData?.();
                updateUI?.();
                showNotification?.(t("imported_backup"), "success");
              } catch {
                showNotification?.(t("invalid_file"), "error");
              }
            };
            r.readAsText(f);
          };
        }

        bind("clearAllBtn", () => {
          if (!confirm("This wipes everything. You sure?")) return;
          if (appData?.tv)
            appData.tv = { watching: [], wishlist: [], watched: [] };
          if (appData?.movies)
            appData.movies = { watching: [], wishlist: [], watched: [] };
          saveAppData?.();
          updateUI?.();
          showNotification?.(t("all_data_cleared"), "warning");
        });

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
    