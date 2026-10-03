import type { Language } from '../lib/language.types';
import { LANGUAGE_LOCALES } from './localeConfig';

export type InterpolationValues = Readonly<Record<string, string | number>>;
export type TranslationDictionaries = Record<Language, Readonly<Record<string, unknown>>>;
export type PluralKeys = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
const reported = new Set<string>();

function diagnostic(message: string): void {
  if ((import.meta.env.DEV || import.meta.env.MODE === 'test') && !reported.has(message)) {
    reported.add(message);
    console.warn(`[i18n] ${message}`);
  }
}
const usable = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function resolveTranslation(dictionaries: TranslationDictionaries, language: Language, key: string): string {
  const selected = Object.prototype.hasOwnProperty.call(dictionaries[language], key) ? dictionaries[language][key] : undefined;
  if (usable(selected)) return selected;
  diagnostic(`Missing ${language} translation: ${key}`);
  const english = Object.prototype.hasOwnProperty.call(dictionaries.en, key) ? dictionaries.en[key] : undefined;
  if (usable(english)) return english;
  return `[${key}]`;
}

/** Stable frozen dictionaries retain the store's identity/hash guarantees.
 * The proxy handles accidental property lookups without blank/undefined UI. */
export function createTranslationDictionary<T extends object>(dictionaries: TranslationDictionaries, language: Language): T {
  const values: Record<string, string> = {};
  for (const key of new Set([...Object.keys(dictionaries.en), ...Object.keys(dictionaries[language])])) {
    values[key] = resolveTranslation(dictionaries, language, key);
  }
  return new Proxy(Object.freeze(values), {
    get(target, key, receiver) {
      // Preserve language/runtime machinery (JSON serialization, React inspection).
      if (typeof key !== 'string' || key === 'toJSON' || key === 'then' || key in Object.prototype) return Reflect.get(target, key, receiver);
      return Object.prototype.hasOwnProperty.call(target, key) ? target[key] : resolveTranslation(dictionaries, language, key);
    },
  }) as T;
}

export function interpolate(template: string, values: InterpolationValues = {}): string {
  return template.replace(/\{([\w]+)\}/g, (placeholder, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) return String(values[key]);
    diagnostic(`Missing interpolation value: ${key}`);
    return placeholder;
  });
}

/** Separate dictionary keys per form; no schema or framework migration. */
export function selectPluralKey(keys: PluralKeys, count: number, language: Language): string {
  const category = new Intl.PluralRules(LANGUAGE_LOCALES[language].formatting).select(count);
  return keys[category] ?? keys.other;
}
