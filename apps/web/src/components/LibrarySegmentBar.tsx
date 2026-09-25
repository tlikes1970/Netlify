import type { LibrarySegment } from '@/lib/navigation';

export type LibrarySegmentCounts = Record<LibrarySegment, number>;

export type LibrarySegmentBarProps = {
  segment: LibrarySegment;
  counts: LibrarySegmentCounts;
  onChange: (segment: LibrarySegment) => void;
};

const SEGMENTS: {
  id: LibrarySegment;
  label: string;
  shortLabel: string;
}[] = [
  { id: 'watching', label: 'Watching', shortLabel: 'Watch' },
  { id: 'want', label: 'Want', shortLabel: 'Want' },
  { id: 'watched', label: 'Watched', shortLabel: 'Seen' },
  { id: 'returning', label: 'Returning', shortLabel: 'Return' },
  { id: 'mylists', label: 'My Lists', shortLabel: 'Lists' },
];

function formatCount(count: number): string {
  if (count > 999) return '999+';
  return String(count);
}

/**
 * In-library segment control (not bottom nav). Compact 5-column grid on mobile;
 * sticky below the app search bar while scrolling.
 */
export default function LibrarySegmentBar({
  segment,
  counts,
  onChange,
}: LibrarySegmentBarProps) {
  return (
    <nav aria-label="Library sections" className="library-segment-bar">
      <div role="tablist" aria-label="Library lists" className="library-segment-bar__grid">
        {SEGMENTS.map((item) => {
          const active = segment === item.id;
          const count = counts[item.id] ?? 0;
          const ariaLabel = `${item.label}, ${count} ${count === 1 ? 'item' : 'items'}`;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={ariaLabel}
              title={ariaLabel}
              onClick={() => onChange(item.id)}
              className="library-segment-bar__segment"
              style={{
                backgroundColor: active ? 'var(--accent)' : 'var(--card)',
                color: active ? '#fff' : 'var(--text)',
                border: active ? 'none' : '1px solid var(--line)',
              }}
            >
              <span className="library-segment-bar__label md:hidden">{item.shortLabel}</span>
              <span className="library-segment-bar__label hidden md:inline">{item.label}</span>
              <span className="library-segment-bar__count">{formatCount(count)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
