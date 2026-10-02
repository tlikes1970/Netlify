import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyRestore,
  collectLocal,
  parseBackup,
  restoreWrites,
  validateBackup,
  type Backup,
} from "../backup";
const defaults = {
  personality: "Zen",
  personalityLevel: 2,
  notifications: {
    upcomingEpisodes: true,
    weeklyDiscover: true,
    monthlyStats: true,
  },
  layout: {
    theme: "dark",
    condensedView: false,
    homePageLists: ["up-next"],
    forYouGenres: ["horror"],
    episodeTracking: true,
    discoveryLimit: 25,
  },
};
export const fixture = (): Backup => ({
  type: "flicklet-backup",
  schemaVersion: 1,
  createdAt: "2026-10-01T12:00:00Z",
  appVersion: "2.0.9",
  library: [
    {
      id: 10,
      mediaType: "tv",
      title: "Show",
      list: "watching",
      addedAt: 123,
      userRating: 0,
      ratingUpdatedAt: 234,
      userNotes: "Keep these notes",
      tags: ["family"],
      customListIds: ["family"],
      isFavorite: true,
    },
  ],
  customLists: [
    { id: "family", name: "Family", createdAt: 123, itemCount: 99 },
  ],
  settings: structuredClone(defaults),
  preferredName: "TJ",
  local: {
    "episode-progress-10": {
      episodes: { S1E1: true, S1E2: false },
      totalEpisodes: 2,
      seasons: [{ seasonNumber: 1, episodeNumbers: [1, 2] }],
    },
    "flicklet.language.v2": "es",
  },
});
function existing() {
  localStorage.setItem(
    "flicklet.library.v2",
    JSON.stringify({ "movie:99": { id: 99, title: "Original" } }),
  );
  localStorage.setItem(
    "flicklet.settings.v2",
    JSON.stringify({
      ...defaults,
      preferredName: "Original Name",
      username: "reserved_handle",
      usernamePrompted: true,
      pro: { isPro: true, features: { extrasAccess: true } },
      unknown: { keep: true },
    }),
  );
  localStorage.setItem(
    "flicklet.customLists.v2",
    JSON.stringify({ customLists: [{ id: "old" }], maxLists: 3 }),
  );
  localStorage.setItem(
    "episode-progress-99",
    JSON.stringify({ episodes: { S2E1: true } }),
  );
  localStorage.setItem("auth-token", "secret");
  localStorage.setItem("flicklet.trial.v1", "current trial");
}
const snapshot = () =>
  Object.fromEntries(
    Object.keys(localStorage)
      .sort()
      .map((k) => [k, localStorage.getItem(k)]),
  );
beforeEach(() => {
  localStorage.clear();
  existing();
});
describe("backup schema and portable data", () => {
  it("retains ratings including zero, notes, tags, favorite and membership and recomputes counts", () => {
    const b = validateBackup(fixture());
    expect(b.library[0]).toMatchObject(fixture().library[0]);
    expect(b.customLists[0].itemCount).toBe(1);
  });
  it("keeps all four standard watch statuses and custom primary status", () => {
    for (const list of [
      "watching",
      "wishlist",
      "watched",
      "not",
      "custom:family",
    ]) {
      const b = fixture();
      b.library[0].list = list as (typeof b.library)[0]["list"];
      expect(validateBackup(b).library[0].list).toBe(list);
    }
  });
  it("clones rather than mutating live state", () => {
    const input = fixture();
    const b = validateBackup(input);
    b.library[0].tags!.push("new");
    expect(input.library[0].tags).toEqual(["family"]);
    expect(input.customLists[0].itemCount).toBe(99);
  });
  it("reads current local paths and excludes obsolete identity, access and runtime paths", () => {
    localStorage.setItem("flicklet-settings", '{"pro":{"isPro":true}}');
    localStorage.setItem("flicklet-user", '{"uid":"other"}');
    localStorage.setItem("flickword:game-state", "{}");
    expect(collectLocal(localStorage, null)).toEqual({
      "episode-progress-99": { episodes: { S2E1: true } },
    });
  });
  it("reads scoped genre preferences without exporting account ID", () => {
    localStorage.setItem(
      "flicklet:forYouRows:v2:current",
      JSON.stringify({
        version: 2,
        rows: [
          {
            id: "1",
            mainGenre: "horror",
            subGenre: "psychological",
            title: "Horror",
          },
        ],
      }),
    );
    const json = JSON.stringify(collectLocal(localStorage, "current"));
    expect(json).toContain("forYouRows");
    expect(json).not.toContain("current");
  });
  it("normalizes old bare episode maps", () => {
    localStorage.setItem("episode-progress-99", '{"S1E2":true}');
    expect(collectLocal(localStorage, null)["episode-progress-99"]).toEqual({
      episodes: { S1E2: true },
    });
  });
  it("ignores injected authentication, handles and pro flags in settings", () => {
    const b = fixture();
    Object.assign(b.settings, {
      username: "stolen",
      uid: "attacker",
      email: "attack@example.com",
      pro: { isPro: true },
      tokens: "secret",
    });
    const clean = validateBackup(b);
    expect(clean.settings).toEqual(defaults);
    expect(JSON.stringify(clean)).not.toContain("attacker");
  });
  it.each(["{", "null", "[]", '{"watchlists":{}}'])(
    "rejects malformed/unknown file %s without mutation",
    (raw) => {
      const old = snapshot();
      expect(() => parseBackup(raw)).toThrow();
      expect(snapshot()).toEqual(old);
    },
  );
  it.each([
    "schema",
    "library",
    "settings",
    "customLists",
    "mediaType",
    "progress",
    "membership",
    "duplicate",
    "prototype",
    "date",
    "name",
  ])("rejects corrupt %s before mutation", (kind) => {
    const b: any = fixture();
    if (kind === "schema") b.schemaVersion = 42;
    if (kind === "library") delete b.library;
    if (kind === "settings") b.settings.layout = {};
    if (kind === "customLists") b.customLists = {};
    if (kind === "mediaType") b.library[0].mediaType = "person";
    if (kind === "progress")
      b.local["episode-progress-10"].episodes.S1E1 = "true";
    if (kind === "membership") b.library[0].customListIds = ["missing"];
    if (kind === "duplicate") b.library.push({ ...b.library[0] });
    if (kind === "prototype") b.local = JSON.parse('{"__proto__":{}}');
    if (kind === "date") b.createdAt = "bad";
    if (kind === "name") b.preferredName = {};
    const old = snapshot();
    expect(() => validateBackup(b)).toThrow();
    expect(snapshot()).toEqual(old);
  });
  it("rejects grantable access as an additional portable category", () => {
    const b = fixture();
    b.local["billing/status"] = { paid: true };
    expect(() => validateBackup(b)).toThrow("unsupported data category");
  });
});
describe("safe replacement and rollback", () => {
  it("replaces content/progress/settings while preserving account, handle, access and unknown fields", async () => {
    const b = validateBackup(fixture());
    const cloud = vi.fn(async () => undefined);
    await applyRestore(
      restoreWrites(b, localStorage, "current"),
      localStorage,
      cloud,
      () => true,
    );
    expect(cloud).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem("flicklet.library.v2")!)).toEqual({
      "tv:10": b.library[0],
    });
    expect(localStorage.getItem("episode-progress-99")).toBeNull();
    expect(JSON.parse(localStorage.getItem("episode-progress-10")!)).toEqual(
      b.local["episode-progress-10"],
    );
    const s = JSON.parse(localStorage.getItem("flicklet.settings.v2")!);
    expect(s).toMatchObject({
      preferredName: "TJ",
      username: "reserved_handle",
      usernamePrompted: true,
      pro: { isPro: true },
      unknown: { keep: true },
    });
    expect(localStorage.getItem("auth-token")).toBe("secret");
    expect(localStorage.getItem("flicklet.trial.v1")).toBe("current trial");
    expect(
      JSON.parse(localStorage.getItem("flicklet.customLists.v2")!),
    ).toMatchObject({ customLists: b.customLists, maxLists: 3 });
  });
  it("restores cloud failure to byte-for-byte prior local data", async () => {
    const before = snapshot();
    await expect(
      applyRestore(
        restoreWrites(validateBackup(fixture()), localStorage, null),
        localStorage,
        async () => {
          throw new Error("offline");
        },
        () => true,
      ),
    ).rejects.toThrow("offline");
    expect(snapshot()).toEqual(before);
  });
  it("recovers an ordinary storage-write failure before any cloud commit", async () => {
    const before = snapshot();
    const writes = restoreWrites(validateBackup(fixture()), localStorage, null);
    const cloud = vi.fn();
    const real = Storage.prototype.setItem;
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(function () {
        throw new Error("quota");
      })
      .mockImplementation(function (k, v) {
        real.call(this, k, v);
      });
    try {
      await expect(
        applyRestore(writes, localStorage, cloud, () => true),
      ).rejects.toThrow("quota");
      expect(snapshot()).toEqual(before);
      expect(cloud).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
  it("refuses a changed account without touching local storage", async () => {
    const before = snapshot();
    await expect(
      applyRestore(
        restoreWrites(validateBackup(fixture()), localStorage, null),
        localStorage,
        vi.fn(),
        () => false,
      ),
    ).rejects.toThrow("account changed");
    expect(snapshot()).toEqual(before);
  });
  it("preserves current preferred name when a backup has no name", () => {
    const b = fixture();
    b.preferredName = null;
    const writes = restoreWrites(validateBackup(b), localStorage, null);
    expect(JSON.parse(writes.get("flicklet.settings.v2")!).preferredName).toBe(
      "Original Name",
    );
  });
  it("reconstructs the game compatibility mirror without replacing unrelated values", () => {
    localStorage.setItem(
      "flicklet-data",
      '{"trivia":{"games":99},"account":{"keep":true}}',
    );
    const b = fixture();
    b.local["trivia:stats"] = { games: 2, wins: 1 };
    const writes = restoreWrites(validateBackup(b), localStorage, null);
    expect(JSON.parse(writes.get("flicklet-data")!)).toEqual({
      account: { keep: true },
      trivia: { games: 2, wins: 1 },
      flickword: {},
    });
  });
  it("a missing optional preference removes the previous backed-up preference", () => {
    const old = JSON.parse(localStorage.getItem("flicklet.settings.v2")!);
    old.layout.themePack = "old";
    old.notifications.alertConfig = {
      leadTimeHours: 7,
      targetList: "watching",
    };
    localStorage.setItem("flicklet.settings.v2", JSON.stringify(old));
    const s = JSON.parse(
      restoreWrites(validateBackup(fixture()), localStorage, null).get(
        "flicklet.settings.v2",
      )!,
    );
    expect(s.layout.themePack).toBeUndefined();
    expect(s.notifications.alertConfig).toBeUndefined();
  });
});
describe("legacy 2.0 compatibility", () => {
  const legacy = () => ({
    version: "2.0",
    timestamp: "2026-01-01T00:00:00Z",
    watchlists: {
      movies: {
        watching: [{ id: 10, title: "Movie", userRating: 0 }],
        wishlist: [],
        watched: [],
      },
      tv: { watching: [], wishlist: [], watched: [] },
      customLists: [{ id: "family", name: "Family", createdAt: 1 }],
      customItems: { family: [{ id: 10, title: "Movie", mediaType: "movie" }] },
    },
    settings: {
      username: "Travis",
      usernamePrompted: true,
      pro: { isPro: true },
    },
    user: { uid: "foreign", displayName: "Provider" },
  });
  it('accepts the legacy want bucket and preserves optional Not Interested records', () => {
    const backup: any = legacy();
    backup.watchlists.movies.want = backup.watchlists.movies.wishlist;
    delete backup.watchlists.movies.wishlist;
    backup.watchlists.movies.not = [{id: 11, title: 'Hidden'}];
    expect(parseBackup(JSON.stringify(backup)).library).toEqual(expect.arrayContaining([expect.objectContaining({id: 11, list: 'not'})]));
  });
  it("normalizes names and additive memberships without importing identity/access", () => {
    const b = parseBackup(JSON.stringify(legacy()));
    expect(b.preferredName).toBe("Travis");
    expect(b.library).toHaveLength(1);
    expect(b.library[0]).toMatchObject({
      userRating: 0,
      list: "watching",
      customListIds: ["family"],
    });
    expect(b.settings).toEqual({});
    expect(JSON.stringify(b)).not.toContain("foreign");
  });
  it("keeps uncaptured current categories rather than erasing old progress", () => {
    const b = validateBackup(parseBackup(JSON.stringify(legacy())));
    expect(
      restoreWrites(b, localStorage, null).has("episode-progress-99"),
    ).toBe(false);
  });
  it("ignores a provider-only legacy name", () => {
    const old = legacy();
    old.settings = {} as typeof old.settings;
    expect(parseBackup(JSON.stringify(old)).preferredName).toBeNull();
  });
  it("rejects incomplete legacy lists without changing data", () => {
    const b: any = legacy();
    delete b.watchlists.tv.watched;
    const before = snapshot();
    expect(() => parseBackup(JSON.stringify(b))).toThrow();
    expect(snapshot()).toEqual(before);
  });
  it("does not trust the app version as a legacy compatibility switch", () => {
    const b = fixture();
    b.appVersion = "legacy 2.0";
    expect(
      restoreWrites(validateBackup(b), localStorage, null).get(
        "episode-progress-99",
      ),
    ).toBeNull();
  });
});

 describe('watch status backup compatibility', () => {
  it.each(['watching', 'wishlist', 'watched', 'not', 'want'])('restores %s without losing content or membership', (status) => {
    const backup = fixture();
    backup.library[0].list = status as typeof backup.library[0]['list'];
    const restored = validateBackup(backup);
    expect(restored.library[0]).toMatchObject({list: status === 'want' ? 'wishlist' : status, customListIds: ['family'], userNotes: 'Keep these notes', tags: ['family']});
  });
 });

it('retains compatible custom order and network selections through backup validation and restore',()=>{
  const backup=fixture();
  backup.local['flk.tab.watching.sort']='custom';
  backup.local['flk.tab.watching.filter.type']='tv';
  backup.local['flk.tab.watching.filter.providers']=['NETFLIX'];
  backup.local['flk.tab.watching.order.custom']=['10:tv','removed:movie'];
  const validated=validateBackup(parseBackup(JSON.stringify(backup)));
  const writes=restoreWrites(validated,localStorage,null);
  expect(JSON.parse(writes.get('flk.tab.watching.order.custom')!)).toEqual(['10:tv','removed:movie']);
  expect(JSON.parse(writes.get('flk.tab.watching.filter.providers')!)).toEqual(['NETFLIX']);
  expect(writes.get('flk.tab.watching.sort')).toBe('custom');
});

it('empty and oversized existing Notes/Tags retain supported backup representation',()=>{const data=fixture();data.library[0].userNotes='';data.library[0].tags=[];expect(parseBackup(JSON.stringify(data)).library[0]).toMatchObject({userNotes:'',tags:[]});data.library[0].userNotes='x'.repeat(6000);data.library[0].tags=['Family','family','x'.repeat(60),...Array.from({length:26},(_,i)=>`tag${i}`)];expect(parseBackup(JSON.stringify(data)).library[0]).toMatchObject({userNotes:data.library[0].userNotes,tags:data.library[0].tags});});
