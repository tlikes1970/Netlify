import { beforeEach, afterEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  write: vi.fn(),
  user: null as { uid: string } | null,
  allowed: true,
  cloud: {} as Record<string, unknown>,
}));
vi.mock("../auth", () => ({
  authManager: {
    getCurrentUser: () => m.user,
    getUserSettings: async () => m.cloud,
  },
}));
vi.mock("../firebaseBootstrap", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...parts: string[]) => parts.join("/"),
  updateDoc: m.write,
  runTransaction: vi.fn(),
}));
vi.mock("../readOnlyGuard", () => ({ guardMutation: () => m.allowed }));
import { SettingsManager } from "../settings";
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorage.clear();
  m.user = null;
  m.allowed = true;
  m.cloud = {};
  m.write.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("blocked personality selection changes neither manager nor storage nor subscribers", () => {
  const manager = new SettingsManager(),
    listener = vi.fn();
  manager.subscribe(listener);
  m.allowed = false;
  manager.updatePersonalityLevel(3);
  expect(manager.getSettings().personalityLevel).toBe(2);
  expect(localStorage.getItem("flicklet.settings.v2")).toBeNull();
  expect(listener).not.toHaveBeenCalled();
  expect(m.write).not.toHaveBeenCalled();
});
it.each(["signed out", "trial", "Full Access"])(
  "%s allowed selection persists and survives restart",
  (phase) => {
    m.user = phase === "signed out" ? null : { uid: "owner" };
    const manager = new SettingsManager(),
      listener = vi.fn();
    manager.subscribe(listener);
    manager.updatePersonalityLevel(1);
    expect(listener).toHaveBeenCalledOnce();
    expect(
      JSON.parse(localStorage.getItem("flicklet.settings.v2")!)
        .personalityLevel,
    ).toBe(1);
    expect(new SettingsManager().getSettings()).toMatchObject({
      personalityLevel: 1,
      personality: "Zen",
    });
  },
);
it("rapid changes debounce into one latest snapshot with existing cloud ownership", async () => {
  m.user = { uid: "owner" };
  const manager = new SettingsManager();
  manager.updatePersonalityLevel(1);
  manager.updatePersonalityLevel(3);
  manager.updatePersonalityLevel(2);
  await vi.advanceTimersByTimeAsync(1000);
  expect(m.write).toHaveBeenCalledOnce();
  const [path, fields] = m.write.mock.calls[0];
  expect(path).toBe("users/owner");
  expect(fields["settings.personalityLevel"]).toBe(2);
  expect(fields["settings.fullSettings"].personality).toBe("Zen");
  expect(Object.keys(fields).every((key) => key.startsWith("settings."))).toBe(
    true,
  );
  expect(fields).not.toHaveProperty("settings");
});
it("active settings write retains an immutable first snapshot and coalesces the newest shared settings", async () => {
  m.user = { uid: "owner" };
  const first = deferred();
  m.write.mockReturnValueOnce(first.promise);
  const manager = new SettingsManager();
  manager.updatePersonalityLevel(1);
  await vi.advanceTimersByTimeAsync(1000);
  manager.updatePersonalityLevel(2);
  manager.updateTheme("light");
  manager.updatePersonalityLevel(3);
  await vi.advanceTimersByTimeAsync(2000);
  expect(m.write).toHaveBeenCalledOnce();
  expect(m.write.mock.calls[0][1]["settings.fullSettings"]).toMatchObject({
    personalityLevel: 1,
    layout: { theme: "dark" },
  });
  first.resolve();
  await vi.advanceTimersByTimeAsync(0);
  expect(m.write).toHaveBeenCalledTimes(2);
  expect(m.write.mock.calls[1][1]["settings.fullSettings"]).toMatchObject({
    personalityLevel: 3,
    layout: { theme: "light" },
  });
});
it("failed active write still sends the latest pending snapshot and preserves local data", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  m.user = { uid: "owner" };
  const first = deferred();
  m.write.mockReturnValueOnce(first.promise);
  const manager = new SettingsManager();
  manager.updatePersonalityLevel(1);
  await vi.advanceTimersByTimeAsync(1000);
  manager.updatePersonalityLevel(3);
  first.reject(new Error("offline"));
  await vi.advanceTimersByTimeAsync(0);
  expect(m.write).toHaveBeenCalledTimes(2);
  expect(m.write.mock.calls[1][1]["settings.personalityLevel"]).toBe(3);
  expect(
    JSON.parse(localStorage.getItem("flicklet.settings.v2")!).personalityLevel,
  ).toBe(3);
});
it("replacement preparation drops stale queued settings while awaiting the active write", async () => {
  m.user = { uid: "owner" };
  const first = deferred();
  m.write.mockReturnValueOnce(first.promise);
  const manager = new SettingsManager();
  manager.updatePersonalityLevel(1);
  await vi.advanceTimersByTimeAsync(1000);
  manager.updatePersonalityLevel(3);
  const ready = manager.prepareRestore();
  first.resolve();
  await ready;
  await vi.advanceTimersByTimeAsync(2000);
  expect(m.write).toHaveBeenCalledOnce();
});
it("cloud loading restores both current and legacy preferences", async () => {
  m.cloud = { fullSettings: { personalityLevel: 3, personality: "Surfer" } };
  const manager = new SettingsManager();
  await manager.loadSettingsFromFirebase("owner");
  expect(manager.getSettings()).toMatchObject({
    personalityLevel: 3,
    personality: "Surfer",
  });
  expect(new SettingsManager().getSettings().personalityLevel).toBe(3);
});

it.each([
  ["theme", (manager: SettingsManager) => manager.updateTheme("light")],
  [
    "settings",
    (manager: SettingsManager) =>
      manager.updateSettings({ displayName: "Changed" }),
  ],
  [
    "display name",
    (manager: SettingsManager) => manager.updateDisplayName("Changed"),
  ],
  [
    "legacy personality",
    (manager: SettingsManager) => manager.updatePersonality("Surfer"),
  ],
  [
    "episode tracking",
    (manager: SettingsManager) => manager.toggleEpisodeTracking(),
  ],
  [
    "Discovery limit",
    (manager: SettingsManager) => manager.updateDiscoveryLimit(100),
  ],
  [
    "legacy Pro mirror",
    (manager: SettingsManager) => manager.updateProStatus(true),
  ],
] as const)(
  "expired %s changes neither memory, appearance nor persistence",
  (_name, update) => {
    const manager = new SettingsManager();
    const before = structuredClone(manager.getSettings());
    const theme = document.documentElement.getAttribute("data-theme");
    const listener = vi.fn();
    manager.subscribe(listener);
    m.allowed = false;
    update(manager);
    expect(manager.getSettings()).toEqual(before);
    expect(document.documentElement.getAttribute("data-theme")).toBe(theme);
    expect(listener).not.toHaveBeenCalled();
    expect(localStorage.getItem("flicklet.settings.v2")).toBeNull();
  },
);
