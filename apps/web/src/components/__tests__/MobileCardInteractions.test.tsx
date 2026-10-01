import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContextStatusActions } from "../cards/mobile/ContextStatusActions";
import { SearchResultCard } from "../../search/SearchResults";
import CardV2 from "../cards/CardV2";
import type { MediaItem } from "../cards/card.types";
const mocks = vi.hoisted(() => ({
  entry: null as any,
  move: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/lib/statusTransitions", () => ({ setPrimaryStatus: mocks.move }));
vi.mock("@/lib/storage", () => ({
  Library: {
    getEntry: () => mocks.entry,
    getCurrentList: () => mocks.entry?.list ?? null,
    has: () => !!mocks.entry,
    subscribe: () => () => {},
    getAll: () => [],
    updateRating: vi.fn(),
  },
  addToListWithConfirmation: mocks.add,
}));
vi.mock("@/lib/membership", () => ({
  getMembershipInfo: () => ({
    list: mocks.entry?.list ?? null,
    displayName: mocks.entry?.list === "watched" ? "Watched" : null,
  }),
}));
vi.mock("@/lib/language", () => ({
  useTranslations: () => ({
    wantToWatchAction: "Want to Watch",
    currentlyWatchingAction: "Currently Watching",
    watchedAction: "Watched",
    notInterestedAction: "Not Interested",
    manageCurrentlyWatchingAction: "Manage Currently Watching",
  }),
}));
vi.mock("@/lib/settings", () => ({
  useSettings: () => ({
    layout: { episodeTracking: false },
    personality: "Zen",
  }),
  getPersonalityText: () => "",
  DEFAULT_PERSONALITY: "Zen",
}));
vi.mock("@/hooks/useEntitlements", () => ({
  useEntitlements: () => ({ hasFullAccess: true, isReadOnlyMode: false }),
}));
vi.mock("@/hooks/useDeviceDetection", () => ({ useIsDesktop: () => true }));
vi.mock("@/lib/isMobile", () => ({
  isMobileNow: () => true,
  onMobileChange: () => () => {},
}));
vi.mock("@/search/api", () => ({
  fetchNetworkInfo: async () => ({}),
  fetchFullMediaMetadata: async (item: any) => item,
  discoverByGenre: vi.fn(),
}));
vi.mock("@/tmdb/tv", () => ({
  fetchNextAirDate: vi.fn(),
  fetchShowStatus: vi.fn(),
}));
vi.mock("@/lib/seriesReminders", () => ({
  isSeriesReminderEnabled: () => false,
}));
vi.mock("@/components/OptimizedImage", () => ({ OptimizedImage: () => null }));
vi.mock("@/components/MyListToggle", () => ({
  default: () => <button>Custom Lists +</button>,
}));
vi.mock("@/features/compact/CompactOverflowMenu", () => ({
  CompactOverflowMenu: () => <button aria-label="More options">⋮</button>,
}));
vi.mock("@/features/compact/CompactPrimaryAction", () => ({
  CompactPrimaryAction: () => <button>Duplicate status</button>,
}));
vi.mock("@/components/EpisodeProgressDisplay", () => ({
  EpisodeProgressDisplay: () => null,
}));
vi.mock("@/lib/tmdb", () => ({ getTVShowDetails: vi.fn() }));
const item: MediaItem = {
  id: "1",
  mediaType: "movie",
  title: "A title",
  year: "2025",
  synopsis: "Summary",
};
beforeEach(() => {
  mocks.entry = null;
  vi.clearAllMocks();
});
describe("contextual status buttons", () => {
  it.each([
    [
      "watching",
      "Want to Watch",
      "wishlist",
      "Watched",
      "watched",
    ],
    ["want", "Watching", "watching", "Watched", "watched"],
    [
      "watched",
      "Watching",
      "watching",
      "Want to Watch",
      "wishlist",
    ],
  ] as const)(
    "shows only the two destinations for %s",
    (tab, a, target, b, targetB) => {
      render(<ContextStatusActions item={item} tabKey={tab} />);
      expect(screen.getAllByRole("button")).toHaveLength(2);
      fireEvent.click(screen.getByRole("button", { name: a }));
      expect(mocks.move).toHaveBeenCalledWith(item, target, { feedback: true });
      fireEvent.click(screen.getByRole("button", { name: b }));
      expect(mocks.move).toHaveBeenCalledWith(item, targetB, {
        feedback: true,
      });
      expect(screen.queryByRole("combobox")).toBeNull();
    },
  );
  it("custom cards expose Watching and Want and retain a rating", () => {
    render(
      <CardV2
        item={item}
        context="tab-watching"
        currentListContext="custom:one"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Watching" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Want to Watch" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.queryByText("Custom Lists +")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
  it("For You exposes only Want and Watched, plus overflow", () => {
    render(<CardV2 item={item} context="tab-foryou" />);
    expect(
      screen.getByRole("button", { name: "Want to Watch" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Watched" })).toBeInTheDocument();
    expect(screen.queryByText("Custom Lists +")).toBeNull();
    expect(screen.queryByText("Duplicate status")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
describe("mobile Search", () => {
  it("untracked title has no permanent status buttons and offers add destinations in overflow", () => {
    render(<SearchResultCard item={item} index={0} onRemove={() => {}} />);
    expect(
      screen.queryByRole("button", { name: "Currently Watching" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Manage" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    for (const name of [
      "Currently Watching",
      "Want to Watch",
      "Watched",
      "Custom Lists +",
    ])
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Not Interested" })).toBeNull();
  });
  it("tracked title shows status and Manage without duplicate status buttons in overflow", () => {
    mocks.entry = { ...item, list: "watched", userRating: 3 };
    render(
      <SearchResultCard
        item={item}
        index={0}
        onRemove={() => {}}
        actions={{ onDelete: mocks.remove }}
      />,
    );
    expect(screen.getByText("Status: Watched")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Watched", exact: true }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      screen.getByRole("button", { name: "Custom Lists +" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Want to Watch" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    expect(screen.queryByText(/Shows Like This/)).toBeNull();
    expect(screen.getByText(/Extras/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Notes & Tags/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove from Library" }),
    );
    expect(mocks.remove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" }),
    );
    expect(screen.queryByText("Remove from List")).toBeNull();
  });
});
