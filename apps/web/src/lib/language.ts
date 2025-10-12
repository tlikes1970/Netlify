import React, { useEffect, useState } from 'react';
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
    const unsubscribe = languageManager.subscribe(() => {
      setLanguage(languageManager.getLanguage());
    });
    return unsubscribe;
  }, []);

  return language;
}

// React hook for translations
export function useTranslations() {
  const [translations, setTranslations] = useState(languageManager.getTranslations());

  useEffect(() => {
    const unsubscribe = languageManager.subscribe(() => {
      setTranslations(languageManager.getTranslations());
    });
    return unsubscribe;
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
