/**
 * Process: Weekly Email Digest
 * Purpose: Scheduled function to send weekly email digest with top posts, new comments, and mentions
 * Data Source: Firestore posts, comments collections, Firebase Auth users
 * Update Path: Sends emails via firestore-send-email extension
 * Dependencies: firebase-functions (v1), firebase-admin, firestore-send-email extension
 */

import * as functions from 'firebase-functions/v1';
import { db, auth } from "./admin";
import { Timestamp } from "firebase-admin/firestore";

// 1st Gen scheduled function – no Event, no generic
export const weeklyDigest = functions.pubsub.schedule('0 9 * * 5')
  .timeZone('UTC')
  .onRun(async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

    console.log(`Starting weekly digest for week ending ${now.toISOString()}`);

    try {
      // 1. Fetch top 5 posts from last 7 days (by voteCount)
      const postsSnapshot = await db
        .collection("posts")
        .where("publishedAt", ">=", sevenDaysAgoTimestamp)
        .orderBy("publishedAt", "desc")
        .limit(100)
        .get();

      // 1. after the map, cast to the real shape
      const posts: { id: string; title: string; slug: string; voteCount: number }[] =
        postsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

      // 2. sort uses voteCount, not score
      const topPosts = posts
        .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
        .slice(0, 5);

      console.log(`Found ${topPosts.length} top posts`);

      // 2. Fetch new comments from last 7 days, grouped by post
      const commentsByPost: Record<string, any[]> = {};
      
      // Get all posts to check comments
      const allPostsSnapshot = await db
        .collection("posts")
        .where("publishedAt", ">=", sevenDaysAgoTimestamp)
        .get();

      for (const postDoc of allPostsSnapshot.docs) {
        const postId = postDoc.id;
        const commentsSnapshot = await db
          .collection(`posts/${postId}/comments`)
          .where("createdAt", ">=", sevenDaysAgoTimestamp)
          .orderBy("createdAt", "desc")
          .limit(10)
          .get();

        if (!commentsSnapshot.empty) {
          commentsByPost[postId] = commentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            postId,
          }));
        }
      }

      console.log(`Found comments in ${Object.keys(commentsByPost).length} posts`);

      // 3. Get all subscribers (users with emailSubscriber=true and emailVerified=true)
      const usersSnapshot = await db
        .collection("users")
        .where("emailSubscriber", "==", true)
        .get();

      const subscribers: Array<{ uid: string; email: string; displayName?: string }> = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const uid = userDoc.id;

        // Check if email is verified via Firebase Auth
        try {
          const authUser = await auth.getUser(uid);
          if (authUser.emailVerified && authUser.email) {
            subscribers.push({
              uid,
              email: authUser.email,
              displayName: userData.displayName || userData.profile?.displayName,
            });
          }
        } catch (error) {
          console.warn(`Failed to verify email for user ${uid}:`, error);
        }
      }

      console.log(`Found ${subscribers.length} subscribers`);

      // 4. For each subscriber, find mentions and build personalized email
      const emailPromises = subscribers.map(async (subscriber) => {
        // Find mentions (@username) in comments
        const mentions: any[] = [];
        const subscriberUsername = subscriber.displayName?.toLowerCase() || "";

        for (const [postId, comments] of Object.entries(commentsByPost)) {
          for (const comment of comments) {
            const body = (comment.body || "").toLowerCase();
            // Check for @ mentions (simple pattern match)
            if (
              subscriberUsername &&
              body.includes(`@${subscriberUsername}`)
            ) {
              mentions.push({
                ...comment,
                postTitle: topPosts.find((p) => p.id === postId)?.title || "Unknown Post",
                postSlug: topPosts.find((p) => p.id === postId)?.slug,
              });
            }
          }
        }

        // Generate unsubscribe token
        const unsubscribeToken = await generateUnsubscribeToken(subscriber.uid);

        // Build email HTML
        const emailHtml = buildEmailTemplate({
          subscriberName: subscriber.displayName || "there",
          posts: topPosts,
          commentsByPost,
          mentions,
          unsubscribeToken,
        });

        // Send email via firestore-send-email extension
        await db.collection("mail").add({
          to: subscriber.email,
          message: {
            subject: "Your Weekly Flicklet Digest",
            html: emailHtml,
            text: buildPlainTextTemplate({
              subscriberName: subscriber.displayName || "there",
              posts: topPosts,
              commentsByPost,
              mentions,
            }),
          },
        });

        console.log(`Email queued for ${subscriber.email}`);
      });

      await Promise.all(emailPromises);
      console.log(`Weekly digest completed. Sent ${subscribers.length} emails.`);
    } catch (error) {
      console.error("Error in weekly digest:", error);
      throw error;
    }
  });

/**
 * Generate JWT token for unsubscribe link
 */
async function generateUnsubscribeToken(uid: string): Promise<string> {
  // Use Firebase Admin to create a custom token that we can verify
  // For simplicity, we'll use a simple base64 encoding with timestamp
  // In production, use a proper JWT library like jsonwebtoken
  const payload = {
    uid,
    type: "unsubscribe",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
  };

  // Simple base64 encoding (in production, use proper JWT with secret)
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/**
 * Build HTML email template using MJML-like structure
 */
function buildEmailTemplate({
  subscriberName,
  posts,
  commentsByPost,
  mentions,
  unsubscribeToken,
}: {
  subscriberName: string;
  posts: any[];
  commentsByPost: Record<string, any[]>;
  mentions: any[];
  unsubscribeToken: string;
}): string {
  const unsubscribeUrl = `https://flicklet.app/unsubscribe?token=${unsubscribeToken}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Flicklet Digest</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #1a1a1a;">
        <h1 style="color: #ffffff; margin: 0;">Flicklet Weekly Digest</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <p style="font-size: 16px; color: #333333; margin-bottom: 30px;">
          Hi ${subscriberName},
        </p>
        <p style="font-size: 16px; color: #333333; margin-bottom: 30px;">
          Here's what's been happening on Flicklet this week:
        </p>

        ${posts.length > 0 ? `
        <h2 style="color: #333333; margin-top: 40px; margin-bottom: 20px;">🔥 Top Posts This Week</h2>
        ${posts
          .map(
            (post) => `
        <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333333;">
            <a href="https://flicklet.app/posts/${post.slug}" style="color: #007AFF; text-decoration: none;">${post.title || "Untitled"}</a>
          </h3>
          <p style="color: #666666; margin: 10px 0; font-size: 14px;">${post.excerpt || post.body?.substring(0, 150) + "..." || ""}</p>
          <div style="margin-top: 15px; font-size: 12px; color: #999999;">
            <span>👍 ${post.voteCount || 0} votes</span>
            <span style="margin-left: 15px;">💬 ${post.commentCount || 0} comments</span>
          </div>
        </div>
        `
          )
          .join("")}
        ` : ""}

        ${mentions.length > 0 ? `
        <h2 style="color: #333333; margin-top: 40px; margin-bottom: 20px;">📬 You Were Mentioned</h2>
        ${mentions
          .slice(0, 5)
          .map(
            (mention) => `
        <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
            <strong>${mention.authorName || "Someone"}</strong> mentioned you in:
            <a href="https://flicklet.app/posts/${mention.postSlug}" style="color: #007AFF; text-decoration: none;">${mention.postTitle}</a>
          </p>
          <p style="margin: 0; color: #333333; font-style: italic;">"${(mention.body || "").substring(0, 200)}${mention.body?.length > 200 ? "..." : ""}"</p>
        </div>
        `
          )
          .join("")}
        ` : ""}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
          <p style="font-size: 12px; color: #999999; margin: 0;">
            <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe</a> from these emails
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Build plain text version of email
 */
function buildPlainTextTemplate({
  subscriberName,
  posts,
  commentsByPost,
  mentions,
}: {
  subscriberName: string;
  posts: any[];
  commentsByPost: Record<string, any[]>;
  mentions: any[];
}): string {
  let text = `Hi ${subscriberName},\n\n`;
  text += `Here's what's been happening on Flicklet this week:\n\n`;

  if (posts.length > 0) {
    text += `🔥 Top Posts This Week:\n\n`;
    posts.forEach((post) => {
      text += `${post.title || "Untitled"}\n`;
      text += `${post.excerpt || post.body?.substring(0, 150) + "..." || ""}\n`;
      text += `👍 ${post.voteCount || 0} votes | 💬 ${post.commentCount || 0} comments\n`;
      text += `https://flicklet.app/posts/${post.slug}\n\n`;
    });
  }

  if (mentions.length > 0) {
    text += `📬 You Were Mentioned:\n\n`;
    mentions.slice(0, 5).forEach((mention) => {
      text += `${mention.authorName || "Someone"} mentioned you in "${mention.postTitle}":\n`;
      text += `"${(mention.body || "").substring(0, 200)}${mention.body?.length > 200 ? "..." : ""}"\n`;
      text += `https://flicklet.app/posts/${mention.postSlug}\n\n`;
    });
  }

  return text;
}

