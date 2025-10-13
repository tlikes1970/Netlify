import React, { useEffect, useState } from 'react';
import type { CustomList, UserLists, ListName } from '../state/library.types';

const CUSTOM_LISTS_KEY = 'flicklet.customLists.v2';

const DEFAULT_USER_LISTS: UserLists = {
  customLists: [],
  selectedListId: undefined,
  maxLists: 3, // Start with 3, Pro can increase
};

class CustomListManager {
  private userLists: UserLists;
  private subscribers: Set<() => void> = new Set();

  constructor() {
    this.userLists = this.loadUserLists();
    
    // Listen for Firebase sync updates
    window.addEventListener('customLists:updated', () => {
      this.userLists = this.loadUserLists();
      this.emitChange();
    });
    
    // Listen for library cleared events (when user signs out)
    window.addEventListener('library:cleared', () => {
      this.userLists = DEFAULT_USER_LISTS;
      this.saveUserLists();
      this.emitChange();
      console.log('🧹 Custom lists cleared for privacy');
    });
  }

  private loadUserLists(): UserLists {
    try {
      const stored = localStorage.getItem(CUSTOM_LISTS_KEY);
      if (stored) {
        return { ...DEFAULT_USER_LISTS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load custom lists from localStorage', e);
    }
    return DEFAULT_USER_LISTS;
  }

  private saveUserLists(): void {
    localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(this.userLists));
    this.emitChange();
  }

  private emitChange(): void {
    this.subscribers.forEach(callback => callback());
  }

  getUserLists(): UserLists {
    return { ...this.userLists };
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  createList(name: string, description?: string, color?: string): CustomList {
    if (this.userLists.customLists.length >= this.userLists.maxLists) {
      throw new Error(`Maximum ${this.userLists.maxLists} lists allowed`);
    }

    const id = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newList: CustomList = {
      id,
      name: name.trim(),
      description: description?.trim(),
      color,
      createdAt: Date.now(),
      itemCount: 0,
      isDefault: this.userLists.customLists.length === 0, // First list is default
    };

    this.userLists.customLists.push(newList);
    this.saveUserLists();
    return newList;
  }

  updateList(id: string, updates: Partial<Pick<CustomList, 'name' | 'description' | 'color'>>): CustomList | null {
    const listIndex = this.userLists.customLists.findIndex(list => list.id === id);
    if (listIndex === -1) return null;

    const updatedList = {
      ...this.userLists.customLists[listIndex],
      ...updates,
      name: updates.name?.trim() || this.userLists.customLists[listIndex].name,
      description: updates.description?.trim(),
    };

    this.userLists.customLists[listIndex] = updatedList;
    this.saveUserLists();
    return updatedList;
  }

  deleteList(id: string): boolean {
    const listIndex = this.userLists.customLists.findIndex(list => list.id === id);
    if (listIndex === -1) return false;

    // Don't allow deleting the default list if it's the only one
    if (this.userLists.customLists[listIndex].isDefault && this.userLists.customLists.length === 1) {
      throw new Error('Cannot delete the only remaining list');
    }

    this.userLists.customLists.splice(listIndex, 1);

    // If we deleted the selected list, select the default list
    if (this.userLists.selectedListId === id) {
      const defaultList = this.userLists.customLists.find(list => list.isDefault);
      this.userLists.selectedListId = defaultList?.id;
    }

    // If we deleted the default list, make the first remaining list the default
    if (this.userLists.customLists.length > 0 && !this.userLists.customLists.some(list => list.isDefault)) {
      this.userLists.customLists[0].isDefault = true;
    }

    this.saveUserLists();
    return true;
  }

  setSelectedList(id: string): boolean {
    const list = this.userLists.customLists.find(list => list.id === id);
    if (!list) return false;

    this.userLists.selectedListId = id;
    this.saveUserLists();
    return true;
  }

  getSelectedList(): CustomList | null {
    if (!this.userLists.selectedListId) {
      // Return default list if no selection
      return this.userLists.customLists.find(list => list.isDefault) || null;
    }
    return this.userLists.customLists.find(list => list.id === this.userLists.selectedListId) || null;
  }

  getListById(id: string): CustomList | null {
    return this.userLists.customLists.find(list => list.id === id) || null;
  }

  updateItemCount(listId: string, delta: number): void {
    const list = this.userLists.customLists.find(list => list.id === listId);
    if (list) {
      list.itemCount = Math.max(0, list.itemCount + delta);
      this.saveUserLists();
    }
  }

  // Helper to get list name from ListName
  getListName(listName: ListName): string {
    if (listName.startsWith('custom:')) {
      const listId = listName.replace('custom:', '');
      const list = this.getListById(listId);
      return list?.name || 'Unknown List';
    }
    
    const standardNames: Record<string, string> = {
      watching: 'Currently Watching',
      wishlist: 'Want to Watch',
      watched: 'Watched',
      not: 'Not Interested',
    };
    
    return standardNames[listName] || listName;
  }
}

// Export singleton instance
export const customListManager = new CustomListManager();

// React hook for using custom lists
export function useCustomLists(): UserLists {
  const [userLists, setUserLists] = useState(customListManager.getUserLists());

  useEffect(() => {
    setUserLists(customListManager.getUserLists());
    const unsubscribe = customListManager.subscribe(() => {
      setUserLists(customListManager.getUserLists());
    });
    return unsubscribe;
  }, []);

  return userLists;
}

// Helper hook for selected list
export function useSelectedList(): CustomList | null {
  const [selectedList, setSelectedList] = useState(customListManager.getSelectedList());

  useEffect(() => {
    setSelectedList(customListManager.getSelectedList());
    const unsubscribe = customListManager.subscribe(() => {
      setSelectedList(customListManager.getSelectedList());
    });
    return unsubscribe;
  }, []);

  return selectedList;
}
