/**
 * Process: Aggregate Replies
 * Purpose: Keeps replyCount in parent comment document when replies are added/removed
 * Data Source: Firestore posts/{postId}/comments/{commentId}/replies/{replyId} writes
 * Update Path: Updates comment.replyCount field automatically
 * Dependencies: firebase-functions, firebase-admin
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { db } from './admin';

export const aggregateReplies = onDocumentWritten(
  {
    document: 'posts/{postId}/comments/{commentId}/replies/{replyId}',
    region: 'us-central1',
  },
  async (event) => {
    const { postId, commentId } = event.params;

    const repliesRef = db
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId)
      .collection('replies');

    const snap = await repliesRef.get();
    const replyCount = snap.size;

    await db
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId)
      .update({ replyCount });
  }
);

