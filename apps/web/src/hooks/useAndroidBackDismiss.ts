import { useEffect } from "react";

/** Consume the native cancellable Back contract while an internal surface is open. */
export function useAndroidBackDismiss(
  enabled: boolean,
  dismiss: () => void,
): void {
  useEffect(() => {
    if (!enabled) return;

    const onAndroidBack = (event: Event) => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      dismiss();
    };

    window.addEventListener("flicklet:android-back", onAndroidBack);
    return () => {
      window.removeEventListener("flicklet:android-back", onAndroidBack);
    };
  }, [dismiss, enabled]);
}
