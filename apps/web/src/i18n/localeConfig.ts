import type { Language } from '../lib/language.types';

/** Language describes text/formatting, never the user's geographic region. */
export const LANGUAGE_LOCALES = {
  en: { formatting: 'en-US', metadata: 'en-US' },
  es: { formatting: 'es', metadata: 'es' },
} as const satisfies Record<Language, { formatting: string; metadata: string }>;

export function supportedLanguage(value: unknown): Language {
  return value === 'es' ? 'es' : 'en';
}
