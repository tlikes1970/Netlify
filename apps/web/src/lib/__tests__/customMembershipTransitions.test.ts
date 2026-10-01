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

describe('complete watch status transition matrix', () => {
  const statuses = ['watching', 'wishlist', 'watched', 'not'] as const;
  for (const from of statuses) {
    it.each(statuses.filter(to => to !== from))(`${from} → %s preserves two memberships and rating`, (to) => {
      Library.upsert(item, from);
      Library.addToCustomList(item, 'one');
      Library.addToCustomList(item, 'two');
      counts.mockClear();
      Library.move(item.id, item.mediaType, to);
      expect(Library.getEntry(item.id, item.mediaType)).toMatchObject({list: to, customListIds: ['one', 'two'], userRating: 4, userNotes: 'Notes', tags: ['family']});
      expect(counts).not.toHaveBeenCalled();
    });
  }
  it.each(['move', 'upsert'] as const)('%s preserves legacy membership when marking Not Interested', method => {
    Library.upsert(item, 'custom:legacy');
    counts.mockClear();
    if (method === 'move') Library.move(item.id, item.mediaType, 'not');
    else Library.upsert(item, 'not');
    expect(Library.getEntry(item.id, item.mediaType)).toMatchObject({list: 'not', customListIds: ['legacy']});
    expect(counts).not.toHaveBeenCalled();
  });
  it('normalizes the confirmed legacy alias during reload without dropping fields', () => {
    localStorage.setItem('flicklet.library.v2', JSON.stringify({'movie:8': {...item, list: 'want', addedAt: 123, customListIds: ['one', 'two']}}));
    Library.reloadFromStorage();
    expect(Library.getEntry(item.id, item.mediaType)).toMatchObject({list: 'wishlist', customListIds: ['one', 'two'], userRating: 4});
    expect(JSON.parse(localStorage.getItem('flicklet.library.v2')!)['movie:8'].list).toBe('wishlist');
  });
});

describe('removing one custom membership', () => {
  it.each(['watching', 'wishlist', 'watched', 'not'] as const)('preserves %s, the other list and user content through reload', status => {
    Library.upsert(item, status);
    Library.addToCustomList(item, 'one');
    Library.addToCustomList(item, 'two');
    counts.mockClear();
    Library.removeFromCustomList(item.id, item.mediaType, 'one');
    Library.reloadFromStorage();
    expect(Library.getEntry(item.id, item.mediaType)).toMatchObject({list: status, customListIds: ['two'], userRating: 4, userNotes: 'Notes', tags: ['family']});
    expect(Library.getByList('custom:one')).toHaveLength(0);
    expect(Library.getByList('custom:two')).toHaveLength(1);
    expect(counts).toHaveBeenCalledOnce();
    expect(counts).toHaveBeenCalledWith('one', -1);
  });
  it('retains another membership on a legacy custom-primary record', () => {
    Library.upsert(item, 'custom:one');
    Library.addToCustomList(item, 'two');
    Library.removeFromCustomList(item.id, item.mediaType, 'one');
    expect(Library.has(item.id, item.mediaType)).toBe(true);
    expect(Library.getEntry(item.id, item.mediaType)).toMatchObject({list: 'custom:two', customListIds: ['two'], userRating: 4});
    expect(Library.getByList('custom:one')).toHaveLength(0);
  });
});
