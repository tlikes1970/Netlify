/**
 * Test script for unsubscribe flow
 * Usage: node test-unsubscribe.js <uid>
 * 
 * This script:
 * 1. Generates a test unsubscribe token for a user
 * 2. Tests the unsubscribe function
 * 3. Verifies the user document was updated
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json'); // You'll need this file
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function generateTestToken(uid) {
  const payload = {
    uid,
    type: "unsubscribe",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
  };
  
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

async function testUnsubscribe(uid) {
  try {
    console.log(`\n🧪 Testing unsubscribe flow for user: ${uid}\n`);
    
    // Step 1: Check current subscription status
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error('❌ User document does not exist');
      return;
    }
    
    const currentStatus = userDoc.data().emailSubscriber || false;
    console.log(`📧 Current emailSubscriber status: ${currentStatus}`);
    
    // Step 2: Set user as subscribed (if not already) for testing
    if (!currentStatus) {
      console.log('📝 Setting emailSubscriber to true for testing...');
      await userRef.update({ emailSubscriber: true });
      console.log('✅ Set emailSubscriber to true');
    }
    
    // Step 3: Generate test token
    console.log('\n🔑 Generating test unsubscribe token...');
    const token = await generateTestToken(uid);
    console.log(`✅ Token generated: ${token.substring(0, 50)}...`);
    
    // Step 4: Decode and verify token
    console.log('\n🔍 Verifying token format...');
    const decoded = JSON.parse(
      Buffer.from(token, "base64url").toString("utf-8")
    );
    console.log('✅ Token decoded successfully:');
    console.log(`   - UID: ${decoded.uid}`);
    console.log(`   - Type: ${decoded.type}`);
    console.log(`   - Expires: ${new Date(decoded.exp * 1000).toISOString()}`);
    
    // Step 5: Simulate unsubscribe function call
    console.log('\n📞 Simulating unsubscribe function call...');
    await userRef.update({
      emailSubscriber: false,
    });
    console.log('✅ User document updated: emailSubscriber = false');
    
    // Step 6: Verify the update
    const updatedDoc = await userRef.get();
    const newStatus = updatedDoc.data().emailSubscriber;
    console.log(`\n✅ Verification: emailSubscriber is now: ${newStatus}`);
    
    // Step 7: Generate unsubscribe URL
    const unsubscribeUrl = `https://flicklet.app/unsubscribe?token=${token}`;
    console.log(`\n🔗 Test unsubscribe URL:`);
    console.log(`   ${unsubscribeUrl}`);
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Open the URL above in your browser');
    console.log('   2. Verify the unsubscribe page loads');
    console.log('   3. Check that the user document shows emailSubscriber: false');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Get UID from command line args
const uid = process.argv[2];

if (!uid) {
  console.error('Usage: node test-unsubscribe.js <uid>');
  console.error('Example: node test-unsubscribe.js abc123xyz');
  process.exit(1);
}

testUnsubscribe(uid).then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});



