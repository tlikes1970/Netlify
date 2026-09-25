import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { useProStatus } from '../lib/proStatus';
import {
  loadTrialRecord,
  resolveEntitlements,
  setEntitlementsCache,
  type EntitlementState,
} from '../lib/entitlements';
import { resolveServerTrialStartMs } from '../lib/trialEntitlement';

export { getEntitlementsSync } from '../lib/entitlements';

export function useEntitlements(): EntitlementState {
  const { user, isAuthenticated } = useAuth();
  const proStatus = useProStatus();
  const [trialStartMs, setTrialStartMs] = useState<number | null>(null);
  const [trialResolved, setTrialResolved] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setTrialStartMs(null);
      setTrialResolved(false);
      return;
    }

    let cancelled = false;
    const userId = user.uid;
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
        console.error('[Entitlements] Failed to resolve server trial:', error);
        if (cancelled) return;
        if (cached) {
          setTrialStartMs(cached.startMs);
        } else {
          setTrialStartMs(null);
        }
        setTrialResolved(true);
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
        trialStartMs,
        trialResolved,
      }),
    [
      isAuthenticated,
      user,
      proStatus.isPro,
      proStatus.source,
      trialStartMs,
      trialResolved,
    ]
  );

  useEffect(() => {
    setEntitlementsCache(state);
  }, [state]);

  return state;
}
