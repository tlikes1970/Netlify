/**
 * Google Play product configuration — one-time Full Access (INAPP).
 * Must match Play Console product ID exactly.
 */

/** Managed in-app product (non-consumable one-time unlock). */
export const FULL_ACCESS_PRODUCT_ID = 'flicklet_full_access';

export const FULL_ACCESS_PRODUCT_TYPE = 'inapp' as const;

/** Shown after successful purchase + server validation. */
export const FULL_ACCESS_PURCHASE_SUCCESS_MESSAGE =
  'Purchase confirmed. Full Access unlocked.';
