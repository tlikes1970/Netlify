// Run this in Firebase functions shell:
// firebase functions:shell
// Then paste these commands:

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Initialize with project ID (shell handles credentials)
const app = initializeApp({ projectId: "flicklet-71dff" });
const auth = getAuth(app);

// Grant admin role
const email = "likes.travis@gmail.com";
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: "admin" });
console.log("✅ Admin role granted to", user.email);
console.log("   User ID:", user.uid);
console.log(
  "\n⚠️  Note: User must sign out and sign back in for changes to take effect."
);
