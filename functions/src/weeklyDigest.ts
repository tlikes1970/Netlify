/**
 * Process: Weekly Email Digest
 * Purpose: Scheduled function to send weekly email digest with top posts, new comments, and mentions
 * Data Source: Firestore posts, comments collections, Firebase Auth users
 * Update Path: Sends emails via SendGrid
 * Dependencies: firebase-functions (v1), firebase-admin, @sendgrid/mail
 */

import * as functions from 'firebase-functions/v1';
import { HttpsError } from 'firebase-functions/v1/https';
import { db, auth } from "./admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import sgMail from '@sendgrid/mail';

/**
 * Configuration for weekly digest email content
 * Stored in Firestore at digestConfig/current
 */
interface DigestConfig {
  title: string;
  intro: string;
  productPulseChanged: string;
  productPulseNext: string;
  productPulseHowTo: string;
  productPulseBonus: string;
  tipHeadline: string;
  tipBody: string;
  footerNote: string;
  isActive: boolean;
  // Auto-send configuration
  autoSendEnabled?: boolean;
  autoSendDay?: string | null;  // e.g. 'monday', 'tuesday', etc.
  autoSendTime?: string | null; // 'HH:mm' in 24h, e.g. '09:00'
  // Statistics
  lastAutoSentAt?: Timestamp | null;
  lastManualSentAt?: Timestamp | null;
  lastAutoSentCount?: number;
  lastManualSentCount?: number;
}

/**
 * Result of running a digest send
 */
interface DigestRunResult {
  sentCount: number;
  distinctEmails: number;
}

/**
 * Load the digest configuration from Firestore
 * Returns null if the document doesn't exist or cannot be read
 * Fills in missing fields with sensible defaults
 */
async function loadDigestConfig(): Promise<DigestConfig | null> {
  try {
    const docSnapshot = await db.collection('digestConfig').doc('current').get();
    if (!docSnapshot.exists) {
      return null;
    }
    const data = docSnapshot.data();
    if (!data) {
      return null;
    }
    // Map Firestore data to DigestConfig, with fallbacks for missing fields
    return {
      title: data.title || '🎬 Flicklet Weekly — We actually shipped things.',
      intro: data.intro || "Here's your Flicklet update in under a minute.",
      productPulseChanged: data.productPulseChanged || 'Ratings now stick between sessions.',
      productPulseNext: data.productPulseNext || '• Smarter discovery rails • Swipe gestures that don\'t argue with gravity',
      productPulseHowTo: data.productPulseHowTo || 'Tap ★ once. It remembers now.',
      productPulseBonus: data.productPulseBonus || 'Library loads faster so you spend less time staring at spinners.',
      tipHeadline: data.tipHeadline || 'The One Thing You Didn\'t Know You Needed',
      tipBody: data.tipBody || 'Hold your finger on a card to reorder your list. Saves 10 clicks and a small piece of your soul.',
      footerNote: data.footerNote || 'Was this worth your 42 seconds?',
      isActive: data.isActive !== undefined ? data.isActive : false,
      // New fields with defaults
      autoSendEnabled: data.autoSendEnabled !== undefined ? data.autoSendEnabled : false,
      autoSendDay: data.autoSendDay || 'friday',
      autoSendTime: data.autoSendTime || '09:00',
      lastAutoSentAt: data.lastAutoSentAt || null,
      lastManualSentAt: data.lastManualSentAt || null,
      lastAutoSentCount: data.lastAutoSentCount || 0,
      lastManualSentCount: data.lastManualSentCount || 0,
    };
  } catch (error) {
    console.error('[weeklyDigest] Error reading digest config:', error);
    return null;
  }
}

let __sgReady = false;
let MAIL_FROM = 'noreply@flicklet.app';

function ensureSendGridReady() {
  if (__sgReady) return sgMail;
  const cfg = functions.config();
  const key = cfg?.sendgrid?.key;
  MAIL_FROM = cfg?.mail?.from || 'noreply@flicklet.app';
  if (!key) {
    console.error('[weeklyDigest] Missing functions config sendgrid.key');
    throw new Error('Missing functions config: sendgrid.key');
  }
  sgMail.setApiKey(key);
  __sgReady = true;
  return sgMail;
}

/**
 * Core logic to run weekly digest once
 * Extracted to be reusable by both scheduled and manual triggers
 */
async function runWeeklyDigestOnce(options: { trigger: 'auto' | 'manual' }): Promise<DigestRunResult> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

  console.log(`[runWeeklyDigestOnce] Starting ${options.trigger} digest for week ending ${now.toISOString()}`);

  // Load digest configuration from Firestore
  const digestConfig = await loadDigestConfig();
  if (!digestConfig || digestConfig.isActive !== true) {
    throw new Error('No active digest config');
  }

  // 1. Fetch top 5 posts from last 7 days (by voteCount)
  const postsSnapshot = await db
    .collection("posts")
    .where("publishedAt", ">=", sevenDaysAgoTimestamp)
    .orderBy("publishedAt", "desc")
    .limit(100)
    .get();

  const posts: { id: string; title: string; slug: string; voteCount: number }[] =
    postsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

  const topPosts = posts
    .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
    .slice(0, 5);

  console.log(`[runWeeklyDigestOnce] Found ${topPosts.length} top posts`);

  // 2. Fetch new comments from last 7 days, grouped by post
  const commentsByPost: Record<string, any[]> = {};
  
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

  console.log(`[runWeeklyDigestOnce] Found comments in ${Object.keys(commentsByPost).length} posts`);

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
      console.warn(`[runWeeklyDigestOnce] Failed to verify email for user ${uid}:`, error);
    }
  }

  console.log(`[runWeeklyDigestOnce] Found ${subscribers.length} subscribers`);

  // Track unique emails
  const uniqueEmails = new Set<string>();

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

    // Build unsubscribe URL for plain text template
    const unsubscribeUrl = `https://flicklet.app/unsubscribe?token=${unsubscribeToken}`;

    // Build email HTML
    const emailHtml = buildEmailTemplate({
      subscriberName: subscriber.displayName || "there",
      posts: topPosts,
      commentsByPost,
      mentions,
      unsubscribeToken,
      config: digestConfig,
    });

    // Send email via SendGrid
    await sendDigestEmail({
      to: subscriber.email,
      subject: digestConfig.title,
      html: emailHtml,
      text: buildPlainTextTemplate({
        subscriberName: subscriber.displayName || 'there',
        posts: topPosts,
        commentsByPost,
        mentions,
        unsubscribeUrl,
        config: digestConfig,
      }),
    });

    uniqueEmails.add(subscriber.email);
    console.log(`[runWeeklyDigestOnce] sent to ${subscriber.email}`);
  });

  await Promise.all(emailPromises);

  const result: DigestRunResult = {
    sentCount: subscribers.length,
    distinctEmails: uniqueEmails.size,
  };

  console.log(`[runWeeklyDigestOnce] ${options.trigger} run completed`, result);
  return result;
}

// 1st Gen scheduled function – no Event, no generic
export const weeklyDigest = functions.pubsub.schedule('0 9 * * 5')
  .timeZone('UTC')
  .onRun(async () => {
    console.log('[weeklyDigest] Scheduled trigger fired');

    // Load digest configuration from Firestore
    const digestConfig = await loadDigestConfig();
    if (!digestConfig || digestConfig.isActive !== true) {
      console.log('[weeklyDigest] no active digest config, skipping send');
      return;
    }

    if (digestConfig.autoSendEnabled !== true) {
      console.log('[weeklyDigest] auto send disabled in config, skipping send');
      return;
    }

    try {
      const result = await runWeeklyDigestOnce({ trigger: 'auto' });
      console.log('[weeklyDigest] auto run completed', result);

      // Update stats in digestConfig
      await db.collection('digestConfig').doc('current').set({
        lastAutoSentAt: FieldValue.serverTimestamp(),
        lastAutoSentCount: result.distinctEmails,
      }, { merge: true });

      console.log('[weeklyDigest] stats updated');
    } catch (error) {
      console.error('[weeklyDigest] error:', error);
      throw error;
    }
  });

/**
 * Callable function to manually trigger digest send (admin only)
 */
export const sendDigestNow = functions.https.onCall(async (data, context) => {
  // Check caller is authenticated
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check caller is admin by verifying their token claims
  const callerRole = context.auth.token?.role;
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can trigger digest send');
  }

  const uid = context.auth.uid;
  console.log(`[sendDigestNow] manual trigger started by ${uid}`);

  try {
    // Load digest configuration from Firestore
    const digestConfig = await loadDigestConfig();
    if (!digestConfig || digestConfig.isActive !== true) {
      throw new HttpsError('failed-precondition', 'No active digest config');
    }

    const result = await runWeeklyDigestOnce({ trigger: 'manual' });
    console.log('[sendDigestNow] manual run completed', result);

    // Update stats in digestConfig
    await db.collection('digestConfig').doc('current').set({
      lastManualSentAt: FieldValue.serverTimestamp(),
      lastManualSentCount: result.distinctEmails,
    }, { merge: true });

    console.log('[sendDigestNow] stats updated');

    return {
      ok: true,
      sentCount: result.sentCount,
      distinctEmails: result.distinctEmails,
    };
  } catch (error: any) {
    console.error('[sendDigestNow] error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to send digest');
  }
});

/**
 * HTTP test function to preview digest email
 */
export const digestPreview = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const to = req.query.to as string;
  if (!to) {
    res.status(400).json({ error: 'Missing query parameter: to' });
    return;
  }

  try {
    // Load digest configuration from Firestore
    const digestConfig = await loadDigestConfig();
    if (!digestConfig || digestConfig.isActive !== true) {
      res.status(400).json({ error: 'No active digest config' });
      return;
    }

    const unsubscribeToken = await generateUnsubscribeToken('preview');

    const subscriberName = 'there';
    const posts: any[] = [];
    const commentsByPost: Record<string, any[]> = {};
    const mentions: any[] = [];

    const unsubscribeUrl = `https://flicklet.app/unsubscribe?token=${unsubscribeToken}`;

    const emailHtml = buildEmailTemplate({
      subscriberName,
      posts,
      commentsByPost,
      mentions,
      unsubscribeToken,
      config: digestConfig,
    });

    const emailText = buildPlainTextTemplate({
      subscriberName,
      posts,
      commentsByPost,
      mentions,
      unsubscribeUrl,
      config: digestConfig,
    });

    await sendDigestEmail({
      to,
      subject: digestConfig.title,
      html: emailHtml,
      text: emailText,
    });

    console.log('[digestPreview] sent', { to });
    res.status(200).json({ ok: true, to });
  } catch (error) {
    console.error('[digestPreview] error:', error);
    res.status(500).json({ error: 'Failed to send preview email' });
  }
});

/**
 * Send digest email via SendGrid
 */
async function sendDigestEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const sg = ensureSendGridReady();

  const msg = {
    to,
    from: MAIL_FROM,
    subject,
    html,
    text,
  };

  console.log('[digestPreview] msg', JSON.stringify({
    to: msg.to,
    from: msg.from,
    subject: msg.subject,
    htmlPreview: msg.html?.slice(0, 400),
    textPreview: msg.text?.slice(0, 200),
  }));

  await sg.send(msg);
}

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
  config,
}: {
  subscriberName: string;
  posts: any[];
  commentsByPost: Record<string, any[]>;
  mentions: any[];
  unsubscribeToken: string;
  config: DigestConfig;
}): string {
  const unsubscribeUrl = `https://flicklet.app/unsubscribe?token=${unsubscribeToken}`;

  // Build Cafeteria Table section
  let cafeteriaTableContent = '';
  if (mentions.length > 0) {
    const displayMentions = mentions.slice(0, 3);
    cafeteriaTableContent = displayMentions
      .map(
        (mention) => `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333333;">
            "${mention.postTitle || 'A post you were in'}" — <em style="color: #666666;">Because community</em>
          </td>
        </tr>
      `
      )
      .join('');
  } else {
    cafeteriaTableContent = `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333333;">
            "Is it still a binge if I fall asleep mid-episode?" — <em style="color: #666666;">Because honesty</em>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333333;">
            "Can we rate movies we hate just to warn others?" — <em style="color: #666666;">Because community service</em>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333333;">
            "My FlickWord guesses have devolved into therapy." — <em style="color: #666666;">Because relatable</em>
          </td>
        </tr>
    `;
  }

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background:#f6f7f9;">
    <tr>
      <td style="padding:40px 20px;">
        <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border-collapse:collapse;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:40px 30px;">
              <p style="margin:0 0 10px 0;font-size:16px;color:#333333;line-height:1.5;">
                Hi ${subscriberName || 'there'},
              </p>
              <p style="margin:0 0 30px 0;font-size:14px;color:#666666;line-height:1.5;">
                ${config.intro || "Here's your Flicklet update in under a minute."}
              </p>

              <h2 style="margin:30px 0 15px 0;font-size:18px;color:#333333;font-weight:bold;">
                1. Product Pulse
              </h2>
              <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#333333;">
                    <strong>What changed (🔧)</strong> — ${config.productPulseChanged || 'Ratings now stick between sessions.'}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#333333;">
                    <strong>What's next (👀)</strong> — ${config.productPulseNext || '• Smarter discovery rails • Swipe gestures that don\'t argue with gravity'}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#333333;">
                    <strong>How to use it</strong> — ${config.productPulseHowTo || 'Tap ★ once. It remembers now.'}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#333333;">
                    <strong>Hidden bonus</strong> — ${config.productPulseBonus || 'Library loads faster so you spend less time staring at spinners.'}
                  </td>
                </tr>
              </table>

              <h2 style="margin:30px 0 15px 0;font-size:18px;color:#333333;font-weight:bold;">
                2. The Cafeteria Table
              </h2>
              <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                ${cafeteriaTableContent}
              </table>

              <h2 style="margin:30px 0 15px 0;font-size:18px;color:#333333;font-weight:bold;">
                3. ${config.tipHeadline || 'The One Thing You Didn\'t Know You Needed'}
              </h2>
              <p style="margin:0 0 30px 0;font-size:14px;color:#333333;line-height:1.5;">
                ${config.tipBody || 'Hold your finger on a card to reorder your list. Saves 10 clicks and a small piece of your soul.'}
              </p>

              <p style="margin:30px 0 20px 0;font-size:14px;color:#333333;line-height:1.5;">
                ${config.footerNote || 'Was this worth your 42 seconds?'}
              </p>

              <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e0e0e0;">
                <p style="margin:0 0 10px 0;font-size:12px;color:#999999;">
                  Sent by Flicklet.
                </p>
                <p style="margin:0;font-size:12px;color:#999999;">
                  If you'd like to stop receiving these, you can <a href="${unsubscribeUrl}" style="color:#007AFF;text-decoration:underline;">unsubscribe here</a>.
                </p>
              </div>
            </td>
          </tr>
        </table>
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
  unsubscribeUrl,
  config,
}: {
  subscriberName: string;
  posts: any[];
  commentsByPost: Record<string, any[]>;
  mentions: any[];
  unsubscribeUrl: string;
  config: DigestConfig;
}): string {
  // Build Cafeteria Table section
  let cafeteriaTableLines = '';
  if (mentions.length > 0) {
    const displayMentions = mentions.slice(0, 3);
    cafeteriaTableLines = displayMentions
      .map((mention) => `- ${mention.postTitle || 'A post you were in'} (Because community)`)
      .join('\n');
  } else {
    cafeteriaTableLines = `- Is it still a binge if I fall asleep mid-episode? (Because honesty)
- Can we rate movies we hate just to warn others? (Because community service)
- My FlickWord guesses have devolved into therapy. (Because relatable)`;
  }

  return `
${config.title || '🎬 Flicklet Weekly — We actually shipped things.'}

Hi ${subscriberName || 'there'},
${config.intro || "Here's your Flicklet update in under a minute."}

1. Product Pulse

What changed (🔧): ${config.productPulseChanged || 'Ratings now stick between sessions.'}

What's next (👀): ${config.productPulseNext || 'Smarter discovery rails; swipe gestures that don\'t argue with gravity.'}

How to use it: ${config.productPulseHowTo || 'Tap ★ once. It remembers now.'}

Hidden bonus: ${config.productPulseBonus || 'Library loads faster so you spend less time staring at spinners.'}

2. The Cafeteria Table

${cafeteriaTableLines}

3. ${config.tipHeadline || 'The One Thing You Didn\'t Know You Needed'}

${config.tipBody || 'Hold your finger on a card to reorder your list. Saves 10 clicks and a small piece of your soul.'}

${config.footerNote || 'Was this worth your 42 seconds?'}

Sent by Flicklet.
${unsubscribeUrl ? `To unsubscribe, visit: ${unsubscribeUrl}` : ''}
  `.trim();
}

