/**
 * Single-Flight Utility
 * 
 * Ensures a function is only executed once at a time, with subsequent calls
 * returning the same promise until the first execution completes.
 */

type Inflight<T> = { p: Promise<T> } | null;

export function singleFlight<T>(fn: () => Promise<T>) {
  let inflight: Inflight<T> = null;

  return () => {
    if (inflight) return inflight.p;

    const p = fn().finally(() => { inflight = null; });

    inflight = { p };

    return p;
  };
}










