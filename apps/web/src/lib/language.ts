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
  private subscribers: Set<() => void> = new Set();

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

  private emitChange(): void {
    // Track notification for diagnostics
    if (typeof window !== 'undefined' && (window as any).flickerDiagnostics) {
      (window as any).flickerDiagnostics.logSubscription('LanguageManager', 'notify', { subscriberCount: this.subscribers.size });
    }
    
    // Notify via translation bus (supports batching when containment enabled)
    const update = {
      translations: this.getTranslations(),
      language: this.currentLanguage,
      timestamp: Date.now()
    };
    translationBus.notify(update);
    
    // Also notify legacy subscribers directly (for backward compatibility)
    this.subscribers.forEach(callback => callback());
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

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    // Track subscription for diagnostics
    if (typeof window !== 'undefined' && (window as any).flickerDiagnostics) {
      (window as any).flickerDiagnostics.logSubscription('LanguageManager', 'subscribe', {});
    }
    return () => this.subscribers.delete(callback);
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
    
    // Subscribe to translation bus (supports batched updates when containment enabled)
    const handleTranslationUpdate = (payload: TranslationUpdate | TranslationUpdate[]) => {
      // Normalize: if array (batched), use the last update (most recent)
      // If single, use it directly
      const update = Array.isArray(payload) ? payload[payload.length - 1] : payload;
      const newTranslations = update.translations;
      
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
    
    // Subscribe to translation bus
    const unsubscribeBus = translationBus.subscribe(handleTranslationUpdate);
    
    // Also subscribe to legacy languageManager for backward compatibility
    const unsubscribeLegacy = languageManager.subscribe(() => {
      const newTranslations = languageManager.getTranslations();
      handleTranslationUpdate({
        translations: newTranslations,
        language: languageManager.getLanguage(),
        timestamp: Date.now()
      });
    });
    
    // Return combined unsubscribe
    const unsubscribe = () => {
      unsubscribeBus();
      unsubscribeLegacy();
    };
    
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
