/**
 * Library tag index
 * Purpose: Provides fast tag-based search across user's library items
 * Data Source: Library state from storage.ts
 * Update Path: Library notifications invalidate the index; searches rebuild lazily.
 * Dependencies: Uses Library from storage.ts
 */

import { Library } from './storage';
import { customListManager } from './customLists';
import type { MediaItem } from '../components/cards/card.types';

function compatibleItems() {
  return Library.getAll().filter(item => ['watching', 'wishlist', 'watched', 'not'].includes(item.list) ||
    (item.list.startsWith('custom:') && !!customListManager.getListById(item.list.slice(7))));
}

type MediaKey = string; // format: "mediaType:id"

interface TagIndex {
  byTag: Map<string, Set<MediaKey>>;
  byItem: Map<MediaKey, Set<string>>;
}

class LibraryTagIndex {
  private index: TagIndex = { byTag: new Map(), byItem: new Map() };
  private dirty = true;

  constructor() { Library.subscribe(() => { this.dirty = true; }); }

  /**
   * Rebuild the index from current library state
   */
  rebuildIndex(): void {
    if (!this.dirty) return;
    this.dirty = false;

    this.index.byTag.clear();
    this.index.byItem.clear();

    // Get all library items across all lists
    for (const item of compatibleItems()) {
        const key = `${item.mediaType}:${item.id}`;
        const tags = item.tags || [];
        
        // Index tags
        for (const tag of tags) {
          const normalizedTag = this.normalizeTag(tag);
          if (!this.index.byTag.has(normalizedTag)) {
            this.index.byTag.set(normalizedTag, new Set());
          }
          this.index.byTag.get(normalizedTag)!.add(key);
        }
        
        // Index item -> tags for reverse lookup
        this.index.byItem.set(key, new Set(tags.map(this.normalizeTag)));
    }
  }

  /**
   * Search for items by tag
   */
  searchTags(query: string): MediaKey[] {
    this.rebuildIndex();
    
    const normalizedQuery = this.normalizeTag(query);
    const results = new Set<MediaKey>();

    // Exact match
    if (this.index.byTag.has(normalizedQuery)) {
      for (const key of this.index.byTag.get(normalizedQuery)!) {
        results.add(key);
      }
    }

    // Partial matches (substring)
    for (const [tag, items] of this.index.byTag) {
      if (tag.includes(normalizedQuery) || normalizedQuery.includes(tag)) {
        for (const key of items) {
          results.add(key);
        }
      }
    }

    return Array.from(results);
  }

  /**
   * Get all tags used in the library
   */
  getAllTags(): string[] {
    this.rebuildIndex();
    return Array.from(this.index.byTag.keys());
  }

  /**
   * Check if an item has a specific tag
   */
  hasTag(item: MediaItem, tag: string): boolean {
    this.rebuildIndex();
    const key = `${item.mediaType}:${item.id}`;
    const tags = this.index.byItem.get(key);
    if (!tags) return false;
    return tags.has(this.normalizeTag(tag));
  }

  /**
   * Normalize tag for indexing (lowercase, trimmed)
   */
  private normalizeTag(tag: string): string {
    return tag.toLowerCase().trim();
  }
}

export const libraryTagIndex = new LibraryTagIndex();

/**
 * Search library items by tag
 */
export function searchTagsLocal(query: string): MediaItem[] {
  const keys = libraryTagIndex.searchTags(query);
  
  // Get all items from library
  const allItems = compatibleItems();

  // Filter to matching keys
  const keySet = new Set(keys);
  return allItems.filter(item => {
    const key = `${item.mediaType}:${item.id}`;
    return keySet.has(key);
  });
}
