/**
 * Blocks library/settings mutations when trial expired (read-only mode).
 */

import type { SettingsSectionId } from '../components/settingsConfig';
import { getEntitlementsSync } from './entitlements';

export const READ_ONLY_TOAST =
  'Your trial has ended. Your library is read-only — export your data or upgrade to keep editing.';

export function isMutationBlocked(): boolean {
  return getEntitlementsSync().isReadOnlyMode;
}

/** Opens Settings on the Pro / purchase section (desktop modal or mobile sheet). */
export function openProPurchaseSettings(): void {
  window.dispatchEvent(
    new CustomEvent('settings:open-page', {
      detail: { section: 'pro' as SettingsSectionId },
    })
  );
}

/**
 * When read-only, navigate to Pro settings instead of a dismissible toast.
 * Returns true if the action was blocked.
 */
export function notifyReadOnlyBlocked(): boolean {
  if (!isMutationBlocked()) return false;
  openProPurchaseSettings();
  return true;
}

/** Returns true if the mutation may proceed. */
export function guardMutation(): boolean {
  if (notifyReadOnlyBlocked()) return false;
  return true;
}

export function openUpgradeFromReadOnly(): void {
  openProPurchaseSettings();
}
