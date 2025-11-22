/**
 * Process: Pro Configuration
 * Purpose: Single source of truth for Pro feature limits and entitlements
 * Data Source: Static configuration
 * Update Path: Modify this file to change Pro vs Free limits
 * Dependencies: proStatus.ts, customLists.ts, notifications.ts, communitySorting.ts
 */

import { getProStatus } from './proStatus';

/**
 * Pro feature limits configuration
 * 
 * This defines the limits for Free vs Pro users across all features.
 * All Pro gating should reference these constants.
 */
export const PRO_LIMITS = {
  /**
   * Custom Lists
   * Free: 3 lists max
   * Pro: Unlimited (represented as Infinity or a very high number)
   */
  lists: {
    free: 3,
    pro: Infinity, // Unlimited for Pro users
  },

  /**
   * Community Posts (daily limits)
   * Free: 3 posts per day
   * Pro: 100 posts per day
   */
  communityPosts: {
    free: 3,
    pro: 100,
  },

  /**
   * Community Comments (daily limits)
   * Free: 10 comments per day
   * Pro: 500 comments per day
   */
  communityComments: {
    free: 10,
    pro: 500,
  },
} as const;

/**
 * Get the maximum number of custom lists allowed for the current user
 * Uses centralized Pro status helper
 */
export function getMaxCustomLists(): number {
  const proStatus = getProStatus();
  return proStatus.isPro ? PRO_LIMITS.lists.pro : PRO_LIMITS.lists.free;
}

/**
 * Check if user can create another custom list
 */
export function canCreateAnotherList(currentListCount: number): boolean {
  const maxLists = getMaxCustomLists();
  return currentListCount < maxLists;
}

/**
 * Get remaining list slots for the current user
 */
export function getRemainingListSlots(currentListCount: number): number {
  const maxLists = getMaxCustomLists();
  if (maxLists === Infinity) {
    return Infinity;
  }
  return Math.max(0, maxLists - currentListCount);
}



