import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isLibrarySegment,
  LIBRARY_SEGMENT_STORAGE_KEY,
  readStoredLibrarySegment,
  resolveNavigation,
  writeStoredLibrarySegment,
  type LibrarySegment,
} from "@/lib/navigation";

const segments: LibrarySegment[] = ["watching", "want", "watched", "mylists"];

describe("Library navigation without standalone Up Next", () => {
  beforeEach(() => sessionStorage.clear());

  it.each(["returning", "up-next"] as const)(
    "routes legacy %s requests to Home",
    (target) => {
      expect(isLibrarySegment(target)).toBe(false);
      expect(resolveNavigation(target, "watched")).toEqual({
        view: "home",
        segment: "watched",
      });
    },
  );

  it.each(["returning", "up-next", "invalid"])(
    "rejects stored %s and opens a valid Watching segment",
    (stored) => {
      sessionStorage.setItem(LIBRARY_SEGMENT_STORAGE_KEY, stored);
      const segment = readStoredLibrarySegment();
      expect(segment).toBe("watching");
      expect(resolveNavigation("library", segment)).toEqual({
        view: "library",
        segment: "watching",
      });
    },
  );

  it.each(segments)("keeps %s navigation and persistence", (segment) => {
    expect(isLibrarySegment(segment)).toBe(true);
    expect(resolveNavigation(segment, "watching")).toEqual({
      view: "library",
      segment,
    });
    writeStoredLibrarySegment(segment);
    expect(readStoredLibrarySegment()).toBe(segment);
  });

  it("keeps top-level navigation and defaults to Watching without saved state", () => {
    expect(readStoredLibrarySegment()).toBe("watching");
    for (const view of ["home", "library", "discovery"] as const) {
      expect(resolveNavigation(view, "mylists")).toEqual({
        view,
        segment: "mylists",
      });
    }
  });
});

// Keep App, HomeYourShowsRail, CardV2, and the canonical navigation resolver real.
// Isolate network/auth and unrelated presentation; destination props expose App state.
import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    loading: false,
    authInitialized: true,
    isAuthenticated: false,
    status: "idle",
  }),
}));
vi.mock("@/lib/capacitorEnv", () => ({ isCapacitorNative: () => true }));
vi.mock("@/hooks/usePurchaseReconciliation", () => ({
  usePurchaseReconciliation: () => {},
}));
vi.mock("@/hooks/useEntitlements", () => ({
  useEntitlements: () => ({ hasFullAccess: true, isReadOnlyMode: false }),
}));
vi.mock("@/hooks/useScreenshotMode", () => ({
  useScreenshotMode: () => false,
}));
vi.mock("@/hooks/useDeviceDetection", () => ({
  useIsDesktop: () => ({ isDesktop: true, ready: true }),
}));
vi.mock("@/hooks/useServiceWorker", () => ({
  useServiceWorker: () => ({ isOnline: true }),
}));
vi.mock("@/hooks/useForYouRows", () => ({ useForYouRows: () => [] }));
vi.mock("@/hooks/useGenreContent", () => ({ useForYouContent: () => [] }));
vi.mock("@/lib/settingsNavigation", () => ({
  useShouldUseMobileSettings: () => false,
  shouldUseMobileSettings: () => false,
  openSettingsAtSection: vi.fn(),
}));
vi.mock("@/lib/storage", () => ({
  useLibrary: (list: string) =>
    list === "watching"
      ? [
          {
            id: 7,
            mediaType: "tv",
            title: "Watching title",
            list: "watching",
            addedAt: 1,
          },
        ]
      : [],
  Library: {
    subscribe: () => () => {},
    getCurrentList: () => "watching",
    getEntry: () => null,
  },
}));
vi.mock("@/lib/settings", () => ({
  useSettings: () => ({
    personalityLevel: 2,
    personality: "Zen",
    layout: { theme: "dark", episodeTracking: false },
  }),
  settingsManager: {},
  getFlickletMarqueeMessages: () => ["A saying"],
  resolveFlickletLine: () => "",
  getPersonalityText: () => "",
  DEFAULT_PERSONALITY: "Zen",
}));
vi.mock("@/state/actions", () => ({
  mountActionBridge: () => () => {},
  setToastCallback: vi.fn(),
}));
vi.mock("@/utils/backfillShowStatus", () => ({ backfillShowStatus: vi.fn() }));
vi.mock("@/utils/backfillSynopsis", () => ({ backfillSynopsis: vi.fn() }));
vi.mock("@/lib/seriesReminders", () => ({
  reconcileSeriesReminders: vi.fn(async () => {}),
}));
vi.mock("@/firebase-messaging", () => ({
  initializeMessaging: vi.fn(),
  getFCMToken: vi.fn(),
  setupForegroundMessageHandler: vi.fn(),
}));
vi.mock("@/components/Toast", () => ({
  default: () => null,
  useToast: () => ({ toasts: [], addToast: () => {}, removeToast: () => {} }),
}));
vi.mock("@/components/Tabs", () => ({
  default: ({ onChange }: { onChange: (target: string) => void }) =>
    React.createElement(
      "nav",
      {},
      ...["home", "library", "discovery"].map((target) =>
        React.createElement(
          "button",
          { key: target, onClick: () => onChange(target) },
          `Navigate ${target}`,
        ),
      ),
    ),
}));
vi.mock("@/components/MobileTabs", () => ({
  default: () => null,
  useViewportOffset: () => ({ viewportOffset: 0 }),
}));
vi.mock("@/components/Section", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/PullToRefreshWrapper", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/PersonalityErrorBoundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/pages/LibraryPage", () => ({
  default: ({
    segment,
    onSegmentChange,
  }: {
    segment: string;
    onSegmentChange: (segment: string) => void;
  }) =>
    React.createElement(
      "section",
      {},
      React.createElement("h2", {}, `Library ${segment}`),
      React.createElement(
        "button",
        { onClick: () => onSegmentChange("watched") },
        "Select Watched",
      ),
    ),
}));
vi.mock("@/components/SharedTitleExperience", () => ({ default: () => null }));
vi.mock("@/components/FlickletHeader", () => ({ default: () => null }));
vi.mock("@/components/FeedbackPanel", () => ({ default: () => null }));
vi.mock("@/search/SearchResults", () => ({ default: () => null }));
vi.mock("@/components/rails/HomeUpNextRail", () => ({ default: () => null }));
vi.mock("@/components/HomeMarquee", () => ({ default: () => null }));
vi.mock("@/components/home/HomeForYouSection", () => ({ default: () => null }));
vi.mock("@/components/FABs", () => ({ ThemeToggleFAB: () => null }));
vi.mock("@/components/ScrollToTopArrow", () => ({ default: () => null }));
vi.mock("@/components/settings/SettingsSheet", () => ({
  default: () => null,
  openSettingsSheet: () => null,
  closeSettingsSheet: () => null,
}));
vi.mock("@/components/modals/SeriesReminderModal", () => ({
  SeriesReminderModal: () => null,
}));
vi.mock("@/components/extras/BloopersModal", () => ({
  BloopersModal: () => null,
}));
vi.mock("@/components/extras/ExtrasModal", () => ({ ExtrasModal: () => null }));
vi.mock("@/components/extras/GoofsModal", () => ({ GoofsModal: () => null }));
vi.mock("@/components/HelpModal", () => ({ HelpModal: () => null }));
vi.mock("@/components/ConfirmHost", () => ({ default: () => null }));
vi.mock("@/components/AuthModal", () => ({ default: () => null }));
vi.mock("@/components/AuthConfigError", () => ({ default: () => null }));
vi.mock("@/components/DebugAuthHUD", () => ({ default: () => null }));
vi.mock("@/components/TrialStatusBanner", () => ({
  TrialStatusBanner: () => null,
}));
vi.mock("@/components/PersonalityBanner", () => ({
  PersonalityBanner: () => null,
}));
vi.mock("@/components/cards/TitlePoster", () => ({ TitlePoster: () => null }));
vi.mock("@/components/MyListToggle", () => ({ default: () => null }));
vi.mock("@/features/compact/CompactPrimaryAction", () => ({
  CompactPrimaryAction: () => null,
}));
vi.mock("@/features/compact/CompactOverflowMenu", () => ({
  CompactOverflowMenu: () => null,
}));
vi.mock("@/components/EpisodeProgressDisplay", () => ({
  EpisodeProgressDisplay: () => null,
}));
vi.mock("@/components/cards/mobile/ContextStatusActions", () => ({
  ContextStatusActions: () => null,
}));
vi.mock("@/components/cards/StarRating", () => ({ default: () => null }));
vi.mock("@/components/cards/ProviderBadge", () => ({
  ProviderBadges: () => null,
}));
vi.mock("@/components/ListMembershipBadge", () => ({
  ListMembershipBadge: () => null,
}));
import App from "../../App";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("mounted App Home navigation bridge", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem(LIBRARY_SEGMENT_STORAGE_KEY, "watched");
  });
  it("real Home control opens Library Watching instead of the previously selected segment", async () => {
    const before = { url: location.href, length: history.length };
    render(React.createElement(App));
    fireEvent.click(
      screen.getByRole("button", { name: "Manage Currently Watching" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Library watching" }),
    ).toBeVisible();
    expect(readStoredLibrarySegment()).toBe("watching");
    expect({ url: location.href, length: history.length }).toEqual(before);
  });
  it("registers one listener across rerenders, replaces it safely when segment changes, and cleans up", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const mounted = render(React.createElement(App));
    const calls = () =>
      add.mock.calls.filter((call) => call[0] === "navigate-to-tab");
    expect(calls()).toHaveLength(1);
    mounted.rerender(React.createElement(App));
    expect(calls()).toHaveLength(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Manage Currently Watching" }),
    );
    await screen.findByRole("heading", { name: "Library watching" });
    expect(
      remove.mock.calls.filter((call) => call[0] === "navigate-to-tab"),
    ).toHaveLength(calls().length - 1);
    mounted.unmount();
    expect(
      remove.mock.calls.filter((call) => call[0] === "navigate-to-tab"),
    ).toHaveLength(calls().length);
    for (const call of calls())
      expect(remove).toHaveBeenCalledWith("navigate-to-tab", call[1]);
  });
  it("canonical primary navigation and later Home management continue to work", async () => {
    render(React.createElement(App));
    fireEvent.click(screen.getByRole("button", { name: "Navigate library" }));
    await screen.findByRole("heading", { name: "Library watched" });
    fireEvent.click(screen.getByRole("button", { name: "Navigate home" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Manage Currently Watching" }),
    );
    await screen.findByRole("heading", { name: "Library watching" });
    fireEvent.click(screen.getByRole("button", { name: "Select Watched" }));
    await screen.findByRole("heading", { name: "Library watched" });
    expect(readStoredLibrarySegment()).toBe("watched");
  });
  it("malformed navigation events do not change the mounted Home view", () => {
    render(React.createElement(App));
    for (const detail of [null, {}, { tab: 17 }, { tab: "invalid" }])
      act(() =>
        window.dispatchEvent(new CustomEvent("navigate-to-tab", { detail })),
      );
    expect(
      screen.getByRole("button", { name: "Manage Currently Watching" }),
    ).toBeVisible();
    expect(readStoredLibrarySegment()).toBe("watched");
  });
});
