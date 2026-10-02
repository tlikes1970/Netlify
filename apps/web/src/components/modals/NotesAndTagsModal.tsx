import { useState, useEffect, useId } from 'react';
import { MediaItem } from '../cards/card.types';
import { useTranslations } from '../../lib/language';
import { useFocusTrap } from '../../lib/a11y/useFocusTrap';
import { useAndroidBackDismiss } from '../../hooks/useAndroidBackDismiss';
import ModalPortal from '../ModalPortal';

interface NotesAndTagsModalProps {
  item: MediaItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MediaItem, notes: string, tags: string[]) => boolean | void;
}

export default function NotesAndTagsModal({ item, isOpen, onClose, onSave }: NotesAndTagsModalProps) {
  const t = useTranslations();
  const id = useId();
  const [notes, setNotes] = useState(item.userNotes || '');
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  useFocusTrap(panel, isOpen, 'textarea');
  useAndroidBackDismiss(isOpen, onClose);
  useEffect(() => {
    const visible = window.visualViewport;
    if (!isOpen || !viewport || !visible) return;
    const resize = () => {
      viewport.style.top = `${visible.offsetTop}px`;
      viewport.style.height = `${visible.height}px`;
      viewport.style.bottom = 'auto';
    };
    resize();
    visible.addEventListener('resize', resize);
    visible.addEventListener('scroll', resize);
    return () => { visible.removeEventListener('resize', resize); visible.removeEventListener('scroll', resize); };
  }, [isOpen, viewport]);
  useEffect(() => {
    setNotes(item.userNotes || ''); setTags(item.tags || []); setNewTag(''); setError('');
  }, [item]);
  useEffect(() => {
    if (!isOpen) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopImmediatePropagation(); onClose(); } };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [isOpen, onClose]);

  const tagError = (value: string) => {
    if (!value) return t.tagBlank;
    if (value.length > 50) return t.tagLengthLimit;
    if (tags.some(tag => tag.trim().toLowerCase() === value.toLowerCase())) return t.tagDuplicate;
    if (tags.length >= 25) return t.tagCountLimit;
    return '';
  };
  const addTag = () => {
    const value = newTag.trim(); const message = tagError(value);
    setError(message);
    if (!message) { setTags([...tags, value]); setNewTag(''); }
  };
  const save = () => {
    // Keep valid legacy data intact. A longer existing note can stay or shrink.
    if (notes.length > Math.max(5000, (item.userNotes || '').length)) { setError(t.notesLimit); return; }
    const value = newTag.trim();
    if (value) { const message = tagError(value); if (message) { setError(message); return; } }
    try {
      if (onSave(item, notes, value ? [...tags, value] : tags) === false) { setError(t.notesSaveFailed); return; }
      onClose();
    } catch { setError(t.notesSaveFailed); }
  };
  if (!isOpen) return null;
  const button = 'min-h-[44px] px-4 py-2 rounded-lg border text-sm';
  return <ModalPortal><div ref={setViewport} className="fixed inset-0 z-modal flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,.7)', paddingTop: 'calc(12px + var(--safe-top, env(safe-area-inset-top, 0px)))', paddingBottom: 'calc(12px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))' }} onClick={event => { if (event.target === event.currentTarget) onClose(); }} data-testid="notes-backdrop">
    <div ref={setPanel} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1} className="flex flex-col w-full max-w-lg max-h-full rounded-xl border shadow-xl overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--text)' }}>
      <header className="flex shrink-0 items-start gap-2 p-4 border-b">
        <h2 id={`${id}-title`} className="flex-1 min-w-0 break-words font-semibold">{t.notesAndTags}<span className="block text-sm font-normal break-words">{item.title}</span></h2>
        <button className={`${button} min-w-[44px] shrink-0`} aria-label={t.notesClose} onClick={onClose}>×</button>
      </header>
      <div className="min-h-0 overflow-y-auto p-4 space-y-4">
        <div>
          <label htmlFor={`${id}-notes`} className="block mb-2">{t.notesLabel}</label>
          <textarea id={`${id}-notes`} value={notes} maxLength={Math.max(5000, (item.userNotes || '').length)} aria-describedby={`${id}-limit`} onChange={event => { if (event.target.value.length <= Math.max(5000, notes.length)) setNotes(event.target.value); setError(''); }} placeholder={t.notesPlaceholder} className="w-full h-32 rounded-lg border p-3" style={{ background: 'var(--bg)', color: 'var(--text)' }} />
          <p id={`${id}-limit`} className="text-xs break-words">{notes.length} / 5000. {t.notesLimit}</p>
        </div>
        <div>
          <label htmlFor={`${id}-tag`} className="block mb-2">{t.tagsLabel}</label>
          <div className="flex gap-2 mb-3">
            <input id={`${id}-tag`} value={newTag} onChange={event => { setNewTag(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }} placeholder={t.tagPlaceholder} className="min-w-0 flex-1 rounded-lg border p-2" style={{ background: 'var(--bg)', color: 'var(--text)' }} />
            <button className={button} onClick={addTag}>{t.notesAdd}</button>
          </div>
          <div className="flex flex-wrap gap-2">{tags.map((tag, index) => <span key={index} className="inline-flex items-center min-w-0 max-w-full rounded-lg border pl-3">
            <span className="min-w-0 break-all text-sm">{tag}</span>
            <button className="min-w-[44px] min-h-[44px] shrink-0" aria-label={`${t.notesRemoveTag}: ${tag}`} onClick={() => { setTags(tags.filter((_, position) => position !== index)); setError(''); }}>×</button>
          </span>)}</div>
          {!tags.length && <p className="text-sm">{t.notesEmptyTags}</p>}
        </div>
        {error && <p role="alert" className="text-sm break-words">{error}</p>}
      </div>
      <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t p-4">
        <button className={button} onClick={onClose}>{t.notesCancel}</button>
        <button className={button} onClick={save} style={{ background: 'var(--accent)', color: 'white' }}>{t.notesSave}</button>
      </footer>
    </div>
  </div></ModalPortal>;
}
