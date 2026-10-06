import {handleTabKeyboard} from '../lib/a11y/tabKeyboard';
import { t as coreText, useLanguage, tPlural } from "@/lib/language";
import type { LibrarySegment } from '@/lib/navigation';

export type LibrarySegmentCounts = Record<LibrarySegment, number>;

export type LibrarySegmentBarProps = {
  segment: LibrarySegment;
  counts: LibrarySegmentCounts;
  onChange: (segment: LibrarySegment) => void;
};

const SEGMENTS: {
  id: LibrarySegment;
  label: 'coreWatching' | 'coreWant' | 'coreWatched' | 'coreCustomLists';
  shortLabel: 'coreWatching' | 'coreWant' | 'coreWatched' | 'coreLists';
}[] = [
  { id: 'watching', label: 'coreWatching', shortLabel: 'coreWatching' },
  { id: 'want', label: 'coreWant', shortLabel: 'coreWant' },
  { id: 'watched', label: 'coreWatched', shortLabel: 'coreWatched' },
  { id: 'mylists', label: 'coreCustomLists', shortLabel: 'coreLists' },
];

function formatCount(count: number): string {
  if (count > 999) return '999+';
  return String(count);
}

/**
 * In-library segment control (not bottom nav). Compact 4-column grid on mobile;
 * sticky below the app search bar while scrolling.
 */
export default function LibrarySegmentBar({
  segment,
  counts,
  onChange,
}: LibrarySegmentBarProps) {
  useLanguage();
  return (
    <nav aria-label={coreText("coreLibrarySections")} className="library-segment-bar">
      <div role="tablist" aria-label={coreText("coreLibraryLists")} className="library-segment-bar__grid">
        {SEGMENTS.map((item) => {
          const active = segment === item.id;
          const count = counts[item.id] ?? 0;
          const ariaLabel = `${coreText(item.label)}, ${tPlural(item.id === 'mylists' ? {one:'coreListOne',other:'coreListsOther'} : {one:'coreItemOne',other:'coreItemsOther'},count)}`;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              tabIndex={active ? 0 : -1}
              onKeyDown={handleTabKeyboard}
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
              <span className="library-segment-bar__label md:hidden">{coreText(item.shortLabel)}</span>
              <span className="library-segment-bar__label hidden md:inline">{coreText(item.label)}</span>
              <span className="library-segment-bar__count">{formatCount(count)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
