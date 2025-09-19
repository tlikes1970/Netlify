// www/js/data-init.js
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

(function initData() {
  const app = window.firebaseApp;
  const auth = window.firebaseAuth || getAuth(app);
  const db   = window.firebaseDb   || getFirestore(app);

  // in-memory + localStorage helpers
  const saveLocal = (data) => {
    try { localStorage.setItem("appData", JSON.stringify(data)); } catch {}
  };
  const loadLocal = () => {
    try { return JSON.parse(localStorage.getItem("appData") || "{}"); } catch { return {}; }
  };

  const ensureAppDataShape = (d) => ({
    tv:     { watching: d?.tv?.watching || [], wishlist: d?.tv?.wishlist || [], watched: d?.tv?.watched || [] },
    movies: { watching: d?.movies?.watching || [], wishlist: d?.movies?.wishlist || [], watched: d?.movies?.watched || [] },
    settings: d?.settings || {}
  });

  async function readUserLists(uid) {
    // primary location
    const listsRef = doc(db, `users/${uid}/lists/app`);
    const setRef   = doc(db, `users/${uid}/settings/app`);
    const [listsSnap, settingsSnap] = await Promise.all([getDoc(listsRef), getDoc(setRef)]);
    const lists = listsSnap.exists() ? listsSnap.data() : {};
    const settings = settingsSnap.exists() ? settingsSnap.data() : {};
    return ensureAppDataShape({ ...lists, settings });
  }

  async function bootstrapForUser(uid) {
    let data;
    try {
      data = await readUserLists(uid);
    } catch (e) {
      console.warn("[data-init] Firestore read failed, falling back to local:", e?.message || e);
      data = ensureAppDataShape(loadLocal());
    }
    window.appData = data;
    saveLocal(data);

    // trigger renders (reuse existing renderer)
    try {
      if (typeof window.loadListContent === "function") {
        ["watching", "wishlist", "watched"].forEach((k) => window.loadListContent(k));
      }
      if (typeof window.updateTabCounts === "function") window.updateTabCounts();
    } catch (e) {
      console.warn("[data-init] render kick failed:", e?.message || e);
    }
    console.log("[data-init] hydrated", {
      tv: Object.fromEntries(Object.entries(data.tv).map(([k,v])=>[k, v.length])),
      mv: Object.fromEntries(Object.entries(data.movies).map(([k,v])=>[k, v.length]))
    });
  }

  // events
  window.addEventListener("firebase:ready", () => {
    if (auth.currentUser) bootstrapForUser(auth.currentUser.uid);
  });
  window.addEventListener("user:signedIn", (e) => bootstrapForUser(e.detail.uid));
  window.addEventListener("user:signedOut", () => {
    // keep local, just clear in-memory to reflect signed-out state
    window.appData = ensureAppDataShape(loadLocal());
    if (typeof window.updateTabCounts === "function") window.updateTabCounts();
  });

  console.log("[data-init] ready");
})();