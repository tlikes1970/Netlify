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

function isMobile() {
  try { return matchMedia('(max-width: 768px)').matches; } catch { return true; }
}

export function ensureCompactAttr() {
  const html = document.documentElement;
  const on =
    flag('mobile_compact_v1') === true &&
    isMobile() &&
    html.dataset.density === 'compact';
  if (on) html.dataset.compactMobileV1 = 'true';
  else delete html.dataset.compactMobileV1;
}

document.addEventListener('DOMContentLoaded', ensureCompactAttr);
document.addEventListener('visibilitychange', ensureCompactAttr);
window.addEventListener('resize', ensureCompactAttr);
window.addEventListener('storage', (e) => {
  if (e.key === 'flag:mobile_compact_v1') ensureCompactAttr();
});

// Available flags:
// flag('mobile_compact_v1') // default OFF