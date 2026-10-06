import { HttpsError } from "firebase-functions/v2/https";
import { db } from "./admin";

/** Also blocks old administrator tokens in server paths that bypass Firestore rules. */
export async function assertNotDeleting(uid: string): Promise<void> {
  const marker = await db.doc(`accountDeletions/${uid}`).get();
  assertDeletionMarkerInactive(marker);
}
export function assertDeletionMarkerInactive(marker: {
  data(): { expiresAt?: { toMillis(): number } } | undefined;
}): void {
  if ((marker.data()?.expiresAt?.toMillis() ?? 0) > Date.now())
    throw new HttpsError(
      "permission-denied",
      "Account deletion is in progress.",
    );
}
