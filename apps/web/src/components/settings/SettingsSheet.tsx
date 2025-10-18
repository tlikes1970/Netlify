import { useEffect, useRef, useState } from 'react';

type TabId = 'account' | 'display' | 'advanced';
const VALID_TABS: TabId[] = ['account', 'display', 'advanced'];

function isTab(v: unknown): v is TabId {
  return typeof v === 'string' && (VALID_TABS as string[]).includes(v);
}

function tabFromHash(): TabId | null {
  const m = location.hash.match(/^#settings\/([a-z]+)/i);
  const t = m?.[1]?.toLowerCase();
  return isTab(t) ? (t as TabId) : null;
}

function lastTab(): TabId | null {
  const t = localStorage.getItem('settings:lastTab') || '';
  return isTab(t) ? (t as TabId) : null;
}

function setHashForTab(t: TabId) {
  const target = `#settings/${t}`;
  if (location.hash !== target) history.replaceState(null, '', target);
}

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
  const t = initial ?? tabFromHash() ?? lastTab() ?? 'display';
  setHashForTab(t);
  applyOpen(true);
  window.dispatchEvent(new CustomEvent('settings:open', { detail: { tab: t } }));
}

export function closeSettingsSheet() {
  applyOpen(false);
  if (location.hash.startsWith('#settings/')) history.replaceState(null, '', '#');
  window.dispatchEvent(new Event('settings:close'));
}

export default function SettingsSheet() {
  const [open, setOpen] = useState<boolean>(
    document.documentElement.getAttribute('data-settings-sheet') === 'true'
  );
  const [tab, setTab] = useState<TabId>(tabFromHash() ?? lastTab() ?? 'display');
  const firstFocusable = useRef<HTMLButtonElement | null>(null);

  // Sync with hash and custom events
  useEffect(() => {
    function handleHash() {
      const t = tabFromHash();
      if (t) {
        setTab(t);
        setOpen(true);
        applyOpen(true);
      }
    }
    function handleOpen(e: Event) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = (e as any)?.detail?.tab;
      if (isTab(t)) setTab(t);
      setOpen(true);
      applyOpen(true);
    }
    function handleClose() {
      setOpen(false);
      applyOpen(false);
    }

    window.addEventListener('hashchange', handleHash);
    window.addEventListener('settings:open', handleOpen as EventListener);
    window.addEventListener('settings:close', handleClose);
    queueMicrotask(handleHash); // catch early hash

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('settings:open', handleOpen as EventListener);
      window.removeEventListener('settings:close', handleClose);
    };
  }, []);

  // Persist last tab, focus first control on open
  useEffect(() => {
    localStorage.setItem('settings:lastTab', tab);
    if (open && firstFocusable.current) firstFocusable.current.focus();
  }, [tab, open]);

  // ESC closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        e.stopPropagation();
        closeSettingsSheet();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const selectTab = (t: TabId) => {
    setTab(t);
    setHashForTab(t);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="settings-sheet"
    >
      <div className="panel">
        <header className="segmented" role="tablist" aria-label="Settings sections">
          {VALID_TABS.map((t, i) => (
            <button
              key={t}
              ref={i === 0 ? firstFocusable : undefined}
              role="tab"
              id={`tab-${t}`}
              aria-controls={`panel-${t}`}
              aria-selected={tab === t}
              className={tab === t ? 'is-active' : ''}
              onClick={() => selectTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button className="close" aria-label="Close" onClick={closeSettingsSheet}>
            ✕
          </button>
        </header>

        {/* Scrollable body */}
        <section
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          data-sheet-body
          style={{
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            maxHeight:
              'calc(100dvh - 56px - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
          }}
        >
          {/* TODO: render the tab content for {tab} */}
        </section>
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