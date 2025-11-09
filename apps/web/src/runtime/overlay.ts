/**
 * Process: Dev Kill Switch Overlay
 * Purpose: Visual indicator of subsystem kill switch states (dev only)
 * Data Source: runtime/switches.ts getAllSwitchStates()
 * Update Path: Updates on localStorage change events
 * Dependencies: runtime/switches.ts
 */

import { getAllSwitchStates } from './switches';

let overlayElement: HTMLElement | null = null;

function createOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'kill-switch-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    padding: 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    z-index: 99999;
    max-width: 300px;
    line-height: 1.6;
    pointer-events: none;
  `;
  return overlay;
}

function updateOverlay() {
  if (!overlayElement) return;
  
  const states = getAllSwitchStates();
  const switchNames: Record<string, string> = {
    isw: 'SW',
    iauth: 'Auth',
    ifire: 'Firestore',
    iapiclient: 'API',
    imsg: 'FCM',
    ircfg: 'Remote Config',
    ianalytics: 'Analytics',
    iprefetch: 'Prefetch',
    ifonts: 'Fonts'
  };
  
  const lines = ['🔌 Kill Switches:'];
  for (const [key, name] of Object.entries(switchNames)) {
    const isOff = states[key];
    const status = isOff ? '❌ OFF' : '✅ ON';
    lines.push(`${name.padEnd(12)} ${status}`);
  }
  
  overlayElement.textContent = lines.join('\n');
}

export function installKillSwitchOverlay() {
  if (typeof window === 'undefined') return;
  
  // Only in dev mode
  if (import.meta.env.PROD) return;
  
  // Create overlay
  overlayElement = createOverlay();
  document.body.appendChild(overlayElement);
  
  // Initial update
  updateOverlay();
  
  // Update on localStorage changes
  window.addEventListener('storage', updateOverlay);
  
  // Also listen for direct localStorage writes (same-origin)
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key: string, value: string) {
    originalSetItem.call(this, key, value);
    if (key.endsWith(':off')) {
      updateOverlay();
    }
  };
  
  // Poll for changes (fallback for same-origin writes)
  setInterval(updateOverlay, 1000);
}

