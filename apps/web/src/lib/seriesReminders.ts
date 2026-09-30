import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { fetchRelevantSeasonEpisodes } from "@/tmdb/tv";
import {
  diffReminderSchedules,
  selectDesiredEpisodeReminders,
  type PendingReminder,
} from "./seriesReminderLogic";

const STORAGE_KEY = "flicklet.series-reminders.v1";
const CHANNEL_ID = "episode-reminders";
const RECONCILE_THROTTLE_MS = 60_000;

export interface SeriesReminder {
  showId: number;
  title: string;
  enabled: boolean;
  updatedAt: number;
}

type ReminderState = Record<string, SeriesReminder>;
let lastReconcileAt = 0;
let reconcilePromise: Promise<void> | null = null;

function readState(): ReminderState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as ReminderState;
  } catch {
    return {};
  }
}

function writeState(state: ReminderState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("series-reminders:changed"));
}

function nativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function isSeriesReminderEnabled(showId: string | number): boolean {
  return readState()[String(showId)]?.enabled === true;
}

export function getEnabledSeriesReminders(): SeriesReminder[] {
  return Object.values(readState()).filter((item) => item.enabled);
}

export function setSeriesReminderState(
  showId: number,
  title: string,
  enabled: boolean,
): void {
  const state = readState();
  state[String(showId)] = { showId, title, enabled, updatedAt: Date.now() };
  writeState(state);
}

async function ensurePermission(): Promise<boolean> {
  if (!nativeAndroid()) return false;
  const current = await LocalNotifications.checkPermissions();
  if (current.display === "granted") return true;
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

async function ensureChannel(): Promise<void> {
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "Episode reminders",
    description: "Notifications when new TV episodes air",
    importance: 4,
    visibility: 1,
  });
}

function pendingDate(notification: {
  schedule?: { at?: Date | string };
}): Date | null {
  const at = notification.schedule?.at;
  if (!at) return null;
  const date = at instanceof Date ? at : new Date(at);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function reconcileOne(reminder: SeriesReminder): Promise<void> {
  console.info("[SeriesReminder] Reconciling", {
    showId: reminder.showId,
    title: reminder.title,
  });
  const episodes = await fetchRelevantSeasonEpisodes(reminder.showId);
  const desired = selectDesiredEpisodeReminders(reminder.showId, episodes);
  console.info("[SeriesReminder] Desired notifications", {
    showId: reminder.showId,
    count: desired.length,
    notifications: desired.map((episode) => ({
      episodeNumber: episode.episodeNumber,
      notificationId: episode.id,
      scheduledAt: episode.scheduledAt,
    })),
  });
  const pendingResult = await LocalNotifications.getPending();
  const seriesPending = pendingResult.notifications.filter(
    (notification) =>
      notification.extra?.flickletSeriesReminder === true &&
      Number(notification.extra?.showId) === reminder.showId,
  );
  const pending: PendingReminder[] = seriesPending.map((notification) => ({
    id: notification.id,
    scheduledAt: pendingDate(notification),
  }));
  console.info("[SeriesReminder] Existing pending notifications", {
    showId: reminder.showId,
    notifications: pending.map((notification) => ({
      notificationId: notification.id,
      scheduledAt: notification.scheduledAt,
    })),
  });
  const changes = diffReminderSchedules(desired, pending);
  console.info("[SeriesReminder] Reconciliation changes", {
    showId: reminder.showId,
    addCount: changes.add.length,
    cancelCount: changes.cancelIds.length,
    cancelIds: changes.cancelIds,
  });

  if (changes.cancelIds.length > 0) {
    await LocalNotifications.cancel({
      notifications: changes.cancelIds.map((id) => ({ id })),
    });
  }
  if (changes.add.length > 0) {
    const notifications = changes.add.map((episode) => ({
      id: episode.id,
      title: `${reminder.title} airs today`,
      body: episode.episodeTitle
        ? `S${episode.seasonNumber} E${episode.episodeNumber} · ${episode.episodeTitle}`
        : `S${episode.seasonNumber} E${episode.episodeNumber}`,
      schedule: { at: episode.scheduledAt },
      channelId: CHANNEL_ID,
      extra: {
        flickletSeriesReminder: true,
        showId: reminder.showId,
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        airDate: episode.airDate,
      },
    }));
    console.info("[SeriesReminder] Calling LocalNotifications.schedule()", {
      showId: reminder.showId,
      notifications,
    });
    try {
      const result = await LocalNotifications.schedule({ notifications });
      console.info("[SeriesReminder] LocalNotifications.schedule() resolved", {
        showId: reminder.showId,
        result,
      });
    } catch (error) {
      console.error("[SeriesReminder] LocalNotifications.schedule() failed", {
        showId: reminder.showId,
        error,
      });
      throw error;
    }
  }
}

export async function enableSeriesReminder(
  showId: number,
  title: string,
): Promise<{ enabled: boolean; reason?: "unsupported" | "denied" }> {
  if (!nativeAndroid()) return { enabled: false, reason: "unsupported" };
  if (!(await ensurePermission())) return { enabled: false, reason: "denied" };
  await ensureChannel();
  setSeriesReminderState(showId, title, true);
  try {
    await reconcileOne(readState()[String(showId)]);
  } catch (error) {
    console.error("Failed to schedule episode reminders:", error);
  }
  return { enabled: true };
}

export async function disableSeriesReminder(showId: number): Promise<void> {
  const existing = readState()[String(showId)];
  if (existing) setSeriesReminderState(showId, existing.title, false);
  if (!nativeAndroid()) return;
  const pending = await LocalNotifications.getPending();
  const ids = pending.notifications
    .filter(
      (notification) =>
        notification.extra?.flickletSeriesReminder === true &&
        Number(notification.extra?.showId) === showId,
    )
    .map(({ id }) => ({ id }));
  if (ids.length > 0) await LocalNotifications.cancel({ notifications: ids });
}

export async function reconcileSeriesReminders(options?: {
  force?: boolean;
}): Promise<void> {
  if (!nativeAndroid()) return;
  if (!options?.force && Date.now() - lastReconcileAt < RECONCILE_THROTTLE_MS) return;
  if (reconcilePromise) return reconcilePromise;
  reconcilePromise = (async () => {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") return;
    await ensureChannel();
    for (const reminder of getEnabledSeriesReminders()) {
      try {
        await reconcileOne(reminder);
      } catch (error) {
        console.error(`Failed to reconcile reminders for ${reminder.title}:`, error);
      }
    }
    lastReconcileAt = Date.now();
  })().finally(() => {
    reconcilePromise = null;
  });
  return reconcilePromise;
}

export async function scheduleDevelopmentReminderTest(): Promise<{
  notificationId: number;
  scheduledAt: Date;
  result: Awaited<ReturnType<typeof LocalNotifications.schedule>>;
}> {
  if (!nativeAndroid()) {
    throw new Error("The reminder test is available only in the native Android app.");
  }
  if (!(await ensurePermission())) throw new Error("Notification permission was not granted.");
  await ensureChannel();
  const notificationId = 2_147_400_001;
  const scheduledAt = new Date(Date.now() + 60_000);
  console.info("[SeriesReminder] Scheduling diagnostic notification", {
    notificationId,
    scheduledAt,
  });
  try {
    const result = await LocalNotifications.schedule({
      notifications: [{
        id: notificationId,
        title: "Flicklet reminder diagnostic",
        body: "The Android local-notification scheduler is working.",
        schedule: { at: scheduledAt },
        channelId: CHANNEL_ID,
        extra: { flickletDevelopmentTest: true },
      }],
    });
    console.info("[SeriesReminder] Diagnostic schedule resolved", {
      notificationId,
      scheduledAt,
      result,
    });
    return { notificationId, scheduledAt, result };
  } catch (error) {
    console.error("[SeriesReminder] Diagnostic schedule failed", {
      notificationId,
      scheduledAt,
      error,
    });
    throw error;
  }
}

if (typeof window !== "undefined" && nativeAndroid()) {
  (window as any).flickletTestEpisodeReminder = scheduleDevelopmentReminderTest;
}
