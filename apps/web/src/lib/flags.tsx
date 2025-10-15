import React, { createContext, useContext, useMemo } from 'react';
import flagsData from './FEATURE_FLAGS.json';

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
