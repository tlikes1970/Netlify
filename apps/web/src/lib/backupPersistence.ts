import {
  collection,
  deleteField,
  doc,
  getDocFromServer,
  getDocsFromServer,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { authManager } from "./auth";
import { db } from "./firebaseBootstrap";
import { firebaseSyncManager } from "./firebaseSync";
import { settingsManager, mergeSettingsFromPayload } from "./settings";
import { Library, flushPendingSaves, type LibraryEntry } from "./storage";
import { APP_VERSION } from "../version";
import {
  applyRestore,
  collectLocal,
  isLegacyBackup,
  object,
  restoreWrites,
  validateBackup,
  type Backup,
} from "./backup";
import { preferredNameStore, resolvePreferredName } from "./preferredName";
import { notificationManager } from "./notifications";
import { languageManager } from "./language";
import { beginRestore } from "./restoreBarrier";
import { normalizeRows } from "./forYouRowsStorage";

/** Export-only repair of stale references. Imported snapshots remain strictly validated. */
export function normalizeExportMemberships(entries: LibraryEntry[], definitions: unknown[]): LibraryEntry[] {
  const ids = new Set(definitions.map(definition => object(definition, "custom list").id));
  return entries.map(source => {
    const item = structuredClone(source);
    if (item.customListIds !== undefined) {
      item.customListIds = [...new Set(item.customListIds.filter(id => ids.has(id)))];
    }
    if (item.list.startsWith("custom:") && !ids.has(item.list.slice(7))) {
      // Keep the title and its user data even if its sole list was deleted.
      item.list = item.customListIds?.length ? `custom:${item.customListIds[0]}` : "wishlist";
    }
    return item;
  });
}

export async function createBackup(): Promise<Backup> {
  const uid = authManager.getCurrentUser()?.uid ?? null;
  // Preferred name has its own authoritative authenticated field, not the settings mirror.
  const account = uid ? await authManager.getUserSettings(uid) : null;
  if (uid && !account)
    throw new Error(
      "Your profile could not be loaded. Please retry the backup.",
    );
  if ((authManager.getCurrentUser()?.uid ?? null) !== uid)
    throw new Error("The signed-in account changed. Please retry.");
  const local = collectLocal(localStorage, uid);
  const lists = object(
    JSON.parse(localStorage.getItem("flicklet.customLists.v2") ?? "{}"),
    "custom lists",
  );
  const settings = settingsManager.getSettings();
  const stored = object(
    JSON.parse(localStorage.getItem("flicklet.settings.v2") ?? "{}"),
    "settings",
  );
  return validateBackup({
    type: "flicklet-backup",
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    library: normalizeExportMemberships(Library.getAll(), lists.customLists as unknown[] ?? []),
    customLists: lists.customLists ?? [],
    settings,
    preferredName: account
      ? resolvePreferredName(account)
      : !uid && typeof stored.preferredName === "string"
        ? stored.preferredName
        : null,
    local,
  });
}

/** Prepare a single atomic batch against the existing user-data paths. */
export async function prepareCloudRestore(
  backup: Backup,
  uid: string,
  revision: string,
  startOver = false,
): Promise<() => Promise<void>> {
  const ref = doc(db, "users", uid);
  const snapshot = await getDocFromServer(ref);
  if (!snapshot.exists())
    throw new Error("The current account could not be loaded. Please retry.");
  const library = Object.fromEntries(
    backup.library.map((i) => [`${i.mediaType}:${i.id}`, i]),
  );
  const watchlists = firebaseSyncManager.createLeanWatchlists(
    library,
    backup.customLists,
  );
  const updates: Record<string, unknown> = {
    watchlists,
    restoreRevision: revision,
    lastUpdated: serverTimestamp(),
  };
  const mirror = !!snapshot.data().settings?.fullSettings;
  const addSetting = (path: string, value: unknown) => {
    updates[`settings.${path}`] = value;
    if (mirror && path !== "theme")
      updates[`settings.fullSettings.${path}`] = value;
  };
  for (const [group, value] of Object.entries(backup.settings)) {
    if (group === "layout" || group === "notifications")
      for (const [key, v] of Object.entries(object(value, group)))
        addSetting(`${group}.${key}`, v);
    else addSetting(group, value);
  }
  const layout = object(backup.settings.layout ?? {}, "layout");
  if (layout.theme !== undefined) updates["settings.theme"] = layout.theme;
  if (backup.preferredName !== null)
    addSetting("preferredName", backup.preferredName);
  if (!mirror) {
    const old = object(
      snapshot.data().settings ?? {},
      "current cloud settings",
    );
    const base = mergeSettingsFromPayload(old);
    updates["settings.fullSettings"] = {
      ...base,
      ...backup.settings,
      notifications: {
        ...base.notifications,
        ...object(backup.settings.notifications ?? {}, "notifications"),
      },
      layout: { ...base.layout, ...layout },
      ...(backup.preferredName !== null
        ? { preferredName: backup.preferredName }
        : {}),
    };
  }
  if (startOver) {
    addSetting("displayName", "Guest");
    updates["settings.lang"] = "en";
    if (!mirror) {
      const full = object(updates["settings.fullSettings"], "settings mirror");
      full.displayName = "Guest";
      delete object(full.layout, "layout").themePack;
      delete object(full.notifications, "notifications").alertConfig;
    }
  }
  const modern = !isLegacyBackup(backup);
  if (modern) {
    if (!("themePack" in layout)) addSetting("layout.themePack", deleteField());
    if (
      !(
        "alertConfig" in
        object(backup.settings.notifications ?? {}, "notifications")
      )
    )
      addSetting("notifications.alertConfig", deleteField());
    updates.gameStats = {
      flickword: backup.local["flickword:stats"] ?? {},
      trivia: backup.local["trivia:stats"] ?? {},
    };
    updates.gameStatsLastUpdated = serverTimestamp();
  }
  if (
    new Blob([
      JSON.stringify({
        watchlists,
        settings: backup.settings,
        gameStats: updates.gameStats,
      }),
    ]).size >
    850 * 1024
  )
    throw new Error(
      "This backup is too large for the current cloud document. Nothing was changed.",
    );
  const batch = writeBatch(db);
  batch.update(ref, updates);
  let operations = 1;
  if (modern) {
    for (const group of startOver ? ["episodeProgress", "tabState", "notificationSettings"] : ["episodeProgress", "tabState"]) {
      const existing = await getDocsFromServer(
        collection(db, "users", uid, group),
      );
      existing.forEach((d) => {
        if (startOver && group === "notificationSettings" && d.id === "main") return;
        batch.delete(d.ref);
        operations++;
      });
    }
    for (const [key, value] of Object.entries(backup.local))
      if (key.startsWith("episode-progress-")) {
        const showId = Number(key.slice("episode-progress-".length));
        batch.set(doc(db, "users", uid, "episodeProgress", String(showId)), {
          ...object(value, "progress"),
          showId,
          lastUpdated: new Date().toISOString(),
        });
        operations++;
      }
    const tabs = new Set(
      Object.keys(backup.local)
        .filter((k) => k.startsWith("flk.tab."))
        .map((k) =>
          k
            .replace(/^flk\.tab\./, "")
            .replace(
              /\.(sort|filter\.type|filter\.providers|order\.custom)$/,
              "",
            ),
        ),
    );
    for (const tab of tabs) {
      const prefix = `flk.tab.${tab}.`;
      batch.set(doc(db, "users", uid, "tabState", tab), {
        tabKey: tab,
        sort: backup.local[`${prefix}sort`] ?? "date-newest",
        filter: {
          type: backup.local[`${prefix}filter.type`] ?? "all",
          providers: backup.local[`${prefix}filter.providers`] ?? [],
        },
        order: backup.local[`${prefix}order.custom`]
          ? { mode: "custom", ids: backup.local[`${prefix}order.custom`] }
          : { mode: "default" },
        lastUpdated: new Date().toISOString(),
      });
      operations++;
    }
    const notification = backup.local["notification-settings"] ?? {
      globalEnabled: true,
      freeTierTiming: "24-hours-before",
      proTierTiming: 2,
      methods: { inApp: true, push: false, email: false },
      showOverrides: {},
    };
    batch.set(
      doc(db, "users", uid, "notificationSettings", "main"),
      notification,
    );
    operations++;
  }
  if (operations > 450)
    throw new Error(
      "This backup exceeds the safe atomic cloud restore limit. Nothing was changed.",
    );
  return () => batch.commit();
}

export async function restoreBackup(input: Backup): Promise<string | null> {
  const backup = validateBackup(input);
  const rows = backup.local.forYouRows;
  if (
    rows &&
    !normalizeRows(
      object(rows, "genre rows").rows as Parameters<typeof normalizeRows>[0],
    )
  )
    throw new Error("The backup contains unsupported genre rows.");
  const uid = authManager.getCurrentUser()?.uid ?? null;
  flushPendingSaves();
  const release = await beginRestore();
  try {
    await Promise.all([
      settingsManager.prepareRestore(),
      firebaseSyncManager.prepareRestore(),
    ]);
    const sameAccount = () =>
      (authManager.getCurrentUser()?.uid ?? null) === uid;
    const revision = crypto.randomUUID();
    const commit = uid
      ? await prepareCloudRestore(backup, uid, revision)
      : async () => undefined;
    if (!sameAccount())
      throw new Error("The signed-in account changed. Please retry.");
    const previousReminders = object(
      JSON.parse(localStorage.getItem("flicklet.series-reminders.v1") ?? "{}"),
      "current reminders",
    );
    await applyRestore(
      restoreWrites(backup, localStorage, uid),
      localStorage,
      commit,
      sameAccount,
      { uid, revision },
    );
    if (!sameAccount())
      throw new Error(
        "The signed-in account changed during restore. Please reload Flicklet.",
      );
    Library.reloadFromStorage(true);
    settingsManager.reloadAfterRestore();
    notificationManager.reloadAfterRestore();
    const language = backup.local["flicklet.language.v2"];
    if (language === "en" || language === "es") languageManager.reloadAfterRestore();
    if (uid) preferredNameStore.retry();
    window.dispatchEvent(new CustomEvent("customLists:updated"));
    Library.notifyUpdate();
    // Cancel removed device schedules through the existing reminder API. Startup
    // reconstructs enabled schedules normally, without importing OS permissions.
    let warning: string | null = null;
    if (!isLegacyBackup(backup)) {
      const nextReminders = object(
        backup.local["flicklet.series-reminders.v1"] ?? {},
        "reminders",
      );
      const removed = Object.entries(previousReminders).filter(
        ([id, value]) =>
          object(value, "reminder").enabled === true &&
          (!nextReminders[id] ||
            object(nextReminders[id], "reminder").enabled !== true),
      );
      if (removed.length) {
        try {
          const { cancelSeriesReminderSchedules } = await import("./seriesReminders");
          await cancelSeriesReminderSchedules(removed.map(([id]) => Number(id)));
        } catch {
          warning =
            "Your data was restored, but device reminder cancellation could not finish. Check Android reminders.";
        }
      }
    }
    return warning;
  } finally {
    release();
  }
}
