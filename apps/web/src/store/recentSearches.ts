/**
 * Process: Recent Searches Store
 * Purpose: Manage recent search queries with localStorage persistence
 * Data Source: User search queries
 * Update Path: Write operations add/clear recent searches
 * Dependencies: localStorage
 */

const RECENT_SEARCHES_KEY = 'flk.search.recent';
const MAX_RECENT_SEARCHES = 20;

export interface RecentSearch {
  query: string;
  timestamp: number;
}

/**
 * Get recent searches (max 5 for display)
 */
export function getRecentSearches(max: number = 5): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    
    const entries: RecentSearch[] = JSON.parse(stored);
    // Sort by timestamp descending and return queries only
    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, max)
      .map(e => e.query);
  } catch {
    return [];
  }
}

/**
 * Add a search query to recent searches
 */
export function addRecentSearch(query: string): void {
  if (!query.trim()) return;
  
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    const entries: RecentSearch[] = stored ? JSON.parse(stored) : [];
    
    const trimmedQuery = query.trim();
    
    // Remove if already exists (dedup)
    const filtered = entries.filter(e => e.query !== trimmedQuery);
    
    // Add to beginning with current timestamp
    const newEntries: RecentSearch[] = [
      { query: trimmedQuery, timestamp: Date.now() },
      ...filtered
    ].slice(0, MAX_RECENT_SEARCHES);
    
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newEntries));
  } catch (error) {
    console.warn('[RecentSearches] Failed to save:', error);
  }
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.warn('[RecentSearches] Failed to clear:', error);
  }
}


















