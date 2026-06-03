import { useState, useEffect } from 'react';
import { ForYouRow } from '../components/GenreRowConfig';
import { useAuth } from './useAuth';
import { loadForYouRows } from '../lib/forYouRowsStorage';

export function useForYouRows() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [forYouRows, setForYouRows] = useState<ForYouRow[]>(() =>
    loadForYouRows(uid)
  );

  // Re-load when account changes (per-user keys + legacy migration)
  useEffect(() => {
    setForYouRows(loadForYouRows(uid));
  }, [uid]);

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      setForYouRows(event.detail);
    };

    window.addEventListener('forYouRows:updated', handleUpdate as EventListener);
    return () =>
      window.removeEventListener('forYouRows:updated', handleUpdate as EventListener);
  }, []);

  return forYouRows;
}
