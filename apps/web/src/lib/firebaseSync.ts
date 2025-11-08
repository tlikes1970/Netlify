import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseBootstrap';
import type { LibraryEntry } from './storage';

/**
 * Firebase Sync Manager for V2
 * Handles syncing watchlists to/from Firestore with lean data structure
 * Based on V1 implementation with size limits and data pruning
 */

export class FirebaseSyncManager {
  private static instance: FirebaseSyncManager;
  private isInitialized = false;
  private syncInProgress = false;
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;

  static getInstance(): FirebaseSyncManager {
    if (!FirebaseSyncManager.instance) {
      FirebaseSyncManager.instance = new FirebaseSyncManager();
    }
    return FirebaseSyncManager.instance;
  }

  /**
   * Get Firebase db instance - use direct import
   */
  private getFirebaseDb() {
    return db;
  }

  /**
   * Initialize the sync manager and set up event listeners
   */
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Listen for Library changes
    window.addEventListener('library:changed', (event: Event) => {
      const { uid, operation } = (event as CustomEvent).detail;
      console.log('📡 FirebaseSyncManager received library:changed event:', { uid, operation });
      this.syncToFirebase(uid);
    });
    
    console.log('🔄 FirebaseSyncManager initialized with event listeners');
  }

  /**
   * Prune item data to essential fields only (based on V1 implementation)
   */
  private pruneItem(item: LibraryEntry): any {
    return {
      id: Number(item.id),
      media_type: item.mediaType,
      title: String(item.title || '').slice(0, 200),
      poster_path: item.posterUrl || null,
      release_date: item.year || null,
      vote_average: typeof item.voteAverage === 'number' ? item.voteAverage : null,
      user_rating: typeof item.userRating === 'number' ? item.userRating : null, // V2 addition
      added_date: item.addedAt ? new Date(item.addedAt).toISOString() : null,
      user_notes: item.userNotes || null, // V2 addition for user notes
      user_tags: item.tags || [], // V2 addition for user tags
      next_air_date: item.nextAirDate || null, // V2 addition for TV shows
      synopsis: item.synopsis || null, // V2 addition for show descriptions
      show_status: item.showStatus || null, // V2 addition for TV show status
      last_air_date: item.lastAirDate || null, // V2 addition for TV shows
      networks: item.networks || null, // V2 addition
      production_companies: item.productionCompanies || null, // V2 addition
    };
  }

  /**
   * Create lean watchlists structure for Firebase
   */
  private createLeanWatchlists(): any {
    const watchlists = {
      movies: {
        watching: [],
        wishlist: [],
        watched: [],
      },
      tv: {
        watching: [],
        wishlist: [],
        watched: [],
      },
      customLists: [], // Add custom list definitions
      customItems: {}, // FIXED: Store custom list items separately
    };

    // Get Library data from localStorage to avoid circular import
    try {
      const libraryData = JSON.parse(localStorage.getItem('flicklet.library.v2') || '{}');
      
      // Group by media type and list
      Object.values(libraryData).forEach((item: any) => {
        const prunedItem = this.pruneItem(item);
        
        if (item.list.startsWith('custom:')) {
          // FIXED: Store custom list items in separate structure
          const customListId = item.list.replace('custom:', '');
          if (!(watchlists as any).customItems[customListId]) {
            (watchlists as any).customItems[customListId] = [];
          }
          (watchlists as any).customItems[customListId].push(prunedItem);
        } else {
          // Standard lists (watching, wishlist, watched)
          if (item.mediaType === 'movie') {
            if (watchlists.movies[item.list as keyof typeof watchlists.movies]) {
              (watchlists.movies[item.list as keyof typeof watchlists.movies] as any).push(prunedItem);
            }
          } else if (item.mediaType === 'tv') {
            if (watchlists.tv[item.list as keyof typeof watchlists.tv]) {
              (watchlists.tv[item.list as keyof typeof watchlists.tv] as any).push(prunedItem);
            }
          }
        }
      });
      
      // Add custom list definitions
      const customListsData = localStorage.getItem('flicklet.customLists.v2');
      if (customListsData) {
        try {
          const customLists = JSON.parse(customListsData);
          watchlists.customLists = customLists.customLists || [];
        } catch (error) {
          console.warn('Failed to parse custom lists data:', error);
        }
      }
      
    } catch (error) {
      console.warn('Failed to read Library data from localStorage:', error);
    }

    return watchlists;
  }

  /**
   * Calculate payload size in bytes
   */
  private calculatePayloadSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Save data to Firebase with size limits
   */
  async saveToFirebase(uid: string): Promise<boolean> {
    if (this.syncInProgress) {
      console.log('🔄 Sync already in progress, skipping');
      return false;
    }

    try {
      this.syncInProgress = true;
      console.log('💾 Starting Firebase sync for user:', uid);

      const watchlists = this.createLeanWatchlists();
      const payload = {
        watchlists,
        uid,
        lastUpdated: serverTimestamp(),
      };

      const sizeBytes = this.calculatePayloadSize(payload);
      const sizeKB = sizeBytes / 1024;

      console.log(`📊 Payload size: ${sizeKB.toFixed(1)} KB`);

      // V1 limit: 900KB
      if (sizeBytes > 900 * 1024) {
        console.warn(`⚠️ Payload too large (${sizeKB.toFixed(1)} KB), skipping Firebase save`);
        return false;
      }

      // Save to Firestore
      const firebaseDb = this.getFirebaseDb();
      
      const userRef = doc(firebaseDb, 'users', uid);
      await setDoc(userRef, payload, { merge: true });

      console.log(`✅ Firebase sync successful: ${sizeKB.toFixed(1)} KB`);
      return true;

    } catch (error) {
      console.error('❌ Firebase sync failed:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Load data from Firebase and merge with local
   */
  async loadFromFirebase(uid: string): Promise<boolean> {
    try {
      console.log('📥 Loading data from Firebase for user:', uid);

      const firebaseDb = this.getFirebaseDb();

      const userRef = doc(firebaseDb, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log('📭 No Firebase data found for user');
        return false;
      }

      const cloudData = userDoc.data();
      console.log('☁️ Cloud data loaded:', cloudData);

      if (!cloudData.watchlists) {
        console.log('📭 No watchlists in cloud data');
        return false;
      }

      // Merge cloud data with local Library
      await this.mergeCloudData(cloudData.watchlists);

      console.log('✅ Firebase data loaded and merged');
      return true;

    } catch (error) {
      console.error('❌ Firebase load failed:', error);
      return false;
    }
  }

  /**
   * Merge cloud data with local Library
   */
  private async mergeCloudData(cloudWatchlists: any): Promise<void> {
    const lists = ['watching', 'wishlist', 'watched'] as const;
    
    // Get current Library data from localStorage
    const libraryData = JSON.parse(localStorage.getItem('flicklet.library.v2') || '{}');
    
    // First, clean up any existing duplicates in localStorage
    const cleanedData: Record<string, any> = {};
    const seenIds = new Set<string>();
    
    Object.values(libraryData).forEach((item: any) => {
      const itemId = `${item.mediaType}:${item.id}`;
      if (!seenIds.has(itemId)) {
        seenIds.add(itemId);
        const key = `${item.mediaType}:${item.id}`;
        cleanedData[key] = item;
      } else {
        console.log('🧹 Removing duplicate from localStorage:', item.title);
      }
    });
    
    console.log('🧹 Cleaned localStorage duplicates:', Object.keys(libraryData).length, '→', Object.keys(cleanedData).length);
    
    // Create a set of existing item IDs to prevent duplicates
    const existingIds = new Set<string>();
    Object.values(cleanedData).forEach((item: any) => {
      existingIds.add(`${item.mediaType}:${item.id}`);
    });
    
    console.log('🔍 Existing items before merge:', existingIds.size);
    
    for (const list of lists) {
      // Merge movies
      if (cloudWatchlists.movies?.[list]) {
        for (const cloudItem of cloudWatchlists.movies[list]) {
          const key = `movie:${cloudItem.id}`;
          const itemId = `movie:${cloudItem.id}`;
          
          // Only add if not already in Library
          if (!existingIds.has(itemId)) {
            const localItem = {
              id: String(cloudItem.id),
              mediaType: 'movie',
              title: cloudItem.title,
              year: cloudItem.release_date,
              posterUrl: cloudItem.poster_path,
              voteAverage: cloudItem.vote_average,
              userRating: cloudItem.user_rating || undefined,
              synopsis: cloudItem.synopsis || '',
              list: list,
              addedAt: Date.now(),
            };
            
            cleanedData[key] = localItem;
            existingIds.add(itemId);
            console.log('➕ Added movie:', cloudItem.title);
          } else {
            console.log('⏭️ Skipping duplicate movie:', cloudItem.title);
          }
        }
      }

      // Merge TV shows
      if (cloudWatchlists.tv?.[list]) {
        for (const cloudItem of cloudWatchlists.tv[list]) {
          const key = `tv:${cloudItem.id}`;
          const itemId = `tv:${cloudItem.id}`;
          
          // Only add if not already in Library
          if (!existingIds.has(itemId)) {
            const localItem = {
              id: String(cloudItem.id),
              mediaType: 'tv',
              title: cloudItem.title,
              year: cloudItem.release_date,
              posterUrl: cloudItem.poster_path,
              voteAverage: cloudItem.vote_average,
              userRating: cloudItem.user_rating || undefined,
              synopsis: cloudItem.synopsis || '',
              showStatus: cloudItem.show_status,
              lastAirDate: cloudItem.last_air_date,
              nextAirDate: cloudItem.next_air_date,
              networks: cloudItem.networks,
              productionCompanies: cloudItem.production_companies,
              list: list,
              addedAt: Date.now(),
            };
            
            cleanedData[key] = localItem;
            existingIds.add(itemId);
            console.log('➕ Added TV show:', cloudItem.title);
          } else {
            console.log('⏭️ Skipping duplicate TV show:', cloudItem.title);
          }
        }
      }
    }
    
    // FIXED: Merge custom list items
    if (cloudWatchlists.customItems && typeof cloudWatchlists.customItems === 'object') {
      for (const [customListId, items] of Object.entries(cloudWatchlists.customItems)) {
        if (Array.isArray(items)) {
          for (const cloudItem of items) {
            const key = `${cloudItem.media_type}:${cloudItem.id}`;
            const itemId = `${cloudItem.media_type}:${cloudItem.id}`;
            
            // Only add if not already in Library
            if (!existingIds.has(itemId)) {
              const localItem = {
                id: String(cloudItem.id),
                mediaType: cloudItem.media_type,
                title: cloudItem.title || cloudItem.name,
                year: cloudItem.release_date || cloudItem.first_air_date,
                posterUrl: cloudItem.poster_path,
                voteAverage: cloudItem.vote_average,
                userRating: cloudItem.user_rating || undefined,
                synopsis: cloudItem.synopsis || '',
                showStatus: cloudItem.show_status,
                lastAirDate: cloudItem.last_air_date,
                nextAirDate: cloudItem.next_air_date,
                networks: cloudItem.networks,
                productionCompanies: cloudItem.production_companies,
                list: `custom:${customListId}`,
                addedAt: Date.now(),
              };
              
              cleanedData[key] = localItem;
              existingIds.add(itemId);
              console.log(`➕ Added custom list item: ${cloudItem.title || cloudItem.name} to ${customListId}`);
            } else {
              console.log(`⏭️ Skipping duplicate custom item: ${cloudItem.title || cloudItem.name}`);
            }
          }
        }
      }
    }
    
    console.log('🔍 Total items after merge:', Object.keys(cleanedData).length);
    
    // Save cleaned data back to localStorage
    localStorage.setItem('flicklet.library.v2', JSON.stringify(cleanedData));
    
    // Restore custom lists if they exist in cloud data
    if (cloudWatchlists.customLists && Array.isArray(cloudWatchlists.customLists)) {
      try {
        const existingCustomLists = JSON.parse(localStorage.getItem('flicklet.customLists.v2') || '{}');
        const mergedCustomLists = {
          ...existingCustomLists,
          customLists: cloudWatchlists.customLists
        };
        localStorage.setItem('flicklet.customLists.v2', JSON.stringify(mergedCustomLists));
        console.log('📋 Restored custom lists from cloud:', cloudWatchlists.customLists.length);
        
        // Trigger custom lists update event
        window.dispatchEvent(new CustomEvent('customLists:updated'));
      } catch (error) {
        console.warn('Failed to restore custom lists:', error);
      }
    }
    
    // Reload Library state from localStorage to ensure UI updates
    const { Library } = await import('./storage');
    Library.reloadFromStorage();
    
    // Trigger Library update event (single event is sufficient - no need for second reload)
    window.dispatchEvent(new CustomEvent('library:updated'));
  }

  /**
   * Sync data to Firebase (called after Library changes)
   */
  async syncToFirebase(uid: string): Promise<void> {
    console.log('🔄 syncToFirebase called for uid:', uid);
    if (!this.isInitialized) {
      console.log('⚠️ FirebaseSyncManager not initialized');
      return;
    }

    // Debounce sync calls
    if (this.syncTimeout) {
      console.log('⏳ Sync already queued, clearing previous timeout');
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(async () => {
      console.log('🚀 Executing Firebase sync...');
      await this.saveToFirebase(uid);
    }, 1000); // 1 second debounce
  }
}

// Export singleton instance
export const firebaseSyncManager = FirebaseSyncManager.getInstance();