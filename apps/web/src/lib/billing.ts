/**
 * Process: Billing Status
 * Purpose: Billing information structure (skeleton for future payment integration)
 * Data Source: Firestore users/{uid}/billing/status (future)
 * Update Path: Payment provider webhooks, manual admin updates (future)
 * Dependencies: Firebase (future)
 */

import { Timestamp } from 'firebase/firestore';

export interface BillingStatus {
  isPro: boolean;
  source: 'alpha' | 'gift' | 'stripe' | 'ios' | 'android' | 'manual' | null;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Get billing status for a user
 * 
 * TODO: When payment integration is added:
 * - Read from Firestore: users/{uid}/billing/status
 * - Check subscription validity (currentPeriodEnd > now)
 * - Return actual billing data
 * 
 * For now, returns default (no active billing)
 */
export function getBillingStatus(_uid?: string): BillingStatus {
  // Placeholder implementation
  // When Stripe/App Store integration is added, this will:
  // 1. Read from Firestore users/{uid}/billing/status
  // 2. Check subscription validity
  // 3. Return actual billing data
  
  return {
    isPro: false,
    source: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

/**
 * Update billing status (for future use)
 * 
 * TODO: When payment integration is added:
 * - Write to Firestore: users/{uid}/billing/status
 * - Called by webhook handlers or admin functions
 */
export async function updateBillingStatus(
  uid: string,
  status: Partial<BillingStatus>
): Promise<void> {
  // Placeholder implementation
  // When payment integration is added, this will write to Firestore
  console.log('[Billing] Update billing status (not implemented yet):', { uid, status });
}

