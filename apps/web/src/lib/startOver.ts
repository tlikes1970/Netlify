import { authManager } from "./auth";
import { applyRestore, isPortableLocalKey, portableSettings, restoreWrites, validateBackup } from "./backup";
import { prepareCloudRestore } from "./backupPersistence";
import { beginRestore, isRestoring } from "./restoreBarrier";
import { hasPendingRestore } from "./restoreRecovery";
import { DEFAULT_SETTINGS, resetPreferences, settingsManager } from "./settings";
import { firebaseSyncManager } from "./firebaseSync";
import { Library } from "./storage";
import { notificationManager } from "./notifications";
import { preferredNameStore } from "./preferredName";
import { cancelSeriesReminderSchedules } from "./seriesReminders";
import { languageManager } from "./language";
import { APP_VERSION } from "../version";

/** Explicit content domains, including obsolete content sources that could revive data. */
export function isStartOverContentKey(key: string, uid: string | null): boolean {
  return isPortableLocalKey(key) || [
    "flicklet:v2:saved", "flicklet.onboardingCompleted", "flicklet.searchTipDismissed",
    "flicklet.search-history", "flicklet:manualLocation", "searchHistory", "notification-log", "flicklet-data",
    "flicklet:forYouRows", `flicklet:forYouRows:v2:${uid ?? "guest"}`,
    "flicklet:forYouRows:v2:guest", "flicklet:shareListId", "flickword:game-state", "flickword:search-word", "flickword:shareParams", "trivia:shareParams",
  ].includes(key) || /^(flickword:games-completed:|flicklet:trivia:games:|flicklet:trivia:question-history$|flicklet:trivia:fallback-recent:)/.test(key);
}

/** Hold the replacement barrier through reload: mounted consumers cannot save stale state. */
export async function startOver(reload: () => void = () => window.location.reload()): Promise<void> {
  if (isRestoring() || hasPendingRestore())
    throw new Error("A backup restore or recovery is pending. Finish recovery and reload Flicklet before starting over.");
  const uid = authManager.getCurrentUser()?.uid ?? null;
  const sameAccount = () => (authManager.getCurrentUser()?.uid ?? null) === uid;
  const release = await beginRestore();
  let recoverReminders: (() => Promise<void>) | undefined;
  let applied = false;
  try {
    await Promise.all([settingsManager.prepareRestore(), firebaseSyncManager.prepareRestore(), notificationManager.prepareReplacement()]);
    if (hasPendingRestore()) throw new Error("Restore recovery is pending. Nothing was reset.");
    if (!sameAccount()) throw new Error("The signed-in account changed. Please try again.");
    const revision = crypto.randomUUID();
    const backup = validateBackup({
      type: "flicklet-backup", schemaVersion: 1, createdAt: new Date().toISOString(), appVersion: APP_VERSION,
      library: [], customLists: [], settings: portableSettings(DEFAULT_SETTINGS), preferredName: "", local: {},
    });
    const commit = uid ? await prepareCloudRestore(backup, uid, revision, true) : async () => undefined;
    const writes = restoreWrites(backup, localStorage, uid);
    for (const key of Object.keys(localStorage)) if (isStartOverContentKey(key, uid)) writes.set(key, null);
    // #5's preference allowlist preserves identity/access/unknown fields; #7 also clears the name.
    const current = JSON.parse(localStorage.getItem("flicklet.settings.v2") ?? "{}");
    const next = resetPreferences({ ...settingsManager.getSettings(), ...current });
    delete next.layout.themePack;
    delete next.notifications.alertConfig;
    writes.set("flicklet.settings.v2", JSON.stringify({ ...next, preferredName: "", displayName: "Guest" }));
    writes.set("flicklet.language.v2", "en");
    if (!sameAccount()) throw new Error("The signed-in account changed. Please try again.");
    // Native schedules are cancelled before their controlling preferences disappear.
    recoverReminders = await cancelSeriesReminderSchedules();
    await applyRestore(writes, localStorage, commit, sameAccount, { uid, revision });
    applied = true;
    if (!sameAccount()) throw new Error("The signed-in account changed during Start Over. Reload Flicklet before continuing.");
    Library.reloadFromStorage(true);
    settingsManager.reloadAfterRestore();
    notificationManager.reloadAfterRestore();
    preferredNameStore.resetAfterStartOver();
    languageManager.reloadAfterRestore();
    window.dispatchEvent(new CustomEvent("customLists:updated"));
    window.dispatchEvent(new CustomEvent("episode-progress:updated"));
    window.dispatchEvent(new CustomEvent("series-reminders:changed"));
    window.dispatchEvent(new CustomEvent("forYouRows:updated"));
    Library.notifyUpdate();
    reload();
  } catch (error) {
    if (!applied) {
      if (!hasPendingRestore()) release();
      if (recoverReminders && sameAccount()) {
        try { await recoverReminders(); }
        catch { throw new Error("Start Over failed and Android reminder recovery could not finish. Reload Flicklet to recover local state, then check Android reminders before retrying."); }
      }
    }
    // If manager publication/reload fails after commit, keep stale writers blocked.
    throw error;
  }
}
