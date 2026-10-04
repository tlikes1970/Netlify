import { t, useLanguage } from "@/lib/language";
import { useEffect, useState } from "react";
import type { MediaItem } from "@/components/cards/card.types";
import {
  disableSeriesReminder,
  enableSeriesReminder,
  isSeriesReminderEnabled,
} from "@/lib/seriesReminders";

interface Props {
  item: MediaItem;
  onClose: () => void;
}

export function SeriesReminderModal({ item, onClose }: Props) {
  useLanguage();
  const [enabled, setEnabled] = useState(() => isSeriesReminderEnabled(item.id));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<keyof typeof import("@/lib/translations").default.en | "">("");

  useEffect(() => setEnabled(isSeriesReminderEnabled(item.id)), [item.id]);

  const setReminder = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await enableSeriesReminder(Number(item.id), item.title);
      if (!result.enabled) {
        setMessage(
          result.reason === "denied"
            ? "episodesNotificationsAreOffAllowThemInAndroidSettingsToUseReminders"
            : "episodesEpisodeRemindersAreAvailableInTheAndroidApp",
        );
        return;
      }
      setEnabled(true);
      onClose();
    } catch (error) {
      console.error("Unable to enable episode reminders:", error);
      setMessage("episodesFlickletCouldnTSetTheReminderPleaseTryAgain");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await disableSeriesReminder(Number(item.id));
      setEnabled(false);
      onClose();
    } catch (error) {
      console.error("Unable to turn off episode reminders:", error);
      setMessage("episodesFlickletCouldnTTurnOffTheReminderPleaseTryAgain");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 p-4" role="presentation">
      <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto break-words rounded-2xl border p-5 shadow-2xl" style={{ background: "var(--card)", borderColor: "var(--line)" }} role="dialog" aria-modal="true" aria-labelledby="series-reminder-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="series-reminder-title" className="text-lg font-bold">{item.title}</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {enabled ? t("episodesRemindersAreOn") : t("episodesRemindMeWhenNewEpisodesAir")}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("episodesClose")} className="rounded-lg min-w-[44px] min-h-[44px]">✕</button>
        </div>
        {message && <p className="mt-3 text-sm" role="alert">{t(message)}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={enabled ? turnOff : setReminder}
          className="mt-5 w-full rounded-xl px-4 py-3 font-semibold disabled:opacity-60"
          style={{ background: "var(--accent)", color: "white" }}
        >
          {busy ? t("episodesPleaseWait") : enabled ? t("episodesTurnOffReminder") : t("episodesSetReminder")}
        </button>
      </div>
    </div>
  );
}
