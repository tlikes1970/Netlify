import { httpsCallable } from "firebase/functions";
import { signOut } from "firebase/auth";
import { auth, functions } from "./firebaseBootstrap";
import { beginRestore } from "./restoreBarrier";
import { hasPendingRestore } from "./restoreRecovery";
import { settingsManager, DEFAULT_SETTINGS } from "./settings";
import { firebaseSyncManager } from "./firebaseSync";
import { notificationManager } from "./notifications";
import { cancelSeriesReminderSchedules } from "./seriesReminders";
import { isStartOverContentKey } from "./startOver";
import { Library } from "./storage";
import { clearBillingCache } from "./proStatus";
import { setEntitlementsCache, resolveEntitlements } from "./entitlements";
import { preferredNameStore } from "./preferredName";
import { queryClient } from "./query";
import {
  ACCOUNT_DELETION_KEY,
  pendingAccountDeletion,
  recordAccountDeletion,
} from "./accountDeletionState";
import { languageManager } from "./language";
import { authLogManager } from "./authLog";
import { isCapacitorNative } from "./capacitorEnv";

const failure = (code: string) => Object.assign(new Error(code), { code });
let operation: Promise<void> | null = null;
export function isDeletedAccountLocalKey(key: string, uid: string): boolean {
  // Shared provider/catalog caches and another UID's For You rows are deliberately excluded.
  return (
    isStartOverContentKey(key, uid) ||
    [
      "flicklet.library.v2",
      "flicklet.customLists.v2",
      "flicklet.settings.v2",
      "flicklet.trial.v1",
      "flicklet.preferredName.v1",
      "flicklet.username.v1",
      "auth-debug-logs",
      "flicklet.auth.logs",
      "flicklet.auth.traceId",
      "flicklet.auth.broadcast",
      "flicklet.auth.status",
      "flicklet.auth.stateId",
      "flicklet.auth.resolving.start",
      "flicklet.auth.redirect.start",
      "flk.search.recent",
    ].includes(key) ||
    key.startsWith("flicklet.preferredName.dismissed.")
  );
}
export async function finishDeletedAccountLocally(uid: string): Promise<void> {
  if (auth.currentUser && auth.currentUser.uid !== uid)
    throw failure("account-changed");
  await cancelSeriesReminderSchedules();
  const keys = Object.keys(localStorage).filter((key) =>
    isDeletedAccountLocalKey(key, uid),
  );
  const language = languageManager.getLanguage();
  const failures: unknown[] = [];
  for (const key of keys)
    try {
      localStorage.removeItem(key);
    } catch (error) {
      failures.push(error);
    }
  // Preserve device language/theme while removing profile, legacy access and other account preferences.
  try {
    const device = settingsManager.getSettings();
    localStorage.setItem(
      "flicklet.settings.v2",
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        layout: { ...DEFAULT_SETTINGS.layout, theme: device.layout.theme },
      }),
    );
    localStorage.setItem("flicklet.language.v2", language);
  } catch (error) {
    failures.push(error);
  }
  for (const key of Object.keys(sessionStorage))
    if (/preferred|username|auth|flicklet.*user/i.test(key)) {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        failures.push(error);
      }
    }
  clearBillingCache();
  setEntitlementsCache(
    resolveEntitlements({
      isAuthenticated: false,
      paidPro: false,
      proSource: null,
      trialStartMs: null,
    }),
    null,
  );
  queryClient.clear();
  if (
    isCapacitorNative() &&
    auth.currentUser?.providerData?.some(
      (provider) => provider.providerId === "google.com",
    )
  ) {
    const { clearGoogleNativeSession } = await import("./googleAuthNative");
    await clearGoogleNativeSession();
  }
  await signOut(auth);
  try {
    authLogManager.resetAfterAccountDeletion();
  } catch (error) {
    failures.push(error);
  }
  Library.reloadFromStorage(true);
  settingsManager.reloadAfterRestore();
  notificationManager.reloadAfterRestore();
  preferredNameStore.resetAfterStartOver();
  window.dispatchEvent(new Event("library:cleared"));
  window.dispatchEvent(new Event("customLists:updated"));
  window.dispatchEvent(new Event("episode-progress:updated"));
  window.dispatchEvent(new Event("series-reminders:changed"));
  window.dispatchEvent(new Event("forYouRows:updated"));
  if (failures.length) throw failure("account-local-cleanup-incomplete");
  localStorage.removeItem(ACCOUNT_DELETION_KEY);
}

async function performDeletion(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw failure("authentication-required");
  const uid = user.uid;
  if (hasPendingRestore()) throw failure("recovery-pending");
  const journal = pendingAccountDeletion();
  if (journal && journal.uid !== uid) throw failure("account-changed");
  const release = await beginRestore(true);
  let recoverReminders: (() => Promise<void>) | undefined;
  let serverRequested = false;
  try {
    await Promise.all([
      settingsManager.prepareRestore(),
      firebaseSyncManager.prepareRestore(),
      notificationManager.prepareReplacement(),
    ]);
    if (auth.currentUser?.uid !== uid) throw failure("account-changed");
    recoverReminders = await cancelSeriesReminderSchedules();
    if (!journal?.confirmed) {
      recordAccountDeletion(uid, false);
      serverRequested = true;
      const result = await httpsCallable<
        { confirmation: string },
        { deleted: boolean }
      >(functions, "deleteAccount", { timeout: 540000 })({
        confirmation: "DELETE",
      });
      if (!result.data.deleted) throw failure("account-deletion-incomplete");
      recordAccountDeletion(uid, true);
    }
    await finishDeletedAccountLocally(uid);
    // Mounted writers stay blocked until the fresh signed-out application reloads.
    window.location.assign("/");
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (
      !pendingAccountDeletion()?.confirmed &&
      (!serverRequested ||
        [
          "functions/failed-precondition",
          "functions/invalid-argument",
          "functions/unauthenticated",
          "functions/not-found",
          "functions/permission-denied",
          "account-changed",
        ].includes(code || ""))
    ) {
      localStorage.removeItem(ACCOUNT_DELETION_KEY);
      if (recoverReminders && auth.currentUser?.uid === uid)
        await recoverReminders();
    }
    // Ambiguous/server failures retain the recovery journal and block stale writers.
    release();
    throw error;
  }
}
export function deleteCurrentAccount(): Promise<void> {
  if (operation) return operation;
  operation = performDeletion().finally(() => {
    operation = null;
  });
  return operation;
}
