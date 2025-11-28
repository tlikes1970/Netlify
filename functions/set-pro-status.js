/**
 * Script to set Pro status for a user in Firestore
 * Usage: node set-pro-status.js <userId> <true|false>
 * Example: node set-pro-status.js CK5eDaZs4lODqF5APVSk7fEyeOq2 true
 */

// Use the same admin initialization as functions/src/admin.ts
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

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
const db = getFirestore(app);

async function setProStatus(userId, isPro) {
  try {
    console.log(`Setting Pro status for user ${userId} to ${isPro}...`);

    // Get existing user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.warn(`⚠️  User document ${userId} does not exist in Firestore. Creating it...`);
    }
    
    const existingData = userDoc.exists ? userDoc.data() : {};
    const existingSettings = existingData?.settings || {};

    // Update Pro status
    const updatedSettings = {
      ...existingSettings,
      pro: {
        isPro: isPro,
        features: {
          advancedNotifications: isPro,
          themePacks: isPro,
          socialFeatures: isPro,
          bloopersAccess: isPro,
          extrasAccess: isPro,
        },
      },
    };

    // Update Firestore
    await userRef.set({
      ...existingData,
      settings: updatedSettings,
    }, { merge: true });

    console.log(`✅ Successfully set Pro status to ${isPro} for user ${userId}`);
    console.log(`   Pro features enabled: ${isPro}`);
    
    // Try to get user email if possible (optional, don't fail if auth fails)
    try {
      const targetUser = await auth.getUser(userId);
      console.log(`   Email: ${targetUser.email || 'No email'}`);
    } catch (authError) {
      console.log(`   (Could not fetch user email - auth check skipped)`);
    }
    
    return { success: true, userId, isPro };
  } catch (error) {
    console.error('❌ Error setting Pro status:', error);
    throw error;
  }
}

// Main execution
const userId = process.argv[2];
const isProArg = process.argv[3];

if (!userId || !isProArg) {
  console.error('Usage: node set-pro-status.js <userId> <true|false>');
  console.error('Example: node set-pro-status.js CK5eDaZs4lODqF5APVSk7fEyeOq2 true');
  process.exit(1);
}

const isPro = isProArg === 'true' || isProArg === '1';

setProStatus(userId, isPro)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

