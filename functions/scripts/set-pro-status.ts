/**
 * Script to set Pro status for a user in Firestore
 * Usage: npm run set-pro-status -- <userId> <true|false>
 * Example: npm run set-pro-status -- CK5eDaZs4lODqF5APVSk7fEyeOq2 true
 * 
 * Or run directly: npx ts-node --project tsconfig.json scripts/set-pro-status.ts <userId> <true|false>
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore(app);
const auth = getAuth(app);

async function setProStatus(userId: string, isPro: boolean) {
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
  console.error('Usage: npx ts-node --project tsconfig.json scripts/set-pro-status.ts <userId> <true|false>');
  console.error('Example: npx ts-node --project tsconfig.json scripts/set-pro-status.ts CK5eDaZs4lODqF5APVSk7fEyeOq2 true');
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

