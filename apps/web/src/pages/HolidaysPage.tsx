import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Card';
import { getHolidays, getAssignments, unassignFromHoliday, Holiday } from '@/lib/holidays';

type Item = { id: string; kind: 'movie'|'tv'; title: string; poster: string };

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>(getHolidays());
  const [map, setMap] = useState<Record<string, Item[]>>(getAssignments());

  useEffect(() => {
    function onChange() {
      setHolidays(getHolidays());
      setMap(getAssignments());
    }
    window.addEventListener('holidays:change', onChange as EventListener);
    return () => window.removeEventListener('holidays:change', onChange as EventListener);
  }, []);

  const sections = useMemo(() => holidays.map(h => ({
    holiday: h,
    items: map[h.id] || []
  })), [holidays, map]);

  function remove(hid: string, id: string) {
    unassignFromHoliday(hid, id);
    setMap(getAssignments());
  }

  return (
    <section className="px-4 py-4">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-lg font-semibold text-neutral-100 mb-4">Holidays</h1>

        <div className="space-y-8">
          {sections.map(({ holiday, items }) => (
            <div key={holiday.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">{holiday.emoji || '🏷️'}</span>
                <h2 className="text-base font-semibold text-neutral-200">{holiday.name}</h2>
                <span className="text-xs text-neutral-500">({items.length})</span>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl bg-neutral-950/50 border border-white/5 p-4 text-sm text-neutral-400">
                  No titles assigned yet.
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,154px)] gap-3">
                  {items.map(it => (
                    <div key={it.id} className="flex flex-col">
                      <Card id={it.id} kind={it.kind} title={it.title} poster={it.poster} mode="catalog" showHolidayTag={false} />
                      <button className="btn mt-2" onClick={() => remove(holiday.id, it.id)}>Remove from holiday</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
