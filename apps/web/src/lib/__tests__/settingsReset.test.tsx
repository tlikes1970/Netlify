import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../auth.types";

const mocks = vi.hoisted(() => ({
  user: null as AuthUser | null,
  server: {} as Record<string, unknown>,
  authListeners: new Set<(user: AuthUser | null) => void>(),
  writes: vi.fn(),
  transaction: vi.fn(),
  reserve: vi.fn(),
  allowed: true,
}));
vi.mock("../auth", () => ({
  authManager: {
    getCurrentUser: () => mocks.user,
    getUserSettings: async () => mocks.server.settings,
    subscribe: (listener: (user: AuthUser | null) => void) => {
      mocks.authListeners.add(listener);
      return () => mocks.authListeners.delete(listener);
    },
  },
}));
vi.mock("../firebaseBootstrap", () => ({
  db: {},
  auth: { currentUser: null },
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...parts: string[]) => parts.join("/"),
  updateDoc: mocks.writes,
  runTransaction: mocks.transaction,
}));
vi.mock("../readOnlyGuard", () => ({ guardMutation: () => mocks.allowed }));
vi.mock("../flickletPersonality", () => ({
  clearFlickletPersonalitySession: vi.fn(),
  resolveFlickletLine: () => "",
  getFlickletMarqueeMessages: () => [],
}));
vi.mock("../../features/username/usernameFlow", () => ({
  ensureUsernameChosen: mocks.reserve,
}));
vi.mock("../../components/AccountButton", () => ({ default: () => null }));
vi.mock("../../components/SearchSuggestions", () => ({
  default: () => null,
  addSearchToHistory: vi.fn(),
}));
vi.mock("../../components/VoiceSearch", () => ({ default: () => null }));
vi.mock("../../pwa/useInstall", () => ({ useCanInstallPWA: () => false }));
vi.mock("../../pwa/installSignal", () => ({ promptInstall: vi.fn() }));
vi.mock("../language", async () => ({
  useTranslations: () => awaitTranslations.en,
  useLanguage: () => "en",
  changeLanguage: (language: string) =>
    localStorage.setItem("flicklet.language.v2", language),
}));
vi.mock("../capacitorEnv", () => ({
  isCapacitorAndroid: () => false,
  isCapacitorNative: () => false,
}));

import {
  mergeSettingsFromPayload,
  resetPreferences,
  SettingsManager,
  settingsManager,
} from "../settings";
import HomeGreeting from "../../components/HomeGreeting";
import FlickletHeader from "../../components/FlickletHeader";
import ResetSettingsButton from "../../components/ResetSettingsButton";
import awaitTranslations from "../translations";

const key = "flicklet.settings.v2";
function fixture() {
  const defaults = mergeSettingsFromPayload({});
  return {
    ...defaults,
    preferredName: "TJ",
    username: "public_handle",
    usernamePrompted: true,
    displayName: "Legacy Person",
    uid: "one",
    email: "person@example.com",
    access: { paid: true },
    unknownFutureField: { preserve: true },
    personality: "Surfer" as const,
    personalityLevel: 3 as const,
    notifications: {
      upcomingEpisodes: false,
      weeklyDiscover: false,
      monthlyStats: false,
      alertConfig: { leadTimeHours: 48, targetList: "watching" as const },
      unknownNotification: "keep",
    },
    layout: {
      ...defaults.layout,
      theme: "light" as const,
      condensedView: true,
      episodeTracking: true,
      discoveryLimit: 100 as const,
      homePageLists: ["custom-list"],
      forYouGenres: ["crime"],
      themePack: "legacy-pack",
      unknownLayout: 123,
    },
    pro: {
      isPro: true,
      features: {
        advancedNotifications: true,
        themePacks: true,
        socialFeatures: true,
        bloopersAccess: true,
        extrasAccess: true,
      },
      legacyReceipt: "keep",
    },
  };
}
function createLocal() {
  localStorage.setItem(key, JSON.stringify(fixture()));
  return new SettingsManager();
}
function applyFields(updates: Record<string, unknown>) {
  for (const [path, value] of Object.entries(updates)) {
    const segments = path.split(".");
    let object = mocks.server;
    for (const segment of segments.slice(0, -1)) {
      object[segment] ??= {};
      object = object[segment] as Record<string, unknown>;
    }
    object[segments[segments.length - 1]] = structuredClone(value);
  }
}
beforeEach(() => {
  localStorage.clear();
  mocks.user = null;
  mocks.allowed = true;
  mocks.writes
    .mockReset()
    .mockImplementation(async (_ref, updates) => applyFields(updates));
  mocks.reserve.mockClear();
  const settings = fixture();
  mocks.server = {
    uid: "one",
    profile: { displayName: "Provider Person" },
    trial: { startMs: 123 },
    library: {
      title: {
        status: "watching",
        episode: 4,
        rating: 5,
        notes: "keep",
        tags: ["family"],
      },
    },
    customLists: { family: ["title"] },
    settings: {
      ...structuredClone(settings),
      fullSettings: structuredClone(settings),
      serverOnly: "keep",
    },
  };
  mocks.transaction.mockReset().mockImplementation(async (_db, callback) =>
    callback({
      get: async () => ({
        exists: () => true,
        data: () => structuredClone(mocks.server),
      }),
      update: (ref: string, updates: Record<string, unknown>) => {
        mocks.writes(ref, updates);
      },
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("preference-only reset", () => {
  it("canceling the existing confirmation leaves settings and cloud untouched", async () => {
    settingsManager.updateSettings(fixture());
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ResetSettingsButton />);
    fireEvent.click(
      screen.getByRole("button", { name: "Reset Settings to Defaults" }),
    );
    expect(confirm).toHaveBeenCalledWith(
      awaitTranslations.en.confirmResetSettings,
    );
    expect(settingsManager.getSettings().layout.theme).toBe("light");
    expect(mocks.transaction).not.toHaveBeenCalled();
    // Cancel the queued sync from arranging this fixture.
    await settingsManager.resetToDefaults();
  });
  it("choosing Reset Settings confirms preference defaults and preserves access", async () => {
    settingsManager.updateSettings(fixture());
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ResetSettingsButton />);
    fireEvent.click(
      screen.getByRole("button", { name: "Reset Settings to Defaults" }),
    );
    await waitFor(() =>
      expect(settingsManager.getSettings().layout.theme).toBe("dark"),
    );
    expect(settingsManager.getSettings().pro.isPro).toBe(true);
  });
  it("cloud failure is visible in the reset UI and retry remains available", async () => {
    mocks.user = { uid: "one", displayName: null, email: null, photoURL: null };
    settingsManager.updateSettings(fixture());
    mocks.transaction.mockRejectedValueOnce(new Error("Offline"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ResetSettingsButton />);
    fireEvent.click(
      screen.getByRole("button", { name: "Reset Settings to Defaults" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be reset",
    );
    expect(settingsManager.getSettings().layout.theme).toBe("light");
    fireEvent.click(
      screen.getByRole("button", { name: "Reset Settings to Defaults" }),
    );
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    await waitFor(() =>
      expect(settingsManager.getSettings().layout.theme).toBe("dark"),
    );
  });
  it("resets one edited theme to its real default without contaminating defaults", async () => {
    const manager = new SettingsManager();
    manager.updateTheme("light");
    await manager.resetToDefaults();
    expect(manager.getSettings().layout.theme).toBe("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(mergeSettingsFromPayload({}).layout.theme).toBe("dark");
  });
  it("resets every allowlisted preference and preserves identity, access and unknown nested values", () => {
    const before = fixture();
    const result = resetPreferences(before);
    const defaults = mergeSettingsFromPayload({});
    expect(result.personality).toBe(defaults.personality);
    expect(result.personalityLevel).toBe(defaults.personalityLevel);
    for (const name of [
      "upcomingEpisodes",
      "weeklyDiscover",
      "monthlyStats",
    ] as const)
      expect(result.notifications[name]).toBe(defaults.notifications[name]);
    for (const name of [
      "theme",
      "condensedView",
      "homePageLists",
      "forYouGenres",
      "episodeTracking",
      "discoveryLimit",
    ] as const)
      expect(result.layout[name]).toEqual(defaults.layout[name]);
    for (const name of [
      "preferredName",
      "username",
      "usernamePrompted",
      "displayName",
      "uid",
      "email",
      "access",
      "pro",
      "unknownFutureField",
    ] as const)
      expect(result[name]).toEqual(before[name]);
    expect(result.notifications.alertConfig).toEqual(
      before.notifications.alertConfig,
    );
    expect(result.notifications.unknownNotification).toBe("keep");
    expect(result.layout.themePack).toBe("legacy-pack");
    expect(result.layout.unknownLayout).toBe(123);
    expect(before.layout.theme).toBe("light");
  });
  it("signed-out reset persists preferences and preserved values on reload without cloud or reservation calls", async () => {
    const manager = createLocal();
    localStorage.setItem("flicklet.language.v2", "es");
    await manager.resetToDefaults();
    expect(localStorage.getItem("flicklet.language.v2")).toBe("en");
    const reload = new SettingsManager().getSettings() as ReturnType<
      typeof fixture
    >;
    expect(reload.layout.theme).toBe("dark");
    expect(reload.layout.discoveryLimit).toBe(25);
    expect(reload.preferredName).toBe("TJ");
    expect(reload.username).toBe("public_handle");
    expect(reload.pro).toEqual(fixture().pro);
    expect(reload.unknownFutureField).toEqual({ preserve: true });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.writes).not.toHaveBeenCalled();
    expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it("preserves retired local fields omitted by the existing settings loader", async () => {
    localStorage.setItem(
      key,
      JSON.stringify({
        ...fixture(),
        community: { followedTopics: ["drama"] },
      }),
    );
    const manager = new SettingsManager();
    await manager.resetToDefaults();
    expect(JSON.parse(localStorage.getItem(key)!).community).toEqual({
      followedTopics: ["drama"],
    });
  });
  it("does not touch unrelated local library, lists, progress, ratings, notes, trial or sharing data", async () => {
    const unrelated = {
      "flicklet.library.v2": {
        title: {
          status: "watched",
          progress: 4,
          rating: 5,
          notes: "keep",
          tags: ["a"],
        },
      },
      "flicklet.customLists.v2": { list: ["title"] },
      "flicklet.trial.v1": { userId: "one", startMs: 123 },
      "flicklet.sharing": { shares: ["id"] },
      "flicklet.auth.status": "authenticated",
    };
    for (const [name, value] of Object.entries(unrelated))
      localStorage.setItem(name, JSON.stringify(value));
    const manager = createLocal();
    await manager.resetToDefaults();
    for (const [name, value] of Object.entries(unrelated))
      expect(localStorage.getItem(name)).toBe(JSON.stringify(value));
  });
  it("signed-in reset patches preferences in both cloud representations and preserves all other data", async () => {
    mocks.user = {
      uid: "one",
      displayName: "Provider Person",
      email: "person@example.com",
      photoURL: null,
    };
    const before = structuredClone(mocks.server);
    const manager = createLocal();
    await manager.resetToDefaults();
    expect(mocks.writes).toHaveBeenCalledTimes(1);
    const [ref, fields] = mocks.writes.mock.calls[0];
    expect(ref).toBe("users/one");
    expect(fields["settings.layout.theme"]).toBe("dark");
    expect(fields["settings.fullSettings.layout.theme"]).toBe("dark");
    expect(
      Object.keys(fields).some((path) =>
        /preferredName|username|pro\.|profile|billing|trial|library|customLists/.test(
          path,
        ),
      ),
    ).toBe(false);
    for (const name of ["uid", "profile", "trial", "library", "customLists"])
      expect(mocks.server[name]).toEqual(before[name]);
    const cloud = mocks.server.settings as ReturnType<typeof fixture> & {
      fullSettings: ReturnType<typeof fixture>;
      serverOnly: string;
    };
    expect(cloud.preferredName).toBe("TJ");
    expect(cloud.username).toBe("public_handle");
    expect(cloud.serverOnly).toBe("keep");
    expect(cloud.pro).toEqual(fixture().pro);
    expect(cloud.fullSettings.pro).toEqual(fixture().pro);
    const reload = new SettingsManager();
    await reload.loadSettingsFromFirebase("one");
    const reloaded = reload.getSettings() as ReturnType<typeof fixture>;
    expect(reloaded.layout.theme).toBe("dark");
    expect(reloaded.personalityLevel).toBe(2);
    expect(reloaded.preferredName).toBe("TJ");
    expect(reloaded.username).toBe("public_handle");
    expect(reloaded.pro).toEqual(fixture().pro);
    expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it("legacy cloud settings remain legacy and retain access through reload", async () => {
    mocks.user = { uid: "one", displayName: null, email: null, photoURL: null };
    delete (mocks.server.settings as Record<string, unknown>).fullSettings;
    const manager = createLocal();
    await manager.resetToDefaults();
    expect(mocks.server.settings).not.toHaveProperty("fullSettings");
    const reload = new SettingsManager();
    await reload.loadSettingsFromFirebase("one");
    expect(reload.getSettings().pro.isPro).toBe(true);
    expect(reload.getSettings().layout.theme).toBe("dark");
    expect(mocks.server.settings).toHaveProperty("preferredName", "TJ");
  });
  it("keeps the #4 greeting and does not reopen the preferred-name prompt after reset", async () => {
    mocks.user = {
      uid: "one",
      displayName: "Provider Person",
      email: "person@example.com",
      photoURL: null,
    };
    settingsManager.updateSettings(fixture());
    render(
      <>
        <FlickletHeader showGreeting={false} />
        <HomeGreeting />
      </>,
    );
    expect(await screen.findByTestId("home-greeting")).toHaveTextContent("TJ");
    await act(async () => settingsManager.resetToDefaults());
    expect(screen.getByTestId("home-greeting")).toHaveTextContent("TJ");
    expect(
      screen.queryByRole("dialog", { name: "What should we call you?" }),
    ).toBeNull();
  });
  it("failure leaves local preferences and all preserved values unchanged", async () => {
    mocks.user = { uid: "one", displayName: null, email: null, photoURL: null };
    mocks.transaction.mockRejectedValue(new Error("Offline"));
    const manager = createLocal();
    const before = localStorage.getItem(key);
    await expect(manager.resetToDefaults()).rejects.toThrow("Offline");
    expect(localStorage.getItem(key)).toBe(before);
    expect(manager.getSettings().pro.isPro).toBe(true);
  });
  it("read-only guard prevents in-memory reset as well as persistence", async () => {
    const manager = createLocal();
    mocks.allowed = false;
    await manager.resetToDefaults();
    expect(manager.getSettings().layout.theme).toBe("light");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("preserves a compatibility access change made while reset is pending", async () => {
    vi.useFakeTimers();
    mocks.user = { uid: "one", displayName: null, email: null, photoURL: null };
    const manager = createLocal();
    manager.updateProStatus(false);
    let release!: () => void;
    mocks.transaction.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const reset = manager.resetToDefaults();
    await Promise.resolve();
    manager.updateProStatus(true);
    release();
    await reset;
    expect(manager.getSettings().pro.isPro).toBe(true);
    expect(JSON.parse(localStorage.getItem(key)!).pro.isPro).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
  });
  it("does not reset a different account after the sign-in changes", async () => {
    mocks.user = { uid: "one", displayName: null, email: null, photoURL: null };
    const manager = createLocal();
    let release!: () => void;
    mocks.transaction.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const reset = manager.resetToDefaults();
    await Promise.resolve();
    mocks.user = { uid: "two", displayName: null, email: null, photoURL: null };
    release();
    await expect(reset).rejects.toThrow("account changed");
    expect(manager.getSettings().layout.theme).toBe("light");
  });
  it("waits for an older in-flight sync before writing reset preferences", async () => {
    vi.useFakeTimers();
    mocks.user = { uid: "one", displayName: null, email: null, photoURL: null };
    const manager = createLocal();
    let release!: () => void;
    mocks.writes.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    manager.updateTheme("light");
    await vi.advanceTimersByTimeAsync(1000);
    const reset = manager.resetToDefaults();
    await Promise.resolve();
    expect(mocks.transaction).not.toHaveBeenCalled();
    release();
    await reset;
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(manager.getSettings().layout.theme).toBe("dark");
  });
});
