/**
 * Feature Flags System
 * Purpose: Centralized feature flag management for mobile compact migration
 * Usage: flag('mobile_compact_v1') // default OFF
 */

export const flag = (name) => {
  try { 
    const v = localStorage.getItem('flag:'+name); 
    if (v !== null) return v === 'true'; 
  } catch {}
  return false;
};

// Available flags:
// flag('mobile_compact_v1') // default OFF
