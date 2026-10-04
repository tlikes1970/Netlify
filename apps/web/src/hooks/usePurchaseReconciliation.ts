import { useEffect } from "react";
import { useAuth } from "./useAuth";
import {
  isAndroidBillingAvailable,
  restoreFullAccess,
} from "../lib/proUpgrade";
/** Query Play on sign-in and foreground recovery; never manufacture a web restore flow. */
export function usePurchaseReconciliation(): void {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.uid || !isAndroidBillingAvailable()) return;
    let last = 0;
    const reconcile = () => {
      if (document.visibilityState === "hidden" || Date.now() - last < 60000)
        return;
      last = Date.now();
      void restoreFullAccess(false).catch(() => undefined);
    };
    reconcile();
    const plugin = (window as any).Capacitor?.Plugins?.Billing;
    const handle = plugin?.addListener?.("ownershipChanged", () => {
      last = 0;
      reconcile();
    });
    document.addEventListener("visibilitychange", reconcile);
    document.addEventListener("resume", reconcile);
    return () => {
      void Promise.resolve(handle).then((h) => h?.remove());
      document.removeEventListener("visibilitychange", reconcile);
      document.removeEventListener("resume", reconcile);
    };
  }, [user?.uid]);
}
