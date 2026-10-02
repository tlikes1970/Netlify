import { useEffect, useId, useState } from 'react';
import { Library, useLibrary } from '../../lib/storage';
import { useCustomLists } from '../../lib/customLists';
import { useUsername } from '../../hooks/useUsername';
import { useTranslations } from '../../lib/language';
import { formatShareSections, shareItemKey, shareTextWithFallback } from '../../lib/shareLinks';
import { useFocusTrap } from '../../lib/a11y/useFocusTrap';
import { useAndroidBackDismiss } from '../../hooks/useAndroidBackDismiss';
import { useInertOutside } from '../../lib/a11y/useInertOutside';
import ModalPortal from '../ModalPortal';
import type { ListName } from '../../state/library.types';

export default function SharingModal({ onClose }: { onClose: () => void }) {
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  // Restore after the parent Settings dialog reactivates its focus/inert state.
  useEffect(() => () => { requestAnimationFrame(() => { if (opener?.isConnected) opener.focus(); }); }, [opener]);
  const t = useTranslations(); const id = useId(); const { username } = useUsername();
  const watching = useLibrary('watching', { includeItemUpdates: true });
  const want = useLibrary('wishlist', { includeItemUpdates: true });
  const watched = useLibrary('watched', { includeItemUpdates: true });
  const { customLists } = useCustomLists();
  const sections = [
    { key: 'watching', name: t.currentlyWatchingAction, items: watching },
    { key: 'wishlist', name: t.wantToWatchAction, items: want },
    { key: 'watched', name: t.watchedAction, items: watched },
    ...customLists.map(list => ({ key: `custom:${list.id}`, name: list.name, items: Library.getByList(`custom:${list.id}` as ListName) })),
  ];
  const [lists, setLists] = useState(new Set(['watching', 'wishlist', 'watched']));
  // null means initial/all selection; an explicit empty set always means NONE.
  const [selection, setSelection] = useState<Set<string> | null>(null);
  const [ratings, setRatings] = useState(true); const [attribution, setAttribution] = useState(false);
  const [movies, setMovies] = useState(true); const [tv, setTV] = useState(true);
  const [result, setResult] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<HTMLDivElement | null>(null); const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  useFocusTrap(panel, true, 'input'); useInertOutside(panel, true); useAndroidBackDismiss(true, onClose);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopImmediatePropagation(); onClose(); } }; window.addEventListener('keydown', close, true); return () => window.removeEventListener('keydown', close, true); }, [onClose]);
  useEffect(() => {
    const visible = window.visualViewport; if (!visible || !viewport) return;
    const resize = () => { viewport.style.top = `${visible.offsetTop}px`; viewport.style.height = `${visible.height}px`; viewport.style.bottom = 'auto'; };
    resize(); visible.addEventListener('resize', resize); visible.addEventListener('scroll', resize);
    return () => { visible.removeEventListener('resize', resize); visible.removeEventListener('scroll', resize); };
  }, [viewport]);
  const activeSections = sections.filter(section => lists.has(section.key)).map(section => ({ ...section, items: section.items.filter(item => item.mediaType === 'movie' ? movies : tv) }));
  const available = [...new Map(activeSections.flatMap(section => section.items).map(item => [shareItemKey(item), item])).values()];
  const selected = selection ?? new Set(available.map(shareItemKey));
  const count = available.filter(item => selected.has(shareItemKey(item))).length;
  const toggle = (set: Set<string>, key: string) => { const next = new Set(set); if (next.has(key)) next.delete(key); else next.add(key); return next; };
  const generate = () => {
    if (!count) { setMessage(t.sharingNothingSelected); return ''; }
    const text = formatShareSections(activeSections, selected, ratings, attribution && username ? username : undefined);
    setResult(text); setMessage(''); return text;
  };
  const share = async () => {
    const text = generate(); if (!text) return; setBusy(true);
    try { await shareTextWithFallback({ title: t.sharingTitle, text, onSuccess: outcome => setMessage(outcome === 'shared' ? t.sharingShared : t.sharingCopied), onError: () => setMessage(t.sharingFailed) }); }
    finally { setBusy(false); }
  };
  const button = 'min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg border text-sm';
  const checkbox = (label: string, checked: boolean, change: () => void, disabled = false) => <label className="flex items-center gap-3 min-h-[44px] min-w-0 cursor-pointer"><input type="checkbox" checked={checked} onChange={() => { change(); setResult(''); }} disabled={disabled} className="shrink-0 w-5 h-5" /><span className="min-w-0 break-words">{label}</span></label>;
  return <ModalPortal><div ref={setViewport} data-testid="sharing-backdrop" className="fixed inset-0 z-modal flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,.7)', paddingTop: 'calc(12px + var(--safe-top, env(safe-area-inset-top, 0px)))', paddingBottom: 'calc(12px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))' }} onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div ref={setPanel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} className="flex flex-col w-full max-w-2xl max-h-full overflow-hidden rounded-xl border shadow-xl" style={{ background: 'var(--card)', color: 'var(--text)' }}>
      <header className="shrink-0 flex items-start gap-2 p-4 border-b"><h2 id={`${id}-title`} className="flex-1 min-w-0 break-words font-semibold">{t.sharingTitle}</h2><button className={button} aria-label={t.sharingClose} onClick={onClose}>×</button></header>
      <div className="min-h-0 overflow-y-auto p-4 space-y-4">
        <p id={`${id}-description`} className="text-sm">{t.sharingDescription}</p>
        <fieldset><legend className="font-semibold">{t.sharingLists}</legend>{sections.map(section => <div key={section.key}>{checkbox(section.name, lists.has(section.key), () => setLists(toggle(lists, section.key)))}</div>)}</fieldset>
        <fieldset><legend className="font-semibold">{t.sharingOptions}</legend>{checkbox(t.sharingMovies, movies, () => setMovies(!movies))}{checkbox(t.sharingTV, tv, () => setTV(!tv))}{checkbox(t.sharingRatings, ratings, () => setRatings(!ratings))}{checkbox(t.sharingAttribution, attribution, () => setAttribution(!attribution), !username)}</fieldset>
        <fieldset><legend className="font-semibold">{t.sharingItems}</legend><div className="flex flex-wrap gap-2 my-2"><button className={button} onClick={() => { setSelection(new Set(available.map(shareItemKey))); setResult(''); }}>{t.sharingSelectAll}</button><button className={button} onClick={() => { setSelection(new Set()); setResult(''); }}>{t.sharingSelectNone}</button></div>
          {available.map(item => <div key={shareItemKey(item)}>{checkbox(`${item.mediaType === 'movie' ? '🎬' : '📺'} ${item.title}`, selected.has(shareItemKey(item)), () => setSelection(toggle(selected, shareItemKey(item))))}</div>)}
        </fieldset>
        {!count && <p role="status">{t.sharingNothingSelected}</p>}
        {result && <><label htmlFor={`${id}-snapshot`} className="block">{t.sharingSnapshot}</label><textarea id={`${id}-snapshot`} readOnly value={result} className="w-full h-40 rounded border p-2" style={{ background: 'var(--bg)' }} /></>}
        {message && <p role="status" className="break-words">{message}</p>}
      </div>
      <footer className="shrink-0 flex flex-wrap gap-2 justify-end p-4 border-t"><button className={button} onClick={generate} disabled={!count || busy}>{t.sharingGenerate}</button><button className={button} onClick={() => void share()} disabled={!count || busy}>{t.sharingShareOrCopy}</button></footer>
    </div>
  </div></ModalPortal>;
}
