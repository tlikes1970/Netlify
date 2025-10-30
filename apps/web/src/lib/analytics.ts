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


