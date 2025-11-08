/**
 * Library tag index
 * Purpose: Provides fast tag-based search across user's library items
 * Data Source: Library state from storage.ts
 * Update Path: Call rebuildIndex() when library changes
 * Dependencies: Uses Library from storage.ts
 */

import { Library } from './storage';
import type { MediaItem } from '../components/cards/card.types';

type MediaKey = string; // format: "mediaType:id"

interface TagIndex {
  byTag: Map<string, Set<MediaKey>>;
  byItem: Map<MediaKey, Set<string>>;
}

class LibraryTagIndex {
  private index: TagIndex = { byTag: new Map(), byItem: new Map() };
  private lastRebuild: number = 0;
  private readonly REBUILD_INTERVAL = 5000; // rebuild at most once per 5 seconds

  /**
   * Rebuild the index from current library state
   */
  rebuildIndex(): void {
    const now = Date.now();
    if (now - this.lastRebuild < this.REBUILD_INTERVAL) {
      return;
    }
    this.lastRebuild = now;

    this.index.byTag.clear();
    this.index.byItem.clear();

    // Get all library items across all lists
    const lists: Array<'watching' | 'wishlist' | 'watched' | 'not'> = ['watching', 'wishlist', 'watched', 'not'];
    
    for (const list of lists) {
      const items = Library.getByList(list);
      for (const item of items) {
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
  const allItems: MediaItem[] = [];
  const lists: Array<'watching' | 'wishlist' | 'watched' | 'not'> = ['watching', 'wishlist', 'watched', 'not'];
  
  for (const list of lists) {
    const items = Library.getByList(list);
    allItems.push(...items);
  }
  
  // Filter to matching keys
  const keySet = new Set(keys);
  return allItems.filter(item => {
    const key = `${item.mediaType}:${item.id}`;
    return keySet.has(key);
  });
}






















