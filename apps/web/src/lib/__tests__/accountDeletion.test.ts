import { beforeEach, afterEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: { currentUser: { uid: "owner" } as { uid: string } | null },
  call: vi.fn(),
  signout: vi.fn(),
  cancel: vi.fn(),
  recover: vi.fn(),
  release: vi.fn(),
  prepare: vi.fn(),
  clear: vi.fn(),
  reload: vi.fn(),
  barrier: false,
  restore: false,
}));
vi.mock("firebase/functions", () => ({ httpsCallable: () => m.call }));
vi.mock("firebase/auth", () => ({ signOut: m.signout }));
vi.mock("../firebaseBootstrap", () => ({ auth: m.auth, functions: {} }));
vi.mock("../restoreBarrier", () => ({
  beginRestore: async () => {
    if (m.barrier) throw Error("busy");
    m.barrier = true;
    return m.release;
  },
}));
vi.mock("../restoreRecovery", () => ({ hasPendingRestore: () => m.restore }));
vi.mock("../settings", () => ({
  DEFAULT_SETTINGS: {
    personalityLevel: 2,
    layout: { theme: "light" },
    pro: { isPro: false },
  },
  settingsManager: {
    getSettings: () => ({ layout: { theme: "dark" } }),
    prepareRestore: m.prepare,
    reloadAfterRestore: m.reload,
  },
}));
vi.mock("../language", () => ({
  languageManager: { getLanguage: () => "es" },
}));
vi.mock("../firebaseSync", () => ({
  firebaseSyncManager: { prepareRestore: m.prepare },
}));
vi.mock("../notifications", () => ({
  notificationManager: {
    prepareReplacement: m.prepare,
    reloadAfterRestore: m.reload,
  },
}));
vi.mock("../seriesReminders", () => ({
  cancelSeriesReminderSchedules: m.cancel,
}));
vi.mock("../startOver", () => ({
  isStartOverContentKey: (key: string, uid: string) =>
    [
      "episode-progress-1",
      "notification-settings",
      "flicklet.series-reminders.v1",
      `flicklet:forYouRows:v2:${uid}`,
      "flk.tab.watching.order.custom",
    ].includes(key),
}));
vi.mock("../storage", () => ({ Library: { reloadFromStorage: m.reload } }));
vi.mock("../proStatus", () => ({ clearBillingCache: m.clear }));
vi.mock("../entitlements", () => ({
  setEntitlementsCache: m.clear,
  resolveEntitlements: () => ({ isPro: false }),
}));
vi.mock("../preferredName", () => ({
  preferredNameStore: { resetAfterStartOver: m.clear },
}));
vi.mock("../query", () => ({ queryClient: { clear: m.clear } }));
vi.mock("../authLog", () => ({
  authLogManager: { resetAfterAccountDeletion: m.clear },
}));
vi.mock("../capacitorEnv", () => ({ isCapacitorNative: () => false }));
import {
  deleteCurrentAccount,
  finishDeletedAccountLocally,
  isDeletedAccountLocalKey,
} from "../accountDeletion";
import {
  ACCOUNT_DELETION_KEY,
  pendingAccountDeletion,
  recordAccountDeletion,
} from "../accountDeletionState";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  m.auth.currentUser = { uid: "owner" };
  m.barrier = false;
  m.restore = false;
  m.call.mockResolvedValue({ data: { deleted: true } });
  m.cancel.mockResolvedValue(m.recover);
  m.prepare.mockResolvedValue(undefined);
  m.release.mockImplementation(() => {
    m.barrier = false;
  });
  m.signout.mockImplementation(async () => {
    m.auth.currentUser = null;
  });
});
afterEach(() => vi.restoreAllMocks());
it("sends confirmation only, then cancels schedules, clears caches and signs out", async () => {
  localStorage.setItem("flicklet.library.v2", "personal");
  await deleteCurrentAccount();
  expect(m.call).toHaveBeenCalledWith({ confirmation: "DELETE" });
  expect(m.cancel).toHaveBeenCalled();
  expect(m.clear).toHaveBeenCalled();
  expect(m.signout).toHaveBeenCalledOnce();
  expect(localStorage.getItem("flicklet.library.v2")).toBeNull();
  expect(pendingAccountDeletion()).toBeNull();
  expect(m.barrier).toBe(true);
});
it("does not allow signed-out deletion", async () => {
  m.auth.currentUser = null;
  await expect(deleteCurrentAccount()).rejects.toMatchObject({
    code: "authentication-required",
  });
  expect(m.call).not.toHaveBeenCalled();
});
it("does not compete with pending backup recovery", async () => {
  m.restore = true;
  await expect(deleteCurrentAccount()).rejects.toMatchObject({
    code: "recovery-pending",
  });
  expect(m.call).not.toHaveBeenCalled();
});
it("server failure retains journal and never clears content or signs out", async () => {
  localStorage.setItem("flicklet.library.v2", "personal");
  m.call.mockRejectedValue(Error("offline"));
  await expect(deleteCurrentAccount()).rejects.toThrow("offline");
  expect(pendingAccountDeletion()).toEqual({ uid: "owner", confirmed: false });
  expect(localStorage.getItem("flicklet.library.v2")).toBe("personal");
  expect(m.signout).not.toHaveBeenCalled();
});
it("recent-auth rejection releases recovery and restores cancelled reminders", async () => {
  m.call.mockRejectedValue({ code: "functions/failed-precondition" });
  await expect(deleteCurrentAccount()).rejects.toMatchObject({
    code: "functions/failed-precondition",
  });
  expect(pendingAccountDeletion()).toBeNull();
  expect(m.recover).toHaveBeenCalledOnce();
  expect(m.barrier).toBe(false);
});
it("false deletion response is not successful", async () => {
  m.call.mockResolvedValue({ data: { deleted: false } });
  await expect(deleteCurrentAccount()).rejects.toMatchObject({
    code: "account-deletion-incomplete",
  });
  expect(m.signout).not.toHaveBeenCalled();
});
it("native cancellation failure stops before destructive server call", async () => {
  m.cancel.mockRejectedValue(Error("native"));
  await expect(deleteCurrentAccount()).rejects.toThrow("native");
  expect(m.call).not.toHaveBeenCalled();
});
it("account changed before request cannot delete wrong account", async () => {
  m.prepare.mockImplementation(async () => {
    m.auth.currentUser = { uid: "other" };
  });
  await expect(deleteCurrentAccount()).rejects.toMatchObject({
    code: "account-changed",
  });
  expect(m.call).not.toHaveBeenCalled();
});
it("account changed during deletion cannot clear another account device data", async () => {
  localStorage.setItem("flicklet.library.v2", "other account");
  m.call.mockImplementation(async () => {
    m.auth.currentUser = { uid: "other" };
    return { data: { deleted: true } };
  });
  await expect(deleteCurrentAccount()).rejects.toMatchObject({
    code: "account-changed",
  });
  expect(localStorage.getItem("flicklet.library.v2")).toBe("other account");
  expect(m.signout).not.toHaveBeenCalled();
  expect(pendingAccountDeletion()?.confirmed).toBe(true);
});
it("retries confirmed local cleanup without another server deletion", async () => {
  recordAccountDeletion("owner", true);
  await deleteCurrentAccount();
  expect(m.call).not.toHaveBeenCalled();
  expect(m.signout).toHaveBeenCalledOnce();
});
it("local cleanup failure is recoverable after confirmed server deletion", async () => {
  m.signout.mockRejectedValue(Error("storage"));
  await expect(deleteCurrentAccount()).rejects.toThrow("storage");
  expect(pendingAccountDeletion()).toEqual({ uid: "owner", confirmed: true });
});
it("coalesces double clicks into one deletion request", async () => {
  const first = deleteCurrentAccount();
  expect(deleteCurrentAccount()).toBe(first);
  await first;
  expect(m.call).toHaveBeenCalledOnce();
});
it("preserves device language/theme and shared caches but clears profile and legacy access", async () => {
  for (const key of [
    "flicklet.library.v2",
    "episode-progress-1",
    "notification-settings",
    "flicklet.series-reminders.v1",
    "flicklet.auth.logs",
    "flicklet.auth.traceId",
    "flicklet:forYouRows:v2:owner",
  ])
    localStorage.setItem(key, "personal");
  localStorage.setItem("tmdb:shared", "catalog");
  localStorage.setItem("flicklet:forYouRows:v2:other", "other");
  await finishDeletedAccountLocally("owner");
  expect(localStorage.getItem("tmdb:shared")).toBe("catalog");
  expect(localStorage.getItem("flicklet:forYouRows:v2:other")).toBe("other");
  expect(localStorage.getItem("episode-progress-1")).toBeNull();
  expect(localStorage.getItem("flicklet.auth.logs")).toBeNull();
  expect(localStorage.getItem("flicklet.language.v2")).toBe("es");
  expect(JSON.parse(localStorage.getItem("flicklet.settings.v2")!)).toEqual({
    personalityLevel: 2,
    layout: { theme: "dark" },
    pro: { isPro: false },
  });
});
it("local cleanup refuses another signed-in UID", async () => {
  m.auth.currentUser = { uid: "other" };
  await expect(finishDeletedAccountLocally("owner")).rejects.toMatchObject({
    code: "account-changed",
  });
  expect(m.cancel).not.toHaveBeenCalled();
});
it("journal tolerates malformed legacy storage without claiming completion", () => {
  localStorage.setItem(ACCOUNT_DELETION_KEY, "broken");
  expect(pendingAccountDeletion()).toBeNull();
  localStorage.setItem(ACCOUNT_DELETION_KEY, '{"uid":"owner"}');
  expect(pendingAccountDeletion()).toBeNull();
});
it("account key allowlist excludes shared metadata and other UID content", () => {
  expect(isDeletedAccountLocalKey("tmdb-cache:es:1", "owner")).toBe(false);
  expect(
    isDeletedAccountLocalKey("flicklet:forYouRows:v2:other", "owner"),
  ).toBe(false);
  expect(
    isDeletedAccountLocalKey("flk.tab.watching.order.custom", "owner"),
  ).toBe(true);
});
