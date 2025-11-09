import { useEffect, useState, useMemo } from 'react';
import * as React from 'react';
import type { Language } from './language.types';
import TRANSLATIONS from './translations';
import { i18nDiagnostics } from './i18nDiagnostics';
import { translationBus, type TranslationUpdate } from '../i18n/translationBus';
import { queueUpdate, useTranslationSelector, initializeStore, type Dict } from '../i18n/translationStore';

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
    
    // Equality guard: drop repeats of the exact same payload
    if (this.__lastPayload && 
        this.__lastPayload.translations === translations && 
        this.__lastPayload.language === this.currentLanguage) {
      // Skip duplicate notification
      return;
    }
    
    // Update last payload
    this.__lastPayload = { translations, language: this.currentLanguage };
    
    // Track notification for diagnostics
    if (typeof window !== 'undefined' && (window as any).flickerDiagnostics) {
      (window as any).flickerDiagnostics.logSubscription('LanguageManager', 'notify', {});
    }
    
    // Queue to frame-coalesced store (replaces direct notify)
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
    const changed = this.currentLanguage !== language;
    this.currentLanguage = language;
    this.saveLanguage();
    
    // I18N Diagnostics - track language changes
    if (changed && i18nDiagnostics) {
      i18nDiagnostics.logEvent('language-change');
    }
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
    
    // Track subscription for diagnostics
    if (typeof window !== 'undefined' && (window as any).flickerDiagnostics) {
      (window as any).flickerDiagnostics.logSubscription('LanguageManager', 'subscribe', {});
    }
    
    return unsubscribe;
  }

  getTranslations() {
    return TRANSLATIONS[this.currentLanguage];
  }
}

export const languageManager = new LanguageManager();

// Initialize store with current translations synchronously
if (typeof window !== 'undefined') {
  const initialTranslations = languageManager.getTranslations();
  initializeStore(initialTranslations, languageManager.getLanguage());
}

// Expose to window for i18nDiagnostics to access (breaks circular dependency)
if (typeof window !== 'undefined') {
  (window as any).__languageManager = languageManager;
}

// React hook for language
export function useLanguage() {
  const [language, setLanguage] = useState(languageManager.getLanguage());

  useEffect(() => {
    // Track subscription for diagnostics
    if (typeof window !== 'undefined' && (window as any).flickerDiagnostics) {
      (window as any).flickerDiagnostics.logSubscription('useLanguage', 'subscribe', {});
    }
    
    const unsubscribe = languageManager.subscribe(() => {
      const newLanguage = languageManager.getLanguage();
      // Track state change for diagnostics
      if (typeof window !== 'undefined' && (window as any).flickerDiagnostics) {
        (window as any).flickerDiagnostics.logStateChange('useLanguage', 'language', language, newLanguage);
      }
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
  const slice = useTranslationSelector(
    (s) => {
      if (!keys || keys.length === 0) return s.dict;
      const out: Record<string, any> = {};
      for (const k of keys) out[k] = s.dict[k];
      return out;
    },
    // shallow equality for slices
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

  // Return a simple getter
  const t = useMemo(() => {
    return (k: string) => (slice as any)[k];
  }, [slice, Array.isArray(keys) ? keys.join('|') : 'ALL']);

  return t;
}

// React hook for translations (backward compatible, now uses frame-coalesced store)
export function useTranslations() {
  const diagnostics = typeof window !== 'undefined' ? (window as any).flickerDiagnostics : null;
  const renderCountRef = React.useRef(0);
  const mountIdRef = React.useRef<string | null>(null);
  
  // Track every render
  renderCountRef.current += 1;
  const isFirstRender = renderCountRef.current === 1;
  
  // Generate unique mount ID for this hook instance
  if (isFirstRender && !mountIdRef.current) {
    mountIdRef.current = `useTranslations-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // I18N Diagnostics tracking
  if (i18nDiagnostics && mountIdRef.current) {
    if (isFirstRender) {
      i18nDiagnostics.logMount(mountIdRef.current);
    } else {
      i18nDiagnostics.logRender(mountIdRef.current);
    }
  }
  
  if (diagnostics) {
    if (isFirstRender) {
      diagnostics.logMount('useTranslations', { 
        renderCount: renderCountRef.current,
        mountId: mountIdRef.current 
      });
    } else {
      diagnostics.logRender('useTranslations', { 
        renderCount: renderCountRef.current, 
        isReRender: true,
        mountId: mountIdRef.current
      });
    }
  }
  
  // Use frame-coalesced store via useSyncExternalStore
  // This ensures at most one render per frame with stable identity
  const prevDictRef = React.useRef<Dict | null>(null);
  const translations = useTranslationSelector(
    (s) => s.dict,
    (a, b) => {
      // Hard no-op guard: only re-render if dict reference actually changed
      if (a === b) return true;
      // Store previous for diagnostics
      prevDictRef.current = a;
      return false;
    }
  );

  // Track state change for diagnostics
  useEffect(() => {
    if (diagnostics && prevDictRef.current !== translations) {
      diagnostics.logStateChange('useTranslations', 'translations', prevDictRef.current, translations);
    }
  }, [translations, diagnostics]);

  // Also subscribe to translationBus for backward compatibility diagnostics
  useEffect(() => {
    const mountId = mountIdRef.current;
    const subscriptionTime = Date.now();
    
    // I18N Diagnostics tracking
    if (i18nDiagnostics && mountId) {
      i18nDiagnostics.logSubscription(mountId, subscriptionTime);
      i18nDiagnostics.logEvent('subscription');
    }
    
    // Track subscription for diagnostics
    if (diagnostics) {
      diagnostics.logEffect('useTranslations', 'effect-mount', []);
      diagnostics.logSubscription('useTranslations', 'subscribe', { 
        renderCount: renderCountRef.current,
        mountId: mountIdRef.current
      });
    }
    
    // Subscribe to translationBus for diagnostics only (store is primary source)
    const handleTranslationUpdate = (_payload: TranslationUpdate | TranslationUpdate[]) => {
      // I18N Diagnostics - track provider identity changes
      if (i18nDiagnostics) {
        i18nDiagnostics.logEvent('provider-notify');
      }
    };
    
    const unsubscribe = translationBus.subscribe(handleTranslationUpdate);
    
    return () => {
      // I18N Diagnostics tracking
      if (i18nDiagnostics && mountId) {
        i18nDiagnostics.logUnmount(mountId);
      }
      
      if (diagnostics) {
        diagnostics.logEffect('useTranslations', 'effect-unmount', []);
        diagnostics.logUnmount('useTranslations', { 
          renderCount: renderCountRef.current,
          mountId: mountIdRef.current
        });
      }
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
