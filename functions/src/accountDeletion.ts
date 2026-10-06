import { HttpsError, onCall } from "firebase-functions/v2/https";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { auth, db } from "./admin";

export const DELETION_PROTECTION_MS = 65 * 60 * 1000;
type Identity = { uid: string; token: { auth_time?: unknown } };
export interface DeletionDependencies {
  now(): number;
  getUser(uid: string): Promise<{ tokensValidAfterTime?: string }>;
  isProtected(uid: string): Promise<boolean>;
  protect(uid: string, expiresAt: number): Promise<void>;
  deleteData(uid: string): Promise<void>;
  deleteAuth(uid: string): Promise<void>;
}

/** Caller identity is supplied exclusively by Firebase's verified callable context. */
export async function deleteOwnAccount(
  identity: Identity | undefined,
  data: unknown,
  deps: DeletionDependencies,
) {
  if (!identity?.uid)
    throw new HttpsError("unauthenticated", "Sign in to delete your account.");
  if ((data as { confirmation?: unknown } | null)?.confirmation !== "DELETE")
    throw new HttpsError(
      "invalid-argument",
      "Explicit deletion confirmation is required.",
    );
  const authenticatedAt = identity.token.auth_time;
  if (
    typeof authenticatedAt !== "number" ||
    !Number.isFinite(authenticatedAt) ||
    deps.now() - authenticatedAt * 1000 > 5 * 60 * 1000 ||
    authenticatedAt * 1000 > deps.now() + 30000
  )
    throw new HttpsError(
      "failed-precondition",
      "recent-authentication-required",
    );
  try {
    let user: { tokensValidAfterTime?: string };
    try {
      user = await deps.getUser(identity.uid);
    } catch (error) {
      if (
        (error as { code?: string }).code !== "auth/user-not-found" ||
        !(await deps.isProtected(identity.uid))
      )
        throw error;
      // A lost response after Auth deletion can safely retry its own protected cleanup.
      user = {};
    }
    if (
      user.tokensValidAfterTime &&
      authenticatedAt < Math.floor(Date.parse(user.tokensValidAfterTime) / 1000)
    )
      throw new HttpsError(
        "failed-precondition",
        "recent-authentication-required",
      );
    // Only the key and expiry are retained. Trusted Admin writes bypass client rules.
    await deps.protect(identity.uid, deps.now() + DELETION_PROTECTION_MS);
    await deps.deleteData(identity.uid);
    // Cover tokens issued during a long cleanup, not just those issued before it.
    await deps.protect(identity.uid, deps.now() + DELETION_PROTECTION_MS);
    await deps.deleteAuth(identity.uid);
    return { deleted: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    // No provider messages, tokens, personal fields or misleading success response.
    throw new HttpsError("internal", "account-deletion-incomplete");
  }
}

async function deleteMatches(collection: string, field: string, uid: string) {
  for (;;) {
    const matches = await db
      .collection(collection)
      .where(field, "==", uid)
      .limit(200)
      .get();
    if (matches.empty) return;
    await Promise.all(
      matches.docs.map((record) => db.recursiveDelete(record.ref)),
    );
  }
}
export async function deleteFlickletData(uid: string): Promise<void> {
  await deleteMatches("usernames", "uid", uid);
  await deleteMatches("playPurchases", "uid", uid);
  // Remove this administrator's identity from other users' grants without revoking them.
  const grants = await db
    .collectionGroup("billing")
    .where("updatedBy", "==", uid)
    .get();
  await Promise.all(
    grants.docs
      .filter((d) => /^users\/[^/]+\/billing\//.test(d.ref.path))
      .map((d) => d.ref.update({ updatedBy: "deleted-administrator" })),
  );
  const trials = await db
    .collectionGroup("entitlements")
    .where("resetBy", "==", uid)
    .get();
  await Promise.all(
    trials.docs
      .filter((d) => /^users\/[^/]+\/entitlements\//.test(d.ref.path))
      .map((d) => d.ref.update({ resetBy: FieldValue.delete() })),
  );
  // Includes current and historical subcollections; never touches shared title/catalog data.
  await db.recursiveDelete(db.doc(`users/${uid}`));
}
export const deleteAccount = onCall(
  { cors: true, timeoutSeconds: 540 },
  (req) =>
    deleteOwnAccount(req.auth, req.data, {
      now: Date.now,
      getUser: (uid) => auth.getUser(uid),
      isProtected: async (uid) => {
        const record = await db.doc(`accountDeletions/${uid}`).get();
        return (record.data()?.expiresAt?.toMillis?.() ?? 0) > Date.now();
      },
      protect: (uid, expiresAt) =>
        db
          .doc(`accountDeletions/${uid}`)
          .set({ expiresAt: Timestamp.fromMillis(expiresAt) })
          .then(() => undefined),
      deleteData: deleteFlickletData,
      deleteAuth: async (uid) => {
        try {
          await auth.deleteUser(uid);
        } catch (error) {
          if ((error as { code?: string }).code !== "auth/user-not-found")
            throw error;
        }
      },
    }),
);
