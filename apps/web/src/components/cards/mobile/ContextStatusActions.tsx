import type { MediaItem } from "../card.types";
import {
  setPrimaryStatus,
  type PrimaryStatus,
} from "../../../lib/statusTransitions";

export function ContextStatusActions({
  item,
  tabKey,
}: {
  item: MediaItem;
  tabKey?: "watching" | "want" | "watched";
}) {
  const targets: PrimaryStatus[] =
    tabKey === "watching"
      ? ["wishlist", "watched"]
      : tabKey === "want"
        ? ["watching", "watched"]
        : tabKey === "watched"
          ? ["watching", "wishlist"]
          : ["watching", "wishlist"];
  const labels = {
    watching: "Watching",
    wishlist: "Want to Watch",
    watched: "Watched",
  };
  return (
    <div
      className="grid grid-cols-2 gap-1"
      data-testid="context-status-actions"
    >
      {targets.map((target) => (
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
          {labels[target]}
        </button>
      ))}
    </div>
  );
}
