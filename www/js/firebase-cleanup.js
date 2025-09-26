/**
 * Firebase Cleanup Script - Clean out bloated data and migrate to optimized structure
 * Purpose: Remove old bloated data from Firebase and migrate to optimized structure
 * Data Source: Firebase Firestore user documents
 * Update Path: Run once to clean up existing data
 * Dependencies: Firebase Auth, Firestore, DataOptimizer
 */

(function () {
  'use strict';

  /**
   * Clean up Firebase data by removing bloated fields
   */
  async function cleanupFirebaseData() {
    try {
      console.log('🧹 Starting Firebase cleanup...');

      // Check if user is authenticated
      const user = window.firebase?.auth?.currentUser;
      if (!user) {
        console.error('❌ No authenticated user found');
        return false;
      }

      console.log('✅ User authenticated:', user.email);

      // Get Firebase services
      const db = window.firebase.firestore();
      const userRef = db.collection('users').doc(user.uid);

      // Get current document
      const doc = await userRef.get();
      if (!doc.exists) {
        console.log('ℹ️ No user document found');
        return true;
      }

      const currentData = doc.data();
      console.log(
        '📊 Current document size:',
        Math.round(JSON.stringify(currentData).length / 1024),
        'KB',
      );

      // Check if already optimized
      if (currentData.data_v >= 1) {
        console.log('✅ Data already optimized (data_v >= 1)');
        return true;
      }

      // Clean up watchlists
      const cleanedData = {
        ...currentData,
        watchlists: {
          tv: {
            watching: (currentData.watchlists?.tv?.watching || []).map((item) =>
              cleanItem(item, 'watching'),
            ),
            wishlist: (currentData.watchlists?.tv?.wishlist || []).map((item) =>
              cleanItem(item, 'wishlist'),
            ),
            watched: (currentData.watchlists?.tv?.watched || []).map((item) =>
              cleanItem(item, 'watched'),
            ),
          },
          movies: {
            watching: (currentData.watchlists?.movies?.watching || []).map((item) =>
              cleanItem(item, 'watching'),
            ),
            wishlist: (currentData.watchlists?.movies?.wishlist || []).map((item) =>
              cleanItem(item, 'wishlist'),
            ),
            watched: (currentData.watchlists?.movies?.watched || []).map((item) =>
              cleanItem(item, 'watched'),
            ),
          },
        },
        data_v: 1, // Mark as optimized
        lastUpdated: window.firebase.firestore.FieldValue.serverTimestamp(),
      };

      // Remove null items
      Object.keys(cleanedData.watchlists).forEach((mediaType) => {
        Object.keys(cleanedData.watchlists[mediaType]).forEach((listType) => {
          cleanedData.watchlists[mediaType][listType] = cleanedData.watchlists[mediaType][
            listType
          ].filter((item) => item !== null);
        });
      });

      const newSize = JSON.stringify(cleanedData).length;
      const reduction = Math.round((1 - newSize / JSON.stringify(currentData).length) * 100);

      console.log('📊 New document size:', Math.round(newSize / 1024), 'KB');
      console.log('📊 Size reduction:', reduction + '%');

      if (newSize > 1048576) {
        console.error('❌ Document still too large after cleanup');
        return false;
      }

      // Save cleaned data
      await userRef.set(cleanedData, { merge: true });
      console.log('✅ Firebase cleanup complete');

      return true;
    } catch (error) {
      console.error('❌ Firebase cleanup failed:', error);
      return false;
    }
  }

  /**
   * Clean a single item by removing bloated fields
   */
  function cleanItem(item, listType) {
    if (!item || typeof item !== 'object') return null;

    const mediaType = item.media_type || (item.name ? 'tv' : 'movie');
    const itemId = item.id;

    return {
      // Core identification
      id: itemId,
      media_type: mediaType,

      // Display essentials
      title: item.title || item.name,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      release_date: item.release_date || item.first_air_date,

      // User experience
      vote_average: item.vote_average,
      overview: item.overview,

      // User data
      added_date: item.added_date || Date.now(),
      user_notes: item.user_notes || '',
      user_rating: item.user_rating || null,

      // List management
      list_type: listType,
      last_watched: item.last_watched || null,
      watch_count: item.watch_count || 0,

      // High-leverage system fields
      compound_id: `${mediaType}:${itemId}`,
      data_v: 1,
      origin: item.origin || 'migrated',
    };
  }

  /**
   * Backup current data before cleanup
   */
  async function backupCurrentData() {
    try {
      const user = window.firebase?.auth?.currentUser;
      if (!user) return false;

      const db = window.firebase.firestore();
      const userRef = db.collection('users').doc(user.uid);
      const doc = await userRef.get();

      if (doc.exists) {
        const data = doc.data();
        const backup = {
          ...data,
          backup_date: new Date().toISOString(),
          backup_reason: 'pre_cleanup',
        };

        // Save backup to localStorage
        localStorage.setItem('flicklet-backup-pre-cleanup', JSON.stringify(backup));
        console.log('✅ Data backed up to localStorage');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      return false;
    }
  }

  // Expose to global scope
  window.FirebaseCleanup = {
    cleanupFirebaseData,
    backupCurrentData,
    cleanItem,
  };

  // Auto-cleanup on load if needed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Check if cleanup is needed
      const user = window.firebase?.auth?.currentUser;
      if (user) {
        checkAndCleanup();
      }
    });
  } else {
    const user = window.firebase?.auth?.currentUser;
    if (user) {
      checkAndCleanup();
    }
  }

  async function checkAndCleanup() {
    try {
      const db = window.firebase.firestore();
      const user = window.firebase.auth.currentUser;
      const userRef = db.collection('users').doc(user.uid);
      const doc = await userRef.get();

      if (doc.exists) {
        const data = doc.data();
        const size = JSON.stringify(data).length;

        if (size > 1048576 || (data.data_v || 0) < 1) {
          console.log('🧹 Firebase cleanup needed - document size:', Math.round(size / 1024), 'KB');
          console.log('Run: window.FirebaseCleanup.cleanupFirebaseData()');
        }
      }
    } catch (error) {
      console.warn('Could not check Firebase cleanup status:', error);
    }
  }
})();
