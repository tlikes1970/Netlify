
  (function() {
    'use strict';
    
    // Wait for modular bridge to be ready
    if (!window.firebaseApp || !window.firebaseAuth || !window.firebaseDb) {
      console.info('Firebase modular bridge not ready yet; skipping init');
      return;
    }
    
    try {
      // Validate configuration
      if (!window.firebaseConfig?.apiKey) {
        console.error("❌ Firebase config missing apiKey");
        return;
      }
      
      // Use modular bridge services
      const auth = window.firebaseAuth;
      const db = window.firebaseDb;
      
      console.info("✅ Firebase modular bridge ready:", window.firebaseConfig.projectId);
      
      // Expose Firebase services globally for debugging and app use
      window.FB = {
        auth: auth,
        db: db
      };
      
      // Mark as initialized to prevent duplicates
      window.firebaseInitialized = true;
      window.auth = auth;
      window.db = db;
      
    } catch (e) {
      console.error("🔥 Firebase bridge error:", e);
    }
  })();
