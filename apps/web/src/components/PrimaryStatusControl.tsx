import { useCallback, useEffect, useState } from 'react';
import type { MediaItem } from './cards/card.types';
import { Library } from '@/lib/storage';
import { PRIMARY_STATUS_LABELS, setPrimaryStatus, type PrimaryStatus } from '@/lib/statusTransitions';

export default function PrimaryStatusControl({ item, compact = false }: { item: MediaItem; compact?: boolean }) {
  const readStatus = useCallback(() => {
    const current = Library.getCurrentList(item.id, item.mediaType);
    return current === 'watching' || current === 'wishlist' || current === 'watched' ? current : '';
  }, [item.id, item.mediaType]);
  const [value, setValue] = useState<PrimaryStatus | ''>(readStatus);
  useEffect(() => {
    const unsubscribe = Library.subscribe(() => setValue(readStatus()));
    return () => { unsubscribe(); };
  }, [readStatus]);

  return (
    <label className={`flex items-center gap-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      <span className="sr-only">Watch status</span>
      <select
        aria-label={`Watch status for ${item.title}`}
        value={value}
        onChange={(event) => {
          const next = event.target.value as PrimaryStatus;
          setPrimaryStatus(item, next, { feedback: true });
        }}
        className="w-full rounded-lg border px-2 py-1.5"
        style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)', color: 'var(--text)' }}
      >
        <option value="" disabled>Set watch status…</option>
        {(Object.keys(PRIMARY_STATUS_LABELS) as PrimaryStatus[]).map((status) => (
          <option key={status} value={status}>{PRIMARY_STATUS_LABELS[status]}</option>
        ))}
      </select>
    </label>
  );
}
