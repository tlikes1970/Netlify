/**
 * Process: Comment Sanitization Cloud Function
 * Purpose: Filters profanity and updates commentCount when comments are written
 * Data Source: Firestore posts/{postId}/comments/{commentId} writes
 * Update Path: Sanitizes comment body and updates parent post commentCount
 * Dependencies: firebase-functions, firebase-admin, bad-words.json
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { db } from './admin';

// Load bad words list
// In compiled output, bad-words.json should be in the same directory
const badWordsPath = path.join(__dirname, 'bad-words.json');
let badWordsData: any;
try {
  badWordsData = JSON.parse(fs.readFileSync(badWordsPath, 'utf8'));
} catch (error) {
  // Fallback if file not found (shouldn't happen in production)
  console.error('Failed to load bad-words.json:', error);
  badWordsData = { disallowed: [], censor: {} };
}
const disallowedWords = new Set(badWordsData.disallowed.map((w: string) => w.toLowerCase()));
const censorMap = new Map(
  Object.entries(badWordsData.censor).map(([key, value]) => [key.toLowerCase(), value as string])
);

/**
 * Sanitize comment text:
 * - Replace censor words (e.g., "damn" → "d•mn")
 * - Reject if contains disallowed words
 */
function sanitizeText(text: string): { sanitized: string; allowed: boolean } {
  const words = text.toLowerCase().split(/\s+/);
  const sanitizedWords: string[] = [];
  let containsDisallowed = false;

  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');
    
    // Check if disallowed
    if (disallowedWords.has(cleanWord)) {
      containsDisallowed = true;
      break;
    }
    
    // Check if needs censoring
    if (censorMap.has(cleanWord)) {
      sanitizedWords.push(censorMap.get(cleanWord) || word);
    } else {
      sanitizedWords.push(word);
    }
  }

  if (containsDisallowed) {
    return { sanitized: text, allowed: false };
  }

  // Preserve original capitalization and spacing
  const originalWords = text.split(/(\s+)/);
  let sanitized = '';
  let wordIndex = 0;

  for (const part of originalWords) {
    if (/\S/.test(part)) {
      // It's a word
      const originalWord = part.replace(/[^\w]/g, '');
      const lowerWord = originalWord.toLowerCase();
      
      if (censorMap.has(lowerWord)) {
        // Replace with censored version, preserving punctuation
        const censored = censorMap.get(lowerWord) || lowerWord;
        sanitized += part.replace(originalWord, censored);
      } else {
        sanitized += part;
      }
      wordIndex++;
    } else {
      // It's whitespace
      sanitized += part;
    }
  }

  return { sanitized, allowed: true };
}

/**
 * Cloud Function triggered when a comment is written
 */
export const sanitizeComment = onDocumentWritten(
  {
    document: 'posts/{postId}/comments/{commentId}',
    region: 'us-central1',
  },
  async (event) => {
    const { postId, commentId } = event.params;
    const change = event.data;
    const commentRef = db.doc(`posts/${postId}/comments/${commentId}`);

    // Handle deletion
    if (!change?.after?.exists) {
      // Comment deleted - decrement commentCount
      const postRef = db.doc(`posts/${postId}`);
      const postSnap = await postRef.get();
      if (postSnap.exists) {
        const currentCount = (postSnap.data()?.commentCount || 0);
        await postRef.update({
          commentCount: Math.max(0, currentCount - 1),
        });
      }
      return null;
    }

    const data = change.after.data();
    const originalBody = data?.body || '';

    // Sanitize the comment
    const { sanitized, allowed } = sanitizeText(originalBody);

    if (!allowed) {
      // Delete the comment - it contains disallowed words
      await commentRef.delete();
      // Return early - comment will not be created
      return null;
    }

    // Update comment with sanitized body if changed
    if (sanitized !== originalBody) {
      await commentRef.update({
        body: sanitized,
        sanitized: true,
      });
    }

    // Update commentCount on parent post
    const postRef = db.doc(`posts/${postId}`);
    const postSnap = await postRef.get();
    
    // Check if this is a new comment (not an update)
    const wasCreated = !change.before?.exists || !change.before.data();
    
    if (wasCreated && change.after?.exists) {
      // New comment - increment count
      const currentCount = (postSnap.data()?.commentCount || 0);
      await postRef.update({
        commentCount: currentCount + 1,
      });
    }

    return null;
  }
);
