import { useEffect, useState } from 'react';
import * as React from 'react';
import type { Language } from './language.types';
import TRANSLATIONS from './translations';

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
    this.subscribers.forEach(callback => callback());
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  setLanguage(language: Language): void {
    this.currentLanguage = language;
    this.saveLanguage();
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
    // Track subscription for diagnostics
    if (diagnostics) {
      diagnostics.logEffect('useTranslations', 'effect-mount', []);
      diagnostics.logSubscription('useTranslations', 'subscribe', { 
        renderCount: renderCountRef.current,
        mountId: mountIdRef.current
      });
    }
    
    const unsubscribe = languageManager.subscribe(() => {
      const newTranslations = languageManager.getTranslations();
      
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
    });
    
    return () => {
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
