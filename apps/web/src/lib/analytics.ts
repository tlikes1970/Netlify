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

/**
 * Game Analytics Tracking
 */

/**
 * Track FlickWord game start
 */
export function trackFlickWordGameStart(gameNumber: number, isPro: boolean): void {
  track('flickword.game.start', { gameNumber, isPro });
}

/**
 * Track FlickWord game completion
 */
export function trackFlickWordGameComplete(won: boolean, guesses: number, gameNumber: number, isPro: boolean): void {
  track('flickword.game.complete', { won, guesses, gameNumber, isPro });
}

/**
 * Track FlickWord guess submission
 */
export function trackFlickWordGuess(word: string, attemptNumber: number): void {
  track('flickword.guess', { word, attemptNumber });
}

/**
 * Track FlickWord share
 */
export function trackFlickWordShare(gameNumber: number | null, shareType: 'single' | 'all'): void {
  track('flickword.share', { gameNumber, shareType });
}

/**
 * Track Trivia game start
 */
export function trackTriviaGameStart(gameNumber: number, isPro: boolean): void {
  track('trivia.game.start', { gameNumber, isPro });
}

/**
 * Track Trivia game completion
 */
export function trackTriviaGameComplete(score: number, total: number, percentage: number, gameNumber: number, isPro: boolean): void {
  track('trivia.game.complete', { score, total, percentage, gameNumber, isPro });
}

/**
 * Track Trivia answer selection
 */
export function trackTriviaAnswer(questionIndex: number, isCorrect: boolean): void {
  track('trivia.answer', { questionIndex, isCorrect });
}

/**
 * Track game error
 */
export function trackGameError(gameType: 'flickword' | 'trivia', error: string, context?: Record<string, unknown>): void {
  track('game.error', { gameType, error, ...context });
}

/**
 * Track game review view
 */
export function trackGameReview(gameType: 'flickword' | 'trivia', gameNumber: number | null): void {
  track('game.review', { gameType, gameNumber });
}


