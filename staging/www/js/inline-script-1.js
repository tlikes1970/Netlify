
    (function () {
      const hasSDK = !!(window.firebase && typeof window.firebase.initializeApp === 'function');
      const cfg = window.firebaseConfig;
      if (!hasSDK) {
        console.info('Firebase SDK missing; skip init');
        return;
      }
      if (!cfg || typeof cfg !== 'object') {
        console.info('Firebase config missing; skip init');
        return;
      }
      try {
        if (!firebase.apps?.length) firebase.initializeApp(cfg);
        if (firebase.firestore) { 
          window.db = firebase.firestore(); 
        } else { 
          console.warn('Firestore compat not available'); 
        }
        console.info('Firebase initialized');
      } catch (e) {
        console.error('Firebase init error', e);
      }
    })();
    