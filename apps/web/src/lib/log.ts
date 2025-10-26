// apps/web/src/lib/log.ts
import { getFlag } from './mobileFlags';

const enabled = () => {
  try { return getFlag('debug-logging'); } catch { return false; }
};

export const dlog  = (...args: any[]) => { if (enabled()) console.log(...args); };
export const dwarn = (...args: any[]) => { if (enabled()) console.warn(...args); };
// Keep errors visible; we are not hiding real failures.
export const derr  = (...args: any[]) => { console.error(...args); };
