import { getFormattingLocale } from './language';

/** Dates are instants. Timezone stays runtime-local unless supplied by a caller.
 * Date-only parsing/episode semantics are deliberately owned by later passes. */
export function formatDate(value: Date | number, options: Intl.DateTimeFormatOptions = {}): string {
  const fields: Intl.DateTimeFormatOptions = options.dateStyle || options.timeStyle ? options : { year: 'numeric', month: 'short', day: 'numeric', ...options };
  return new Intl.DateTimeFormat(getFormattingLocale(), fields).format(value);
}

export function formatDateTime(value: Date | number, options: Intl.DateTimeFormatOptions = {}): string {
  const fields: Intl.DateTimeFormatOptions = options.dateStyle || options.timeStyle ? options : {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', ...options,
  };
  return new Intl.DateTimeFormat(getFormattingLocale(), fields).format(value);
}

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(getFormattingLocale(), options).format(value);
}

export function formatRating(value: number): string {
  return formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatInteger(value: number): string {
  return formatNumber(value, { maximumFractionDigits: 0 });
}
