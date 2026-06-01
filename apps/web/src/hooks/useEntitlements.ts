import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { useProStatus } from '../lib/proStatus';
import { auth } from '../lib/firebaseBootstrap';
import {
  ensureTrialStartMs,
  resolveEntitlements,
  setEntitlementsCache,
  type EntitlementState,
} from '../lib/entitlements';

export { getEntitlementsSync } from '../lib/entitlements';

export function useEntitlements(): EntitlementState {
  const { user, isAuthenticated } = useAuth();
  const proStatus = useProStatus();
  const [trialStartMs, setTrialStartMs] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setTrialStartMs(null);
      return;
    }
    const creationTime = auth.currentUser?.metadata?.creationTime;
    const start = ensureTrialStartMs(user.uid, creationTime);
    setTrialStartMs(start);
  }, [user?.uid]);

  const state = useMemo(
    () =>
      resolveEntitlements({
        isAuthenticated: !!isAuthenticated && !!user,
        paidPro: proStatus.isPro,
        proSource: proStatus.source,
        trialStartMs,
      }),
    [
      isAuthenticated,
      user,
      proStatus.isPro,
      proStatus.source,
      trialStartMs,
    ]
  );

  useEffect(() => {
    setEntitlementsCache(state);
  }, [state]);

  return state;
}
