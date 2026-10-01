import { beforeEach, describe, expect, it, vi } from "vitest";
import { Library, flushPendingSaves } from "../storage";
import { setPrimaryStatus } from "../statusTransitions";
const counts = vi.hoisted(() => vi.fn());
vi.mock("../auth", () => ({ authManager: { getCurrentUser: () => null } }));
vi.mock("../readOnlyGuard", () => ({ guardMutation: () => true }));
vi.mock("../customLists", () => ({
  customListManager: { updateItemCount: counts },
}));
vi.mock("../tmdb", () => ({ getTVShowDetails: vi.fn() }));
const item = {
  id: "8",
  title: "A title",
  mediaType: "movie" as const,
  userRating: 4,
  userNotes: "Notes",
  tags: ["family"],
};
beforeEach(() => {
  window.dispatchEvent(new Event("library:cleared"));
  localStorage.clear();
  counts.mockClear();
});
describe("custom membership survives primary status changes", () => {
  it.each(["watching", "wishlist", "watched"] as const)(
    "preserves two memberships and user content when moving to %s",
    (target) => {
      Library.upsert(item, "wishlist");
      Library.addToCustomList(item, "one");
      Library.addToCustomList(item, "two");
      counts.mockClear();
      setPrimaryStatus(item, target);
      flushPendingSaves();
      expect(Library.getEntry(item.id, item.mediaType)).toMatchObject({
        list: target,
        customListIds: ["one", "two"],
        userRating: 4,
        userNotes: "Notes",
        tags: ["family"],
      });
      expect(Library.getByList("custom:one")).toHaveLength(1);
      expect(Library.getByList("custom:two")).toHaveLength(1);
      expect(counts).not.toHaveBeenCalled();
      expect(
        JSON.parse(localStorage.getItem("flicklet.library.v2")!)["movie:8"]
          .customListIds,
      ).toEqual(["one", "two"]);
    },
  );
  it("retains legacy primary custom membership without changing its count", () => {
    Library.upsert(item, "custom:legacy");
    counts.mockClear();
    setPrimaryStatus(item, "watching");
    expect(Library.getEntry(item.id, item.mediaType)).toMatchObject({
      list: "watching",
      customListIds: ["legacy"],
    });
    expect(counts).not.toHaveBeenCalled();
  });
});
