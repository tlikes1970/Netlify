import Tabs from "@/components/Tabs";
import MobileTabs, { useViewportOffset } from "@/components/MobileTabs";
import { mobileContentPaddingBottom } from "@/lib/mobileViewportLayout";
import FlickletHeader from "@/components/FlickletHeader";
import Section from "@/components/Section";
import FeedbackPanel from "@/components/FeedbackPanel";
import SearchResults from "@/search/SearchResults";
import HomeYourShowsRail from "@/components/rails/HomeYourShowsRail";
import HomeUpNextRail from "@/components/rails/HomeUpNextRail";
import HomeMarquee from "@/components/HomeMarquee";
import HomeForYouSection from "@/components/home/HomeForYouSection";
import { ThemeToggleFAB } from "@/components/FABs";
import OnboardingCoachmarks from "@/components/onboarding/OnboardingCoachmarks";
import ScrollToTopArrow from "@/components/ScrollToTopArrow";
import { lazy, Suspense } from "react";
import { openSettingsSheet, closeSettingsSheet } from "@/components/settings/SettingsSheet";
import SettingsSheet from "@/components/settings/SettingsSheet";
import { openSettingsAtSection, shouldUseMobileSettings, useShouldUseMobileSettings } from "@/lib/settingsNavigation";
import type { SettingsSectionId } from "@/components/settingsConfig";

// Lazy load heavy components
const SettingsPage = lazy(() => import("@/components/SettingsPage"));
const NotesAndTagsModal = lazy(
  () => import("@/components/modals/NotesAndTagsModal"),
);
import { SeriesReminderModal } from "@/components/modals/SeriesReminderModal";
import { BloopersModal } from "@/components/extras/BloopersModal";
import { ExtrasModal } from "@/components/extras/ExtrasModal";
import { GoofsModal } from "@/components/extras/GoofsModal";
import { HelpModal } from "@/components/HelpModal";
const LibraryPage = lazy(() => import("@/pages/LibraryPage"));
const DiscoveryPage = lazy(() => import("@/pages/DiscoveryPage"));
const AuthDebugPage = lazy(() => import("@/debug/AuthDebugPage"));
import PullToRefreshWrapper from "@/components/PullToRefreshWrapper";
import { useForYouRows } from "@/hooks/useForYouRows";
import { useForYouContent } from "@/hooks/useGenreContent";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Library, useLibrary } from "@/lib/storage";
import { mountActionBridge, setToastCallback } from "@/state/actions";
import {
  useSettings,
  settingsManager,
  getFlickletMarqueeMessages,
} from "@/lib/settings";
import { useTranslations } from "@/lib/language";
import Toast, { useToast } from "@/components/Toast";
import ConfirmHost from "@/components/ConfirmHost";
import PersonalityErrorBoundary from "@/components/PersonalityErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import {
  initializeMessaging,
  getFCMToken,
  setupForegroundMessageHandler,
} from "./firebase-messaging";
import AuthModal from "@/components/AuthModal";
import AuthConfigError from "@/components/AuthConfigError";
import { isAuthInFlightInOtherTab } from "@/lib/authBroadcast";
import { getOnboardingCompleted } from "@/lib/onboarding";
import { backfillShowStatus } from "@/utils/backfillShowStatus";
import { backfillSynopsis } from "@/utils/backfillSynopsis";
import DebugAuthHUD from "@/components/DebugAuthHUD";
import { googleLogin } from "@/lib/authLogin";
import { isCapacitorNative } from "@/lib/capacitorEnv";
import { reconcileSeriesReminders } from "@/lib/seriesReminders";
import { TrialStatusBanner } from "@/components/TrialStatusBanner";
import HomeGreeting from "@/components/HomeGreeting";
import { PersonalityBanner } from "@/components/PersonalityBanner";
import { useScreenshotMode } from "@/hooks/useScreenshotMode";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  type AppView,
  type LibrarySegment,
  type NavTarget,
  isLibrarySegment,
  resolveNavigation,
  readStoredLibrarySegment,
  writeStoredLibrarySegment,
} from "@/lib/navigation";
type SearchType = "all" | "movies-tv" | "people";
type SearchState = {
  q: string;
  genre: number | null;
  type: SearchType;
  mediaTypeFilter?: "tv" | "movie" | null;
};

export default function App() {
  useEntitlements();


  const [view, setView] = useState<AppView>("home");
  /** Defer below-fold Home content until after first paint so library rails commit sooner. */
  const [afterFirstPaintReady, setAfterFirstPaintReady] = useState(false);
  const [librarySegment, setLibrarySegment] = useState<LibrarySegment>(
    readStoredLibrarySegment,
  );
  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/",
  );
  const isDebugAuth = currentPath === "/debug/auth";

  // Legacy community URLs -> home
  useEffect(() => {
    if (
      /^\/posts\/[^/]+$/.test(currentPath) ||
      currentPath === "/admin" ||
      currentPath === "/unsubscribe"
    ) {
      window.history.replaceState({}, "", "/");
      setCurrentPath("/");
    }
  }, [currentPath]);

  // Listen for path changes (from pushState/popState)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    // Also listen for custom navigation events
    window.addEventListener("pushstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("pushstate", handleLocationChange);
    };
  }, []);

  const screenshotMode = useScreenshotMode();

  // Settings state
  const settings = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  /** When opening desktop SettingsPage, which section to show first (e.g. Pro from upgrade CTAs). */
  const [settingsDesktopInitialSection, setSettingsDesktopInitialSection] =
    useState<SettingsSectionId>("account");
  const useMobileSettingsShell = useShouldUseMobileSettings();
  const prevMobileSettingsShell = useRef<boolean | null>(null);
  const translations = useTranslations();

  // Viewport offset for iOS Safari keyboard handling
  const { viewportOffset } = useViewportOffset();

  // Notes and Tags modal state
  const [notesModalItem, setNotesModalItem] = useState<any>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);

  const [seriesReminderItem, setSeriesReminderItem] = useState<any>(null);

  // Bloopers modal state (deprecated - kept for backward compatibility)
  const [bloopersModalItem, setBloopersModalItem] = useState<any>(null);
  const [showBloopersModal, setShowBloopersModal] = useState(false);

  // Goofs modal state
  const [goofsModalItem, setGoofsModalItem] = useState<any>(null);
  const [showGoofsModal, setShowGoofsModal] = useState(false);

  // Extras modal state
  const [extrasModalItem, setExtrasModalItem] = useState<any>(null);
  const [showExtrasModal, setShowExtrasModal] = useState(false);

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Debug bloopers modal state changes
  useEffect(() => {
    console.log("Bloopers modal state changed:", {
      showBloopersModal,
      hasBloopersModalItem: !!bloopersModalItem,
      bloopersModalItemTitle: bloopersModalItem?.title,
    });
  }, [showBloopersModal, bloopersModalItem]);

  // Debug extras modal state changes
  useEffect(() => {
    console.log("Extras modal state changed:", {
      showExtrasModal,
      hasExtrasModalItem: !!extrasModalItem,
      extrasModalItemTitle: extrasModalItem?.title,
    });
  }, [showExtrasModal, extrasModalItem]);

  // Toast system
  const { toasts, addToast, removeToast } = useToast();

  // Search state
  const [search, setSearch] = useState<SearchState>({
    q: "",
    genre: null,
    type: "all",
  });

  // Search handlers (defined early for use in onboarding effects)
  const handleSearch = useCallback(
    (
      q: string,
      genre: number | null,
      type: SearchType,
      mediaTypeFilter?: "tv" | "movie" | null,
    ) => {
      const nextQ = q.trim();
      setSearch({ q: nextQ, genre, type, mediaTypeFilter });
    },
    [],
  );

  const handleClear = () =>
    setSearch({ q: "", genre: null, type: "all", mediaTypeFilter: null });

  const navigateTo = useCallback(
    (target: NavTarget, options?: { clearSearch?: boolean }) => {
      const shouldClear = options?.clearSearch !== false;
      if (shouldClear) {
        handleClear();
      }
      const { view: nextView, segment } = resolveNavigation(
        target,
        librarySegment,
      );
      if (nextView === "library") {
        setLibrarySegment(segment);
        writeStoredLibrarySegment(segment);
      }
      setView(nextView);
    },
    [librarySegment],
  );

  const handleLibrarySegmentChange = useCallback((segment: LibrarySegment) => {
    setLibrarySegment(segment);
    writeStoredLibrarySegment(segment);
  }, []);

  // Handle onboarding navigation to search
  useEffect(() => {
    const handleNavigateToSearch = () => {
      // Trigger search view by setting an empty query (will show search input)
      handleSearch("", null, "all");
    };

    window.addEventListener(
      "onboarding:navigate-to-search",
      handleNavigateToSearch,
    );
    return () => {
      window.removeEventListener(
        "onboarding:navigate-to-search",
        handleNavigateToSearch,
      );
    };
  }, [handleSearch]);

  // Handle first show added event (from onboarding)
  useEffect(() => {
    const handleFirstShowAdded = () => {
      addToast("Added to Your Shows", "success");
      // Navigate to home (onboarding step advancement handled by OnboardingCoachmarks)
      navigateTo("home");
    };

    window.addEventListener("onboarding:firstShowAdded", handleFirstShowAdded);
    return () => {
      window.removeEventListener(
        "onboarding:firstShowAdded",
        handleFirstShowAdded,
      );
    };
  }, [addToast, navigateTo]);

  // Navigate to tab (e.g. from home CW rail "Go to Currently Watching" button)
  useEffect(() => {
    const handleNavigateToTab = (e: Event) => {
      const detail = (e as CustomEvent<{ tab: string }>).detail;
      const tab = detail?.tab;
      if (!tab) return;
      if (tab === "returning" || tab === "up-next") {
        navigateTo(tab);
        return;
      }
      if (tab === "home" || tab === "discovery" || tab === "library") {
        navigateTo(tab as NavTarget);
        return;
      }
      if (isLibrarySegment(tab)) {
        navigateTo(tab);
      }
    };
    window.addEventListener("navigate-to-tab", handleNavigateToTab);
    return () =>
      window.removeEventListener("navigate-to-tab", handleNavigateToTab);
  }, [navigateTo]);

  // Handle "Search Works" button click from person search results
  useEffect(() => {
    const handlePersonWorksSearch = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.personName) {
        console.log("Searching for person's works:", detail.personName);
        // Search for the person's name with movies-tv filter to show their filmography
        handleSearch(detail.personName, null, "movies-tv", null);
      }
    };

    document.addEventListener("search:person-works", handlePersonWorksSearch);
    return () => {
      document.removeEventListener(
        "search:person-works",
        handlePersonWorksSearch,
      );
    };
  }, [handleSearch]);

  // Auth state
  const {
    loading: authLoading,
    authInitialized,
    isAuthenticated,
    status,
  } = useAuth();

  useEffect(() => {
    setAfterFirstPaintReady(true);
  }, []);

  // Initialize FCM and setup message handlers
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize messaging
      initializeMessaging().then(() => {
        // Get FCM token and store it
        getFCMToken().then((token) => {
          if (token) {
            console.log("[FCM] Token obtained and stored");
          }
        });

        // Setup foreground message handler (shows toast)
        setupForegroundMessageHandler((payload) => {
          const title = payload.notification?.title || "New notification";
          const body = payload.notification?.body || "";
          addToast(`${title}: ${body}`, "info");
        });
      });
    }
  }, [isAuthenticated, addToast]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check for debug mode - persist across redirects
  const [showDebugHUD] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasDebugParam =
      urlParams.has("debugAuth") || urlParams.has("debugAuth") === true;
    // Persist in localStorage so it survives redirects
    if (hasDebugParam) {
      try {
        localStorage.setItem("flicklet.debugAuth", "true");
      } catch (e) {
        // ignore
      }
    }
    // Check both URL param and localStorage
    try {
      return (
        hasDebugParam || localStorage.getItem("flicklet.debugAuth") === "true"
      );
    } catch (e) {
      return hasDebugParam;
    }
  });

  // Auto-prompt for authentication when not authenticated (web only â€” native app uses header / account to sign in)
  useEffect(() => {
    if (isCapacitorNative()) {
      return;
    }

    // Don't auto-open modal if we're in redirecting or resolving state
    const isRedirectingOrResolving =
      status === "redirecting" || status === "resolving";

    // Also check localStorage for persisted status (in case React state hasn't updated yet)
    let persistedStatusBlocking = false;
    try {
      const persistedStatus = localStorage.getItem("flicklet.auth.status");
      persistedStatusBlocking =
        persistedStatus === "redirecting" || persistedStatus === "resolving";
    } catch (e) {
      // ignore
    }

    // Check if URL has auth params (we're returning from redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams =
      urlParams.has("state") || urlParams.has("code") || urlParams.has("error");
    const isReturningFromRedirect = window.location.hash || hasAuthParams;

    // MULTI-TAB SAFETY: Check if auth is in-flight in another tab
    let otherTabBlocking = false;
    try {
      otherTabBlocking = isAuthInFlightInOtherTab();
    } catch (e) {
      // ignore - BroadcastChannel may not be available
    }

    const shouldBlock =
      isRedirectingOrResolving ||
      persistedStatusBlocking ||
      isReturningFromRedirect ||
      otherTabBlocking;

    if (!authLoading && authInitialized && !isAuthenticated && !shouldBlock) {
      // Check if onboarding is completed before showing auth modal
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let eventHandler: (() => void) | null = null;
      let fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;

      const showAuthModalIfReady = () => {
        // If onboarding is already completed, show auth modal immediately
        if (getOnboardingCompleted()) {
          setShowAuthModal(true);
          return;
        }

        // Otherwise, wait for onboarding completion event
        eventHandler = () => {
          setShowAuthModal(true);
          if (eventHandler) {
            window.removeEventListener("onboarding:completed", eventHandler);
          }
          if (fallbackTimeoutId) {
            clearTimeout(fallbackTimeoutId);
          }
        };

        window.addEventListener("onboarding:completed", eventHandler);

        // Fallback: if onboarding doesn't complete within 3 minutes, show auth modal anyway
        // This gives users plenty of time to complete the onboarding flow
        fallbackTimeoutId = setTimeout(() => {
          if (eventHandler) {
            window.removeEventListener("onboarding:completed", eventHandler);
          }
          setShowAuthModal(true);
        }, 180000); // 3 minutes
      };

      // Small delay to ensure the app has fully loaded
      timeoutId = setTimeout(() => {
        showAuthModalIfReady();
      }, 1000);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (eventHandler) {
          window.removeEventListener("onboarding:completed", eventHandler);
        }
        if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
      };
    }
  }, [authLoading, authInitialized, isAuthenticated, status]);

  // Service Worker for offline caching
  const { isOnline } = useServiceWorker();

  useEffect(() => {
    void reconcileSeriesReminders();
    const reconcileOnResume = () => {
      if (document.visibilityState === "visible") void reconcileSeriesReminders();
    };
    document.addEventListener("visibilitychange", reconcileOnResume);
    window.addEventListener("focus", reconcileOnResume);
    return () => {
      document.removeEventListener("visibilitychange", reconcileOnResume);
      window.removeEventListener("focus", reconcileOnResume);
    };
  }, []);

  // Popup hint banner state
  const [showPopupHint, setShowPopupHint] = useState<boolean>(() => {
    try {
      return localStorage.getItem("flicklet.auth.popup.hint") === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const handler = () => {
      try {
        setShowPopupHint(
          localStorage.getItem("flicklet.auth.popup.hint") === "1",
        );
      } catch (e) {
        void e;
      }
    };
    window.addEventListener("auth:popup-hint", handler as any);
    const t = setInterval(handler, 1000);
    return () => {
      window.removeEventListener("auth:popup-hint", handler as any);
      clearInterval(t);
    };
  }, []);

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    console.log("Pull-to-refresh triggered");

    // Force refresh of library data
    // Library.refresh(); // Commented out - method doesn't exist

    // Trigger custom refresh events for components that need it
    window.dispatchEvent(new CustomEvent("force-refresh"));
    await reconcileSeriesReminders({ force: true });

    // Small delay to show the refresh animation
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  // Search is active if there's a query OR a genre selected (for genre-only search)
  const searchActive = !!search.q.trim() || search.genre != null;

  // For You configuration from settings
  const forYouRows = useForYouRows();
  const forYouContent = useForYouContent(forYouRows, {
    // Start TMDB fetches as soon as Home is active — decoupled from For You JSX mount.
    fetchEnabled: view === "home",
  });

  // Lists - using new Library system with reactive updates
  const watching = useLibrary("watching");
  const wishlist = useLibrary("wishlist");
  const watched = useLibrary("watched");

  const flickletMarqueeMessages = useMemo(
    () => getFlickletMarqueeMessages(settings.personalityLevel),
    [
      settings.personalityLevel,
      watching.length,
      wishlist.length,
      watched.length,
    ],
  );

  // Show all watching items in the tab (no filtering)
  // Users should see all their watching items in the Currently Watching tab
  const watchingVisible = useMemo(() => {
    return watching; // Show all items - don't filter out returning shows
  }, [watching]);


  /**
   * Settings shell follows the current viewport. Opening on one side of the
   * breakpoint then rotating must swap sheet vs page without close/reopen.
   */
  useEffect(() => {
    const previous = prevMobileSettingsShell.current;
    prevMobileSettingsShell.current = useMobileSettingsShell;
    if (previous === null || previous === useMobileSettingsShell) return;

    const sheetOpen =
      document.documentElement.getAttribute("data-settings-sheet") === "true";

    if (useMobileSettingsShell && showSettings) {
      setShowSettings(false);
      openSettingsSheet(settingsDesktopInitialSection);
      return;
    }

    if (!useMobileSettingsShell && sheetOpen) {
      closeSettingsSheet();
      setShowSettings(true);
    }
  }, [useMobileSettingsShell, showSettings, settingsDesktopInitialSection]);
  const handleSettingsClick = () => {
    console.log("handleSettingsClick called");
    if (shouldUseMobileSettings()) {
      console.log("Opening SettingsSheet");
      openSettingsSheet();
    } else {
      console.log("Opening SettingsPage");
      setSettingsDesktopInitialSection("account");
      setShowSettings(true);
    }
  };

  // Initialize action bridge and backfill show status
  useEffect(() => {
    // Set up toast callback for personality-based feedback
    setToastCallback(addToast);

    const cleanup = mountActionBridge();

    // Trigger show status backfill after a short delay
    const backfillTimer = setTimeout(() => {
      // REMOVED: debugGate diagnostics disabled
      backfillShowStatus();
      backfillSynopsis();
    }, 3000); // Wait 3 seconds after app loads

    return () => {
      cleanup();
      clearTimeout(backfillTimer);
    };
  }, [addToast]);

  // Full Access purchase feedback + entitlement refresh (proUpgrade dispatches events)
  useEffect(() => {
    const onPurchaseSuccess = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      addToast(
        detail?.message ?? "Purchase confirmed. Full Access unlocked.",
        "success",
      );
    };
    const onPurchaseError = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      if (detail?.message) {
        addToast(detail.message, "error");
      }
    };
    window.addEventListener("pro-upgrade-success", onPurchaseSuccess);
    window.addEventListener("pro-upgrade-error", onPurchaseError);
    return () => {
      window.removeEventListener("pro-upgrade-success", onPurchaseSuccess);
      window.removeEventListener("pro-upgrade-error", onPurchaseError);
    };
  }, [addToast]);

  // Handle deep links for settings sheet and shared list/show URLs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#settings/")) {
        const sectionId = hash.replace("#settings/", "").toLowerCase();

        // Valid section IDs from settingsConfig
        const validSections = [
          "account",
          "notifications",
          "display",
          "pro",
          "data",
          "about",
          "admin",
        ];

        if (shouldUseMobileSettings()) {
          // On mobile, open SettingsSheet with the section
          if (validSections.includes(sectionId)) {
            openSettingsSheet(sectionId as any);
          } else {
            openSettingsSheet(); // Default to section list
          }
        } else {
          // On desktop, open SettingsPage and navigate to section
          setShowSettings(true);
          // Dispatch event to navigate to section (SettingsPage listens for this)
          window.dispatchEvent(
            new CustomEvent("navigate-to-settings-section", {
              detail: { sectionId },
            }),
          );
        }
      }
    };

    /**
     * Deep-link handling for shared URLs from list/show sharing.
     *
     * Supported deep-link formats:
     * - ?view=list&listId=... - Opens list detail in My Lists view
     * - ?view=title&tmdbId=... - Navigates to search/discovery for the show
     * - ?view=title&titleId=... - Navigates to search/discovery for the show
     */
    const handleQueryParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get("view");

      // Handle list deep links - reuses same navigation as clicking a list in UI
      if (viewParam === "list") {
        const listId = urlParams.get("listId");
        // Validate: only proceed if listId is present and not empty
        if (listId && listId.trim() !== "") {
          // Navigate to mylists view (same as clicking "My Lists" in UI)
          navigateTo("mylists", { clearSearch: false });
          // Store listId for MyListsPage to select (canonical way to open list detail)
          try {
            localStorage.setItem("flicklet:shareListId", listId);
            // Dispatch event to notify MyListsPage (same event used by UI clicks)
            window.dispatchEvent(
              new CustomEvent("flicklet:selectList", { detail: { listId } }),
            );
          } catch (e) {
            console.warn("Failed to store list share params:", e);
          }

          // Clean up URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("view");
          newUrl.searchParams.delete("listId");
          window.history.replaceState({}, "", newUrl.toString());
        }
        // If listId is missing or empty, app boots normally (no deep-link action)
      }
      // Handle show deep links - navigates to appropriate view based on where show exists
      // Note: There is no in-app detail modal, so we navigate to the tab where the show
      // appears in the user's library, or to discovery if not found. This reuses the
      // same navigation as clicking a card in the UI.
      else if (viewParam === "title") {
        const tmdbId = urlParams.get("tmdbId");
        const titleId = urlParams.get("titleId");

        // Validate: proceed if at least one ID is present and not empty
        const hasValidTmdbId = tmdbId && tmdbId.trim() !== "";
        const hasValidTitleId = titleId && titleId.trim() !== "";

        if (hasValidTmdbId || hasValidTitleId) {
          // Try to find the show in the user's library
          // Check both tv and movie media types since we don't know which it is
          let foundList: "watching" | "want" | "watched" | null = null;
          const idToCheck = hasValidTmdbId ? tmdbId : titleId;

          if (idToCheck) {
            // Try to find in library (check both tv and movie)
            const numericId = hasValidTmdbId
              ? parseInt(idToCheck, 10)
              : idToCheck;
            if (!isNaN(numericId as number) || typeof numericId === "string") {
              const tvList = Library.getCurrentList(numericId, "tv");
              const movieList = Library.getCurrentList(numericId, "movie");

              if (
                tvList === "watching" ||
                tvList === "wishlist" ||
                tvList === "watched"
              ) {
                foundList = tvList === "wishlist" ? "want" : tvList;
              } else if (
                movieList === "watching" ||
                movieList === "wishlist" ||
                movieList === "watched"
              ) {
                foundList = movieList === "wishlist" ? "want" : movieList;
              }
            }
          }

          // Navigate to the appropriate view
          if (foundList) {
            // Show is in user's library - navigate to that tab (same as clicking a card)
            navigateTo(foundList, { clearSearch: false });
          } else {
            // Show not in library - navigate to discovery where user can find it
            navigateTo("discovery", { clearSearch: false });
          }

          // Store the ID in localStorage for potential use by search/discovery
          // This allows search to potentially look up the show if needed
          try {
            if (hasValidTmdbId) {
              localStorage.setItem("flicklet:shareTmdbId", tmdbId);
            }
            if (hasValidTitleId) {
              localStorage.setItem("flicklet:shareTitleId", titleId);
            }
          } catch (e) {
            console.warn("Failed to store title share params:", e);
          }

          // Clean up URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("view");
          newUrl.searchParams.delete("tmdbId");
          newUrl.searchParams.delete("titleId");
          window.history.replaceState({}, "", newUrl.toString());
        }
        // If both IDs are missing or empty, app boots normally (no deep-link action)
      }
    };

    // Check hash on load
    handleHashChange();

    // Check query params on load
    handleQueryParams();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [navigateTo]);

  // Listen for custom event to open Settings (e.g., startProUpgrade fallback)
  useEffect(() => {
    const handleOpenSettingsPage = (e: Event) => {
      const detail = (e as CustomEvent<{ section?: SettingsSectionId }>).detail;
      const section = detail?.section;
      if (shouldUseMobileSettings()) {
        openSettingsSheet(section);
      } else {
        setSettingsDesktopInitialSection(section ?? "account");
        setShowSettings(true);
      }
    };

    const handleSignInRequired = () => {
      setShowAuthModal(true);
    };

    window.addEventListener("settings:open-page", handleOpenSettingsPage);
    window.addEventListener("auth:sign-in-required", handleSignInRequired);
    return () => {
      window.removeEventListener("settings:open-page", handleOpenSettingsPage);
      window.removeEventListener("auth:sign-in-required", handleSignInRequired);
    };
  }, []);

  // Notes and Tags handlers
  const handleNotesEdit = (item: any) => {
    setNotesModalItem(item);
    setShowNotesModal(true);
  };

  const handleTagsEdit = (item: any) => {
    setNotesModalItem(item);
    setShowNotesModal(true);
  };

  const handleSimpleReminder = (item: any) => {
    setSeriesReminderItem(item);
  };

  // Bloopers handler
  const handleBloopersOpen = (item: any) => {
    console.log(
      "App.tsx handleBloopersOpen called for:",
      item.title,
      item.mediaType,
    );
    console.log("Setting bloopers modal state:", {
      showBloopersModal: true,
      bloopersModalItem: item,
    });

    flushSync(() => {
      setBloopersModalItem(item);
      setShowBloopersModal(true);
    });

    console.log("Bloopers modal state should now be set");
  };

  // Goofs handler
  const handleGoofsOpen = (item: any) => {
    console.log(
      "App.tsx handleGoofsOpen called for:",
      item.title,
      item.mediaType,
    );
    console.log("Setting goofs modal state:", {
      showGoofsModal: true,
      goofsModalItem: item,
    });

    flushSync(() => {
      setGoofsModalItem(item);
      setShowGoofsModal(true);
    });

    console.log("Goofs modal state should now be set");
  };

  // Extras handler
  const handleExtrasOpen = (item: any) => {
    console.log(
      "App.tsx handleExtrasOpen called for:",
      item.title,
      item.mediaType,
    );
    console.log("Setting extras modal state:", {
      showExtrasModal: true,
      extrasModalItem: item,
    });

    flushSync(() => {
      setExtrasModalItem(item);
      setShowExtrasModal(true);
    });

    console.log("Extras modal state should now be set");
  };

  // Help handler
  const handleHelpOpen = () => {
    console.log("App.tsx handleHelpOpen called");
    console.log("Current showHelpModal state:", showHelpModal);
    setShowHelpModal(true);
    console.log("setShowHelpModal(true) called");
  };

  const handleSaveNotesAndTags = (item: any, notes: string, tags: string[]) => {
    // Update the item in the library with new notes and tags
    Library.updateNotesAndTags(item.id, item.mediaType, notes, tags);
    setShowNotesModal(false);
    setNotesModalItem(null);
  };

  // Render debug auth page if on /debug/auth route
  if (isDebugAuth) {
    return (
      <PersonalityErrorBoundary>
        <Suspense
          fallback={
            <div
              className="min-h-screen flex items-center justify-center"
              style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
            >
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Loading...
                </p>
              </div>
            </div>
          }
        >
          <AuthDebugPage />
        </Suspense>
      </PersonalityErrorBoundary>
    );
  }

  return (
    <PersonalityErrorBoundary>
      <main
        className="flicklet-app-main min-h-screen"
        style={{
          backgroundColor: "var(--bg)",
          color: "var(--text)",
        }}
      >
        <FlickletHeader
          appName="Flicklet"
          onSearch={(q, g, t, m) =>
            handleSearch(q, g ?? null, (t as SearchType) ?? "all", m)
          }
          onClear={handleClear}
          onHelpOpen={handleHelpOpen}
          onSettingsOpen={handleSettingsClick}
          onNavigateHome={() => navigateTo("home")}
        />
        {afterFirstPaintReady && (
          <>
            <TrialStatusBanner />
            {!screenshotMode && view === "home" && !searchActive && <HomeGreeting />}
            {!screenshotMode && (view !== "home" || searchActive) && (
              <PersonalityBanner />
            )}
          </>
        )}

        {/* Desktop Tabs - tablet and above */}
        <div className="hidden md:block">
          <Tabs current={view} onChange={(tab) => navigateTo(tab)} />
        </div>

        {/* Mobile Tabs - mobile only */}
        <div className="block md:hidden">
          <MobileTabs
            current={view}
            onChange={(tab) => navigateTo(tab)}
            onSettingsClick={handleSettingsClick}
          />
        </div>

        {searchActive ? (
          <PullToRefreshWrapper onRefresh={handleRefresh}>
            <SearchResults
              query={search.q}
              genre={search.genre}
              searchType={search.type}
              mediaTypeFilter={search.mediaTypeFilter}
              onBackToHome={() => navigateTo("home")}
              onNotesEdit={handleNotesEdit}
              onTagsEdit={handleTagsEdit}
              onNotificationToggle={handleSimpleReminder}
              onSimpleReminder={handleSimpleReminder}
              onBloopersOpen={handleBloopersOpen}
              onGoofsOpen={handleGoofsOpen}
              onExtrasOpen={handleExtrasOpen}
            />
          </PullToRefreshWrapper>
        ) : (
          <PullToRefreshWrapper onRefresh={handleRefresh}>
            <>
              {view === "home" && (
                <div
                  className="pb-mobile-nav lg:pb-0"
                  style={{
                    paddingBottom: mobileContentPaddingBottom(viewportOffset),
                  }}
                >
                  {afterFirstPaintReady && (
                    <>
                      <HomeMarquee messages={flickletMarqueeMessages} />
                    </>
                  )}

                  {/* Main content start anchor */}
                  {/* This marks where the main content starts (first rail / main feed) */}
                  <div
                    id="home-content-anchor"
                    style={{ scrollMarginTop: "100px" }} // Account for sticky header
                  />

                  {/* Your Shows container with both rails */}
                  <Section title={translations.yourShows}>
                    <div className="space-y-4">
                      <HomeYourShowsRail />
                      <div
                        data-onboarding-id="home-your-shows-between"
                        className="h-4"
                      />
                      <HomeUpNextRail />
                    </div>
                  </Section>

                  {afterFirstPaintReady && (
                    <>
                      <HomeForYouSection
                        afterFirstPaintReady={afterFirstPaintReady}
                        view={view}
                        forYouContent={forYouContent}
                        forYouRows={forYouRows}
                        settings={settings}
                        forYouLabel={translations.forYou}
                        onPersonalizeGenres={() => {
                          openSettingsAtSection("display", setShowSettings);
                          setTimeout(() => {
                            const row1 =
                              document.getElementById("for-you-row-1");
                            if (row1) {
                              row1.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }
                          }, 300);
                        }}
                      />

                      <Section title={translations.feedback}>
                        <FeedbackPanel />
                      </Section>
                    </>
                  )}
                </div>
              )}

              {view === "library" && (
                <div
                  className="pb-mobile-nav lg:pb-0"
                  style={{
                    paddingBottom: mobileContentPaddingBottom(viewportOffset),
                  }}
                >
                  <Suspense
                    fallback={
                      <div
                        className="flex min-h-48 flex-col items-center justify-center"
                        role="status"
                      >
                        <div className="loading-spinner" aria-hidden="true" />
                        <span>Loading library...</span>
                      </div>
                    }
                  >
                    <LibraryPage
                      segment={librarySegment}
                      onSegmentChange={handleLibrarySegmentChange}
                      watchingItems={watchingVisible}
                      wishlistItems={wishlist}
                      watchedItems={watched}
                      onRefresh={handleRefresh}
                      onNotesEdit={handleNotesEdit}
                      onTagsEdit={handleTagsEdit}
                      onNotificationToggle={handleSimpleReminder}
                      onSimpleReminder={handleSimpleReminder}
                      onBloopersOpen={handleBloopersOpen}
                      onGoofsOpen={handleGoofsOpen}
                      onExtrasOpen={handleExtrasOpen}
                    />
                  </Suspense>
                </div>
              )}

              {view === "discovery" && (
                <div
                  className="pb-mobile-nav lg:pb-0"
                  style={{
                    paddingBottom: mobileContentPaddingBottom(viewportOffset),
                  }}
                >
                  <Suspense
                    fallback={
                      <div className="loading-spinner">
                        Loading discovery...
                      </div>
                    }
                  >
                    <DiscoveryPage />
                  </Suspense>
                </div>
              )}
            </>
          </PullToRefreshWrapper>
        )}

        {!searchActive && ["home", "library", "discovery"].includes(view) && (
          <ScrollToTopArrow key={view} />
        )}

        {!isOnline && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
            📱 You&apos;re offline - viewing cached content
          </div>
        )}

        {/* Desktop theme control; mobile theme selection lives in Settings. */}
        <ThemeToggleFAB
          theme={settings.layout.theme}
          onToggle={() =>
            settingsManager.updateTheme(
              settings.layout.theme === "dark" ? "light" : "dark",
            )
          }
        />

        {/* Settings Modal (Desktop) */}
        {showSettings && (
          <Suspense
            fallback={
              <div className="loading-spinner">Loading settings...</div>
            }
          >
            <SettingsPage
              initialSection={settingsDesktopInitialSection}
              onClose={() => {
                setShowSettings(false);
                setSettingsDesktopInitialSection("account");
              }}
            />
          </Suspense>
        )}

        {/* Settings Sheet (Mobile) */}
        <SettingsSheet />

        {/* Notes and Tags Modal */}
        {showNotesModal && notesModalItem && (
          <Suspense
            fallback={<div className="loading-spinner">Loading notes...</div>}
          >
            <NotesAndTagsModal
              item={notesModalItem}
              isOpen={showNotesModal}
              onClose={() => setShowNotesModal(false)}
              onSave={handleSaveNotesAndTags}
            />
          </Suspense>
        )}

        {seriesReminderItem && (
          <SeriesReminderModal
            item={seriesReminderItem}
            onClose={() => setSeriesReminderItem(null)}
          />
        )}

        {showBloopersModal && bloopersModalItem && (
          <BloopersModal
            isOpen={showBloopersModal}
            onClose={() => setShowBloopersModal(false)}
            showId={
              typeof bloopersModalItem.id === "string"
                ? parseInt(bloopersModalItem.id, 10)
                : bloopersModalItem.id
            }
            showTitle={bloopersModalItem.title}
          />
        )}

        {showGoofsModal && goofsModalItem && (
          <GoofsModal
            isOpen={showGoofsModal}
            onClose={() => setShowGoofsModal(false)}
            tmdbId={
              typeof goofsModalItem.id === "string"
                ? parseInt(goofsModalItem.id, 10)
                : goofsModalItem.id
            }
            title={goofsModalItem.title}
          />
        )}

        {showExtrasModal && extrasModalItem && (
          <ExtrasModal
            isOpen={showExtrasModal}
            onClose={() => setShowExtrasModal(false)}
            showId={
              typeof extrasModalItem.id === "string"
                ? parseInt(extrasModalItem.id, 10)
                : extrasModalItem.id
            }
            showTitle={extrasModalItem.title}
            mediaType={extrasModalItem.mediaType === "movie" ? "movie" : "tv"}
          />
        )}

        {/* Toast Notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            action={toast.action}
            personalityLevel={settings.personalityLevel}
            onClose={() => removeToast(toast.id)}
          />
        ))}

        <ConfirmHost />

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

        {/* Auth Config Error Surface */}
        <AuthConfigError />

        {/* Onboarding Coachmarks */}
        {(() => {
          console.log("[App] Rendering OnboardingCoachmarks component");
          return <OnboardingCoachmarks />;
        })()}

        {/* Debug HUD */}
        {showDebugHUD && (
          <DebugAuthHUD
            status={status}
            authLoading={authLoading}
            authInitialized={authInitialized}
            isAuthenticated={isAuthenticated}
            showAuthModal={showAuthModal}
          />
        )}

        {/* Help Modal */}
        {showHelpModal && (
          <HelpModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
          />
        )}

        {showPopupHint && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[10000] rounded-lg border bg-background/95 backdrop-blur px-3 py-2 text-xs md:text-sm text-foreground shadow-lg">
            <div className="flex items-center gap-2">
              <span>
                Allow popups and third-party cookies for Google sign-in.
              </span>
              <button
                type="button"
                className="rounded border px-2 py-0.5 text-[11px] hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  try {
                    localStorage.removeItem("flicklet.auth.popup.hint");
                  } catch {
                    /* ignore */
                  }
                  setShowPopupHint(false);
                  void googleLogin();
                }}
              >
                Try again
              </button>
              <button
                type="button"
                className="rounded border px-2 py-0.5 text-[11px] hover:bg-muted"
                onClick={() => {
                  try {
                    localStorage.removeItem("flicklet.auth.popup.hint");
                  } catch {
                    /* ignore */
                  }
                  setShowPopupHint(false);
                }}
                aria-label="Dismiss"
                title="Dismiss"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </main>
    </PersonalityErrorBoundary>
  );
}
