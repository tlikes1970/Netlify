import React, { createContext, useContext, useMemo } from 'react';
import flagsData from './FEATURE_FLAGS.json';
import { setFlag, getFlag } from './mobileFlags';
import { isMobileQuery } from './isMobile';

type Flags = Record<string, boolean>;

const defaultFlags: Flags =
  (flagsData?.defaults as Flags) ?? {
    community_player: false,
    community_games_enabled: false,
    homeRowSpotlight: false
  };

const FlagsContext = createContext<Flags>(defaultFlags);

export function FlagsProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => defaultFlags, []);
  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}

export function useFlag(name: keyof Flags | string): boolean {
  const f = useContext(FlagsContext);
  return Boolean(f[name as string]);
}

export function flag(name: string): boolean {
  // Kill switch: Remote Config/Feature flags disabled
  // Check synchronously to avoid async issues
  try {
    const killSwitch = localStorage.getItem('ircfg:off');
    if (killSwitch === '1' || killSwitch === 'true') {
      console.info('[Flags] Disabled via kill switch (ircfg:off)');
      return false; // Return default (disabled) for all flags
    }
    
    const v = localStorage.getItem('flag:' + name);
    if (v !== null) return v === 'true';
  } catch {
    // Ignore localStorage errors
  }
  return false;
}

export function installCompactMobileGate() {
  const html = document.documentElement;
  const mql = window.matchMedia(isMobileQuery);

  const run = () => {
    try {
      // If your flag() helper exists and expects 'mobile_compact_v1', use it:
      const enabled = typeof flag === 'function'
        ? flag('mobile_compact_v1')
        : localStorage.getItem('flag:mobile_compact_v1') === 'true';

      const densityOk = html.dataset.density === 'compact';
      const mobileOk = mql.matches;

      const on = !!(enabled && densityOk && mobileOk);
      if (on) {
        setFlag('compact-mobile-v1', true);
      } else {
        setFlag('compact-mobile-v1', false);
      }
    } catch {
      // swallow; gate should never throw
    }
  };

  // fire immediately and after the next microtask (handles late density/flag writes)
  run();
  queueMicrotask(run);

  // react to the stuff that actually changes in practice
  document.addEventListener('DOMContentLoaded', run, { once: true });
  document.addEventListener('visibilitychange', run, { passive: true });
  window.addEventListener('resize', run, { passive: true });
  window.addEventListener('storage', run, { passive: true });
  window.addEventListener('hashchange', run, { passive: true });

  // density flips are attribute changes; watch only that attribute
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'attributes' && m.attributeName === 'data-density') {
        run();
        break;
      }
    }
  }).observe(html, { attributes: true, attributeFilter: ['data-density'] });

  // optional hook you can dispatch from tests: window.dispatchEvent(new Event('densitychange'))
  window.addEventListener('densitychange', run, { passive: true });
}

export function installActionsSplitGate() {
  const ensure = () => {
    try {
      const compactGate = getFlag('compact-mobile-v1');
      // Use the same pattern as installCompactMobileGate - check if flag function exists
      const flagEnabled = typeof flag === 'function'
        ? flag('mobile_actions_split_v1')
        : localStorage.getItem('flag:mobile_actions_split_v1') === 'true';
      
      // Enable actions-split if compact gate AND feature flag are both enabled
      // No viewport check - this feature works on all screen sizes
      const on = compactGate && flagEnabled;
      if (on) {
        setFlag('actions-split', true);
      } else {
        setFlag('actions-split', false);
      }
    } catch (error) {
      console.warn('Actions split gate error:', error);
      // swallow; gate should never throw
    }
  };
  
  // fire immediately and after the next microtask (handles late density/flag writes)
  ensure();
  queueMicrotask(ensure);
  
  // react to the stuff that actually changes in practice
  document.addEventListener('DOMContentLoaded', ensure, { once: true });
  document.addEventListener('visibilitychange', ensure, { passive: true });
  window.addEventListener('storage', (e) => {
    if (e.key === 'flag:mobile_actions_split_v1') ensure();
  }, { passive: true });
  
  // run once if DOM already ready
  if (document.readyState !== 'loading') ensure();
}
