// Minimal analytics wrapper for consistent event names

type Payload = Record<string, unknown>;

function safeLog(event: string, payload: Payload = {}): void {
  try {
    // eslint-disable-next-line no-console
    console.log(`\uD83D\uDCCA Analytics: ${event}`, payload);
  } catch { /* noop */ }
}

export function track(event: string, payload: Payload = {}): void {
  safeLog(event, payload);
}

export function trackTabOpenedReturning(count: number): void {
  track('tab_opened:returning', { count });
  track('returning_count', { count });
}

export function trackOpenFromReturning(showId: string | number, title?: string): void {
  track('open_from:returning', { showId, title });
}

/**
 * Track sort mode change in tabbed lists
 */
export function trackSortChange(tabKey: string, sortMode: string, previousMode?: string): void {
  track('tab_sort_changed', { tabKey, sortMode, previousMode });
}

/**
 * Track filter change in tabbed lists
 */
export function trackFilterChange(tabKey: string, filterType: string, providerCount: number): void {
  track('tab_filter_changed', { tabKey, filterType, providerCount });
}

/**
 * Track reorder completion in tabbed lists
 */
export function trackReorderCompleted(tabKey: string, fromIndex: number, toIndex: number): void {
  track('tab_reorder_completed', { tabKey, fromIndex, toIndex });
}

/**
 * Track tab state reset to defaults
 */
export function trackTabStateReset(tabKey: string): void {
  track('tab_state_reset', { tabKey });
}

/**
 * Track community post creation
 */
export function trackCommunityPostCreate(hasMedia: boolean, length: number): void {
  track('community.post.create', { hasMedia, length });
}


