import { useCallback, useEffect, useState } from 'react';
import { useLibrary, type LibraryEntry } from '@/lib/storage';
import { removeShowWithResult } from '@/lib/confirmRemoveShow';
import { setPrimaryStatus, type PrimaryStatus } from '@/lib/statusTransitions';
import { useTranslations } from '@/lib/language';
import { guardMutation } from '@/lib/readOnlyGuard';
import { useFocusTrap } from '@/lib/a11y/useFocusTrap';
import { useAndroidBackDismiss } from '@/hooks/useAndroidBackDismiss';
import ModalPortal from '../ModalPortal';

interface NotInterestedModalProps { isOpen: boolean; onClose: () => void }

export default function NotInterestedModal({ isOpen, onClose }: NotInterestedModalProps) {
  const items = useLibrary('not', { includeItemUpdates: true });
  const t = useTranslations();
  const [pending, setPending] = useState<{ key: string; phase: 'confirming' | 'removing' } | null>(null);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const close = useCallback(() => { if (!pending) onClose(); }, [pending, onClose]);
  useFocusTrap(panel, isOpen && !pending);
  useAndroidBackDismiss(isOpen && pending?.phase !== 'confirming', close);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !pending) close(); };
    if (isOpen) window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [isOpen, pending, close]);
  useEffect(() => { if (isOpen) setError(''); }, [isOpen]);
  const restore = (item: LibraryEntry, target: PrimaryStatus) => {
    setError('');
    if (!guardMutation()) return;
    try { setPrimaryStatus(item, target, { feedback: true }); }
    catch { setError(t.notInterestedActionFailed); }
  };
  const remove = async (item: LibraryEntry) => {
    if (pending) return;
    const key = `${item.mediaType}:${item.id}`;
    setError(''); setPending({ key, phase: 'confirming' });
    try {
      await removeShowWithResult(item.id, item.mediaType, {
        title: t.notInterestedRemoveTitle, body: t.notInterestedRemoveBody,
        confirmLabel: t.removeFromLibrary, cancelLabel: t.notInterestedCancel,
      }, () => setPending({ key, phase: 'removing' }));
    } catch { setError(t.notInterestedActionFailed); }
    finally { setPending(null); }
  };
  if (!isOpen) return null;
  const button = 'min-h-[44px] px-3 py-2 rounded-lg border text-sm whitespace-normal';
  return <ModalPortal><div className="fixed inset-0 z-modal flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,.8)', paddingTop: 'calc(12px + var(--safe-top, env(safe-area-inset-top, 0px)))', paddingBottom: 'calc(12px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))' }}>
    <div ref={setPanel} role="dialog" aria-modal="true" aria-labelledby="not-interested-title" aria-describedby="not-interested-description" tabIndex={-1} className="rounded-xl w-full max-w-4xl max-h-full overflow-y-auto p-4 sm:p-6" style={{ background: 'var(--card)', color: 'var(--text)' }}>
      <div className="flex items-start justify-between gap-2">
        <h2 id="not-interested-title" className="text-xl font-semibold break-words">{t.notInterestedListTitle} ({items.length})</h2>
        <button className={`${button} min-w-[44px] shrink-0`} aria-label={t.notInterestedClose} onClick={close} disabled={!!pending}>×</button>
      </div>
      <p id="not-interested-description" className="text-sm my-4">{t.notInterestedDescription}</p>
      {error && <p role="alert" className="my-3">{error}</p>}
      {!items.length && <p className="py-8">{t.notInterestedEmpty}</p>}
      <div className="space-y-4">{items.map(item => {
        const key = `${item.mediaType}:${item.id}`;
        const active = pending?.key === key ? pending.phase : null;
        return <article key={key} data-testid={`not-interested-${key}`} className="flex gap-3 p-3 rounded-lg border" aria-busy={active === 'removing'}>
          <div className="w-16 shrink-0">{item.posterUrl ? <img src={item.posterUrl} alt="" className="w-full rounded-lg" /> : <span aria-hidden="true">🎬</span>}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium break-words">{item.title}</h3>
            {item.year && <p className="text-sm">{item.year}</p>}
            <p className="text-sm mt-2 mb-1">{t.restoreToStatus}</p>
            <div className="flex flex-wrap gap-2">{([
              ['watching', t.currentlyWatchingAction], ['wishlist', t.wantToWatchAction], ['watched', t.watchedAction],
            ] as const).map(([target, label]) => <button key={target} className={button} disabled={!!pending} onClick={() => restore(item, target)}>{label}</button>)}</div>
            <button className={`${button} mt-3`} disabled={!!pending} onClick={() => void remove(item)} style={{ color: 'var(--error, #ef4444)' }}>{t.removeFromLibrary}</button>
            {active && <p role="status" className="text-sm mt-2">{active === 'confirming' ? t.confirmingRemoval : t.removingFromLibrary}</p>}
          </div>
        </article>;
      })}</div>
      <div className="flex justify-end mt-4"><button className={button} onClick={close} disabled={!!pending}>{t.notInterestedDone}</button></div>
    </div>
  </div></ModalPortal>;
}
