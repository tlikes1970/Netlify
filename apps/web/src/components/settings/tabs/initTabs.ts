// apps/web/src/components/settings/tabs/initTabs.ts
type Cleanup = () => void;

function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getHashTarget(): string | null {
  const m = location.hash.match(/#settings\/([\w-]+)/);
  return m ? m[1] : null;
}

/**
 * Initialize Settings tabs inside a container element (the sheet content).
 * Ensures exactly one selected tab and matching visible panel.
 * Returns a cleanup function.
 */
export function initSettingsTabs(container?: HTMLElement): Cleanup {
  const root = container ?? (document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement | null) ?? document.body;

  const tabs = Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

  if (!tabs.length) return () => {};

  const indexByKey = new Map<string, number>();
  tabs.forEach((t, i) => {
    const key =
      t.id ||
      t.dataset.tabId ||
      t.getAttribute('data-id') ||
      slugify(t.textContent || '');
    if (key) indexByKey.set(key, i);
  });

  function setActive(idx: number) {
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.setAttribute('aria-selected', on ? 'true' : 'false'); // strings, not booleans
      t.tabIndex = on ? 0 : -1;

      const ctrl = t.getAttribute('aria-controls');
      if (ctrl) {
        const p = document.getElementById(ctrl);
        if (p) {
          p.hidden = !on;
          p.setAttribute('aria-hidden', on ? 'false' : 'true');
        }
      }
    });

    // Fallback: if some panels not wired with aria-controls, sync by order
    if (panels.length && !tabs[0]?.getAttribute('aria-controls')) {
      panels.forEach((p, i) => {
        const on = i === idx;
        p.hidden = !on;
        p.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
    }
  }

  function pickInitialIndex(): number {
    // 1) from hash
    const fromHash = getHashTarget();
    if (fromHash && indexByKey.has(fromHash)) {
      return indexByKey.get(fromHash)!;
    }
    // 2) existing true
    const fromAttr = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    if (fromAttr >= 0) return fromAttr;
    // 3) default to first
    return 0;
  }

  // Initial selection
  let active = pickInitialIndex();
  setActive(active);

  // Click handlers update selection + hash without adding history entries
  const clickHandlers: Array<[(e: Event) => void, HTMLElement]> = [];
  tabs.forEach((t, i) => {
    const key =
      t.id || t.dataset.tabId || t.getAttribute('data-id') || slugify(t.textContent || `tab-${i}`);
    const onClick = (e: Event) => {
      e.preventDefault();
      if (active !== i) {
        active = i;
        setActive(active);
        if (key) {
          const next = `#settings/${key}`;
          if (location.hash !== next) history.replaceState(null, '', next);
        }
      }
    };
    t.addEventListener('click', onClick);
    clickHandlers.push([onClick, t]);
  });

  // Hash navigation support (e.g., user changes hash or external link)
  const onHash = () => {
    const h = getHashTarget();
    if (h && indexByKey.has(h)) {
      const i = indexByKey.get(h)!;
      if (i !== active) {
        active = i;
        setActive(active);
      }
    }
  };
  window.addEventListener('hashchange', onHash);

  // Cleanup
  return () => {
    clickHandlers.forEach(([fn, el]) => el.removeEventListener('click', fn));
    window.removeEventListener('hashchange', onHash);
  };
}

