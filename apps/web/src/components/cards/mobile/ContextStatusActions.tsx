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
    <div className="flex flex-wrap gap-1" data-testid="context-status-actions">
      {targets.map((target) => (
        <button
          key={target}
          type="button"
          className="min-h-[44px] rounded-lg border px-2 py-1 text-xs"
          style={{
            backgroundColor: "var(--btn)",
            color: "var(--text)",
            borderColor: "var(--line)",
          }}
          onClick={() => setPrimaryStatus(item, target, { feedback: true })}
        >
          {tabKey ? `Move to ${labels[target]}` : labels[target]}
        </button>
      ))}
    </div>
  );
}
