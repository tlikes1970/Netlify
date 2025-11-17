/**
 * Process: Community Limits Checker
 * Purpose: Check if user can create posts/comments based on daily limits
 * Data Source: Firestore posts/comments collections
 * Update Path: Called before allowing post/comment creation
 * Dependencies: communityLimits, firebaseBootstrap
 */

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebaseBootstrap';
import { canCreatePost, canCreateComment, getRemainingPosts, getRemainingComments } from './communityLimits';

/**
 * Get start of today in UTC
 */
function getTodayStart(): Date {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return utc;
}

/**
 * Count posts created by user today (UTC)
 */
export async function countPostsToday(userId: string): Promise<number> {
  try {
    const todayStart = getTodayStart();
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('authorId', '==', userId),
      where('publishedAt', '>=', Timestamp.fromDate(todayStart))
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error counting posts today:', error);
    return 0; // Fail open - allow creation if we can't count
  }
}

/**
 * Count comments created by user today (UTC)
 */
export async function countCommentsToday(userId: string): Promise<number> {
  try {
    const todayStart = getTodayStart();
    let totalCount = 0;
    
    // Get all posts to check their comments sub-collections
    // Note: This is not ideal but Firestore doesn't support collection group queries easily
    // For v1, we'll use a simpler approach: count from recent posts only
    const postsRef = collection(db, 'posts');
    const recentPostsQuery = query(postsRef, where('publishedAt', '>=', Timestamp.fromDate(todayStart)));
    const postsSnapshot = await getDocs(recentPostsQuery);
    
    // Check comments in each post
    for (const postDoc of postsSnapshot.docs) {
      const commentsRef = collection(db, 'posts', postDoc.id, 'comments');
      const commentsQuery = query(
        commentsRef,
        where('authorId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(todayStart))
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      totalCount += commentsSnapshot.size;
    }
    
    return totalCount;
  } catch (error) {
    console.error('Error counting comments today:', error);
    return 0; // Fail open - allow creation if we can't count
  }
}

/**
 * Check if user can create a post
 */
export async function checkCanCreatePost(userId: string, isPro: boolean): Promise<{
  canCreate: boolean;
  postsToday: number;
  remaining: number;
  message?: string;
}> {
  const postsToday = await countPostsToday(userId);
  const canCreate = canCreatePost(userId, isPro, postsToday);
  const remaining = getRemainingPosts(isPro, postsToday);
  
  if (!canCreate) {
    const maxPosts = isPro ? 100 : 3;
    return {
      canCreate: false,
      postsToday,
      remaining: 0,
      message: `You've reached your daily limit of ${maxPosts} posts. ${isPro ? '' : 'Upgrade to Pro for higher limits.'}`,
    };
  }
  
  return {
    canCreate: true,
    postsToday,
    remaining,
  };
}

/**
 * Check if user can create a comment
 */
export async function checkCanCreateComment(userId: string, isPro: boolean): Promise<{
  canCreate: boolean;
  commentsToday: number;
  remaining: number;
  message?: string;
}> {
  const commentsToday = await countCommentsToday(userId);
  const canCreate = canCreateComment(userId, isPro, commentsToday);
  const remaining = getRemainingComments(isPro, commentsToday);
  
  if (!canCreate) {
    const maxComments = isPro ? 500 : 10;
    return {
      canCreate: false,
      commentsToday,
      remaining: 0,
      message: `You've reached your daily limit of ${maxComments} comments. ${isPro ? '' : 'Upgrade to Pro for higher limits.'}`,
    };
  }
  
  return {
    canCreate: true,
    commentsToday,
    remaining,
  };
}

