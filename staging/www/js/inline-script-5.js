
  (function() {
    'use strict';
    
    // Prevent duplicate initialization
    if (window.firebaseInitialized) {
      console.warn("⚠️ Firebase already initialized, skipping duplicate");
      return;
    }
    
    try {
      // Validate configuration
      if (!window.firebaseConfig?.apiKey) {
        console.error("❌ Firebase config missing apiKey");
        return;
      }
      
      // Initialize Firebase only if not already initialized
      if (window.firebase && typeof window.firebase.initializeApp === 'function') {
        if (firebase.apps.length === 0) {
          firebase.initializeApp(window.firebaseConfig);
          console.info("✅ Firebase initialized:", window.firebaseConfig.projectId);
          
          // Set persistence to LOCAL for better localhost experience
          const auth = firebase.auth();
          auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
              console.info("🔒 Auth persistence set to LOCAL");
            })
            .catch((err) => {
              console.error("⚠️ Failed to set persistence", err);
            });
          
          // Expose Firebase services globally for debugging and app use
          window.FB = {
            auth: auth,
            db: firebase.firestore()
          };
          
          // Mark as initialized to prevent duplicates
          window.firebaseInitialized = true;
          window.firebase = firebase;
          window.auth = auth;
          window.db = firebase.firestore();
          
        } else {
          console.warn("⚠️ Firebase already initialized, reusing existing instance");
          window.firebaseInitialized = true;
        }
      } else {
        console.info('Firebase not available; skipping init');
      }
      
    } catch (e) {
      console.error("🔥 Firebase initialization error:", e);
      // Don't mark as initialized if there was an error
    }
  })();
