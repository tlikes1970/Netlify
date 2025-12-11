/**
 * Process: Purchase Initiation
 * Purpose: Handle purchase initiation (placeholder - actual purchase happens on Android)
 * Data Source: Android BillingClient (native)
 * Update Path: Called by Android app to initiate purchase
 * Dependencies: Android native BillingClient
 * 
 * NOTE: Google Play purchases MUST be initiated from Android app using BillingClient.
 * This endpoint is a placeholder for future native plugin integration.
 * For now, returns instructions for native implementation.
 */

const { validateOrigin } = require('../origin-validation.cjs');

const cors = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

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
    const { productId, productType, userId } = JSON.parse(event.body || '{}');

    // NOTE: Google Play purchases must be initiated from Android app
    // This endpoint is a placeholder
    // The actual purchase flow should:
    // 1. Use Android BillingClient in native code
    // 2. Call launchBillingFlow() on Android
    // 3. Handle purchase result in Android
    // 4. Send purchase token to /api/billing/validate
    
    return {
      statusCode: 501, // Not Implemented
      headers: cors(),
      body: JSON.stringify({
        error: 'Purchase must be initiated from Android app',
        message: 'Google Play purchases require native Android BillingClient. See implementation guide.',
        productId,
        productType,
      }),
    };
  } catch (error) {
    console.error('[Billing Purchase] Error:', error);
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


