/**
 * Translation Store - Frame-coalesced single source of truth
 * 
 * All translation updates are queued and applied once per frame using last-write-wins.
 * Components subscribe via useSyncExternalStore for optimal React rendering.
 */

import { useSyncExternalStore, useRef, useMemo } from 'react';

export type Dict = Record<string, any>;

export type Update =
  | { type: 'dict'; dict: Dict }
  | { type: 'patch'; patch: Partial<Dict> }
  | { type: 'locale'; locale: string };

type Listener = () => void;

// Initialize with empty dict - will be set by LanguageManager on module load
let current: { dict: Dict; locale: string; version: number } = {
  dict: Object.freeze({}),
  locale: 'en',
  version: 0,
};

/**
 * Initialize store synchronously (called during module load)
 * This should be called once with initial translations
 */
export function initializeStore(dict: Dict, locale: string) {
  current = {
    dict: Object.isFrozen(dict) ? dict : Object.freeze(dict),
    locale,
    version: 1,
  };
}

const listeners = new Set<Listener>();

// Dev-only: frame emit tracking
let lastFrame = -1;
let emitsThisFrame = 0;

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
  }

  for (const l of listeners) l();
}

let queued: Update[] = [];
let scheduled = false;
let microtaskQueued = false;

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

        // last-write-wins coalescing
        let nextDict = current.dict;
        let nextLocale = current.locale;
        let changed = false;

        for (const u of queued) {
          if (u.type === 'dict') {
            if (nextDict !== u.dict) {
              nextDict = u.dict;
              changed = true;
            }
          } else if (u.type === 'patch') {
            // shallow merge patch
            const merged = { ...nextDict, ...u.patch };
            if (nextDict !== merged) {
              nextDict = merged;
              changed = true;
            }
          } else if (u.type === 'locale') {
            if (nextLocale !== u.locale) {
              nextLocale = u.locale;
              changed = true;
            }
          }
        }

        queued = [];

        if (changed) {
          // freeze for identity stability
          const frozen = (Object.isFrozen(nextDict) ? nextDict : Object.freeze(nextDict));
          current = {
            dict: frozen,
            locale: nextLocale,
            version: current.version + 1,
          };
          emit();
        }
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

