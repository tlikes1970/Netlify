import type { AccountLanguageStrings } from "../i18n/accountTranslations";
export type AccountMessageKey = keyof AccountLanguageStrings;
function details(cause: unknown): { code: string; message: string } {
  const value = cause as { code?: unknown; message?: unknown } | null;
  return { code: typeof value?.code === "string" ? value.code : "", message: typeof value?.message === "string" ? value.message : "" };
}
/** Firebase Auth codes from the current email/OAuth paths; never display provider messages. */
export function authErrorKey(cause: unknown, creating = false): AccountMessageKey {
  const { code } = details(cause);
  const known: Record<string, AccountMessageKey> = {
    "auth/invalid-email": "accountInvalidEmail",
    "auth/invalid-credential": "accountCredentials", "auth/wrong-password": "accountCredentials", "auth/user-not-found": "accountCredentials",
    "auth/email-already-in-use": "accountExists", "auth/weak-password": "accountPasswordLength",
    "auth/network-request-failed": "accountNetwork", "auth/popup-closed-by-user": "accountCancelled", "auth/cancelled-popup-request": "accountCancelled",
    "auth/popup-blocked": "accountUnavailable", "auth/operation-not-allowed": "accountUnavailable", "auth/unauthorized-domain": "accountUnavailable",
    "auth/too-many-requests": "accountAttempts", "auth/user-disabled": "accountDisabled", "auth/account-exists-with-different-credential": "accountProviderConflict",
  };
  return known[code] ?? (creating ? "accountCreateError" : "accountError");
}
/** Current preferred-name validation errors have no codes. Match only exact app-owned messages. */
export function profileErrorKey(cause: unknown): AccountMessageKey {
  const { message } = details(cause);
  const known: Record<string, AccountMessageKey> = {
    "Please enter a preferred name.": "profileRequired", "Please use 100 characters or fewer.": "profileLength",
    "Please sign in to save your preferred name.": "profileSignIn", "Please wait before saving your preferred name.": "profileWait",
    "The signed-in account changed. Please try again.": "accountChanged",
  };
  return known[message] ?? "profileSaveError";
}
/** The native bridge exposes cancellation text, not BillingResponseCode. Do not infer debug-message codes. */
export function purchaseErrorKey(cause: unknown): AccountMessageKey {
  const { message } = details(cause);
  if (message === "User canceled purchase") return "purchaseCancelled";
  if (message.startsWith("Billing plugin not available.") || message.startsWith("Billing setup failed:") || message === "BillingClient not initialized. Call initialize() first." || message === "Activity not available") return "purchaseUnavailable";
  if (message.startsWith("Product not found:") || /^Product ".*" not found\./.test(message)) return "purchaseProduct";
  if (message === "Purchase validation failed" || message === "Validation failed") return "purchaseValidation";
  if (cause instanceof TypeError && message === "Failed to fetch") return "accountNetwork";
  return "purchaseError";
}
/** Keep recovery warnings actionable without exposing JSON, Firestore or native diagnostics. */
export function recoveryErrorKey(cause: unknown, operation: "backup" | "restore" | "reset"): AccountMessageKey {
  const { message, code } = details(cause);
  if (message === "Restore failed and local recovery was blocked by device storage. Keep this window open and retry after freeing storage.") return "recoveryStorage";
  if (message === "The backup exceeds 10 MB.") return "recoverySize";
  if (message === "Invalid Flicklet backup: unsupported backup schema version.") return "recoveryUnsupported";
  if (message.startsWith("Invalid Flicklet backup:") || cause instanceof SyntaxError || message === "The backup contains unsupported genre rows.") return "recoveryInvalid";
  if (message === "This backup is too large for the current cloud document. Nothing was changed." || message === "This backup exceeds the safe atomic cloud restore limit. Nothing was changed.") return "recoveryCloudLimit";
  if (message === "Your profile could not be loaded. Please retry the backup." || message === "The current account could not be loaded. Please retry.") return "recoveryProfile";
  if (message === "A backup restore or recovery is pending. Finish recovery and reload Flicklet before starting over." || message === "Restore recovery is pending. Nothing was reset.") return "recoveryPending";
  if (message === "The signed-in account changed during Start Over. Reload Flicklet before continuing." || message === "The signed-in account changed during restore. Please reload Flicklet.") return "recoveryReload";
  if (message.startsWith("Start Over failed and Android reminder recovery could not finish.")) return "recoveryNative";
  if (message === "The signed-in account changed. Please try again." || message === "The signed-in account changed. Please retry." || message === "The signed-in account changed.") return "accountChanged";
  if (code === "unavailable" || code === "auth/network-request-failed") return "accountNetwork";
  return operation === "backup" ? "recoveryBackupError" : operation === "restore" ? "recoveryRestoreError" : "startOverError";
}
