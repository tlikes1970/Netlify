/**
 * One-time script to grant admin role to a user
 * Usage: node grant-admin.js pprowten@gmail.com
 */

// Use the same admin initialization as functions/src/admin.ts
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Initialize Firebase Admin
// For local development, you need to either:
// 1. Run: gcloud auth application-default login
// 2. Or set GOOGLE_APPLICATION_CREDENTIALS to a service account key file
// 3. Or use firebase functions:shell (which handles credentials automatically)
let app;
try {
  // Try to initialize with project ID (will use application default credentials if available)
  app = initializeApp({
    projectId: "flicklet-71dff",
  });
  console.log("✅ Using application default credentials");
} catch {
  console.log(
    "⚠️  Application default credentials not found, trying service account..."
  );

  // If that fails, try with explicit service account
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath) {
    try {
      const serviceAccount = require(serviceAccountPath);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: "flicklet-71dff",
      });
      console.log("✅ Using service account credentials");
    } catch (error_) {
      throw new Error(
        `Failed to load service account from ${serviceAccountPath}: ${error_.message}`
      );
    }
  } else {
    throw new Error(
      "No credentials found.\n\n" +
        "Please do ONE of the following:\n" +
        "1. Run: gcloud auth application-default login\n" +
        "2. Set GOOGLE_APPLICATION_CREDENTIALS to a service account key file\n" +
        "3. Use: firebase functions:shell (then run the commands manually)"
    );
  }
}

const auth = getAuth(app);

async function grantAdmin(email) {
  try {
    // Get user by email
    const user = await auth.getUserByEmail(email);
    console.log(`Found user: ${user.uid} (${user.email})`);

    // Set custom claims
    await auth.setCustomUserClaims(user.uid, { role: "admin" });

    console.log(`✅ Admin role granted to ${email}`);
    console.log(`   User ID: ${user.uid}`);
    console.log(
      "\n⚠️  Note: User must sign out and sign back in for changes to take effect."
    );

    return { message: "Admin role granted" };
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node grant-admin.js <email>");
    process.exit(1);
  }

  grantAdmin(email)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { grantAdmin };
