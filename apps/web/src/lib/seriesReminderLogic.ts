import type { Episode } from "./tmdb";

export const REMINDER_HOUR = 8;

export interface DesiredEpisodeReminder {
  id: number;
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  airDate: string;
  scheduledAt: Date;
}

export function reminderNotificationId(
  showId: number,
  seasonNumber: number,
  episodeNumber: number,
): number {
  const key = `${showId}:${seasonNumber}:${episodeNumber}`;
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) & 0x7fffffff;
}

export function localReminderTime(airDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(airDate);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    REMINDER_HOUR,
    0,
    0,
    0,
  );
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return null;
  }
  return date;
}

export function selectDesiredEpisodeReminders(
  showId: number,
  episodes: Episode[],
  now = new Date(),
): DesiredEpisodeReminder[] {
  const unique = new Map<number, DesiredEpisodeReminder>();
  for (const episode of episodes) {
    if (!episode.air_date) continue;
    const scheduledAt = localReminderTime(episode.air_date);
    if (!scheduledAt || scheduledAt.getTime() <= now.getTime()) continue;
    const id = reminderNotificationId(
      showId,
      episode.season_number,
      episode.episode_number,
    );
    unique.set(id, {
      id,
      showId,
      seasonNumber: episode.season_number,
      episodeNumber: episode.episode_number,
      episodeTitle: episode.name || undefined,
      airDate: episode.air_date,
      scheduledAt,
    });
  }
  return [...unique.values()].sort(
    (left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime(),
  );
}

export interface PendingReminder {
  id: number;
  scheduledAt: Date | null;
}

export function diffReminderSchedules(
  desired: DesiredEpisodeReminder[],
  pending: PendingReminder[],
): { add: DesiredEpisodeReminder[]; cancelIds: number[] } {
  const desiredById = new Map(desired.map((item) => [item.id, item]));
  const pendingById = new Map(pending.map((item) => [item.id, item]));
  const cancelIds: number[] = [];
  const add: DesiredEpisodeReminder[] = [];

  for (const item of pending) {
    const wanted = desiredById.get(item.id);
    if (
      !wanted ||
      !item.scheduledAt ||
      item.scheduledAt.getTime() !== wanted.scheduledAt.getTime()
    ) {
      cancelIds.push(item.id);
    }
  }
  for (const item of desired) {
    const existing = pendingById.get(item.id);
    if (
      !existing ||
      !existing.scheduledAt ||
      existing.scheduledAt.getTime() !== item.scheduledAt.getTime()
    ) {
      add.push(item);
    }
  }
  return { add, cancelIds };
}
