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
export function restoreTabState(tabKey: string, availableItemIds: Set<string>): TabState {
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

        // Validate that all IDs in custom order still exist
        const validIds = parsedIds.filter((id: string) => {
          // Check if ID exists in available items
          return availableItemIds.has(id) || 
                 availableItemIds.has(id.split(':')[0]); // Handle "id:mediaType" format
        });

        // If less than 50% of IDs are valid, consider it stale and reset
        if (validIds.length < parsedIds.length * 0.5) {
          console.warn(`[TabState] Stale custom order detected for ${tabKey}, resetting`);
          localStorage.removeItem(`flk.tab.${tabKey}.order.custom`);
          return { mode: 'default' };
        }

        // If sort mode is custom, use the order; otherwise ignore it
        if (sort === 'custom' && validIds.length > 0) {
          return { mode: 'custom', ids: validIds };
        }

        return { mode: 'default' };
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
    const currentState = restoreTabState(tabKey, new Set());
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
  // Filter out providers that no longer exist
  const validProviders = filters.providers.filter((provider) =>
    availableProviders.includes(provider)
  );

  return {
    type: filters.type,
    providers: validProviders,
  };
}






















