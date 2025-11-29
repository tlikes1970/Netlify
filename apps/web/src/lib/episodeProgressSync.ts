/**
 * Process: Episode Progress Sync
 * Purpose: Sync episode progress tracking to/from Firebase for cross-device synchronization
 * Data Source: localStorage (episode-progress-{showId}) and Firebase (users/{uid}/episodeProgress/{showId})
 * Update Path: EpisodeTrackingModal.saveEpisodeProgress() → syncEpisodeProgressToFirebase()
 * Dependencies: Firebase Firestore, authManager
 */

import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseBootstrap';
import { authManager } from './auth';

/**
 * Sync episode progress to Firebase
 * Called when episode progress is saved
 */
export async function syncEpisodeProgressToFirebase(showId: number): Promise<void> {
  try {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      // User not logged in, skip sync
      return;
    }

    // Get episode progress from localStorage
    const saved = localStorage.getItem(`episode-progress-${showId}`);
    if (!saved) {
      // No progress to sync
      return;
    }

    const progressData = JSON.parse(saved);
    
    // Save to Firebase
    const firebaseDb = db;
    const progressRef = doc(firebaseDb, 'users', currentUser.uid, 'episodeProgress', String(showId));
    
    await setDoc(progressRef, {
      showId: showId,
      episodes: progressData.episodes || {},
      totalEpisodes: progressData.totalEpisodes || 0,
      lastUpdated: new Date().toISOString(),
    }, { merge: true });

    console.log(`✅ Synced episode progress for show ${showId} to Firebase`);
  } catch (error) {
    console.error(`❌ Failed to sync episode progress for show ${showId}:`, error);
  }
}

/**
 * Load episode progress from Firebase and merge with local
 * Called on login to sync progress across devices
 */
export async function loadEpisodeProgressFromFirebase(uid: string): Promise<void> {
  try {
    const firebaseDb = db;
    const progressCollection = collection(firebaseDb, 'users', uid, 'episodeProgress');
    const progressSnapshot = await getDocs(progressCollection);

    if (progressSnapshot.empty) {
      console.log('📭 No episode progress found in Firebase');
      return;
    }

    let loadedCount = 0;
    let updatedCount = 0;

    progressSnapshot.forEach((docSnapshot) => {
      const progressData = docSnapshot.data();
      const showId = progressData.showId || parseInt(docSnapshot.id);
      
      if (!showId) {
        console.warn('⚠️ Invalid episode progress data:', docSnapshot.id);
        return;
      }

      // Check if local progress exists
      const localKey = `episode-progress-${showId}`;
      const localSaved = localStorage.getItem(localKey);
      
      if (localSaved) {
        // Merge: Use cloud data if it's newer, otherwise keep local
        try {
          const localData = JSON.parse(localSaved);
          const cloudEpisodes = progressData.episodes || {};
          const localEpisodes = localData.episodes || localData;
          
          // Merge episodes (cloud wins for conflicts)
          const mergedEpisodes = { ...localEpisodes, ...cloudEpisodes };
          
          // Use cloud totalEpisodes if available, otherwise keep local
          const totalEpisodes = progressData.totalEpisodes || localData.totalEpisodes || 0;
          
          localStorage.setItem(localKey, JSON.stringify({
            episodes: mergedEpisodes,
            totalEpisodes: totalEpisodes,
          }));
          
          updatedCount++;
          console.log(`🔄 Merged episode progress for show ${showId}`);
        } catch (error) {
          console.warn(`⚠️ Failed to merge episode progress for show ${showId}:`, error);
        }
      } else {
        // No local data, use cloud data
        localStorage.setItem(localKey, JSON.stringify({
          episodes: progressData.episodes || {},
          totalEpisodes: progressData.totalEpisodes || 0,
        }));
        
        loadedCount++;
        console.log(`➕ Loaded episode progress for show ${showId} from Firebase`);
      }
    });

    console.log(`✅ Episode progress loaded: ${loadedCount} new, ${updatedCount} merged`);
  } catch (error) {
    console.error('❌ Failed to load episode progress from Firebase:', error);
  }
}

/**
 * Sync all episode progress to Firebase
 * Called periodically or on logout to ensure all progress is synced
 */
export async function syncAllEpisodeProgressToFirebase(): Promise<void> {
  try {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      return;
    }

    // Find all episode progress keys in localStorage
    const progressKeys: number[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('episode-progress-')) {
        const showId = parseInt(key.replace('episode-progress-', ''));
        if (!isNaN(showId)) {
          progressKeys.push(showId);
        }
      }
    }

    // Sync each show's progress
    for (const showId of progressKeys) {
      await syncEpisodeProgressToFirebase(showId);
    }

    console.log(`✅ Synced ${progressKeys.length} episode progress entries to Firebase`);
  } catch (error) {
    console.error('❌ Failed to sync all episode progress:', error);
  }
}


