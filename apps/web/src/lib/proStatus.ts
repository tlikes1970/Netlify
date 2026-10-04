import { useEffect, useState } from "react";
import { auth } from "./firebaseBootstrap";
import { useAuth } from "../hooks/useAuth";
import { getBillingStatus } from "./billing";
export interface ProStatus {
  isPro: boolean;
  source: "alpha" | "gift" | "stripe" | "ios" | "android" | "manual" | null;
}
const unpaid: ProStatus = { isPro: false, source: null };
let cache: { uid: string; status: ProStatus; expires: number } | null = null;
let pending: {
  uid: string;
  generation: number;
  promise: Promise<ProStatus>;
} | null = null;
let generation = 0;
export function clearBillingCache(): void {
  generation++;
  cache = null;
  pending = null;
}
export async function getProStatus(): Promise<ProStatus> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    clearBillingCache();
    return unpaid;
  }
  if (cache?.uid === uid && cache.expires > Date.now()) return cache.status;
  if (pending?.uid === uid && pending.generation === generation)
    return pending.promise;
  const started = generation;
  const promise = getBillingStatus(uid)
    .then((billing) => {
      // Legacy paid/test/manual flags are historical data, never proof of Play ownership.
      const verified =
        billing.isPro === true &&
        billing.verified === true &&
        billing.verificationVersion === 2 &&
        billing.purchaseType === "one_time" &&
        billing.productId === "flicklet_full_access" &&
        /^[a-f0-9]{64}$/.test(billing.ownershipId || "");
      const status: ProStatus = verified
        ? { isPro: true, source: "android" }
        : unpaid;
      if (started !== generation || auth.currentUser?.uid !== uid)
        return unpaid;
      cache = { uid, status, expires: Date.now() + 60000 };
      return status;
    })
    .finally(() => {
      if (pending?.promise === promise) pending = null;
    });
  pending = { uid, generation: started, promise };
  return promise;
}
export function getProStatusSync(): ProStatus {
  return cache &&
    cache.uid === auth.currentUser?.uid &&
    cache.expires > Date.now()
    ? cache.status
    : unpaid;
}
function refreshProStatus(): Promise<ProStatus> {
  if (
    pending &&
    pending.uid === auth.currentUser?.uid &&
    pending.generation === generation
  )
    return pending.promise;
  clearBillingCache();
  return getProStatus();
}
export function useProStatus(): ProStatus {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [result, setResult] = useState<{
    uid: string | null;
    status: ProStatus;
  }>({ uid: null, status: unpaid });
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void refreshProStatus().then((status) => {
        if (!cancelled && auth.currentUser?.uid === uid)
          setResult({ uid, status });
      });
    };
    void getProStatus().then((status) => {
      if (!cancelled && (auth.currentUser?.uid ?? null) === uid)
        setResult({ uid, status });
    });
    window.addEventListener("pro-upgrade-success", refresh);
    window.addEventListener("billing:changed", refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("pro-upgrade-success", refresh);
      window.removeEventListener("billing:changed", refresh);
    };
  }, [uid]);
  return result.uid === uid ? result.status : unpaid;
}
