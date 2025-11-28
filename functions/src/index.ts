import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { db as database } from "./admin";

export const aggregateVotes = onDocumentWritten(
  {
    document: "posts/{postId}/votes/{userId}",
    region: "us-central1",
  },
  async (event) => {
    const { postId } = event.params;
    const snap = await database.collection(`posts/${postId}/votes`).get();
    const score = snap.docs.reduce((s, d) => s + (d.data().value || 0), 0);
    await database
      .doc(`posts/${postId}`)
      .update({ score, voteCount: snap.size });
  }
);

// Export sanitizeComment from separate file
export { sanitizeComment } from "./sanitizeComment";

// Export aggregateReplies from separate file
export { aggregateReplies } from "./aggregateReplies";

// Export sendPushOnReply from separate file
export { sendPushOnReply } from "./sendPushOnReply";

// Export setAdminRole from separate file
export { setAdminRole } from "./setAdminRole";

// Export manageAdminRole from separate file
export { manageAdminRole } from "./manageAdminRole";

// Export manageProStatus from separate file
export { manageProStatus } from "./manageProStatus";

// Export weeklyDigest from separate file
export { weeklyDigest } from "./weeklyDigest";

// Export digestPreview from separate file
export { digestPreview } from "./weeklyDigest";

// Export sendDigestNow from separate file
export { sendDigestNow } from "./weeklyDigest";

// Export unsubscribe from separate file
export { unsubscribe } from "./unsubscribe";

// Export syncPostToPrisma from separate file
export { syncPostToPrisma } from "./syncPostToPrisma";

// Export ingestGoofs from separate file
export { ingestGoofs } from "./ingestGoofs";
