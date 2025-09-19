// www/firebase-config.js
(function () {
  // Publish config only — no "Firebase not loaded" checks here.
  window.firebaseConfig = window.firebaseConfig || {
    apiKey: "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM",
    authDomain: "flicklet-71dff.firebaseapp.com",
    projectId: "flicklet-71dff",
    storageBucket: "flicklet-71dff.appspot.com", // keep *.appspot.com for Storage
    messagingSenderId: "1034923556763",
    appId: "1:1034923556763:web:bba5489cd1d9412c9c2b3e",
    measurementId: "G-YL4TJ4FHJC"
  };

  console.log("[firebase-config] ready for projectId:", window.firebaseConfig.projectId);

  try {
    window.dispatchEvent(new CustomEvent("firebase:config", {
      detail: { projectId: window.firebaseConfig.projectId }
    }));
  } catch {}
})();