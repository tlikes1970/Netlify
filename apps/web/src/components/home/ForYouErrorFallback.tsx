import { t as coreText, useLanguage } from "@/lib/language";
type ForYouErrorFallbackProps = {
  onRetry: () => void;
  isOnline: boolean;
  compact?: boolean;
};

/** Compact For You fetch/offline fallback — no infinite skeletons. */
export function ForYouErrorFallback({
  onRetry,
  isOnline,
  compact = false,
}: ForYouErrorFallbackProps) {
  useLanguage();
  return (
    <div
      className={compact ? 'py-2 text-center' : 'px-4 py-3 text-center'}
      data-testid="for-you-error"
      role="status"
    >
      <p
        className="text-sm font-medium"
        style={{ color: 'var(--text)' }}
      >
        Recommendations couldn&apos;t load.
      </p>
      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
        {isOnline
          ? coreText("coreCheckConnection")
          : coreText("coreOfflineRecommendations")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
        style={{
          backgroundColor: 'var(--btn)',
          color: 'var(--text)',
          border: '1px solid var(--line)',
        }}
      >{coreText("coreRetry")}</button>
    </div>
  );
}
