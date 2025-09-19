
    (function () {
      // Wait for modular bridge to be ready
      if (!window.firebaseApp || !window.firebaseDb) {
        console.info('Firebase modular bridge not ready yet; skip init');
        return;
      }
      try {
        window.db = window.firebaseDb;
        console.info('Firebase modular bridge ready');
      } catch (e) {
        console.error('Firebase bridge error', e);
      }
    })();
    