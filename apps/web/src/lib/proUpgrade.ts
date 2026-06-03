/**
 * Process: Pro Upgrade Entrypoint
 * Purpose: Centralized entrypoint for Pro upgrade flow
 * Data Source: Settings navigation, payment providers
 * Update Path: User clicks "Upgrade to Pro" buttons
 * Dependencies: Settings navigation, payment providers, Capacitor
 */

import { auth } from './firebaseBootstrap';
import { apiUrl } from './apiConfig';
import { clearBillingCache } from './proStatus';

// Capacitor is only available in mobile builds - use conditional access
function getCapacitor(): any {
  if (typeof window === 'undefined') return null;
  // Check if Capacitor is available via window (mobile builds)
  if ((window as any).Capacitor) {
    return (window as any).Capacitor;
  }
  return null;
}

/**
 * Start Pro upgrade flow
 * 
 * Platform-specific:
 * - Android: Google Play Billing API (via backend)
 * - iOS: App Store in-app purchases (future)
 * - Web: Stripe checkout (future)
 * - Fallback: Alpha/testing toggle in Settings
 */
export async function startProUpgrade(): Promise<void> {
  console.log('[Pro Upgrade] startProUpgrade() called');
  
  const Capacitor = getCapacitor();
  const platform = Capacitor?.getPlatform() || 'web';
  
  // Check if user is authenticated (required for purchases)
  if (!auth.currentUser) {
    console.log('[Pro Upgrade] User not authenticated, opening auth flow');
    // Trigger auth flow - you may want to show a message or open auth modal
    const authEvent = new CustomEvent('auth:sign-in-required');
    window.dispatchEvent(authEvent);
    return;
  }
  
  // Launch purchase flow based on platform
  if (platform === 'android') {
    await startAndroidPurchase();
  } else if (platform === 'ios') {
    await startIOSPurchase();
  } else {
    // Web/Desktop - Stripe checkout (future)
    await startWebPurchase();
  }
}

/**
 * Android: Google Play Billing purchase flow
 * Uses Capacitor plugin to access native BillingClient
 */
async function startAndroidPurchase(): Promise<void> {
  try {
    console.log('[Pro Upgrade] Starting Android purchase flow');
    
    // Access Capacitor plugin via window.Capacitor
    const CapacitorGlobal = (window as any).Capacitor;
    if (!CapacitorGlobal || !CapacitorGlobal.Plugins) {
      throw new Error('Capacitor plugins not available. Make sure the native plugin is installed.');
    }
    
    const Billing = CapacitorGlobal.Plugins.Billing;
    if (!Billing) {
      throw new Error('Billing plugin not available. Make sure the native plugin is installed.');
    }
    
    // Initialize billing
    await Billing.initialize();
    
    // Get available products
    const productsResult = await Billing.getProducts({
      productIds: ['pro_subscription_monthly', 'pro_subscription_yearly'],
      productType: 'subscription',
    });
    
    if (!productsResult.products || productsResult.products.length === 0) {
      throw new Error('No products available');
    }
    
    // For now, default to monthly subscription
    // TODO: Show product selection UI
    const selectedProduct = productsResult.products.find(
      (p: any) => p.productId === 'pro_subscription_monthly'
    ) || productsResult.products[0];
    
    console.log('[Pro Upgrade] Launching purchase for:', selectedProduct.productId);
    
    // Launch purchase flow
    const purchaseResult = await Billing.purchase({
      productId: selectedProduct.productId,
      productType: 'subscription',
    });
    
    if (purchaseResult.purchaseToken) {
      // Purchase successful - validate and activate
      await validateAndActivatePurchase(
        purchaseResult.purchaseToken,
        'android',
        selectedProduct.productId
      );
    } else {
      throw new Error('Purchase failed: No purchase token returned');
    }
    
  } catch (error) {
    console.error('[Pro Upgrade] Android purchase failed:', error);
    
    // Show error to user
    const errorEvent = new CustomEvent('pro-upgrade-error', {
      detail: { 
        message: error instanceof Error ? error.message : 'Purchase failed',
        error: error instanceof Error ? error.stack : String(error),
      },
    });
    window.dispatchEvent(errorEvent);
    
    // Re-throw so caller can handle
    throw error;
  }
}

/**
 * iOS: App Store purchase flow
 */
async function startIOSPurchase(): Promise<void> {
  // TODO: Implement iOS purchase flow when iOS app is ready
  console.log('[Pro Upgrade] iOS purchase (not implemented yet)');
  window.dispatchEvent(
    new CustomEvent('settings:open-page', { detail: { section: 'pro' as const } })
  );
}

/**
 * Web: Stripe checkout flow
 */
async function startWebPurchase(): Promise<void> {
  // TODO: Implement Stripe checkout flow
  console.log('[Pro Upgrade] Web purchase (not implemented yet)');
  window.dispatchEvent(
    new CustomEvent('settings:open-page', { detail: { section: 'pro' as const } })
  );
}

/**
 * Validate purchase receipt and activate Pro status
 * Calls backend to validate, then updates Firestore
 */
async function validateAndActivatePurchase(
  purchaseToken: string,
  platform: 'android' | 'ios',
  productId: string
): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  try {
    // Call backend to validate purchase
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
      const error = await response.json();
      throw new Error(error.message || 'Validation failed');
    }
    
    const validationData = await response.json();
    
    if (validationData.isValid) {
      // Backend has updated Firestore billing status
      // Clear cache to force refresh
      clearBillingCache();
      
      // Trigger Pro status refresh event
      const successEvent = new CustomEvent('pro-upgrade-success', {
        detail: { productId, platform },
      });
      window.dispatchEvent(successEvent);
      
      console.log('[Pro Upgrade] Purchase validated and activated');
    } else {
      throw new Error('Purchase validation failed');
    }
  } catch (error) {
    console.error('[Pro Upgrade] Purchase validation error:', error);
    throw error;
  }
}

