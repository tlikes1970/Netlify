import { isRestoring } from './restoreBarrier';
/**
 * Process: Game Stats Cloud Sync
 * Purpose: Preserve historical statistics when loading account data
 * Data Source: localStorage game stats, Firebase users/{uid}/gameStats
 * Update Path: Load historical data on sign-in
 * Dependencies: firebaseBootstrap.ts, firebaseSync.ts
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseBootstrap';
// Keep historical statistics loadable for backup compatibility.
const getFlickWordStatsKey = () => 'flickword:stats';
const getTriviaStatsKey = () => 'trivia:stats';



export interface GameStats {
  flickword?: {
    games: number;
    wins: number;
    losses: number;
    streak: number;
    maxStreak: number;
  };
  trivia?: {
    games: number;
    wins: number;
    losses: number;
    correct: number;
    total: number;
    streak: number;
    maxStreak: number;
  };
}

/**
 * Load game stats from Firebase and merge with local
 */
export async function loadGameStatsFromFirebase(uid: string): Promise<boolean> {
  try {
    if (!db) {
      console.warn('⚠️ Firestore not available, skipping game stats load');
      return false;
    }

    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (isRestoring()) return false;
    if (!userDoc.exists()) {
      console.log('📭 No Firebase data found for user');
      return false;
    }

    const cloudData = userDoc.data();
    const cloudStats = cloudData.gameStats as GameStats | undefined;

    if (!cloudStats) {
      console.log('📭 No game stats in cloud data');
      return false;
    }

    // Merge cloud stats with local (cloud takes precedence if newer)
    if (cloudStats.flickword) {
      const localStats = JSON.parse(localStorage.getItem(getFlickWordStatsKey()) || '{}');
      const cloudLastUpdated = cloudData.gameStatsLastUpdated?.toMillis?.() || 0;
      const localLastUpdated = localStats.lastUpdated || 0;

      // Use cloud stats if they're newer or if local has no games
      if (cloudLastUpdated > localLastUpdated || !localStats.games) {
        localStorage.setItem(getFlickWordStatsKey(), JSON.stringify({
          ...cloudStats.flickword,
          lastUpdated: cloudLastUpdated,
        }));
        console.log('✅ Loaded FlickWord stats from Firebase');
      }
    }

    if (cloudStats.trivia) {
      const localStats = JSON.parse(localStorage.getItem(getTriviaStatsKey()) || '{}');
      const cloudLastUpdated = cloudData.gameStatsLastUpdated?.toMillis?.() || 0;
      const localLastUpdated = localStats.lastUpdated || 0;

      // Use cloud stats if they're newer or if local has no games
      if (cloudLastUpdated > localLastUpdated || !localStats.games) {
        localStorage.setItem(getTriviaStatsKey(), JSON.stringify({
          ...cloudStats.trivia,
          lastUpdated: cloudLastUpdated,
        }));
        console.log('✅ Loaded Trivia stats from Firebase');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to load game stats from Firebase:', error);
    return false;
  }
}

