import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../lib/a11y/useFocusTrap';
import { useAndroidBackDismiss } from '../hooks/useAndroidBackDismiss';
import { t } from '../lib/language';

/** Small contextual panel; shared focus/Back contracts, never an onboarding overlay. */
export function MobileControlDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const id = useId();
  useFocusTrap(panel, true, 'button');
  useAndroidBackDismiss(true, onClose);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); onClose(); } };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', close); };
  }, [onClose]);
  return createPortal(<div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-3 bg-black/50" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={setPanel} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className="w-full max-w-xl max-h-[80dvh] overflow-y-auto rounded-xl p-4 min-w-0" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="flex items-center justify-between gap-3 mb-3"><h2 id={id} className="font-semibold min-w-0 break-words">{title}</h2><button type="button" className="min-h-[44px] min-w-[44px] shrink-0" onClick={onClose} aria-label={t('contentCloseModal')}>×</button></div>
      {children}
    </div>
  </div>, document.body);
}
