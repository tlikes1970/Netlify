import { useEffect, useRef, useState, type RefObject } from 'react';
import '../styles/longPressReorder.css';

type Options = {
  containerRef: RefObject<HTMLElement>;
  enabled: boolean;
  identities: string[];
  canStart: () => boolean;
  onReorder: (from: number, to: number) => void;
};
type Gesture = {
  row: HTMLElement; from: number; to: number; id: string;
  x: number; y: number; lastY: number; scrollY: number; center: number;
  active: boolean; previousOverflow: string;
};

/** Touch owns the gesture only after a stationary hold; quick swipes/scrolls remain native. */
export function useLongPressReorder(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const [active, setActive] = useState<{ id: string; index: number; target: number } | null>(null);
  const suppressUntil = useRef(0);
  const signature = options.identities.join('|');
  useEffect(() => {
    const root = options.containerRef.current;
    if (!root || !options.enabled) return;
    let gesture: Gesture | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let scrollFrame: number | undefined;
    const clearTimer = () => { clearTimeout(timer); timer = undefined; };
    const finish = (commit: boolean) => {
      clearTimer();
      if (scrollFrame !== undefined) cancelAnimationFrame(scrollFrame);
      scrollFrame = undefined;
      const ended = gesture;
      gesture = null;
      if (!ended?.active) return;
      suppressUntil.current = Date.now() + 400; // Survives the reordered list's effect refresh.
      ended.row.removeAttribute('data-drag-active');
      ended.row.classList.remove('is-touch-reordering');
      ended.row.style.removeProperty('--reorder-y');
      document.body.style.overflow = ended.previousOverflow;
      setActive(null);
      if (commit && ended.to !== ended.from) latest.current.onReorder(ended.from, ended.to);
    };
    const update = () => {
      if (!gesture?.active) return;
      const dy = gesture.lastY - gesture.y;
      const scroll = window.scrollY - gesture.scrollY;
      gesture.row.style.setProperty('--reorder-y', `${dy + scroll}px`);
      const center = gesture.center + dy;
      let nearest = Infinity;
      let target = gesture.from;
      root.querySelectorAll<HTMLElement>('[data-reorder-id]').forEach(row => {
        const index = Number(row.dataset.itemIndex);
        const bounds = row.getBoundingClientRect();
        // The lifted row's original slot remains a legitimate drop target.
        const rowCenter = row === gesture!.row ? gesture!.center - scroll : bounds.top + bounds.height / 2;
        const distance = Math.abs(center - rowCenter);
        if (distance < nearest) { nearest = distance; target = index; }
      });
      if (gesture.to !== target) {
        gesture.to = target;
        setActive({ id: gesture.id, index: gesture.from, target });
      }
    };
    const autoScroll = () => {
      scrollFrame = undefined;
      if (!gesture?.active) return;
      const direction = gesture.lastY < 48 ? -1 : gesture.lastY > window.innerHeight - 48 ? 1 : 0;
      if (!direction) return;
      const before = window.scrollY;
      window.scrollBy(0, direction * 12);
      update();
      if (window.scrollY !== before) scrollFrame = requestAnimationFrame(autoScroll);
    };
    const start = (event: TouchEvent) => {
      if (gesture) return;
      if (event.touches.length !== 1 || !(event.target instanceof Element)) return;
      suppressUntil.current = 0; // A fresh touch is intentional, unlike the drop-generated click.
      // Holding an ordinary action still belongs to that action, never to reorder.
      if (event.target.closest('button,input,select,textarea,[role="button"]')) return;
      const row = event.target.closest<HTMLElement>('[data-reorder-id]');
      if (!row || !root.contains(row)) return;
      const touch = event.touches[0];
      const bounds = row.getBoundingClientRect();
      gesture = {
        row, from: Number(row.dataset.itemIndex), to: Number(row.dataset.itemIndex), id: row.dataset.reorderId!,
        x: touch.clientX, y: touch.clientY, lastY: touch.clientY, scrollY: window.scrollY,
        center: bounds.top + bounds.height / 2, active: false, previousOverflow: '',
      };
      let delay = 200; // Preserve the established hold timing and rollback preference.
      try { if (localStorage.getItem('flag:drag-touch-hold-reduced') === 'false') delay = 400; } catch { /* unavailable storage */ }
      timer = setTimeout(() => {
        if (!gesture || !latest.current.canStart()) { finish(false); return; }
        gesture.active = true;
        gesture.previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        gesture.row.dataset.dragActive = 'true';
        gesture.row.classList.add('is-touch-reordering');
        setActive({ id: gesture.id, index: gesture.from, target: gesture.to });
        window.dispatchEvent(new Event('flicklet:reorder-start'));
      }, delay);
    };
    const move = (event: TouchEvent) => {
      if (!gesture) return;
      if (event.touches.length !== 1) { finish(false); return; }
      const touch = event.touches[0];
      if (!gesture.active) {
        if (Math.hypot(touch.clientX - gesture.x, touch.clientY - gesture.y) > 8) finish(false);
        return;
      }
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      gesture.lastY = touch.clientY;
      update();
      if (scrollFrame === undefined) scrollFrame = requestAnimationFrame(autoScroll);
    };
    const end = (event: TouchEvent) => {
      if (gesture?.active) { if (event.cancelable) event.preventDefault(); event.stopPropagation(); }
      finish(event.type === 'touchend');
    };
    const cancel = (event: Event) => {
      if (event.type === 'keydown' && (event as KeyboardEvent).key !== 'Escape') return;
      if (event.type === 'visibilitychange' && !document.hidden) return;
      if (gesture?.active && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); finish(false); }
    };
    const suppress = (event: Event) => {
      if ((gesture?.active || Date.now() < suppressUntil.current || (event.type === 'contextmenu' && gesture)) && event.target instanceof Node && root.contains(event.target)) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    };
    root.addEventListener('touchstart', start, { capture: true, passive: true });
    document.addEventListener('touchmove', move, { capture: true, passive: false });
    document.addEventListener('touchend', end, { capture: true, passive: false });
    document.addEventListener('touchcancel', end, { capture: true, passive: false });
    document.addEventListener('click', suppress, true);
    document.addEventListener('contextmenu', suppress, true);
    document.addEventListener('keydown', cancel, true);
    document.addEventListener('visibilitychange', cancel);
    window.addEventListener('flicklet:android-back', cancel);
    return () => {
      finish(false);
      root.removeEventListener('touchstart', start, true);
      document.removeEventListener('touchmove', move, true);
      document.removeEventListener('touchend', end, true);
      document.removeEventListener('touchcancel', end, true);
      document.removeEventListener('click', suppress, true);
      document.removeEventListener('contextmenu', suppress, true);
      document.removeEventListener('keydown', cancel, true);
      document.removeEventListener('visibilitychange', cancel);
      window.removeEventListener('flicklet:android-back', cancel);
    };
  }, [options.enabled, options.containerRef, signature]);
  return active;
}
