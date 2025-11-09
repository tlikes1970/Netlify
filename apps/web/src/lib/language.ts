import { useEffect, useState } from 'react';
import * as React from 'react';
import type { Language } from './language.types';
import TRANSLATIONS from './translations';
import { i18nDiagnostics } from './i18nDiagnostics';
import { translationBus, type TranslationUpdate } from '../i18n/translationBus';

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
    // SINGLE SOURCE OF TRUTH: Only notify via translation bus
    // This is the ONLY notification path - no legacy subscribers
    const translations = this.getTranslations();
    const update = {
      translations,
      language: this.currentLanguage,
      timestamp: Date.now()
    };
    
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

// React hook for translations
export function useTranslations() {
  const diagnostics = typeof window !== 'undefined' ? (window as any).flickerDiagnostics : null;
  const renderCountRef = React.useRef(0);
  const mountIdRef = React.useRef<string | null>(null);
  const prevTranslationsRef = React.useRef(languageManager.getTranslations());
  
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
  
  const [translations, setTranslations] = useState(languageManager.getTranslations());

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
    
    // SINGLE SOURCE OF TRUTH: Subscribe ONLY to translation bus
    // No legacy subscriptions - translationBus is the canonical bus
    const handleTranslationUpdate = (payload: TranslationUpdate | TranslationUpdate[]) => {
      // Normalize: if array (batched), use the last update (most recent)
      // If single, use it directly
      const updates = Array.isArray(payload) ? payload : [payload];
      const last = updates[updates.length - 1];
      const newTranslations = last.translations;
      
      // I18N Diagnostics - track provider identity changes
      if (i18nDiagnostics) {
        i18nDiagnostics.logEvent('provider-notify');
      }
      
      // Only update if translations actually changed (prevent unnecessary re-renders)
      // Compare by reference since TRANSLATIONS[language] returns constant objects
      if (newTranslations !== prevTranslationsRef.current) {
        if (diagnostics) {
          diagnostics.logStateChange('useTranslations', 'translations', prevTranslationsRef.current, newTranslations);
        }
        prevTranslationsRef.current = newTranslations;
        setTranslations(newTranslations);
      } else if (diagnostics) {
        // Log when we skip an update to track unnecessary notifications
        diagnostics.log('useTranslations', 'SKIP_UPDATE', { reason: 'translations unchanged' });
      }
    };
    
    // Subscribe ONLY to translation bus (single source of truth)
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
