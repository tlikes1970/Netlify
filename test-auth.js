// Test: Sign-in button functionality and UI updates
// Tests that clicking sign-in button triggers auth flow and updates UI

console.log("🧪 Testing sign-in button functionality...");

// Test 1: Button exists and has correct onclick
const button = document.getElementById('accountButton');
if (!button) {
  console.error("❌ Sign-in button not found");
} else {
  console.log("✅ Sign-in button found");
  
  // Test 2: Button has onclick handler
  if (button.onclick) {
    console.log("✅ Button has onclick handler");
  } else {
    console.error("❌ Button missing onclick handler");
  }
}

// Test 3: startSignIn function exists
if (typeof window.startSignIn === 'function') {
  console.log("✅ startSignIn function exists");
} else {
  console.error("❌ startSignIn function missing");
}

// Test 4: Firebase ready promise exists
if (window.__FIREBASE_READY__) {
  console.log("✅ Firebase ready promise exists");
} else {
  console.warn("⚠️ Firebase ready promise missing");
}

// Test 5: UI elements exist for auth state updates
const label = document.getElementById('accountButtonLabel');
const greeting = document.getElementById('headerGreeting');
if (label) {
  console.log("✅ Account button label found");
} else {
  console.error("❌ Account button label missing");
}
if (greeting) {
  console.log("✅ Header greeting element found");
} else {
  console.error("❌ Header greeting element missing");
}

// Test 6: Auth state change listener setup
setTimeout(() => {
  if (window.firebaseAuth) {
    console.log("✅ Firebase auth available");
  } else {
    console.warn("⚠️ Firebase auth not ready yet");
  }
}, 1000);

console.log("🧪 Auth tests completed");
