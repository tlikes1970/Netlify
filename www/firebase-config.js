// firebase-init.js
// One true Firebase initializer for Flicklet (modular SDK + legacy globals)

// ---- 1) Your real config (from Firebase Console) ----
const firebaseConfig = {
  apiKey: "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM",
  authDomain: "flicklet-71dff.firebaseapp.com",
  projectId: "flicklet-71dff",
  // Storage not required right now; the new domain is correct for newer projects:
  storageBucket: "flicklet-71dff.firebasestorage.app",
  messagingSenderId: "1034923556763",
  appId: "1:1034923556763:web:bba5489cd1d9412c9c2b3e",
  measurementId: "G-YL4TJ4FHJC"
};

// ---- 2) Modular imports (via bundler or CDN <script type="module">) ----
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ---- 3) Initialize exactly one app ----
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ---- 4) Core services ----
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ---- 5) Ready gate: wait until a user exists before any Firestore calls ----
export const authReady = new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, (u) => {
    if (u) { unsub(); resolve(u); }
  });
});

// ---- 6) Ensure there is a signed-in user; anonymous fallback ----
export async function ensureUser() {
  // If already signed in, return immediately
  if (auth.currentUser) return auth.currentUser;

  // Wait briefly for an auth event
  const user = await new Promise((resolve) => {
    let settled = false;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && !settled) { settled = true; unsub(); resolve(u); }
    });
    // Fallback: after a tick, if still no user, sign in anonymously
    setTimeout(async () => {
      if (!settled && !auth.currentUser) {
        try { await signInAnonymously(auth); } catch (e) { console.warn("[ensureUser] anon sign-in failed:", e?.message); }
      }
    }, 0);
  });

  return user || auth.currentUser;
}

// ---- 7) Legacy globals (for older code paths) ----
window.firebaseConfig = firebaseConfig;
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
// For code that calls window.onAuthStateChanged(...)
window.onAuthStateChanged = (cb) => onAuthStateChanged(auth, cb);

// Debug breadcrumbs (safe to leave on while fixing)
console.log("[firebase-init] projectId:", app.options.projectId);
