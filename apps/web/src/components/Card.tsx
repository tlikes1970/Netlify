import { useState } from 'react';
import HolidayModal from '@/components/HolidayModal';
import { getHolidays, assignToHoliday } from '@/lib/holidays';
import { Library } from '@/lib/storage';

type Base = { id?: string; kind?: 'movie'|'tv'; title?: string; poster?: string };
type Props = Base & {
  mode?: 'catalog' | 'watching'; // catalog: single "Want to Watch"; watching: full 2×2 grid
  showHolidayTag?: boolean;
};

export default function Card({ id, kind, title, poster, mode = 'catalog', showHolidayTag = false }: Props) {
  const safe = { id, kind, title: title || 'Untitled', poster: poster || '' };
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);

  function toWant() {
    if (!safe.id || !safe.kind) return;
    Library.upsert({ id: safe.id, mediaType: safe.kind as 'movie'|'tv', title: safe.title }, 'wishlist');
  }
  function toWatched() {
    if (!safe.id || !safe.kind) return;
    Library.move(safe.id, safe.kind as 'movie'|'tv', 'watched');
  }
  function toNot() {
    if (!safe.id || !safe.kind) return;
    Library.move(safe.id, safe.kind as 'movie'|'tv', 'not');
  }
  function toDelete() {
    if (!safe.id || !safe.kind) return;
    Library.remove(safe.id, safe.kind as 'movie'|'tv');
  }

  function onPickHoliday(hid: string) {
    if (!safe.id || !safe.kind) return;
    assignToHoliday(hid, { id: safe.id, kind: safe.kind, title: safe.title!, poster: safe.poster! });
    setOpen(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article data-card tabIndex={-1} className="w-[200px] bg-neutral-800 border border-neutral-700 rounded-2xl p-3 flex flex-col items-center">
      <div data-poster className="poster-2x3 rounded-xl bg-neutral-900 overflow-hidden w-full mb-2 relative">
        {poster ? <img src={poster} alt={title || ''} className="w-full h-full object-cover" /> : null}

        {showHolidayTag && (
          <button
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-neutral-900/80 border border-white/15 text-[10px] text-neutral-100 hover:bg-neutral-800"
            onClick={() => setOpen(true)}
            title="Add to Holiday"
          >
            {added ? 'Added ✓' : 'Holiday +'}
          </button>
        )}
      </div>
      <div className="text-center mb-1">
        <div className="font-bold text-sm text-white">{safe.title}</div>
        <div className="text-xs text-neutral-400 mb-2">Thriller • S03E02</div>
      </div>
      <div data-actions className={mode === 'catalog' ? 'grid grid-cols-1 gap-2 mt-2 w-full' : 'grid grid-cols-2 gap-2 mt-2 w-full'}>
        {mode === 'catalog' ? (
          <button
            className="btn"
            onClick={toWant}
            title="Want to Watch"
          >
            Want to Watch
          </button>
        ) : (
          <>
            <button className="btn" onClick={toWant} title="Want to Watch">Want to Watch</button>
            <button className="btn" onClick={toWatched} title="Watched">Watched</button>
            <button className="btn" onClick={toNot} title="Not Interested">Not Interested</button>
            <button className="btn" onClick={toDelete} title="Delete">Delete</button>
          </>
        )}
      </div>

      <HolidayModal
        open={open}
        onClose={() => setOpen(false)}
        holidays={getHolidays()}
        onPick={onPickHoliday}
      />
    </article>
  );
}
