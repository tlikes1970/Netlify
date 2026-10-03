import { t, useLanguage } from "../lib/language";
import { useEntitlements } from '../hooks/useEntitlements';
import { getTrialStatusLabel } from '../lib/entitlements';
import { startProUpgrade } from '../lib/proUpgrade';

/**
 * Visible trial / read-only reminder (header strip).
 */
export function TrialStatusBanner() {
  useLanguage();
  const entitlements = useEntitlements();
  const label = getTrialStatusLabel(entitlements);

  if (!label) return null;

  const isExpired = entitlements.phase === 'expiredReadOnly';

  return (
    <div className="flicklet-safe-inline">
    <div
      className="w-full px-3 py-2 text-center text-sm font-medium border-b"
      style={{
        backgroundColor: isExpired ? 'var(--card)' : 'var(--accent-primary)',
        color: isExpired ? 'var(--text)' : '#fff',
        borderColor: 'var(--line)',
      }}
      role="status"
    >
      <span>{label}</span>
      {isExpired && (
        <>
          {' '}
          <button
            type="button"
            className="underline font-semibold ml-1"
            onClick={() => void startProUpgrade()}
          >
            {t("accessUnlock")}
          </button>
        </>
      )}
      {entitlements.phase === 'activeTrial' && (
        <span className="opacity-90 ml-1">{t("accessTrialSuffix")}</span>
      )}
    </div>
    </div>
  );
}
