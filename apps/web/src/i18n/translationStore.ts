/**
 * Translation Store - Frame-coalesced single source of truth
 * 
 * All translation updates are queued and applied once per frame using last-write-wins.
 * Components subscribe via useSyncExternalStore for optimal React rendering.
 * 
 * Hard no-op guards prevent runaway updates by checking both reference and content hash.
 */

import { useSyncExternalStore, useRef, useMemo } from 'react';

export type Dict = Record<string, any>;

export type Update =
  | { type: 'dict'; dict: Dict }
  | { type: 'patch'; patch: Partial<Dict> }
  | { type: 'locale'; locale: string };

type Listener = () => void;

/**
 * Fast stable hash for dict content comparison
 */
function hashDict(d: Record<string, any>): string {
  // Fast-ish stable hash
  let h = 0;
  const s = JSON.stringify(d);
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

// Initialize with empty dict - will be set by LanguageManager on module load
let current: { dict: Dict; dictHash: string; locale: string; version: number } = {
  dict: Object.freeze({}),
  dictHash: hashDict({}),
  locale: 'en',
  version: 0,
};

// Track app start time for settle window
const startTs = typeof performance !== 'undefined' ? performance.now() : Date.now();

/**
 * Initialize store synchronously (called during module load)
 * This should be called once with initial translations
 */
export function initializeStore(dict: Dict, locale: string) {
  const dictHash = hashDict(dict);
  current = {
    dict: Object.isFrozen(dict) ? dict : Object.freeze(dict),
    dictHash,
    locale,
    version: 1,
  };
}

const listeners = new Set<Listener>();

// Dev-only: frame emit tracking
let lastFrame = -1;
let emitsThisFrame = 0;

// Dev-only: commits per minute tracking
let commitsThisMinute = 0;
let minuteStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

function emit() {
  // Dev-only: verify at most one emit per frame
  if (import.meta.env.DEV) {
    const f = Math.floor(performance.now() / 16);
    emitsThisFrame = (f === lastFrame) ? emitsThisFrame + 1 : 1;
    lastFrame = f;
    if (emitsThisFrame > 1) {
      // eslint-disable-next-line no-console
      console.warn('[i18n] more than one emit in a frame');
    }
    
    // Track commits per minute
    commitsThisMinute++;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - minuteStart > 60000) {
      // eslint-disable-next-line no-console
      console.info('[i18n] commits/min:', commitsThisMinute);
      commitsThisMinute = 0;
      minuteStart = now;
    }
  }

  for (const l of listeners) l();
}

let queued: Update[] = [];
let scheduled = false;
let microtaskQueued = false;

/**
 * Commit changes with strict no-op guards (reference + hash equality)
 */
function commit(nextDict: Dict, nextLocale: string) {
  const nextHash = hashDict(nextDict);
  
  // Hard no-op guard: both identity and content equal
  if (current.dict === nextDict && current.locale === nextLocale) return;
  if (current.dictHash === nextHash && current.locale === nextLocale) return;

  const frozen = Object.isFrozen(nextDict) ? nextDict : Object.freeze(nextDict);
  current = {
    dict: frozen,
    dictHash: nextHash,
    locale: nextLocale,
    version: current.version + 1,
  };
  emit();
}

function schedule() {
  if (scheduled) return;
  if (!microtaskQueued) {
    microtaskQueued = true;
    Promise.resolve().then(() => {
      microtaskQueued = false;
      if (scheduled) return;
      scheduled = true;
      const rAF = typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16);
      rAF(() => {
        scheduled = false;
        if (queued.length === 0) return;

        // last-write-wins coalescing: collapse to final snapshot
        let lastDict = current.dict;
        let lastLocale = current.locale;

        for (const u of queued) {
          if (u.type === 'dict') {
            lastDict = u.dict;
          } else if (u.type === 'patch') {
            // shallow merge patch
            lastDict = { ...lastDict, ...u.patch };
          } else if (u.type === 'locale') {
            lastLocale = u.locale;
          }
        }

        queued = [];

        // One-time settle window: ignore redundant updates during first 1000ms
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const redundant = hashDict(lastDict) === current.dictHash && lastLocale === current.locale;

        if (now - startTs < 1000 && redundant) {
          // ignore redundant startup "updates"
          return;
        }

        // Commit exactly once per frame with final snapshot
        commit(lastDict, lastLocale);
      });
    });
  }
}

export function queueUpdate(u: Update) {
  // no-op guards to avoid pointless re-renders
  if (u.type === 'dict' && u.dict === current.dict) return;
  if (u.type === 'locale' && u.locale === current.locale) return;
  if (u.type === 'patch' && Object.keys(u.patch).length === 0) return;
  
  // Drop redundant first-paint dict update (if initial dict equals current and version is 0)
  if (u.type === 'dict' && u.dict === current.dict && current.version === 0) {
    return; // redundant initial dict
  }
  
  // Hash-based guard: drop if content hash matches (catches object recreation with same content)
  if (u.type === 'dict') {
    const hash = hashDict(u.dict);
    if (hash === current.dictHash) return;
  }
  
  queued.push(u);
  schedule();
}

export function getSnapshot() {
  return current;
}

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Generic selector hook using useSyncExternalStore
 * Components subscribe to only the selected slice and re-render only when that slice changes.
 * 
 * Custom equality is handled via useMemo wrapper around the store subscription.
 */
export function useTranslationSelector<T>(
  selector: (s: typeof current) => T,
  equals?: (a: T, b: T) => boolean
): T {
  const prevRef = useRef<T | undefined>(undefined);
  
  // Subscribe to store changes
  const snapshot = useSyncExternalStore(
    subscribe,
    () => getSnapshot(),
    () => getSnapshot()
  );
  
  // Select value from snapshot
  const current = selector(snapshot);
  
  // Apply custom equality if provided, otherwise use reference equality
  return useMemo(() => {
    if (equals && prevRef.current !== undefined) {
      if (equals(prevRef.current, current)) {
        return prevRef.current;
      }
    }
    prevRef.current = current;
    return current;
  }, [current, equals]);
}

