/**
 * Process: Tab State Sync
 * Purpose: Sync tab state (sort, filters, custom order) to/from Firebase for cross-device synchronization
 * Data Source: localStorage (flk.tab.{tabKey}.*) and Firebase (users/{uid}/tabState/{tabKey})
 * Update Path: saveTabState() → syncTabStateToFirebase()
 * Dependencies: Firebase Firestore, authManager, tabState.ts
 */

import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseBootstrap';
import { authManager } from './auth';
import type { TabState } from './tabState';

/**
 * Sync tab state to Firebase
 * Called when tab state is saved
 */
export async function syncTabStateToFirebase(tabKey: string, state: TabState): Promise<void> {
  try {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      // User not logged in, skip sync
      return;
    }

    // Save to Firebase
    const firebaseDb = db;
    const tabStateRef = doc(firebaseDb, 'users', currentUser.uid, 'tabState', tabKey);
    
    await setDoc(tabStateRef, {
      tabKey: tabKey,
      sort: state.sort,
      filter: state.filter,
      order: state.order,
      lastUpdated: new Date().toISOString(),
    }, { merge: true });

    console.log(`✅ Synced tab state for ${tabKey} to Firebase`);
  } catch (error) {
    console.error(`❌ Failed to sync tab state for ${tabKey}:`, error);
  }
}

/**
 * Load tab state from Firebase and merge with local
 * Called on login to sync tab state across devices
 */
export async function loadTabStateFromFirebase(uid: string): Promise<void> {
  try {
    const firebaseDb = db;
    const tabStateCollection = collection(firebaseDb, 'users', uid, 'tabState');
    const tabStateSnapshot = await getDocs(tabStateCollection);

    if (tabStateSnapshot.empty) {
      console.log('📭 No tab state found in Firebase');
      return;
    }

    let loadedCount = 0;

    tabStateSnapshot.forEach((docSnapshot) => {
      const tabStateData = docSnapshot.data();
      const tabKey = tabStateData.tabKey || docSnapshot.id;
      
      if (!tabKey) {
        console.warn('⚠️ Invalid tab state data:', docSnapshot.id);
        return;
      }

      // Save to localStorage (Firebase wins for tab state)
      if (tabStateData.sort) {
        localStorage.setItem(`flk.tab.${tabKey}.sort`, tabStateData.sort);
      }
      
      if (tabStateData.filter) {
        if (tabStateData.filter.type) {
          localStorage.setItem(`flk.tab.${tabKey}.filter.type`, tabStateData.filter.type);
        }
        if (tabStateData.filter.providers) {
          localStorage.setItem(
            `flk.tab.${tabKey}.filter.providers`,
            JSON.stringify(tabStateData.filter.providers)
          );
        }
      }
      
      if (tabStateData.order) {
        if (tabStateData.order.mode === 'custom' && tabStateData.order.ids) {
          localStorage.setItem(
            `flk.tab.${tabKey}.order.custom`,
            JSON.stringify(tabStateData.order.ids)
          );
        } else {
          localStorage.removeItem(`flk.tab.${tabKey}.order.custom`);
        }
      }
      
      loadedCount++;
      console.log(`➕ Loaded tab state for ${tabKey} from Firebase`);
    });

    console.log(`✅ Tab state loaded: ${loadedCount} tabs`);
  } catch (error) {
    console.error('❌ Failed to load tab state from Firebase:', error);
  }
}


