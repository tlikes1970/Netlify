/**
 * Full Access purchase entrypoint (Google Play one-time INAPP on Android).
 */

import { auth } from './firebaseBootstrap';
import { apiUrl } from './apiConfig';
import { clearBillingCache } from './proStatus';
import {
  FULL_ACCESS_PRODUCT_ID,
  FULL_ACCESS_PRODUCT_TYPE,
  FULL_ACCESS_PURCHASE_SUCCESS_MESSAGE,
} from './billingProducts';

function getCapacitor(): any {
  if (typeof window === 'undefined') return null;
  if ((window as any).Capacitor) {
    return (window as any).Capacitor;
  }
  return null;
}

/** Start Full Access purchase flow (Android: Play Billing one-time product). */
export async function startProUpgrade(): Promise<void> {
  console.log('[Full Access] startProUpgrade() called');

  const Capacitor = getCapacitor();
  const platform = Capacitor?.getPlatform() || 'web';

  if (!auth.currentUser) {
    console.log('[Full Access] User not authenticated, opening auth flow');
    window.dispatchEvent(new CustomEvent('auth:sign-in-required'));
    return;
  }

  if (platform === 'android') {
    await startAndroidPurchase();
  } else if (platform === 'ios') {
    await startIOSPurchase();
  } else {
    await startWebPurchase();
  }
}

async function startAndroidPurchase(): Promise<void> {
  try {
    console.log('[Full Access] Starting Android one-time purchase');

    const CapacitorGlobal = (window as any).Capacitor;
    if (!CapacitorGlobal?.Plugins?.Billing) {
      throw new Error(
        'Billing plugin not available. Rebuild the Android app after cap sync.'
      );
    }

    const Billing = CapacitorGlobal.Plugins.Billing;

    await Billing.initialize();

    const productsResult = await Billing.getProducts({
      productIds: [FULL_ACCESS_PRODUCT_ID],
      productType: FULL_ACCESS_PRODUCT_TYPE,
    });

    if (!productsResult.products?.length) {
      throw new Error(
        `Product "${FULL_ACCESS_PRODUCT_ID}" not found. Create the INAPP product in Play Console.`
      );
    }

    const selectedProduct =
      productsResult.products.find(
        (p: { productId: string }) => p.productId === FULL_ACCESS_PRODUCT_ID
      ) || productsResult.products[0];

    console.log('[Full Access] Launching purchase for:', selectedProduct.productId);

    const purchaseResult = await Billing.purchase({
      productId: selectedProduct.productId,
      productType: FULL_ACCESS_PRODUCT_TYPE,
    });

    if (purchaseResult.purchaseToken) {
      await validateAndActivatePurchase(
        purchaseResult.purchaseToken,
        'android',
        selectedProduct.productId
      );
    } else {
      throw new Error('Purchase failed: No purchase token returned');
    }
  } catch (error) {
    console.error('[Full Access] Android purchase failed:', error);

    window.dispatchEvent(
      new CustomEvent('pro-upgrade-error', {
        detail: {
          message: error instanceof Error ? error.message : 'Purchase failed',
          error: error instanceof Error ? error.stack : String(error),
        },
      })
    );

    throw error;
  }
}

async function startIOSPurchase(): Promise<void> {
  console.log('[Full Access] iOS purchase (not implemented yet)');
  window.dispatchEvent(
    new CustomEvent('settings:open-page', { detail: { section: 'pro' as const } })
  );
}

async function startWebPurchase(): Promise<void> {
  console.log('[Full Access] Web purchase (not implemented yet)');
  window.dispatchEvent(
    new CustomEvent('settings:open-page', { detail: { section: 'pro' as const } })
  );
}

async function validateAndActivatePurchase(
  purchaseToken: string,
  platform: 'android' | 'ios',
  productId: string
): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(apiUrl('/api/billing/validate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      purchaseToken,
      platform,
      productId,
      userId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Validation failed');
  }

  const validationData = await response.json();

  if (validationData.isValid) {
    clearBillingCache();

    window.dispatchEvent(
      new CustomEvent('pro-upgrade-success', {
        detail: {
          productId,
          platform,
          purchaseType: 'one_time',
          message: FULL_ACCESS_PURCHASE_SUCCESS_MESSAGE,
        },
      })
    );

    console.log(`[Full Access] ${FULL_ACCESS_PURCHASE_SUCCESS_MESSAGE}`);
  } else {
    throw new Error('Purchase validation failed');
  }
}
