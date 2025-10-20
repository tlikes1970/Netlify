/**
 * Firebase Data Migration - Document Size Fix
 *
 * This module handles migrating large Firebase documents to subcollections
 * to stay within Firestore's 1MB document size limit.
 */

(function () {
  'use strict';

  // Migration status tracking
  let migrationStatus = {
    isMigrating: false,
    hasMigrated: false,
    lastMigration: null,
  };

  // Check if migration is needed
  function needsMigration() {
    const data = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
    const dataSize = JSON.stringify(data).length;
    return dataSize > 1048576; // 1MB limit
  }

  // Migrate data to subcollections
  async function migrateToSubcollections() {
    if (migrationStatus.isMigrating) {
      console.log('🔄 Migration already in progress...');
      return;
    }

    migrationStatus.isMigrating = true;
    console.log('🚀 Starting Firebase data migration to subcollections...');

    try {
      const user = await window.ensureUser();
      const uid = user.uid;
      const db = window.firebaseDb;

      if (!db) {
        throw new Error('Firebase not available');
      }

      const data = JSON.parse(localStorage.getItem('flicklet-data') || '{}');

      // Create subcollection references
      const subcollections = {
        'tv-watching': db.collection(`users/${uid}/watchlists/tv/watching`),
        'tv-wishlist': db.collection(`users/${uid}/watchlists/tv/wishlist`),
        'tv-watched': db.collection(`users/${uid}/watchlists/tv/watched`),
        'movies-watching': db.collection(`users/${uid}/watchlists/movies/watching`),
        'movies-wishlist': db.collection(`users/${uid}/watchlists/movies/wishlist`),
        'movies-watched': db.collection(`users/${uid}/watchlists/movies/watched`),
      };

      // Migrate each list
      const migrationPromises = [];

      // TV Lists
      if (data.tv?.watching?.length > 0) {
        migrationPromises.push(
          batchWriteItems(subcollections['tv-watching'], data.tv.watching, 'tv-watching'),
        );
      }
      if (data.tv?.wishlist?.length > 0) {
        migrationPromises.push(
          batchWriteItems(subcollections['tv-wishlist'], data.tv.wishlist, 'tv-wishlist'),
        );
      }
      if (data.tv?.watched?.length > 0) {
        migrationPromises.push(
          batchWriteItems(subcollections['tv-watched'], data.tv.watched, 'tv-watched'),
        );
      }

      // Movies Lists
      if (data.movies?.watching?.length > 0) {
        migrationPromises.push(
          batchWriteItems(
            subcollections['movies-watching'],
            data.movies.watching,
            'movies-watching',
          ),
        );
      }
      if (data.movies?.wishlist?.length > 0) {
        migrationPromises.push(
          batchWriteItems(
            subcollections['movies-wishlist'],
            data.movies.wishlist,
            'movies-wishlist',
          ),
        );
      }
      if (data.movies?.watched?.length > 0) {
        migrationPromises.push(
          batchWriteItems(subcollections['movies-watched'], data.movies.watched, 'movies-watched'),
        );
      }

      // Execute all migrations
      await Promise.all(migrationPromises);

      // Update main document with just settings and metadata
      const mainDocData = {
        settings: data.settings || {},
        pro: data.settings?.pro || false,
        lastUpdated: window.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date(),
        migrationVersion: '2.0',
        migratedAt: new Date().toISOString(),
      };

      await db.collection('users').doc(uid).set(mainDocData, { merge: true });

      // Update migration status
      migrationStatus.hasMigrated = true;
      migrationStatus.lastMigration = new Date().toISOString();
      localStorage.setItem('flicklet-migration-status', JSON.stringify(migrationStatus));

      console.log('✅ Firebase data migration completed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return false;
    } finally {
      migrationStatus.isMigrating = false;
    }
  }

  // Batch write items to subcollection
  async function batchWriteItems(collectionRef, items, listName) {
    console.log(`📦 Migrating ${items.length} items to ${listName}...`);

    const batch = window.firebaseDb.batch();
    const batchSize = 500; // Firestore batch limit

    for (let i = 0; i < items.length; i += batchSize) {
      const batchItems = items.slice(i, i + batchSize);

      batchItems.forEach((item, index) => {
        const docRef = collectionRef.doc(`${item.id}_${i + index}`);
        batch.set(docRef, {
          ...item,
          migratedAt: new Date().toISOString(),
          originalIndex: i + index,
        });
      });

      await batch.commit();
      console.log(`✅ Migrated batch ${Math.floor(i / batchSize) + 1} of ${listName}`);
    }

    console.log(`✅ Completed migration of ${listName}: ${items.length} items`);
  }

  // Load data from subcollections
  async function loadFromSubcollections() {
    try {
      const user = await window.ensureUser();
      const uid = user.uid;
      const db = window.firebaseDb;

      if (!db) {
        throw new Error('Firebase not available');
      }

      console.log('📥 Loading data from subcollections...');

      // Load from subcollections
      const subcollections = {
        'tv-watching': db.collection(`users/${uid}/watchlists/tv/watching`),
        'tv-wishlist': db.collection(`users/${uid}/watchlists/tv/wishlist`),
        'tv-watched': db.collection(`users/${uid}/watchlists/tv/watched`),
        'movies-watching': db.collection(`users/${uid}/watchlists/movies/watching`),
        'movies-wishlist': db.collection(`users/${uid}/watchlists/movies/wishlist`),
        'movies-watched': db.collection(`users/${uid}/watchlists/movies/watched`),
      };

      const data = {
        tv: { watching: [], wishlist: [], watched: [] },
        movies: { watching: [], wishlist: [], watched: [] },
        settings: {},
      };

      // Load each subcollection
      for (const [key, collection] of Object.entries(subcollections)) {
        const snapshot = await collection.get();
        const items = snapshot.docs.map((doc) => {
          const item = doc.data();
          delete item.migratedAt;
          delete item.originalIndex;
          return item;
        });

        if (key.startsWith('tv-')) {
          const listName = key.replace('tv-', '');
          data.tv[listName] = items;
        } else if (key.startsWith('movies-')) {
          const listName = key.replace('movies-', '');
          data.movies[listName] = items;
        }
      }

      // Load settings from main document
      const mainDoc = await db.collection('users').doc(uid).get();
      if (mainDoc.exists()) {
        data.settings = mainDoc.data().settings || {};
      }

      // Update localStorage
      localStorage.setItem('flicklet-data', JSON.stringify(data));

      // Update window.appData
      if (typeof window.loadAppData === 'function') {
        window.loadAppData();
      }

      console.log('✅ Data loaded from subcollections successfully!');
      return data;
    } catch (error) {
      console.error('❌ Failed to load from subcollections:', error);
      return null;
    }
  }

  // Check migration status
  function getMigrationStatus() {
    const saved = localStorage.getItem('flicklet-migration-status');
    if (saved) {
      migrationStatus = { ...migrationStatus, ...JSON.parse(saved) };
    }
    return migrationStatus;
  }

  // Auto-migrate if needed
  async function autoMigrate() {
    const status = getMigrationStatus();

    if (status.hasMigrated) {
      console.log('✅ Data already migrated, loading from subcollections...');
      return await loadFromSubcollections();
    }

    if (needsMigration()) {
      console.log('🚨 Large document detected, starting migration...');
      const success = await migrateToSubcollections();
      if (success) {
        return await loadFromSubcollections();
      }
    }

    return null;
  }

  // Export API
  window.FirebaseMigration = {
    needsMigration,
    migrateToSubcollections,
    loadFromSubcollections,
    getMigrationStatus,
    autoMigrate,
  };

  console.log('🔄 Firebase Migration module loaded');
})();
