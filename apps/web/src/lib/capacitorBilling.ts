/**
 * Process: Capacitor Billing Bridge
 * Purpose: Bridge interface for Google Play Billing API via Capacitor
 * Data Source: Native Android BillingClient
 * Update Path: Purchase flow initiated by user
 * Dependencies: Capacitor native bridge, Android BillingClient
 */

// Capacitor is only available in mobile builds - use conditional access
function getCapacitor(): any {
  if (typeof window === 'undefined') return null;
  // Check if Capacitor is available via window (mobile builds)
  if ((window as any).Capacitor) {
    return (window as any).Capacitor;
  }
  return null;
}

interface Product {
  productId: string;
  price: string;
  title: string;
  description: string;
  currency: string;
}

interface PurchaseResult {
  transactionReceipt: string;
  productId: string;
  purchaseToken: string;
}

interface Purchase {
  productId: string;
  transactionReceipt: string;
  purchaseToken: string;
}

/**
 * Initialize billing plugin
 * Attempts to load the plugin if available
 */
export async function initializeBilling(): Promise<boolean> {
  const Capacitor = getCapacitor();
  if (!Capacitor || Capacitor.getPlatform() !== 'android') {
    console.log('[Billing] Not Android platform, billing not available');
    return false;
  }

  try {
    // Check if native bridge is available
    if (typeof (window as any).Capacitor !== 'undefined') {
      // Plugin will be registered here when created
      // For now, return false to use backend API approach
      console.log('[Billing] Native plugin not yet implemented, using backend API');
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('[Billing] Error initializing billing:', error);
    return false;
  }
}

/**
 * Get available products from Google Play
 */
export async function getProducts(productIds: string[]): Promise<Product[]> {
  const Capacitor = getCapacitor();
  if (!Capacitor || Capacitor.getPlatform() !== 'android') {
    return [];
  }

  // For now, use backend API to get products
  // This will be replaced with native plugin when available
  try {
    const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim() || '';
    const response = await fetch(`${API_BASE}/api/billing/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.products || [];
    }
  } catch (error) {
    console.error('[Billing] Error fetching products:', error);
  }

  return [];
}

/**
 * Launch purchase flow
 */
export async function launchPurchase(productId: string, productType: 'subscription' = 'subscription'): Promise<PurchaseResult | null> {
  const Capacitor = getCapacitor();
  if (!Capacitor || Capacitor.getPlatform() !== 'android') {
    console.log('[Billing] Not Android platform, purchase not available');
    return null;
  }

  try {
    // Use backend API to initiate purchase
    // Backend will handle Google Play Billing API calls
    const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim() || '';
    const response = await fetch(`${API_BASE}/api/billing/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, productType }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        transactionReceipt: data.purchaseToken || data.transactionReceipt,
        productId: data.productId || productId,
        purchaseToken: data.purchaseToken || data.transactionReceipt,
      };
    } else {
      const error = await response.json();
      console.error('[Billing] Purchase failed:', error);
      throw new Error(error.message || 'Purchase failed');
    }
  } catch (error) {
    console.error('[Billing] Error launching purchase:', error);
    throw error;
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<Purchase[]> {
  const Capacitor = getCapacitor();
  if (!Capacitor || Capacitor.getPlatform() !== 'android') {
    return [];
  }

  try {
    const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim() || '';
    const response = await fetch(`${API_BASE}/api/billing/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      return data.purchases || [];
    }
  } catch (error) {
    console.error('[Billing] Error restoring purchases:', error);
  }

  return [];
}


