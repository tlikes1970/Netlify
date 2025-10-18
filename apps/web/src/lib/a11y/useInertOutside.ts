import { useEffect } from 'react';

export function useInertOutside(dialog: HTMLElement | null, active: boolean) {
  useEffect(() => {
    if (!dialog || !active) return;
    const roots = [document.body];
    const changed: Array<HTMLElement> = [];

    for (const root of roots) {
      // inert siblings of the dialog
      [...root.children].forEach(el => {
        if (el === dialog.parentElement) return;
        const htmlEl = el as HTMLElement;
        if (!htmlEl.hasAttribute('inert')) {
          htmlEl.setAttribute('inert', '');
          htmlEl.setAttribute('aria-hidden', 'true');
          changed.push(htmlEl);
        }
      });
    }

    return () => {
      changed.forEach(el => {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      });
    };
  }, [dialog, active]);
}
