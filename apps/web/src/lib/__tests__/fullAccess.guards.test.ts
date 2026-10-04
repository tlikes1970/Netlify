import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  allowed: true,
  schedule: vi.fn(),
  cancel: vi.fn(),
  pending: vi.fn(),
  write: vi.fn(),
}));
vi.mock("../readOnlyGuard", () => ({
  guardMutation: () => m.allowed,
  isMutationBlocked: () => !m.allowed,
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => "android" },
}));
vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    schedule: m.schedule,
    cancel: m.cancel,
    getPending: m.pending,
    checkPermissions: async () => ({ display: "granted" }),
    createChannel: async () => {},
  },
}));
vi.mock("../storage", () => ({
  Library: { getCurrentList: () => "watching" },
}));
vi.mock("@/tmdb/tv", () => ({ fetchRelevantSeasonEpisodes: async () => [] }));
vi.mock("../firebaseBootstrap", () => ({ db: {} }));
vi.mock("../auth", () => ({
  authManager: { getCurrentUser: () => ({ uid: "owner" }) },
}));
vi.mock("firebase/firestore", () => ({
  doc: () => ({}),
  setDoc: m.write,
  collection: () => ({}),
  getDocs: vi.fn(),
}));
import {
  enableSeriesReminder,
  disableSeriesReminder,
  setSeriesReminderState,
  reconcileSeriesReminders,
} from "../seriesReminders";
import {
  writeStoredEpisodeProgress,
  cleanupInvalidEpisodeKeys,
} from "../../utils/episodeProgress";
import { syncEpisodeProgressToFirebase } from "../episodeProgressSync";
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  m.allowed = true;
  m.pending.mockResolvedValue({ notifications: [] });
});
it("expired progress cannot persist or emit success", () => {
  m.allowed = false;
  const event = vi.fn();
  window.addEventListener("episode-progress:updated", event);
  expect(writeStoredEpisodeProgress(1, { episodes: { S1E1: true } })).toBe(
    false,
  );
  expect(localStorage.getItem("episode-progress-1")).toBeNull();
  expect(event).not.toHaveBeenCalled();
  window.removeEventListener("episode-progress:updated", event);
});
it("allowed progress still persists", () => {
  expect(writeStoredEpisodeProgress(1, { episodes: { S1E1: true } })).toBe(
    true,
  );
  expect(localStorage.getItem("episode-progress-1")).toContain("true");
});
it("expired progress cleanup does not remove saved data", () => {
  localStorage.setItem("episode-progress-1", '{"episodes":{"S1E1":true}}');
  m.allowed = false;
  cleanupInvalidEpisodeKeys(1, []);
  expect(localStorage.getItem("episode-progress-1")).toContain("true");
});
it("expired progress cannot write cloud", async () => {
  localStorage.setItem("episode-progress-1", '{"episodes":{"S1E1":true}}');
  m.allowed = false;
  await syncEpisodeProgressToFirebase(1);
  expect(m.write).not.toHaveBeenCalled();
});
it("expired reminder enabling cannot schedule or persist", async () => {
  m.allowed = false;
  expect((await enableSeriesReminder(1, "Show")).enabled).toBe(false);
  expect(m.schedule).not.toHaveBeenCalled();
  expect(localStorage.getItem("flicklet.series-reminders.v1")).toBeNull();
});
it("expired reminder disabling does not cancel or change state", async () => {
  setSeriesReminderState(1, "Show", true);
  const before = localStorage.getItem("flicklet.series-reminders.v1");
  m.allowed = false;
  await disableSeriesReminder(1);
  expect(m.cancel).not.toHaveBeenCalled();
  expect(localStorage.getItem("flicklet.series-reminders.v1")).toBe(before);
});
it("expired direct reminder preferences are guarded", () => {
  m.allowed = false;
  setSeriesReminderState(1, "Show", true);
  expect(localStorage.getItem("flicklet.series-reminders.v1")).toBeNull();
});
it("expired background reconciliation does not schedule", async () => {
  setSeriesReminderState(1, "Show", true);
  m.allowed = false;
  await reconcileSeriesReminders({ force: true });
  expect(m.schedule).not.toHaveBeenCalled();
  expect(m.pending).not.toHaveBeenCalled();
});
