/**
 * Process: Billing Products API
 * Purpose: Return available one-time Full Access product metadata
 * Data Source: Static product configuration (must match Play Console INAPP product)
 */

const { validateOrigin } = require('../origin-validation.cjs');

/** Must match apps/web/src/lib/billingProducts.ts and Play Console */
const FULL_ACCESS_PRODUCT_ID = 'flicklet_full_access';

const cors = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

const PRODUCTS = {
  [FULL_ACCESS_PRODUCT_ID]: {
    productId: FULL_ACCESS_PRODUCT_ID,
    title: 'Flicklet Full Access',
    description:
      'One-time unlock for tracking, reminders, editing, Shows Like This, and Extras. No subscription.',
    price: '$4.99',
    currency: 'USD',
    purchaseType: 'one_time',
  },
};

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
    const { productIds } = JSON.parse(event.body || '{}');

    if (!productIds || !Array.isArray(productIds)) {
      return {
        statusCode: 400,
        headers: cors(),
        body: JSON.stringify({ error: 'productIds array required' }),
      };
    }

    const requestedProducts = productIds.map((id) => PRODUCTS[id]).filter(Boolean);

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({
        products: requestedProducts,
      }),
    };
  } catch (error) {
    console.error('[Billing Products] Error:', error);
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
