import { useEffect } from 'react';
import { Holiday } from '@/lib/holidays';

export default function HolidayModal({ open, onClose, holidays, onPick }:{
  open: boolean;
  onClose: () => void;
  holidays: Holiday[];
  onPick: (id: string) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent){ if (e.key === 'Escape') onClose(); }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-neutral-950 border border-white/10 shadow-xl">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-neutral-100">Add to Holiday</h3>
          </div>
          <div className="p-2">
            <ul className="max-h-72 overflow-auto">
              {holidays.map(h => (
                <li key={h.id}>
                  <button
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900"
                    onClick={() => onPick(h.id)}
                  >
                    <span className="text-base">{h.emoji || '🏷️'}</span>
                    <span className="text-sm text-neutral-100">{h.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 border-t border-white/10 flex justify-end">
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
