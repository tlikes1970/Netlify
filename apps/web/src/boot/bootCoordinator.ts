/**
 * Boot Coordinator - Groups first-run initializers into a single rAF
 * 
 * Ensures boot work (i18n, theme, flags, etc.) runs in one frame
 * to prevent initialization burst and flicker.
 */

export function runFirstFrameBoot(tasks: Array<() => void>) {
  requestAnimationFrame(() => {
    for (const t of tasks) {
      try {
        t();
      } catch (e) {
        // Silently fail individual tasks to prevent boot failure
        if (import.meta.env.DEV) {
          console.warn('[BootCoordinator] Task failed:', e);
        }
      }
    }
  });
}

