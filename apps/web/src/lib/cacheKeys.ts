// Centralized cache key generation for games
// Ensures consistent key naming across the application

import { getDailySeedDate } from './dailySeed';

/**
 * Cache key versions for cache invalidation
 */
export const CACHE_VERSIONS = {
  FLICKWORD_DAILY_WORD: '1.0',
  TRIVIA_DAILY_QUESTIONS: '1.0',
  FLICKWORD_GAME_STATE: '1.0',
  FLICKWORD_STATS: '1.0',
  TRIVIA_STATS: '1.0',
} as const;

/**
 * Generate cache key for daily FlickWord word
 * @param gameNumber Optional game number (1-3) for Pro users
 */
export function getFlickWordDailyKey(gameNumber?: number): string {
  if (gameNumber && gameNumber > 1) {
    return `flicklet:daily-word:game${gameNumber}`;
  }
  return 'flicklet:daily-word';
}

/**
 * Generate cache key for daily Trivia questions
 */
export function getTriviaDailyKey(): string {
  return 'flicklet:daily-trivia';
}

/**
 * Generate cache key for FlickWord game state
 */
export function getFlickWordGameStateKey(): string {
  return 'flickword:game-state';
}

/**
 * Generate cache key for FlickWord games completed today
 * @param date Optional date string (defaults to today's UTC date)
 */
export function getFlickWordGamesCompletedKey(date?: string): string {
  const today = date || getDailySeedDate();
  return `flickword:games-completed:${today}`;
}

/**
 * Generate cache key for Trivia games completed today
 * @param date Optional date string (defaults to today's UTC date)
 */
export function getTriviaGamesCompletedKey(date?: string): string {
  const today = date || getDailySeedDate();
  return `flicklet:trivia:games:${today}`;
}

/**
 * Generate cache key for FlickWord stats
 */
export function getFlickWordStatsKey(): string {
  return 'flickword:stats';
}

/**
 * Generate cache key for Trivia stats
 */
export function getTriviaStatsKey(): string {
  return 'trivia:stats';
}

/**
 * Generate cache key for completed FlickWord games (for review)
 * @param date Optional date string (defaults to today's UTC date)
 */
export function getFlickWordCompletedGamesKey(date?: string): string {
  const today = date || getDailySeedDate();
  return `flickword:completed-games:${today}`;
}

/**
 * Generate cache key for completed Trivia games (for review)
 * @param date Optional date string (defaults to today's UTC date)
 */
export function getTriviaCompletedGamesKey(date?: string): string {
  const today = date || getDailySeedDate();
  return `trivia:completed-games:${today}`;
}

/**
 * Generate cache key with version for cache invalidation
 * @param baseKey Base cache key
 * @param version Version string
 */
export function getVersionedKey(baseKey: string, version: string): string {
  return `${baseKey}:v${version}`;
}

