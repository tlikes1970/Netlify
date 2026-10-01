import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DiscoveryPage from "../DiscoveryPage";
const state = vi.hoisted(() => ({
  entries: new Map<string, any>(),
  recs: [
    {
      item: {
        id: "1",
        kind: "movie",
        title: "Test Movie",
        poster: "",
        year: 2025,
      },
      score: 0.7,
      reasons: [],
    },
  ],
  rating: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));
vi.mock("@/hooks/useSmartDiscovery", () => ({
  useSmartDiscovery: () => ({
    recommendations: state.recs,
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/lib/storage", () => ({
  Library: {
    has: (id: string) => state.entries.has(id),
    getEntry: (id: string) => state.entries.get(id),
    getCurrentList: (id: string) => state.entries.get(id)?.list,
    upsert: (item: any, list: string) => {
      state.entries.set(item.id, { ...item, list });
      window.dispatchEvent(new Event("library:changed"));
    },
    updateRating: (id: string, _type: string, rating: number) => {
      state.rating(rating);
      state.entries.get(id).userRating = rating;
      window.dispatchEvent(new Event("library:changed"));
    },
  },
}));
vi.mock("@/components/cards/CardV2", () => ({
  default: ({ item, actions, ratingOpportunity }: any) => (
    <article>
      <h3>{item.title}</h3>
      {ratingOpportunity || (
        <button onClick={() => actions.onWatched(item)}>Watched</button>
      )}
    </article>
  ),
}));
beforeEach(() => {
  state.recs = [
    {
      item: {
        id: "1",
        kind: "movie",
        title: "Test Movie",
        poster: "",
        year: 2025,
      },
      score: 0.7,
      reasons: [],
    },
  ];
  state.entries.clear();
  state.rating.mockClear();
});
describe("Discovery optional rating", () => {
  it("keeps Watched visible until Not now, with the status already saved", async () => {
    render(<DiscoveryPage />);
    expect(screen.queryByRole("slider")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Watched" }));
    expect(state.entries.get("1").list).toBe("watched");
    expect(screen.getByText("Test Movie")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    await waitFor(() => expect(screen.queryByText("Test Movie")).toBeNull());
    expect(state.rating).not.toHaveBeenCalled();
  });
  it("saves an optional rating then allows Watched filtering to remove the card", async () => {
    render(<DiscoveryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Watched" }));
    fireEvent.keyDown(screen.getByRole("slider"), { key: "End" });
    expect(state.rating).toHaveBeenCalledWith(5);
    expect(state.entries.get("1").userRating).toBe(5);
    await waitFor(() => expect(screen.queryByText("Test Movie")).toBeNull());
  });
});

it("keeps the rating card in place through a recommendation refresh", () => {
  state.recs.push({
    item: {
      id: "2",
      kind: "movie",
      title: "Another Movie",
      poster: "",
      year: 2025,
    },
    score: 0.6,
    reasons: [],
  });
  const { rerender } = render(<DiscoveryPage />);
  fireEvent.click(screen.getAllByRole("button", { name: "Watched" })[0]);
  expect(
    screen.getAllByRole("heading", { level: 3 }).map((el) => el.textContent),
  ).toEqual(["Test Movie", "Another Movie"]);
  state.recs = state.recs.filter((rec) => rec.item.id !== "1");
  rerender(<DiscoveryPage />);
  expect(
    screen.getAllByRole("heading", { level: 3 }).map((el) => el.textContent),
  ).toEqual(["Test Movie", "Another Movie"]);
  expect(screen.getByRole("button", { name: "Not now" })).toBeInTheDocument();
});
