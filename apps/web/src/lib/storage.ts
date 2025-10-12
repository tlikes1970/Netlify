import React from 'react';
import type { MediaItem, MediaType } from '../components/cards/card.types';
import type { ListName } from '../state/library.types';
import { customListManager } from './customLists';

const KEY = 'flicklet.library.v2';
const OLD_KEY = 'flicklet:v2:saved';

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

function k(id: string | number, mediaType: MediaType) { return `${mediaType}:${id}`; }

function save(s: State) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function emit() {
  subs.forEach(fn => fn());
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
  upsert(item: MediaItem, list: ListName) {
    const key = k(item.id, item.mediaType);
    const oldEntry = state[key];
    
    state[key] = {
      ...state[key],
      ...item,
      list,
      addedAt: state[key]?.addedAt ?? Date.now(),
    };
    
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
  },
  move(id: string | number, mediaType: MediaType, list: ListName) {
    const key = k(id, mediaType);
    const curr = state[key];
    if (!curr) return;
    
    const oldList = curr.list;
    state[key] = { ...curr, list };
    
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
  subscribe(fn: () => void) { subs.add(fn); return () => subs.delete(fn); },
};

export function useLibrary(list: ListName) {
  const [items, setItems] = React.useState(() => Library.getByList(list));
  React.useEffect(() => {
    setItems(Library.getByList(list));
    const unsub = Library.subscribe(() => setItems(Library.getByList(list)));
    return unsub;
  }, [list]);
  return items;
}
