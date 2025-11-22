/**
 * Process: Game Review Storage
 * Purpose: Store and retrieve completed games for review
 * Data Source: Completed game results from FlickWord and Trivia
 * Update Path: Save on game completion, retrieve for review display
 * Dependencies: cacheKeys.ts, dailySeed.ts
 */

import { getDailySeedDate } from './dailySeed';
import { getFlickWordCompletedGamesKey, getTriviaCompletedGamesKey } from './cacheKeys';

export interface CompletedFlickWordGame {
  date: string;
  gameNumber: number;
  target: string;
  guesses: string[];
  won: boolean;
  lastResults: Array<'correct' | 'present' | 'absent'>[];
  completedAt: number; // timestamp
}

export interface CompletedTriviaGame {
  date: string;
  gameNumber: number;
  score: number;
  total: number;
  percentage: number;
  questions: Array<{
    question: string;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }>;
  completedAt: number; // timestamp
}

/**
 * Save completed FlickWord game for review
 */
export function saveCompletedFlickWordGame(game: CompletedFlickWordGame): void {
  try {
    const today = getDailySeedDate();
    const key = getFlickWordCompletedGamesKey(today);
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as CompletedFlickWordGame[];
    
    // Remove any existing game with same gameNumber (replace if replayed)
    const filtered = existing.filter(g => g.gameNumber !== game.gameNumber);
    filtered.push(game);
    
    // Sort by gameNumber
    filtered.sort((a, b) => a.gameNumber - b.gameNumber);
    
    localStorage.setItem(key, JSON.stringify(filtered));
    console.log(`💾 Saved completed FlickWord game ${game.gameNumber} for review`);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error("❌ localStorage quota exceeded. Cannot save completed game.");
    } else {
      console.warn("Failed to save completed FlickWord game:", error);
    }
  }
}

/**
 * Get completed FlickWord games for today
 */
export function getCompletedFlickWordGames(date?: string): CompletedFlickWordGame[] {
  try {
    const targetDate = date || getDailySeedDate();
    const key = getFlickWordCompletedGamesKey(targetDate);
    const games = localStorage.getItem(key);
    return games ? JSON.parse(games) : [];
  } catch (error) {
    console.warn("Failed to get completed FlickWord games:", error);
    return [];
  }
}

/**
 * Save completed Trivia game for review
 */
export function saveCompletedTriviaGame(game: CompletedTriviaGame): void {
  try {
    const today = getDailySeedDate();
    const key = getTriviaCompletedGamesKey(today);
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as CompletedTriviaGame[];
    
    // Remove any existing game with same gameNumber (replace if replayed)
    const filtered = existing.filter(g => g.gameNumber !== game.gameNumber);
    filtered.push(game);
    
    // Sort by gameNumber
    filtered.sort((a, b) => a.gameNumber - b.gameNumber);
    
    localStorage.setItem(key, JSON.stringify(filtered));
    console.log(`💾 Saved completed Trivia game ${game.gameNumber} for review`);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error("❌ localStorage quota exceeded. Cannot save completed game.");
    } else {
      console.warn("Failed to save completed Trivia game:", error);
    }
  }
}

/**
 * Get completed Trivia games for today
 */
export function getCompletedTriviaGames(date?: string): CompletedTriviaGame[] {
  try {
    const targetDate = date || getDailySeedDate();
    const key = getTriviaCompletedGamesKey(targetDate);
    const games = localStorage.getItem(key);
    return games ? JSON.parse(games) : [];
  } catch (error) {
    console.warn("Failed to get completed Trivia games:", error);
    return [];
  }
}

/**
 * Get all completed games for a date range (for history)
 */
export function getCompletedGamesHistory(
  gameType: 'flickword' | 'trivia',
  days: number = 7
): Array<{ date: string; games: CompletedFlickWordGame[] | CompletedTriviaGame[] }> {
  const history: Array<{ date: string; games: CompletedFlickWordGame[] | CompletedTriviaGame[] }> = [];
  const today = new Date(getDailySeedDate() + 'T00:00:00Z');
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const games = gameType === 'flickword' 
      ? getCompletedFlickWordGames(dateStr)
      : getCompletedTriviaGames(dateStr);
    
    if (games.length > 0) {
      history.push({ date: dateStr, games });
    }
  }
  
  return history;
}




