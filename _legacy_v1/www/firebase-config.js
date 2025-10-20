// www/firebase-config.js
(function () {
  // Publish config only — no "Firebase not loaded" checks here.
  window.firebaseConfig = window.firebaseConfig || {
    apiKey: 'AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM',
    authDomain: 'flicklet-71dff.firebaseapp.com',
    projectId: 'flicklet-71dff',
    storageBucket: 'flicklet-71dff.appspot.com', // keep *.appspot.com for Storage
    messagingSenderId: '1034923556763',
    appId: '1:1034923556763:web:bba5489cd1d9412c9c2b3e',
    measurementId: 'G-YL4TJ4FHJC',
  };

  console.log('[firebase-config] ready for projectId:', window.firebaseConfig.projectId);

  // Initialize Firebase with compat SDK
  if (typeof firebase !== 'undefined') {
    try {
      window.firebaseApp = firebase.initializeApp(window.firebaseConfig);
      window.firebaseAuth = firebase.auth();
      window.firebaseDb = firebase.firestore();

      // Export db for module usage
      window.db = window.firebaseDb;

      console.log('[firebase-config] Firebase initialized successfully');

      // Dispatch ready event
      window.dispatchEvent(
        new CustomEvent('firebase:ready', {
          detail: {
            app: window.firebaseApp,
            auth: window.firebaseAuth,
            db: window.firebaseDb,
          },
        }),
      );

      // Dev-only: prove Firestore works
      if (location.hostname === 'localhost') {
        window._testFirestore = async (uid) => {
          try {
            const path = `users/${uid}`;
            const ts = firebase.firestore.FieldValue.serverTimestamp();
            await window.db.doc(path).set({ _ping: ts }, { merge: true });
            const snap = await window.db.doc(path).get();
            console.log(
              '[Firestore] exists:',
              snap.exists,
              'keys:',
              Object.keys(snap.data() || {}),
            );
            return { success: true, exists: snap.exists, keys: Object.keys(snap.data() || {}) };
          } catch (e) {
            console.error('[Firestore] test failed:', e);
            return { success: false, error: e.message };
          }
        };
        console.log('[Firestore] Test function available: window._testFirestore(uid)');
      }
    } catch (error) {
      console.error('[firebase-config] Firebase initialization failed:', error);
    }
  } else {
    console.warn('[firebase-config] Firebase SDK not loaded yet');
  }

  try {
    window.dispatchEvent(
      new CustomEvent('firebase:config', {
        detail: { projectId: window.firebaseConfig.projectId },
      }),
    );
  } catch {}
})();
