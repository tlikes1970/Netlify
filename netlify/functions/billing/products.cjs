/**
 * Process: Billing Products API
 * Purpose: Return available subscription products for Google Play
 * Data Source: Static product configuration (matches Play Console)
 * Update Path: Update product IDs/prices when changed in Play Console
 * Dependencies: None (static data)
 */

const { validateOrigin } = require('../origin-validation.cjs');

const cors = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

// Product configuration (should match Play Console)
// NOTE: Actual prices come from Google Play Console - these are reference prices only
const PRODUCTS = {
  pro_subscription_monthly: {
    productId: 'pro_subscription_monthly',
    title: 'Flicklet Pro Monthly',
    description: 'Unlock advanced notifications, unlimited lists, bloopers & extras, and more',
    price: '$2.99', // Regular pricing: $2.99/month
    currency: 'USD',
    billingPeriod: 'monthly',
  },
  pro_subscription_yearly: {
    productId: 'pro_subscription_yearly',
    title: 'Flicklet Pro Yearly',
    description: 'Unlock advanced notifications, unlimited lists, bloopers & extras, and more',
    price: '$19.99', // Regular pricing: $19.99/year
    currency: 'USD',
    billingPeriod: 'yearly',
  },
  // Founders pricing (optional limited-time offer)
  // If implementing founders pricing, create separate products in Play Console:
  // - pro_subscription_monthly_founders: $1.99/month
  // - pro_subscription_yearly_founders: $14.99/year
};

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
    const { productIds, productType } = JSON.parse(event.body || '{}');

    if (!productIds || !Array.isArray(productIds)) {
      return {
        statusCode: 400,
        headers: cors(),
        body: JSON.stringify({ error: 'productIds array required' }),
      };
    }

    // Filter products by requested IDs
    const requestedProducts = productIds
      .map((id) => PRODUCTS[id])
      .filter(Boolean);

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


