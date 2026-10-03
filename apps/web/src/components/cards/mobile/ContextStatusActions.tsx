import { Library } from "../../../lib/storage";
import { useLanguage } from '../../../lib/language';
import { getWatchStatusLabel } from '../../../lib/watchStatus';
import type { MediaItem } from "../card.types";
import {
  setPrimaryStatus,
  type PrimaryStatus,
} from "../../../lib/statusTransitions";

export function ContextStatusActions({
  item,
  tabKey,
  omitCurrentStatus = false,
}: {
  item: MediaItem;
  tabKey?: "watching" | "want" | "watched";
  omitCurrentStatus?: boolean;
}) {
  useLanguage();
  const targets: PrimaryStatus[] =
    tabKey === "watching"
      ? ["wishlist", "watched"]
      : tabKey === "want"
        ? ["watching", "watched"]
        : tabKey === "watched"
          ? ["watching", "wishlist"]
          : ["watching", "wishlist"];
  return (
    <div
      className="grid grid-cols-2 gap-1"
      data-testid="context-status-actions"
    >
      {targets.filter(target =>
        !omitCurrentStatus || target !== Library.getCurrentList(item.id, item.mediaType)
      ).map((target) => (
        <button
          key={target}
          type="button"
          className="min-h-[44px] min-w-0 rounded-lg border px-1 py-1 text-[11px] leading-tight"
          style={{
            backgroundColor: "var(--btn)",
            color: "var(--text)",
            borderColor: "var(--line)",
          }}
          onClick={() => setPrimaryStatus(item, target, { feedback: true })}
        >
          {getWatchStatusLabel(target)}
        </button>
      ))}
    </div>
  );
}
