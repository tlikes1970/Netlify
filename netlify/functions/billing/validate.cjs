/**
 * Process: Purchase Validation
 * Purpose: Validate Google Play one-time purchase token and grant Full Access in Firestore
 * Data Source: Google Play Developer API (TODO), Firestore
 *
 * Real validation plug-in point:
 *   GET .../purchases/products/{productId}/tokens/{token}
 *   See: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/get
 */

const { validateOrigin } = require('../origin-validation.cjs');

/** Must match Play Console and apps/web/src/lib/billingProducts.ts */
const FULL_ACCESS_PRODUCT_ID = 'flicklet_full_access';

/** Far-future end for one-time unlock (client treats isPro + periodEnd > now as Full Access). */
const PERMANENT_PERIOD_END_MS = new Date('2099-12-31T23:59:59.999Z').getTime();

let admin = null;
function getAdmin() {
  if (!admin) {
    try {
      admin = require('firebase-admin');
      if (!admin.apps.length) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : null;

        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } else {
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
 * Placeholder until Google Play Developer API is wired.
 * Must be replaced before production — do not ship fraud-sensitive unlock on stub alone.
 */
async function validateGooglePlayProductPurchase(purchaseToken, productId, packageName) {
  if (productId !== FULL_ACCESS_PRODUCT_ID) {
    console.warn('[Billing Validate] Unexpected productId:', productId);
    return { isValid: false, purchaseState: 1 };
  }

  console.log('[Billing Validate] Product purchase validation (placeholder):', {
    purchaseToken: purchaseToken.substring(0, 20) + '...',
    productId,
    packageName,
  });

  // TODO: Call androidpublisher purchases.products.get and verify purchaseState === 0
  return {
    isValid: true,
    purchaseState: 0,
    purchaseType: 'one_time',
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }

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

    const packageName = 'com.TravisL.tvtracker';
    const validation = await validateGooglePlayProductPurchase(
      purchaseToken,
      productId,
      packageName
    );

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

    const adminInstance = getAdmin();
    const db = adminInstance.firestore();

    await db
      .collection('users')
      .doc(userId)
      .collection('billing')
      .doc('status')
      .set(
        {
          isPro: true,
          source: 'android',
          purchaseType: 'one_time',
          currentPeriodEnd: adminInstance.firestore.Timestamp.fromMillis(
            PERMANENT_PERIOD_END_MS
          ),
          cancelAtPeriodEnd: false,
          productId,
          purchaseToken,
          validatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    console.log('[Billing Validate] One-time Full Access activated for user:', userId);

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({
        isValid: true,
        userId,
        productId,
        purchaseType: 'one_time',
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
