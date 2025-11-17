/**
 * Process: Community Sorting Utilities
 * Purpose: Implement sorting algorithms for community posts (Top, Hot, Trending)
 * Data Source: Post data with score, voteCount, commentCount, publishedAt
 * Update Path: N/A - utility functions
 * Dependencies: Used by CommunityPanel for sorting posts
 */

export type SortMode = 'newest' | 'oldest' | 'top' | 'top-week' | 'hot' | 'trending';

export interface PostForSorting {
  id: string;
  score?: number;
  voteCount?: number;
  commentCount?: number;
  publishedAt: string | Date;
}

/**
 * Calculate "Hot" score using Reddit-like algorithm
 * Formula: score / (age_in_hours + 2)^gravity
 * Higher score = more recent activity + higher votes
 */
function calculateHotScore(post: PostForSorting, gravity: number = 1.5): number {
  const now = new Date();
  const publishedAt = typeof post.publishedAt === 'string' 
    ? new Date(post.publishedAt) 
    : post.publishedAt;
  const ageInHours = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
  
  // Prevent division by zero and handle very new posts
  const denominator = Math.pow(ageInHours + 2, gravity);
  return (post.score || 0) / denominator;
}

/**
 * Calculate "Trending" score based on recent activity
 * Prioritizes posts with recent votes/comments
 */
function calculateTrendingScore(post: PostForSorting): number {
  const now = new Date();
  const publishedAt = typeof post.publishedAt === 'string' 
    ? new Date(post.publishedAt) 
    : post.publishedAt;
  const ageInHours = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
  
  // Recent posts (last 24 hours) get boost
  const recencyBoost = ageInHours < 24 ? 1.5 : 1.0;
  
  // Combine score, vote count, and comment count with recency
  return ((post.score || 0) + (post.voteCount || 0) * 0.5 + (post.commentCount || 0) * 0.3) * recencyBoost;
}

/**
 * Sort posts by the specified mode
 */
export function sortPosts<T extends PostForSorting>(
  posts: T[],
  mode: SortMode
): T[] {
  const sorted = [...posts]; // Create copy to avoid mutating original

  switch (mode) {
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = typeof a.publishedAt === 'string' ? new Date(a.publishedAt) : a.publishedAt;
        const dateB = typeof b.publishedAt === 'string' ? new Date(b.publishedAt) : b.publishedAt;
        return dateB.getTime() - dateA.getTime(); // Newest first
      });

    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = typeof a.publishedAt === 'string' ? new Date(a.publishedAt) : a.publishedAt;
        const dateB = typeof b.publishedAt === 'string' ? new Date(b.publishedAt) : b.publishedAt;
        return dateA.getTime() - dateB.getTime(); // Oldest first
      });

    case 'top':
      return sorted.sort((a, b) => (b.score || 0) - (a.score || 0)); // Highest score first

    case 'top-week': {
      // Filter to last 7 days, then sort by score
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      return sorted
        .filter(post => {
          const publishedAt = typeof post.publishedAt === 'string' 
            ? new Date(post.publishedAt) 
            : post.publishedAt;
          return publishedAt >= weekAgo;
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    case 'hot':
      return sorted.sort((a, b) => {
        const hotA = calculateHotScore(a);
        const hotB = calculateHotScore(b);
        return hotB - hotA; // Highest hot score first
      });

    case 'trending':
      return sorted.sort((a, b) => {
        const trendingA = calculateTrendingScore(a);
        const trendingB = calculateTrendingScore(b);
        return trendingB - trendingA; // Highest trending score first
      });

    default:
      return sorted; // Return unsorted if unknown mode
  }
}

/**
 * Check if a sort mode requires Pro
 */
export function isProSortMode(mode: SortMode): boolean {
  return ['top', 'top-week', 'hot', 'trending'].includes(mode);
}

/**
 * Get available sort modes for a user
 */
export function getAvailableSortModes(isPro: boolean): SortMode[] {
  const freeModes: SortMode[] = ['newest', 'oldest'];
  const proModes: SortMode[] = ['top', 'top-week', 'hot', 'trending'];
  
  return isPro ? [...freeModes, ...proModes] : freeModes;
}

/**
 * Get display name for sort mode
 */
export function getSortModeLabel(mode: SortMode): string {
  const labels: Record<SortMode, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    top: 'Top (All-time)',
    'top-week': 'Top (Past Week)',
    hot: 'Hot',
    trending: 'Trending',
  };
  return labels[mode] || mode;
}

