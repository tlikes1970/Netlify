/**
 * Process: Pro Badge Component
 * Purpose: Display gold "PRO" badge next to usernames for Pro users
 * Data Source: authorIsPro boolean from post/comment/reply data
 * Update Path: N/A - display component
 * Dependencies: None
 */

interface ProBadgeProps {
  isPro?: boolean;
  compact?: boolean;
}

export default function ProBadge({ isPro, compact = false }: ProBadgeProps) {
  if (!isPro) return null;

  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: '#fbbf24',
        color: '#1f2937',
      }}
      title="Pro User"
    >
      PRO
    </span>
  );
}

