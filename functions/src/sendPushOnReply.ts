/**
 * Process: Send Push Notification on Reply
 * Purpose: Sends FCM push notification when a reply is created on a comment
 * Data Source: Firestore posts/{postId}/comments/{commentId}/replies/{replyId} writes
 * Update Path: Triggered automatically when reply is created
 * Dependencies: firebase-admin, firebase-functions, FCM tokens stored in users collection
 */

import * as functions from 'firebase-functions/v1';
import { db } from './admin';
import * as admin from 'firebase-admin';

export const sendPushOnReply = functions.firestore
  .document('posts/{postId}/comments/{commentId}/replies/{replyId}')
  .onCreate(async (snap, context) => {
    if (!snap.exists) {
      console.log('No data in snapshot, skipping push notification');
      return null;
    }
    const replyData = snap.data();
    const { postId, commentId, replyId } = context.params;

    // Get the parent comment to find the comment author
    const commentDoc = await db
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId)
      .get();

    if (!commentDoc.exists) {
      console.log('Parent comment not found, skipping push notification');
      return null;
    }

    const commentData = commentDoc.data();
    const commentAuthorId = commentData?.authorId;
    const replyAuthorId = replyData?.authorId;

    // Don't send notification if user is replying to themselves
    if (commentAuthorId === replyAuthorId) {
      console.log('User replying to own comment, skipping notification');
      return null;
    }

    // Get comment author's FCM token
    const userDoc = await db.collection('users').doc(commentAuthorId).get();
    if (!userDoc.exists) {
      console.log('Comment author user document not found');
      return null;
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      console.log('No FCM token found for comment author');
      return null;
    }

    // Get post title for notification
    const postDoc = await db.collection('posts').doc(postId).get();
    const postTitle = postDoc.data()?.title || 'a post';

    // Send push notification
    const message = {
      notification: {
        title: 'New Reply',
        body: `${replyData?.authorName || 'Someone'} replied to your comment on "${postTitle}"`,
      },
      data: {
        type: 'reply',
        postId,
        commentId,
        replyId: replyId,
        postSlug: postDoc.data()?.slug || postId,
      },
      token: fcmToken,
    };

    try {
      await admin.messaging().send(message);
      console.log('Push notification sent successfully');
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      // If token is invalid, remove it
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        await db.collection('users').doc(commentAuthorId).update({
          fcmToken: admin.firestore.FieldValue.delete(),
        });
      }
    }

    return null;
  });
