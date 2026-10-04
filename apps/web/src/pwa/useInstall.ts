/**
 * React hook for PWA install state
 *
 * Uses useSyncExternalStore to subscribe to install state changes
 * with availability derived from the current usable browser event.
 */

import { useSyncExternalStore } from "react";
import { getCanInstall, onInstallChange } from "./installSignal";

export function useCanInstallPWA() {
  return useSyncExternalStore(onInstallChange, getCanInstall, getCanInstall);
}
