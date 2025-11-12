/**
 * Process: Sync Post to Prisma
 * Purpose: Automatically sync new Firestore posts to Prisma database
 * Data Source: Firestore posts collection writes
 * Update Path: Creates post in Prisma with author and tags
 * Dependencies: firebase-functions, firebase-admin, Prisma client (via HTTP endpoint)
 */

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { db } from "./admin";

/**
 * Cloud Function triggered when a post is created in Firestore
 * Syncs the post to Prisma database via HTTP endpoint
 */
export const syncPostToPrisma = onDocumentWritten(
  {
    document: "posts/{postId}",
    region: "us-central1",
  },
  async (event) => {
    const { postId } = event.params;
    const change = event.data;

    // Only process new posts (not updates or deletes)
    if (!change?.after?.exists || change.before?.exists) {
      return null;
    }

    const postData = change.after.data();
    if (!postData) {
      console.log(`[syncPostToPrisma] No data for post ${postId}`);
      return null;
    }

    try {
      // Get the sync endpoint URL from environment or use default
      const syncEndpoint = process.env.PRISMA_SYNC_ENDPOINT || "http://localhost:4000/api/v1/sync/post";
      
      // Prepare post data for Prisma
      const publishedAt = postData.publishedAt?.toDate
        ? postData.publishedAt.toDate().toISOString()
        : new Date().toISOString();

      const syncPayload = {
        firestoreId: postId,
        slug: postData.slug,
        title: postData.title || "",
        content: postData.body || postData.content || "",
        publishedAt,
        authorId: postData.authorId, // Firebase UID
        authorName: postData.authorName || "Anonymous",
        authorEmail: postData.authorEmail || null,
        tagSlugs: postData.tagSlugs || [],
      };

      // Call Prisma sync endpoint
      const response = await fetch(syncEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(syncPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[syncPostToPrisma] Failed to sync post ${postId}:`,
          response.status,
          errorText
        );
        return null;
      }

      const result = await response.json();
      console.log(`[syncPostToPrisma] Successfully synced post ${postId} to Prisma:`, result.id);
      return null;
    } catch (error: any) {
      console.error(`[syncPostToPrisma] Error syncing post ${postId}:`, error.message);
      return null;
    }
  }
);


