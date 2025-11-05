/**
 * One-time script to grant admin role to a user
 * Usage: node grant-admin.js pprowten@gmail.com
 */

// Use the same admin initialization as functions/src/admin.ts
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin (will use application default credentials or service account)
const app = initializeApp();
const auth = getAuth(app);

async function grantAdmin(email) {
  try {
    // Get user by email
    const user = await auth.getUserByEmail(email);
    console.log(`Found user: ${user.uid} (${user.email})`);

    // Set custom claims
    await auth.setCustomUserClaims(user.uid, { role: 'admin' });
    
    console.log(`✅ Admin role granted to ${email}`);
    console.log(`   User ID: ${user.uid}`);
    console.log('\n⚠️  Note: User must sign out and sign back in for changes to take effect.');
    
    return { message: 'Admin role granted' };
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node grant-admin.js <email>');
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

