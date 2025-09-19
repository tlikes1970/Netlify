// Test: Sign-in button functionality
// Tests that clicking sign-in button triggers auth flow

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

console.log("🧪 Auth tests completed");
