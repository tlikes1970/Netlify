/**
 * React hook for PWA install state
 * 
 * Uses useSyncExternalStore to subscribe to install state changes
 * while maintaining stable state throughout the session.
 */

import { useSyncExternalStore } from 'react';
import { getCanInstall, onInstallChange } from './installSignal';

export function useCanInstallPWA() {
  return useSyncExternalStore(onInstallChange, getCanInstall, getCanInstall);
}










