import { assertNotDeleting, assertDeletionMarkerInactive } from './deletionProtection';
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db, auth } from "./admin";
import { manageFullAccessGrant } from "./fullAccessGrant";

/** Admin grants are separate from Play purchase authority and historical Pro flags. */
export const manageProStatus = onCall({ cors: true }, async (req) => {
  try {
    if (req.auth?.token?.role === "admin") await assertNotDeleting(req.auth.uid);
    return await manageFullAccessGrant(req.auth, req.data, {
      findUser: (target) =>
        target.includes("@")
          ? auth.getUserByEmail(target)
          : auth.getUser(target),
      writeGrant: async (uid, record) => {
        const grant = db
          .collection("users")
          .doc(uid)
          .collection("billing")
          .doc("adminGrant");
        await db.runTransaction(async transaction => {
          assertDeletionMarkerInactive(await transaction.get(db.doc(`accountDeletions/${req.auth!.uid}`)));
          assertDeletionMarkerInactive(await transaction.get(db.doc(`accountDeletions/${uid}`)));
          transaction.set(grant,
            { ...record, updatedAt: FieldValue.serverTimestamp() },
            { merge: true },
          );
        });
      },
    });
  } catch (error) {
    const failure = error as { code?: string; message?: string };
    if (
      failure.code === "unauthenticated" ||
      failure.code === "permission-denied" ||
      failure.code === "invalid-argument"
    )
      throw new HttpsError(failure.code, failure.message || "Grant failed");
    if (failure.code === "auth/user-not-found")
      throw new HttpsError(
        "not-found",
        "No Flicklet account found for that email or account ID.",
      );
    throw new HttpsError(
      "internal",
      "Unable to update Full Access. Try again.",
    );
  }
});
