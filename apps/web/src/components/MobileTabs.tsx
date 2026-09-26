import { useTranslations } from "../lib/language";

import {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";

import type { AppView } from "@/lib/navigation";

import { MOBILE_NAV_BASE_HEIGHT } from "@/lib/capacitorSafeArea";

import { isCapacitorAndroid, isCapacitorNative } from "@/lib/capacitorEnv";

import {
  KEYBOARD_DISMISS_EVENT,
  KEYBOARD_OPEN_THRESHOLD,
  useNavViewportLift,
} from "@/lib/mobileViewportLayout";

export type MobileTabsProps = {
  current: AppView;

  onChange: (next: AppView) => void;
};

/** @deprecated Use CSS var --mobile-nav-height (includes safe-bottom) */

export const MOBILE_NAV_HEIGHT = MOBILE_NAV_BASE_HEIGHT;

type ViewportLayoutState = {
  viewportOffset: number;

  keyboardOpen: boolean;
};

const ViewportContext = createContext<ViewportLayoutState>({
  viewportOffset: 0,

  keyboardOpen: false,
});

export const useViewportOffset = () => useContext(ViewportContext);

const TOP_TABS: AppView[] = ["home", "library", "discovery"];

export default function MobileTabs({ current, onChange }: MobileTabsProps) {
  const translations = useTranslations();

  const liftNavWithViewport = useNavViewportLift();

  const [viewportOffset, setViewportOffset] = useState(0);

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const resetKeyboardLayout = useCallback(() => {
    setViewportOffset(0);

    setKeyboardOpen(false);
  }, []);

  useEffect(() => {
    const native = isCapacitorNative();

    const handleKeyboardDismiss = () => {
      resetKeyboardLayout();
      // Android adjustResize: scrollTo(0) after keyboard causes a blank gap above header.
      if (
        native &&
        !isCapacitorAndroid() &&
        window.visualViewport &&
        window.visualViewport.offsetTop > 0
      ) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener(KEYBOARD_DISMISS_EVENT, handleKeyboardDismiss);

    const handleFocusOut = (e: FocusEvent) => {
      if (!native) return;

      const next = e.relatedTarget as Node | null;

      if (
        next &&
        (e.target as HTMLElement)?.closest?.('[data-role="searchbar"]')
      ) {
        if (
          next instanceof HTMLElement &&
          next.closest('[data-role="searchbar"]')
        ) {
          return;
        }
      }

      window.setTimeout(handleKeyboardDismiss, 150);
    };

    document.addEventListener("focusout", handleFocusOut, true);

    if (native) {
      const vv = window.visualViewport;

      const syncNativeKeyboard = () => {
        const inset = Math.max(
          0,
          window.innerHeight - (vv?.height ?? window.innerHeight),
        );

        const open = inset > KEYBOARD_OPEN_THRESHOLD;

        setKeyboardOpen(open);

        setViewportOffset(0);

        if (!open) {
          setKeyboardOpen(false);
        }
      };

      vv?.addEventListener("resize", syncNativeKeyboard);

      vv?.addEventListener("scroll", syncNativeKeyboard);

      syncNativeKeyboard();

      return () => {
        vv?.removeEventListener("resize", syncNativeKeyboard);

        vv?.removeEventListener("scroll", syncNativeKeyboard);

        window.removeEventListener(
          KEYBOARD_DISMISS_EVENT,
          handleKeyboardDismiss,
        );

        document.removeEventListener("focusout", handleFocusOut, true);
      };
    }

    if (!window.visualViewport) {
      const handleFallbackResize = () => {
        const heightDiff = window.innerHeight - window.screen.height;

        setViewportOffset(
          Math.abs(heightDiff) > 100 ? Math.abs(heightDiff) : 0,
        );
      };

      const handleOrientationChange = () => {
        window.setTimeout(resetKeyboardLayout, 100);
      };

      const handleVisibilityChange = () => {
        if (document.hidden) resetKeyboardLayout();
      };

      window.addEventListener("resize", handleFallbackResize);

      window.addEventListener("orientationchange", handleOrientationChange);

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        window.removeEventListener("resize", handleFallbackResize);

        window.removeEventListener(
          "orientationchange",
          handleOrientationChange,
        );

        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );

        window.removeEventListener(
          KEYBOARD_DISMISS_EVENT,
          handleKeyboardDismiss,
        );

        document.removeEventListener("focusout", handleFocusOut, true);
      };
    }

    let prevOffsetTop = 0;

    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleViewportChange = () => {
      if (throttleTimeout) return;

      throttleTimeout = window.setTimeout(() => {
        throttleTimeout = null;

        const visualHeight =
          window.visualViewport?.height || window.innerHeight;

        const screenHeight = window.innerHeight;

        const currentOffsetTop = window.visualViewport
          ? window.visualViewport.offsetTop
          : 0;

        const offsetTopDelta = Math.abs(currentOffsetTop - prevOffsetTop);

        if (offsetTopDelta > 50) {
          setViewportOffset(0);

          prevOffsetTop = currentOffsetTop;

          return;
        }

        const offset = Math.max(0, screenHeight - visualHeight);

        setViewportOffset(offset > KEYBOARD_OPEN_THRESHOLD ? offset : 0);

        setKeyboardOpen(offset > KEYBOARD_OPEN_THRESHOLD);

        prevOffsetTop = currentOffsetTop;
      }, 50);
    };

    handleViewportChange();

    window.visualViewport.addEventListener("resize", handleViewportChange);

    return () => {
      window.visualViewport?.removeEventListener(
        "resize",
        handleViewportChange,
      );

      if (throttleTimeout) clearTimeout(throttleTimeout);

      window.removeEventListener(KEYBOARD_DISMISS_EVENT, handleKeyboardDismiss);

      document.removeEventListener("focusout", handleFocusOut, true);
    };
  }, [resetKeyboardLayout]);

  const navBottom = liftNavWithViewport ? viewportOffset : 0;

  const labelFor = (id: AppView) => {
    if (id === "home") return translations.home;
    if (id === "library") return "Library";
    return translations.discovery ?? "Discover";
  };

  return (
    <ViewportContext.Provider value={{ viewportOffset, keyboardOpen }}>
      <nav
        className={`mobile-nav fixed left-0 right-0 z-nav${
          keyboardOpen ? " mobile-nav--keyboard-hidden" : ""
        }`}
        style={{
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          backgroundColor: "var(--bg)",
          borderTop: "1px solid var(--line)",
          // Capacitor: omit bottom so CSS .mobile-nav { bottom: var(--safe-bottom) } applies.
          // iOS mobile browser only: lift above keyboard via visualViewport offset.
          ...(navBottom > 0 ? { bottom: `${navBottom}px` } : {}),
          zIndex: 9999,
        }}
        aria-label="Main navigation"
        aria-hidden={keyboardOpen}
      >
        <div
          className="grid grid-cols-[max-content_max-content_minmax(0,1fr)] min-h-[3.25rem] max-w-lg mx-auto gap-1"
          style={{
            width: "calc(100% - 4rem)",
            marginLeft: "4rem",
            marginRight: 0,
          }}
        >
          {TOP_TABS.map((tabId) => {
            const active = current === tabId;

            return (
              <button
                key={tabId}
                type="button"
                onClick={() => onChange(tabId)}
                className="flex min-w-0 flex-col items-center justify-center rounded-lg px-1 min-h-[3.25rem] py-1 transition-colors relative touch-manipulation"
                style={{
                  color: active ? "var(--accent)" : "var(--muted)",

                  fontWeight: active ? 600 : 500,
                }}
                aria-current={active ? "page" : undefined}
                tabIndex={keyboardOpen ? -1 : 0}
              >
                <span className="min-w-0 max-w-full text-xs font-medium leading-tight text-center [overflow-wrap:anywhere]">
                  {labelFor(tabId)}
                </span>

                {active && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </ViewportContext.Provider>
  );
}
