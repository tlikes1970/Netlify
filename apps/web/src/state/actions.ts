import { on } from '../lib/events';
import { Library } from '../lib/storage';
import type { MediaType } from '../components/cards/card.types';
import { fetchNextAirDate } from '../tmdb/tv';
import { settingsManager, getPersonalityText } from '../lib/settings';

// Toast system for user feedback
let toastCallback: ((message: string, type: 'success' | 'error' | 'info') => void) | null = null;

export function setToastCallback(callback: (message: string, type: 'success' | 'error' | 'info') => void) {
  toastCallback = callback;
}

export function mountActionBridge() {
  const off1 = on('card:want', ({ id, mediaType }) => {
    // Search "Want to Watch" goes to wishlist, not watching
    Library.upsert({ id, mediaType: mediaType as MediaType, title: String(id) }, 'wishlist');
    
    // Show personality-based feedback
    const settings = settingsManager.getSettings();
    const message = getPersonalityText('itemAdded', settings.personalityLevel);
    toastCallback?.(message, 'success');
  });

  const off2 = on('card:watched', ({ id, mediaType }) => {
    // Mark as watched
    Library.upsert({ id, mediaType: mediaType as MediaType, title: String(id) }, 'watched');
    
    // Show personality-based feedback
    const settings = settingsManager.getSettings();
    const message = getPersonalityText('itemAdded', settings.personalityLevel);
    toastCallback?.(message, 'success');
  });

  const off3 = on('card:notInterested', ({ id, mediaType }) => {
    // Mark as not interested
    Library.upsert({ id, mediaType: mediaType as MediaType, title: String(id) }, 'not');
    
    // Show personality-based feedback
    const settings = settingsManager.getSettings();
    const message = getPersonalityText('itemRemoved', settings.personalityLevel);
    toastCallback?.(message, 'success');
  });

  // Holiday add is implemented in a later step; no‑op for now
  const off4 = on('card:holidayAdd', () => {});

  // Optional: startWatching event from Wishlist tab or details view
  const off5 = on('card:startWatching', async ({ id, mediaType }: { id: number|string; mediaType: 'movie'|'tv' }) => {
    let nextAirDate: string | null = null;
    if (mediaType === 'tv') {
      nextAirDate = await fetchNextAirDate(Number(id));
    }
    Library.upsert({ id, mediaType: mediaType as MediaType, title: String(id), nextAirDate }, 'watching');
    
    // Show personality-based feedback
    const settings = settingsManager.getSettings();
    const message = getPersonalityText('itemAdded', settings.personalityLevel);
    toastCallback?.(message, 'success');
  });

  return () => { off1(); off2(); off3(); off4(); off5(); };
}
