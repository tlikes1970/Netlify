import { beforeEach, describe, expect, it } from "vitest";
import type { Episode } from "./tmdb";
import {
  diffReminderSchedules,
  localReminderTime,
  reminderNotificationId,
  selectDesiredEpisodeReminders,
} from "./seriesReminderLogic";
import {
  isSeriesReminderEnabled,
  setSeriesReminderState,
} from "./seriesReminders";

const episode = (overrides: Partial<Episode> = {}): Episode => ({
  id: 1,
  name: "First Contact",
  season_number: 4,
  episode_number: 6,
  air_date: "2030-05-10",
  overview: "",
  ...overrides,
});

describe("series reminder state", () => {
  beforeEach(() => localStorage.clear());

  it("defaults off and can be enabled and disabled", () => {
    expect(isSeriesReminderEnabled(302463)).toBe(false);
    setSeriesReminderState(302463, "Resident Alien", true);
    expect(isSeriesReminderEnabled(302463)).toBe(true);
    setSeriesReminderState(302463, "Resident Alien", false);
    expect(isSeriesReminderEnabled(302463)).toBe(false);
  });
});

describe("episode reminder selection", () => {
  it("selects future episodes, ignores past/missing dates, and removes duplicates", () => {
    const desired = selectDesiredEpisodeReminders(
      302463,
      [
        episode(),
        episode(),
        episode({ id: 2, episode_number: 5, air_date: "2029-01-01" }),
        episode({ id: 3, episode_number: 7, air_date: "" }),
      ],
      new Date(2030, 4, 1, 12),
    );
    expect(desired).toHaveLength(1);
    expect(desired[0].scheduledAt).toEqual(new Date(2030, 4, 10, 8));
  });

  it("includes today's episode only before 8 AM", () => {
    const date = "2030-05-10";
    expect(selectDesiredEpisodeReminders(1, [episode({ air_date: date })], new Date(2030, 4, 10, 7, 59))).toHaveLength(1);
    expect(selectDesiredEpisodeReminders(1, [episode({ air_date: date })], new Date(2030, 4, 10, 8, 1))).toHaveLength(0);
  });

  it("uses stable positive Android notification identifiers", () => {
    const id = reminderNotificationId(302463, 4, 6);
    expect(id).toBe(reminderNotificationId(302463, 4, 6));
    expect(id).toBeGreaterThanOrEqual(0);
    expect(id).toBeLessThanOrEqual(0x7fffffff);
    expect(id).not.toBe(reminderNotificationId(302463, 4, 7));
  });

  it("constructs 8 AM in the device-local calendar date", () => {
    const value = localReminderTime("2030-05-10");
    expect(value?.getFullYear()).toBe(2030);
    expect(value?.getMonth()).toBe(4);
    expect(value?.getDate()).toBe(10);
    expect(value?.getHours()).toBe(8);
  });
});

describe("schedule reconciliation", () => {
  const now = new Date(2030, 4, 1);
  const desired = selectDesiredEpisodeReminders(302463, [episode()], now);

  it("leaves a matching pending notification alone", () => {
    expect(diffReminderSchedules(desired, [{ id: desired[0].id, scheduledAt: desired[0].scheduledAt }])).toEqual({ add: [], cancelIds: [] });
  });

  it("replaces a changed air date", () => {
    const result = diffReminderSchedules(desired, [{ id: desired[0].id, scheduledAt: new Date(2030, 4, 11, 8) }]);
    expect(result.cancelIds).toEqual([desired[0].id]);
    expect(result.add).toEqual(desired);
  });

  it("cancels a removed episode and keeps enabled state valid with no future episodes", () => {
    setSeriesReminderState(302463, "Resident Alien", true);
    const result = diffReminderSchedules([], [{ id: desired[0].id, scheduledAt: desired[0].scheduledAt }]);
    expect(result).toEqual({ add: [], cancelIds: [desired[0].id] });
    expect(isSeriesReminderEnabled(302463)).toBe(true);
  });
});
