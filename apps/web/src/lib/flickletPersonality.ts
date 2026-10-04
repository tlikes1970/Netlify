import { languageManager, t } from "./language";
import { PERSONALITY_SPANISH } from "../data/flickletPersonalitySpanish";
/**
 * Flicklet personality resolver — Phase 2 surfaces.
 */

import type { PersonalityLevel } from './settings';
import {
  type FlickletSurface,
  type FlickletLine,
  FLICKLET_VOICE_ID,
} from '../data/flickletContent';
import {
  getLinesForContext,
  personalityTierFromLevel,
  type PersonalityContext,
} from '../data/flickletPersonalityPhase2';
import {
  resolveEmptyStateContext,
  resolveForYouIntroContext,
  resolveHomeHeaderContext,
} from './flickletPersonalityContext';

export { FLICKLET_VOICE_ID };
import { getLibrarySignals } from './librarySignals';

const SEEN_KEY_PREFIX = 'flicklet.personality.seen.';
const LAST_KEY_PREFIX = 'flicklet.personality.last.';
const MAX_SEEN = 5;

export type FlickletContext = {
  username?: string;
  rowTitle?: string;
  genre?: string;
  subGenre?: string;
  listName?: string;
};

function getSeen(surface: string): string[] {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY_PREFIX + surface);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getLastPicked(surface: string): string | null {
  try {
    return sessionStorage.getItem(LAST_KEY_PREFIX + surface);
  } catch {
    return null;
  }
}

function markSeen(surface: string, lineId: string): void {
  const seen = getSeen(surface);
  const next = [...seen.filter((id) => id !== lineId), lineId].slice(-MAX_SEEN);
  try {
    sessionStorage.setItem(SEEN_KEY_PREFIX + surface, JSON.stringify(next));
    sessionStorage.setItem(LAST_KEY_PREFIX + surface, lineId);
  } catch {
    /* ignore quota */
  }
}

export function clearFlickletPersonalitySession(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(SEEN_KEY_PREFIX) || key?.startsWith(LAST_KEY_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

function interpolate(
  text: string,
  ctx: FlickletContext,
  signals: ReturnType<typeof getLibrarySignals>
): string {
  const replacements: Record<string, string> = {
    '{username}': ctx.username ?? '',
    '{wantCount}': String(signals.wantCount),
    '{watchingCount}': String(signals.watchingCount),
    '{watchedCount}': String(signals.watchedCount),
    '{notCount}': String(signals.notCount),
    '{totalCount}': String(signals.totalCount),
    '{count}': String(signals.totalCount),
    '{rowTitle}': ctx.rowTitle ?? t('contentThisGenre'),
    '{genre}': ctx.genre ?? ctx.rowTitle ?? t('contentThisGenre'),
    '{listName}': ctx.listName ?? t('contentThisList'),
  };

  let out = text;
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(token).join(value);
  }
  out = out.replace(/\{username\},?\s*/g, '').replace(/\s+/g, ' ').trim();
  return out;
}

function pickFromPool(
  surface: string,
  pool: FlickletLine[],
  ctx: FlickletContext,
  signals: ReturnType<typeof getLibrarySignals>
): string {
  if (pool.length === 0) return '';

  const seen = getSeen(surface);
  const last = getLastPicked(surface);

  let candidates = pool.filter((line) => !seen.includes(line.id));
  if (last && candidates.length > 1) {
    candidates = candidates.filter((line) => line.id !== last);
  }
  if (candidates.length === 0) {
    candidates = pool.filter((line) => line.id !== last);
  }
  if (candidates.length === 0) {
    candidates = pool;
  }

  const index =
    Math.abs(
      (Date.now() + surface.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
        candidates.length
    ) % candidates.length;

  const chosen = candidates[index];
  markSeen(surface, chosen.id);
  return interpolate(localizedPersonalityLine(chosen), ctx, signals);
}

function resolveContextPool(
  context: PersonalityContext,
  level: PersonalityLevel
): FlickletLine[] {
  const tier = personalityTierFromLevel(level);
  return getLinesForContext(context, tier);
}

function normalizeLevel(level: PersonalityLevel | undefined): PersonalityLevel {
  if (level === 1 || level === 2 || level === 3) return level;
  return 2;
}

/**
 * Resolve one line for a Phase 2 surface.
 */
export function resolveFlickletLine(
  surface: FlickletSurface,
  personalityLevel: PersonalityLevel | undefined,
  context: FlickletContext = {}
): string {
  const level = normalizeLevel(personalityLevel);
  const signals = getLibrarySignals();

  if (surface === 'home.header') {
    const headerContext = resolveHomeHeaderContext(signals);
    const pool = resolveContextPool(headerContext, level);
    return pickFromPool(`home.header.${headerContext}`, pool, context, signals);
  }

  if (surface === 'home.marquee') {
    const pool = resolveContextPool('Home Marquee - Rotating', level);
    return pickFromPool('home.marquee', pool, context, signals);
  }

  if (surface.startsWith('empty.')) {
    const emptyContext = resolveEmptyStateContext(
      surface as
        | 'empty.want'
        | 'empty.watched'
        | 'empty.upnext'
        | 'empty.customList'
        | 'empty.watching'
    );
    const pool = resolveContextPool(emptyContext, level);
    return pickFromPool(surface, pool, context, signals);
  }

  if (surface === 'discover.rowIntro') {
    const introContext = resolveForYouIntroContext(
      signals,
      context.genre,
      context.subGenre
    );
    const pool = resolveContextPool(introContext, level);
    const rowKey = context.rowTitle ?? context.genre ?? 'default';
    return pickFromPool(`discover.rowIntro.${rowKey}`, pool, context, signals);
  }

  return '';
}

/** All marquee lines for rotation (HomeMarquee cycles through array). */
export function getFlickletMarqueeMessages(
  personalityLevel: PersonalityLevel | undefined
): string[] {
  const level = normalizeLevel(personalityLevel);
  const pool = resolveContextPool('Home Marquee - Rotating', level);
  if (pool.length === 0) return [];

  const signals = getLibrarySignals();
  return pool.map((line) => interpolate(localizedPersonalityLine(line), {}, signals));
}

/** Map legacy TextKey-style empty keys to Flicklet surfaces. */
export function flickletSurfaceFromLegacyKey(key: string): FlickletSurface | null {
  const map: Record<string, FlickletSurface> = {
    welcome: 'home.header',
    emptyWatching: 'empty.watching',
    emptyWishlist: 'empty.want',
    emptyWatched: 'empty.watched',
    emptyUpNext: 'empty.upnext',
  };
  return map[key] ?? null;
}

export function localizedPersonalityLine(line: FlickletLine): string {
  return languageManager.getLanguage() === "es" ? PERSONALITY_SPANISH[line.id] ?? line.text : line.text;
}
