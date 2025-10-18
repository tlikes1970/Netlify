import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFocusTrap } from '../../lib/a11y/useFocusTrap';
import { useInertOutside } from '../../lib/a11y/useInertOutside';
import { initSettingsTabs } from './tabs/initTabs';

type TabId = 'account' | 'display' | 'advanced';
const VALID_TABS: TabId[] = ['account', 'display', 'advanced'];


function applyOpen(open: boolean) {
  const html = document.documentElement;
  if (open) {
    html.setAttribute('data-settings-sheet', 'true');
    document.body.style.overflow = 'hidden';
  } else {
    html.removeAttribute('data-settings-sheet');
    document.body.style.overflow = '';
  }
}

export function openSettingsSheet(initial?: TabId) {
  if (initial) {
    const target = `#settings/${initial}`;
    if (location.hash !== target) history.replaceState(null, '', target);
  }
  applyOpen(true);
  window.dispatchEvent(new CustomEvent('settings:open'));
}

export function closeSettingsSheet() {
  applyOpen(false);
  // Clear hash completely when closing
  if (location.hash.startsWith('#settings/')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  window.dispatchEvent(new Event('settings:close'));
}

export default function SettingsSheet() {
  const [open, setOpen] = useState<boolean>(
    document.documentElement.getAttribute('data-settings-sheet') === 'true'
  );
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const firstFocusable = useRef<HTMLButtonElement | null>(null);

  // Prevent background scroll with layout stabilization
  useEffect(() => {
    if (!open) return;
    const doc = document.documentElement;
    const prevOverflow = doc.style.overflow;
    const prevPadRight = doc.style.paddingRight;

    const scw = window.innerWidth - doc.clientWidth;
    doc.style.overflow = 'hidden';
    if (scw > 0) doc.style.paddingRight = `${scw}px`;

    return () => { 
      doc.style.overflow = prevOverflow; 
      doc.style.paddingRight = prevPadRight; 
    };
  }, [open]);

  // Focus trap + Escape handling
  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    if (!el) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeSettingsSheet();
      }
    }
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [open]);

  // Focus trap
  useFocusTrap(dialogRef.current, !!open, '[role="tab"][aria-selected="true"]');

  // Hide rest of app from screen readers
  useInertOutside(dialogRef.current, !!open);

  // iOS soft keyboard: keep inputs visible
  useEffect(() => {
    if (!open || !('visualViewport' in window)) return;
    const vv = window.visualViewport!;
    const body = bodyRef.current;
    if (!body) return;

    const onResize = () => {
      // add bottom padding equal to the occluded area
      const occluded = Math.max(0, (window.innerHeight - vv.height - vv.offsetTop));
      body.style.paddingBottom = occluded ? `${occluded + 16}px` : '';
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
      if (body) body.style.paddingBottom = '';
    };
  }, [open]);

  // Initialize tabs when sheet opens
  useLayoutEffect(() => {
    if (!open) return;
    const cleanup = initSettingsTabs(bodyRef.current ?? undefined);
    return cleanup;
  }, [open]);

  // Sync with custom events
  useEffect(() => {
    function handleOpen() {
      setOpen(true);
      applyOpen(true);
    }
    function handleClose() {
      setOpen(false);
      applyOpen(false);
    }

    window.addEventListener('settings:open', handleOpen);
    window.addEventListener('settings:close', handleClose);

    return () => {
      window.removeEventListener('settings:open', handleOpen);
      window.removeEventListener('settings:close', handleClose);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      tabIndex={-1}
      className="fixed inset-0 flex items-start justify-center p-4 pt-16"
    >
      <div className="sheet-overlay absolute inset-0" />
      <div className="sheet-container relative w-full max-w-3xl rounded-xl overflow-hidden">
        <header className="segmented" role="tablist" aria-label="Settings sections">
          {VALID_TABS.map((t, i) => (
            <button
              key={t}
              ref={i === 0 ? firstFocusable : undefined}
              role="tab"
              id={`tab-${t}`}
              aria-controls={`panel-${t}`}
              className=""
              tabIndex={-1}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button className="close" aria-label="Close" onClick={closeSettingsSheet}>
            ✕
          </button>
        </header>

        {/* Scrollable body */}
        <div ref={bodyRef} className="sheet-body max-h-[80svh] overflow-auto">
          {VALID_TABS.map((t) => (
            <section
              key={t}
              id={`panel-${t}`}
              role="tabpanel"
              aria-labelledby={`tab-${t}`}
              data-sheet-body
              hidden
              style={{
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch',
                maxHeight:
                  'calc(100dvh - 56px - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
              }}
            >
              {/* TODO: render the tab content for {t} */}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

// Expose helpers for QA
declare global {
  interface Window {
    openSettingsSheet?: (tab?: TabId) => void;
    closeSettingsSheet?: () => void;
  }
}
if (typeof window !== 'undefined') {
  window.openSettingsSheet = openSettingsSheet;
  window.closeSettingsSheet = closeSettingsSheet;
}