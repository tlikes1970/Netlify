// Goal: Immediate cards via localStorage, then transparent Firestore sync when available.

// 1) Add: www/js/data-init.js
// - Boot from localStorage immediately
// - Then, if Firebase Auth + Firestore are present and user is signed-in, load /users/{uid}/lists
// - On success: update window.appData, persist to localStorage, dispatch "app:data:ready" (firestore)
// - On failure: keep LS state, log a compact warning (no UI break)

(function () {
  // ---- helpers
  const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  const EMPTY = { tv:{ watching:[], wishlist:[], watched:[] },
                  movies:{ watching:[], wishlist:[], watched:[] } };

  const setAppData = (obj, source) => {
    window.appData = obj && typeof obj === 'object' ? obj : EMPTY;
    try { localStorage.setItem('flicklet_appData', JSON.stringify(window.appData)); } catch {}
    window.dispatchEvent(new CustomEvent('app:data:ready', { detail: { source } }));
  };

  // ---- 1) Local bootstrap (instant)
  const fromLS = safeParse(localStorage.getItem('flicklet_appData'));
  setAppData(fromLS || window.appData || EMPTY, fromLS ? 'localStorage' : 'empty');

  // ---- 2) Firestore sync (non-blocking)
  const hasFirebase = !!(window.firebaseApp || window.firebaseAuth || window.firebaseDb);
  if (!hasFirebase) return; // not fatal

  const trySync = async () => {
    try {
      // v9 modular via globals your app already created
      const { getAuth, onAuthStateChanged }    = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
      const { getFirestore, doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");
      const app   = window.firebaseApp;
      const auth  = window.firebaseAuth || getAuth(app);
      const db    = window.firebaseDb   || getFirestore(app);

      // wait for a signed in user (without blocking UI)
      const user = auth.currentUser || await new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (u) => { if (u) { unsub(); resolve(u); } else { resolve(null); } });
        setTimeout(() => { try { unsub(); } catch {} resolve(null); }, 2000); // soft timeout
      });
      if (!user) return; // not signed in; LS state remains active

      // read /users/{uid}/lists
      const ref = doc(db, `users/${user.uid}/lists/app`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const server = snap.data();
        // Merge server over local (server wins if keys overlap)
        const merged = {
          tv:     { ...EMPTY.tv,     ...(window.appData?.tv||{}),     ...(server.tv||{}) },
          movies: { ...EMPTY.movies, ...(window.appData?.movies||{}), ...(server.movies||{}) },
        };
        setAppData(merged, 'firestore');
      } else {
        // First-time user: seed server with our local (if any) so devices stay in sync
        const seed = window.appData || EMPTY;
        await setDoc(ref, seed, { merge: true });
        setAppData(seed, 'firestore-seeded');
      }
    } catch (e) {
      console.warn('[data-init] Firestore sync skipped:', e?.message || e);
      // keep local state; no dispatch (we already dispatched from LS)
    }
  };
  trySync();
})();
