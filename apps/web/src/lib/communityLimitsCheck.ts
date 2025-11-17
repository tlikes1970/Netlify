/**
 * Process: Community Limits Checker
 * Purpose: Check if user can create posts/comments based on daily limits
 * Data Source: Firestore posts/comments collections
 * Update Path: Called before allowing post/comment creation
 * Dependencies: communityLimits, firebaseBootstrap
 */

import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
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
 * 
 * Note: For v1, we use a simplified approach that checks comments in recent posts only.
 * This avoids requiring Firestore composite indexes. For production scale, consider:
 * - Using collection group queries with proper indexes
 * - Cloud Function to maintain a daily comment count per user
 * - Or accept this as a reasonable approximation
 */
export async function countCommentsToday(userId: string): Promise<number> {
  try {
    const todayStart = getTodayStart();
    let totalCount = 0;
    
    // Simplified approach: Check comments in recent posts (last 7 days, max 100 posts)
    // This avoids needing composite indexes while still being reasonably accurate
    const postsRef = collection(db, 'posts');
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentPostsQuery = query(
      postsRef,
      where('publishedAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('publishedAt', 'desc'),
      limit(100) // Limit to recent 100 posts to avoid performance issues
    );
    
    const postsSnapshot = await getDocs(recentPostsQuery);
    
    // Check comments in each post
    // Query all comments, then filter by authorId and createdAt in memory
    // This completely avoids any Firestore index requirements
    for (const postDoc of postsSnapshot.docs) {
      try {
        const commentsRef = collection(db, 'posts', postDoc.id, 'comments');
        // Get all comments (no where clause = no index needed)
        // Limit to reasonable number to avoid performance issues
        const commentsQuery = query(commentsRef, limit(1000));
        const commentsSnapshot = await getDocs(commentsQuery);
        
        // Filter by authorId and createdAt in memory (avoids all index requirements)
        commentsSnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
          
          // Check if comment is by this user and created today
          if (data.authorId === userId && createdAt >= todayStart) {
            totalCount++;
          }
        });
      } catch (postError: any) {
        // Skip posts that fail - this is acceptable for v1 approximation
        console.warn(`Error checking comments in post ${postDoc.id}:`, postError);
        continue;
      }
    }
    
    return totalCount;
  } catch (error: any) {
    // If the main query fails (e.g., missing index), fail gracefully
    console.warn('Error counting comments today (using fallback):', error);
    
    // Fallback: Return 0 and allow creation (fail open)
    // In production, you might want to track this differently
    if (error.code === 'failed-precondition') {
      console.warn('Firestore index required for comment counting. For now, allowing creation.');
    }
    
    return 0; // Fail open - allow creation if we can't count accurately
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

