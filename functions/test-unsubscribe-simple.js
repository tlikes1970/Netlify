/**
 * Simple test script for unsubscribe flow (no service account needed)
 * Usage: node test-unsubscribe-simple.js <uid>
 * 
 * This script generates a test unsubscribe token that you can use
 * to test the unsubscribe page in the browser.
 */

function generateTestToken(uid) {
  const payload = {
    uid,
    type: "unsubscribe",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
  };
  
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

// Get UID from command line args
const uid = process.argv[2];

if (!uid) {
  console.error('Usage: node test-unsubscribe-simple.js <uid>');
  console.error('Example: node test-unsubscribe-simple.js abc123xyz');
  console.error('\nTo get a user UID:');
  console.error('  1. Sign in to the app');
  console.error('  2. Open browser console');
  console.error('  3. Run: firebase.auth().currentUser.uid');
  process.exit(1);
}

const token = generateTestToken(uid);
const unsubscribeUrl = `http://localhost:8888/unsubscribe?token=${token}`;
const productionUrl = `https://flicklet.app/unsubscribe?token=${token}`;

console.log('\n🧪 Unsubscribe Token Test\n');
console.log(`User UID: ${uid}`);
console.log(`\n🔑 Generated Token:`);
console.log(`   ${token}`);
console.log(`\n🔗 Local Test URL:`);
console.log(`   ${unsubscribeUrl}`);
console.log(`\n🔗 Production Test URL:`);
console.log(`   ${productionUrl}`);
console.log(`\n📋 Test Steps:`);
console.log(`   1. Make sure the user has emailSubscriber: true in Firestore`);
console.log(`   2. Open the URL above in your browser`);
console.log(`   3. Verify the unsubscribe page loads and processes the token`);
console.log(`   4. Check Firestore to confirm emailSubscriber is now false`);
console.log(`\n✅ Token expires in 30 days\n`);









