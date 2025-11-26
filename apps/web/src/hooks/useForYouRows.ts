import { useState, useEffect } from 'react';
import { ForYouRow } from '../components/GenreRowConfig';

export function useForYouRows() {
  const [forYouRows, setForYouRows] = useState<ForYouRow[]>(() => {
    // Load from localStorage or use defaults
    try {
      const saved = localStorage.getItem('flicklet:forYouRows');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load For You rows:', e);
    }
    
    // Default configuration
    return [
      { id: '1', mainGenre: 'anime', subGenre: 'shonen', title: 'Anime/Shōnen' },
      { id: '2', mainGenre: 'horror', subGenre: 'psychological', title: 'Horror/Psychological' },
      { id: '3', mainGenre: 'comedy', subGenre: 'romantic', title: 'Comedy/Romantic' }
    ];
  });

  useEffect(() => {
    // Listen for updates from settings
    const handleUpdate = (event: CustomEvent) => {
      setForYouRows(event.detail);
    };

    window.addEventListener('forYouRows:updated', handleUpdate as EventListener);
    return () => window.removeEventListener('forYouRows:updated', handleUpdate as EventListener);
  }, []);

  return forYouRows;
}






