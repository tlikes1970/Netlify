/**
 * Process: Community Limits Configuration
 * Purpose: Define daily posting/commenting limits for Free vs Pro users
 * Data Source: Configuration constants
 * Update Path: Modify constants here to adjust limits
 * Dependencies: Used by NewPostModal, CommentComposer for limit enforcement
 */

// Daily limits for Free users (UTC day)
export const MAX_FREE_POSTS_PER_DAY = 3;
export const MAX_FREE_COMMENTS_PER_DAY = 10;

// Daily limits for Pro users (effectively unlimited, but set high cap for safety)
export const MAX_PRO_POSTS_PER_DAY = 100;
export const MAX_PRO_COMMENTS_PER_DAY = 500;

/**
 * Check if user can create a post today
 * @param userId - Firebase Auth UID
 * @param isPro - Whether user has Pro status
 * @param postsCreatedToday - Count of posts created today (UTC)
 * @returns true if user can create another post
 */
export function canCreatePost(
  userId: string | null,
  isPro: boolean,
  postsCreatedToday: number
): boolean {
  if (!userId) return false;
  
  const maxPosts = isPro ? MAX_PRO_POSTS_PER_DAY : MAX_FREE_POSTS_PER_DAY;
  return postsCreatedToday < maxPosts;
}

/**
 * Check if user can create a comment today
 * @param userId - Firebase Auth UID
 * @param isPro - Whether user has Pro status
 * @param commentsCreatedToday - Count of comments created today (UTC)
 * @returns true if user can create another comment
 */
export function canCreateComment(
  userId: string | null,
  isPro: boolean,
  commentsCreatedToday: number
): boolean {
  if (!userId) return false;
  
  const maxComments = isPro ? MAX_PRO_COMMENTS_PER_DAY : MAX_FREE_COMMENTS_PER_DAY;
  return commentsCreatedToday < maxComments;
}

/**
 * Get remaining posts user can create today
 */
export function getRemainingPosts(
  isPro: boolean,
  postsCreatedToday: number
): number {
  const maxPosts = isPro ? MAX_PRO_POSTS_PER_DAY : MAX_FREE_POSTS_PER_DAY;
  return Math.max(0, maxPosts - postsCreatedToday);
}

/**
 * Get remaining comments user can create today
 */
export function getRemainingComments(
  isPro: boolean,
  commentsCreatedToday: number
): number {
  const maxComments = isPro ? MAX_PRO_COMMENTS_PER_DAY : MAX_FREE_COMMENTS_PER_DAY;
  return Math.max(0, maxComments - commentsCreatedToday);
}

