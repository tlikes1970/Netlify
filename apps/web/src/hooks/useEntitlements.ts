import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import { useProStatus } from "../lib/proStatus";
import {
  loadTrialRecord,
  resolveEntitlements,
  setEntitlementsCache,
  type EntitlementState,
} from "../lib/entitlements";
import { resolveServerTrialStartMs } from "../lib/trialEntitlement";

export { getEntitlementsSync } from "../lib/entitlements";

export function useEntitlements(): EntitlementState {
  const { user, isAuthenticated } = useAuth();
  const proStatus = useProStatus();
  const [trialStartMs, setTrialStartMs] = useState<number | null>(null);
  const [trialResolved, setTrialResolved] = useState(false);
  const [trialOwner, setTrialOwner] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!user?.uid) {
      setTrialStartMs(null);
      setTrialOwner(null);
      setTrialResolved(false);
      return;
    }

    let cancelled = false;
    const userId = user.uid;
    setTrialOwner(userId);
    const cached = loadTrialRecord(userId);

    if (cached) {
      setTrialStartMs(cached.startMs);
    } else {
      setTrialStartMs(null);
    }
    setTrialResolved(false);

    resolveServerTrialStartMs(userId)
      .then((startMs) => {
        if (cancelled) return;
        setTrialStartMs(startMs);
        setTrialResolved(true);
      })
      .catch((error) => {
        console.error("[Entitlements] Failed to resolve server trial:", error);
        if (cancelled) return;
        if (cached) {
          setTrialStartMs(cached.startMs);
        } else {
          setTrialStartMs(null);
        }
        setTrialResolved(Boolean(cached));
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const state = useMemo(
    () =>
      resolveEntitlements({
        isAuthenticated: !!isAuthenticated && !!user,
        paidPro: proStatus.isPro,
        proSource: proStatus.source,
        trialStartMs: trialOwner === user?.uid ? trialStartMs : null,
        trialResolved: trialOwner === user?.uid && trialResolved,
        nowMs: now,
      }),
    [
      isAuthenticated,
      user,
      proStatus.isPro,
      proStatus.source,
      trialStartMs,
      trialResolved,
      trialOwner,
      now,
    ],
  );

  useEffect(() => {
    setEntitlementsCache(state, user?.uid ?? null);
  }, [state, user?.uid]);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    document.addEventListener("visibilitychange", refresh);
    document.addEventListener("resume", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    const remaining =
      trialStartMs == null ? 0 : trialStartMs + 21 * 86400000 - Date.now();
    // Update countdown at day boundaries and access at expiry; no high-frequency polling.
    const timer =
      remaining > 0
        ? window.setTimeout(
            refresh,
            Math.min(remaining, remaining % 86400000 || 86400000) + 5,
          )
        : undefined;
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
      document.removeEventListener("resume", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [trialStartMs, now]);
  return state;
}
