(function () {
  const NS = "[data-init]";
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  // Public flags
  window.__CLOUD_ENABLED__ = false;
  window.__AUTH_READY__ = false;

  // Local state
  let app = window.firebaseApp || null;
  let auth = window.firebaseAuth || null;
  let db   = window.firebaseDb   || null;

  // Helper: safe JSON storage
  const storage = {
    get(key, fallback=null) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }
  };

  // Helper: read appData safely
  function readLocalAppData() {
    return storage.get("appData", { tv:{watching:[],wishlist:[],watched:[]}, movies:{watching:[],wishlist:[],watched:[]}, settings:{} });
  }

  // Helper: write appData safely
  function writeLocalAppData(data) {
    if (!data || typeof data !== "object") return;
    storage.set("appData", data);
  }

  // Expose a manual loader used by logs you've seen
  window.loadUserDataAndReplaceCards = async function loadUserDataAndReplaceCards() {
    try {
      const A = readLocalAppData();
      // no DOM mutation here—functions.js handles rendering.
      log("local appData loaded:", { hasTV: !!A?.tv, hasMovies: !!A?.movies });
      document.dispatchEvent(new CustomEvent("app:data:ready", { detail: { source: "localStorage" }}));
      if (window.__CLOUD_ENABLED__) await trySync("post-local");
    } catch (e) {
      err("loadUserDataAndReplaceCards failed:", e?.message || e);
    }
  };

  // Guarded Firebase import + readiness
  (async function init() {
    try {
      log("ready");
      app  = window.firebaseApp || null;
      auth = window.firebaseAuth || null;
      db   = window.firebaseDb   || null;

      if (!app || !auth || !db) {
        // Attempt modular imports lazily (won't throw if CSP blocks—caught)
        try {
          const [{ getAuth }, { getFirestore }] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js"),
            import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js")
          ]);
          if (!app) app = window.firebaseApp || null;
          if (!auth) auth = window.firebaseAuth || getAuth(app);
          if (!db)   db   = window.firebaseDb   || getFirestore(app);
        } catch (e) {
          warn("modular import skipped/failed (likely CSP cache):", e?.message || e);
        }
      }

      window.__AUTH_READY__ = !!auth;
      // Cloud is "enabled" only if all parts present
      window.__CLOUD_ENABLED__ = !!(app && auth && db);

      // Always surface local data immediately
      await window.loadUserDataAndReplaceCards();

      // If cloud is enabled, observe auth and opportunistically sync
      if (window.__CLOUD_ENABLED__) {
        const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
        onAuthStateChanged(auth, async (user) => {
          log("auth state:", user ? "signed-in" : "signed-out");
          try {
            await trySync("auth-change");
          } catch (e) {
            warn("sync on auth-change failed:", e?.message || e);
          }
        });
      } else {
        warn("cloud disabled (auth/db not ready) — local-only mode");
      }
    } catch (e) {
      err("init failure:", e?.message || e);
    }
  })();

  // Safe Firestore doc accessor
  async function getUserDocRef(kind) {
    if (!window.__CLOUD_ENABLED__) throw new Error("cloud-disabled");
    const { doc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("no-user");
    if (kind === "settings") return doc(db, `users/${uid}/settings/app`);
    if (kind === "lists")    return doc(db, `users/${uid}/lists/app`);
    throw new Error("bad-kind");
  }

  // Backoff helper
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Sync routine (pull settings + lists into localStorage); never throws out
  async function trySync(reason = "manual") {
    try {
      const [{ getDoc, setDoc }] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js")
      ]);

      // Guard: ensure user
      const uid = auth?.currentUser?.uid || null;
      if (!uid) { warn("sync skipped:", reason, "- no user"); return; }

      // Pull remote
      const [settingsRef, listsRef] = await Promise.all([
        getUserDocRef("settings"),
        getUserDocRef("lists")
      ]);

      const [settingsSnap, listsSnap] = await Promise.all([
        getDoc(settingsRef),
        getDoc(listsRef)
      ]);

      const local = readLocalAppData();
      if (settingsSnap.exists()) {
        local.settings = { ...(local.settings || {}), ...(settingsSnap.data() || {}) };
      }
      if (listsSnap.exists()) {
        const remote = listsSnap.data() || {};
        // normalize shape (don't mutate unexpectedly)
        local.tv     = { watching: remote?.tv?.watching || [], wishlist: remote?.tv?.wishlist || [], watched: remote?.tv?.watched || [] };
        local.movies = { watching: remote?.movies?.watching || [], wishlist: remote?.movies?.wishlist || [], watched: remote?.movies?.watched || [] };
      }

      writeLocalAppData(local);
      document.dispatchEvent(new CustomEvent("app:data:ready", { detail: { source: "cloud" }}));
      log("sync complete:", reason, { tvCounts: Object.fromEntries(Object.entries(local.tv).map(([k,v])=>[k, v.length])), movieCounts: Object.fromEntries(Object.entries(local.movies).map(([k,v])=>[k, v.length])) });
    } catch (e) {
      warn("sync error:", e?.message || e);
      // light backoff if network-related; do not spin forever
      const msg = (e && (e.code || e.message || "")) + "";
      if (/network|unavailable|deadline/i.test(msg)) {
        await sleep(1000);
      }
    }
  }

  // Export minimal API
  window.DataInit = { trySync, readLocalAppData, writeLocalAppData };

})();