import Tabs from "@/components/Tabs";
import MobileTabs, { useViewportOffset } from "@/components/MobileTabs";
import FlickletHeader from "@/components/FlickletHeader";
import Rail from "@/components/Rail";
import Section from "@/components/Section";
import CommunityPanel from "@/components/CommunityPanel";
import TheaterInfo from "@/components/TheaterInfo";
import FeedbackPanel from "@/components/FeedbackPanel";
import SearchResults from "@/search/SearchResults";
import HomeYourShowsRail from "@/components/rails/HomeYourShowsRail";
import HomeUpNextRail from "@/components/rails/HomeUpNextRail";
import HomeMarquee from "@/components/HomeMarquee";
import { HOME_MARQUEE_MESSAGES } from "@/config/homeMarqueeMessages";
import { SettingsFAB, ThemeToggleFAB } from "@/components/FABs";
import OnboardingCoachmarks from "@/components/onboarding/OnboardingCoachmarks";
import ScrollToTopArrow from "@/components/ScrollToTopArrow";
import HomeDownArrow from "@/components/HomeDownArrow";
import { lazy, Suspense } from "react";
import PostDetail from "@/components/PostDetail";
import { openSettingsSheet } from "@/components/settings/SettingsSheet";
import SettingsSheet from "@/components/settings/SettingsSheet";
import { flag } from "@/lib/flags";
import { isCompactMobileV1 } from "@/lib/mobileFlags";
import { openSettingsAtSection } from "@/lib/settingsNavigation";

// Lazy load heavy components
const SettingsPage = lazy(() => import("@/components/SettingsPage"));
const NotesAndTagsModal = lazy(
  () => import("@/components/modals/NotesAndTagsModal")
);
import { ShowNotificationSettingsModal } from "@/components/modals/ShowNotificationSettingsModal";
const FlickWordModal = lazy(() => import("@/components/games/FlickWordModal"));
import { BloopersModal } from "@/components/extras/BloopersModal";
import { ExtrasModal } from "@/components/extras/ExtrasModal";
import { GoofsModal } from "@/components/extras/GoofsModal";
import { HelpModal } from "@/components/HelpModal";
const ListPage = lazy(() => import("@/pages/ListPage"));
const MyListsPage = lazy(() => import("@/pages/MyListsPage"));
const DiscoveryPage = lazy(() => import("@/pages/DiscoveryPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AuthDebugPage = lazy(() => import("@/debug/AuthDebugPage"));
const UnsubscribePage = lazy(() => import("@/pages/UnsubscribePage"));
import PullToRefreshWrapper from "@/components/PullToRefreshWrapper";
import { useForYouRows } from "@/hooks/useForYouRows";
import { useForYouContent } from "@/hooks/useGenreContent";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Library, useLibrary } from "@/lib/storage";
import { mountActionBridge, setToastCallback } from "@/state/actions";
import { useSettings, settingsManager } from "@/lib/settings";
import { useInTheaters } from "@/hooks/useTmdb";
import { useTranslations } from "@/lib/language";
import Toast, { useToast } from "@/components/Toast";
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
import "@/styles/flickword.css";
import { backfillShowStatus } from "@/utils/backfillShowStatus";
import DebugAuthHUD from "@/components/DebugAuthHUD";
import { useReturningShows } from "@/state/selectors/useReturningShows";
import { trackTabOpenedReturning } from "@/lib/analytics";
import { googleLogin } from "@/lib/authLogin";

type View =
  | "home"
  | "watching"
  | "want"
  | "watched"
  | "returning"
  | "mylists"
  | "discovery";
type SearchType = "all" | "movies-tv" | "people";
type SearchState = {
  q: string;
  genre: number | null;
  type: SearchType;
  mediaTypeFilter?: "tv" | "movie" | null;
};

export default function App() {
  // Content anchor ref for Home down-arrow scroll target
  // This marks where the main content starts (first rail / main feed)
  // Config: Home down-arrow - scroll target anchor
  const homeContentAnchorRef = useRef<HTMLDivElement | null>(null);
  
  // Computed smart views
  const returning = useReturningShows();
  const [view, setView] = useState<View>("home");
  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  const isAdmin = currentPath === "/admin";
  const isDebugAuth = currentPath === "/debug/auth";
  const isUnsubscribe = currentPath === "/unsubscribe";

  // Detect post routes
  const postSlugMatch = currentPath.match(/^\/posts\/([^/]+)$/);
  const postSlug = postSlugMatch ? postSlugMatch[1] : null;

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

  // Settings state
  const settings = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const translations = useTranslations();

  // Viewport offset for iOS Safari keyboard handling
  const { viewportOffset } = useViewportOffset();

  // Notes and Tags modal state
  const [notesModalItem, setNotesModalItem] = useState<any>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Game modal state
  const [showFlickWordModal, setShowFlickWordModal] = useState(false);

  // Notification modal state
  const [notificationModalItem, setNotificationModalItem] = useState<any>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

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

  // Debug modal state changes
  useEffect(() => {
    console.log("🔔 Modal state changed:", {
      showNotificationModal,
      notificationModalItem: notificationModalItem?.title,
    });
  }, [showNotificationModal, notificationModalItem]);

  // Debug bloopers modal state changes
  useEffect(() => {
    console.log("🎬 Bloopers modal state changed:", {
      showBloopersModal,
      hasBloopersModalItem: !!bloopersModalItem,
      bloopersModalItemTitle: bloopersModalItem?.title,
    });
  }, [showBloopersModal, bloopersModalItem]);

  // Debug extras modal state changes
  useEffect(() => {
    console.log("🎭 Extras modal state changed:", {
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
      mediaTypeFilter?: "tv" | "movie" | null
    ) => {
      const nextQ = q.trim();
      setSearch({ q: nextQ, genre, type, mediaTypeFilter });
    },
    []
  );

  // Handle onboarding navigation to search
  useEffect(() => {
    const handleNavigateToSearch = () => {
      // Trigger search view by setting an empty query (will show search input)
      handleSearch("", null, "all");
    };

    window.addEventListener(
      "onboarding:navigate-to-search",
      handleNavigateToSearch
    );
    return () => {
      window.removeEventListener(
        "onboarding:navigate-to-search",
        handleNavigateToSearch
      );
    };
  }, [handleSearch]);

  // Handle first show added event (from onboarding)
  useEffect(() => {
    const handleFirstShowAdded = () => {
      addToast("Added to Your Shows", "success");
      // Navigate to home (onboarding step advancement handled by OnboardingCoachmarks)
      setView("home");
      setSearch({ q: "", genre: null, type: "all", mediaTypeFilter: null });
    };

    window.addEventListener("onboarding:firstShowAdded", handleFirstShowAdded);
    return () => {
      window.removeEventListener(
        "onboarding:firstShowAdded",
        handleFirstShowAdded
      );
    };
  }, [addToast]);

  // Auth state
  const {
    loading: authLoading,
    authInitialized,
    isAuthenticated,
    status,
  } = useAuth();

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

  // Auto-prompt for authentication when not authenticated
  useEffect(() => {
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

    // ⚠️ MULTI-TAB SAFETY: Check if auth is in-flight in another tab
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
          localStorage.getItem("flicklet.auth.popup.hint") === "1"
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
    console.log("🔄 Pull-to-refresh triggered");

    // Force refresh of library data
    // Library.refresh(); // Commented out - method doesn't exist

    // Trigger custom refresh events for components that need it
    window.dispatchEvent(new CustomEvent("force-refresh"));

    // Small delay to show the refresh animation
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  // Search is active if there's a query OR a genre selected (for genre-only search)
  const searchActive = !!search.q.trim() || search.genre != null;

  const handleClear = () =>
    setSearch({ q: "", genre: null, type: "all", mediaTypeFilter: null });

  // Listen for FlickWord explore event
  useEffect(() => {
    const handleFlickWordExplore = (e: Event) => {
      const customEvent = e as CustomEvent<{ word: string }>;
      const word = customEvent.detail?.word;
      if (word) {
        // Set search and switch to discovery view
        const nextQ = word.trim();
        setSearch({
          q: nextQ,
          genre: null,
          type: "all",
          mediaTypeFilter: null,
        });
        setView("discovery");
      }
    };

    window.addEventListener("flickword:explore", handleFlickWordExplore);
    return () => {
      window.removeEventListener("flickword:explore", handleFlickWordExplore);
    };
  }, []);

  // For You configuration from settings
  const forYouRows = useForYouRows();
  const forYouContent = useForYouContent(forYouRows);

  // Lists - using new Library system with reactive updates
  const watching = useLibrary("watching");
  const wishlist = useLibrary("wishlist");
  const watched = useLibrary("watched");

  // Show all watching items in the tab (no filtering)
  // Note: The "Returning" tab is a separate smart view for returning shows
  // Users should see all their watching items in the Currently Watching tab
  const watchingVisible = useMemo(() => {
    return watching; // Show all items - don't filter out returning shows
  }, [watching]);

  // Analytics for Returning tab open
  useEffect(() => {
    if (view === "returning") {
      trackTabOpenedReturning(Array.isArray(returning) ? returning.length : 0);
    }
  }, [view, returning]);

  // Data rails
  const theaters = useInTheaters();

  // Mobile Settings breakpoint - use sheet below this width
  const MOBILE_SETTINGS_BREAKPOINT = 744;

  /**
   * Helper to determine if mobile SettingsSheet should be used instead of desktop SettingsPage
   * Checks viewport width, compact mobile gate, and feature flag
   */
  function shouldUseMobileSettings(): boolean {
    // Guard for SSR
    if (typeof window === "undefined") return false;

    const width = window.innerWidth;

    // Check existing gate / flag checks
    const isCompact = isCompactMobileV1 ? isCompactMobileV1() : false;
    const flagEnabled = flag ? flag("settings_mobile_sheet_v1") : true;

    // If flag is disabled, always use desktop
    if (!flagEnabled) return false;

    // Use mobile sheet if viewport is narrow OR compact mobile is enabled
    if (width <= MOBILE_SETTINGS_BREAKPOINT) return true;
    if (isCompact) return true;

    return false;
  }

  // Handle settings click - route mobile to SettingsSheet, desktop to SettingsPage
  const handleSettingsClick = () => {
    console.log("🔧 handleSettingsClick called");
    if (shouldUseMobileSettings()) {
      console.log("🔧 Opening SettingsSheet");
      openSettingsSheet();
    } else {
      console.log("🔧 Opening SettingsPage");
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
      // ⚠️ REMOVED: debugGate diagnostics disabled
      backfillShowStatus();
    }, 3000); // Wait 3 seconds after app loads

    return () => {
      cleanup();
      clearTimeout(backfillTimer);
    };
  }, [addToast]);

  // Handle deep links for settings sheet and games
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
            })
          );
        }
      } else if (hash === "#games/flickword") {
        setShowFlickWordModal(true);
      }
    };

      /**
       * Deep-link handling for shared URLs from list/show/game sharing.
       * 
       * Supported deep-link formats:
       * - ?view=list&listId=... - Opens list detail in My Lists view
       * - ?view=title&tmdbId=... - Navigates to search/discovery for the show
       * - ?view=title&titleId=... - Navigates to search/discovery for the show
       * - ?game=flickword&date=...&gameNumber=... - Opens FlickWord game
       * - ?game=trivia&date=...&gameNumber=... - Opens Trivia game
       */
      const handleQueryParams = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get("view");
        const gameParam = urlParams.get("game");
        
        // Handle list deep links - reuses same navigation as clicking a list in UI
        if (viewParam === "list") {
          const listId = urlParams.get("listId");
          // Validate: only proceed if listId is present and not empty
          if (listId && listId.trim() !== "") {
            // Navigate to mylists view (same as clicking "My Lists" in UI)
            setView("mylists");
            // Store listId for MyListsPage to select (canonical way to open list detail)
            try {
              localStorage.setItem("flicklet:shareListId", listId);
              // Dispatch event to notify MyListsPage (same event used by UI clicks)
              window.dispatchEvent(
                new CustomEvent("flicklet:selectList", { detail: { listId } })
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
              const numericId = hasValidTmdbId ? parseInt(idToCheck, 10) : idToCheck;
              if (!isNaN(numericId as number) || typeof numericId === "string") {
                const tvList = Library.getCurrentList(numericId, "tv");
                const movieList = Library.getCurrentList(numericId, "movie");
                
                if (tvList === "watching" || tvList === "wishlist" || tvList === "watched") {
                  foundList = tvList === "wishlist" ? "want" : tvList;
                } else if (movieList === "watching" || movieList === "wishlist" || movieList === "watched") {
                  foundList = movieList === "wishlist" ? "want" : movieList;
                }
              }
            }
            
            // Navigate to the appropriate view
            if (foundList) {
              // Show is in user's library - navigate to that tab (same as clicking a card)
              setView(foundList);
            } else {
              // Show not in library - navigate to discovery where user can find it
              setView("discovery");
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
      // Handle game share links (existing)
      else if (gameParam === "flickword") {
        // Open FlickWord modal
        setShowFlickWordModal(true);
        
        // Store share link params for FlickWord to use
        const date = urlParams.get("date");
        const gameNumber = urlParams.get("gameNumber");
        const mode = urlParams.get("mode"); // 'sharedResult' or 'play'
        
        if (date || gameNumber || mode) {
          try {
            localStorage.setItem("flickword:shareParams", JSON.stringify({
              date: date || null,
              gameNumber: gameNumber ? parseInt(gameNumber, 10) : null,
              mode: mode || "play"
            }));
          } catch (e) {
            console.warn("Failed to store share params:", e);
          }
        }
        
        // Clean up URL (remove query params after processing)
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("game");
        newUrl.searchParams.delete("date");
        newUrl.searchParams.delete("gameNumber");
        newUrl.searchParams.delete("mode");
        window.history.replaceState({}, "", newUrl.toString());
      } else if (gameParam === "trivia") {
        // Open Trivia modal
        // Dispatch event to open Trivia modal (similar to FlickWord)
        window.dispatchEvent(new CustomEvent("open-trivia-modal"));
        
        // Store share link params for Trivia to use
        const date = urlParams.get("date");
        const gameNumber = urlParams.get("gameNumber");
        const score = urlParams.get("score");
        const mode = urlParams.get("mode"); // 'sharedResult' or 'play'
        
        if (date || gameNumber || score || mode) {
          try {
            localStorage.setItem("trivia:shareParams", JSON.stringify({
              date: date || null,
              gameNumber: gameNumber ? parseInt(gameNumber, 10) : null,
              score: score ? parseInt(score, 10) : null,
              mode: mode || "play"
            }));
          } catch (e) {
            console.warn("Failed to store Trivia share params:", e);
          }
        }
        
        // Clean up URL (remove query params after processing)
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("game");
        newUrl.searchParams.delete("date");
        newUrl.searchParams.delete("gameNumber");
        newUrl.searchParams.delete("score");
        newUrl.searchParams.delete("mode");
        window.history.replaceState({}, "", newUrl.toString());
      }
    };

    // Check hash on load
    handleHashChange();
    
    // Check query params on load
    handleQueryParams();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Listen for custom event to open SettingsPage (e.g., from SnarkDisplay or startProUpgrade)
  useEffect(() => {
    const handleOpenSettingsPage = () => {
      if (shouldUseMobileSettings()) {
        openSettingsSheet();
      } else {
        setShowSettings(true);
      }
    };

    window.addEventListener("settings:open-page", handleOpenSettingsPage);
    return () => {
      window.removeEventListener("settings:open-page", handleOpenSettingsPage);
    };
  }, []);

  // Expose game functions globally for compatibility with legacy code
  useEffect(() => {
    (window as any).openFlickWordModal = () => {
      setShowFlickWordModal(true);
    };

    (window as any).closeFlickWordModal = () => {
      setShowFlickWordModal(false);
    };

    return () => {
      delete (window as any).openFlickWordModal;
      delete (window as any).closeFlickWordModal;
    };
  }, []);

  // Show loading screen until auth state is initialized
  // Add timeout to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (!authInitialized) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
        console.error(
          "[App] Auth initialization timeout - authInitialized still false after 10 seconds"
        );
      }, 10000); // 10 second timeout
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [authInitialized]);

  function itemsFor(id: string) {
    switch (id) {
      case "currently-watching":
        return watching;
      case "up-next":
        return []; // TODO: populate from episodes
      case "in-theaters":
        return theaters.data ?? [];
      default:
        return undefined;
    }
  }

  // Notes and Tags handlers
  const handleNotesEdit = (item: any) => {
    setNotesModalItem(item);
    setShowNotesModal(true);
  };

  const handleTagsEdit = (item: any) => {
    setNotesModalItem(item);
    setShowNotesModal(true);
  };

  // Notification handler
  const handleNotificationToggle = (item: any) => {
    console.log(
      "🔔 App.tsx handleNotificationToggle called for:",
      item.title,
      item.mediaType
    );
    console.log("🔔 Setting notification modal state:", {
      showNotificationModal: true,
      notificationModalItem: item,
    });
    setNotificationModalItem(item);
    setShowNotificationModal(true);
    console.log("🔔 Modal state should now be set");
  };

  // Simple reminder handler (Free feature)
  const handleSimpleReminder = (item: any) => {
    console.log(
      "⏰ App.tsx handleSimpleReminder called for:",
      item.title,
      item.mediaType
    );
    // For now, just show a simple alert - this will be replaced with actual reminder logic
    alert(
      `⏰ Simple reminder set for "${item.title}" - you'll be notified 24 hours before the next episode airs!`
    );
  };

  // Bloopers handler
  const handleBloopersOpen = (item: any) => {
    console.log(
      "🎬 App.tsx handleBloopersOpen called for:",
      item.title,
      item.mediaType
    );
    console.log("🎬 Setting bloopers modal state:", {
      showBloopersModal: true,
      bloopersModalItem: item,
    });

    flushSync(() => {
      setBloopersModalItem(item);
      setShowBloopersModal(true);
    });

    console.log("🎬 Bloopers modal state should now be set");
  };

  // Goofs handler
  const handleGoofsOpen = (item: any) => {
    console.log(
      "🎭 App.tsx handleGoofsOpen called for:",
      item.title,
      item.mediaType
    );
    console.log("🎭 Setting goofs modal state:", {
      showGoofsModal: true,
      goofsModalItem: item,
    });

    flushSync(() => {
      setGoofsModalItem(item);
      setShowGoofsModal(true);
    });

    console.log("🎭 Goofs modal state should now be set");
  };

  // Extras handler
  const handleExtrasOpen = (item: any) => {
    console.log(
      "🎭 App.tsx handleExtrasOpen called for:",
      item.title,
      item.mediaType
    );
    console.log("🎭 Setting extras modal state:", {
      showExtrasModal: true,
      extrasModalItem: item,
    });

    flushSync(() => {
      setExtrasModalItem(item);
      setShowExtrasModal(true);
    });

    console.log("🎭 Extras modal state should now be set");
  };

  // Help handler
  const handleHelpOpen = () => {
    console.log("❓ App.tsx handleHelpOpen called");
    console.log("❓ Current showHelpModal state:", showHelpModal);
    setShowHelpModal(true);
    console.log("❓ setShowHelpModal(true) called");
  };

  const handleSaveNotesAndTags = (item: any, notes: string, tags: string[]) => {
    // Update the item in the library with new notes and tags
    Library.updateNotesAndTags(item.id, item.mediaType, notes, tags);
    setShowNotesModal(false);
    setNotesModalItem(null);
  };

  if (view !== "home") {
    return (
      <>
        <main
          className="min-h-screen"
          style={{
            backgroundColor: "var(--bg)",
            color: "var(--text)",
            minHeight: "100lvh",
          }}
        >
          {/* Debug: Show when modal should be visible - TOP LEVEL */}
          {showExtrasModal && (
            <div
              style={{
                position: "fixed",
                top: "10px",
                left: "10px",
                background: "red",
                color: "white",
                padding: "10px",
                zIndex: 9999,
                fontSize: "12px",
              }}
            >
              🎬 MODAL SHOULD BE VISIBLE: {extrasModalItem?.title}
            </div>
          )}

          <FlickletHeader
            appName="Flicklet"
            onSearch={(q, g, t, m) =>
              handleSearch(q, g ?? null, (t as SearchType) ?? "all", m)
            }
            onClear={handleClear}
            onHelpOpen={() => {
              console.log("❓ App.tsx onHelpOpen prop called");
              handleHelpOpen();
            }}
            onNavigateHome={() => {
              handleClear();
              setView("home");
            }}
          />

          {/* Desktop Tabs - tablet and above */}
          <div className="hidden md:block">
            <Tabs
              current={view}
              onChange={(tab) => {
                // Clear search when switching tabs
                handleClear();
                setView(tab);
              }}
            />
          </div>

          {/* Mobile Tabs - mobile only */}
          <div className="block md:hidden">
            <MobileTabs
              current={view}
              onChange={(tab) => {
                // Clear search when switching tabs (consistent with desktop behavior)
                // Use setTimeout to ensure clear happens before view change on iOS
                handleClear();
                // Small delay to ensure state updates properly on iOS Safari
                setTimeout(() => {
                  setView(tab);
                }, 0);
              }}
            />
          </div>

          {/* Content Area */}
          <div
            className="pb-20 lg:pb-0"
            style={{
              paddingBottom:
                viewportOffset > 0 && window.visualViewport?.offsetTop === 0
                  ? `${80 + viewportOffset}px`
                  : undefined,
            }}
          >
            {searchActive ? (
              <SearchResults
                query={search.q}
                genre={search.genre}
                searchType={search.type}
                mediaTypeFilter={search.mediaTypeFilter}
                onBackToHome={() => {
                  handleClear();
                  setView("home");
                }}
              />
            ) : (
              <>
                {/* Old home block removed - using newer layout with HomeMarquee and Section components below */}
                {/* The canonical homeContentAnchorRef is now in the newer home layout */}
                {view === "watching" && (
                  <Suspense
                    fallback={
                      <div className="loading-spinner">
                        Loading watching list...
                      </div>
                    }
                  >
                    <PullToRefreshWrapper onRefresh={handleRefresh}>
                      <div data-page="lists" data-list="watching">
                        <ListPage
                          title="Currently Watching"
                          items={watchingVisible}
                          mode="watching"
                          onNotesEdit={handleNotesEdit}
                          onTagsEdit={handleTagsEdit}
                          onNotificationToggle={handleNotificationToggle}
                          onSimpleReminder={handleSimpleReminder}
                          onBloopersOpen={handleBloopersOpen}
                          onGoofsOpen={handleGoofsOpen}
                          onExtrasOpen={handleExtrasOpen}
                        />
                      </div>
                    </PullToRefreshWrapper>
                  </Suspense>
                )}
                {view === "want" && (
                  <Suspense
                    fallback={
                      <div className="loading-spinner">Loading wishlist...</div>
                    }
                  >
                    <PullToRefreshWrapper onRefresh={handleRefresh}>
                      <div data-page="lists" data-list="wishlist">
                        <ListPage
                          title="Want to Watch"
                          items={wishlist}
                          mode="want"
                          onNotesEdit={handleNotesEdit}
                          onTagsEdit={handleTagsEdit}
                          onNotificationToggle={handleNotificationToggle}
                          onSimpleReminder={handleSimpleReminder}
                          onBloopersOpen={handleBloopersOpen}
                          onGoofsOpen={handleGoofsOpen}
                          onExtrasOpen={handleExtrasOpen}
                        />
                      </div>
                    </PullToRefreshWrapper>
                  </Suspense>
                )}
                {view === "watched" && (
                  <Suspense
                    fallback={
                      <div className="loading-spinner">
                        Loading watched list...
                      </div>
                    }
                  >
                    <PullToRefreshWrapper onRefresh={handleRefresh}>
                      <div data-page="lists" data-list="watched">
                        <ListPage
                          title="Watched"
                          items={watched}
                          mode="watched"
                          onNotesEdit={handleNotesEdit}
                          onTagsEdit={handleTagsEdit}
                          onNotificationToggle={handleNotificationToggle}
                          onSimpleReminder={handleSimpleReminder}
                          onBloopersOpen={handleBloopersOpen}
                          onGoofsOpen={handleGoofsOpen}
                          onExtrasOpen={handleExtrasOpen}
                        />
                      </div>
                    </PullToRefreshWrapper>
                  </Suspense>
                )}
                {view === "returning" && (
                  <Suspense
                    fallback={
                      <div className="loading-spinner">
                        Loading returning shows...
                      </div>
                    }
                  >
                    <PullToRefreshWrapper onRefresh={handleRefresh}>
                      <div data-page="lists" data-list="returning">
                        <ListPage
                          title="Returning"
                          items={returning as any}
                          mode="returning"
                          onNotesEdit={handleNotesEdit}
                          onTagsEdit={handleTagsEdit}
                          onNotificationToggle={handleNotificationToggle}
                          onSimpleReminder={handleSimpleReminder}
                          onBloopersOpen={handleBloopersOpen}
                          onGoofsOpen={handleGoofsOpen}
                          onExtrasOpen={handleExtrasOpen}
                        />
                      </div>
                    </PullToRefreshWrapper>
                  </Suspense>
                )}
                {view === "mylists" && (
                  <Suspense
                    fallback={
                      <div className="loading-spinner">Loading my lists...</div>
                    }
                  >
                    <div data-page="lists" data-list="mylists">
                      <MyListsPage />
                    </div>
                  </Suspense>
                )}
                {view === "discovery" && (
                  <Suspense
                    fallback={
                      <div className="loading-spinner">
                        Loading discovery...
                      </div>
                    }
                  >
                    <DiscoveryPage
                      query={search.q}
                      genreId={search.genre || null}
                    />
                  </Suspense>
                )}
              </>
            )}
          </div>

          {/* Offline Indicator */}
          {!isOnline && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              📱 You&apos;re offline - viewing cached content
            </div>
          )}

          {/* FAB Components - Available on all tabs */}
          <SettingsFAB onClick={handleSettingsClick} />
          <ThemeToggleFAB
            theme={settings.layout.theme}
            onToggle={() =>
              settingsManager.updateTheme(
                settings.layout.theme === "dark" ? "light" : "dark"
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
              <SettingsPage onClose={() => setShowSettings(false)} />
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

          {/* Show Notification Settings Modal */}
          {(() => {
            const shouldRender = showNotificationModal && notificationModalItem;
            console.log("🔔 Modal render check:", {
              showNotificationModal,
              notificationModalItem: notificationModalItem?.title,
              shouldRender,
            });
            return shouldRender;
          })() && (
            <ShowNotificationSettingsModal
              isOpen={showNotificationModal}
              onClose={() => {
                console.log("🔔 Closing notification modal");
                setShowNotificationModal(false);
              }}
              show={{
                id: Number(notificationModalItem.id),
                title: notificationModalItem.title,
                mediaType: notificationModalItem.mediaType,
              }}
            />
          )}

          {/* Bloopers Modal - DEPRECATED: Use GoofsModal instead */}
          {console.log("🎬 BloopersModal render check:", {
            showBloopersModal,
            hasBloopersModalItem: !!bloopersModalItem,
            bloopersModalItemTitle: bloopersModalItem?.title,
          })}
          {showBloopersModal && bloopersModalItem && (
            <BloopersModal
              isOpen={showBloopersModal}
              onClose={() => setShowBloopersModal(false)}
              showId={(() => {
                const id =
                  typeof bloopersModalItem.id === "string"
                    ? parseInt(bloopersModalItem.id)
                    : bloopersModalItem.id;
                console.log("🎬 BloopersModal showId conversion:", {
                  originalId: bloopersModalItem.id,
                  convertedId: id,
                  type: typeof id,
                });
                return id;
              })()}
              showTitle={bloopersModalItem.title}
            />
          )}

          {/* Goofs Modal */}
          {showGoofsModal && goofsModalItem && (
            <GoofsModal
              isOpen={showGoofsModal}
              onClose={() => setShowGoofsModal(false)}
              tmdbId={(() => {
                const id =
                  typeof goofsModalItem.id === "string"
                    ? parseInt(goofsModalItem.id)
                    : goofsModalItem.id;
                console.log("🎭 GoofsModal tmdbId conversion:", {
                  originalId: goofsModalItem.id,
                  convertedId: id,
                  type: typeof id,
                });
                return id;
              })()}
              title={goofsModalItem.title}
            />
          )}

          {/* Extras Modal */}
          {showExtrasModal && extrasModalItem && (
            <ExtrasModal
              isOpen={showExtrasModal}
              onClose={() => setShowExtrasModal(false)}
              showId={(() => {
                const id =
                  typeof extrasModalItem.id === "string"
                    ? parseInt(extrasModalItem.id)
                    : extrasModalItem.id;
                console.log("🎭 ExtrasModal showId conversion:", {
                  originalId: extrasModalItem.id,
                  convertedId: id,
                  type: typeof id,
                });
                return id;
              })()}
              showTitle={extrasModalItem.title}
              mediaType={extrasModalItem.mediaType === "movie" ? "movie" : "tv"}
            />
          )}

          {/* Help Modal */}
          {showHelpModal && (
            <HelpModal
              isOpen={showHelpModal}
              onClose={() => setShowHelpModal(false)}
            />
          )}
        </main>
        {/* Popup hint banner */}
        {showPopupHint && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[10000] rounded-lg border bg-background/95 backdrop-blur px-3 py-2 text-xs md:text-sm text-foreground shadow-lg">
            <div className="flex items-center gap-2">
              <span>
                Allow popups and third‑party cookies for Google sign‑in.
              </span>
              <button
                className="rounded border px-2 py-0.5 text-[11px] hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  try {
                    localStorage.removeItem("flicklet.auth.popup.hint");
                  } catch (e) {
                    /* ignore */
                  }
                  setShowPopupHint(false);
                  // User gesture: retry
                  void googleLogin();
                }}
              >
                Try again
              </button>
              <button
                className="rounded border px-2 py-0.5 text-[11px] hover:bg-muted"
                onClick={() => {
                  try {
                    localStorage.removeItem("flicklet.auth.popup.hint");
                  } catch (e) {
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

        {/* Toast Notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            personalityLevel={settings.personalityLevel}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </>
    );
  }

  if (!authInitialized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Loading...
          </p>
          {loadingTimeout && (
            <div
              className="mt-4 p-3 rounded border"
              style={{
                backgroundColor: "var(--btn)",
                borderColor: "var(--line)",
              }}
            >
              <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                Loading is taking longer than expected.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 text-xs rounded transition-colors"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--text)",
                }}
              >
                Reload Page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

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

  // Render unsubscribe page if on /unsubscribe route
  if (isUnsubscribe) {
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
          <UnsubscribePage />
        </Suspense>
      </PersonalityErrorBoundary>
    );
  }

  // Render admin page if on /admin route
  if (isAdmin) {
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
          <AdminPage />
        </Suspense>
      </PersonalityErrorBoundary>
    );
  }

  // Render post detail page if on /posts/:slug route
  if (postSlug) {
    return (
      <PersonalityErrorBoundary>
        <PostDetail slug={postSlug} />
      </PersonalityErrorBoundary>
    );
  }

  return (
    <PersonalityErrorBoundary>
      <main
        className="min-h-screen"
        style={{
          backgroundColor: "var(--bg)",
          color: "var(--text)",
          minHeight: "100lvh",
        }}
      >
        <FlickletHeader
          appName="Flicklet"
          onSearch={(q, g, t, m) =>
            handleSearch(q, g ?? null, (t as SearchType) ?? "all", m)
          }
          onClear={handleClear}
          onHelpOpen={handleHelpOpen}
          onNavigateHome={() => {
            handleClear();
            setView("home");
          }}
        />

        {/* Desktop Tabs - tablet and above */}
        <div className="hidden md:block">
          <Tabs
            current={view}
            onChange={(tab) => {
              // Clear search when switching tabs
              handleClear();
              setView(tab);
            }}
          />
        </div>

        {/* Mobile Tabs - mobile only */}
        <div className="block md:hidden">
          <MobileTabs
            current={view}
            onChange={(tab) => {
              // Clear search when switching tabs (consistent with desktop behavior)
              handleClear();
              setView(tab);
            }}
          />
        </div>

        {searchActive ? (
          <PullToRefreshWrapper onRefresh={handleRefresh}>
            <SearchResults
              query={search.q}
              genre={search.genre}
              searchType={search.type}
              mediaTypeFilter={search.mediaTypeFilter}
              onBackToHome={() => {
                handleClear();
                setView("home");
              }}
            />
          </PullToRefreshWrapper>
        ) : (
          <PullToRefreshWrapper onRefresh={handleRefresh}>
            <>
              {view === "home" && (
                <div
                  className="pb-20 lg:pb-0"
                  style={{
                    paddingBottom:
                      viewportOffset > 0 &&
                      window.visualViewport?.offsetTop === 0
                        ? `${80 + viewportOffset}px`
                        : undefined,
                  }}
                >
                  {/* Home Marquee - between tabs and Your Shows */}
                  <HomeMarquee messages={HOME_MARQUEE_MESSAGES} />

                  {/* Content anchor - scroll target for down-arrow */}
                  {/* This marks where the main content starts (first rail / main feed) */}
                  <div 
                    ref={homeContentAnchorRef}
                    id="home-content-anchor"
                    style={{ scrollMarginTop: '100px' }} // Account for sticky header
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

                  {/* Community container, always visible */}
                  <Section title={translations.community}>
                    <CommunityPanel />
                  </Section>

                  {/* For you container with dynamic rails based on settings */}
                  <Section
                    title={translations.forYou}
                    inlineHeaderAction={true}
                    headerAction={
                      <span
                        className="font-normal text-sm"
                        style={{ color: "var(--muted)" }}
                      >
                        (
                        <button
                          onClick={() => {
                            // CTA: Opens Settings directly to the personalization/home-rows section.
                            openSettingsAtSection("display", setShowSettings);
                            // Scroll to row 1 after a delay to ensure Settings is mounted
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
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-normal"
                          aria-label="Configure For You section"
                        >
                          Click here to personalize these rows.
                        </button>
                        )
                      </span>
                    }
                  >
                    <div className="space-y-4">
                      {forYouContent.map((contentQuery) => (
                        <Rail
                          key={`for-you-${contentQuery.rowId}`}
                          id={`for-you-${contentQuery.rowId}`}
                          title={contentQuery.title}
                          items={
                            Array.isArray(contentQuery.data)
                              ? contentQuery.data
                              : []
                          }
                          skeletonCount={12}
                        />
                      ))}
                    </div>
                  </Section>

                  {/* In theaters container with address/info header */}
                  <Section title={translations.inTheatersNearYou}>
                    <TheaterInfo />
                    <Rail
                      id="in-theaters"
                      title={translations.nowPlaying}
                      items={
                        Array.isArray(itemsFor("in-theaters"))
                          ? itemsFor("in-theaters")!.map((item) => ({
                              ...item,
                              id: String(item.id),
                              year: item.year
                                ? parseInt(String(item.year))
                                : undefined,
                            }))
                          : []
                      }
                      skeletonCount={12}
                    />
                  </Section>

                  {/* Feedback container */}
                  <Section title={translations.feedback}>
                    <FeedbackPanel />
                  </Section>

                  {/* Home down-arrow - scrolls to content anchor (only on Home page) */}
                  {view === "home" && (
                    <HomeDownArrow contentAnchorRef={homeContentAnchorRef} />
                  )}
                  
                  {/* Scroll to top arrow - appears when scrolled down */}
                  <ScrollToTopArrow threshold={400} />
                </div>
              )}

              {/* These views are handled in the main home view above */}
            </>
          </PullToRefreshWrapper>
        )}

        {/* FAB Components - Available on all tabs */}
        <SettingsFAB onClick={handleSettingsClick} />
        <ThemeToggleFAB
          theme={settings.layout.theme}
          onToggle={() =>
            settingsManager.updateTheme(
              settings.layout.theme === "dark" ? "light" : "dark"
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
            <SettingsPage onClose={() => setShowSettings(false)} />
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

        {/* Toast Notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            personalityLevel={settings.personalityLevel}
            onClose={() => removeToast(toast.id)}
          />
        ))}

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

        {/* FlickWord Game Modal */}
        {showFlickWordModal && (
          <Suspense
            fallback={<div className="loading-spinner">Loading game...</div>}
          >
            <FlickWordModal
              isOpen={showFlickWordModal}
              onClose={() => setShowFlickWordModal(false)}
            />
          </Suspense>
        )}

        {/* Help Modal */}
        {showHelpModal && (
          <HelpModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
          />
        )}
      </main>
    </PersonalityErrorBoundary>
  );
}
