import { useEffect, useState } from "react";
import * as React from "react";
import type { CustomList, UserLists, ListName } from "../state/library.types";
import { getMaxCustomLists } from "./proConfig";

const CUSTOM_LISTS_KEY = "flicklet.customLists.v2";

const DEFAULT_USER_LISTS: UserLists = {
  customLists: [],
  selectedListId: undefined,
  maxLists: 3, // Default for free users, will be updated based on Pro status
};

class CustomListManager {
  private userLists: UserLists;
  private subscribers: Set<() => void> = new Set();
  private syncDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastSyncedCounts: Map<string, number> = new Map();

  constructor() {
    this.userLists = this.loadUserLists();
    // Update maxLists based on current Pro status
    this.updateMaxLists();
    // Initialize last synced counts
    this.userLists.customLists.forEach((list) => {
      this.lastSyncedCounts.set(list.id, list.itemCount);
    });

    // Listen for Firebase sync updates
    window.addEventListener("customLists:updated", () => {
      this.userLists = this.loadUserLists();
      this.updateMaxLists();
      this.emitChange();
    });

    // Listen for library cleared events (when user signs out)
    window.addEventListener("library:cleared", () => {
      this.userLists = DEFAULT_USER_LISTS;
      this.updateMaxLists();
      this.saveUserLists();
      this.emitChange();
      console.log("🧹 Custom lists cleared for privacy");
    });

    // Listen for library updates to sync counts - debounced to prevent cascade
    window.addEventListener("library:updated", () => {
      // Clear any pending debounce
      if (this.syncDebounceTimeout) {
        clearTimeout(this.syncDebounceTimeout);
      }
      // Debounce sync to prevent rapid cascades
      this.syncDebounceTimeout = setTimeout(() => {
        this.syncCountsFromLibrary();
        this.syncDebounceTimeout = null;
      }, 100);
    });

    // Listen for Pro status changes (via settings changes)
    // Note: This is a simple approach - if Pro status changes, maxLists will update on next getUserLists() call
    // For real-time updates, we'd need to subscribe to settings changes, but that's handled by React hooks
  }

  /**
   * Update maxLists based on current Pro status
   * Called when lists are loaded or Pro status might have changed
   */
  private updateMaxLists(): void {
    const newMaxLists = getMaxCustomLists();
    if (this.userLists.maxLists !== newMaxLists) {
      this.userLists.maxLists = newMaxLists;
      // Don't save here - maxLists is computed, not persisted
    }
  }

  private loadUserLists(): UserLists {
    try {
      const stored = localStorage.getItem(CUSTOM_LISTS_KEY);
      if (stored) {
        return { ...DEFAULT_USER_LISTS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to load custom lists from localStorage", e);
    }
    return DEFAULT_USER_LISTS;
  }

  private saveUserLists(): void {
    localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(this.userLists));
    this.emitChange();
  }

  private emitChange(): void {
    // ⚠️ REMOVED: flickerDiagnostics logging disabled
    this.subscribers.forEach((callback) => callback());
  }

  getUserLists(): UserLists {
    // Always update maxLists based on current Pro status before returning
    this.updateMaxLists();
    return { ...this.userLists };
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Pro gating: Custom list creation limit
   * Free: 3 lists max (PRO_LIMITS.lists.free)
   * Pro: Unlimited (PRO_LIMITS.lists.pro = Infinity)
   * Config: proConfig.ts - getMaxCustomLists()
   */
  createList(name: string, description?: string, color?: string): CustomList {
    // Update maxLists to ensure we have the latest Pro status
    this.updateMaxLists();
    
    if (this.userLists.maxLists !== Infinity && this.userLists.customLists.length >= this.userLists.maxLists) {
      throw new Error(`Maximum ${this.userLists.maxLists} lists allowed. Upgrade to Pro for unlimited lists.`);
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

  updateList(
    id: string,
    updates: Partial<Pick<CustomList, "name" | "description" | "color">>
  ): CustomList | null {
    const listIndex = this.userLists.customLists.findIndex(
      (list) => list.id === id
    );
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
    const listIndex = this.userLists.customLists.findIndex(
      (list) => list.id === id
    );
    if (listIndex === -1) return false;

    // Don't allow deleting the default list if it's the only one
    if (
      this.userLists.customLists[listIndex].isDefault &&
      this.userLists.customLists.length === 1
    ) {
      throw new Error("Cannot delete the only remaining list");
    }

    this.userLists.customLists.splice(listIndex, 1);

    // If we deleted the selected list, select the default list
    if (this.userLists.selectedListId === id) {
      const defaultList = this.userLists.customLists.find(
        (list) => list.isDefault
      );
      this.userLists.selectedListId = defaultList?.id;
    }

    // If we deleted the default list, make the first remaining list the default
    if (
      this.userLists.customLists.length > 0 &&
      !this.userLists.customLists.some((list) => list.isDefault)
    ) {
      this.userLists.customLists[0].isDefault = true;
    }

    this.saveUserLists();
    return true;
  }

  setSelectedList(id: string): boolean {
    const list = this.userLists.customLists.find((list) => list.id === id);
    if (!list) return false;

    this.userLists.selectedListId = id;
    this.saveUserLists();
    return true;
  }

  getSelectedList(): CustomList | null {
    if (!this.userLists.selectedListId) {
      // Return default list if no selection
      return this.userLists.customLists.find((list) => list.isDefault) || null;
    }
    return (
      this.userLists.customLists.find(
        (list) => list.id === this.userLists.selectedListId
      ) || null
    );
  }

  getListById(id: string): CustomList | null {
    return this.userLists.customLists.find((list) => list.id === id) || null;
  }

  updateItemCount(listId: string, delta: number): void {
    const list = this.userLists.customLists.find((list) => list.id === listId);
    if (list) {
      list.itemCount = Math.max(0, list.itemCount + delta);
      this.saveUserLists();
    }
  }

  // Reset all custom list counts to zero
  resetAllCounts(): void {
    this.userLists.customLists.forEach((list) => {
      list.itemCount = 0;
    });
    this.saveUserLists();
    this.emitChange();
    console.log("🔄 Reset all custom list counts to zero");
  }

  // Sync counts from Library data - only if counts actually changed
  private syncCountsFromLibrary(): void {
    try {
      // Get Library data from localStorage
      const libraryData = JSON.parse(
        localStorage.getItem("flicklet.library.v2") || "{}"
      );

      // Calculate new counts
      const newCounts = new Map<string, number>();
      this.userLists.customLists.forEach((list) => {
        newCounts.set(list.id, 0);
      });

      // Count items in each custom list
      Object.values(libraryData).forEach((item: any) => {
        if (item.list && item.list.startsWith("custom:")) {
          const listId = item.list.replace("custom:", "");
          const currentCount = newCounts.get(listId) || 0;
          newCounts.set(listId, currentCount + 1);
        }
      });

      // Check if any counts actually changed
      let hasChanges = false;
      this.userLists.customLists.forEach((list) => {
        const newCount = newCounts.get(list.id) || 0;
        const oldCount = this.lastSyncedCounts.get(list.id) || 0;
        if (newCount !== oldCount) {
          hasChanges = true;
          list.itemCount = newCount;
          this.lastSyncedCounts.set(list.id, newCount);
        }
      });

      // Only save and emit if counts actually changed
      if (hasChanges) {
        this.saveUserLists();
        this.emitChange();
        console.log("🔄 Synced custom list counts from Library");
      }
    } catch (error) {
      console.error("Failed to sync counts from Library:", error);
    }
  }

  // Helper to get list name from ListName
  getListName(listName: ListName): string {
    if (listName.startsWith("custom:")) {
      const listId = listName.replace("custom:", "");
      const list = this.getListById(listId);
      return list?.name || "Unknown List";
    }

    const standardNames: Record<string, string> = {
      watching: "Currently Watching",
      wishlist: "Want to Watch",
      watched: "Watched",
      not: "Not Interested",
    };

    return standardNames[listName] || listName;
  }
}

// Export singleton instance
export const customListManager = new CustomListManager();

// React hook for using custom lists
export function useCustomLists(): UserLists {
  const [userLists, setUserLists] = useState(customListManager.getUserLists());
  // Use ref to track previous value for accurate logging
  const prevListsRef = React.useRef(userLists);

  useEffect(() => {
    // ⚠️ REMOVED: flickerDiagnostics logging disabled
    setUserLists(customListManager.getUserLists());
    const unsubscribe = customListManager.subscribe(() => {
      const newLists = customListManager.getUserLists();

      // Only log and update if value actually changed
      const prevLength = prevListsRef.current.customLists.length;
      const newLength = newLists.customLists.length;
      const hasChanged =
        prevLength !== newLength ||
        newLists.customLists.some((list, idx) => {
          const prevList = prevListsRef.current.customLists[idx];
          if (!prevList) return true;
          return (
            list.id !== prevList.id ||
            list.name !== prevList.name ||
            list.description !== prevList.description ||
            list.color !== prevList.color ||
            list.itemCount !== prevList.itemCount ||
            list.isDefault !== prevList.isDefault
          );
        });

      if (hasChanged) {
        // ⚠️ REMOVED: flickerDiagnostics logging disabled
        prevListsRef.current = newLists;
        setUserLists(newLists);
      }
    });
    return unsubscribe;
  }, []);

  return userLists;
}

// Helper hook for selected list
export function useSelectedList(): CustomList | null {
  const [selectedList, setSelectedList] = useState(
    customListManager.getSelectedList()
  );

  useEffect(() => {
    setSelectedList(customListManager.getSelectedList());
    const unsubscribe = customListManager.subscribe(() => {
      setSelectedList(customListManager.getSelectedList());
    });
    return unsubscribe;
  }, []);

  return selectedList;
}
