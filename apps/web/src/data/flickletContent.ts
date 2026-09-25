/**
 * Flicklet voice surface types.
 * Line content lives in flickletPersonalityPhase2.ts (Phase 2).
 */

export type FlickletSurface =
  | 'home.header'
  | 'home.marquee'
  | 'empty.watching'
  | 'empty.want'
  | 'empty.watched'
  | 'empty.upnext'
  | 'empty.customList'
  | 'discover.rowIntro';

export type FlickletLine = {
  id: string;
  text: string;
};

export const FLICKLET_VOICE_ID = 'flicklet' as const;
