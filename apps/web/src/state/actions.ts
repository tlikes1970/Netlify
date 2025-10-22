import { on } from '../lib/events';
import { Library } from '../lib/storage';
import type { MediaType } from '../components/cards/card.types';
import { fetchNextAirDate } from '../tmdb/tv';
import { settingsManager, getPersonalityText } from '../lib/settings';
import { get } from '../lib/tmdb';

// Toast system for user feedback
let toastCallback: ((message: string, type: 'success' | 'error' | 'info') => void) | null = null;

export function setToastCallback(callback: (message: string, type: 'success' | 'error' | 'info') => void) {
  toastCallback = callback;
}

// Helper function to fetch title and year from TMDB API
async function fetchMediaDataFromTMDB(id: string, mediaType: MediaType): Promise<{ title: string; year?: string }> {
  try {
    const endpoint = mediaType === 'movie' ? `/movie/${id}` : `/tv/${id}`;
    const data = await get(endpoint);
    
    const title = data.title || data.name || 'Untitled';
    
    // Extract year from release_date (movies) or first_air_date (TV shows)
    const dateString = mediaType === 'movie' ? data.release_date : data.first_air_date;
    const year = dateString ? String(dateString).slice(0, 4) : undefined;
    
    return { title, year };
  } catch (error) {
    console.warn(`Failed to fetch media data for ${mediaType}:${id}:`, error);
    return { title: 'Untitled' };
  }
}

export function mountActionBridge() {
  const off1 = on('card:want', async ({ id, mediaType, title }: { id: string|number; mediaType: string; title?: string }) => {
    // Use provided title or fetch from TMDB
    const mediaData = title ? { title } : await fetchMediaDataFromTMDB(String(id), mediaType as MediaType);
    
    // Search "Want to Watch" goes to wishlist, not watching
    Library.upsert({ 
      id, 
      mediaType: mediaType as MediaType, 
      title: mediaData.title,
      year: mediaData.year
    }, 'wishlist');
    
    // Show personality-based feedback
    const settings = settingsManager.getSettings();
    const message = getPersonalityText('itemAdded', settings.personalityLevel);
    toastCallback?.(message, 'success');
  });

  const off2 = on('card:watched', async ({ id, mediaType, title }: { id: string|number; mediaType: string; title?: string }) => {
    // Use provided title or fetch from TMDB
    const mediaData = title ? { title } : await fetchMediaDataFromTMDB(String(id), mediaType as MediaType);
    
    // Mark as watched
    Library.upsert({ 
      id, 
      mediaType: mediaType as MediaType, 
      title: mediaData.title,
      year: mediaData.year
    }, 'watched');
    
    // Show personality-based feedback
    const settings = settingsManager.getSettings();
    const message = getPersonalityText('itemAdded', settings.personalityLevel);
    toastCallback?.(message, 'success');
  });

  const off3 = on('card:notInterested', async ({ id, mediaType, title }: { id: string|number; mediaType: string; title?: string }) => {
    // Use provided title or fetch from TMDB
    const mediaData = title ? { title } : await fetchMediaDataFromTMDB(String(id), mediaType as MediaType);
    
    // Mark as not interested
    Library.upsert({ 
      id, 
      mediaType: mediaType as MediaType, 
      title: mediaData.title,
      year: mediaData.year
    }, 'not');
    
    // Show personality-based feedback
    const settings = settingsManager.getSettings();
    const message = getPersonalityText('itemRemoved', settings.personalityLevel);
    toastCallback?.(message, 'success');
  });

  // Holiday add is implemented in a later step; no‑op for now
  const off4 = on('card:holidayAdd', () => {});

  // Optional: startWatching event from Wishlist tab or details view
  const off5 = on('card:startWatching', async ({ id, mediaType, title }: { id: number|string; mediaType: 'movie'|'tv'; title?: string }) => {
    // Use provided title or fetch from TMDB
    const mediaData = title ? { title } : await fetchMediaDataFromTMDB(String(id), mediaType as MediaType);
    
    let nextAirDate: string | null = null;
    if (mediaType === 'tv') {
      nextAirDate = await fetchNextAirDate(Number(id));
    }
    Library.upsert({ 
      id, 
      mediaType: mediaType as MediaType, 
      title: mediaData.title,
      year: mediaData.year,
      nextAirDate 
    }, 'watching');
    
    // Show personality-based feedback
    const settings = settingsManager.getSettings();
    const message = getPersonalityText('itemAdded', settings.personalityLevel);
    toastCallback?.(message, 'success');
  });

  return () => { off1(); off2(); off3(); off4(); off5(); };
}
