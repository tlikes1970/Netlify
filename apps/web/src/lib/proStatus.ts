/**
 * Process: Pro Status Helper
 * Purpose: Centralized Pro status resolution (settings + billing)
 * Data Source: settingsManager, billing status (future)
 * Update Path: Settings changes, billing updates (future)
 * Dependencies: settings, billing (future)
 */

import { useState, useEffect } from 'react';
import { settingsManager } from './settings';
import { getBillingStatus } from './billing';

export interface ProStatus {
  isPro: boolean;
  source: 'alpha' | 'gift' | 'stripe' | 'ios' | 'android' | 'manual' | null;
}

/**
 * Get Pro status for non-React usage
 * Resolves Pro status from settings and billing (when available)
 */
export function getProStatus(): ProStatus {
  const settings = settingsManager.getSettings();
  const billing = getBillingStatus(); // Placeholder for now
  
  // For now: settings.pro.isPro takes precedence, billing will be integrated later
  // When billing is integrated: isPro = settings.pro.isPro || billing.isPro
  const isPro = settings.pro.isPro || billing.isPro;
  
  // Determine source: billing source takes precedence, fallback to 'alpha' if settings-based
  const source = billing.source ?? (settings.pro.isPro ? 'alpha' : null);
  
  return {
    isPro,
    source,
  };
}

/**
 * React hook for Pro status
 * Automatically updates when settings change
 */
export function useProStatus(): ProStatus {
  const [proStatus, setProStatus] = useState(() => getProStatus());
  
  useEffect(() => {
    // Subscribe to settings changes
    const unsubscribe = settingsManager.subscribe(() => {
      setProStatus(getProStatus());
    });
    
    return unsubscribe;
  }, []);
  
  return proStatus;
}

