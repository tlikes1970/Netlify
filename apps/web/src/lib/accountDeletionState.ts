export const ACCOUNT_DELETION_KEY = "flicklet.accountDeletion.pending.v1";
export type PendingDeletion = { uid: string; confirmed: boolean };
export function pendingAccountDeletion(): PendingDeletion | null {
  try {
    const data = JSON.parse(
      localStorage.getItem(ACCOUNT_DELETION_KEY) || "null",
    );
    return typeof data?.uid === "string" && typeof data.confirmed === "boolean"
      ? data
      : null;
  } catch {
    return null;
  }
}
export function recordAccountDeletion(uid: string, confirmed: boolean): void {
  localStorage.setItem(
    ACCOUNT_DELETION_KEY,
    JSON.stringify({ uid, confirmed }),
  );
}
export function requiresAccountDeletionPage(pathname: string): boolean {
  return (
    pathname.replace(/\/$/, "") === "/delete-account" ||
    !!pendingAccountDeletion()
  );
}
