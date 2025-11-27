/**
 * Process: Trivia Question Deduplication
 * Purpose: Centralized system ensuring NO duplicate questions appear within a day or across a 14-day window.
 * Data Source: localStorage tracking of question hashes by date and game
 * Update Path: Called by TriviaGame.tsx during question loading and after game completion
 * Dependencies: triviaQuestions.ts, dailySeed.ts, cacheKeys.ts
 */

import { getDailySeedDate } from './dailySeed';

// ============================================================================
// TYPES
// ============================================================================

interface DailyQuestionRecord {
  date: string;
  games: {
    [gameNumber: number]: string[]; // Array of question hashes for each game
  };
}

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'flicklet:trivia:question-history';
const NO_REPEAT_DAYS = 7; // Reduced from 14 to be more realistic with limited pool
// Note: Questions per game (10) is defined in TriviaGame.tsx

// ============================================================================
// HASH FUNCTION
// ============================================================================

/**
 * Create a stable hash from question text
 * Normalizes text to ensure same question = same hash regardless of source
 */
export function hashQuestion(questionText: string): string {
  // Normalize: lowercase, trim, remove extra whitespace, remove punctuation variations
  const normalized = questionText
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/…/g, '...');
  
  // Simple string hash (djb2 algorithm)
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// STORAGE OPERATIONS
// ============================================================================

/**
 * Load question history from localStorage
 */
function loadHistory(): DailyQuestionRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as DailyQuestionRecord[];
    }
  } catch (e) {
    console.warn('[TriviaDedup] Failed to load history:', e);
  }
  return [];
}

/**
 * Save question history to localStorage
 * Prunes records older than NO_REPEAT_DAYS
 */
function saveHistory(records: DailyQuestionRecord[]): void {
  try {
    const today = getDailySeedDate();
    const todayDate = new Date(today + 'T00:00:00Z');
    
    // Prune old records
    const cutoffDate = new Date(todayDate);
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - NO_REPEAT_DAYS);
    
    const pruned = records.filter(r => {
      const recordDate = new Date(r.date + 'T00:00:00Z');
      return recordDate >= cutoffDate;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch (e) {
    console.warn('[TriviaDedup] Failed to save history:', e);
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get all question hashes that should be avoided for a new game
 * Includes:
 * - All questions from the last NO_REPEAT_DAYS
 * - All questions from earlier games TODAY (for Pro users)
 * 
 * @param currentGameNumber The game about to be played (1-3)
 * @returns Set of question hashes to avoid
 */
export function getUsedQuestionHashes(currentGameNumber: number): Set<string> {
  const usedHashes = new Set<string>();
  const history = loadHistory();
  const today = getDailySeedDate();
  
  for (const record of history) {
    // For today's games, only include EARLIER games (not current or future)
    if (record.date === today) {
      for (const [gameNumStr, hashes] of Object.entries(record.games)) {
        const gameNum = parseInt(gameNumStr, 10);
        if (gameNum < currentGameNumber) {
          hashes.forEach(h => usedHashes.add(h));
        }
      }
    } else {
      // For previous days, include ALL games
      for (const hashes of Object.values(record.games)) {
        hashes.forEach(h => usedHashes.add(h));
      }
    }
  }
  
  console.log(`[TriviaDedup] Found ${usedHashes.size} used question hashes to avoid for game ${currentGameNumber}`);
  return usedHashes;
}

/**
 * Record questions used in a completed game
 * Called after game completion to track what was shown
 * 
 * @param gameNumber The game that was played (1-3)
 * @param questions The questions that were shown
 */
export function recordUsedQuestions(gameNumber: number, questions: TriviaQuestion[]): void {
  const today = getDailySeedDate();
  const history = loadHistory();
  
  // Find or create today's record
  let todayRecord = history.find(r => r.date === today);
  if (!todayRecord) {
    todayRecord = { date: today, games: {} };
    history.push(todayRecord);
  }
  
  // Store hashes for this game
  const hashes = questions.map(q => hashQuestion(q.question));
  todayRecord.games[gameNumber] = hashes;
  
  saveHistory(history);
  console.log(`[TriviaDedup] Recorded ${hashes.length} questions for game ${gameNumber} on ${today}`);
}

/**
 * Filter out duplicate questions from a list
 * Returns only questions whose hash is NOT in the used set
 * 
 * @param questions Questions to filter
 * @param usedHashes Set of hashes to exclude
 * @returns Filtered questions with no duplicates
 */
export function filterDuplicates<T extends { question: string }>(
  questions: T[],
  usedHashes: Set<string>
): T[] {
  const filtered: T[] = [];
  const seenInBatch = new Set<string>(); // Also dedupe within the batch itself
  
  for (const q of questions) {
    const hash = hashQuestion(q.question);
    if (!usedHashes.has(hash) && !seenInBatch.has(hash)) {
      seenInBatch.add(hash);
      filtered.push(q);
    }
  }
  
  return filtered;
}

/**
 * Select N unique questions from a pool, avoiding used hashes
 * Guarantees no duplicates by tracking within selection
 * 
 * @param pool All available questions
 * @param count Number of questions needed
 * @param usedHashes Hashes to avoid
 * @param startIndex Optional starting index for deterministic selection
 * @returns Array of unique questions
 */
export function selectUniqueQuestions<T extends { question: string }>(
  pool: T[],
  count: number,
  usedHashes: Set<string>,
  startIndex: number = 0
): T[] {
  const selected: T[] = [];
  const selectedHashes = new Set<string>();
  
  // First pass: try to get questions starting at startIndex
  let attempts = 0;
  let index = startIndex % pool.length;
  const maxAttempts = pool.length * 2;
  
  while (selected.length < count && attempts < maxAttempts) {
    const question = pool[index];
    const hash = hashQuestion(question.question);
    
    if (!usedHashes.has(hash) && !selectedHashes.has(hash)) {
      selected.push(question);
      selectedHashes.add(hash);
    }
    
    index = (index + 1) % pool.length;
    attempts++;
  }
  
  // If we couldn't get enough unique questions, log warning
  if (selected.length < count) {
    console.warn(
      `[TriviaDedup] Could only select ${selected.length}/${count} unique questions. ` +
      `Pool size: ${pool.length}, Used hashes: ${usedHashes.size}`
    );
  }
  
  return selected;
}

/**
 * Get current day's question hashes for a specific game
 * Used to check if a game has already been recorded
 * 
 * @param gameNumber The game to check (1-3)
 * @returns Array of hashes if game was recorded, empty array otherwise
 */
export function getTodaysGameHashes(gameNumber: number): string[] {
  const today = getDailySeedDate();
  const history = loadHistory();
  const todayRecord = history.find(r => r.date === today);
  
  if (todayRecord && todayRecord.games[gameNumber]) {
    return todayRecord.games[gameNumber];
  }
  
  return [];
}

/**
 * Clear all dedup history (for testing/debugging)
 */
export function clearDedupHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[TriviaDedup] History cleared');
  } catch (e) {
    console.warn('[TriviaDedup] Failed to clear history:', e);
  }
}

/**
 * Get dedup statistics for debugging
 */
export function getDedupStats(): {
  totalRecords: number;
  totalHashes: number;
  oldestDate: string | null;
  newestDate: string | null;
} {
  const history = loadHistory();
  let totalHashes = 0;
  let oldestDate: string | null = null;
  let newestDate: string | null = null;
  
  for (const record of history) {
    for (const hashes of Object.values(record.games)) {
      totalHashes += hashes.length;
    }
    if (!oldestDate || record.date < oldestDate) {
      oldestDate = record.date;
    }
    if (!newestDate || record.date > newestDate) {
      newestDate = record.date;
    }
  }
  
  return {
    totalRecords: history.length,
    totalHashes,
    oldestDate,
    newestDate,
  };
}

