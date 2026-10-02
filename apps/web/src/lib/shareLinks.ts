import { DEFAULT_NATIVE_API_ORIGIN } from './apiConfig';
export type ShareListItem = { id?: string | number; title: string; mediaType?: string; voteAverage?: number; userRating?: number };
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';
type Callbacks = { onSuccess?: (outcome: 'shared' | 'copied') => void; onError?: (error: unknown) => void };

// Explicit public base wins. Preview/development links otherwise stay local;
// native production links reuse the existing authoritative API origin.
export function getAppOrigin(): string {
  const configured = String(import.meta.env.VITE_PUBLIC_BASE_URL || '').trim();
  if (configured) return new URL(configured).origin;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (import.meta.env.MODE !== 'mobile' && /^https?:\/\//.test(origin) && !/https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(origin)) return origin;
  if (import.meta.env.DEV && origin) return origin;
  return DEFAULT_NATIVE_API_ORIGIN;
}
export function getFlickletShareStamp(): string { return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📱 Flicklet\n🔗 ${getAppOrigin()}\n`; }
export const shareItemKey = (item: { id?: string | number; mediaType?: string }) => `${item.mediaType}:${item.id}`;
export function formatListShareText(name: string, items: ShareListItem[], options?: { includeRatings?: boolean; footer?: boolean }): string {
  let text = `📋 ${name.trim() || 'Flicklet'}\n${'─'.repeat(30)}\n`;
  for (const item of items) {
    const rating = options?.includeRatings !== false && typeof item.voteAverage === 'number' && Number.isFinite(item.voteAverage) ? ` ⭐ TMDB ${item.voteAverage.toFixed(1)}/10` : '';
    text += `${item.mediaType === 'movie' ? '🎬' : '📺'} ${item.title}${rating}\n`;
  }
  text += '\n';
  return text + (options?.footer === false ? '' : getFlickletShareStamp());
}
export function formatShareSections(sections: { name: string; items: ShareListItem[] }[], selected: ReadonlySet<string>, includeRatings: boolean, handle?: string): string {
  const body = sections.map(section => {
    const unique = [...new Map(section.items.filter(item => selected.has(shareItemKey(item))).map(item => [shareItemKey(item), item])).values()];
    return unique.length ? formatListShareText(section.name, unique, { includeRatings, footer: false }) : '';
  }).join('');
  return `${handle?.trim() ? `Flicklet — @${handle.trim()}\n\n` : ''}${body}${getFlickletShareStamp()}`;
}
export function buildShowShareUrl(params: { tmdbId?: number | string; mediaType?: string; titleId?: string | number }): string {
  if (!/^[1-9]\d*$/.test(String(params.tmdbId)) || !Number.isSafeInteger(Number(params.tmdbId)) || !['movie', 'tv'].includes(params.mediaType || '')) throw new Error('Invalid title identity');
  const query = new URLSearchParams({ view: 'title', tmdbId: String(params.tmdbId), mediaType: params.mediaType! });
  return `${getAppOrigin()}/?${query}`;
}
function isLikelyMobile(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  return nav.userAgentData?.mobile ?? /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
}
async function deliver(payload: { title: string; text: string; url?: string }, callbacks: Callbacks): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function' && isLikelyMobile()) {
    let shared = false;
    try { await navigator.share(payload); shared = true; }
    catch (error) { if ((error as { name?: string })?.name === 'AbortError') return 'cancelled'; }
    if (shared) { callbacks.onSuccess?.('shared'); return 'shared'; }
  }
  try {
    await navigator.clipboard.writeText(payload.url ? `${payload.text}\n${payload.url}` : payload.text);
  } catch (error) { callbacks.onError?.(error); return 'failed'; }
  callbacks.onSuccess?.('copied');
  return 'copied';
}

export type SharePayload = { title: string; text: string; url: string } & Callbacks;
export function shareWithFallback({ title, text, url, ...callbacks }: SharePayload): Promise<ShareOutcome> { return deliver({ title, text, url }, callbacks); }
export function shareTextWithFallback({ title, text, ...callbacks }: { title: string; text: string } & Callbacks): Promise<ShareOutcome> { return deliver({ title, text }, callbacks); }
export function shareListWithFallback(list: { name?: string | null }, items: ShareListItem[], callbacks: Callbacks = {}): Promise<ShareOutcome> {
  const title = list.name?.trim() || 'Flicklet';
  return shareTextWithFallback({ title, text: formatListShareText(title, items), ...callbacks });
}
export function shareShowWithFallback(params: { tmdbId?: number | string; mediaType?: string; titleId?: string | number; title?: string }, callbacks: Callbacks = {}): Promise<ShareOutcome> {
  let url: string;
  try { url = buildShowShareUrl(params); }
  catch (error) { callbacks.onError?.(error); return Promise.resolve('failed'); }
  return shareWithFallback({ title: params.title || 'Flicklet', text: `Flicklet: ${params.title || ''}`, url, ...callbacks });
}
export async function handleShare(options: { title: string; text: string; url: string }, onSuccess?: () => void, onError?: (error: Error) => void): Promise<void> {
  await shareWithFallback({ ...options, onSuccess, onError: onError as Callbacks['onError'] });
}
