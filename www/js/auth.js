// www/js/auth.js
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

(function initAuthBridge() {
  const app = window.firebaseApp;
  const auth = window.firebaseAuth || getAuth(app);
  const db   = window.firebaseDb   || getFirestore(app);

  const $btn   = document.getElementById("accountButton");
  const $label = document.getElementById("accountLabel");
  const $hello = document.getElementById("headerGreeting");

  const setGreeting = (username, displayName) => {
    if (!$hello) return;
    if (username) {
      $hello.innerHTML = `<div><strong>${username}</strong><div class="snark">welcome back, legend ✨</div></div>`;
    } else if (displayName) {
      $hello.innerHTML = `<div><strong>${displayName}</strong><div class="snark">nice to see you 👋</div></div>`;
    } else {
      $hello.textContent = "";
    }
  };

  const setSignedOutUI = () => {
    if ($label) $label.textContent = "Sign In";
    if ($btn)   { $btn.title = "Sign in"; $btn.dataset.state = "signed-out"; }
    setGreeting(null, null);
    document.querySelectorAll("[data-requires-auth]").forEach(el => { el.setAttribute("disabled",""); el.setAttribute("aria-disabled","true"); });
  };

  const setSignedInUI = async (user) => {
    const displayName = user.displayName || user.email || "Signed in";
    if ($label) $label.textContent = displayName;
    if ($btn)   { $btn.title = "Sign Out"; $btn.dataset.state = "signed-in"; }

    // pull settings.username, or prompt once, then persist
    try {
      const settingsRef = doc(db, `users/${user.uid}/settings/app`);
      const snap = await getDoc(settingsRef);
      let username = snap.exists() ? (snap.data().username || "") : "";

      if (!username) {
        username = window.prompt("What should we call you?")?.trim() || "";
        if (username) {
          await setDoc(settingsRef, { username }, { merge: true });
        }
      }
      setGreeting(username, displayName);
    } catch (e) {
      console.warn("[auth] settings/username read/write failed:", e?.message || e);
      setGreeting(null, displayName);
    }

    document.querySelectorAll("[data-requires-auth]").forEach(el => { el.removeAttribute("disabled"); el.removeAttribute("aria-disabled"); });
  };

  // click handler toggles sign-in/out
  if ($btn) {
    $btn.addEventListener("click", async () => {
      if ($btn.dataset.state === "signed-in") {
        try { await signOut(auth); } catch (e) { console.warn("[auth] signOut failed:", e?.message || e); }
      } else {
        try {
          await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (e) {
          console.warn("[auth] signIn failed:", e?.message || e);
        }
      }
    });
  }

  // auth observer: update UI + kick data hydrate
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setSignedOutUI();
      window.dispatchEvent(new CustomEvent("user:signedOut"));
      return;
    }
    await setSignedInUI(user);
    window.dispatchEvent(new CustomEvent("user:signedIn", { detail: { uid: user.uid } }));
  });

  // initial
  if (auth.currentUser) setSignedInUI(auth.currentUser);
  else setSignedOutUI();

  console.log("[auth] ready");
})();