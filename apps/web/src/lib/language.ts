import { useEffect, useState, useMemo } from 'react';
import * as React from 'react';
import type { Language } from './language.types';
import TRANSLATIONS from './translations';
// ⚠️ REMOVED: i18nDiagnostics import disabled
// const i18nDiagnostics = null; // Disabled
import { translationBus, type TranslationUpdate } from '../i18n/translationBus';
import { queueUpdate, useTranslationSelector, initializeStore, getSnapshot, type Dict } from '../i18n/translationStore';
import { stageBootDict, stageBootLocale } from '../i18n/bootCollector';

const KEY = 'flicklet.language.v2';

// Language state management
class LanguageManager {
  private currentLanguage: Language;
  // Removed private subscribers - translationBus is now the single source of truth

  constructor() {
    this.currentLanguage = this.loadLanguage();
  }

  private loadLanguage(): Language {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored && (stored === 'en' || stored === 'es')) {
        return stored as Language;
      }
    } catch (e) {
      console.error("Failed to load language from localStorage", e);
    }
    return 'en'; // Default to English
  }

  private saveLanguage(): void {
    localStorage.setItem(KEY, this.currentLanguage);
    this.emitChange();
  }

  // Equality guard: track last payload to drop repeats of the exact same payload
  private __lastPayload: { translations: any; language: string } | null = null;

  private emitChange(): void {
    // SINGLE SOURCE OF TRUTH: Queue updates to frame-coalesced store
    // This ensures at most one render per frame with last-write-wins coalescing
    const translations = this.getTranslations();
    
    // Hard guard: check store's current state before queuing
    const snapshot = getSnapshot();
    if (snapshot.dict === translations && snapshot.locale === this.currentLanguage) {
      // Store already has these exact values, skip entirely
      return;
    }
    
    // Equality guard: drop repeats of the exact same payload
    if (this.__lastPayload && 
        this.__lastPayload.translations === translations && 
        this.__lastPayload.language === this.currentLanguage) {
      // Skip duplicate notification
      return;
    }
    
    // Update last payload
    this.__lastPayload = { translations, language: this.currentLanguage };
    
    // ⚠️ REMOVED: flickerDiagnostics logging disabled
    
    // Queue to frame-coalesced store (replaces direct notify)
    // Store's hash guard will catch any remaining redundant updates
    queueUpdate({ type: 'dict', dict: translations });
    queueUpdate({ type: 'locale', locale: this.currentLanguage });
    
    // Also notify translationBus for backward compatibility with existing listeners
    const update = {
      translations,
      language: this.currentLanguage,
      timestamp: Date.now()
    };
    translationBus.notify(update);
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  setLanguage(language: Language): void {
    this.currentLanguage = language;
    this.saveLanguage();
    
    // ⚠️ REMOVED: I18N Diagnostics tracking disabled
  }

  /**
   * @deprecated Use translationBus.subscribe() instead
   * This is kept for backward compatibility but routes through translationBus
   */
  subscribe(callback: () => void): () => void {
    // Route through translation bus to maintain single source of truth
    const listener = (_payload: any) => {
      // Legacy callbacks don't expect payload, just call them
      callback();
    };
    
    const unsubscribe = translationBus.subscribe(listener);
    
    // ⚠️ REMOVED: flickerDiagnostics logging disabled
    
    return unsubscribe;
  }

  getTranslations() {
    // Return direct reference - never synthesize new objects
    // TRANSLATIONS is a constant object, so this is safe
    return TRANSLATIONS[this.currentLanguage];
  }
}

export const languageManager = new LanguageManager();

// Stage boot data for coordinated first-frame emission
// This prevents initialization burst by collecting dict and locale separately
if (typeof window !== 'undefined') {
  const initialTranslations = languageManager.getTranslations();
  const initialLocale = languageManager.getLanguage();
  
  // Initialize store synchronously for immediate reads
  initializeStore(initialTranslations, initialLocale);
  
  // Stage for boot collector (will emit once both are ready, but they already are)
  // This ensures consistent behavior if async loading is added later
  stageBootDict(initialTranslations);
  stageBootLocale(initialLocale);
}

// Expose to window for i18nDiagnostics to access (breaks circular dependency)
if (typeof window !== 'undefined') {
  (window as any).__languageManager = languageManager;
}

// React hook for language
export function useLanguage() {
  const [language, setLanguage] = useState(languageManager.getLanguage());

  useEffect(() => {
    // ⚠️ REMOVED: flickerDiagnostics logging disabled
    
    const unsubscribe = languageManager.subscribe(() => {
      const newLanguage = languageManager.getLanguage();
      // ⚠️ REMOVED: flickerDiagnostics logging disabled
      setLanguage(newLanguage);
    });
    return unsubscribe;
  }, []);

  return language;
}

/**
 * Slice-selector hook for translations
 * Components subscribe to only the keys they need and re-render only when those keys change.
 * 
 * @param keys - Array of translation keys to subscribe to. If null/undefined, subscribes to entire dict (not recommended).
 * @returns Translation getter function
 */
export function useT(keys?: string[] | null) {
  // Select only what caller needs; default whole dict read is allowed but not encouraged
  // Use memoized keys string to prevent unnecessary selector recreation
  const keysStr = useMemo(() => Array.isArray(keys) ? keys.join('|') : 'ALL', [keys]);
  
  const slice = useTranslationSelector(
    (s) => {
      if (!keys || keys.length === 0) return s.dict;
      // Create minimal slice - only selected keys
      const out: Record<string, any> = {};
      for (const k of keys) out[k] = s.dict[k];
      return out;
    },
    // shallow equality for slices - prevents re-render when slice content unchanged
    (a, b) => {
      if (a === b) return true;
      const ak = Object.keys(a), bk = Object.keys(b);
      if (ak.length !== bk.length) return false;
      for (let i = 0; i < ak.length; i++) {
        const k = ak[i];
        if (a[k] !== (b as any)[k]) return false;
      }
      return true;
    }
  );

  // Return a simple getter - memoized to prevent recreation
  const t = useMemo(() => {
    return (k: string) => (slice as any)[k];
  }, [slice, keysStr]);

  return t;
}

// React hook for translations (backward compatible, now uses frame-coalesced store)
export function useTranslations() {
  // ⚠️ REMOVED: flickerDiagnostics disabled
  const renderCountRef = React.useRef(0);
  const mountIdRef = React.useRef<string | null>(null);
  
  // Track every render
  renderCountRef.current += 1;
  const isFirstRender = renderCountRef.current === 1;
  
  // Generate unique mount ID for this hook instance
  if (isFirstRender && !mountIdRef.current) {
    mountIdRef.current = `useTranslations-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // ⚠️ REMOVED: I18N Diagnostics and flickerDiagnostics tracking disabled
  
  // Use frame-coalesced store via useSyncExternalStore
  // This ensures at most one render per frame with stable identity
  const prevDictRef = React.useRef<Dict | null>(null);
  const armedRef = React.useRef(false);
  
  // Arm subscription after first microtask to ignore pre-armed boot updates
  React.useEffect(() => {
    Promise.resolve().then(() => {
      armedRef.current = true;
    });
  }, []);
  
  const translations = useTranslationSelector(
    (s) => s.dict,
    (a, b) => {
      // Hard no-op guard: only re-render if dict reference actually changed
      if (a === b) return true;
      
      // Suppress reactions until armed (ignore pre-armed boot burst)
      if (!armedRef.current) {
        prevDictRef.current = a;
        return true; // Return true to prevent re-render during boot
      }
      
      // Store previous for diagnostics
      prevDictRef.current = a;
      return false;
    }
  );

  // ⚠️ REMOVED: flickerDiagnostics tracking disabled

  // Also subscribe to translationBus for backward compatibility
  useEffect(() => {
    // ⚠️ REMOVED: I18N Diagnostics and flickerDiagnostics tracking disabled
    
    // Subscribe to translationBus for diagnostics only (store is primary source)
    const handleTranslationUpdate = (_payload: TranslationUpdate | TranslationUpdate[]) => {
      // ⚠️ REMOVED: I18N Diagnostics tracking disabled
    };
    
    const unsubscribe = translationBus.subscribe(handleTranslationUpdate);
    
    return () => {
      // ⚠️ REMOVED: I18N Diagnostics tracking disabled
      
      // ⚠️ REMOVED: flickerDiagnostics logging disabled
      unsubscribe();
    };
  }, []);

  return translations;
}

// Helper function to get translation by key
export function t(key: keyof typeof TRANSLATIONS.en): string {
  return languageManager.getTranslations()[key];
}

// Helper function to change language
export function changeLanguage(language: Language): void {
  languageManager.setLanguage(language);
}
