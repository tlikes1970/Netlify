import React from 'react';
import type { MediaItem, MediaType } from '../components/cards/card.types';
import type { ListName } from '../state/library.types';
import { customListManager } from './customLists';
import { authManager } from './auth';
import { debounce } from './debounce';

const KEY = 'flicklet.library.v2';
const OLD_KEY = 'flicklet:v2:saved';

// Helper function to get current Firebase user
function getCurrentFirebaseUser() {
  try {
    // Use the imported auth manager
    const currentUser = authManager.getCurrentUser();
    if (currentUser) {
      return currentUser;
    }
    
    // Fallback to window auth manager (for compatibility)
    const windowAuthManager = (window as any).authManager;
    if (windowAuthManager?.getCurrentUser) {
      return windowAuthManager.getCurrentUser();
    }
    
    // Fallback to Firebase auth directly
    const firebaseAuth = (window as any).firebase?.auth();
    if (firebaseAuth?.currentUser) {
      return firebaseAuth.currentUser;
    }
    
    return null;
  } catch (error) {
    console.warn('Error getting current user:', error);
    return null;
  }
}

export interface LibraryEntry extends MediaItem {
  list: ListName;
  addedAt: number; // epoch ms
}

// Migration function to convert old data format
function migrateOldData(): State {
  try {
    const oldData = JSON.parse(localStorage.getItem(OLD_KEY) || '[]');
    if (!Array.isArray(oldData) || oldData.length === 0) return {};
    
    const newState: State = {};
    oldData.forEach((item: any) => {
      if (item.id && item.kind && item.status) {
        const key = `${item.kind}:${item.id}`;
        const listName = item.status === 'want' ? 'wishlist' : item.status as ListName;
        newState[key] = {
          id: item.id,
          mediaType: item.kind,
          title: item.title || 'Untitled',
          posterUrl: item.poster,
          list: listName,
          addedAt: item.updatedAt || Date.now(),
        };
      }
    });
    
    // Save migrated data and clear old data
    if (Object.keys(newState).length > 0) {
      localStorage.setItem(KEY, JSON.stringify(newState));
      localStorage.removeItem(OLD_KEY);
    }
    
    return newState;
  } catch {
    return {};
  }
}

type State = Record<string, LibraryEntry>;
const state: State = (() => {
  try { 
    const existing = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (Object.keys(existing).length > 0) return existing;
    return migrateOldData();
  } catch { 
    return migrateOldData();
  }
})();

const subs = new Set<() => void>();

// Listen for library cleared events (when user signs out)
window.addEventListener('library:cleared', () => {
  // Clear the state object
  Object.keys(state).forEach(key => delete state[key]);
  
  // Clear localStorage
  localStorage.removeItem(KEY);
  
  // Notify all subscribers
  emit();
  
  console.log('🧹 Library state cleared for privacy');
});

function k(id: string | number, mediaType: MediaType) { return `${mediaType}:${id}`; }

function save(s: State) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function emit() {
  // React 18+ auto-batches state updates automatically.
  // Keep emit() synchronous for immediate updates - React will batch all setState calls.
  // The batching in notifyUpdate() handles the library:updated event separately.
  subs.forEach(fn => fn());
}

// Debounced persistence with flush capability
// Track pending writes for idempotency
let isSaving = false;
let pendingCustomOrder: { tabKey: string; orderIds: string[] } | null = null;

// Idempotent save function (guarantees one write per burst)
function performSave() {
  if (isSaving) {
    // Already saving, skip to prevent duplicate writes
    if (import.meta.env.DEV) {
      console.info('[reorder] skip: save already in progress');
    }
    return;
  }

  isSaving = true;

  try {
    // Save library state
    save(state);
    emit();

    // Save custom order if pending
    if (pendingCustomOrder) {
      try {
        localStorage.setItem(
          `flk.tab.${pendingCustomOrder.tabKey}.order.custom`,
          JSON.stringify(pendingCustomOrder.orderIds)
        );
        pendingCustomOrder = null;
      } catch (e) {
        console.warn('Failed to save custom order to localStorage:', e);
      }
    }

    if (import.meta.env.DEV) {
      console.info('[reorder] flushed: save + emit + localStorage');
    }
  } catch (error) {
    console.error('[reorder] save failed:', error);
  } finally {
    isSaving = false;
  }
}

// Debounced save function
const debouncedSave = debounce(performSave, 150);

// Queue a custom order save (debounced)
function queueCustomOrderSave(tabKey: string, orderIds: string[]) {
  pendingCustomOrder = { tabKey, orderIds };
  debouncedSave();
}

// Export flush function for external use (e.g., on drop completion, beforeunload)
export function flushPendingSaves() {
  debouncedSave.flush();
}

// Flush on page unload to ensure data is saved
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingSaves();
  });
}

// Helper function to get human-readable list name
export function getListDisplayName(listName: ListName): string {
  switch (listName) {
    case 'watching': return 'Currently Watching';
    case 'wishlist': return 'Want to Watch';
    case 'watched': return 'Watched';
    case 'not': return 'Not Interested';
    default:
      if (listName.startsWith('custom:')) {
        const listId = listName.replace('custom:', '');
        const list = customListManager.getListById(listId);
        return list ? list.name : 'Custom List';
      }
      return 'Unknown List';
  }
}

// Helper function to safely add item to list with duplicate detection
export function addToListWithConfirmation(item: MediaItem, targetList: ListName, onConfirm?: () => void): boolean {
  const currentList = Library.getCurrentList(item.id, item.mediaType);
  
  if (currentList && currentList !== targetList) {
    const currentListName = getListDisplayName(currentList);
    const targetListName = getListDisplayName(targetList);
    
    const confirmed = window.confirm(
      `${item.title} is already in ${currentListName}.\n\nDo you want to move it to ${targetListName}?`
    );
    
    if (confirmed) {
      Library.upsert(item, targetList);
      onConfirm?.();
      return true;
    }
    return false;
  } else {
    // No existing item or same list, proceed normally
    Library.upsert(item, targetList);
    onConfirm?.();
    return true;
  }
}

export const Library = {
  getAll(): LibraryEntry[] {
    return Object.values(state);
  },
  upsert(item: MediaItem, list: ListName) {
    const key = k(item.id, item.mediaType);
    const oldEntry = state[key];
    
    // Filter out undefined values from item to preserve existing data
    // This ensures synopsis, notes, tags etc. aren't accidentally cleared
    const filteredItem = Object.fromEntries(
      Object.entries(item).filter(([_, value]) => value !== undefined)
    ) as Partial<MediaItem>;
    
    // Preserve existing data when updating
    // Only update fields that are explicitly provided (and not undefined)
    state[key] = {
      ...(oldEntry || {}), // Keep all existing data
      ...filteredItem,      // Apply only defined fields from new item
      id: item.id,          // Always use current id and mediaType
      mediaType: item.mediaType,
      list,
      addedAt: oldEntry?.addedAt ?? Date.now(),
    };
    
    console.log(`📦 Library.upsert stored:`, {
      id: item.id,
      title: item.title,
      posterUrl: item.posterUrl,
      synopsis: state[key].synopsis ? 'present' : 'missing',
      list: list
    });
    
    // Update custom list item counts
    if (oldEntry && oldEntry.list !== list) {
      // Moving from one list to another
      if (oldEntry.list.startsWith('custom:')) {
        const oldListId = oldEntry.list.replace('custom:', '');
        customListManager.updateItemCount(oldListId, -1);
      }
      if (list.startsWith('custom:')) {
        const newListId = list.replace('custom:', '');
        customListManager.updateItemCount(newListId, 1);
      }
    } else if (!oldEntry && list.startsWith('custom:')) {
      // Adding new item to custom list
      const listId = list.replace('custom:', '');
      customListManager.updateItemCount(listId, 1);
    }
    
    save(state); emit();
    
    // Trigger Firebase sync via event (avoids circular import)
    const currentUser = getCurrentFirebaseUser();
    console.log('🔄 Library upsert - currentUser:', currentUser?.uid || 'none');
    if (currentUser) {
      console.log('📡 Dispatching library:changed event for Firebase sync');
      window.dispatchEvent(new CustomEvent('library:changed', { 
        detail: { uid: currentUser.uid, operation: 'upsert' } 
      }));
    } else {
      console.log('⚠️ No current user found, skipping Firebase sync');
    }
  },
  move(id: string | number, mediaType: MediaType, list: ListName) {
    const key = k(id, mediaType);
    const curr = state[key];
    if (!curr) return;
    
    const oldList = curr.list;
    // Preserve ALL existing data including synopsis, notes, tags, etc. when moving
    state[key] = { 
      ...curr,  // All existing fields preserved
      list      // Only update the list property
    };
    
    // Update custom list item counts
    if (oldList !== list) {
      if (oldList.startsWith('custom:')) {
        const oldListId = oldList.replace('custom:', '');
        customListManager.updateItemCount(oldListId, -1);
      }
      if (list.startsWith('custom:')) {
        const newListId = list.replace('custom:', '');
        customListManager.updateItemCount(newListId, 1);
      }
    }
    
    save(state); emit();
    
    // Trigger Firebase sync via event (avoids circular import)
    const currentUser = getCurrentFirebaseUser();
    if (currentUser) {
      window.dispatchEvent(new CustomEvent('library:changed', { 
        detail: { uid: currentUser.uid, operation: 'move' } 
      }));
    }
  },
  reorder(list: ListName, fromIndex: number, toIndex: number) {
    const items = Library.getByList(list);
    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
      console.warn('🔄 Invalid reorder indices:', { fromIndex, toIndex, listLength: items.length });
      return;
    }
    
    if (fromIndex === toIndex) return;
    
    // Create a copy of the items array
    const reorderedItems = [...items];
    
    // Remove item from fromIndex
    const [movedItem] = reorderedItems.splice(fromIndex, 1);
    
    // Insert item at toIndex
    reorderedItems.splice(toIndex, 0, movedItem);
    
    // Update the order by modifying the addedAt timestamps
    // This ensures the items maintain their new order
    const now = Date.now();
    reorderedItems.forEach((item, index) => {
      const key = k(item.id, item.mediaType);
      if (state[key]) {
        // Use a small offset to maintain order
        state[key] = { 
          ...state[key], 
          addedAt: now + index 
        };
      }
    });
    
    // Queue debounced save for rapid reorders (performance optimization)
    if (import.meta.env.DEV) {
      console.info('[reorder] queued: save + emit');
    }
    debouncedSave();
    
    // Queue custom order save (debounced, idempotent)
    try {
      const tabKey = list === 'wishlist' ? 'want' : list;
      const orderIds = reorderedItems.map(item => `${item.id}:${item.mediaType}`);
      queueCustomOrderSave(tabKey, orderIds);
    } catch (e) {
      console.warn('Failed to queue custom order save:', e);
    }
    
    console.log(`🔄 Reordered ${list} list: moved item from ${fromIndex} to ${toIndex}`);
    
    // Trigger Firebase sync via event
    const currentUser = getCurrentFirebaseUser();
    if (currentUser) {
      window.dispatchEvent(new CustomEvent('library:changed', { 
        detail: { uid: currentUser.uid, operation: 'reorder' } 
      }));
    }
  },
  
  // Reset custom order for a tab
  resetCustomOrder(list: ListName) {
    try {
      const tabKey = list === 'wishlist' ? 'want' : list;
      localStorage.removeItem(`flk.tab.${tabKey}.order.custom`);
      console.log(`🔄 Reset custom order for ${tabKey} tab`);
    } catch (e) {
      console.warn('Failed to reset custom order:', e);
    }
  },
  remove(id: string | number, mediaType: MediaType) {
    const key = k(id, mediaType);
    const entry = state[key];
    if (entry) {
      // Update custom list item count
      if (entry.list.startsWith('custom:')) {
        const listId = entry.list.replace('custom:', '');
        customListManager.updateItemCount(listId, -1);
      }
      delete state[key]; 
      save(state); 
      emit();
      
      // Trigger Firebase sync via event (avoids circular import)
      const currentUser = getCurrentFirebaseUser();
      if (currentUser) {
        window.dispatchEvent(new CustomEvent('library:changed', { 
          detail: { uid: currentUser.uid, operation: 'remove' } 
        }));
      }
    }
  },

  updateNotesAndTags(id: string | number, mediaType: MediaType, notes: string, tags: string[]) {
    const key = k(id, mediaType);
    if (state[key]) {
      state[key] = {
        ...state[key],
        userNotes: notes,
        tags: tags
      };
      save(state); emit();
      
      console.log(`📝 Updated notes and tags for ${id}:`, { notes, tags });
      
      // Trigger Firebase sync via event
      const currentUser = getCurrentFirebaseUser();
      if (currentUser) {
        window.dispatchEvent(new CustomEvent('library:changed', { 
          detail: { uid: currentUser.uid, operation: 'updateNotesAndTags' } 
        }));
      }
    }
  },

  getByList(list: ListName): LibraryEntry[] {
    return Object.values(state).filter(x => x.list === list).sort((a,b) => a.addedAt - b.addedAt);
  },
  has(id: string | number, mediaType: MediaType) {
    return !!state[k(id, mediaType)];
  },
  getCurrentList(id: string | number, mediaType: MediaType): ListName | null {
    const entry = state[k(id, mediaType)];
    return entry ? entry.list : null;
  },
  getEntry(id: string | number, mediaType: MediaType): LibraryEntry | null {
    return state[k(id, mediaType)] || null;
  },
  updateRating(id: string | number, mediaType: MediaType, rating: number) {
    const key = k(id, mediaType);
    const entry = state[key];
    if (entry) {
      state[key] = { ...entry, userRating: rating };
      save(state);
      emit();
      
      // Trigger Firebase sync via event
      const currentUser = getCurrentFirebaseUser();
      if (currentUser) {
        window.dispatchEvent(new CustomEvent('library:changed', { 
          detail: { uid: currentUser.uid, operation: 'rating' } 
        }));
      }
    }
  },

  // Reload Library state from localStorage (used after Firebase merge)
  reloadFromStorage(skipEmit = false) {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
      console.log('🔄 Library.reloadFromStorage - before:', Object.keys(state).length, 'items');
      console.log('🔄 Library.reloadFromStorage - localStorage:', Object.keys(stored).length, 'items');
      
      // Clear existing state
      Object.keys(state).forEach(key => delete state[key]);
      
      // Load new state
      Object.assign(state, stored);
      
      console.log('🔄 Library.reloadFromStorage - after:', Object.keys(state).length, 'items');
      
      // Emit to notify all subscribers (unless caller wants to handle it)
      if (!skipEmit) {
        emit();
        console.log('✅ Library state reloaded from localStorage and subscribers notified');
      } else {
        console.log('✅ Library state reloaded from localStorage (emit skipped, caller will handle)');
      }
    } catch (error) {
      console.error('❌ Failed to reload Library from localStorage:', error);
    }
  },
  
  // Batch notify both Library subscribers and window event listeners together
  // This prevents cascading re-renders by ensuring all updates happen in one frame
  notifyUpdate() {
    // Use requestAnimationFrame to batch both emit() and event dispatch
    // This ensures all state updates and event listeners run in the same frame
    requestAnimationFrame(() => {
      emit(); // Notify Library subscribers (React will batch these state updates)
      window.dispatchEvent(new CustomEvent('library:updated')); // Notify window listeners
    });
  },
  subscribe(fn: () => void) { subs.add(fn); return () => subs.delete(fn); },
};

export function useLibrary(list: ListName) {
  // Get diagnostics from window if available (avoids circular dependency)
  const getDiagnostics = () => {
    if (typeof window !== 'undefined' && (window as any).flickerDiagnostics) {
      return (window as any).flickerDiagnostics;
    }
    return null;
  };
  
  const [items, setItems] = React.useState(() => {
    const initialItems = Library.getByList(list);
    console.log(`🔍 useLibrary(${list}) initial state:`, initialItems.length, 'items');
    getDiagnostics()?.logSubscription(`useLibrary(${list})`, 'initial', { count: initialItems.length });
    return initialItems;
  });
  
  // Use ref to track previous items to avoid unnecessary setState calls
  const prevItemsRef = React.useRef(items);
  
  React.useEffect(() => {
    // Only set items on mount if they differ from initial state (shouldn't happen, but safety check)
    const newItems = Library.getByList(list);
    const itemsChanged = newItems.length !== prevItemsRef.current.length || 
      newItems.some((item, idx) => item.id !== prevItemsRef.current[idx]?.id);
    
    if (itemsChanged) {
      console.log(`🔍 useLibrary(${list}) effect - current items:`, newItems.length, 'items');
      if (newItems.length > 0) {
        console.log(`🔍 First item:`, { title: newItems[0].title, list: newItems[0].list });
      }
      getDiagnostics()?.logSubscription(`useLibrary(${list})`, 'effect', { count: newItems.length });
      prevItemsRef.current = newItems;
      setItems(newItems);
    }
    
    const unsub = Library.subscribe(() => {
      const updatedItems = Library.getByList(list);
      
      // Only update state if items actually changed (prevents unnecessary re-renders)
      const hasChanged = updatedItems.length !== prevItemsRef.current.length ||
        updatedItems.some((item, idx) => item.id !== prevItemsRef.current[idx]?.id);
      
      if (hasChanged) {
        console.log(`🔔 Library.subscribe(${list}) triggered:`, updatedItems.length, 'items');
        getDiagnostics()?.logSubscription(`useLibrary(${list})`, 'subscribe', { count: updatedItems.length });
        if (updatedItems.length > 0) {
          console.log(`🔔 First item:`, { title: updatedItems[0].title, list: updatedItems[0].list });
        }
        prevItemsRef.current = updatedItems;
        // React 18+ auto-batches state updates, so this will be batched with other updates
        setItems(updatedItems);
      }
    });
    
    return () => {
      unsub();
    };
  }, [list]);
  
  console.log(`🔍 useLibrary(${list}) returning:`, items.length, 'items');
  return items;
}
