import React, { useEffect, useMemo, useRef, useState } from "react";
import { APP_VERSION } from "../version";
import { useTranslations } from "../lib/language";
import AccountButton from "./AccountButton";
import SnarkDisplay from "./SnarkDisplay";
import UsernamePromptModal from "./UsernamePromptModal";
import { useUsername } from "../hooks/useUsername";

export type FlickletHeaderProps = {
  appName?: string;
  showMarquee?: boolean;
  messages?: string[];
  marqueeSpeedSec?: number;  // duration for one full traverse
  changeEveryMs?: number;    // how often to swap messages
  pauseOnHover?: boolean;    // pause marquee animation when hovered
  onSearch?: (query: string, genre?: string | null) => void;
  onClear?: () => void;
};

export default function FlickletHeader({
  appName = "Flicklet",
  showMarquee = false,
  messages,
  marqueeSpeedSec = 30,
  changeEveryMs = 20000,
  pauseOnHover = true,
  onSearch,
  onClear,
}: FlickletHeaderProps) {
  const translations = useTranslations();
  const { username, needsUsernamePrompt } = useUsername();
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  
  // Use provided messages or default translated messages
  const defaultMessages = [
    translations.marqueeMessage1,
    translations.marqueeMessage2,
    translations.marqueeMessage3,
    translations.marqueeMessage4,
    translations.marqueeMessage5,
  ];
  
  const marqueeMessages = messages || defaultMessages;
  // Persisted marquee visibility
  const [marqueeHidden, setMarqueeHidden] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('flicklet.marqueeHidden') : null;
      setMarqueeHidden(saved === '1');
    } catch {}
  }, []);

  const hideMarquee = () => {
    setMarqueeHidden(true);
    try { window.localStorage.setItem('flicklet.marqueeHidden', '1'); } catch {}
  };

  const showMarqueePref = () => {
    setMarqueeHidden(false);
    try { window.localStorage.removeItem('flicklet.marqueeHidden'); } catch {}
  };

  // Check if username prompt is needed
  useEffect(() => {
    console.log('🔍 Checking username prompt:', { 
      needsPrompt: needsUsernamePrompt(), 
      username, 
      showModal: showUsernamePrompt 
    });
    
    if (needsUsernamePrompt()) {
      setShowUsernamePrompt(true);
    } else {
      setShowUsernamePrompt(false);
    }
  }, [username]); // Remove needsUsernamePrompt from dependencies

  return (
    <>
      {/* Main header (not sticky) */}
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4">
          <div className="grid grid-cols-3 items-center gap-2 py-2 sm:py-3">
            {/* Left: username + snark */}
            <div className="min-w-0 text-left">
              <SnarkDisplay />
            </div>
            {/* Center: title */}
            <div className="text-center">
              <AppTitle text={appName} />
            </div>
            {/* Right: version + optional show toggle + auth */}
            <div className="flex items-center justify-end gap-2">
              <span
                className="select-none text-[11px] leading-none text-muted-foreground"
                title="App version"
                data-testid="app-version"
              >
                v{APP_VERSION}
              </span>
              {marqueeHidden && (
                <button
                  type="button"
                  onClick={showMarqueePref}
                  className="rounded-full border px-2 py-1 text-[11px] leading-none text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  aria-pressed="false"
                  data-testid="marquee-show"
                  title="Show marquee"
                >
                  {translations.showMarquee}
                </button>
              )}
              <AccountButton />
            </div>
          </div>
        </div>
      </header>

      {/* Sticky search bar */}
      <div className="sticky top-[var(--safe-top,0px)] z-[1000] border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 py-2">
          <SearchRow onSearch={onSearch} onClear={onClear} />
        </div>
      </div>

      {/* Marquee (Home only) */}
      {showMarquee && !marqueeHidden && (
        <MarqueeBar
          messages={messages}
          speedSec={marqueeSpeedSec}
          changeEveryMs={changeEveryMs}
          pauseOnHover={pauseOnHover}
          onClose={hideMarquee}
        />
      )}

      {/* Username prompt modal */}
      <UsernamePromptModal 
        isOpen={showUsernamePrompt} 
        onClose={() => setShowUsernamePrompt(false)} 
      />
    </>
  );
}

function AppTitle({ text }: { text: string }) {
  return (
    <h1
      className="select-none text-balance font-extrabold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]"
      title={text}
      data-testid="app-title"
    >
      <span className="inline-block transition-transform duration-300 ease-out hover:scale-[1.02]">{text}</span>
    </h1>
  );
}

function UserChip({ username }: { username: string }) {
  const translations = useTranslations();
  const snark = useMemo(() => oneOf([
    translations.hasExquisiteTaste,
    translations.definitelyNotProcrastinating,
    translations.breaksForPopcornOnly,
    translations.curatesChaosLikeAPro,
  ]), [translations]);

  return (
    <div className="max-w-full truncate text-sm text-muted-foreground" data-testid="user-chip">
      <span className="font-semibold text-foreground">{username}</span>{" "}
      <span className="hidden sm:inline">•</span>{" "}
      <span className="truncate align-middle">{snark}</span>
    </div>
  );
}

function SearchRow({ onSearch, onClear }: { onSearch?: (q: string, g?: string | null) => void; onClear?: () => void }) {
  const translations = useTranslations();
  const [q, setQ] = React.useState('');
  const [g, setG] = React.useState<string | null>(null);
  const submit = () => onSearch?.(q.trim(), g);
  const clear = () => { setQ(''); setG(null); onClear?.(); };
  return (
    <div id="search-container" className="flex items-center gap-2 rounded-xl border bg-background p-2" data-testid="search-row">
      <input
        type="text"
        placeholder={translations.searchPlaceholder}
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') clear(); }}
        className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none ring-0 focus:border-primary"
      />
      <select className="rounded-lg border px-2 py-2 text-sm" value={g ?? translations.allGenres} onChange={e => setG(e.target.value === translations.allGenres ? null : e.target.value)}>
        <option>{translations.allGenres}</option>
        <option value="28">{translations.action}</option>
        <option value="35">{translations.comedy}</option>
        <option value="18">{translations.drama}</option>
        <option value="27">{translations.horror}</option>
      </select>
      <button className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground" onClick={submit}>{translations.search}</button>
      <button className="rounded-lg border px-3 py-2 text-sm hover:bg-muted" onClick={clear}>{translations.clear}</button>
    </div>
  );
}

function MarqueeBar({
  messages,
  speedSec = 30,
  changeEveryMs = 20000,
  pauseOnHover = true,
  onClose,
}: {
  messages: string[];
  speedSec?: number;
  changeEveryMs?: number;
  pauseOnHover?: boolean;
  onClose?: () => void;
}) {
  const translations = useTranslations();
  const [idx, setIdx] = useState(0);
  const keyRef = useRef(0);

  useEffect(() => {
    if (!messages?.length) return;
    const t = setInterval(() => {
      setIdx(i => (i + 1) % messages.length);
      keyRef.current += 1; // restart CSS animation
    }, Math.max(4000, changeEveryMs));
    return () => clearInterval(t);
  }, [messages, changeEveryMs]);

  const msg = messages[idx] || "";

  return (
    <div
      className="marquee-rail f-marquee-rail w-full border-t bg-muted/60 text-muted-foreground"
      data-testid="marquee-rail"
      data-pause-on-hover={pauseOnHover ? 'true' : 'false'}
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4">
        <div className="relative h-9 sm:h-10 overflow-hidden">
          {/* Close / Hide control */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-1.5 top-1.5 z-[2] rounded-md border px-2 py-0.5 text-[11px] leading-none backdrop-blur hover:bg-accent hover:text-accent-foreground"
              aria-label="Hide marquee"
              data-testid="marquee-hide"
            >
              {translations.hideMarquee}
            </button>
          )}
          <div
            key={keyRef.current}
            className="absolute inset-0 whitespace-nowrap f-marquee-scroll"
            style={{ ["--marquee-duration" as any]: `${Math.max(10, speedSec)}s` }}
            aria-live="polite"
            data-testid="marquee-scroller"
          >
            <span className="pr-12 align-middle text-xs sm:text-sm">{msg}</span>
            <span className="pr-12 align-middle text-xs sm:text-sm" aria-hidden>{msg}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function oneOf<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
