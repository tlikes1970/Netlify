/**
 * Process: Pro Status Helper
 * Purpose: Centralized Pro status resolution (settings + billing)
 * Data Source: settingsManager, billing status from Firestore
 * Update Path: Settings changes, billing updates
 * Dependencies: settings, billing
 */

import { useState, useEffect } from 'react';
import { settingsManager } from './settings';
import { getBillingStatus } from './billing';

export interface ProStatus {
  isPro: boolean;
  source: 'alpha' | 'gift' | 'stripe' | 'ios' | 'android' | 'manual' | null;
}

// Cache for billing status to avoid repeated Firestore reads
let billingCache: { isPro: boolean; source: string | null; expiresAt: number } | null = null;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Get Pro status for non-React usage
 * Resolves Pro status from billing (takes precedence) and settings (fallback)
 */
export async function getProStatus(): Promise<ProStatus> {
  const settings = settingsManager.getSettings();
  
  // Check cache first
  const now = Date.now();
  if (billingCache && billingCache.expiresAt > now) {
    // Use cached billing status (alpha toggle removed)
    return { 
      isPro: billingCache.isPro, 
      source: billingCache.source 
    };
  }
  
  // Get billing status from Firestore
  const billing = await getBillingStatus();
  
  // Cache the result
  billingCache = {
    isPro: billing.isPro,
    source: billing.source,
    expiresAt: now + CACHE_DURATION,
  };
  
  // Check if subscription is still valid
  if (billing.isPro && billing.currentPeriodEnd) {
    const periodEnd = billing.currentPeriodEnd.toDate();
    if (periodEnd > new Date()) {
      // Subscription is valid
      return {
        isPro: true,
        source: billing.source || 'android',
      };
    }
  }
  
  // Only billing-based Pro status (alpha toggle removed)
  return {
    isPro: billing.isPro,
    source: billing.source,
  };
}

/**
 * Clear billing cache (call after purchase or status update)
 */
export function clearBillingCache(): void {
  billingCache = null;
}

/**
 * React hook for Pro status
 * Automatically updates when settings change
 * Note: Billing status is cached and refreshed periodically
 */
export function useProStatus(): ProStatus {
  const [proStatus, setProStatus] = useState<ProStatus>({ isPro: false, source: null });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    // Initial load
    getProStatus().then((status) => {
      if (mounted) {
        setProStatus(status);
        setIsLoading(false);
      }
    });
    
    // Subscribe to settings changes
    const unsubscribe = settingsManager.subscribe(() => {
      if (mounted) {
        getProStatus().then((status) => {
          if (mounted) {
            setProStatus(status);
          }
        });
      }
    });
    
    // Refresh billing status periodically
    const interval = setInterval(() => {
      if (mounted) {
        billingCache = null; // Clear cache
        getProStatus().then((status) => {
          if (mounted) {
            setProStatus(status);
          }
        });
      }
    }, CACHE_DURATION);
    
    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  return proStatus;
}

