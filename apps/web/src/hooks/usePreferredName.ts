import { useSyncExternalStore } from "react";
import { preferredNameStore } from "../lib/preferredName";

export function usePreferredName() {
  const snapshot = useSyncExternalStore(
    preferredNameStore.subscribe,
    preferredNameStore.getSnapshot,
  );
  return {
    ...snapshot,
    updatePreferredName: preferredNameStore.updatePreferredName,
    retry: preferredNameStore.retry,
  };
}
