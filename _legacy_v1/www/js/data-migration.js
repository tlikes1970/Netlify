/**
 * Data Migration Utility - v28.81
 * Migrates from old data structure to Firebase standard (watchlists.*)
 */

(function() {
  'use strict';
  
  const NS = '[data-migration]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  /**
   * Migrates appData from old structure to Firebase standard
   * Old: { movies: { watching: [], wishlist: [], watched: [] }, tv: { ... } }
   * New: { watchlists: { movies: { watching: [], wishlist: [], watched: [] }, tv: { ... } } }
   */
  function migrateToFirebaseStructure(appData) {
    if (!appData || typeof appData !== 'object') {
      log('No appData to migrate');
      return appData;
    }

    // Check if already migrated
    if (appData.watchlists) {
      log('Data already in Firebase structure');
      return appData;
    }

    log('Migrating data to Firebase structure...');
    
    const migrated = { ...appData };
    
    // Create watchlists structure
    migrated.watchlists = {
      movies: {
        watching: Array.isArray(appData.movies?.watching) ? appData.movies.watching : [],
        wishlist: Array.isArray(appData.movies?.wishlist) ? appData.movies.wishlist : [],
        watched: Array.isArray(appData.movies?.watched) ? appData.movies.watched : []
      },
      tv: {
        watching: Array.isArray(appData.tv?.watching) ? appData.tv.watching : [],
        wishlist: Array.isArray(appData.tv?.wishlist) ? appData.tv.wishlist : [],
        watched: Array.isArray(appData.tv?.watched) ? appData.tv.watched : []
      }
    };

    // Keep old structure for backward compatibility during transition
    // This will be removed in a future version
    migrated.movies = migrated.watchlists.movies;
    migrated.tv = migrated.watchlists.tv;

    log('Migration complete:', {
      movies: {
        watching: migrated.watchlists.movies.watching.length,
        wishlist: migrated.watchlists.movies.wishlist.length,
        watched: migrated.watchlists.movies.watched.length
      },
      tv: {
        watching: migrated.watchlists.tv.watching.length,
        wishlist: migrated.watchlists.tv.wishlist.length,
        watched: migrated.watchlists.tv.watched.length
      }
    });

    return migrated;
  }

  /**
   * Migrates appData from Firebase structure back to old structure (for compatibility)
   */
  function migrateFromFirebaseStructure(appData) {
    if (!appData || typeof appData !== 'object') {
      return appData;
    }

    // If no watchlists structure, return as-is
    if (!appData.watchlists) {
      return appData;
    }

    log('Migrating from Firebase structure for compatibility...');
    
    const migrated = { ...appData };
    
    // Extract watchlists to top level
    if (appData.watchlists.movies) {
      migrated.movies = appData.watchlists.movies;
    }
    if (appData.watchlists.tv) {
      migrated.tv = appData.watchlists.tv;
    }

    return migrated;
  }

  /**
   * Ensures data consistency between old and new structures
   */
  function ensureDataConsistency(appData) {
    if (!appData || typeof appData !== 'object') {
      return appData;
    }

    // If we have both structures, sync them
    if (appData.watchlists && (appData.movies || appData.tv)) {
      log('Syncing data between old and new structures...');
      
      // Sync movies
      if (appData.watchlists.movies && appData.movies) {
        appData.movies = appData.watchlists.movies;
      }
      
      // Sync tv
      if (appData.watchlists.tv && appData.tv) {
        appData.tv = appData.watchlists.tv;
      }
    }

    return appData;
  }

  /**
   * Validates data structure integrity
   */
  function validateDataStructure(appData) {
    if (!appData || typeof appData !== 'object') {
      return { valid: false, errors: ['No appData provided'] };
    }

    const errors = [];
    
    // Check for required structures
    const hasWatchlists = !!appData.watchlists;
    const hasMovies = !!appData.movies;
    const hasTv = !!appData.tv;
    
    if (!hasWatchlists && !hasMovies && !hasTv) {
      errors.push('No valid data structure found');
    }

    // Validate watchlists structure if present
    if (hasWatchlists) {
      if (!appData.watchlists.movies || !appData.watchlists.tv) {
        errors.push('Incomplete watchlists structure');
      } else {
        // Validate movies structure
        const movies = appData.watchlists.movies;
        if (!Array.isArray(movies.watching) || !Array.isArray(movies.wishlist) || !Array.isArray(movies.watched)) {
          errors.push('Invalid movies structure in watchlists');
        }
        
        // Validate tv structure
        const tv = appData.watchlists.tv;
        if (!Array.isArray(tv.watching) || !Array.isArray(tv.wishlist) || !Array.isArray(tv.watched)) {
          errors.push('Invalid tv structure in watchlists');
        }
      }
    }

    // Validate old structure if present
    if (hasMovies) {
      if (!Array.isArray(appData.movies.watching) || !Array.isArray(appData.movies.wishlist) || !Array.isArray(appData.movies.watched)) {
        errors.push('Invalid movies structure');
      }
    }
    
    if (hasTv) {
      if (!Array.isArray(appData.tv.watching) || !Array.isArray(appData.tv.wishlist) || !Array.isArray(appData.tv.watched)) {
        errors.push('Invalid tv structure');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      hasWatchlists,
      hasMovies,
      hasTv
    };
  }

  /**
   * Performs complete data migration and validation
   */
  function performMigration(appData) {
    log('Starting data migration process...');
    
    // Step 1: Migrate to Firebase structure
    let migrated = migrateToFirebaseStructure(appData);
    
    // Step 2: Ensure consistency
    migrated = ensureDataConsistency(migrated);
    
    // Step 3: Validate structure
    const validation = validateDataStructure(migrated);
    
    if (!validation.valid) {
      err('Data validation failed:', validation.errors);
      return { success: false, errors: validation.errors, data: migrated };
    }
    
    log('Data migration completed successfully');
    return { success: true, data: migrated, validation };
  }

  // Export functions
  window.DataMigration = {
    migrateToFirebaseStructure,
    migrateFromFirebaseStructure,
    ensureDataConsistency,
    validateDataStructure,
    performMigration
  };

  log('Data migration utility loaded');
})();
