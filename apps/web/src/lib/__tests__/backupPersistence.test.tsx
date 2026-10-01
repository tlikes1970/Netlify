import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  uid: "current" as string | null,
  server: {} as any,
  entries: [] as any[],
  calls: [] as any[],
  commitError: null as Error | null,
  commits: 0,
  documents: 1,
  cancel: vi.fn(async () => undefined),
  reserve: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(async () => undefined),
}));
vi.mock("../auth", () => ({
  authManager: {
    getCurrentUser: () =>
      mocks.uid
        ? {
            uid: mocks.uid,
            displayName: "Google Person",
            email: "private@example.com",
          }
        : null,
    getUserSettings: async () => mocks.server.settings,
    subscribe: () => () => undefined,
  },
}));
vi.mock("../firebaseBootstrap", () => ({
  db: {},
  auth: { currentUser: null },
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...p: string[]) => p.join("/"),
  collection: (_db: unknown, ...p: string[]) => p.join("/"),
  getDocFromServer: async () => ({
    exists: () => true,
    data: () => mocks.server,
  }),
  getDocs: async () => ({
    empty: false,
    forEach: (fn: (d: unknown) => void) =>
      fn({
        id: "10",
        data: () => ({
          showId: 10,
          episodes: { S1E1: true },
          totalEpisodes: 2,
        }),
      }),
  }),
  getDocsFromServer: async (path: string) => ({
    forEach: (fn: (d: any) => void) =>
      Array.from({ length: mocks.documents }, (_, i) =>
        fn({ ref: `${path}/${i === 0 ? "old" : i}`, id: String(i) }),
      ),
  }),
  serverTimestamp: () => "server-time",
  deleteField: () => "DELETE",
  updateDoc: mocks.updateDoc,
  setDoc: mocks.setDoc,
  runTransaction: vi.fn(),
  writeBatch: () => ({
    update: (path: string, v: any) => mocks.calls.push(["update", path, v]),
    set: (path: string, v: any) => mocks.calls.push(["set", path, v]),
    delete: (path: string) => mocks.calls.push(["delete", path]),
    commit: async () => {
      mocks.commits++;
      if (mocks.commitError) throw mocks.commitError;
      for (const [op, , payload] of mocks.calls)
        if (op === "update")
          for (const [path, value] of Object.entries(payload)) {
            const parts = path.split(".");
            let target = mocks.server;
            for (const p of parts.slice(0, -1))
              target = target[p] ?? (target[p] = {});
            if (value === "DELETE") delete target[parts.at(-1)!];
            else target[parts.at(-1)!] = value;
          }
    },
  }),
}));
vi.mock("../storage", () => ({
  Library: {
    getAll: () => mocks.entries,
    reloadFromStorage: vi.fn(),
    notifyUpdate: vi.fn(),
  },
  flushPendingSaves: vi.fn(),
}));
vi.mock("../settings", () => ({
  settingsManager: {
    getSettings: () => defaults,
    prepareRestore: async () => undefined,
    reloadAfterRestore: vi.fn(),
  },
  useSettings: () => defaults,
  mergeSettingsFromPayload: (s: any) => ({
    ...defaults,
    ...s,
    notifications: { ...defaults.notifications, ...s.notifications },
    layout: { ...defaults.layout, ...s.layout },
  }),
}));
vi.mock("../seriesReminders", () => ({ disableSeriesReminder: mocks.cancel }));
vi.mock("../notifications", () => ({
  notificationManager: { reloadAfterRestore: vi.fn() },
}));
vi.mock("../language", () => ({ changeLanguage: vi.fn() }));
vi.mock("../forYouRowsStorage", () => ({
  normalizeRows: (v: unknown) => (Array.isArray(v) ? v : null),
}));
vi.mock("../../features/username/usernameFlow", () => ({
  ensureUsernameChosen: mocks.reserve,
}));
import { createBackup, restoreBackup } from "../backupPersistence";
import { type Backup } from "../backup";
import { FirebaseSyncManager } from "../firebaseSync";
import { loadEpisodeProgressFromFirebase } from "../episodeProgressSync";
import HomeGreeting from "../../components/HomeGreeting";
import { preferredNameStore } from "../preferredName";
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
  pro: { isPro: true, features: { extrasAccess: true } },
};
const fixture = (): Backup => ({
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
      userNotes: "Keep notes",
      tags: ["family"],
      customListIds: ["family"],
      isFavorite: true,
    },
  ],
  customLists: [{ id: "family", name: "Family", createdAt: 123, itemCount: 1 }],
  settings: structuredClone(defaults),
  preferredName: "TJ",
  local: {
    "episode-progress-10": {
      episodes: { S1E1: true },
      totalEpisodes: 2,
      seasons: [{ seasonNumber: 1, episodeNumbers: [1, 2] }],
    },
    "flk.tab.watching.sort": "alphabetical-az",
    "notification-settings": {
      globalEnabled: false,
      freeTierTiming: "24-hours-before",
      proTierTiming: 2,
      methods: { inApp: true, push: false, email: false },
      showOverrides: {},
    },
  },
});
const snapshot = () =>
  Object.fromEntries(
    Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)]),
  );
beforeEach(() => {
  localStorage.clear();
  mocks.uid = "current";
  mocks.calls = [];
  mocks.commits = 0;
  mocks.documents = 1;
  mocks.cancel.mockClear();
  mocks.commitError = null;
  mocks.entries = fixture().library;
  mocks.server = {
    uid: "current",
    email: "owner@example.com",
    profile: { displayName: "Auth identity" },
    settings: {
      preferredName: "Original",
      username: "reserved_handle",
      usernamePrompted: true,
      pro: { isPro: true },
      fullSettings: structuredClone(defaults),
    },
  };
  localStorage.setItem(
    "flicklet.settings.v2",
    JSON.stringify({
      ...defaults,
      preferredName: "Original",
      username: "reserved_handle",
    }),
  );
  localStorage.setItem(
    "flicklet.library.v2",
    '{"movie:99":{"title":"Original"}}',
  );
  localStorage.setItem(
    "flicklet.customLists.v2",
    JSON.stringify({ customLists: fixture().customLists, maxLists: 3 }),
  );
  mocks.reserve.mockClear();
  mocks.updateDoc.mockClear();
});
afterEach(() => cleanup());
describe("current backup creation", () => {
  it("exports live library/current preferences and the authoritative cloud preferred name", async () => {
    localStorage.setItem(
      "flicklet-settings",
      '{"displayName":"Wrong","pro":{"isPro":true}}',
    );
    localStorage.setItem("flicklet-user", '{"token":"credential"}');
    const before = snapshot();
    const b = await createBackup();
    expect(b.library).toEqual(fixture().library);
    expect(b.settings.layout).toEqual(defaults.layout);
    expect(b.customLists[0]).toMatchObject({ id: "family", itemCount: 1 });
    expect(b.preferredName).toBe("Original");
    expect(b.schemaVersion).toBe(1);
    expect(JSON.stringify(b)).not.toMatch(
      /credential|reserved_handle|private@example|Google Person|isPro/,
    );
    expect(snapshot()).toEqual(before);
  });
  it("exports progress using its current key and retains seasons", async () => {
    localStorage.setItem(
      "episode-progress-10",
      JSON.stringify(fixture().local["episode-progress-10"]),
    );
    expect((await createBackup()).local["episode-progress-10"]).toEqual(
      fixture().local["episode-progress-10"],
    );
  });
  it("does not include billing/trial data or tokens", async () => {
    localStorage.setItem("flicklet.trial.v1", '{"endsAt":"2099"}');
    localStorage.setItem("auth-token", "secret");
    mocks.server.billing = { paid: true };
    mocks.server.settings.pro = { isPro: true };
    const json = JSON.stringify(await createBackup());
    expect(json).not.toMatch(/2099|secret|billing|isPro|paid/);
  });
  it("supports signed-out local data without creating cloud sync", async () => {
    mocks.uid = null;
    expect((await createBackup()).preferredName).toBe("Original");
    await restoreBackup(fixture());
    expect(mocks.commits).toBe(0);
    expect(
      JSON.parse(localStorage.getItem("flicklet.library.v2")!)["tv:10"].title,
    ).toBe("Show");
  });
});
describe("atomic authenticated replacement", () => {
  it("persists library, lists, progress and preferences in one batch using existing paths", async () => {
    await restoreBackup(fixture());
    expect(mocks.commits).toBe(1);
    expect(mocks.calls).toEqual(
      expect.arrayContaining([
        ["delete", "users/current/episodeProgress/old"],
        ["delete", "users/current/tabState/old"],
      ]),
    );
    const progress = mocks.calls.find(
      (c) => c[1] === "users/current/episodeProgress/10",
    )[2];
    expect(progress.seasons).toEqual([
      { seasonNumber: 1, episodeNumbers: [1, 2] },
    ]);
    expect(
      mocks.calls.find((c) => c[1] === "users/current/tabState/watching")[2]
        .sort,
    ).toBe("alphabetical-az");
    expect(
      mocks.calls.find(
        (c) => c[1] === "users/current/notificationSettings/main",
      )[2].globalEnabled,
    ).toBe(false);
    expect(mocks.server.watchlists.tv.watching[0]).toMatchObject({
      user_rating: 0,
      user_notes: "Keep notes",
      user_tags: ["family"],
      custom_list_ids: ["family"],
      is_favorite: true,
      rating_updated_at: 234,
    });
    expect(mocks.server.watchlists.customLists[0].id).toBe("family");
    expect(mocks.server.settings.fullSettings.preferredName).toBe("TJ");
  });
  it("preserves signed-in authentication, handle, legacy pro and account metadata", async () => {
    const b: any = fixture();
    b.uid = "foreign";
    b.settings.username = "stolen";
    b.settings.pro = { isPro: false };
    b.settings.preferredName = "Fake";
    await restoreBackup(b);
    expect(mocks.uid).toBe("current");
    expect(mocks.server).toMatchObject({
      uid: "current",
      email: "owner@example.com",
      profile: { displayName: "Auth identity" },
      settings: {
        username: "reserved_handle",
        pro: { isPro: true },
        preferredName: "TJ",
      },
    });
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(mocks.updateDoc).not.toHaveBeenCalled();
    expect(mocks.calls.every((c) => c[1].startsWith("users/current"))).toBe(
      true,
    );
    expect(
      mocks.calls.some((c) => /billing|entitlements|usernames/.test(c[1])),
    ).toBe(false);
  });
  it("rolls back locally when cloud commit fails and leaves server intact", async () => {
    const before = snapshot();
    const server = structuredClone(mocks.server);
    mocks.commitError = new Error("permission-denied");
    await expect(restoreBackup(fixture())).rejects.toThrow("permission-denied");
    expect(snapshot()).toEqual(before);
    expect(mocks.server).toEqual(server);
  });
  it("rejects invalid input without staging writes or creating a batch", async () => {
    const before = snapshot();
    await expect(
      restoreBackup({ ...fixture(), library: {} as any }),
    ).rejects.toThrow();
    expect(snapshot()).toEqual(before);
    expect(mocks.calls).toEqual([]);
  });
  it("feeds the restored authoritative preferred name into the existing Home greeting", async () => {
    await restoreBackup(fixture());
    render(<HomeGreeting />);
    expect(await screen.findByText(/TJ/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Google Person|owner@example/),
    ).not.toBeInTheDocument();
    expect(preferredNameStore.getSnapshot().preferredName).toBe("TJ");
  });
  it("creates a complete settings mirror for legacy accounts while retaining their pro state", async () => {
    delete mocks.server.settings.fullSettings;
    await restoreBackup(fixture());
    expect(mocks.server.settings.fullSettings).toMatchObject({
      personality: "Zen",
      pro: { isPro: true },
      preferredName: "TJ",
    });
  });
  it("an empty replacement prevents the legacy library loader from resurrecting old content", async () => {
    localStorage.setItem("flicklet:v2:saved", '{"old":true}');
    const b = fixture();
    b.library = [];
    await restoreBackup(b);
    expect(localStorage.getItem("flicklet.library.v2")).toBe("{}");
    expect(localStorage.getItem("flicklet:v2:saved")).toBeNull();
    expect(mocks.server.watchlists.tv.watching).toEqual([]);
  });
});
describe("restore limits and device data", () => {
  it("rejects an oversized atomic batch before local mutation", async () => {
    mocks.documents = 230;
    const before = snapshot();
    await expect(restoreBackup(fixture())).rejects.toThrow(
      "atomic cloud restore limit",
    );
    expect(snapshot()).toEqual(before);
    expect(mocks.commits).toBe(0);
  });
  it("cancels removed reminder schedules through the existing API", async () => {
    localStorage.setItem(
      "flicklet.series-reminders.v1",
      JSON.stringify({
        10: { showId: 10, title: "Show", enabled: true, updatedAt: 1 },
      }),
    );
    await restoreBackup(fixture());
    expect(mocks.cancel).toHaveBeenCalledWith(10);
  });
  it("reports reminder-runtime failure as a warning after a successful data restore", async () => {
    localStorage.setItem(
      "flicklet.series-reminders.v1",
      JSON.stringify({
        10: { showId: 10, title: "Show", enabled: true, updatedAt: 1 },
      }),
    );
    mocks.cancel.mockRejectedValueOnce(new Error("device failure"));
    expect(await restoreBackup(fixture())).toMatch(/data was restored/);
    expect(mocks.server.settings.preferredName).toBe("TJ");
  });
});
describe("normal cloud library format", () => {
  it("retains restored local season summaries when loading older cloud progress", async () => {
    const seasons = [{ seasonNumber: 1, episodeNumbers: [1, 2] }];
    localStorage.setItem(
      "episode-progress-10",
      JSON.stringify({ episodes: { S1E2: true }, seasons }),
    );
    await loadEpisodeProgressFromFirebase("current");
    const progress = JSON.parse(localStorage.getItem("episode-progress-10")!);
    expect(progress.seasons).toEqual(seasons);
    expect(progress.episodes).toEqual({ S1E1: true, S1E2: true });
  });
  it("loads the expanded cloud format on a fresh device without losing user data", async () => {
    const b = fixture();
    b.library[0].list = "not";
    const manager = new FirebaseSyncManager();
    const w = manager.createLeanWatchlists(
      Object.fromEntries(b.library.map((i) => [`tv:${i.id}`, i])),
      b.customLists,
    );
    localStorage.setItem("flicklet.library.v2", "{}");
    await (manager as any).mergeCloudData(w);
    const item = JSON.parse(localStorage.getItem("flicklet.library.v2")!)[
      "tv:10"
    ];
    expect(item).toMatchObject({
      list: "not",
      userRating: 0,
      isFavorite: true,
      ratingUpdatedAt: 234,
      userNotes: "Keep notes",
      tags: ["family"],
      customListIds: ["family"],
      addedAt: 123,
    });
  });
  it("serializes the Not Interested list and all additional user fields after restore", () => {
    const b = fixture();
    b.library[0].list = "not";
    const w = new FirebaseSyncManager().createLeanWatchlists(
      Object.fromEntries(b.library.map((i) => [`tv:${i.id}`, i])),
      b.customLists,
    );
    expect(w.tv.not).toHaveLength(1);
    expect(w.customItems.family[0].is_favorite).toBe(true);
    expect(w.tv.not[0].rating_updated_at).toBe(234);
  });
});
