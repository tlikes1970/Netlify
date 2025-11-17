/**
 * Daily Seed Utility
 * 
 * Provides a canonical date-based seed for daily game content.
 * Uses UTC timezone to ensure all users globally share the same daily content,
 * regardless of their local timezone.
 */

/**
 * Get the canonical daily seed date string (YYYY-MM-DD) based on UTC time.
 * This ensures all users worldwide see the same daily content on the same UTC day.
 * 
 * @returns A date string in format 'YYYY-MM-DD' based on UTC date
 * 
 * @example
 * // If it's 2024-01-15 23:00 UTC (or 2024-01-16 01:00 in UTC+2)
 * getDailySeedDate() // Returns '2024-01-15'
 */
export function getDailySeedDate(): string {
  const now = new Date();
  // Use UTC methods to get date components
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a seed string for a specific game number (for Pro users with multiple games per day).
 * Combines the daily seed date with the game number to create unique seeds for each game.
 * 
 * @param gameNumber The game number (1-3 for Pro users)
 * @returns A seed string combining date and game number, e.g., '2024-01-15-game1'
 * 
 * @example
 * getDailySeedForGame(1) // Returns '2024-01-15-game1'
 * getDailySeedForGame(2) // Returns '2024-01-15-game2'
 */
export function getDailySeedForGame(gameNumber: number = 1): string {
  const date = getDailySeedDate();
  return `${date}-game${gameNumber}`;
}

