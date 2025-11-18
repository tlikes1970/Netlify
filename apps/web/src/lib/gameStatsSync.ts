/**
 * Process: Game Stats Cloud Sync
 * Purpose: Sync game statistics to/from Firebase Firestore
 * Data Source: localStorage game stats, Firebase users/{uid}/gameStats
 * Update Path: Save on game completion, load on sign-in
 * Dependencies: firebaseBootstrap.ts, firebaseSync.ts
 */

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseBootstrap';
import { getFlickWordStatsKey, getTriviaStatsKey } from './cacheKeys';

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
 * Save game stats to Firebase
 */
export async function saveGameStatsToFirebase(uid: string): Promise<boolean> {
  try {
    if (!db) {
      console.warn('⚠️ Firestore not available, skipping game stats sync');
      return false;
    }

    // Get stats from localStorage
    const flickwordStats = JSON.parse(localStorage.getItem(getFlickWordStatsKey()) || '{}');
    const triviaStats = JSON.parse(localStorage.getItem(getTriviaStatsKey()) || '{}');

    // Only sync if we have actual stats
    if (!flickwordStats.games && !triviaStats.games) {
      console.log('📊 No game stats to sync');
      return false;
    }

    const gameStats: GameStats = {};
    if (flickwordStats.games) {
      gameStats.flickword = {
        games: flickwordStats.games || 0,
        wins: flickwordStats.wins || 0,
        losses: flickwordStats.losses || 0,
        streak: flickwordStats.streak || 0,
        maxStreak: flickwordStats.maxStreak || 0,
      };
    }
    if (triviaStats.games) {
      gameStats.trivia = {
        games: triviaStats.games || 0,
        wins: triviaStats.wins || 0,
        losses: triviaStats.losses || 0,
        correct: triviaStats.correct || 0,
        total: triviaStats.total || 0,
        streak: triviaStats.streak || 0,
        maxStreak: triviaStats.maxStreak || 0,
      };
    }

    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      gameStats,
      gameStatsLastUpdated: serverTimestamp(),
    }, { merge: true });

    console.log('✅ Game stats synced to Firebase');
    return true;
  } catch (error) {
    console.error('❌ Failed to sync game stats to Firebase:', error);
    return false;
  }
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

    // Dispatch events to update UI
    window.dispatchEvent(new CustomEvent('flickword:stats-updated'));
    window.dispatchEvent(new CustomEvent('trivia:statsUpdated'));

    return true;
  } catch (error) {
    console.error('❌ Failed to load game stats from Firebase:', error);
    return false;
  }
}

/**
 * Sync game stats to Firebase (called after stats update)
 */
export async function syncGameStats(uid: string): Promise<void> {
  // Debounce sync calls
  if (syncGameStats.timeout) {
    clearTimeout(syncGameStats.timeout);
  }

  syncGameStats.timeout = setTimeout(async () => {
    await saveGameStatsToFirebase(uid);
  }, 1000); // 1 second debounce
}

// Add timeout property to function
(syncGameStats as any).timeout = null as NodeJS.Timeout | null;

