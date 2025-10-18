import { useEffect } from 'react';

export function useFocusTrap(container: HTMLElement | null, active: boolean, fallbackSelector?: string) {
  useEffect(() => {
    if (!container || !active) return;

    // Save previously focused element to restore on close
    const prev = document.activeElement as HTMLElement | null;

    // Collect tabbables (very light version)
    const TABBABLE = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    const getTabs = () => Array.from(container.querySelectorAll<HTMLElement>(TABBABLE))
      .filter(el => el.offsetParent !== null || el === document.activeElement);

    // Initial focus
    const initial =
      (fallbackSelector && container.querySelector<HTMLElement>(fallbackSelector)) ||
      getTabs()[0] || container;
    initial?.focus();

    function onKeydown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const tabs = getTabs();
      if (!tabs.length) { e.preventDefault(); return; }
      const first = tabs[0];
      const last = tabs[tabs.length - 1];
      const target = e.target as HTMLElement;
      if (e.shiftKey) {
        if (target === first || !container?.contains(target)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (target === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener('keydown', onKeydown);
    return () => {
      container.removeEventListener('keydown', onKeydown);
      // restore focus
      prev?.focus?.();
    };
  }, [container, active, fallbackSelector]);
}
