// firebase-config.js
// One true Firebase initializer for Flicklet (legacy v8 + v9 bridge)

// ---- 1) Your real config (from Firebase Console) ----
window.firebaseConfig = {
  apiKey: "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM",
  authDomain: "flicklet-71dff.firebaseapp.com",
  projectId: "flicklet-71dff",
  storageBucket: "flicklet-71dff.appspot.com", // keep *.appspot.com for Storage
  messagingSenderId: "1034923556763",
  appId: "1:1034923556763:web:bba5489cd1d9412c9c2b3e",
  measurementId: "G-YL4TJ4FHJC"
};

// ---- 2) Legacy Firebase v8 initialization ----
if (typeof firebase !== 'undefined') {
  // Initialize Firebase app
  window.firebaseApp = firebase.initializeApp(window.firebaseConfig);
  window.firebaseAuth = firebase.auth();
  window.firebaseDb = firebase.firestore();
  
  // ---- 3) Auth ready promise ----
  window.authReady = new Promise((resolve) => {
    const unsub = firebase.auth().onAuthStateChanged((u) => {
      if (u) { unsub(); resolve(u); }
    });
  });
  
  // ---- 4) Ensure user function with anonymous fallback ----
  window.ensureUser = async function() {
    // If already signed in, return immediately
    if (firebase.auth().currentUser) return firebase.auth().currentUser;
    
    // Wait briefly for an auth event
    const user = await new Promise((resolve) => {
      let settled = false;
      const unsub = firebase.auth().onAuthStateChanged((u) => {
        if (u && !settled) { settled = true; unsub(); resolve(u); }
      });
      // Fallback: after a tick, if still no user, sign in anonymously
      setTimeout(async () => {
        if (!settled && !firebase.auth().currentUser) {
          try { 
            await firebase.auth().signInAnonymously(); 
          } catch (e) { 
            console.warn("[ensureUser] anon sign-in failed:", e?.message); 
          }
        }
      }, 0);
    });
    
    return user || firebase.auth().currentUser;
  };
  
  // ---- 5) Legacy globals for compatibility ----
  window.firebaseDb = firebase.firestore();
  window.onAuthStateChanged = (cb) => firebase.auth().onAuthStateChanged(cb);
  
  console.log("[firebase-config] projectId:", window.firebaseApp.options.projectId);
} else {
  console.error("[firebase-config] Firebase not loaded!");
}
