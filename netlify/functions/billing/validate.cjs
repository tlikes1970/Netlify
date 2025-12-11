/**
 * Process: Purchase Validation
 * Purpose: Validate Google Play purchase token and update Firestore billing status
 * Data Source: Google Play Developer API, Firestore
 * Update Path: Called after successful purchase
 * Dependencies: Firebase Admin, Google Play Developer API credentials
 */

const { validateOrigin } = require('../origin-validation.cjs');

// Initialize Firebase Admin (lazy load)
let admin = null;
function getAdmin() {
  if (!admin) {
    try {
      admin = require('firebase-admin');
      if (!admin.apps.length) {
        // Initialize with service account or default credentials
        // For Netlify, use environment variables or service account JSON
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : null;

        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } else {
          // Use default credentials (GCP/Netlify environment)
          admin.initializeApp();
        }
      }
    } catch (error) {
      console.error('[Billing Validate] Firebase Admin init error:', error);
      throw error;
    }
  }
  return admin;
}

const cors = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

/**
 * Validate Google Play purchase token
 * TODO: Implement actual Google Play Developer API validation
 * See: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/get
 */
async function validateGooglePlayPurchase(purchaseToken, productId, packageName) {
  // TODO: Implement real validation using Google Play Developer API
  // For now, return true (will be implemented with service account credentials)
  
  // Real implementation would:
  // 1. Use Google Auth Library to get access token
  // 2. Call Google Play Developer API: GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/subscriptions/{productId}/tokens/{token}
  // 3. Check purchaseState, expiryTimeMillis, etc.
  // 4. Return validation result
  
  console.log('[Billing Validate] Purchase validation (placeholder):', {
    purchaseToken: purchaseToken.substring(0, 20) + '...',
    productId,
    packageName,
  });
  
  // Placeholder: return true for now
  // TODO: Replace with actual Google Play API validation
  return {
    isValid: true,
    expiryTimeMillis: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    purchaseState: 0, // 0 = purchased
  };
}

exports.handler = async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }

  // Validate origin
  const originCheck = validateOrigin(event);
  if (!originCheck.allowed) {
    return {
      statusCode: 403,
      headers: cors(),
      body: JSON.stringify({
        error: 'origin-rejected',
        origin: originCheck.origin || null,
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: cors(),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { purchaseToken, platform, productId, userId } = JSON.parse(event.body || '{}');

    if (!purchaseToken || !platform || !productId || !userId) {
      return {
        statusCode: 400,
        headers: cors(),
        body: JSON.stringify({
          error: 'Missing required fields',
          required: ['purchaseToken', 'platform', 'productId', 'userId'],
        }),
      };
    }

    if (platform !== 'android') {
      return {
        statusCode: 400,
        headers: cors(),
        body: JSON.stringify({ error: 'Only Android platform supported currently' }),
      };
    }

    // Validate purchase with Google Play
    const packageName = 'com.TravisL.tvtracker'; // From AndroidManifest.xml
    const validation = await validateGooglePlayPurchase(purchaseToken, productId, packageName);

    if (!validation.isValid) {
      return {
        statusCode: 400,
        headers: cors(),
        body: JSON.stringify({
          isValid: false,
          error: 'Invalid purchase',
        }),
      };
    }

    // Update Firestore billing status
    const admin = getAdmin();
    const db = admin.firestore();
    
    // Calculate period end based on product type
    let periodEndMillis = validation.expiryTimeMillis;
    if (!periodEndMillis) {
      // Fallback: calculate from product ID
      const isYearly = productId.includes('yearly');
      const periodDays = isYearly ? 365 : 30;
      periodEndMillis = Date.now() + periodDays * 24 * 60 * 60 * 1000;
    }

    await db
      .collection('users')
      .doc(userId)
      .collection('billing')
      .doc('status')
      .set(
        {
          isPro: true,
          source: 'android',
          currentPeriodEnd: admin.firestore.Timestamp.fromMillis(periodEndMillis),
          cancelAtPeriodEnd: false,
          productId,
          purchaseToken,
          validatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    console.log('[Billing Validate] Purchase validated and activated for user:', userId);

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({
        isValid: true,
        userId,
        productId,
      }),
    };
  } catch (error) {
    console.error('[Billing Validate] Error:', error);
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};


