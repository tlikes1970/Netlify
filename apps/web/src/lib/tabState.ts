/**
 * Process: Tab State Management
 * Purpose: Unified utilities for saving/restoring tab state (sort, filters, custom order) with guardrails
 * Data Source: localStorage with flk.tab.<tabKey>.* keys
 * Update Path: Use saveTabState() and restoreTabState() functions
 * Dependencies: SortMode, ListFiltersState types from components
 */

import type { SortMode } from '@/components/SortDropdown';
import type { ListFiltersState } from '@/components/ListFilters';

export interface TabOrderState {
  mode: 'custom' | 'default';
  ids?: string[]; // Array of "id:mediaType" strings for custom order
}

export interface TabState {
  sort: SortMode;
  filter: ListFiltersState;
  order: TabOrderState;
}

/**
 * Get tab key from mode (handles wishlist -> want mapping)
 */
export function getTabKey(mode: string): string {
  if (mode === 'want') return 'want';
  return mode;
}

/**
 * Restore tab state from localStorage with guardrails
 * Validates all state values and provides defaults for broken states
 */
export function restoreTabState(tabKey: string, _availableItemIds?: Set<string>): TabState {
  const defaultState: TabState = {
    sort: 'date-newest',
    filter: { type: 'all', providers: [] },
    order: { mode: 'default' },
  };

  try {
    // Restore sort mode
    const storedSort = localStorage.getItem(`flk.tab.${tabKey}.sort`);
    const validSortModes: SortMode[] = [
      'date-newest',
      'date-oldest',
      'alphabetical-az',
      'alphabetical-za',
      'streaming-service',
      'custom',
    ];
    const sort: SortMode =
      storedSort && validSortModes.includes(storedSort as SortMode)
        ? (storedSort as SortMode)
        : defaultState.sort;

    // Restore filters
    const storedType = localStorage.getItem(`flk.tab.${tabKey}.filter.type`);
    const storedProviders = localStorage.getItem(`flk.tab.${tabKey}.filter.providers`);
    
    const filter: ListFiltersState = {
      type:
        storedType && ['all', 'movie', 'tv'].includes(storedType)
          ? (storedType as 'all' | 'movie' | 'tv')
          : defaultState.filter.type,
      providers: (() => {
        try {
          const parsed = storedProviders ? JSON.parse(storedProviders) : [];
          return Array.isArray(parsed) && parsed.every((p) => typeof p === 'string')
            ? parsed
            : [];
        } catch {
          return [];
        }
      })(),
    };

    // Restore custom order with guardrails
    const order: TabOrderState = (() => {
      try {
        const storedOrder = localStorage.getItem(`flk.tab.${tabKey}.order.custom`);
        if (!storedOrder) {
          return { mode: 'default' };
        }

        const parsedIds = JSON.parse(storedOrder);
        if (!Array.isArray(parsedIds) || parsedIds.length === 0) {
          // Broken state - clear it
          localStorage.removeItem(`flk.tab.${tabKey}.order.custom`);
          return { mode: 'default' };
        }

        // Keep compatible IDs even when metadata is not loaded or another sort is active.
        // Rendering ignores removed identities; ordinary saves must never prune the order.
        const ids = [...new Set(parsedIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0))];
        return ids.length ? { mode: 'custom', ids } : { mode: 'default' };
      } catch {
        // Broken state - clear it
        try {
          localStorage.removeItem(`flk.tab.${tabKey}.order.custom`);
        } catch {
          // Ignore
        }
        return { mode: 'default' };
      }
    })();

    return { sort, filter, order };
  } catch (error) {
    console.warn(`[TabState] Error restoring state for ${tabKey}, using defaults:`, error);
    return defaultState;
  }
}

/**
 * Save tab state to localStorage and sync to Firebase
 */
export async function saveTabState(tabKey: string, state: Partial<TabState>): Promise<void> {
  try {
    // Get current state to merge with partial update
    const currentState = restoreTabState(tabKey);
    const mergedState: TabState = {
      sort: state.sort !== undefined ? state.sort : currentState.sort,
      filter: state.filter !== undefined ? state.filter : currentState.filter,
      order: state.order !== undefined ? state.order : currentState.order,
    };

    // Save to localStorage
    if (mergedState.sort !== undefined) {
      localStorage.setItem(`flk.tab.${tabKey}.sort`, mergedState.sort);
    }

    if (mergedState.filter !== undefined) {
      localStorage.setItem(`flk.tab.${tabKey}.filter.type`, mergedState.filter.type);
      localStorage.setItem(
        `flk.tab.${tabKey}.filter.providers`,
        JSON.stringify(mergedState.filter.providers)
      );
    }

    if (mergedState.order !== undefined) {
      if (mergedState.order.mode === 'custom' && mergedState.order.ids && mergedState.order.ids.length > 0) {
        localStorage.setItem(
          `flk.tab.${tabKey}.order.custom`,
          JSON.stringify(mergedState.order.ids)
        );
      } else {
        // Clear custom order if switching to default
        localStorage.removeItem(`flk.tab.${tabKey}.order.custom`);
      }
    }

    notifyTabStateChanged(tabKey);

    // Sync to Firebase in background (non-blocking)
    try {
      const { syncTabStateToFirebase } = await import('./tabStateSync');
      await syncTabStateToFirebase(tabKey, mergedState);
    } catch (error) {
      // Don't block UI on sync failure
      console.warn(`[TabState] Failed to sync to Firebase:`, error);
    }
  } catch (error) {
    console.warn(`[TabState] Error saving state for ${tabKey}:`, error);
  }
}

/**
 * Reset tab state to defaults
 */
export function resetTabState(tabKey: string): TabState {
  const defaultState: TabState = {
    sort: 'date-newest',
    filter: { type: 'all', providers: [] },
    order: { mode: 'default' },
  };

  try {
    // Clear all stored state
    localStorage.removeItem(`flk.tab.${tabKey}.sort`);
    localStorage.removeItem(`flk.tab.${tabKey}.filter.type`);
    localStorage.removeItem(`flk.tab.${tabKey}.filter.providers`);
    localStorage.removeItem(`flk.tab.${tabKey}.order.custom`);
  } catch (error) {
    console.warn(`[TabState] Error resetting state for ${tabKey}:`, error);
  }

  return defaultState;
}

/**
 * Validate filter state against available providers
 */
export function validateFilters(
  filters: ListFiltersState,
  availableProviders: string[]
): ListFiltersState {
  const canonical = new Map(availableProviders.map(name => [name.toLowerCase(), name]));
  const seen = new Set<string>();
  return {
    type: filters.type,
    providers: filters.providers.flatMap(name => {
      const key = name.toLowerCase();
      if (seen.has(key)) return [];
      seen.add(key);
      return [canonical.get(key) ?? name];
    }),
  };
}

export const TAB_STATE_CHANGED = 'flicklet:tab-state-changed';
export function notifyTabStateChanged(tabKey: string, source: 'local' | 'cloud' = 'local') {
  window.dispatchEvent(new CustomEvent(TAB_STATE_CHANGED, { detail: { tabKey, source } }));
}

export function networkOptions(names: string[]): string[] {
  const canonical = new Map<string, string>();
  for (const name of names) {
    if (typeof name === 'string' && name.trim() && !canonical.has(name.toLowerCase())) canonical.set(name.toLowerCase(), name);
  }
  return [...canonical.values()].sort((a,b) => a.localeCompare(b));
}
