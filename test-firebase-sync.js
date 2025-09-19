// Comprehensive Firebase Data Sync Diagnostic
console.log("🔍 COMPREHENSIVE FIREBASE DATA SYNC DIAGNOSTIC");
console.log("=" .repeat(60));

// Test 1: Check Firebase status
console.log("\n1️⃣ FIREBASE STATUS:");
console.log("Firebase App:", !!window.firebaseApp);
console.log("Firebase Auth:", !!window.firebaseAuth);
console.log("Firebase DB:", !!window.firebaseDb);
console.log("Cloud Enabled:", window.__CLOUD_ENABLED__);
console.log("Auth Ready:", window.__AUTH_READY__);

// Test 2: Check current user
console.log("\n2️⃣ CURRENT USER:");
const currentUser = window.firebaseAuth?.currentUser;
if (currentUser) {
  console.log("✅ User signed in:", {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName
  });
} else {
  console.log("❌ No user signed in");
}

// Test 3: Check DataInit availability
console.log("\n3️⃣ DATA INIT STATUS:");
console.log("DataInit object:", !!window.DataInit);
console.log("DataInit.trySync:", typeof window.DataInit?.trySync);
console.log("DataInit.readLocalAppData:", typeof window.DataInit?.readLocalAppData);

// Test 4: Check local data
console.log("\n4️⃣ LOCAL DATA:");
if (window.DataInit && typeof window.DataInit.readLocalAppData === 'function') {
  try {
    const localData = window.DataInit.readLocalAppData();
    console.log("Local appData:", localData);
    console.log("TV watching count:", localData?.tv?.watching?.length || 0);
    console.log("Movies watching count:", localData?.movies?.watching?.length || 0);
  } catch (error) {
    console.error("❌ Error reading local data:", error);
  }
} else {
  console.log("❌ Cannot read local data - DataInit not available");
}

// Test 5: Manual sync test
console.log("\n5️⃣ MANUAL SYNC TEST:");
if (window.DataInit && typeof window.DataInit.trySync === 'function') {
  console.log("Attempting manual sync...");
  try {
    await window.DataInit.trySync("manual-test");
    console.log("✅ Manual sync completed successfully");
  } catch (error) {
    console.error("❌ Manual sync failed:", error);
  }
} else {
  console.log("❌ Cannot perform sync - DataInit.trySync not available");
}

// Test 6: Check for auth state changes
console.log("\n6️⃣ AUTH STATE LISTENER TEST:");
if (window.firebaseAuth) {
  console.log("Firebase Auth available, current state:", 
    window.firebaseAuth.currentUser ? "signed-in" : "signed-out");
} else {
  console.log("❌ Firebase Auth not available");
}

// Test 7: Check for any Firebase errors in console
console.log("\n7️⃣ ERROR CHECK:");
console.log("Look for any Firebase or sync errors in the console above");
console.log("Check if there are any network errors in the Network tab");

console.log("\n" + "=" .repeat(60));
console.log("✅ DIAGNOSTIC COMPLETED");
