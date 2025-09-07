
      /* i18nn handled by js/i18n.js - duplicate removed
	  
      /* ============== Firebase (config) ============== */
      let firebaseInitialized = false;
      let auth = null;
      let db = null;
      let currentUser = null;

      // Check if Firebase is available
      if (typeof firebase === 'undefined') {
        console.error('❌ Firebase scripts not loaded - authentication will be disabled');
        firebaseInitialized = false;
        auth = { signInWithPopup: () => Promise.reject(new Error('Firebase not available')) };
        db = { collection: () => ({ doc: () => ({ get: () => Promise.reject(new Error('Firebase not available')) }) }) };
        // Dispatch event even for failure case
        window.firebaseInitialized = false;
        window.dispatchEvent(new Event('firebase-ready'));
      } else {
        try {
          // Check if Firebase is already initialized
          if (firebase.apps && firebase.apps.length > 0) {
            auth = firebase.auth();
            db = firebase.firestore();
            firebaseInitialized = true;
          } else {
            const app = firebase.initializeApp({
              apiKey: "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM",
              authDomain: "flicklet-71dff.firebaseapp.com",
              projectId: "flicklet-71dff",
              storageBucket: "flicklet-71dff.firebasestorage.app",
              messagingSenderId: "1034923556763",
              appId: "1:1034923556763:web:bba5489cd1d9412c9c2b3e",
            });
            auth = firebase.auth();
            db = firebase.firestore();
            firebaseInitialized = true;
          }
          
          console.log('✅ Firebase initialized successfully');
          // Set global flag and dispatch event
          window.firebaseInitialized = true;
          window.dispatchEvent(new Event('firebase-ready'));
        } catch (error) {
          console.error('❌ Firebase initialization failed:', error);
          firebaseInitialized = false;
          // Provide fallback functions
          auth = { signInWithPopup: () => Promise.reject(new Error('Firebase not available')) };
          db = { collection: () => ({ doc: () => ({ get: () => Promise.reject(new Error('Firebase not available')) }) }) };
          // Dispatch failure event
          window.firebaseInitialized = false;
          window.dispatchEvent(new Event('firebase-ready'));
        }
      }

      // STEP 3.2e — inline-script-01 is the sole owner of Add actions.
      // Neuter any Add attempts here to prevent double-calls and duplicate "Already in list" toasts.
      document.addEventListener('click', (ev) => {
        const el = ev.target.closest('[data-action]');
        if (!el) return;

        const action = el.getAttribute('data-action');
        const id = el.getAttribute('data-id') || el.dataset.id;
        const list = el.getAttribute('data-list') || el.dataset.list;
        const mediaType = el.getAttribute('data-media-type') || el.dataset.mediaType;

        // Neuter any Add attempts here to prevent double-calls and duplicate "Already in list" toasts.
        if (action === 'add' || action === 'addToList' || action === 'addFromCache') {
          // Neuter this legacy path unless explicitly enabled
          if (window.FLICKLET_ADD_OWNER !== 'legacy') {
            // Let the centralized add function handle it - don't call it again
            return;
          }
          const listName = el.getAttribute('data-list') || el.dataset.list;
          const id = el.getAttribute('data-id') || el.dataset.id;
          if (typeof window.addToListFromCache === 'function') {
            window.addToListFromCache(id, listName);
          }
          return;
        }
      }, { capture: true });

      // Make Firebase available globally for other scripts
      window.firebase = firebase;
      window.firebaseInitialized = firebaseInitialized;
      window.auth = auth;
      window.db = db;

      /* ============== App constants / state ============== */
      const DEV = ["localhost","127.0.0.1","::1"].includes(location.hostname) || !!location.port;
      const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w200";
      const API_BASE = DEV
        ? "https://api.themoviedb.org/3"
        : "/.netlify/functions/tmdb";
      const TMDB_KEY = window.TMDB_CONFIG?.apiKey || "b7247bb415b50f25b5e35e2566430b96";

      const appData = {
        tv: { watching: [], wishlist: [], watched: [] },
        movies: { watching: [], wishlist: [], watched: [] },
        settings: {
          theme: "light",
          displayName: "",
          lang: "en",
          pro: false,
          notif: { episodes: false, discover: false, digest: false },
        },
      };

      /* ============== TMDB Localization System ============== */
      const TMDB = {
        base: window.TMDB_CONFIG?.baseUrl || "https://api.themoviedb.org/3",
        key: window.TMDB_CONFIG?.apiKey || window.TMDB_API_KEY || "b7247bb415b50f25b5e35e2566430b96"
      };

      const localizedCache = new Map(); // key: `${lang}:${type}:${id}` -> payload

      async function tmdbFetch(path, lang) {
        const url = `${TMDB.base}${path}?language=${encodeURIComponent(lang)}&api_key=${encodeURIComponent(TMDB.key)}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`TMDB ${r.status} on ${path}`);
        return r.json();
      }

            async function fetchLocalizedCore({ id, type }, lang) {
        
        const cacheKey = `${lang}:${type}:${id}`;
        if (localizedCache.has(cacheKey)) {
          
          return localizedCache.get(cacheKey);
        }
        
        const path = type === "tv" ? `/tv/${id}` : `/movie/${id}`;
        
        try {
          let data = await tmdbFetch(path, lang);
          
          // Minimal fields used by the cards
          let title = (data.title || data.name || "").trim();
          let overview = (data.overview || "").trim();
          const networks = Array.isArray(data.networks) ? data.networks.map(n => n?.name).filter(Boolean) : [];
          
          // Fallback to en-US if locale returns empty strings
          if ((!title || !overview) && lang !== "en-US") {
            try {
              const en = await tmdbFetch(path, "en-US");
              title = title || (en.title || en.name || "");
              overview = overview || (en.overview || "");
            } catch (fallbackError) {
              // Silent fallback - use original data
            }
          }
          
          const result = { title, overview, networks };
          localizedCache.set(cacheKey, result);
          return result;
        } catch (error) {
          // Handle 404 and other errors gracefully
          return null;
        }
      }

      // Preserve user-specific fields when merging
      function mergeLocalizedFields(original, localized) {
        // Do NOT touch user data (notes, tags, rating, list position, etc.)
        return {
          ...original,
          title: localized.title || original.title || original.name || "",
          name: undefined, // normalize to title for rendering
          overview: localized.overview ?? original.overview ?? "",
          networks: localized.networks ?? original.networks ?? []
        };
      }

      // --- Rehydrate lists in the chosen locale ---
      async function rehydrateListsForLocale(lang) {
        // Guards
        if (!appData || !appData.movies || !appData.tv) {
          return;
        }

        const lists = ["watching", "wishlist", "watched"];
        const allItems = [];
        
        // Process movies
        for (const list of lists) {
          const arr = appData.movies[list] || [];
          for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            if (item && (item.id || item.tmdbId)) {
              // Normalize the ID and determine type
              const id = Number(item.id ?? item.tmdbId);
              // Better type detection - avoid 'person' type
              let type = item.media_type;
              if (!type || type === "person") {
                // Infer from available fields
                if (item.first_air_date || item.episode_run_time || item.number_of_seasons) {
                  type = "tv";
                } else if (item.release_date || item.runtime) {
                  type = "movie";
                } else {
                  // Default to movie for items in movies list
                  type = "movie";
                }
              }
              
              if (id && type && type !== "person") {
                allItems.push({ 
                  item, 
                  list, 
                  category: "movies",
                  arrayIndex: i,
                  id,
                  type
                });
              }
            }
          }
        }
        
        // Process TV shows
        for (const list of lists) {
          const arr = appData.tv[list] || [];
          for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            if (item && (item.id || item.tmdbId)) {
              // Normalize the ID and determine type
              const id = Number(item.id ?? item.tmdbId);
              // Better type detection - avoid 'person' type
              let type = item.media_type;
              if (!type || type === "person") {
                // Infer from available fields
                if (item.first_air_date || item.episode_run_time || item.number_of_seasons) {
                  type = "tv";
                } else if (item.release_date || item.runtime) {
                  type = "movie";
                } else {
                  // Default to tv for items in tv list
                  type = "tv";
                }
              }
              
              if (id && type && type !== "person") {
                allItems.push({ 
                  item, 
                  list, 
                  category: "tv",
                  arrayIndex: i,
                  id,
                  type
                });
              }
            }
          }
        }

        // Process items sequentially to avoid rate limits and race conditions
        let successCount = 0;
        

        
        for (const { item, list, category, arrayIndex, id, type } of allItems) {
          try {
            const localized = await fetchLocalizedCore({ id, type }, lang);
            
            // Skip items that couldn't be localized (404 errors, etc.)
            if (!localized) {
              continue;
            }
            
            const merged = mergeLocalizedFields({ ...item, id, type }, localized);
            
            // Write back into the correct array position
            appData[category][list][arrayIndex] = merged;
            successCount++;
            
          } catch (error) {
            console.warn(`Failed to localize ${type}/${id}:`, error.message);
          }
          
          // Small delay to be nice to TMDB API
          if (allItems.length > 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      /* ============== Small utilities ============== */
      function toB64Url(str) {
        const bin = new TextEncoder().encode(str);
        let b64 = btoa(String.fromCharCode(...bin));
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
      }
      function fromB64Url(b64url) {
        const b64 = b64url.replace(/-/g,'+').replace(/_/g,'/') + '==='.slice((b64url.length + 3) % 4);
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      }
      function showNotification(msg, type = "info") {
        console.log(`🔔 Global showNotification called: "${msg}" (${type})`);
        // Avoid circular calls - create notification directly
        const n = document.createElement("div");
        n.className = `notification ${type}`;
        n.textContent = msg;
        n.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          z-index: 100000;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          max-width: 300px;
          word-wrap: break-word;
        `;
        const live = document.getElementById('liveRegion');
        if (live) { live.textContent = msg; }
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
      }

      function updateWelcomeText() {
        try {
          // DISABLED: This function conflicts with our dynamic header system
          // The header is now managed by FlickletApp.updateHeaderWithUsername()
          console.log('🚫 updateWelcomeText disabled - header managed by FlickletApp');
          return;
          
          // OLD CODE (disabled):
          /*
          const n = (appData?.settings?.displayName || "").trim();
          
          const el = document.getElementById("welcomeText");
          if (!el) {
            console.log("welcomeText element not found");
            return;
          }
          
          // Only update if user has a display name, otherwise keep "Flicklet"
          if (n) {
            const pool = [
              "Chaos",
              "Questionable Taste",
              "Binge Empire",
              "Streaming Madness",
              "Watch List",
            ];
            const newText = `${n}'s ${pool[Math.floor(Math.random() * pool.length)]}`;
            el.textContent = newText;
          } else {
            // Keep the original "Flicklet" title
            el.textContent = t("app_title");
          }
          */

        } catch (e) {
          console.warn("updateWelcomeText failed:", e);
        }
      }

      function loadAppData() {
        // Skip loading if FlickletApp is managing data AND has actually loaded data with content
        if (window.FlickletApp && window.FlickletApp.appData) {
          // Check if the data actually has content (not just empty arrays)
          const hasTvContent = window.FlickletApp.appData.tv && 
            (window.FlickletApp.appData.tv.watching?.length > 0 || 
             window.FlickletApp.appData.tv.wishlist?.length > 0 || 
             window.FlickletApp.appData.tv.watched?.length > 0);
          const hasMovieContent = window.FlickletApp.appData.movies && 
            (window.FlickletApp.appData.movies.watching?.length > 0 || 
             window.FlickletApp.appData.movies.wishlist?.length > 0 || 
             window.FlickletApp.appData.movies.watched?.length > 0);
          const hasDisplayName = window.FlickletApp.appData.settings && 
            window.FlickletApp.appData.settings.displayName && 
            window.FlickletApp.appData.settings.displayName.trim();
          
          if (hasTvContent || hasMovieContent || hasDisplayName) {
            console.log('🚫 Skipping loadAppData - FlickletApp is managing data with actual content');
            
            // Sync the data to global appData for UI compatibility
            if (window.FlickletApp.appData.tv) {
              appData.tv = window.FlickletApp.appData.tv;
            }
            if (window.FlickletApp.appData.movies) {
              appData.movies = window.FlickletApp.appData.movies;
            }
            if (window.FlickletApp.appData.settings) {
              appData.settings = { ...appData.settings, ...window.FlickletApp.appData.settings };
            }
            console.log('✅ Synced FlickletApp data to global appData');
            return;
          }
        }
        
        try {
          const saved = localStorage.getItem("tvMovieTrackerData");
          if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(appData, {
              tv: parsed.tv || { watching: [], wishlist: [], watched: [] },
              movies: parsed.movies || {
                watching: [],
                wishlist: [],
                watched: [],
              },
              settings: {
                theme: parsed.settings?.theme ?? "light",
                displayName: parsed.settings?.displayName ?? "",
                lang: parsed.settings?.lang ?? "en",
                pro: !!parsed.settings?.pro,
                notif: parsed.settings?.notif || {
                  episodes: false,
                  discover: false,
                  digest: false,
                },
              },
            });
          }
        } catch (e) {
          console.warn("Local load failed", e);
        }
        if (appData.settings.theme === "dark")
          document.body.classList.add("dark-mode");
        
        // Language toggle is now handled by the onchange event directly

        
        // Only update welcome text if we have a display name
        if (appData.settings.displayName && appData.settings.displayName.trim()) {
          updateWelcomeText();
        }
        applyTranslations();
        
        // Sync data with FlickletApp if available
        if (window.FlickletApp && window.FlickletApp.appData) {
          console.log('🔄 Syncing appData with FlickletApp after loadAppData');
          // Update FlickletApp's appData with the loaded data
          window.FlickletApp.appData = { ...appData };
          console.log('✅ FlickletApp appData synced:', window.FlickletApp.appData);
          
          // Update the header with the synced data
          if (typeof window.FlickletApp.updateHeaderWithUsername === 'function') {
            window.FlickletApp.updateHeaderWithUsername();
          }
        }
        
        // Refresh the current tab content after app data is loaded
        setTimeout(() => {
          const currentTab = document.querySelector(".tab-section[style*='display: block']") || 
                            document.querySelector(".tab-section[style*='display: flex']");
          if (currentTab && currentTab.id !== "homeSection") {
            if (currentTab.id === "watchingSection") {
              const items = appData.tv.watching.concat(appData.movies.watching);
              if (typeof updateList === "function") updateList("watchingList", items);
            } else if (currentTab.id === "wishlistSection") {
              const items = appData.tv.wishlist.concat(appData.movies.wishlist);
              if (typeof updateList === "function") updateList("wishlistList", items);
            } else if (currentTab.id === "watchedSection") {
              const items = appData.tv.watched.concat(appData.movies.watched);
              if (typeof updateList === "function") updateList("watchedList", items);
            } else if (currentTab.id === "discoverSection") {
              if (typeof renderDiscover === "function") renderDiscover();
            }
          }
        }, 100);
      }

      function sanitizeForFirestore(value) {
        if (value === undefined) return undefined;
        if (value === null) return null;
        const t = typeof value;
        if (t === "string" || t === "boolean") return value;
        if (t === "number") return Number.isFinite(value) ? value : null;
        if (value instanceof Date) return value;
        if (Array.isArray(value))
          return value.map(sanitizeForFirestore).filter((v) => v !== undefined);
        if (t === "object") {
          const out = {};
          for (const [k, v] of Object.entries(value)) {
            const c = sanitizeForFirestore(v);
            if (c !== undefined) out[k] = c;
          }
          return out;
        }
        return undefined;
      }

      async function loadUserDataFromCloud(uid) {
        try {
          const snap = await db.collection("users").doc(uid).get();
          if (!snap.exists) return;
          const cloud = snap.data() || {};
          
          // Always load from Firebase when user signs in, regardless of local state
          console.log('🔄 Loading user data from Firebase cloud storage');
          
          // Preserve local settings before any cloud operations
          const localDisplayName = (appData.settings?.displayName || "").trim();
          const localLanguage = (appData.settings?.lang || "en");
          
          // Track if we loaded any data from cloud
          let dataLoadedFromCloud = false;
          
          if (cloud.watchlists) {
            // Only overwrite local data if Firebase has actual content
            if (cloud.watchlists.tv && 
                (cloud.watchlists.tv.watching?.length > 0 || 
                 cloud.watchlists.tv.wishlist?.length > 0 || 
                 cloud.watchlists.tv.watched?.length > 0)) {
              console.log('🔄 Firebase has TV data, using it');
              console.log('🔍 Firebase TV watching count:', cloud.watchlists.tv.watching?.length);
              console.log('🔍 Local TV watching count:', appData.tv?.watching?.length);
              appData.tv = cloud.watchlists.tv;
              dataLoadedFromCloud = true;
            } else {
              console.log('🚫 Firebase TV data is empty, keeping local data');
            }
            
            if (cloud.watchlists.movies && 
                (cloud.watchlists.movies.watching?.length > 0 || 
                 cloud.watchlists.movies.wishlist?.length > 0 || 
                 cloud.watchlists.movies.watched?.length > 0)) {
              console.log('🔄 Firebase has movie data, using it');
              appData.movies = cloud.watchlists.movies;
              dataLoadedFromCloud = true;
            } else {
              console.log('🚫 Firebase movie data is empty, keeping local data');
            }
          }
                      if (cloud.settings) {
              const incoming = { ...cloud.settings };

              // Fallback for the mistaken top-level field during migration
              if (!incoming.displayName && typeof cloud['settings.displayName'] === 'string') {
                const stray = cloud['settings.displayName'].trim();
                if (stray) incoming.displayName = stray;
              }

              // Only override with local if non-empty
              if (localDisplayName) {
                incoming.displayName = localDisplayName;
              }

              appData.settings = { ...(appData.settings || {}), ...incoming };
            }

          if (typeof cloud.pro === "boolean") appData.settings.pro = cloud.pro;

          // Ensure display name is preserved after sanitization
          const cleaned = sanitizeForFirestore({
            tv: appData.tv,
            movies: appData.movies,
            settings: appData.settings,
          });
          appData.tv = cleaned.tv || {
            watching: [],
            wishlist: [],
            watched: [],
          };
          appData.movies = cleaned.movies || {
            watching: [],
            wishlist: [],
            watched: [],
          };
          appData.settings = cleaned.settings || appData.settings;
          
          // Restore local settings if they were lost during sanitization
          if (localDisplayName && (!appData.settings.displayName || !appData.settings.displayName.trim())) {
            appData.settings.displayName = localDisplayName;
          }
          // Don't restore language setting - let user's choice persist

          localStorage.setItem("tvMovieTrackerData", JSON.stringify(appData));
          
          // Sync data to FlickletApp if it exists
          if (window.FlickletApp && window.FlickletApp.appData) {
            console.log('🔄 Syncing Firebase data to FlickletApp...');
            window.FlickletApp.appData.tv = appData.tv;
            window.FlickletApp.appData.movies = appData.movies;
            window.FlickletApp.appData.settings = appData.settings;
            
            // Save to centralized storage
            localStorage.setItem('flicklet-data', JSON.stringify(window.FlickletApp.appData));
            console.log('✅ Data synced to FlickletApp and saved to centralized storage');
          }
          
          // If we loaded data from cloud, also save it to localStorage for immediate access
          if (dataLoadedFromCloud) {
            try {
              localStorage.setItem('flicklet-data', JSON.stringify(appData));
              console.log('💾 Cloud data also saved to localStorage for immediate access');
            } catch (error) {
              console.error('❌ Failed to save cloud data to localStorage:', error);
            }
          }
          
          // Prevent dropdown resets during language changes
          if (!window.isChangingLanguage) {
            const langSel = document.getElementById("langToggle");
            if (langSel) {
                          langSel.value = appData.settings.lang || "en";
          }
        }
          
          applyTranslations();
          // updateWelcomeText?.(); // DISABLED - conflicts with dynamic header system
          if (typeof updateUI === "function") updateUI();
          
          showNotification(t("cloud_sync_ok"), "success");
        } catch (e) {
          console.warn("load cloud failed", e);
          showNotification(t("cloud_load_failed"), "warning");
        }
      }

      async function saveAppData() {
        try {
          if (window.FlickletApp && typeof window.FlickletApp.saveData === 'function') {
            // Ensure we always return a Promise
            return Promise.resolve(window.FlickletApp.saveData());
          }
          // Fallback to old system (sync), but still return a resolved Promise
          localStorage.setItem("tvMovieTrackerData", JSON.stringify(appData));

          // Prevent dropdown resets during language changes
          if (!window.isChangingLanguage) {
            const langSel = document.getElementById("langToggle");
            if (langSel) {
              langSel.value = appData.settings.lang || "en";
            }
          }

          applyTranslations?.();
          // updateWelcomeText?.(); // DISABLED - conflicts with dynamic header system
          // updateUI?.(); // DISABLED - causes full page refresh on every rating

          if (!currentUser) return Promise.resolve();
          try {
            const payload = sanitizeForFirestore({
              watchlists: { tv: appData.tv, movies: appData.movies },
              settings: appData.settings,
              pro: !!appData.settings.pro,
              lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            });
            await db
              .collection("users")
              .doc(currentUser.uid)
              .set(payload, { merge: true });
            return Promise.resolve();
          } catch (error) {
            console.error("cloud sync failed", error);
            showNotification(t("cloud_sync_failed"), "warning");
            return Promise.resolve();
          }
        } catch (e) {
          console.error('saveAppData failed', e);
          return Promise.resolve(); // don't explode the call sites
        }
      }

      /* ============== Auth helpers ============== */
      function login() {
        console.log('🔐 Starting Google login...');
        const provider = new firebase.auth.GoogleAuthProvider();
        return auth.signInWithPopup(provider).catch((err) => {
          console.error('❌ Google popup login failed:', err);
          const msg = String(err?.message || "");
          const code = err?.code || "";
          console.log('🔍 Error details - message:', msg, 'code:', code);
          
          const coopBlocked =
            msg.includes("Cross-Origin-Opener-Policy") ||
            msg.includes("window.close") ||
            msg.includes("message channel closed") ||
            code === "auth/popup-closed-by-user" ||
            code === "auth/popup-blocked" ||
            code === "auth/cancelled-popup-request";
          
          if (coopBlocked) {
            console.log('🔄 Popup blocked, trying redirect...');
            return auth.signInWithRedirect(provider);
          }
          throw err;
        });
      }
      function emailLogin() {
        return new Promise((resolve, reject) => {
          openModal(
            "Email Sign In",
            `
              <div style="margin-bottom: 20px;">
                <p style="margin-bottom: 16px;">Enter your email and password to sign in or create an account.</p>
                <div style="display: flex; flex-direction: column; gap: 16px; max-width: 300px; margin: 0 auto;">
                  <input id="emailInput" class="modal-input" type="email" placeholder="Email address" style="text-align: left;" />
                  <input id="passwordInput" class="modal-input" type="password" placeholder="Password" style="text-align: left;" />
                </div>
              </div>
            `,
            "email-login-modal"
          );

          // Add sign in button
          const signInBtn = document.createElement("button");
          signInBtn.type = "button";
          signInBtn.className = "btn secondary";
          signInBtn.textContent = t("sign_in_create_account") || "Sign In / Create Account";
          signInBtn.style.marginBottom = "12px";
          signInBtn.style.fontSize = "14px";
          signInBtn.style.padding = "12px 18px";
          signInBtn.style.height = "44px";
          signInBtn.style.minHeight = "44px";
          signInBtn.style.width = "160px";
          signInBtn.style.flex = "0 0 160px";
          signInBtn.onclick = async () => {
            const email = document.getElementById("emailInput").value.trim();
            const password = document.getElementById("passwordInput").value.trim();
            
            if (!email || !password) {
              showNotification("Please enter both email and password", "warning");
              return;
            }

            try {
              signInBtn.disabled = true;
              signInBtn.textContent = t("signing_in") || "Signing in...";
              
              // Use enhanced auth helper if available
              if (window.authHelpers && window.authHelpers.loginWithEmail) {
                await window.authHelpers.loginWithEmail(email, password);
              } else {
                // Fallback to original auth
                const result = await auth.signInWithEmailAndPassword(email, password);
                document.querySelector(".modal-backdrop")?.remove();
                resolve(result);
                return;
              }
              
              document.querySelector(".modal-backdrop")?.remove();
              resolve();
            } catch (signInError) {
              try {
                // Try to create account if sign in fails
                const result = await auth.createUserWithEmailAndPassword(email, password);
                document.querySelector(".modal-backdrop")?.remove();
                resolve(result);
              } catch (createError) {
                signInBtn.disabled = false;
                signInBtn.textContent = t("sign_in_create_account") || "Sign In / Create Account";
                showNotification(createError.message || "Failed to sign in or create account", "error");
                reject(createError);
              }
            }
          };

          // Find the specific email modal and add the button there
          const emailModal = document.querySelector('[data-testid="email-login-modal"] .modal-actions');
          if (emailModal) {
            console.log('✅ Found email modal, adding sign-in button');
            // Style the modal actions container for better button layout
            emailModal.style.display = 'flex';
            emailModal.style.justifyContent = 'center';
            emailModal.style.gap = '12px';
            emailModal.style.flexWrap = 'wrap';
            emailModal.prepend(signInBtn);
          } else {
            console.log('⚠️ Email modal not found, using fallback');
            // Fallback to any modal if the specific one isn't found
            const fallbackModal = document.querySelector(".modal .modal-actions");
            if (fallbackModal) {
              console.log('✅ Found fallback modal, adding sign-in button');
              // Style the fallback modal actions container too
              fallbackModal.style.display = 'flex';
              fallbackModal.style.justifyContent = 'center';
              fallbackModal.style.gap = '12px';
              fallbackModal.style.flexWrap = 'wrap';
              fallbackModal.prepend(signInBtn);
            } else {
              console.error('❌ No modal found to add button to');
            }
          }

          // Add Enter key handlers
          const emailInput = document.getElementById("emailInput");
          const passwordInput = document.getElementById("passwordInput");
          
          if (emailInput && passwordInput) {
            emailInput.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                passwordInput.focus();
              }
            });
            passwordInput.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                signInBtn.click();
              }
            });
            emailInput.focus();
          }
        });
      }
      
      function appleLogin() {
        console.log('🍎 Starting Apple login...');
        const provider = new firebase.auth.OAuthProvider('apple.com');
        return auth.signInWithPopup(provider).catch((err) => {
          console.error('❌ Apple popup login failed:', err);
          const msg = String(err?.message || "");
          const code = err?.code || "";
          console.log('🔍 Error details - message:', msg, 'code:', code);
          
          const coopBlocked =
            msg.includes("Cross-Origin-Opener-Policy") ||
            msg.includes("window.close") ||
            msg.includes("message channel closed") ||
            code === "auth/popup-closed-by-user" ||
            code === "auth/popup-blocked" ||
            code === "auth/cancelled-popup-request";
          
          if (coopBlocked) {
            console.log('🔄 Popup blocked, trying redirect...');
            return auth.signInWithRedirect(provider);
          }
          throw err;
        });
      }
      
      window.login = login;
      window.emailLogin = emailLogin;
      window.appleLogin = appleLogin;

      function setAccountLabel(u) {
        // DISABLED - Old account button system conflicts with new FlickletApp.updateAccountButton()
        console.log('🚫 setAccountLabel disabled - using new FlickletApp.updateAccountButton() system');
        return;
        
        const btn = document.getElementById("accountBtn");
        if (!btn) return;
        const manual = (appData?.settings?.displayName || "").trim();
        const firebaseName = (u?.displayName || "").trim();
        const emailPrefix = u?.email ? u.email.split("@")[0] : "";
        const chosen = manual || firebaseName || emailPrefix;
        btn.textContent = chosen
          ? `👤 ${chosen.split(/\s+/)[0]}`
          : "👤 Sign In";
      }

      /* ============== Single global auth listener ============== */
      // DISABLED: This conflicts with FlickletApp auth system
      // auth.onAuthStateChanged(async (user) => {
      //   currentUser = user;
      //   // (Optional) kill the legacy painter if still present:
      //   // setAccountLabel(user); // <-- REMOVE this call entirely

      //   if (user) {
      //     const db = firebase.firestore();
      //     const ref = db.collection("users").doc(user.uid);

      //     // If user just signed in, close any open sign-in modals
      //     const signInModals = document.querySelectorAll('.modal-backdrop[data-testid="modal-backdrop"]');
      //     signInModals.forEach(modal => {
      //       if (modal.querySelector('[data-testid="auth-modal"]')) {
      //         modal.remove();
      //       }
      //     });

      //     try {
      //       // 1) Base fields (never write empty displayName)
      //       await ref.set(
      //         {
      //           profile: {
      //             email: user.email || "",
      //             photoURL: user.photoURL || "",
      //           },
      //           provider: user.providerData?.[0]?.providerId || "",
      //           lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      //         },
      //         { merge: true }
      //       );

      //       // 2) Only write displayName if non-empty
      //       const authName = (user.displayName || "").trim();
      //       if (authName) {
      //         await ref.set({ "profile.displayName": authName }, { merge: true });
      //       }
      //       // If authName is empty (email/password), we DO NOT touch profile.displayName.

      //       await loadUserDataFromCloud(user.uid);

      //       // Refresh the current tab content after cloud data is loaded
      //       setTimeout(() => {
      //         if (typeof applyTranslations === "function") {
      //           applyTranslations();
      //         }
      //         // Also refresh the current tab content
      //         const currentTab = document.querySelector(".tab-section[style*='display: block']") || 
      //                           document.querySelector(".tab-section[style*='display: flex']");
      //         if (currentTab && currentTab.id !== "homeSection") {
      //           if (currentTab.id === "watchingSection") {
      //             const items = appData.tv.watching.concat(appData.movies.watching);
      //             if (typeof updateList === "function") updateList("watchingList", items);
      //           } else if (currentTab.id === "wishlistSection") {
      //             const items = appData.tv.wishlist.concat(appData.movies.wishlist);
      //             if (typeof updateList === "function") updateList("wishlistList", items);
      //           } else if (currentTab.id === "watchedSection") {
      //             const items = appData.tv.watched.concat(appData.movies.watched);
      //             if (typeof updateList === "function") updateList("watchedList", items);
      //           } else if (currentTab.id === "discoverSection") {
      //             if (typeof renderDiscover === "function") renderDiscover();
      //           }
      //         }
      //       }, 300);

      //       // DISABLED - Old auto-set system conflicts with new FlickletApp username prompt system
      //       console.log('🚫 Old auto-set displayName system disabled - using new FlickletApp system');
      //       return;
          
      //       // Check if user needs to set a display name after successful authentication
      //       const currentDisplayName = (appData?.settings?.displayName || "").trim();
      //       if (!currentDisplayName) {
      //         // Try to use Google/Apple profile name first
      //         const guess =
      //           (user.displayName && user.displayName.trim()) ||
      //           (user.email && user.email.split("@")[0]) ||
      //           "";
          
      //         if (guess) {
      //           // Auto-set the name from profile
      //           appData.settings.displayName = guess.trim();
      //           if (typeof saveAppData === "function") saveAppData();
      //           // if (typeof updateWelcomeText === "function") updateWelcomeText(); // DISABLED - conflicts with dynamic header system
      //           if (typeof rebuildStats === "function") rebuildStats();
      //           localStorage.setItem("__flicklet_onboarded__", "1");
      //           // setAccountLabel(user); // DISABLED - conflicts with new FlickletApp.updateAccountButton()
      //         } else {
      //           // No profile name available - prompt user to set one
      //           setTimeout(() => {
      //             if (!appData.settings.displayName || !appData.settings.displayName.trim()) {
      //               // Only show if no other modal is already open
      //               if (!document.querySelector('.modal-backdrop')) {
      //                 showNameModal(true);
      //               }
      //             }
      //           }, 500); // Small delay to ensure everything is loaded
      //         }
      //       }
      //     } catch (e) {
      //       console.warn("auth-state update failed", e);
      //     }
      //   } else {
      //     // signed out flow...
      //   }
      // });

      /* ======= Sign-in modal + Name onboarding ======= */
      function openModal(title, html, testId = "generic-modal") {
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
        
        // Ensure all buttons inside the modal are clickable
        const ensureButtonsClickable = () => {
          const buttons = wrap.querySelectorAll('button');
          buttons.forEach(btn => {
            btn.style.pointerEvents = 'auto';
            btn.style.zIndex = '100001';
            btn.style.position = 'relative';
          });
        };
        
        // Make it available globally for other functions
        window.ensureButtonsClickable = ensureButtonsClickable;
        wrap.innerHTML = `
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-testid="${testId}" data-modal-body tabindex="-1" style="position:relative; z-index:100000; pointer-events: auto !important;">
            <h3 id="modal-title">${title}</h3>
            <div class="modal-body" style="pointer-events: auto !important;">${html}</div>
            <div data-auth-msg aria-live="polite" style="min-height:1em; margin:8px 0; color:var(--color-error,#b00020); pointer-events: auto !important;"></div>
            <div class="modal-actions" data-modal-actions style="pointer-events: auto !important;">
              <button class="btn secondary" data-testid="modal-close" type="button" style="width: 120px !important; flex: 0 0 120px !important; font-size: 14px !important; padding: 12px 18px !important; height: 44px !important; min-height: 44px !important; pointer-events: auto !important;">Close</button>
            </div>
          </div>`;
        
        // Prevent form submission issues (but allow button clicks)
        wrap.addEventListener('click', (e) => {
          const t = e.target;
          console.log('🔍 Modal click detected on:', t, 'is backdrop:', t === wrap);
          
          // Only handle clicks on the backdrop itself, not its children
          if (t === wrap) {
            console.log('🔍 Backdrop clicked - this should close modal for non-auth modals');
            return; // Let the existing backdrop close logic handle this
          }
          
          // For clicks on children, only prevent form submissions
          if (t.matches('button[type="submit"], form button:not([type])')) {
            e.preventDefault();
            e.stopPropagation();
          }
          
          // For regular buttons, let them work normally
          if (t.matches('button:not([type="submit"])')) {
            console.log('🔍 Button click detected, allowing it to proceed:', t.id);
            // Don't prevent default or stop propagation - let the button handle it
            return; // Exit early to avoid any interference
          }
          
          // For all other clicks on children, don't interfere
          console.log('🔍 Child element clicked, allowing it to proceed:', t.tagName, t.className);
        });
        
        // Prevent form submissions
        wrap.querySelectorAll('form').forEach(f => {
          f.addEventListener('submit', (e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
          });
          // Normalize buttons to non-submit
          f.querySelectorAll('button:not([type])').forEach(b => b.setAttribute('type','button'));
        });
        document.body.appendChild(wrap);
        
        // Ensure buttons are clickable immediately
        ensureButtonsClickable();
        
        // Force visibility immediately after creation
        wrap.style.visibility = 'visible';
        wrap.style.opacity = '1';
        wrap.style.display = 'flex';
        
        console.log('✅ Modal added to DOM, checking visibility:', {
          display: wrap.style.display,
          visibility: window.getComputedStyle(wrap).visibility,
          opacity: window.getComputedStyle(wrap).opacity,
          rect: wrap.getBoundingClientRect()
        });

        // Additional debugging to check modal visibility
        setTimeout(() => {
          const rect = wrap.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(wrap);
          console.log('🔍 Modal visibility check after timeout:', {
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
            wrap.style.display = 'flex !important';
            wrap.style.visibility = 'visible !important';
            wrap.style.opacity = '1 !important';
            wrap.style.position = 'fixed !important';
            wrap.style.top = '0 !important';
            wrap.style.left = '0 !important';
            wrap.style.width = '100vw !important';
            wrap.style.height = '100vh !important';
            wrap.style.zIndex = '99999 !important';
            wrap.style.background = 'rgba(0,0,0,0.8) !important';
          }
        }, 100);

        const close = () => {
          console.log('🚪 Modal close triggered');
          wrap.remove();
        };
        wrap.addEventListener("click", (e) => {
          console.log('🖱️ Modal backdrop clicked, target:', e.target, 'wrap:', wrap);
          if (e.target === wrap) {
            // Don't close auth modals on backdrop click
            if (testId === 'auth-modal' || testId === 'email-login-modal') {
              console.log('🔒 Auth modal - preventing backdrop close');
              return;
            }
            console.log('🚪 Closing modal due to backdrop click');
            close();
          }
        });
        wrap.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            // Don't close auth modals with Escape key
            if (testId === 'auth-modal' || testId === 'email-login-modal') {
              console.log('🔒 Auth modal - preventing Escape close');
              return;
            }
            close();
          }
        });
        const modalEl = wrap.querySelector('.modal');
        modalEl.focus();
        
        // Style the modal actions container for consistent button layout
        const modalActions = wrap.querySelector('.modal-actions');
        if (modalActions) {
          if (testId === "auth-modal") {
            // For the main sign-in modal, ensure buttons are centered and have consistent spacing
            modalActions.style.display = 'flex';
            modalActions.style.justifyContent = 'center';
            modalActions.style.gap = '12px';
            modalActions.style.flexWrap = 'wrap';
          }
        }
        const closeBtn = wrap.querySelector('[data-testid="modal-close"]');
        closeBtn.addEventListener("click", (e) => {
          console.log('🚪 Close button clicked!');
          close();
        });
        
        // Style the close button to match other buttons in the modal
        if (testId === "email-login-modal") {
          closeBtn.style.width = "120px";
          closeBtn.style.flex = "0 0 120px";
          closeBtn.style.fontSize = "14px";
          closeBtn.style.padding = "12px 18px";
          closeBtn.style.minHeight = "44px";
        } else if (testId === "auth-modal") {
          // Make the main sign-in modal's close button match the email modal's close button
          closeBtn.style.width = "120px";
          closeBtn.style.flex = "0 0 120px";
          closeBtn.style.fontSize = "14px";
          closeBtn.style.padding = "12px 18px";
          closeBtn.style.minHeight = "44px";
        }
      }

      // Export modal API
      window.openModal = openModal;
      window.dispatchEvent(new Event('modal-api-ready'));

      function showNameModal(force = false) {
        const current = (appData.settings.displayName || "").trim();
        if (!force && current) {
          return;
        }

        openModal(
          "Welcome! What should we call you?",
          `
            <div class="modal-content-wrapper">
              <p class="modal-instruction">This will personalize your headers and stats.</p>
              <input id="onboardName" class="modal-input" placeholder="Display name"
                     value="${(current || "").replace(/"/g, "&quot;")}" />
            </div>
          `,
          "name-onboarding"
        );

        const saveBtn = document.createElement("button");
        saveBtn.className = "btn success";
        saveBtn.textContent = t("save") || "Save";
        saveBtn.onclick = () => {
          const v = (document.getElementById("onboardName").value || "").trim();
          if (!v) {
            const el = document.getElementById('onboardName');
            if (el) {
              el.setAttribute('aria-invalid','true');
              let err = document.getElementById('onboardError');
              if (!err) {
                err = document.createElement('div');
                err.id = 'onboardError';
                err.className = 'form-error';
                err.textContent = t('please_enter_display_name') || 'Please enter a display name.';
                el.setAttribute('aria-describedby','onboardError');
                el.insertAdjacentElement('afterend', err);
              } else { err.textContent = t('please_enter_display_name') || 'Please enter a display name.'; }
            }
            return;
          }
          appData.settings.displayName = v;
          saveAppData();
          // updateWelcomeText?.(); // DISABLED - conflicts with dynamic header system
          rebuildStats?.();
          localStorage.setItem("__flicklet_onboarded__", "1");
          document.querySelector(".modal-backdrop")?.remove();
          // setAccountLabel disabled - using FlickletApp.updateAccountButton() system
          // if (currentUser) setAccountLabel?.(currentUser);
          // Don't automatically show sign-in modal - user should authenticate first
        };
        document.querySelector(".modal .modal-actions").prepend(saveBtn);

        // Add Enter key handler to the name input
        const nameInput = document.getElementById("onboardName");
        if (nameInput) {
          nameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              saveBtn.click();
            }
          });
        }
      }

      window.showEmailLoginModal = function showEmailLoginModal() {
        console.log('✉️ showEmailLoginModal called');
        console.log('🔍 emailLogin function available:', typeof emailLogin);
        console.log('🔍 openModal function available:', typeof openModal);
        try {
          if (typeof emailLogin === 'function') {
            emailLogin();
            console.log('✅ emailLogin called successfully');
          } else {
            console.error('❌ emailLogin function not available');
          }
        } catch (error) {
          console.error('❌ Error showing email login modal:', error);
        }
      };

      // DISABLED: Sign-in modal handled by app.js
      // window.showSignInModal = function showSignInModal() {
      //   console.log('🔑 showSignInModal called');
      //   console.log('🔍 openModal function available:', typeof openModal);
      //   console.log('🔍 currentUser state:', currentUser);
      //   try {
      //     openModal(
      //       "Sign in to sync",
      //       `
      //         <p style="margin-bottom: 20px;">Sign in to back up your lists and sync across devices.</p>
      //         <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; justify-content:center; align-items:center; max-width:320px; margin:0 auto;">
      //           <button id="googleBtn" type="button" class="btn" style="font-size:14px; padding:12px 18px; min-height:44px;">🔒 Google</button>
      //           <button id="appleBtn" type="button" class="btn secondary" style="font-size:14px; padding:12px 18px; min-height:44px;">🍎 Apple</button>
      //           <button id="emailBtn" type="button" class="btn secondary" style="font-size:14px; padding:12px 18px; min-height:44px; grid-column: 1 / -1;">✉️ Email</button>
      //           <button id="signOutBtn" type="button" class="btn secondary" style="display:none; font-size:14px; padding:12px 18px; min-height:44px;">Sign Out</button>
      //         </div>
      //     `,
      //       "auth-modal"
      //     );
      //     console.log('✅ Sign in modal created and added to DOM');
      //     } catch (error) {
      //       console.error('❌ Error creating sign in modal:', error);
      //     }
      //     // ... rest of function body commented out
      //   }

      function escapeHtml(str) {
        return (str || "").replace(
          /[&<>"']/g,
          (s) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            }[s])
        );
      }

      /* ============== TMDB helpers (Localization + Fallback) ============== */
      function langQuery() {
        // Use global appData or FlickletApp appData to get the most current language setting
        const currentLang = (window.appData?.settings?.lang) || 
                           (window.FlickletApp?.appData?.settings?.lang) || 
                           (appData?.settings?.lang) || 
                           'en';
        const lang = currentLang === "es"
          ? "&language=es-ES"
          : "&language=en-US";
        console.log('🌐 langQuery called, current language:', currentLang, '->', lang);
        return lang;
      }

      async function tmdbGet(endpoint, params = "", tryFallback = true) {
        const lang = langQuery();
        let url;

        if (DEV) {
          const sep = params && params[0] === "&" ? "" : "&";
          url = `${API_BASE}/${endpoint}?api_key=${encodeURIComponent(
            TMDB_KEY
          )}${sep}${params}${lang}`;
        } else {
          url = `${API_BASE}?endpoint=${endpoint}${params}${lang}`;
        }

        const r = await fetch(url);
        if (r.ok) {
          const data = await r.json();
          if (
            tryFallback &&
            (!data || (Array.isArray(data.results) && !data.results.length))
          ) {
            const fallback = DEV
              ? `${API_BASE}/${endpoint}?api_key=${encodeURIComponent(
                  TMDB_KEY
                )}${params}&language=en-US`
              : `${API_BASE}?endpoint=${endpoint}${params}&language=en-US`;
            const r2 = await fetch(fallback);
            if (r2.ok) return await r2.json();
          }
          return data;
        }

        if (tryFallback) {
          const fallback = DEV
            ? `${API_BASE}/${endpoint}?api_key=${encodeURIComponent(
                TMDB_KEY
              )}${params}&language=en-US`
            : `${API_BASE}?endpoint=${endpoint}${params}&language=en-US`;
          const r2 = await fetch(fallback);
          if (r2.ok) return await r2.json();
        }
        throw new Error(`TMDB request failed: ${r.status}`);
      }
      



        

        


      async function fetchShowData(query, page = 1, genre = "") {
        let endpoint, params;
        if (genre && !query) {
          endpoint = "discover/tv";
          params = `&page=${page}&with_genres=${genre}`;
        } else {
          endpoint = "search/multi";
          params = `&page=${page}${
            query ? `&query=${encodeURIComponent(query)}` : ""
          }`;
        }

        const data = await tmdbGet(endpoint, params, true);
        const enhanced = await Promise.all(
          (data.results || []).map(async (item) => {
            try {
              if (item.media_type === "tv" || item.first_air_date) {
                const d = await tmdbGet(`tv/${item.id}`, "", true);
                return {
                  ...item,
                  status: d.status,
                  number_of_seasons: d.number_of_seasons,
                  number_of_episodes: d.number_of_episodes,
                  last_air_date: d.last_air_date,
                  first_air_date: d.first_air_date,
                  next_episode_to_air: d.next_episode_to_air,
                  last_episode_to_air: d.last_episode_to_air,
                  in_production: d.in_production,
                  genres: d.genres,
                  networks: d.networks || [],
                  episode_run_time: d.episode_run_time || [45],
                  runtime: d.episode_run_time ? d.episode_run_time[0] : 45,
                };
              } else if (item.media_type === "movie" || item.release_date) {
                const d = await tmdbGet(`movie/${item.id}`, "", true);
                return {
                  ...item,
                  status: d.status,
                  release_date: d.release_date,
                  genres: d.genres,
                  runtime: d.runtime || 120,
                };
              }
            } catch (_) {}
            return item;
          })
        );
        return enhanced;
      }

              async function loadGenres() {
        console.log('🎬 loadGenres() called');
        try {
          console.log('🎬 Calling tmdbGet for genre/tv/list...');
          const data = await tmdbGet("genre/tv/list", "", true);
          console.log('🎬 TMDB response:', data);
          
          const sel = document.getElementById("genreFilter");
          if (!sel) {
            console.error('🎬 Genre filter element not found!');
            return;
          }
          console.log('🎬 Genre filter element found, clearing...');
          sel.innerHTML = "";
          const all = document.createElement("option");
          all.value = "";
          // Get current language for "All Genres" text
          const currentLang = (window.LanguageManager?.getCurrentLanguage?.()) || 
                             (window.appData?.settings?.lang) || 
                             (appData?.settings?.lang) || 
                             'en';
          console.log('🎬 Current language:', currentLang);
          all.textContent = t("all_genres", currentLang);
          sel.appendChild(all);
          console.log('🎬 Added "All Genres" option:', all.textContent);
          
          console.log('🎬 Processing', (data.genres || []).length, 'genres...');
          (data.genres || []).forEach((g, index) => {
            const opt = document.createElement("option");
            opt.value = String(g.id);
            // Try to translate the genre name, fallback to original if no translation
            let genreKey = g.name.toLowerCase().replace(/\s+/g, '_');
    
            
            // Handle special cases
            if (genreKey === "action_&_adventure") genreKey = "action_adventure";
            if (genreKey === "sci-fi_&_fantasy") genreKey = "sci_fi_fantasy";
            if (genreKey === "war_&_politics") genreKey = "war_politics";
            if (genreKey === "talk_show") genreKey = "talk_show";
            
            // Get current language from language manager or fallback to appData
            const currentLang = (window.LanguageManager?.getCurrentLanguage?.()) || 
                               (window.appData?.settings?.lang) || 
                               (appData?.settings?.lang) || 
                               'en';
            const translation = t(genreKey, currentLang);

            opt.textContent = translation || g.name;
            sel.appendChild(opt);
            if (index < 5) { // Log first 5 genres for debugging
              console.log(`🎬 Added genre ${index + 1}: ${g.name} -> ${genreKey} -> "${opt.textContent}"`);
            }
          });
          console.log('🎬 Total genres added:', sel.children.length);
          
        } catch (e) {
          console.error("loadGenres error:", e);
        }
      }

      /* ============== Episode reminders (Enhanced notifications) ============== */
      function checkUpcomingEpisodes() {
        if (!appData.settings?.notif?.episodes) return;
        
        const now = new Date();
        const soonMs = 36 * 60 * 60 * 1000; // 36 hours
        const verySoonMs = 24 * 60 * 60 * 1000; // 24 hours
        
        const watching = [
          ...appData.tv.watching,
          ...appData.movies.watching,
        ].filter((it) => it.media_type === "tv" || it.first_air_date);
        
        watching.forEach((it) => {
          const nextAir = it.next_episode_to_air?.air_date || null;
          if (!nextAir) return;
          
          const airDate = new Date(nextAir + "T00:00:00Z");
          const diff = airDate - now;
          
          if (diff >= 0 && diff <= soonMs) {
            const title = it.name || it.title;
            const dateStr = formatDateShort(nextAir);
            const message = t("upcoming_episode_alert").replace("{title}", title).replace("{date}", dateStr);
            
            // Show notification with proper localization
            showNotification(message, "success");
            
            
          }
        });
      }
      
      // Request notification permission on app load
      function requestNotificationPermission() {
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              showNotification(t("notifications_enabled"), "success");
            }
          });
        }
      }
      

      async function changeLanguage(newLang) {
        console.log('🌍 inline-script-02 changeLanguage delegating to LanguageManager:', newLang);
        
        // Delegate to centralized LanguageManager
        if (window.LanguageManager) {
          return window.LanguageManager.changeLanguage(newLang);
        } else if (window.FlickletApp && typeof window.FlickletApp.changeLanguage === 'function') {
          return window.FlickletApp.changeLanguage(newLang);
        } else {
          console.warn('🌍 No centralized language manager available, using basic fallback');
          // Basic fallback
          if (window.appData?.settings) {
            window.appData.settings.lang = newLang;
          }
          if (typeof applyTranslations === 'function') {
            applyTranslations(newLang);
          }
        }
      }

      /* ============== Discover (Phase 1) ============== */
      function buildUserProfileVector() {
        const liked = getAllItems().filter(
          (it) => it.likeStatus === "like" || (Number(it.userRating) || 0) >= 4
        );
        const genreCounts = {};
        liked.forEach((it) =>
          (it.genres || []).forEach(
            (g) => (genreCounts[g.id] = (genreCounts[g.id] || 0) + 1)
          )
        );
        return genreCounts;
      }

      async function fetchDiscover() {
        const profile = buildUserProfileVector();
        
        // Get more diverse content sources
        const [trendingTv, trendingMovie, popularTv, popularMovie] = await Promise.all([
          tmdbGet("trending/tv/week", "", true).catch(() => ({ results: [] })),
          tmdbGet("trending/movie/week", "", true).catch(() => ({ results: [] })),
          tmdbGet("tv/popular", "", true).catch(() => ({ results: [] })),
          tmdbGet("movie/popular", "", true).catch(() => ({ results: [] }))
        ]);
        
        const pool = [
          ...(trendingTv.results || []),
          ...(trendingMovie.results || []),
          ...(popularTv.results || []),
          ...(popularMovie.results || [])
        ];

        // Remove duplicates by ID
        const uniquePool = pool.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );

        // Get all user's current items to exclude from recommendations
        const userItems = getAllItems();
        const userItemIds = new Set(userItems.map(item => item.id || item.tmdbId));

        // Filter out items that are already on user's lists
        const availablePool = uniquePool.filter(item => !userItemIds.has(item.id));

        const scored = availablePool
          .map((it) => {
            const g = (it.genres || it.genre_ids || []).map((x) =>
              typeof x === "number" ? { id: x } : x
            );
            const score = g.reduce((m, gg) => m + (profile[gg.id] || 0), 0);
            
            // Add bonus points for highly rated content
            const rating = Number(it.vote_average) || 0;
            const ratingBonus = rating >= 8 ? 2 : rating >= 7 ? 1 : 0;
            
            return { ...it, _score: score + ratingBonus };
          })
          .filter((it) => it._score > 0)
          .sort((a, b) => b._score - a._score);

        // If no personalized recommendations, fall back to top-rated content
        if (scored.length === 0) {
          const fallback = availablePool
            .filter(it => (Number(it.vote_average) || 0) >= 7)
            .sort((a, b) => (Number(b.vote_average) || 0) - (Number(a.vote_average) || 0))
            .slice(0, 10);
          
          return await Promise.all(
            fallback.map(async (it) => {
              try {
                if (it.media_type === "tv" || it.first_air_date) {
                  const d = await tmdbGet(`tv/${it.id}`, "", true);
                  return { ...it, ...d, because: "Popular and highly-rated content" };
                } else {
                  const d = await tmdbGet(`movie/${it.id}`, "", true);
                  return { ...it, ...d, because: "Popular and highly-rated content" };
                }
              } catch (_) {
                return it;
              }
            })
          );
        }

        const top = await Promise.all(
          scored.slice(0, 20).map(async (it) => {
            try {
              if (it.media_type === "tv" || it.first_air_date) {
                const d = await tmdbGet(`tv/${it.id}`, "", true);
                return { ...it, ...d, because: pickBecauseLabel() };
              } else {
                const d = await tmdbGet(`movie/${it.id}`, "", true);
                return { ...it, ...d, because: pickBecauseLabel() };
              }
            } catch (_) {
              return it;
            }
          })
        );
        return top;

        function pickBecauseLabel() {
          const liked = getAllItems().filter(
            (x) => x.likeStatus === "like" || (Number(x.userRating) || 0) >= 4
          );
          if (!liked.length) return "";
          const anchor = liked[Math.floor(Math.random() * liked.length)];
          const title = anchor.name || anchor.title || "this";
          return `${t("because_you_liked")} "${title}"`;
        }
      }

      /* ============== Notes & Tags ============== */
      
      // Helper functions for live chip updates
      function notesTagsCountForItem(item) {
        const hasNotes = !!(item?.notes && String(item.notes).trim());
        const tagsCount = Array.isArray(item?.tags) ? item.tags.length : (item?.tags ? String(item.tags).split(',').filter(Boolean).length : 0);
        return (hasNotes ? 1 : 0) + (tagsCount || 0);
      }

      function updateNotesChipForItem(itemId) {
        // Find the card by data-id
        const card = document.querySelector(`.show-card[data-id="${itemId}"]`);

        if (!card) return;

        // Get the current item (uses your findItem)
        const item = findItem(itemId);
        const count = item ? notesTagsCountForItem(item) : 0;

        // Try to find an existing chip in the show-details area
        let chip = card.querySelector('.notes-chip');

        if (count <= 0) {
          // remove chip if present
          if (chip) chip.remove();
          return;
        }

        // Create if missing
        if (!chip) {
          const showDetails = card.querySelector('.show-details');
          if (!showDetails) return;
          
          // Insert after the title, before show-meta
          const title = showDetails.querySelector('.show-title');
          if (!title) return;
          
          chip = document.createElement('a');
          chip.href = '#';
          chip.className = 'notes-chip';
          chip.setAttribute('aria-label', `View notes and tags (${count} items)`);
          chip.addEventListener('click', (e)=>{ e.preventDefault(); openNotesTagsModal(itemId); });
          
          // Insert after the title
          title.insertAdjacentElement('afterend', chip);
        }

        // Update label/text
        chip.setAttribute('aria-label', `View notes and tags (${count} items)`);
        chip.textContent = `📝 Notes • ${count}`;
      }

      window.openNotesTagsModal = function openNotesTagsModal(itemId) {
        console.log('📝 openNotesTagsModal called with itemId:', itemId);
        const item = findItem(itemId);
        if (!item) {
          console.log('📝 Item not found for id:', itemId);
          return;
        }
        console.log('📝 Found item:', item.title || item.name);
        const currentNotes = item.notes || "";
        const currentTags = Array.isArray(item.tags)
          ? item.tags.join(", ")
          : item.tags || "";
        console.log('📝 Current notes:', currentNotes);
        console.log('📝 Current tags:', currentTags);
        
        // Remove any existing notes modal first
        const existingModal = document.querySelector('[data-testid="notes-tags-modal"]');
        if (existingModal) {
          existingModal.closest('.modal-backdrop')?.remove();
        }
        
        // Create custom modal without default close button
        const wrap = document.createElement("div");
        wrap.className = "modal-backdrop";
        wrap.style.display = "flex";
        wrap.style.position = "fixed";
        wrap.style.top = "0";
        wrap.style.left = "0";
        wrap.style.width = "100%";
        wrap.style.height = "100%";
        wrap.style.backgroundColor = "rgba(0,0,0,0.5)";
        wrap.style.zIndex = "10000";
        wrap.style.alignItems = "center";
        wrap.style.justifyContent = "center";
        wrap.innerHTML = `
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-testid="notes-tags-modal" tabindex="-1">
            <h3 id="modal-title">Notes & Tags</h3>
            <div class="modal-body">
              <label>Notes</label>
              <textarea id="notesText" style="width:100%; min-height:120px;">${escapeHtml(currentNotes)}</textarea>
              <label style="margin-top:8px; display:block;">Tags (comma-separated)</label>
              <input id="tagsInput" class="search-input" value="${escapeHtml(currentTags)}" />
            </div>
            <div class="modal-actions">
              <button class="btn secondary" onclick="closeNotesTagsModal()">Cancel</button>
              <button class="btn danger" onclick="clearNotesTags(${itemId})">Clear</button>
              <button class="btn" onclick="saveNotesTags(${itemId})">Save</button>
            </div>
          </div>`;
        document.body.appendChild(wrap);
        console.log('📝 Notes modal created and added to DOM');
        
        // Focus the modal
        const modalEl = wrap.querySelector('.modal');
        modalEl.focus();
        console.log('📝 Notes modal focused');
      }

      window.saveNotesTags = async function saveNotesTags(itemId) {
        console.log('📝 saveNotesTags called for itemId:', itemId);
        const notes = (document.getElementById("notesText").value || "").trim();
        const tagsRaw = (document.getElementById("tagsInput").value || "").trim();
        const tags = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

        const item = findItem(itemId);
        if (!item) { console.log('⚠️ Item not found for saving'); return; }

        console.log('📝 Before save - notes:', item.notes, 'tags:', item.tags);
        item.notes = notes;
        item.tags = tags;
        console.log('📝 After save - notes:', item.notes, 'tags:', item.tags);

        if (typeof saveAppData === 'function') {
          await saveAppData();
        }
        updateTagFiltersUI?.();

        // Live-update the chip without global re-render
        updateNotesChipForItem(itemId);

        closeNotesTagsModal();
        console.log('✓ Notes & tags saved');
      }

      window.clearNotesTags = async function clearNotesTags(itemId) {
        console.log('📝 clearNotesTags called for itemId:', itemId);
        const item = findItem(itemId);
        if (!item) { console.log('⚠️ Item not found for clearing'); return; }

        console.log('📝 Before clear - notes:', item.notes, 'tags:', item.tags);
        item.notes = "";
        item.tags = [];
        console.log('📝 After clear - notes:', item.notes, 'tags:', item.tags);

        if (typeof saveAppData === 'function') {
          await saveAppData();
        }
        updateTagFiltersUI?.();

        // Live-update chip → disappears immediately
        updateNotesChipForItem(itemId);

        closeNotesTagsModal();
        console.log('✓ Notes & tags cleared');
      }

      window.closeNotesTagsModal = function closeNotesTagsModal() {
        // Remove all modal backdrops to be safe
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
          modal.remove();
        });
      }

      function updateTagFiltersUI() {
        const all = new Set();
        getAllItems().forEach((it) =>
          (it.tags || []).forEach((tag) => all.add(tag))
        );
        const row = document.getElementById("tagFilterRow");
        row.innerHTML = "";
        [...all].sort().forEach((tag) => {
          const btn = document.createElement("button");
          btn.className =
            "tag-pill" + (activeTagFilters.has(tag) ? " active" : "");
          btn.textContent = `#${tag}`;
          btn.onclick = () => {
            if (activeTagFilters.has(tag)) activeTagFilters.delete(tag);
            else activeTagFilters.add(tag);
            updateTagFiltersUI();
            updateUI();
          };
          row.appendChild(btn);
        });
        if (all.size === 0) row.innerHTML = "";
      }

      function filterByTags(items) {
        if (!activeTagFilters.size) return items;
        return items.filter((it) => {
          const tags = new Set(it.tags || []);
          for (const tag of activeTagFilters) if (!tags.has(tag)) return false;
          return true;
        });
      }

      /* ============== Shareable lists (read-only links) ============== */
      function openShareSelectionModal() {
        console.log('🔗 Opening share selection modal');
        
        // Guard: Don't open share modal when any modal is up
        if (document.querySelector('.modal-backdrop')) {
          console.log('⚠️ Another modal is open, deferring share modal');
          return;
        }
        
        // Check if modal exists
        const modal = document.getElementById('shareSelectionModal');
        if (!modal) {
          console.error('❌ Share selection modal not found!');
          return;
        }
        
        console.log('✅ Modal found, populating...');
        
        // Populate the modal with all items from all lists
        populateShareModal();
        
        // Show the modal
        modal.style.display = 'flex';
        console.log('✅ Modal displayed');
        
        // Add click outside to close functionality
        modal.onclick = function(e) {
          if (e.target === modal) {
            closeShareSelectionModal();
          }
        };
      }
      
      // Make the function available on window object for safety wrapper
      window.openShareSelectionModal = openShareSelectionModal;
      
      // Apply safety wrapper immediately after function definition
      (() => {
        const original = window.openShareSelectionModal;
        if (typeof original !== 'function') return;

        window.openShareSelectionModal = function (origin) {
          // Is this an explicit click on the Share button?
          const isUserClick =
            (origin && origin.target && origin.target.closest?.('#shareListBtn')) ||
            (typeof origin === 'string' && /^(user|btn)$/i.test(origin));

          // Never auto-open while in Settings unless user clicked the Share button
          const inSettings = !!(window.FlickletApp?.currentTab === 'settings');

          if (!isUserClick && inSettings) {
            console.debug('🛡️ Blocked auto share modal while in Settings.');
            return;
          }
          
          // Additional safety: force close any existing share modal before opening
          // BUT only if it's NOT a legitimate user click
          const shareModal = document.getElementById('shareSelectionModal');
          if (shareModal && inSettings && !isUserClick) {
            console.debug('🛡️ Force closing existing share modal in Settings (not user click).');
            shareModal.style.setProperty('display', 'none', 'important');
            shareModal.classList.remove('active');
            return;
          }
          
          // If this is a legitimate user click, set the interaction flag
          if (isUserClick) {
            // Set global interaction flags for the safety net
            if (window.shareModalInteractionTracker) {
              window.shareModalInteractionTracker.lastUserShareClick = Date.now();
              window.shareModalInteractionTracker.userIsInteractingWithModal = true;
              console.debug('🛡️ Setting interaction flags for legitimate user click');
            }
          }
          
          return original.apply(this, arguments);
        };
      })();

      // --- Not Interested Modal (idempotent, global root) ---
      function ensureRoot(){
        let root = document.querySelector('[data-modal-root]');
        if (!root) {
          root = document.createElement('div');
          root.id = 'modal-root';
          root.setAttribute('data-modal-root','');
          document.body.appendChild(root);
        }
        return root;
      }

      function closeNI(){
        const node = document.querySelector('[data-modal="not-interested"]');
        if (node) node.remove();
        
        // Restore search bar and navigation tabs
        const searchBar = document.querySelector('.top-search');
        const header = document.querySelector('.header');
        const tabs = document.querySelector('.tab-container');
        const settingsTabs = document.querySelector('.settings-tabs');
        
        if (searchBar) {
          searchBar.style.display = '';
          console.log('🔍 Restored search bar');
        }
        if (header) {
          header.style.display = '';
          console.log('🔍 Restored header');
        }
        if (tabs) {
          tabs.style.display = '';
          console.log('🔍 Restored tabs');
        }
        if (settingsTabs) {
          settingsTabs.style.display = '';
          console.log('🔍 Restored settings tabs');
        }
      }

      async function populateList(container){
        // Read list from your canonical store (mirror of what list-actions writes)
        const dataSource = window.appData || appData;
        const ni = dataSource?.notInterested || [];
        const ul = container.querySelector('[data-ni-list]');
        ul.innerHTML = ni.length
          ? ni.map(x => `<li data-id="${x.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px;">
              <span>${x.title || x.id}</span>
              <button data-ni-remove="${x.id}" class="btn btn-ghost" type="button" style="padding: 4px 8px; font-size: 0.8rem;">Remove</button>
            </li>`).join('')
          : `<li class="muted" style="text-align: center; padding: 20px; color: var(--text-secondary); font-style: italic;">No items marked as not interested.</li>`;
      }

      function openNotInterestedModal(){
        console.log('🚫 Opening not interested modal');
        const root = ensureRoot();

        // Build once; remove any existing instance
        closeNI();
        
        // Hide search bar and navigation tabs to prevent z-index conflicts
        const searchBar = document.querySelector('.top-search');
        const header = document.querySelector('.header');
        const tabs = document.querySelector('.tab-container');
        const settingsTabs = document.querySelector('.settings-tabs');
        
        if (searchBar) {
          searchBar.style.display = 'none';
          console.log('🔍 Hidden search bar');
        }
        if (header) {
          header.style.display = 'none';
          console.log('🔍 Hidden header');
        }
        if (tabs) {
          tabs.style.display = 'none';
          console.log('🔍 Hidden tabs');
        }
        if (settingsTabs) {
          settingsTabs.style.display = 'none';
          console.log('🔍 Hidden settings tabs');
        }

        const wrap = document.createElement('div');
        wrap.setAttribute('data-modal','not-interested');
        wrap.setAttribute('data-testid','not-interested-modal');
        wrap.style.cssText = [
          'position:fixed !important','inset:0 !important','display:flex !important','align-items:center !important','justify-content:center !important',
          'background:rgba(0,0,0,.5) !important','z-index:99999 !important','pointer-events:auto !important','visibility:visible !important','opacity:1 !important',
          'top:0 !important','left:0 !important','width:100vw !important','height:100vh !important'
        ].join(';');

        wrap.innerHTML = `
          <div role="dialog" aria-modal="true" class="modal" style="min-width:320px;max-width:640px;background:var(--color-surface,var(--card,#fff));border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:16px;position:relative;z-index:1000000 !important;pointer-events:auto !important;">
            <header style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <h3 style="margin:0;font-size:18px;color:var(--text);">🚫 Manage "Not Interested"</h3>
              <button type="button" class="btn" data-ni-close style="padding: 4px 8px;">✕</button>
            </header>
            <div data-ni-body style="max-height:60vh;overflow:auto;">
              <ul data-ni-list style="display:grid;gap:8px;padding:0;margin:0;list-style:none;"></ul>
            </div>
            <footer style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
              <button type="button" class="btn secondary" data-ni-clear style="padding: 8px 16px;">Clear all</button>
              <button type="button" class="btn primary" data-ni-close style="padding: 8px 16px;">Done</button>
            </footer>
          </div>
        `;

        // Stop clicks inside from closing
        wrap.addEventListener('click', (e) => {
          console.log('🔍 Modal clicked on:', e.target);
          if (e.target === wrap) e.stopPropagation();
        });

        root.appendChild(wrap);
        
        console.log('🔍 Modal created with z-index:', wrap.style.zIndex);
        console.log('🔍 Modal element:', wrap);

        // Wire actions
        wrap.querySelectorAll('[data-ni-close]').forEach(b=>{
          console.log('🔍 Adding close listener to button:', b);
          b.addEventListener('click', (e) => {
            console.log('🔍 Close button clicked!');
            closeNI();
          });
        });

        wrap.addEventListener('click', (e) => {
          const rmBtn = e.target.closest('[data-ni-remove]');
          if (rmBtn) {
            const id = rmBtn.getAttribute('data-ni-remove');
            try {
              const dataSource = window.appData || appData;
              if (dataSource && dataSource.notInterested) {
                const next = dataSource.notInterested.filter(x => String(x.id) !== String(id));
                dataSource.notInterested = next;
                // Save to localStorage
                if (window.saveAppData) window.saveAppData();
              }
              // Remove row
              rmBtn.closest('li')?.remove();
              // Optionally emit a rerender event
              document.dispatchEvent(new CustomEvent('notinterested:changed', { detail:{ action:'remove', id }}));
            } catch (e) {
              console.error('NI remove failed', e);
            }
          }
        });

        const clearBtn = wrap.querySelector('[data-ni-clear]');
        if (clearBtn) {
          console.log('🔍 Adding clear listener to button:', clearBtn);
          clearBtn.addEventListener('click', (e) => {
            console.log('🔍 Clear button clicked!');
            const dataSource = window.appData || appData;
            if (dataSource) {
              dataSource.notInterested = [];
              if (window.saveAppData) window.saveAppData();
            }
            wrap.querySelector('[data-ni-list]').innerHTML = `<li class="muted" style="text-align: center; padding: 20px; color: var(--text-secondary); font-style: italic;">No items marked as not interested.</li>`;
            document.dispatchEvent(new CustomEvent('notinterested:changed', { detail:{ action:'clear' }}));
          });
        }

        // Fill list
        populateList(wrap);
      }

      // Expose globally so Settings button can call it
      window.openNotInterestedModal = openNotInterestedModal;

      function populateNotInterestedList() {
        const container = document.getElementById('notInterestedList');
        if (!container) return;
        
        // Use window.appData if available, fallback to local appData
        const dataSource = window.appData || appData;
        console.log('🔍 Debug: populateNotInterestedList using dataSource:', !!dataSource, 'notInterested:', dataSource?.notInterested?.length || 0);
        
        if (!dataSource.notInterested || dataSource.notInterested.length === 0) {
          container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary); font-style: italic;">
              <div style="font-size: 2rem; margin-bottom: 16px;">🎉</div>
              <div>No items marked as not interested!</div>
              <div style="font-size: 0.9rem; margin-top: 8px;">Your recommendations are clean and fresh.</div>
            </div>
          `;
          return;
        }
        
        container.innerHTML = '';
        dataSource.notInterested.forEach((item, index) => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'not-interested-item';
          itemDiv.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin: 8px 0;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
          `;
          
          const dateAdded = new Date(item.dateAdded).toLocaleDateString();
          
          itemDiv.innerHTML = `
            <div>
              <div style="font-weight: 500; margin-bottom: 4px;">${item.title}</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">
                ${item.mediaType === 'tv' ? '📺 TV Series' : '🎬 Movie'} • Added ${dateAdded}
              </div>
            </div>
            <button class="btn danger" onclick="removeFromNotInterested(${index})" style="padding: 6px 12px; font-size: 0.85rem;">
              🗑️ Remove
            </button>
          `;
          
          container.appendChild(itemDiv);
        });
      }

      function removeFromNotInterested(index) {
        if (appData.notInterested && appData.notInterested[index]) {
          const item = appData.notInterested[index];
          appData.notInterested.splice(index, 1);
          saveAppData?.();
          
          showNotification?.(`"${item.title}" removed from not interested list`, 'success');
          
          // Refresh the list
          populateNotInterestedList();
          
          // Update discover list if it's currently visible
          if (typeof renderDiscover === 'function') {
            renderDiscover();
          }
        }
      }
      
      // Make function globally accessible
      window.populateNotInterestedList = populateNotInterestedList;

      function closeNotInterestedModal() {
        const modal = document.getElementById('notInterestedModal');
        if (modal) {
          modal.remove();
        }
      }

      function populateShareModal() {
        console.log('📋 Populating share modal with items');
        
        // Get all items from all lists
        const watchingItems = [...(appData.tv.watching || []), ...(appData.movies.watching || [])];
        const wishlistItems = [...(appData.tv.wishlist || []), ...(appData.movies.wishlist || [])];
        const watchedItems = [...(appData.tv.watched || []), ...(appData.movies.watched || [])];
        
        console.log(`📊 Found ${watchingItems.length} watching, ${wishlistItems.length} wishlist, ${watchedItems.length} watched items`);
        
        // Populate each list section
        populateShareList('shareWatchingList', watchingItems, 'watching');
        populateShareList('shareWishlistList', wishlistItems, 'wishlist');
        populateShareList('shareWatchedList', watchedItems, 'watched');
        
        // Set up select all functionality
        setupSelectAllControls();
        
        // Update generate button state
        updateGenerateButtonState();
      }

      function populateShareList(containerId, items, listType) {
        const container = document.getElementById(containerId);
        if (!container) {
          console.error(`❌ Container not found: ${containerId}`);
          return;
        }
        
        container.innerHTML = '';
        
        if (items.length === 0) {
          container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary); font-style: italic;">
            ${t("no_items_in_list") || "No items in this list"}
          </div>`;
          return;
        }
        
        items.forEach((item, index) => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'share-item';
          itemDiv.innerHTML = `
            <input type="checkbox" id="share_${listType}_${index}" data-list="${listType}" data-index="${index}" onchange="updateGenerateButtonState()">
            <div class="share-item-info">
              <div class="share-item-title">${item.title || item.name || 'Unknown Title'}</div>
              <div class="share-item-meta">
                ${item.media_type === 'tv' ? '📺 TV Series' : '🎬 Movie'} • 
                ${item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'Unknown Year'}
                ${item.vote_average ? ` • ⭐ ${item.vote_average}/10` : ''}
              </div>
            </div>
          `;
          container.appendChild(itemDiv);
        });
      }

      function setupSelectAllControls() {
        // Select all for watching
        const selectAllWatching = document.getElementById('selectAllWatching');
        if (selectAllWatching) {
          selectAllWatching.onchange = function() {
            const checkboxes = document.querySelectorAll('#shareWatchingList input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = this.checked);
            updateGenerateButtonState();
          };
        }
        
        // Select all for wishlist
        const selectAllWishlist = document.getElementById('selectAllWishlist');
        if (selectAllWishlist) {
          selectAllWishlist.onchange = function() {
            const checkboxes = document.querySelectorAll('#shareWishlistList input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = this.checked);
            updateGenerateButtonState();
          };
        }
        
        // Select all for watched
        const selectAllWatched = document.getElementById('selectAllWatched');
        if (selectAllWatched) {
          selectAllWatched.onchange = function() {
            const checkboxes = document.querySelectorAll('#shareWatchedList input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = this.checked);
            updateGenerateButtonState();
          };
        }
        
        // Select all everything
        const selectAllEverything = document.getElementById('selectAllEverything');
        if (selectAllEverything) {
          selectAllEverything.onchange = function() {
            const allCheckboxes = document.querySelectorAll('.share-items-list input[type="checkbox"]');
            allCheckboxes.forEach(cb => cb.checked = this.checked);
            
            // Also check the individual select all checkboxes
            if (this.checked) {
              selectAllWatching.checked = true;
              selectAllWishlist.checked = true;
              selectAllWatched.checked = true;
            } else {
              selectAllWatching.checked = false;
              selectAllWishlist.checked = false;
              selectAllWatched.checked = false;
            }
            
            updateGenerateButtonState();
          };
        }
      }

      function updateGenerateButtonState() {
        const generateBtn = document.getElementById('generateShareLinkBtn');
        if (!generateBtn) return;
        
        const checkedBoxes = document.querySelectorAll('.share-items-list input[type="checkbox"]:checked');
        const hasCheckedItems = checkedBoxes.length > 0;
        
        generateBtn.disabled = !hasCheckedItems;
        
        // Show "Copy" button when items are selected
        const copyBtn = document.getElementById("copyShareBtn");
        if (copyBtn) {
          if (hasCheckedItems) {
            copyBtn.style.display = "inline-block";
          } else {
            copyBtn.style.display = "none";
          }
        }
      }

      function generateShareLinkFromSelected() {
        const checkedBoxes = document.querySelectorAll('.share-items-list input[type="checkbox"]:checked');
        
        if (checkedBoxes.length === 0) {
          showNotification(t("no_items_selected") || "No items selected", "warning");
          return;
        }
        
        // Group selected items by list type
        const selectedItems = {
          watching: [],
          wishlist: [],
          watched: []
        };
        
        checkedBoxes.forEach(checkbox => {
          const listType = checkbox.getAttribute('data-list');
          const index = parseInt(checkbox.getAttribute('data-index'));
          
          if (listType && !isNaN(index)) {
            const listKey = listType === 'watching' ? 'watching' : listType === 'wishlist' ? 'wishlist' : 'watched';
            const items = [...(appData.tv[listKey] || []), ...(appData.movies[listKey] || [])];
            
            if (items[index]) {
              const item = items[index];
              // Only include essential fields for sharing - this will make URLs much shorter!
              const minimalItem = {
                id: item.id,
                title: item.title || item.name,
                type: item.type || 'tv',
                media_type: item.media_type || 'tv',
                poster_path: item.poster_path,
                overview: item.overview,
                first_air_date: item.first_air_date,
                vote_average: item.vote_average
              };
              selectedItems[listKey].push(minimalItem);
            }
          }
        });
        
        console.log('📋 Selected items (minimal data):', selectedItems);
        
        // Create a human-readable text list instead of a complex URL
        let shareText = "📺 My TV & Movie Lists\n\n";
        
        // Add items by list with clear headers
        if (selectedItems.watching.length > 0) {
          shareText += "🔴 Currently Watching:\n";
          selectedItems.watching.forEach(item => {
            const network = item.networks?.[0] || "Unknown Service";
            shareText += `  • ${item.title} (${network})\n`;
          });
          shareText += "\n";
        }
        
        if (selectedItems.wishlist.length > 0) {
          shareText += "🟡 Want to Watch:\n";
          selectedItems.wishlist.forEach(item => {
            const network = item.networks?.[0] || "Unknown Service";
            shareText += `  • ${item.title} (${network})\n`;
          });
          shareText += "\n";
        }
        
        if (selectedItems.watched.length > 0) {
          shareText += "🟢 Already Watched:\n";
          selectedItems.watched.forEach(item => {
            const network = item.networks?.[0] || "Unknown Service";
            shareText += `  • ${item.title} (${network})\n`;
          });
          shareText += "\n";
        }
        
        // Update the share output to show the text list
        const shareLinkOut = document.getElementById("shareLinkOut");
        if (shareLinkOut) {
          shareLinkOut.value = shareText;
          shareLinkOut.style.height = "auto";
          shareLinkOut.style.minHeight = "200px";
          shareLinkOut.style.fontFamily = "monospace";
          shareLinkOut.style.whiteSpace = "pre-wrap";
          shareLinkOut.style.resize = "vertical";
          shareLinkOut.style.overflowY = "auto";
        }
        
        // Hide "Select what to share" button, show "Copy" button
        const generateBtn = document.getElementById("generateShareLinkBtn");
        const copyBtn = document.getElementById("copyShareBtn");
        
        if (generateBtn && copyBtn) {
          generateBtn.style.display = "none";
          copyBtn.style.display = "inline-block";
        }
        
        console.log('✅ Share text generated:', shareText);
      }



      function copyShareList() {
        console.log('🔍 Copy button clicked!');
        
        // Generate the list first
        const checkedBoxes = document.querySelectorAll('.share-items-list input[type="checkbox"]:checked');
        
        if (checkedBoxes.length === 0) {
          showNotification("No items selected", "warning");
          return;
        }
        
        console.log('📝 Generating list for', checkedBoxes.length, 'items...');
        
        // Group selected items by list type
        const selectedItems = {
          watching: [],
          wishlist: [],
          watched: []
        };
        
        checkedBoxes.forEach(checkbox => {
          const listType = checkbox.getAttribute('data-list');
          const index = parseInt(checkbox.getAttribute('data-index'));
          
          if (listType && !isNaN(index)) {
            const listKey = listType === 'watching' ? 'watching' : listType === 'wishlist' ? 'wishlist' : 'watched';
            const items = [...(appData.tv[listKey] || []), ...(appData.movies[listKey] || [])];
            
            if (items[index]) {
              const item = items[index];
              // Only include essential fields for sharing
              const minimalItem = {
                id: item.id,
                title: item.title || item.name,
                type: item.type || 'tv',
                media_type: item.media_type || 'tv',
                poster_path: item.poster_path,
                overview: item.overview,
                first_air_date: item.first_air_date,
                vote_average: item.vote_average
              };
              selectedItems[listKey].push(minimalItem);
            }
          }
        });
        
        console.log('📋 Selected items:', selectedItems);
        
        // Create the shareable text
        let shareText = "📺 My TV & Movie Lists\n\n";
        
        if (selectedItems.watching.length > 0) {
          shareText += "🔴 Currently Watching:\n";
          selectedItems.watching.forEach(item => {
            const network = item.networks?.[0] || "Unknown Service";
            shareText += `  • ${item.title} (${network})\n`;
          });
          shareText += "\n";
        }
        
        if (selectedItems.wishlist.length > 0) {
          shareText += "🟡 Want to Watch:\n";
          selectedItems.wishlist.forEach(item => {
            const network = item.networks?.[0] || "Unknown Service";
            shareText += `  • ${item.title} (${network})\n`;
          });
          shareText += "\n";
        }
        
        if (selectedItems.watched.length > 0) {
          shareText += "🟢 Already Watched:\n";
          selectedItems.watched.forEach(item => {
            const network = item.networks?.[0] || "Unknown Service";
            shareText += `  • ${item.title} (${network})\n`;
          });
          shareText += "\n";
        }
        
        console.log('📋 Share text generated:', shareText);
        
        // Copy the text to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
          console.log('📋 Text copied to clipboard');
          
          // Show copy confirmation
          showNotification('List copied', 'success');
          
          // Close the modal and return to settings page
          closeShareSelectionModal();
          
          // Show instruction notification after returning to settings
          setTimeout(() => {
            showNotification('📤 Paste this in a text message or email to share', 'info');
          }, 500);
        }).catch(err => {
          console.error('❌ Failed to copy:', err);
          showNotification('Failed to copy list', 'error');
        });
      }

      function saveDisplayName() {
        const displayNameInput = document.getElementById("displayNameInput");
        const newName = displayNameInput.value.trim();
        
        if (!newName) {
          showNotification("Please enter a name", "warning");
          return;
        }
        
        // Check if user is logged in
        if (!currentUser) {
          showNotification("Please sign in to save your name", "warning");
          return;
        }
        
        // Check if username already exists for this login
        const existingName = appData?.settings?.displayName;
        if (existingName && existingName !== newName) {
          // Show custom confirmation modal instead of browser confirm()
          showUsernameOverwriteModal(existingName, newName);
          return;
        }
        
        // If no existing name or same name, save directly
        saveUsernameDirectly(newName);
        

      }
      
      function showUsernameOverwriteModal(existingName, newName) {
        // Create custom modal HTML
        const modalHTML = `
          <div class="modal-backdrop" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
            <div class="modal" style="background: var(--card); border-radius: 12px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
              <h3 style="margin: 0 0 16px 0; color: var(--text);">⚠️ Username Already Exists</h3>
              <p style="margin: 0 0 20px 0; color: var(--text); line-height: 1.5;">
                A username <strong>"${existingName}"</strong> already exists for this account.<br><br>
                Do you want to overwrite it with <strong>"${newName}"</strong>?
              </p>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="btn secondary" onclick="closeUsernameOverwriteModal()" style="min-width: 80px;">
                  Cancel
                </button>
                <button class="btn primary" onclick="confirmUsernameOverwrite('${newName}')" style="min-width: 80px;">
                  Overwrite
                </button>
              </div>
            </div>
          </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
      }
      
      function closeUsernameOverwriteModal() {
        // Remove all modal-backdrop elements to be safe
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
          if (modal.querySelector('.modal h3')?.textContent.includes('Username Already Exists')) {
            modal.remove();
          }
        });
      }
      
      function confirmUsernameOverwrite(newName) {
        // Close the modal
        closeUsernameOverwriteModal();
        
        // Save the username
        saveUsernameDirectly(newName);
      }
      
      async function saveUsernameDirectly(newName) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const username = (newName || '').trim();
        
        // Write to Firestore settings.username only
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          try {
            const db = firebase.firestore();
            await db.collection('users').doc(user.uid).set({
              meta: {
                settings: { 
                  username: username,
                  usernamePrompted: true 
                }
              }
            }, { merge: true });
            console.log('✅ Username saved to Firestore settings.username:', username);
          } catch (error) {
            console.error('❌ Failed to save username to Firestore:', error);
            return;
          }
        }

        // keep local data in sync if you rely on it
        window.appData = window.appData || {};
        window.appData.settings = { ...(window.appData.settings||{}), username };

        // reflect in UI
        if (window.FlickletApp && typeof window.FlickletApp.setLeftSnark === 'function') {
          window.FlickletApp.setLeftSnark(username ? window.FlickletApp.makeSnark(username) : '');
        }
        
        showNotification(`Username saved as "${username}"`, "success");
      }
      
      function closeUsernamePromptModal() {
        const modal = document.getElementById('usernamePromptModal');
        if (modal) {
          modal.remove();
        }
      }
      
      function showRemoveConfirmationModal(itemTitle, onConfirm) {
        // Guard against modal stacking
        if (document.querySelector('[data-testid="remove-confirmation-modal"]')) {
          console.log('⚠️ Remove confirmation modal already exists, not creating another');
          return;
        }
        
        const modalHTML = `
          <div class="modal-content">
            <h3>🗑️ Remove Item</h3>
            <p>Remove "${itemTitle}" from this list?</p>
            <div class="modal-actions">
              <button class="btn secondary" onclick="closeRemoveConfirmationModal()">Cancel</button>
              <button class="btn danger" onclick="confirmRemoveItem()">Remove</button>
            </div>
          </div>
        `;
        
        openModal("Remove Item", modalHTML, "remove-confirmation-modal");
        
        // Store the callback globally so the button can access it
        window._removeConfirmationCallback = onConfirm;
      }
      
      function closeRemoveConfirmationModal() {
        // Target specifically the remove confirmation modal by finding the backdrop that contains the modal with the specific testId
        const modalContent = document.querySelector('[data-testid="remove-confirmation-modal"]');
        if (modalContent) {
          const modal = modalContent.closest('.modal-backdrop');
          if (modal) {
            modal.remove();
          }
        }
        window._removeConfirmationCallback = null;
      }
      
      function confirmRemoveItem() {
        if (window._removeConfirmationCallback) {
          window._removeConfirmationCallback();
        }
        closeRemoveConfirmationModal();
      }
      
      function saveUsernameFromPrompt() {
        const input = document.getElementById('newUsernameInput');
        const newName = input?.value?.trim();
        
        if (!newName) {
          showNotification("Please enter a name", "warning");
          return;
        }
        
        // Close the modal first
        closeUsernamePromptModal();
        
        // Update the FlickletApp's appData first
        if (window.FlickletApp && window.FlickletApp.appData) {
          if (!window.FlickletApp.appData.settings) {
            window.FlickletApp.appData.settings = {};
          }
          window.FlickletApp.appData.settings.displayName = newName;
          console.log('✅ Updated FlickletApp appData with username:', newName);
        }
        
        // Save the username using existing function
        saveUsernameDirectly(newName);
        
        // Note: saveUsernameDirectly() already calls updateHeaderWithUsername()
        // No need to call it again here
      }
      


      function closeShareSelectionModal() {
        const modal = document.getElementById('shareSelectionModal');
        if (modal) {
          modal.style.display = 'none';
        }
      }
      
      // Make the function available on window object
      window.closeShareSelectionModal = closeShareSelectionModal;

      // Legacy function for backward compatibility
      function generateShareLinkForCurrentTab() {
        console.log('⚠️ Using legacy share function - redirecting to new modal');
        openShareSelectionModal();
      }

      function tryImportFromShareLink() {
        const hash = location.hash || "";
        const m = hash.match(/#share=([A-Za-z0-9_\-]+)/);
        if (!m) return;
        
        // Don't auto-open share modal during initialization
        console.log('🔗 Share link detected in URL, but skipping auto-open during initialization');
        return;
        try {
          const decoded = JSON.parse(fromB64Url(m[1]));
          if (decoded && decoded.v === 1) {
            if (decoded.selected && decoded.items) {
              // New format: selected items from multiple lists
              console.log('📥 Importing selected items from share link');
              
              // Import minimal data items - they'll be enhanced when needed
              Object.keys(decoded.items).forEach(listKey => {
                if (Array.isArray(decoded.items[listKey])) {
                  // Add items to the appropriate list
                  decoded.items[listKey].forEach(item => {
                    if (item.media_type === 'tv') {
                      if (!appData.tv[listKey]) appData.tv[listKey] = [];
                      appData.tv[listKey].push(item);
                    } else if (item.media_type === 'movie') {
                      if (!appData.movies[listKey]) appData.movies[listKey] = [];
                      appData.movies[listKey].push(item);
                    }
                  });
                }
              });
            } else if (decoded.list) {
              // Legacy format: single list
              console.log('📥 Importing legacy format share link');
              if (Array.isArray(decoded.tv))
                appData.tv[decoded.list] = decoded.tv;
              if (Array.isArray(decoded.movies))
                appData.movies[decoded.list] = decoded.movies;
            }
            
            saveAppData?.();
            updateUI?.();
            showNotification(t("imported_from_link"), "success");
          }
        } catch (e) {
          console.warn("share import failed", e);
        }
      }

      /* ============== UI helpers ============== */
      // STEP 3.2a — Guarded date formatter used by getSeriesPill/createShowCard
      if (typeof window.formatDateShort !== 'function') {
        window.formatDateShort = function formatDateShort(dateStr) {
          if (!dateStr) return '';
          try {
            const lang =
              (window.appData?.settings?.lang === 'es') ? 'es-ES' : 'en-US';
            const d = new Date(dateStr);
            if (isNaN(d)) return '';
            return d.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' });
          } catch (_) {
            return '';
          }
        };
      }

      function getSeriesPill(item) {
        if (!item || (item.media_type !== "tv" && !item.first_air_date))
          return "";
        const status = (item.status || "").toLowerCase();
        const nextAir = item.next_episode_to_air?.air_date || null;
        const lastAir =
          item.last_episode_to_air?.air_date || item.last_air_date || null;
        const firstAir = item.first_air_date || null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstAirFuture = firstAir ? new Date(firstAir) > today : false;

        let mode;
        if (["ended", "canceled", "cancelled"].includes(status)) mode = "ended";
        else if (
          ["planned", "pilot"].includes(status) ||
          firstAirFuture ||
          (status === "in production" && !lastAir)
        )
          mode = "upcoming";
        else mode = "ongoing";

        let label = "",
          cls = "";
        if (mode === "ended") {
          cls = "status-ended";
          label = `${t("series_complete")}${
            lastAir ? ` • ${formatDateShort(lastAir)}` : ""
          }`;
        } else if (mode === "upcoming") {
          cls = "status-upcoming";
          const when = firstAir || nextAir;
          label = `${t("coming_soon")}${
            when ? ` • ${formatDateShort(when)}` : ""
          }`;
        } else {
          cls = "status-ongoing";
          const when = nextAir
            ? `${t("next")}: ${formatDateShort(nextAir)}`
            : lastAir
            ? `${t("last")}: ${formatDateShort(lastAir)}`
            : null;
          label = [t("currently_airing"), when].filter(Boolean).join(" • ");
        }

        const title = [
          item.status || null,
          nextAir ? `${t("next")}: ${formatDateShort(nextAir)}` : null,
          lastAir ? `${t("last")}: ${formatDateShort(lastAir)}` : null,
        ]
          .filter(Boolean)
          .join(" • ");

        return `<span class="series-pill ${cls}" title="${title}">${label}</span>`;
      }

      async function ensureTvDetails(item, card) {
        if (item.media_type !== "tv" && !item.first_air_date) return;
        const needs = !(
          item.status &&
          (item.next_episode_to_air || item.last_air_date) &&
          item.networks
        );
        if (!needs) return;
        try {
          const d = await tmdbGet(`tv/${item.id}`, "", true);
          Object.assign(item, {
            status: d.status,
            number_of_seasons: d.number_of_seasons,
            number_of_episodes: d.number_of_episodes,
            last_air_date: d.last_air_date,
            first_air_date: d.first_air_date,
            next_episode_to_air: d.next_episode_to_air,
            last_episode_to_air: d.last_episode_to_air,
            in_production: d.in_production,
            genres: d.genres,
            networks: d.networks || [],
            episode_run_time: d.episode_run_time || [45],
            runtime:
              item.runtime ?? (d.episode_run_time ? d.episode_run_time[0] : 45),
          });
          const meta = card.querySelector(".show-meta");
          const pillWrap = card.querySelector(".rating-container");
          if (meta) {
            const networkNames = (item.networks || [])
              .map((n) => n.name)
              .join(", ");
            const date = item.first_air_date || item.release_date || "";
            const rating = item.vote_average
              ? Number(item.vote_average).toFixed(1)
              : "N/A";
            const mediaType = item.media_type || "tv";
            meta.textContent = [
              `⭐ ${rating}`,
              date ? ` • ${date.split("-")[0]}` : "",
              ` • ${mediaType.toUpperCase()}`,
              networkNames ? ` • ${t("streaming_on")}: ${networkNames}` : ""
            ].join("");
          }
          if (pillWrap) {
            const old = pillWrap.querySelector(".series-pill");
            if (old) old.remove();
            pillWrap.insertAdjacentHTML("beforeend", getSeriesPill(item));
          }
        } catch (_) {}
      }

      // Helper function for notes chip
      function renderNotesChip(item) {
        if (!window.FLAGS?.notesChipEnabled) return '';
        
        const hasNotes = item.notes && item.notes.trim();
        const hasTags = item.tags && item.tags.length > 0;
        
        if (!hasNotes && !hasTags) return '';
        
        const notesCount = hasNotes ? 1 : 0;
        const tagsCount = hasTags ? item.tags.length : 0;
        const totalCount = notesCount + tagsCount;
        
        return `<a href="#" class="notes-chip" onclick="openNotesTagsModal(${item.id}); return false;" aria-label="View notes and tags (${totalCount} items)">
          📝 Notes • ${totalCount}
        </a>`;
      }

      function createShowCard(item, isSearch = false, listTab = null) {
        // Use the passed listTab if available, otherwise fall back to currentActiveTab
        const activeTab = listTab || currentActiveTab;


        const card = document.createElement("div");
        card.className = "show-card";
        const title = item.name || item.title || t("unknown_title");
        const date = item.first_air_date || item.release_date || "";
        const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : "N/A";
        const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");
        

        card.setAttribute("data-id", String(item.id));
        card.setAttribute("data-media-type", mediaType);

        const posterHtml = item.poster_path
          ? `<button class="poster-button" data-action="open" data-id="${item.id}" data-media-type="${mediaType}" aria-label="Open on TMDB"><img class="show-poster" src="${TMDB_IMG_BASE}${item.poster_path}" alt="${escapeHtml(title)}"></button>`
          : `<button class="poster-button" data-action="open" data-id="${item.id}" data-media-type="${mediaType}" aria-label="Open on TMDB"><div class="poster-placeholder">${t("no_image")}</div></button>`;

        const runtimeMinutes =
          Number(item.runtime) ||
          (mediaType === "tv"
            ? (Array.isArray(item.episode_run_time) && Number(item.episode_run_time[0])) || 45
            : 120);
        card.setAttribute("data-runtime-minutes", String(runtimeMinutes));

        const networkNames = (item.networks || []).map((n) => n.name).join(", ");

        let actions = "";
        if (isSearch) {
          actions = `
        <div class="show-actions">
          <button class="btn" data-action='addFromCache' data-id='${Number(item.id)}' data-list='watching'>▶️ ${t("currently_watching")}</button>
          <button class="btn" data-action='addFromCache' data-id='${Number(item.id)}' data-list='wishlist'>📖 ${t("want_to_watch")}</button>
          <button class="btn" data-action='addFromCache' data-id='${Number(item.id)}' data-list='watched'>✅ ${t("already_watched")}</button>
          <button class="btn danger" data-action='notInterested' data-id='${Number(item.id)}' data-media-type='${mediaType}'>🚫 ${t('not_interested')}</button>
        </div>`;
        } else {
          // Use search result card style for regular cards but preserve all functionality
          const likeStatus = item.likeStatus || "none";
          const userRating = item.userRating || 0;
          
          // Create interactive star rating buttons
          const stars = [1,2,3,4,5].map((n) =>
            `<button class="star-btn ${n <= userRating ? "active" : ""}" data-action="rate" data-rating="${n}" data-id="${item.id}" aria-label="${t("rate_out_of_5").replace("{n}", n)}" aria-pressed="${n <= userRating}">${n <= userRating ? "★" : "☆"}</button>`
          ).join("");
          
          actions = `
        <div class="show-actions">
          ${activeTab !== "watching" ? `<button class="btn" data-action="move" data-id="${item.id}" data-list="watching">▶️ ${t("currently_watching")}</button>` : ''}
          ${activeTab !== "wishlist" ? `<button class="btn" data-action="move" data-id="${item.id}" data-list="wishlist">📖 ${t("want_to_watch")}</button>` : ''}
          ${activeTab !== "watched" ? `<button class="btn" data-action="move" data-id="${item.id}" data-list="watched">✅ ${t("already_watched")}</button>` : ''}
          <button class="btn" data-action="notes" data-id="${item.id}">✎ ${t("notes_tags")}</button>
          <button class="btn danger" data-action="remove" data-id="${item.id}">🗑️ ${t("remove")}</button>
        </div>
        
        <div class="rating-info" style="margin-top:8px; padding:8px; background:var(--color-bg-secondary); border-radius:4px; font-size:0.9rem;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span>${t("your_rating")}:</span>
            <div class="star-rating">${stars}</div>
            <div class="like-dislike" style="margin-left:auto;">
              <button class="like-btn ${likeStatus === "like" ? "active" : ""}" data-action="like" data-id="${item.id}" aria-label="${t("like")}">👍</button>
              <button class="dislike-btn ${likeStatus === "dislike" ? "active" : ""}" data-action="dislike" data-id="${item.id}" aria-label="${t("dislike")}">👎</button>
            </div>
          </div>
          ${mediaType === "tv" ? getSeriesPill(item) : ""}
        </div>`;
        }

        card.innerHTML = `
          ${posterHtml}
          <div class="show-details">
            <h4 class="show-title">
              <button class="btn-link" data-action="open" data-id="${item.id}" data-media-type="${mediaType}" aria-label="Open ${escapeHtml(title)} on TMDB">
                ${escapeHtml(title)} <span aria-hidden="true" style="opacity:.6">🔗</span>
              </button>
            </h4>
            ${renderNotesChip(item)}
            <div class="show-meta"></div>
            <div class="show-overview">${escapeHtml(item.overview || t("no_description"))}</div>

            <div class="trivia-slot"></div>
            <div class="providers-slot"></div>
            <div class="extras-slot"></div>

            <div class="card-pills" role="group" aria-label="More information"></div>
            <div class="card-drawer" hidden></div>

            <div class="show-actions">${actions}</div>
          </div>`;

        const meta = card.querySelector(".show-meta");
        if (meta) {
          meta.textContent = [
            `⭐ ${rating}`,
            date ? ` • ${date.split("-")[0]}` : "",
            ` • ${mediaType.toUpperCase()}`,
            networkNames ? ` • ${t("streaming_on")}: ${networkNames}` : ""
          ].join("");
        }

        // Star rating and like/dislike buttons are handled by delegated event listeners in inline-script-03.js

        ensureTvDetails(item, card);
        
        // Lazy-load providers, extras, and trivia
        setTimeout(() => {
          try { window.__FlickletAttachProviders?.(card, item); } catch {}
          try { window.__FlickletAttachExtras?.(card, item); } catch {}
          try { window.__FlickletAttachTrivia?.(card, item); } catch {}
          try { window.__afterCardCreate?.(card, item); } catch {}
        }, 0);
        
        return card;
      }

      function openTMDBLink(id, type) {
        window.open(`https://www.themoviedb.org/${type}/${id}`, "_blank");
      }

      /* Lists & ops */
      function getAllItems() {
        return ["tv", "movies"].flatMap((cat) =>
          ["watching", "wishlist", "watched"].flatMap(
            (lst) => appData[cat][lst] || []
          )
        );
      }
      function addToList(item, list) {
        // --- normalize incoming search item ---
        const norm = { ...item };
        if (norm.id != null) norm.id = Number(norm.id);
        if (!norm.media_type) {
          norm.media_type = norm.first_air_date ? "tv" : "movie";
        }

        const cat =
          norm.media_type === "tv" || norm.first_air_date ? "tv" : "movies";

        // Already in target?
        const inTarget = (appData[cat][list] || []).some(
          (s) => Number(s.id) === Number(norm.id)
        );
        if (inTarget) {
          showNotification(
            t("already_in_list_warning").replace("{list}", list.replace("wishlist", t("want_to_watch"))),
            "warning"
          );
          return;
        }
        // Remove from everywhere else (both cats; all lists)
        let foundElsewhere = false;
        ["tv", "movies"].forEach((c) => {
          ["watching", "wishlist", "watched"].forEach((lst) => {
            const before = appData[c][lst].length;
            appData[c][lst] = appData[c][lst].filter(
              (s) => Number(s.id) !== Number(norm.id)
            );
            if (appData[c][lst].length !== before) foundElsewhere = true;
          });
        });

        // Add to target
        appData[cat][list].unshift(norm);
        saveAppData();
        updateUI();

        // Generate snarky feedback message for adding from search
        const title = norm.name || norm.title || "This show";
        let message = "";
        
        if (list === "watching") {
          message = `"${title}" is now in the spotlight! ✨`;
        } else if (list === "wishlist") {
          message = `"${title}" added to the queue! 📋`;
        } else if (list === "watched") {
          message = `"${title}" marked as watched! ✅`;
        }
        
        if (message) {
          showNotification(message, "success");
        }
      }

      function moveItem(id, dest) {
        console.log(`🔄 moveItem called: id=${id}, dest=${dest}`);
        
        const item = findItem(id);
        if (!item) {
          console.log(`❌ Item not found: id=${id}`);
          return;
        }
        
        // Find where the item currently is
        let currentList = null;
        ["tv", "movies"].forEach((cat) =>
          ["watching", "wishlist", "watched"].forEach((lst) => {
            if (appData[cat][lst].some((s) => s.id === id)) {
              currentList = lst;
            }
            appData[cat][lst] = appData[cat][lst].filter((s) => s.id !== id);
          })
        );
        
        const cat = item.media_type === "tv" ? "tv" : "movies";
        appData[cat][dest].unshift(item);
        saveAppData?.();
        updateUI?.();
        
        // Generate snarky feedback message
        const title = item.name || item.title || "This show";
        let message = "";
        
        if (dest === "watching") {
          if (currentList === "wishlist") {
            message = `"${title}" must be in the front of the line! 🚀`;
          } else if (currentList === "watched") {
            message = `"${title}" is back from the dead! 🧟‍♂️`;
          } else {
            message = `"${title}" is now in the spotlight! ✨`;
          }
        } else if (dest === "wishlist") {
          if (currentList === "watching") {
            message = `Successfully put "${title}" in the backseat! 🚗`;
          } else if (currentList === "watched") {
            message = `"${title}" is back on the wishlist! 📝`;
          } else {
            message = `"${title}" added to the queue! 📋`;
          }
        } else if (dest === "watched") {
          if (currentList === "watching") {
            message = `Well, at least we can say we accomplished something! 👏`;
          } else if (currentList === "wishlist") {
            message = `"${title}" jumped straight to completion! 🎯`;
          } else {
            message = `"${title}" marked as watched! ✅`;
          }
        }
        
        if (message) {
          showNotification(message, "success");
        }
      }
      function setRating(id, rating) {
        console.log('⭐ setRating called:', { id, rating });
        
        // First try to find the item in user's lists
        let it = findItem(id);
        console.log('⭐ findItem result:', it);
        
        // If not found in lists, check if it's a cached search item
        if (!it && window.searchItemCache) {
          it = window.searchItemCache.get(Number(id));
          console.log('⭐ searchItemCache result:', it);
        }
        
        if (!it) {
          console.warn('Item not found for rating:', id);
          return;
        }
        
        it.userRating = rating;
        console.log('⭐ Updated userRating:', it.userRating);
        
        // If it's a cached search item, also store the rating in a global ratings object
        if (window.searchItemCache && window.searchItemCache.has(Number(id))) {
          if (!window.appData.ratings) {
            window.appData.ratings = {};
          }
          window.appData.ratings[id] = rating;
        }
        
        // Save data but don't refresh entire UI
        saveAppData?.();
        
        // Update only the specific card's visual state
        updateCardRating(id, rating);
        
        // Show success notification
        showNotification?.(`Rated ${it.name || it.title || 'item'} ${rating}/5 stars`, 'success');
      }
      
      function updateCardRating(id, rating) {
        // Find all cards with this ID and update their star display
        const cards = document.querySelectorAll(`[data-id="${id}"]`);
        cards.forEach(card => {
          const starButtons = card.querySelectorAll('.star-btn[data-action="rate"]');
          starButtons.forEach((star, index) => {
            const starRating = index + 1;
            if (starRating <= rating) {
              star.classList.add('active');
              star.setAttribute('aria-pressed', 'true');
              star.textContent = '★';
            } else {
              star.classList.remove('active');
              star.setAttribute('aria-pressed', 'false');
              star.textContent = '☆';
            }
          });
        });
      }
      function setLikeStatus(id, status) {
        const it = findItem(id);
        if (!it) return;
        
        console.log('👍 setLikeStatus DEBUG:', { id, status, currentLikeStatus: it.likeStatus });
        
        // Initialize likeStatus if it doesn't exist
        if (it.likeStatus === undefined) {
          it.likeStatus = null;
          console.log('👍 Initialized likeStatus to null');
        }
        
        // Toggle logic: if clicking the same status, remove it
        if (it.likeStatus === status) {
          it.likeStatus = null; // Remove the status
          console.log('👍 Toggling OFF - setting to null');
          saveAppData?.();
          updateCardLikeStatus(id, null);
          showNotification?.(`Removed ${status} from ${it.name || it.title || 'item'}`, 'success');
        } else {
          it.likeStatus = status;
          console.log('👍 Toggling ON - setting to:', status);
          saveAppData?.();
          updateCardLikeStatus(id, status);
          showNotification?.(`${status === 'like' ? 'Liked' : 'Disliked'} ${it.name || it.title || 'item'}`, 'success');
        }
        
        console.log('👍 Final likeStatus:', it.likeStatus);
      }
      
      function updateCardLikeStatus(id, status) {
        console.log('👍 updateCardLikeStatus DEBUG:', { id, status });
        
        // Find all cards with this ID and update their like/dislike display
        const cards = document.querySelectorAll(`[data-id="${id}"]`);
        console.log('👍 Found cards:', cards.length);
        
        let updatedCount = 0;
        cards.forEach((card, index) => {
          const likeBtn = card.querySelector('.like-btn[data-action="like"]');
          const dislikeBtn = card.querySelector('.dislike-btn[data-action="dislike"]');
          
          console.log(`👍 Card ${index}:`, { likeBtn: !!likeBtn, dislikeBtn: !!dislikeBtn });
          
          // Only update cards that actually have like/dislike buttons
          if (likeBtn || dislikeBtn) {
            updatedCount++;
            
            if (likeBtn) {
              if (status === 'like') {
                likeBtn.classList.add('active');
                likeBtn.setAttribute('aria-pressed', 'true');
                console.log('👍 Set like button to ACTIVE');
              } else {
                likeBtn.classList.remove('active');
                likeBtn.setAttribute('aria-pressed', 'false');
                console.log('👍 Set like button to INACTIVE');
              }
            }
            
            if (dislikeBtn) {
              if (status === 'dislike') {
                dislikeBtn.classList.add('active');
                dislikeBtn.setAttribute('aria-pressed', 'true');
                console.log('👍 Set dislike button to ACTIVE');
              } else {
                dislikeBtn.classList.remove('active');
                dislikeBtn.setAttribute('aria-pressed', 'false');
                console.log('👍 Set dislike button to INACTIVE');
              }
            }
          }
        });
        
        console.log(`👍 Updated ${updatedCount} cards with like/dislike buttons`);
      }
      
      function markAsNotInterested(id, mediaType) {
        console.log('🚫 Marking item as not interested:', id, mediaType);
        console.log('🚫 appData:', appData);
        console.log('🚫 searchItemCache size:', searchItemCache.size);
        
        // Add to not interested list in appData
        if (!appData.notInterested) {
          appData.notInterested = [];
          console.log('🚫 Initialized notInterested array');
        }
        
        // Check if already in not interested list
        const existingIndex = appData.notInterested.findIndex(item => 
          item.id === id && item.mediaType === mediaType
        );
        
        console.log('🚫 Existing index:', existingIndex);
        
        if (existingIndex === -1) {
          // Get item details from cache or create basic info
          const cachedItem = searchItemCache.get(Number(id));
          console.log('🚫 Cached item:', cachedItem);
          
          const itemInfo = {
            id: id,
            mediaType: mediaType,
            title: cachedItem?.name || cachedItem?.title || 'Unknown',
            dateAdded: new Date().toISOString()
          };
          
          console.log('🚫 Item info to add:', itemInfo);
          
          appData.notInterested.push(itemInfo);
          console.log('✅ Added to not interested list:', itemInfo);
          console.log('🚫 Updated appData.notInterested:', appData.notInterested);
          
          // Save the updated data
          if (typeof saveAppData === 'function') {
            console.log('🚫 Calling saveAppData');
            saveAppData();
          } else {
            console.log('⚠️ saveAppData function not found');
          }
          
          // Show confirmation
          if (typeof showNotification === 'function') {
            showNotification(`"${itemInfo.title}" marked as not interested`, 'info');
          } else {
            console.log('⚠️ showNotification function not found');
          }
          
          // Remove the card from the discover list
          const card = document.querySelector(`[data-id="${id}"][data-media-type="${mediaType}"]`);
          console.log('🚫 Found card:', card);
          if (card) {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
            setTimeout(() => {
              card.remove();
            }, 500);
          }
          
          // No need to refresh the entire discover list - just let the card fade out
          // The item will be filtered out on the next natural refresh
        } else {
          console.log('⚠️ Item already marked as not interested');
          if (typeof showNotification === 'function') {
            showNotification('Already marked as not interested', 'info');
          }
        }
      }
      function removeItemFromCurrentList(id) {
        const item = findItem(id);
        if (!item) return;
        
        // Show custom confirmation modal instead of browser confirm()
        showRemoveConfirmationModal(item.title || item.name, () => {
          // Proceed with removal
          ["tv", "movies"].forEach((cat) =>
            ["watching", "wishlist", "watched"].forEach((lst) => {
              appData[cat][lst] = appData[cat][lst].filter((s) => s.id !== id);
            })
          );
          saveAppData?.();
          updateUI?.();
        });
      }
      function findItem(id) {
        for (const cat of ["tv", "movies"]) {
          for (const lst of ["watching", "wishlist", "watched"]) {
            const f = appData[cat][lst].find((s) => s.id === id);
            if (f) return f;
          }
        }
        return null;
      }

      /* Binge calc / banners / meter */
      function calculateBingeTime({ scope = "all" } = {}) {
        const cards =
          scope === "watching"
            ? [
                ...document.querySelectorAll(
                  "#watchingList .show-card[data-runtime-minutes]"
                ),
              ]
            : [
                ...document.querySelectorAll(
                  ".show-card[data-runtime-minutes]"
                ),
              ];
        const total = cards.reduce(
          (m, c) => m + (parseInt(c.getAttribute("data-runtime-minutes")) || 0),
          0
        );
        const h = Math.floor(total / 60),
          m = total % 60,
          d = Math.floor(h / 24),
          rh = h % 24;
        let str = "";
        if (d) str += `${d}d `;
        if (rh) str += `${rh}h `;
        str += `${m}m`;
        return { totalMinutes: total, timeStr: str, showCount: cards.length };
      }
      function updateBingeMeter() {
        const stats = calculateBingeTime({ scope: "all" });
        const el = document.getElementById("bingeMeter");
        el.innerHTML = `<div class="stat-num">${
          stats.timeStr
        }</div><div class="stat-label">${t("binge_total")}</div>`;
      }
      function updateBingeBanner() {
        const stats = calculateBingeTime({ scope: "watching" });
        const banner = document.getElementById("bingeBanner");
        const msgs =
          appData.settings.lang === "es"
            ? [
                "de decisiones cuestionables en cola. 🎭",
                "de procrastinación medida con precisión. 🤡",
                "de vergüenza en streaming calculada. 📺",
                "de maratón sin arrepentimientos (mentira). 🍿",
              ]
            : [
                "of questionable life choices queued! 🎭",
                "of procrastination precisely measured. 🤡",
                "of streaming shame calculated. 📺",
                "of binge you definitely won't regret. 🍿",
              ];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        banner.innerHTML = `
          <span class="binge-time" id="bingeTimeText">${
            stats.timeStr
          }</span>
          <span class="binge-label">${msg}</span>
          <button class="binge-cta" id="startBingeBtn" type="button" aria-label="${t(
            "start"
          )}">${t("start")} ▶</button>`;
        document
          .getElementById("startBingeBtn")
          ?.addEventListener("click", () => {
            switchToTab("watching");
            setTimeout(
              () =>
                document
                  .getElementById("watchingList")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" }),
              120
            );
          });
      }

      /* Stats v2 */
      function rebuildStats() {
        const totals = {
          watching:
            (appData.tv.watching?.length || 0) +
            (appData.movies.watching?.length || 0),
          wishlist:
            (appData.tv.wishlist?.length || 0) +
            (appData.movies.wishlist?.length || 0),
          watched:
            (appData.tv.watched?.length || 0) +
            (appData.movies.watched?.length || 0),
        };
        const total = totals.watching + totals.wishlist + totals.watched;
        document.getElementById("statsBasicBody").innerHTML = `
          <ul>
            <li>${t("total_items")}: <strong>${total}</strong></li>
            <li>${t("watching_count")}: <strong>${
              totals.watching
            }</strong> • ${t("wishlist_count")}: <strong>${
          totals.wishlist
        }</strong> • ${t("watched_count")}: <strong>${totals.watched}</strong></li>
            <li>${t("binge_total")}: <strong>${
          calculateBingeTime().timeStr
        }</strong></li>
          </ul>`;

        const proWrap = document.getElementById("statsPro");
        proWrap.style.display = appData.settings.pro ? "block" : "none";
        if (appData.settings.pro) {
          const byGenre = {};
          getAllItems().forEach((it) =>
            (it.genres || []).forEach(
              (g) => (byGenre[g.name] = (byGenre[g.name] || 0) + 1)
            )
          );
          const topGenres = Object.entries(byGenre)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
          const r = getAllItems()
            .map((x) => Number(x.userRating) || 0)
            .filter(Boolean);
          const avgRating = r.length
            ? (r.reduce((m, v) => m + v, 0) / r.length).toFixed(2)
            : "N/A";
          document.getElementById(
            "statsProBody"
          ).innerHTML = `<div><strong>${t("top_genres")}:</strong> ${
            topGenres.map(([g, c]) => `${g} (${c})`).join(", ") || "N/A"
          }</div>
                           <div><strong>${t("average_rating")}:</strong> ${avgRating}</div>`;
        }
      }

      /* Tabs + list rendering + search */
      function switchToTab(tab) {
        // Set the current active tab
        currentActiveTab = tab;

        // Hide/clear search so tab change is obvious
        try {
          const results = document.getElementById("searchResults");
          if (results) {
            results.style.display = "none";
            results.innerHTML = "";
          }
          const qEl = document.getElementById("searchInput");
          if (qEl) qEl.value = "";
        } catch {}

        // DISABLED: Tab switching is now handled by FlickletApp.switchToTab()
        // This function now only handles tab-specific content loading
        console.log('🔄 Old switchToTab called for:', tab, '- delegating to FlickletApp');
        
        // Delegate to the new FlickletApp implementation
        if (window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
          window.FlickletApp.switchToTab(tab);
          return;
        }
        
        // Fallback: Use CSS classes instead of inline styles
        const tabIds = ['home', 'watching', 'wishlist', 'watched', 'discover', 'settings'];
        tabIds.forEach(name => {
          const section = document.getElementById(`${name}Section`);
          if (section) {
            section.classList.toggle('active', name === tab);
            section.style.display = ''; // Clear inline styles, let CSS handle it
          }
        });

        if (tab === "home") {
          // Load front spotlight when home tab is activated
          if (window.FLAGS?.frontSpotlightEnabled) {
            window.loadFrontSpotlight?.();
          }
        }
        if (tab === "discover") renderDiscover();
        if (tab === "settings") {
          // Populate the display name input with current value
          const displayNameInput = document.getElementById("displayNameInput");
          if (displayNameInput) {
            displayNameInput.value = appData?.settings?.displayName || "";
            
            // Add Enter key handling
            displayNameInput.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById("saveNameBtn")?.click();
              }
            });
          }
          
          // Load settings content (including new data tools handlers)
          console.log('🔧 Checking for loadSettingsContent function:', typeof window.loadSettingsContent);
          if (typeof window.loadSettingsContent === 'function') {
            console.log('✅ Calling loadSettingsContent');
            window.loadSettingsContent();
          } else {
            console.log('❌ loadSettingsContent function not found');
          }
          
          // Refresh curated rows setting to show correct value
          if (typeof window.refreshCuratedRowsSetting === 'function') {
            console.log('🔧 Refreshing curated rows setting');
            window.refreshCuratedRowsSetting();
          }
          
          // Render stats and Pro features
          window.renderStatsCard?.();
          window.renderProFeaturesList?.();
        }
        
        // Apply translations to the newly visible tab content
        setTimeout(() => {
          if (typeof applyTranslations === "function") {
            applyTranslations();
          }
        }, 100);
      }

      window.switchToTab = switchToTab;

      async function renderDiscover() {
        const list = document.getElementById("discoverList");
        list.innerHTML = t("building_recommendations");
        try {
          const recs = await fetchDiscover();
          if (!recs.length) {
            list.innerHTML = t("not_enough_signals");
            return;
          }
          
          // Apply tag filters to recommendations if they exist
          let filteredRecs = typeof filterByTags === "function" ? filterByTags(recs) : recs;
          
          // Filter out items marked as "not interested"
          if (appData.notInterested && appData.notInterested.length > 0) {
            const notInterestedIds = appData.notInterested.map(item => item.id);
            filteredRecs = filteredRecs.filter(item => !notInterestedIds.includes(item.id));
            console.log(`🚫 Filtered out ${recs.length - filteredRecs.length} items marked as not interested`);
          }
          
          if (!filteredRecs.length) {
            // Check if it's due to tag filtering or no available recommendations
            if (recs.length === 0) {
              list.innerHTML = t("not_enough_signals");
            } else {
              list.innerHTML = t("no_results");
            }
            return;
          }
          
          list.innerHTML = "";
          filteredRecs.forEach((it) => {
            // Cache the item before creating the card
            cacheSearchItem(it);
            const card = createShowCard(it, true); // true => search-mode actions (move buttons)
            const meta = card.querySelector(".show-meta");
            if (meta && it.because) {
              const el = document.createElement("div");
              el.style.fontSize = ".85rem";
              el.style.opacity = ".8";
              el.textContent = it.because;
              meta.appendChild(el);
            }
            list.appendChild(card);
          });
        } catch {
          list.innerHTML = t("recommendations_failed");
        }
      }

      function updateList(containerId, items) {
        const c = document.getElementById(containerId);
        if (!c) return;
        if (!items || !items.length) {
          c.innerHTML = `<div class="empty-state">${t("no_items")}</div>`;
          return;
        }
        
        // Determine which tab this list belongs to based on containerId
        let listTab = "home";
        if (containerId === "watchingList") listTab = "watching";
        else if (containerId === "wishlistList") listTab = "wishlist";
        else if (containerId === "watchedList") listTab = "watched";
        
        // Show skeletons while loading
        window.Skeletons?.list(containerId, Math.min(items.length || 6, 8));
        
        // Small delay to show skeletons, then render actual content
        setTimeout(() => {
          c.innerHTML = "";
          items.forEach((it) => c.appendChild(createShowCard(it, false, listTab)));
        }, 500);
      }

      function updateUI() {

        const totals = {
          watching:
            (appData.tv.watching?.length || 0) +
            (appData.movies.watching?.length || 0),
          wishlist:
            (appData.tv.wishlist?.length || 0) +
            (appData.movies.wishlist?.length || 0),
          watched:
            (appData.tv.watched?.length || 0) +
            (appData.movies.watched?.length || 0),
        };
        const totalAll = totals.watching + totals.wishlist + totals.watched;

        const setText = (id, v) => {
          const el = document.getElementById(id);
          if (el) el.textContent = String(v);
        };
        setText("watchingBadge", totals.watching);
        setText("watchingCount", totals.watching);
        setText("wishlistBadge", totals.wishlist);
        setText("wishlistCount", totals.wishlist);
        setText("watchedBadge", totals.watched);
        setText("watchedCount", totals.watched);
        setText("totalCount", totalAll);

        if (typeof updateTagFiltersUI === "function") updateTagFiltersUI();

        const maybeFilter = (arr) =>
          typeof filterByTags === "function" ? filterByTags(arr) : arr;
        const watching = maybeFilter([
          ...(appData.tv.watching || []),
          ...(appData.movies.watching || []),
        ]);
        const wishlist = maybeFilter([
          ...(appData.tv.wishlist || []),
          ...(appData.movies.wishlist || []),
        ]);
        const watched = maybeFilter([
          ...(appData.tv.watched || []),
          ...(appData.movies.watched || []),
        ]);

        updateList("watchingList", watching);
        updateList("wishlistList", wishlist);
        updateList("watchedList", watched);

        // updateBingeMeter?.(); // Disabled - removed from home page
        // updateBingeBanner?.(); // Disabled - removed from front page
        
        // Ensure home page blocks are inserted (quotes, horoscope, feedback)
        const blocksResult = ensureBlocks?.();
        
        applyTranslations?.();
        
        rebuildStats?.();
      }
      // Cache search results so we don't inline JSON into onclick
      const searchItemCache = new Map();
      // Make it globally accessible for language switching
      window.searchItemCache = searchItemCache;

      function cacheSearchItem(it) {
        if (it && it.id != null) searchItemCache.set(Number(it.id), it);
      }

      function addToListFromCache(id, list) {
        const it = searchItemCache.get(Number(id));
        if (!it) {
          showNotification(t("could_not_read_item"), "warning");
          return;
        }
        addToList(it, list);
      }
      window.addToListFromCache = addToListFromCache; // used by inline handlers

      /* ---------- SEARCH HELPERS ---------- */
      
      /**
       * Process: Advanced Search Query Parsing
       * Purpose: Parses advanced search syntax like "genre:horror", "year:2023", "status:watching"
       * Data Source: User search input string
       * Update Path: Modify search parameters and filters based on parsed query
       * Dependencies: Genre mapping, user data, search filters
       */
      function parseAdvancedSearch(query) {
        console.log('🔍 Parsing advanced search query:', query);
        
        const result = {
          baseQuery: query,
          filters: {},
          searchType: 'multi' // default to multi search
        };
        
        // Genre mapping (from TMDB API)
        const genreMap = {
          'action': 28, 'adventure': 12, 'animation': 16, 'comedy': 35, 'crime': 80,
          'documentary': 99, 'drama': 18, 'family': 10751, 'fantasy': 14, 'history': 36,
          'horror': 27, 'music': 10402, 'mystery': 9648, 'romance': 10749, 'sci-fi': 878,
          'science_fiction': 878, 'tv_movie': 10770, 'thriller': 53, 'war': 10752, 'western': 37
        };
        
        // Parse different search operators
        const patterns = [
          // Genre filter: genre:horror, genre:sci-fi
          { regex: /genre:(\w+(?:[-_]\w+)*)/gi, handler: (match, genre) => {
            const genreKey = genre.toLowerCase().replace(/-/g, '_');
            const genreId = genreMap[genreKey];
            if (genreId) {
              result.filters.genre = genreId;
              console.log(`🎬 Genre filter: ${genre} -> ${genreId}`);
            } else {
              console.warn(`⚠️ Unknown genre: ${genre}`);
            }
          }},
          
          // Year filter: year:2023, year:2020-2023
          { regex: /year:(\d{4}(?:-\d{4})?)/gi, handler: (match, year) => {
            if (year.includes('-')) {
              const [start, end] = year.split('-').map(Number);
              result.filters.yearRange = { start, end };
              console.log(`📅 Year range: ${start}-${end}`);
            } else {
              result.filters.year = parseInt(year);
              console.log(`📅 Year: ${year}`);
            }
          }},
          
          // Media type: is:movie, is:show, is:tv
          { regex: /is:(movie|show|tv)/gi, handler: (match, type) => {
            result.searchType = type === 'show' || type === 'tv' ? 'tv' : 'movie';
            console.log(`🎭 Media type: ${type}`);
          }},
          
          // Status filter: status:watching, status:watched, status:wishlist
          { regex: /status:(watching|watched|wishlist)/gi, handler: (match, status) => {
            result.filters.status = status;
            console.log(`📋 Status: ${status}`);
          }},
          
          // Rating filter: rating:≥4, rating:>3, rating:5
          { regex: /rating:([≥>]?)(\d)/gi, handler: (match, operator, rating) => {
            result.filters.rating = {
              value: parseInt(rating),
              operator: operator || '='
            };
            console.log(`⭐ Rating: ${operator}${rating}`);
          }},
          
          // Exact phrase: "exact phrase"
          { regex: /"([^"]+)"/g, handler: (match, phrase) => {
            result.filters.exactPhrase = phrase;
            console.log(`💬 Exact phrase: "${phrase}"`);
          }},
          
          // Exclude spoilers: !spoiler
          { regex: /!spoiler/gi, handler: () => {
            result.filters.excludeSpoilers = true;
            console.log(`🚫 Exclude spoilers`);
          }},
          
          // Trending: #trending
          { regex: /#trending/gi, handler: () => {
            result.filters.trending = true;
            console.log(`🔥 Trending content`);
          }}
        ];
        
        // Apply all patterns
        patterns.forEach(({ regex, handler }) => {
          let match;
          while ((match = regex.exec(query)) !== null) {
            handler(match, ...match.slice(1));
          }
        });
        
        // Remove all operators from base query
        result.baseQuery = query
          .replace(/genre:\w+(?:[-_]\w+)*/gi, '')
          .replace(/year:\d{4}(?:-\d{4})?/gi, '')
          .replace(/is:(movie|show|tv)/gi, '')
          .replace(/status:(watching|watched|wishlist)/gi, '')
          .replace(/rating:[≥>]?\d/gi, '')
          .replace(/"([^"]+)"/g, '')
          .replace(/!spoiler/gi, '')
          .replace(/#trending/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        console.log('🔍 Parsed search result:', result);
        return result;
      }
      
      /**
       * Process: Search Execution and Results Display
       * Purpose: Executes user search query, calls TMDB API, and displays results while hiding main page content
       * Data Source: User input from searchInput element, TMDB API response, cached search items
       * Update Path: Modify API parameters in tmdbGet call, update home section IDs in homeSections array
       * Dependencies: tmdbGet function, createShowCard function, home page elements, search results container
       */
      async function performSearch() {
        console.log('🔍 performSearch called');
        try {
          const qEl = document.getElementById("searchInput");
          const gEl = document.getElementById("genreFilter");
          const out = document.getElementById("searchResults");
          
          console.log('🔍 Search elements found:', { qEl: !!qEl, gEl: !!gEl, out: !!out });
          
          if (!qEl || !out) {
            console.error('❌ Missing search elements:', { qEl: !!qEl, out: !!out });
            return;
          }

          const q = (qEl.value || "").trim();
          const genre = gEl ? gEl.value || "" : "";
          
          console.log('🔍 Search query:', { q, genre });
          
          if (!q) {
            console.log('🔍 Empty query, clearing search');
            clearSearch();
            return;
          }

          // Parse advanced search syntax
          const parsedQuery = parseAdvancedSearch(q);
          console.log('🔍 Parsed query:', parsedQuery);

          // Hide all main page elements when searching
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
            const element = document.getElementById(sectionId);
            if (element) {
              element.style.display = 'none';
              console.log(`🙈 Hiding ${sectionId} during search`);
            }
          });

          // Hide tab content sections during search (keep tab bar visible)
          const tabSections = ['homeSection', 'watchingSection', 'wishlistSection', 'watchedSection', 'discoverSection'];
          tabSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
              section.style.display = 'none';
              console.log(`🙈 Hiding tab section ${sectionId} during search`);
            }
          });

          // Set search state flag
          if (window.FlickletApp) {
            window.FlickletApp.isSearching = true;
          }

          // Show all tabs when searching (hide current tab behavior disabled during search)
          const tabIds = ['home','watching','wishlist','watched','discover','settings'];
          tabIds.forEach(name => {
            const btn = document.getElementById(`${name}Tab`);
            if (btn) {
              btn.classList.remove('hidden');
              btn.classList.remove('active');
              console.log(`🔍 Search mode: ${name}Tab visible`);
            }
          });

          out.style.display = "";
          // Show skeletons while searching
          window.Skeletons?.list("searchResults", 6);

          console.log('🔍 Checking tmdbGet function:', typeof tmdbGet);
          if (typeof tmdbGet !== "function") {
            console.error('❌ tmdbGet function not available');
            out.innerHTML = "Search service not ready.";
            return;
          }

          // Determine search endpoint and query
          const searchEndpoint = parsedQuery.searchType === 'multi' ? 'search/multi' : 
                                parsedQuery.searchType === 'movie' ? 'search/movie' : 'search/tv';
          
          // If baseQuery is empty after parsing, use a generic search term for genre-only searches
          let searchQuery = parsedQuery.baseQuery;
          console.log('🔍 Search query logic:', { 
            baseQuery: parsedQuery.baseQuery, 
            originalQ: q, 
            searchQuery, 
            hasGenreFilter: !!parsedQuery.filters.genre,
            genreId: parsedQuery.filters.genre
          });
          
          if (!searchQuery && parsedQuery.filters.genre) {
            // For genre-only searches, use a broad search term
            // Find the genre name from the ID
            const genreMap = {
              28: 'action', 12: 'adventure', 16: 'animation', 35: 'comedy', 80: 'crime',
              99: 'documentary', 18: 'drama', 10751: 'family', 14: 'fantasy', 36: 'history',
              27: 'horror', 10402: 'music', 9648: 'mystery', 10749: 'romance', 878: 'sci-fi',
              10770: 'tv_movie', 53: 'thriller', 10752: 'war', 37: 'western'
            };
            const genreName = genreMap[parsedQuery.filters.genre] || 'movie';
            searchQuery = genreName;
            console.log('🔍 Using genre name as search term:', genreName);
          } else if (!searchQuery) {
            // Fallback to original query if no other search term
            searchQuery = q;
            console.log('🔍 Using original query as fallback:', q);
          }
          
          console.log('🔍 Calling tmdbGet with:', { 
            endpoint: searchEndpoint, 
            query: searchQuery,
            filters: parsedQuery.filters 
          });
          
          // Debug language before API call
          const currentLang = (window.appData?.settings?.lang) || 
                             (window.FlickletApp?.appData?.settings?.lang) || 
                             (appData?.settings?.lang) || 
                             'en';
          console.log('🌐 Language check before API call:', {
            windowAppData: window.appData?.settings?.lang,
            flickletAppData: window.FlickletApp?.appData?.settings?.lang,
            localAppData: appData?.settings?.lang,
            finalLang: currentLang
          });
          
          const data = await tmdbGet(
            searchEndpoint,
            `&query=${encodeURIComponent(searchQuery)}`
          );
          console.log('🔍 TMDB response:', data);
          const results = (data?.results || []).filter(
            (r) => {
              // Filter out people (only show movies and TV shows)
              if (r.media_type === 'person') {
                return false;
              }
              
              // Apply genre filter (from dropdown or advanced search)
              const genreFilter = parsedQuery.filters.genre || genre;
              if (genreFilter && !(r.genre_ids || []).includes(Number(genreFilter))) {
                return false;
              }
              
              // Apply year filter
              if (parsedQuery.filters.year) {
                const releaseYear = new Date(r.release_date || r.first_air_date || '').getFullYear();
                if (releaseYear !== parsedQuery.filters.year) {
                  return false;
                }
              }
              
              // Apply year range filter
              if (parsedQuery.filters.yearRange) {
                const releaseYear = new Date(r.release_date || r.first_air_date || '').getFullYear();
                const { start, end } = parsedQuery.filters.yearRange;
                if (releaseYear < start || releaseYear > end) {
                  return false;
                }
              }
              
              // Apply media type filter
              if (parsedQuery.searchType !== 'multi') {
                const expectedType = parsedQuery.searchType === 'movie' ? 'movie' : 'tv';
                if (r.media_type !== expectedType) {
                  return false;
                }
              }
              
              // Apply status filter (requires user data)
              if (parsedQuery.filters.status) {
                const itemId = r.id;
                const userData = window.appData?.userData || {};
                const listKey = parsedQuery.filters.status === 'watching' ? 'watching' :
                              parsedQuery.filters.status === 'watched' ? 'watched' : 'wishlist';
                const userList = userData[listKey] || [];
                if (!userList.some(item => item.id === itemId)) {
                  return false;
                }
              }
              
              // Apply rating filter (requires user data)
              if (parsedQuery.filters.rating) {
                const itemId = r.id;
                const userData = window.appData?.userData || {};
                const userRating = userData.ratings?.[itemId];
                if (!userRating) return false;
                
                const { value, operator } = parsedQuery.filters.rating;
                if (operator === '≥' && userRating < value) return false;
                if (operator === '>' && userRating <= value) return false;
                if (operator === '=' && userRating !== value) return false;
              }
              
              return true;
            }
          );

          if (!results.length) {
            out.innerHTML = t("no_results");
            return;
          }

          // --- Cache every result before rendering ---
          out.innerHTML = "";
          results.forEach((it) => {
            // STEP 3.2d — Ensure media_type is set for proper provider/extras handling
            if (!it.media_type) {
              it.media_type = it.first_air_date ? 'tv' : (it.release_date ? 'movie' : 'person');
            }
            cacheSearchItem(it);
            out.appendChild(createShowCard(it, true)); // true => search-mode actions
          });

          // Add "end of list" message after search results
          const endMessage = document.createElement('div');
          endMessage.className = 'search-end-message';
          endMessage.style.cssText = `
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            color: #666;
            font-style: italic;
            border-top: 1px solid #eee;
          `;
          endMessage.textContent = t("end_of_search_results") || "End of search results";
          out.appendChild(endMessage);
        } catch (err) {
          console.error("performSearch error", err);
          const out = document.getElementById("searchResults");
          if (out) out.innerHTML = t("search_failed");
        }
      }

      /**
       * Process: Search Clearing and UI Restoration
       * Purpose: Clears search input, hides results, and restores main page elements when on home tab
       * Data Source: DOM elements (searchInput, searchResults), FlickletApp.currentTab for context
       * Update Path: Modify home section IDs in homeSections array if page structure changes
       * Dependencies: FlickletApp.currentTab, home page section elements, search input and results elements
       */
      function clearSearch() {
        const qEl = document.getElementById("searchInput");
        const out = document.getElementById("searchResults");
        if (qEl) qEl.value = "";
        if (out) {
          out.innerHTML = "";
          out.style.display = "none";
        }
        
        // Show tab content sections when search is cleared
        const tabSections = ['homeSection', 'watchingSection', 'wishlistSection', 'watchedSection', 'discoverSection'];
        tabSections.forEach(sectionId => {
          const section = document.getElementById(sectionId);
          if (section) {
            section.style.display = '';
            console.log(`📖 Showing tab section ${sectionId} after clearing search`);
          }
        });

        // Clear search state flag
        if (window.FlickletApp) {
          window.FlickletApp.isSearching = false;
        }

        // Restore normal tab hiding behavior (hide current tab, show others)
        if (window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
          // Re-trigger tab switch to restore normal tab hiding behavior
          const currentTab = window.FlickletApp.currentTab;
          console.log('🔄 Restoring tab hiding behavior for current tab:', currentTab);
          window.FlickletApp.switchToTab(currentTab);
        }

        // Show all main page elements when search is cleared (only if on home tab)
        if (window.FlickletApp && window.FlickletApp.currentTab === 'home') {
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
            const element = document.getElementById(sectionId);
            if (element) {
              // Restore original display style (flex for containers, block for others)
              if (sectionId === 'quote-flickword-container') {
                element.style.display = 'flex';
              } else {
                element.style.display = '';
              }
              console.log(`📖 Showing ${sectionId} after clearing search`);
            }
          });
        }
      }

      // Expose search functions to global scope
      window.performSearch = performSearch;
      window.clearSearch = clearSearch;
      window.tmdbGet = tmdbGet;
      window.createShowCard = createShowCard;

      function refreshSearchResults() {
        console.log('🔄 refreshSearchResults called');
        const out = document.getElementById("searchResults");
        if (out && out.style.display !== "none") {
          console.log('📱 Search results container is visible');
          // Check if we have cached results
          const results = Array.from(out.children);
          console.log('🔍 Found', results.length, 'search result elements');
          if (results.length > 0) {
            // If cache is empty (was cleared for language change), show message
            if (searchItemCache.size === 0) {
              console.log('🗑️ Cache is empty, showing language change message');
              out.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;">
                <p>${t("search_results_cleared") || "Search results cleared due to language change."}</p>
                <p>${t("please_search_again") || "Please search again to see results in the new language."}</p>
              </div>`;
              return;
            }
            
            console.log('🔄 Re-rendering', results.length, 'search results');
            // Re-render search results with current language
            out.innerHTML = "";
            results.forEach((it) => {
              const itemId = it.querySelector('[data-action]')?.getAttribute('data-id');
              if (itemId) {
                const cachedItem = searchItemCache.get(Number(itemId));
                if (cachedItem) {
                  out.appendChild(createShowCard(cachedItem, true));
                }
              }
            });
          } else {
            console.log('📱 No search result elements found');
          }
        } else {
          console.log('📱 Search results container is not visible');
        }
        
        // Also refresh discover section if it's visible
        const discoverSection = document.getElementById("discoverSection");
        if (discoverSection && discoverSection.style.display !== "none") {
          if (typeof renderDiscover === "function") {
            renderDiscover();
          }
        }
      }

      // Tag filters / state used by updateTagFiltersUI
      let currentActiveTab = "home";
      let searchCache = [];
      let currentPage = 1;
      let showTVOnly = false,
        showMoviesOnly = false;
      let activeTagFilters = new Set();

      /* ============== Personality Patch Script ============== */
      (function() {
        // ---------- Big pools (edit as you like) ----------
        const FORTUNES = [
          "You are a Chaotic Good. You like drama but call it 'cinema.'",
          "Binge Minimalist: 90% planning, 10% watching.",
          "Comfort, chaos, and clever twists. In that order.",
          "On your 14th rewatch arc. Brave.",
          "63% fueled by snacks and unresolved plotlines.",
          "Human embodiment of 'skip intro'.",
          "Your spirit animal is a loading spinner.",
          "You collect pilots like Pokémon.",
          "You claim you hate cliffhangers. You don't.",
          "You alphabetize your watchlist and then ignore it.",
          "You believe 'one more episode' is a contract with destiny.",
          "You rate with your heart, not the stars.",
          "You're here to procrastinate responsibly.",
          "You love a slow burn and fast Wi‑Fi.",
          "You're allergic to laugh tracks.",
          "You pause for snacks like it's a ritual.",
          "You are a spoiler ninja and an ending apologist.",
          "You think 'limited series' means limits don't apply to you.",
          "You fast‑forward opening credits but respect end credits.",
          "You crave vibes > plot. Bold choice.",
          "You treat 'recommended for you' as a dare.",
          "You chase vibes like a sommelier of scenes.",
          "You watch with subtitles; you are cultured (and quiet).",
          "You fear the finale but press play anyway.",
          "You bookmark chaos and call it variety.",
          "You own three blankets. All 'the good one'.",
          "You pretend the algorithm is your friend.",
          "You rewatch comfort episodes like vitamins.",
          "You hoard tabs and storylines with equal skill.",
          "You skip recaps, then Google plot summaries. Iconic.",
        ];

        const QUOTES = [
          `"I am serious... and don't call me Shirley." — *Airplane!*`,
          `"Streaming is a lifestyle, not a choice." — Ancient Proverb`,
          `"Binge now. Cry later." — You, last night at 2AM`,
          `"One does not simply watch one episode." — Boromir, probably`,
          `"You had me at 'skip recap.'"`,
          `"Art is long, episodes are longer." — Someone with no plans`,
          `"We were on a break! From reality."`,
          `"I came, I saw, I queued it."`,
          `"To stream, perchance to nap." — Hamlet (director's cut)`,
          `"In this house we respect the 'Are you still watching?' prompt."`,
          `"The algorithm thinks I'm complicated. It's right."`,
          `"If found, return to the couch."`,
          `"My love language is 'skip ad.'"`,
          `"I contain multitudes and several watchlists."`,
          `"Sundays are for pilots and denial."`,
          `"Ctrl+Z for life, play for comfort."`,
          `"I fear no man, but I fear finales."`,
          `"This app gets me. Terrifying."`,
          `"Plot holes are just cardio for the brain."`,
          `"We accept the dopamine we think we deserve."`,
          `"I have never finished anything. Except seasons."`,
          `"Today's vibe: closed captions and open snacks."`,
          `"Foreshadowing? I hardly know her."`,
          `"Character development is my cardio."`,
          `"If the title card hits, I'm staying."`,
          `"Minimalism, but for episodes."`,
          `"'Are you still watching?' yes, Netflix, I'm thriving."`,
          `"I ship productivity with naps."`,
          `"Comfort show supremacy."`,
          `"This queue is a personality test I'm failing."`,
        ];

        // ---------- Utilities ----------
        const STORAGE_KEYS = {
          QUOTE_DECK: "__flicklet_quote_deck_v1__",
        };

        function dayOfYear(d = new Date()) {
          const start = new Date(d.getFullYear(), 0, 0);
          const diff = d - start;
          return Math.floor(diff / 86400000); // ms->days
        }

        // Cheap stable hash for a string
        function hashString(str) {
          let h = 2166136261 >>> 0;
          for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
          }
          return h >>> 0;
        }

        // Fisher‑Yates shuffle
        function shuffle(arr) {
          const a = arr.slice();
          for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
          }
          return a;
        }

        // ---------- Horoscope (daily, deterministic) ----------
        function pickDailyHoroscope() {
          // Try to personalize with displayName if it exists in your appData
          let name = "";
          try {
            name = (window.appData?.settings?.displayName || "").trim();
          } catch {}
          const seed = (dayOfYear() + hashString(name)).toString();
          const idx = hashString(seed) % FORTUNES.length;
          const fortune = FORTUNES[idx];
          
          // Try to translate the fortune if we have a translation key
          const fortuneKey = fortune.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '_');
          const translation = t(fortuneKey);
          
  
          return translation || fortune;
        }
        
        // Make functions globally accessible
        window.pickDailyHoroscope = pickDailyHoroscope;
        window.drawQuote = drawQuote;

        // ---------- Quotes (deck‑based, no repeats until exhausted) ----------
        function getQuoteDeck() {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.QUOTE_DECK);
            if (raw) {
              const deck = JSON.parse(raw);
              if (Array.isArray(deck) && deck.every(Number.isInteger))
                return deck;
            }
          } catch {}
          // Build a fresh shuffled deck of indices
          const fresh = shuffle([...QUOTES.keys()]);
          localStorage.setItem(
            STORAGE_KEYS.QUOTE_DECK,
            JSON.stringify(fresh)
          );
          return fresh;
        }

        function drawQuote() {
          const deck = getQuoteDeck();
          const next = deck.shift();
          const quoteIndex = next || 0;
          // Get translated quote based on current language
          const quoteKey = `quote_${quoteIndex + 1}`;
          const quote = t(quoteKey) || QUOTES[quoteIndex] || QUOTES[0];
          // Save remaining deck; if empty, rebuild next time
          try {
            if (deck.length) {
              localStorage.setItem(
                STORAGE_KEYS.QUOTE_DECK,
                JSON.stringify(deck)
              );
            } else {
              localStorage.removeItem(STORAGE_KEYS.QUOTE_DECK);
            }
          } catch {}
          return quote;
        }

        // ---------- DOM injection (idempotent) ----------
        window.ensureBlocks = function() {
          const home = document.getElementById("homeSection");
          if (!home) {
    
            return false;
          }


          
          // If home section is empty, create a container div first
          if (!home.firstElementChild) {
            const container = document.createElement("div");
            container.id = "homeContentContainer";
            home.appendChild(container);
    
          }
          
          const anchor = home.firstElementChild;



          // Insert front spotlight (replaces horoscope)
          if (!document.getElementById("frontSpotlight")) {
            const card = document.createElement("div");
            card.className = "front-spotlight card";
            card.id = "frontSpotlight";
            card.style.display = "none";
            card.innerHTML = `
              <div class="card-header">
                <h3>Tonight On</h3>
                <span class="tag">Next 7 days</span>
              </div>
              <div id="frontSpotlightList" class="front-spotlight-list">
                <div class="no-episodes">No upcoming episodes this week.</div>
              </div>
            `;
            const insertAfter = document.getElementById("quoteBlock") || anchor;
            insertAfter.insertAdjacentElement("afterend", card);
          }

          // Insert feedback section last (at the bottom)
          if (!document.getElementById("feedbackSection")) {
            const feedbackCard = document.createElement("div");
            feedbackCard.className = "feedback-card";
            feedbackCard.id = "feedbackSection";
            feedbackCard.innerHTML = `
                                                      <h3 data-i18n="feedback">Share Your Thoughts</h3>
                                                          <p data-i18n="feedback_working">Share your thoughts! Give us app feedback, tell us what's working (or not), share a quote for our rotation, make a confession, or just vent. We're listening!</p>
                              <p class="feedback-subtitle" data-i18n="feedback_subtitle">💬 App feedback • 💭 Random thoughts • 💬 Quote submissions • 🤫 Anonymous confessions • 😤 Venting welcome</p>
                              <form name="feedback" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="feedback-form" action="/thank-you">
                <input type="hidden" name="form-name" value="feedback" />
                <input type="hidden" name="theme" id="feedbackThemeInput" />
                <div style="display: none;">
                  <label>Don't fill this out if you're human: <input name="bot-field" /></label>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap">
                  <textarea
                    name="message"
                    class="search-input"
                    placeholder=""
                    data-i18n-placeholder="feedback_placeholder"
                    rows="3"
                    required
                    style="resize: vertical; min-height: 60px;"
                  ></textarea>
                  <button type="submit" class="btn" data-i18n="send">Share It!</button>
                </div>
              </form>
            `;
            const insertAfter = document.getElementById("frontSpotlight") || document.getElementById("personalityForecast") || document.getElementById("quoteBlock") || anchor;
            insertAfter.insertAdjacentElement("afterend", feedbackCard);
          }

          const qEl = document.getElementById("randomQuote");
          if (qEl) qEl.textContent = drawQuote();
          
          // Load front spotlight if enabled
          if (window.FLAGS?.frontSpotlightEnabled) {
            window.loadFrontSpotlight?.();
          }

          return true;
        }

        const start = () => {
          console.log("🚀 start() function called");
          const result = ensureBlocks();
          if (!result) {
            requestAnimationFrame(ensureBlocks);
          }
        };

        // start() function will be called by FlickletApp.init() or the fallback initialization
      })();

// === MP-Providers v1 (guarded) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.providersEnabled === false) {
    console.log('📺 Providers feature disabled via flag');
    return;
  }
  if (window.__providersV1Bound) return;
  window.__providersV1Bound = true;

  // Config / helpers
  const REGION = (window.i18n?.region || window.i18n?.defaultRegion || 'US');
  const IMG_BASE = (window.TMDB_IMG_BASE || 'https://image.tmdb.org/t/p/w92');
  const TMDB_BASE = (window.TMDB_API_BASE || 'https://api.themoviedb.org/3');
  const API_KEY = (window.TMDB_API_KEY || window.TMDB?.key || 'b7247bb415b50f25b5e35e2566430b96');
  const PRO = !!FLAGS.proEnabled;

  const CACHE_NS = 'flicklet:prov:v1'; // flicklet:prov:v1:{type}:{id}:{region}
  const cacheKey = (type, id, region) => `${CACHE_NS}:${type}:${id}:${region}`;

  function getCache(k) {
    try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; }
  }
  function setCache(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  }

  async function fetchProviders(type, id, region) {
    // STEP 3.2d — Providers exist ONLY for movie/tv, never for person
    const mt = (type || '').toLowerCase();
    if (mt !== 'movie' && mt !== 'tv') {
      return { results: {} }; // safe empty
    }
    
    const key = cacheKey(type, id, region);
    const cached = getCache(key);
    if (cached) return cached;

    if (!API_KEY) {
      console.debug('Providers: missing TMDB API key');
      return null;
    }

    const url = `${TMDB_BASE}/${type}/${id}/watch/providers?api_key=${API_KEY}`;
    try {
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const byRegion = json?.results?.[region] || null;
      setCache(key, byRegion || { __empty: true });
      return byRegion;
    } catch (e) {
      console.debug('Providers fetch failed', { type, id, region, e });
      return null;
    }
  }

  function providerNodes(entry, locked) {
    // Entry may contain flatrate (stream), rent, buy, free, ads
    const groups = ['flatrate','free','ads','rent','buy'];
    const nodes = [];
    for (const g of groups) {
      const arr = entry?.[g];
      if (!Array.isArray(arr) || !arr.length) continue;
      for (const p of arr.slice(0, 6)) { // cap badges
        const label = p.provider_name || '—';
        const icon = p.logo_path ? `${IMG_BASE}${p.logo_path}` : null;
        const a = document.createElement(locked ? 'span' : 'a');
        a.className = 'provider-badge';
        if (!locked) {
          // Deep links are inconsistently provided; TMDB offers a "link" in entry
          const href = entry?.link || '#';
          a.href = href;
          a.target = '_blank';
          a.rel = 'noopener';
          a.title = `Open on ${label}`;
          a.setAttribute('aria-label', `Open on ${label}`);
        } else {
          a.setAttribute('aria-hidden','true');
        }
        if (icon) {
          const img = document.createElement('img');
          img.src = icon;
          img.alt = '';
          img.setAttribute('aria-hidden','true');
          a.appendChild(img);
        } else {
          a.textContent = label;
        }
        nodes.push(a);
      }
      break; // show only first non-empty group as primary signal
    }
    return nodes;
  }

  function renderProvidersInto(slot, entry, locked) {
    if (!slot) return;
    slot.textContent = '';
    const row = document.createElement('div');
    row.className = 'providers-row';
    if (locked) row.dataset.locked = '1';

    const label = document.createElement('span');
    label.className = 'providers-label';
    label.textContent = locked ? (t('available_on') || 'Available on') : (t('watch_on') || 'Watch on');
    row.appendChild(label);

    const badges = providerNodes(entry, locked);
    badges.forEach(b => row.appendChild(b));

    const more = (entry?.flatrate?.length || 0) + (entry?.free?.length || 0) +
                 (entry?.ads?.length || 0) + (entry?.rent?.length || 0) +
                 (entry?.buy?.length || 0);
    if (more > badges.length) {
      const mc = document.createElement('span');
      mc.className = 'more-count';
      mc.textContent = `+${more - badges.length}`;
      row.appendChild(mc);
    }

    // Free teaser nudge
    if (locked) {
      const tip = document.createElement('span');
      tip.className = 'more-count';
      tip.textContent = t('upgrade_to_reveal') || ' — upgrade to reveal';
      row.appendChild(tip);
    }

    slot.appendChild(row);
  }

  // Public hook: lazy-load providers for a given card
  async function attachProviders(cardEl, item) {
    if (!cardEl || !item) return;
    const slot = cardEl.querySelector('.providers-slot');
    if (!slot) {
      console.debug('📺 Providers: no slot found for', item.name || item.title);
      return;
    }

    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const mt = (type || '').toLowerCase();
    if (mt !== 'movie' && mt !== 'tv') {
      console.debug('📺 Providers: skipping for person', { type, id: item.id, name: item.name || item.title });
      return;
    }
    
    console.debug('📺 Providers: fetching for', { type, id: item.id, name: item.name || item.title });
    const entry = await fetchProviders(type, item.id, REGION);
    if (!entry || entry.__empty) {
      console.debug('📺 Providers: no data for', item.name || item.title);
      return;
    }
    
    // Check Pro status at render time, not initialization time
    const isPro = !!window.FLAGS?.proEnabled;
    console.debug('📺 Providers: rendering for', item.name || item.title, entry, { pro: isPro });
    renderProvidersInto(slot, entry, !isPro);
  }

  // Export to global (used by createShowCard below)
  window.__FlickletAttachProviders = attachProviders;

  // Function to refresh all provider displays (useful when Pro status changes)
  window.__FlickletRefreshProviders = function() {
    const cards = document.querySelectorAll('.show-card');
    cards.forEach(card => {
      const slot = card.querySelector('.providers-slot');
      if (slot && slot.innerHTML.trim()) {
        // Re-render existing providers with current Pro status
        const isPro = !!window.FLAGS?.proEnabled;
        const row = slot.querySelector('.providers-row');
        if (row) {
          row.dataset.locked = isPro ? '0' : '1';
          const badges = row.querySelectorAll('.provider-badge');
          badges.forEach(badge => {
            if (isPro) {
              badge.style.pointerEvents = 'auto';
              badge.style.opacity = '1';
              badge.style.filter = 'none';
              badge.style.background = '';
              badge.style.color = '';
              badge.style.borderColor = '';
            } else {
              badge.style.pointerEvents = 'none';
              badge.style.opacity = '0.25';
              badge.style.filter = 'blur(1px)';
              badge.style.background = 'var(--bg, #1a1a1a)';
              badge.style.color = 'var(--muted, #9aa6b2)';
              badge.style.borderColor = 'var(--border, #404040)';
            }
          });
          // Also blur provider images
          const images = row.querySelectorAll('.provider-badge img');
          images.forEach(img => {
            if (isPro) {
              img.style.filter = 'none';
              img.style.opacity = '1';
            } else {
              img.style.filter = 'blur(2px)';
              img.style.opacity = '0.3';
            }
          });
        }
      }
    });
  };

  console.log('📺 Providers v1 ready', { region: REGION, pro: PRO, apiKey: API_KEY ? 'found' : 'missing' });
})();

// === MP-Extras v1 (guarded, PRO reveal) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.extrasEnabled === false) {
    console.log('🎬 Extras feature disabled via flag');
    return;
  }
  if (window.__extrasV1Bound) return;
  window.__extrasV1Bound = true;

  const PRO = !!FLAGS.proEnabled;
  const TMDB_BASE = (window.TMDB_API_BASE || 'https://api.themoviedb.org/3');
  const API_KEY = (window.TMDB_API_KEY || window.TMDB?.key || 'b7247bb415b50f25b5e35e2566430b96');
  const LANG = (window.i18n?.lang || 'en-US');

  const CACHE_NS = 'flicklet:extras:v1';
  const cacheKey = (type, id, lang) => `${CACHE_NS}:${type}:${id}:${lang}`;

  function getCache(k){ try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }
  function setCache(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

  const GOOD_TYPES = new Set([
    'Bloopers','Gag Reel','Deleted Scene','Behind the Scenes','Featurette','Clip'
  ]);
  const GOOD_SITES = new Set(['YouTube','Vimeo']);
  const labelFor = v => (v.type === 'Behind the Scenes' ? 'BTS' :
                         v.type === 'Deleted Scene' ? 'Deleted' :
                         v.type === 'Gag Reel' ? 'Gag Reel' :
                         v.type === 'Bloopers' ? 'Bloopers' :
                         v.type === 'Featurette' ? 'Featurette' :
                         v.type === 'Clip' ? 'Clip' : v.type);

  function buildHref(v) {
    if (v.site === 'YouTube' && v.key) return `https://www.youtube.com/watch?v=${encodeURIComponent(v.key)}`;
    if (v.site === 'Vimeo' && v.key)   return `https://vimeo.com/${encodeURIComponent(v.key)}`;
    return '#';
  }

  async function fetchExtras(type, id, lang) {
    // STEP 3.2d — Videos exist ONLY for movie/tv, never for person
    const mt = (type || '').toLowerCase();
    if (mt !== 'movie' && mt !== 'tv') {
      return { results: [] }; // safe empty
    }
    
    const ck = cacheKey(type, id, lang);
    const cached = getCache(ck);
    if (cached) return cached;
    if (!API_KEY) { console.debug('Extras: missing TMDB API key'); return null; }
    const url = `${TMDB_BASE}/${type}/${id}/videos?api_key=${API_KEY}&language=${encodeURIComponent(lang)}`;
    try {
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const videos = (json?.results || []).filter(v =>
        GOOD_TYPES.has(v.type) && GOOD_SITES.has(v.site)
      );
      // If none in requested lang, try no-lang fallback (omit language param)
      if (!videos.length) {
        const url2 = `${TMDB_BASE}/${type}/${id}/videos?api_key=${API_KEY}`;
        const res2 = await fetch(url2, { credentials: 'omit' });
        if (res2.ok) {
          const j2 = await res2.json();
          const vids2 = (j2?.results || []).filter(v => GOOD_TYPES.has(v.type) && GOOD_SITES.has(v.site));
          setCache(ck, vids2.length ? vids2 : { __empty: true });
          return vids2.length ? vids2 : null;
        }
      }
      setCache(ck, videos.length ? videos : { __empty: true });
      return videos.length ? videos : null;
    } catch (e) {
      console.debug('Extras fetch failed', { type, id, e });
      return null;
    }
  }

  function renderExtrasInto(slot, videos, locked) {
    if (!slot) return;
    slot.textContent = '';
    if (!videos || !videos.length) return;

    const row = document.createElement('div');
    row.className = 'extras-row';
    if (locked) row.dataset.locked = '1';

    const label = document.createElement('span');
    label.className = 'extras-label';
    label.textContent = t('extras') || 'Extras';
    row.appendChild(label);

    for (const v of videos.slice(0, 5)) { // cap to keep compact
      const href = buildHref(v);
      const el = document.createElement(locked ? 'span' : 'a');
      el.className = 'extra-chip';
      if (!locked) {
        el.href = href;
        el.target = '_blank';
        el.rel = 'noopener';
        el.title = `${v.type}: ${v.name || ''}`.trim();
        el.setAttribute('aria-label', `${v.type}: ${v.name || ''}`.trim());
      } else {
        el.setAttribute('aria-hidden', 'true');
      }
      el.textContent = labelFor(v);
      row.appendChild(el);
    }

    if (locked) {
      const tip = document.createElement('span');
      tip.className = 'more-count';
      tip.textContent = t('upgrade_to_watch') || ' — upgrade to watch';
      row.appendChild(tip);
    }

    slot.appendChild(row);
  }

  async function attachExtras(cardEl, item) {
    if (!cardEl || !item) return;
    const slot = cardEl.querySelector('.extras-slot');
    if (!slot) return;

    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const mt = (type || '').toLowerCase();
    if (mt !== 'movie' && mt !== 'tv') {
      console.debug('🎬 Extras: skipping for person', { type, id: item.id, name: item.name || item.title });
      return;
    }
    
    const videos = await fetchExtras(type, item.id, LANG);
    if (!videos || videos.__empty) return;

    renderExtrasInto(slot, videos, !PRO);
  }

  // export global hook
  window.__FlickletAttachExtras = attachExtras;

  // Function to refresh all extras displays (useful when Pro status changes)
  window.__FlickletRefreshExtras = function() {
    const cards = document.querySelectorAll('.show-card');
    cards.forEach(card => {
      const slot = card.querySelector('.extras-slot');
      if (slot && slot.innerHTML.trim()) {
        // Re-render existing extras with current Pro status
        const isPro = !!window.FLAGS?.proEnabled;
        const row = slot.querySelector('.extras-row');
        if (row) {
          row.dataset.locked = isPro ? '0' : '1';
          const chips = row.querySelectorAll('.extra-chip');
          chips.forEach(chip => {
            if (isPro) {
              chip.style.pointerEvents = 'auto';
              chip.style.opacity = '1';
            } else {
              chip.style.pointerEvents = 'none';
              chip.style.opacity = '0.65';
            }
          });
        }
      }
    });
  };

  console.log('🎬 Extras v1 ready', { pro: PRO });
})();

// === SO-1: Series Organizer (progressive disclosure) ===
(() => {
  const FLAGS = (window.FLAGS = window.FLAGS || {});
  if (FLAGS.seriesOrganizerEnabled === false) {
    console.log('🗂️ Series Organizer disabled via flag');
    return;
  }
  if (window.__soV1Bound) return;
  window.__soV1Bound = true;

  const PRO = !!FLAGS.proEnabled;

  // Observe card insertions; decorate once
  const DECORATED = new WeakSet();

  function yearOf(item) {
    const d = (item.first_air_date || item.release_date || '').slice(0,4);
    return d || '';
  }
  function criticsPct(item) {
    const v = Number(item.vote_average || 0);
    if (!v) return '';
    return `${Math.round(v * 10)}%`;
  }
  function statusOf(item) {
    return (item.status || '').replace(/_/g,' ');
  }
  function networkOf(item) {
    if (Array.isArray(item.networks) && item.networks[0]?.name) return item.networks[0].name;
    return '';
  }

  function buildHeader(detailsEl, item, titleText) {
    // Insert at the very top of details
    let header = detailsEl.querySelector('.card-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'card-header';
      detailsEl.prepend(header);
    } else {
      header.textContent = ''; // idempotent
    }

    const hTitle = document.createElement('div');
    hTitle.className = 'h-title';
    hTitle.textContent = titleText;
    header.appendChild(hTitle);

    const meta = document.createElement('div');
    meta.className = 'h-meta';
    const bits = [];
    const y = yearOf(item); if (y) bits.push(`(${y})`);
    const st = statusOf(item); if (st) bits.push(st);
    const nw = networkOf(item); if (nw) bits.push(nw);
    const sc = criticsPct(item); if (sc) bits.push(sc);
    meta.textContent = bits.join(' · ');
    header.appendChild(meta);
  }

  function ensurePills(detailsEl) {
    let pills = detailsEl.querySelector('.card-pills');
    let drawer = detailsEl.querySelector('.card-drawer');
    if (!pills || !drawer) return null;

    // Create pills (Watch, Extras, Facts)
    pills.textContent = '';
    const mk = (id, label, ic) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pill';
      b.dataset.pill = id;
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-controls', 'drawer-'+id);
      b.innerHTML = `<span class="ic" aria-hidden="true">${ic}</span>${label}`;
      return b;
    };
    const pWatch = mk('watch', 'Watch', '▶');
    const pExtras = mk('extras', 'Extras', '🎬');
    const pFacts  = mk('facts',  'Facts',  '🧠');

    pills.appendChild(pWatch);
    pills.appendChild(pExtras);
    pills.appendChild(pFacts);

    // Hide pills that have no content
    const hasProviders = !!detailsEl.querySelector('.providers-slot');
    const hasExtras    = !!detailsEl.querySelector('.extras-slot');
    const hasFacts     = !!detailsEl.querySelector('.trivia-slot');

    if (!hasProviders) pWatch.hidden = true;
    if (!hasExtras)    pExtras.hidden = true;
    if (!hasFacts)     pFacts.hidden  = true;

    // Move slots into drawer (once)
    drawer.textContent = '';
    ['providers-slot','extras-slot','trivia-slot'].forEach(cls => {
      const src = detailsEl.querySelector('.' + cls);
      if (src) drawer.appendChild(src);
    });

    // Toggle logic: one open at a time per card
    pills.addEventListener('click', (e) => {
      const btn = e.target.closest('button.pill');
      if (!btn) return;
      const id = btn.dataset.pill;
      const open = btn.getAttribute('aria-expanded') === 'true';

      // Close all, then maybe open the clicked one
      pills.querySelectorAll('button.pill').forEach(b => b.setAttribute('aria-expanded','false'));
      drawer.hidden = true;

      if (!open) {
        btn.setAttribute('aria-expanded','true');
        drawer.hidden = false;

        // Inside drawer, show only the requested block; hide the others
        drawer.querySelectorAll('.providers-slot,.extras-slot,.trivia-slot')
          .forEach(el => el.style.display = 'none');
        const showCls = id === 'watch' ? '.providers-slot' : id === 'extras' ? '.extras-slot' : '.trivia-slot';
        const tgt = drawer.querySelector(showCls);
        if (tgt) tgt.style.display = '';
      }
    }, { passive: true });

    return { pills, drawer, pWatch, pExtras, pFacts };
  }

  function decorateCard(cardEl) {
    if (!cardEl || DECORATED.has(cardEl)) return;
    const details = cardEl.querySelector('.show-details');
    if (!details) return;

    // Scope the card for CSS: .so-card
    cardEl.classList.add('so-card');

    // Header: extract title text from existing .show-title
    const titleBtn = details.querySelector('.show-title .btn-link');
    const titleText = titleBtn ? titleBtn.textContent.trim() : (details.querySelector('.show-title')?.textContent.trim() || 'Untitled');

    // Pull item info from attributes (we already set data-id and data-media-type). We don't have the whole item here,
    // but header bits (year/status/network/score) can be recomputed later when providers/extras/trivia IIFEs finish.
    // For now we attempt to read a cached item attached by createShowCard (common pattern).
    const item = cardEl.__item || {}; // if createShowCard attaches: card.__item = item;

    buildHeader(details, item, titleText);
    ensurePills(details);

    // Attach providers, extras, and trivia to the card (only if we have valid item data)
    if (item && item.id) {
      setTimeout(() => {
        try { window.__FlickletAttachProviders?.(cardEl, item); } catch {}
        try { window.__FlickletAttachExtras?.(cardEl, item); } catch {}
        try { window.__FlickletAttachTrivia?.(cardEl, item); } catch {}
      }, 0);
    }

    DECORATED.add(cardEl);
  }

  // Hook into your card creation path:
  // 1) decorate existing cards at boot
  document.querySelectorAll('.show-card').forEach(decorateCard);

  // 2) monkey-patch a small public hook you already use after creating cards (optional, safe if absent)
  const origCreate = window.__afterCardCreate;
  window.__afterCardCreate = function(cardEl, item) {
    try { if (cardEl) cardEl.__item = item; } catch {}
    try { decorateCard(cardEl); } catch {}
    if (typeof origCreate === 'function') {
      try { origCreate(cardEl, item); } catch {}
    }
  };

  // 3) as a fallback, observe new cards
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach(n => {
        if (n && n.nodeType === 1) {
          if (n.classList?.contains('show-card')) decorateCard(n);
          n.querySelectorAll?.('.show-card')?.forEach(decorateCard);
        }
      });
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });

  // Function to refresh all Series Organizer cards when Pro status changes
  window.__FlickletRefreshSeriesOrganizer = function() {
    const cards = document.querySelectorAll('.so-card');
    cards.forEach(card => {
      const item = card.__item;
      if (item && item.id) {
        // Re-attach providers, extras, and trivia with current Pro status
        setTimeout(() => {
          try { window.__FlickletAttachProviders?.(card, item); } catch {}
          try { window.__FlickletAttachExtras?.(card, item); } catch {}
          try { window.__FlickletAttachTrivia?.(card, item); } catch {}
        }, 0);
      }
    });
  };

  console.log('🗂️ Series Organizer SO-1 initialized', { pro: PRO });
})();
    