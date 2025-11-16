# Weekly Digest Email Template Analysis

**File:** `functions/src/weeklyDigest.ts`  
**Date:** Analysis only (no code changes)

---

## Section 1: buildEmailTemplate Source

**Location:** Lines 265-353

**Function Signature:**
```typescript
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
}): string
```

**Full Implementation:**
```typescript
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
```

**Template Structure:**
- Table-based layout with inline styles
- Dark header (`#1a1a1a`) with white text
- Light gray body background (`#f5f5f5`)
- Conditional sections for posts and mentions
- Each post shows: title (linked), excerpt/body preview, vote count, comment count
- Each mention shows: author name, post title (linked), comment body preview (200 chars max)
- Unsubscribe link at bottom

**Data Used:**
- `subscriberName`: Personalized greeting
- `posts`: Array of post objects with `slug`, `title`, `excerpt`/`body`, `voteCount`, `commentCount`
- `commentsByPost`: Not directly rendered in HTML (only used for mention detection)
- `mentions`: Array of mention objects with `authorName`, `postTitle`, `postSlug`, `body`
- `unsubscribeToken`: Used to build unsubscribe URL

---

## Section 2: buildPlainTextTemplate Source

**Location:** Lines 358-392

**Function Signature:**
```typescript
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
}): string
```

**Full Implementation:**
```typescript
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
```

**Template Structure:**
- Plain text with newlines (`\n`)
- Same content structure as HTML version
- No unsubscribe link in plain text version
- Same post and mention formatting logic

**Data Used:**
- `subscriberName`: Personalized greeting
- `posts`: Array of post objects (same as HTML)
- `commentsByPost`: Not used in plain text template
- `mentions`: Array of mention objects (same as HTML)

---

## Section 3: Call Sites

### Call Site 1: weeklyDigest Function

**Location:** Lines 118-167

**Context (Lines 118-167):**
```typescript
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

  // Send email via SendGrid
  await sendDigestEmail({
    to: subscriber.email,
    subject: 'Your Weekly Flicklet Digest',
    html: emailHtml,
    text: buildPlainTextTemplate({
      subscriberName: subscriber.displayName || 'there',
      posts: topPosts,
      commentsByPost,
      mentions,
    }),
  });

  console.log('[weeklyDigest] sent', { to: subscriber.email });
});
```

**Data Passed to buildEmailTemplate:**
- `subscriberName`: `subscriber.displayName || "there"` (fallback to "there")
- `posts`: `topPosts` (top 5 posts from last 7 days, sorted by voteCount)
- `commentsByPost`: `commentsByPost` (Record<string, any[]> - comments grouped by post ID)
- `mentions`: `mentions` (array of comment objects where subscriber was mentioned, includes `postTitle` and `postSlug`)
- `unsubscribeToken`: Generated via `generateUnsubscribeToken(subscriber.uid)`

**Data Passed to buildPlainTextTemplate:**
- `subscriberName`: `subscriber.displayName || 'there'` (same as HTML)
- `posts`: `topPosts` (same as HTML)
- `commentsByPost`: `commentsByPost` (same as HTML, but not used in template)
- `mentions`: `mentions` (same as HTML)

**Post Object Structure (from topPosts):**
- `id`: string (post document ID)
- `title`: string
- `slug`: string
- `voteCount`: number
- `commentCount`: number (from post document)
- `excerpt`: string (optional, from post document)
- `body`: string (optional, from post document)

**Mention Object Structure:**
- `id`: string (comment document ID)
- `postId`: string
- `postTitle`: string (added during mention detection)
- `postSlug`: string (added during mention detection)
- `authorName`: string (from comment document)
- `body`: string (comment body text)
- Other comment fields from Firestore document

---

### Call Site 2: digestPreview Function

**Location:** Lines 192-220

**Context (Lines 192-220):**
```typescript
try {
  const unsubscribeToken = await generateUnsubscribeToken('preview');

  const subscriberName = 'there';
  const posts: any[] = [];
  const commentsByPost: Record<string, any[]> = {};
  const mentions: any[] = [];

  const emailHtml = buildEmailTemplate({
    subscriberName,
    posts,
    commentsByPost,
    mentions,
    unsubscribeToken,
  });

  const emailText = buildPlainTextTemplate({
    subscriberName,
    posts,
    commentsByPost,
    mentions,
  });

  await sendDigestEmail({
    to,
    subject: '🎬 Flicklet Weekly — We actually shipped things.',
    html: emailHtml,
    text: emailText,
  });

  console.log('[digestPreview] sent', { to });
  res.status(200).json({ ok: true, to });
} catch (error) {
  console.error('[digestPreview] error:', error);
  res.status(500).json({ error: 'Failed to send preview email' });
}
```

**Data Passed to buildEmailTemplate:**
- `subscriberName`: `'there'` (hardcoded)
- `posts`: `[]` (empty array - no posts in preview)
- `commentsByPost`: `{}` (empty object - no comments in preview)
- `mentions`: `[]` (empty array - no mentions in preview)
- `unsubscribeToken`: Generated via `generateUnsubscribeToken('preview')`

**Data Passed to buildPlainTextTemplate:**
- `subscriberName`: `'there'` (same as HTML)
- `posts`: `[]` (same as HTML)
- `commentsByPost`: `{}` (same as HTML)
- `mentions`: `[]` (same as HTML)

**Note:** The preview function uses empty/mock data, so the email will show only the greeting and unsubscribe link (no posts or mentions sections).

---

## Summary

**Template Functions:**
- `buildEmailTemplate`: Returns HTML string with table-based layout, inline styles, conditional sections for posts/mentions
- `buildPlainTextTemplate`: Returns plain text string with same content structure, no unsubscribe link

**Call Sites:**
- `weeklyDigest`: Uses real data from Firestore (topPosts, commentsByPost, mentions)
- `digestPreview`: Uses empty/mock data for testing

**Data Flow:**
1. Posts fetched from Firestore, sorted by voteCount, limited to top 5
2. Comments fetched per post, grouped into `commentsByPost` object
3. Mentions detected by searching comment bodies for `@username` pattern
4. Unsubscribe token generated per subscriber
5. Templates called with subscriber-specific data
6. Email sent via SendGrid







