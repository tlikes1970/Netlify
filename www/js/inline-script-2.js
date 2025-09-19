
    (function () {
      // Firebase modular bridge guard
      const hasFirebase = !!(window.firebaseApp && window.firebaseAuth && window.firebaseDb);
      if (!hasFirebase) {
        console.info('ℹ️ Firebase modular bridge not ready — cloud features disabled');
        // Provide harmless fallbacks so later code doesn't break
        window.loadUserDataFromCloud = window.loadUserDataFromCloud || (async () => null);
        window.addToList = window.addToList || (() => false);
        // Signal to app bootstrap that firebase is unavailable
        window.__NO_FIREBASE__ = true;
      }

      // TMDB client will be loaded via tmdb.js script

      // Minimal genre map fallback
      window.__GENRES__ = window.__GENRES__ || {
        // Core IDs used by TMDB (movies)
        16: 'Animation', 27: 'Horror', 28: 'Action', 35: 'Comedy', 18: 'Drama',
        12: 'Adventure', 14: 'Fantasy', 53: 'Thriller', 80: 'Crime', 99: 'Documentary'
      };

      // Service Worker registration (temporarily disabled)
      if (false && 'serviceWorker' in navigator) {
        const host = location.hostname;
        const isLocal = host === 'localhost' || host.endsWith('.local') || host.endsWith('.lan');
        const isProd = host.endsWith('netlify.app') && !host.includes('--deploy-preview-');
        if (isLocal || isProd) {
          navigator.serviceWorker.register('cnm-sw.js').catch(console.warn);
        } else {
          console.info('[SW] Registration skipped in this environment:', host);
        }
      }
    })();
    