/**
 * Process: Enhanced Rating System with Conflict Resolution
 * Purpose: Manages user ratings with timestamps, deduplication, and conflict resolution
 * Data Source: Library entries with userRating and ratingUpdatedAt
 * Update Path: Modify rating update logic or conflict resolution rules
 * Dependencies: Library storage, event system
 */

import type { MediaType } from '../components/cards/card.types';

export type RatingState = 'null' | 'zero' | 'unchanged' | 'changed';

export interface RatingUpdate {
  id: string | number;
  mediaType: MediaType;
  rating: number; // 1-5 stars, must be integer
  timestamp: number; // epoch ms
  origin: 'user' | 'sync' | 'discovery'; // Track where update came from
}

// Track recent updates to prevent duplicates
const recentUpdates = new Map<string, { rating: number; timestamp: number; origin: string }>();
const DEDUP_WINDOW_MS = 500; // 500ms window for deduplication

/**
 * Normalize rating to 1-5 integer scale
 */
export function normalizeRating(rating: number | null | undefined): number | null {
  if (rating === null || rating === undefined) return null;
  // Clamp to 1-5 and round to nearest integer
  const normalized = Math.max(1, Math.min(5, Math.round(rating)));
  return normalized;
}

/**
 * Determine rating state: null, zero, unchanged, or changed
 */
export function getRatingState(
  oldRating: number | null | undefined,
  newRating: number | null | undefined
): RatingState {
  const oldNorm = normalizeRating(oldRating);
  const newNorm = normalizeRating(newRating);
  
  if (newNorm === null) return 'null';
  if (newNorm === 0) return 'zero';
  if (oldNorm === newNorm) return 'unchanged';
  return 'changed';
}

/**
 * Check if rating update should be applied (last-write-wins with timestamp)
 */
export function shouldApplyRating(
  existingTimestamp: number | undefined,
  newTimestamp: number
): boolean {
  // If no existing timestamp, always apply
  if (!existingTimestamp) return true;
  // Apply if new timestamp is newer (last-write-wins)
  return newTimestamp > existingTimestamp;
}

/**
 * Check if update is duplicate within deduplication window
 */
export function isDuplicateUpdate(
  key: string,
  rating: number,
  timestamp: number,
  origin: string
): boolean {
  const recent = recentUpdates.get(key);
  if (!recent) return false;
  
  const timeDiff = timestamp - recent.timestamp;
  if (timeDiff > DEDUP_WINDOW_MS) return false; // Outside window
  
  // Same rating, same origin, within window = duplicate
  return recent.rating === rating && recent.origin === origin;
}

/**
 * Record update for deduplication
 */
export function recordUpdate(
  key: string,
  rating: number,
  timestamp: number,
  origin: string
): void {
  recentUpdates.set(key, { rating, timestamp, origin });
  
  // Clean up old entries (older than dedup window)
  const cutoff = Date.now() - DEDUP_WINDOW_MS;
  for (const [k, v] of recentUpdates.entries()) {
    if (v.timestamp < cutoff) {
      recentUpdates.delete(k);
    }
  }
}

/**
 * Create rating update with proper normalization and deduplication
 */
export function createRatingUpdate(
  id: string | number,
  mediaType: MediaType,
  rating: number | null | undefined,
  origin: 'user' | 'sync' | 'discovery' = 'user'
): RatingUpdate | null {
  const normalized = normalizeRating(rating);
  if (normalized === null) return null; // Don't create update for null ratings
  
  const key = `${mediaType}:${id}`;
  const timestamp = Date.now();
  
  // Check for duplicate
  if (isDuplicateUpdate(key, normalized, timestamp, origin)) {
    return null; // Duplicate, skip
  }
  
  // Record for future deduplication
  recordUpdate(key, normalized, timestamp, origin);
  
  return {
    id,
    mediaType,
    rating: normalized,
    timestamp,
    origin
  };
}









