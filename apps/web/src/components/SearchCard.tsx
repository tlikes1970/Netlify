import { useState } from 'react';
import { Library } from '@/lib/storage';
import HolidayModal from '@/components/HolidayModal';
import { getHolidays, assignToHoliday } from '@/lib/holidays';

type Props = { id: string; kind: 'movie'|'tv'; title: string; poster: string };

export default function SearchCard({ id, kind, title, poster }: Props) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);

  function want() { Library.upsert({ id, mediaType: kind, title }, 'wishlist'); }
  function watching() { Library.upsert({ id, mediaType: kind, title }, 'watching'); }
  function notInt() { Library.upsert({ id, mediaType: kind, title }, 'not'); }

  function onPickHoliday(hid: string) {
    assignToHoliday(hid, { id, kind, title, poster });
    setOpen(false); setAdded(true); setTimeout(()=>setAdded(false), 1200);
  }

  return (
    <article style={{ width: 'var(--poster-w, 160px)' }}>
      <div className="relative poster-2x3 rounded-2xl overflow-hidden bg-neutral-800/40">
        <img src={poster} alt={title} className="w-full h-full object-cover" />
        <button
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-neutral-900/80 border border-white/15 text-[10px] text-neutral-100 hover:bg-neutral-800"
          onClick={() => setOpen(true)}
          title="Add to Holiday"
        >
          {added ? 'Added ✓' : 'Holiday +'}
        </button>
      </div>
      <div className="mt-1 space-y-1">
        <div className="text-[11px] text-neutral-200 line-clamp-2">{title}</div>
        <div className="grid grid-cols-1 gap-1">
          <button className="btn" onClick={want} title="Want to Watch">Want to Watch</button>
          <button className="btn" onClick={watching} title="Mark Watching">Mark Watching</button>
          <button className="btn" onClick={notInt} title="Not Interested">Not Interested</button>
        </div>
      </div>

      <HolidayModal open={open} onClose={()=>setOpen(false)} holidays={getHolidays()} onPick={onPickHoliday} />
    </article>
  );
}
