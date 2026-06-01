/**
 * Blocks library/settings mutations when trial expired (read-only mode).
 */

import { getEntitlementsSync } from './entitlements';
import { getToastCallback } from '../state/actions';
import { startProUpgrade } from './proUpgrade';

export const READ_ONLY_TOAST =
  'Your trial has ended. Your library is read-only — export your data or upgrade to keep editing.';

export function isMutationBlocked(): boolean {
  return getEntitlementsSync().isReadOnlyMode;
}

export function notifyReadOnlyBlocked(): boolean {
  if (!isMutationBlocked()) return false;
  getToastCallback()?.(READ_ONLY_TOAST, 'info');
  return true;
}

/** Returns true if the mutation may proceed. */
export function guardMutation(): boolean {
  if (notifyReadOnlyBlocked()) return false;
  return true;
}

export function openUpgradeFromReadOnly(): void {
  void startProUpgrade();
}
