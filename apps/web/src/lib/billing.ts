/**
 * Process: Billing Status
 * Purpose: Billing information structure and Firestore integration
 * Data Source: Firestore users/{uid}/billing/status
 * Update Path: Payment provider webhooks, purchase validation, manual admin updates
 * Dependencies: Firebase Firestore
 */

import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebaseBootstrap';

export interface BillingStatus {
  isPro: boolean;
  source: 'alpha' | 'gift' | 'stripe' | 'ios' | 'android' | 'manual' | null;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;
  productId?: string;
  purchaseToken?: string;
}

/**
 * Get billing status for current user
 * Reads from Firestore: users/{uid}/billing/status
 */
export async function getBillingStatus(uid?: string): Promise<BillingStatus> {
  const userId = uid || auth.currentUser?.uid;
  
  if (!userId) {
    return {
      isPro: false,
      source: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }
  
  try {
    const billingDoc = await getDoc(doc(db, 'users', userId, 'billing', 'status'));
    
    if (billingDoc.exists()) {
      const data = billingDoc.data();
      return {
        isPro: data.isPro || false,
        source: data.source || null,
        currentPeriodEnd: data.currentPeriodEnd || null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        productId: data.productId,
        purchaseToken: data.purchaseToken,
      };
    }
  } catch (error) {
    console.error('[Billing] Error reading billing status:', error);
  }
  
  return {
    isPro: false,
    source: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

/**
 * Update billing status
 * Writes to Firestore: users/{uid}/billing/status
 * Called by backend webhooks, purchase validation, or admin functions
 */
export async function updateBillingStatus(
  uid: string,
  status: Partial<BillingStatus>
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'users', uid, 'billing', 'status'),
      {
        ...status,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
    console.log('[Billing] Billing status updated:', { uid, status });
  } catch (error) {
    console.error('[Billing] Error updating billing status:', error);
    throw error;
  }
}

