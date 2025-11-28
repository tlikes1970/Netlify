/**
 * Script to set Pro status for a user in Firestore
 * Usage: node apps/web/scripts/set-pro-status.js <userId> <true|false>
 * Example: node apps/web/scripts/set-pro-status.js CK5eDaZs4lODqF5APVSk7fEyeOq2 true
 * 
 * Note: This requires Firebase Admin SDK credentials. Make sure you have:
 * - GOOGLE_APPLICATION_CREDENTIALS environment variable set, OR
 * - Firebase Admin initialized with service account
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin
// Try to use default credentials (from GOOGLE_APPLICATION_CREDENTIALS or GCP metadata)
let app;
try {
  app = initializeApp();
} catch (error) {
  console.error('Failed to initialize Firebase Admin. Make sure you have:');
  console.error('1. GOOGLE_APPLICATION_CREDENTIALS environment variable set to service account JSON path, OR');
  console.error('2. Running on GCP with default credentials');
  console.error('Error:', error.message);
  process.exit(1);
}

const db = getFirestore(app);
const auth = getAuth(app);

async function setProStatus(userId, isPro) {
  try {
    console.log(`Setting Pro status for user ${userId} to ${isPro}...`);

    // Verify user exists
    const targetUser = await auth.getUser(userId);
    console.log(`Found user: ${targetUser.email || 'No email'}`);

    // Get existing user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
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
    console.log(`   Email: ${targetUser.email || 'No email'}`);
    console.log(`   Pro features enabled: ${isPro}`);
    
    return { success: true, userId, email: targetUser.email, isPro };
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

