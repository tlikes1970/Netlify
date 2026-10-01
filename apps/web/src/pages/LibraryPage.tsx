import LibrarySegmentBar from '@/components/LibrarySegmentBar';
import type { LibrarySegmentCounts } from '@/components/LibrarySegmentBar';
import type { LibrarySegment } from '@/lib/navigation';
import type { LibraryEntry } from '@/lib/storage';
import type { MediaItem } from '@/components/cards/card.types';
import { useCustomLists } from '@/lib/customLists';
import ListPage from '@/pages/ListPage';
import MyListsPage from '@/pages/MyListsPage';
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper';

export type LibraryPageProps = {
  onBackFromCustomLists?: () => void;
  segment: LibrarySegment;
  onSegmentChange: (segment: LibrarySegment) => void;
  watchingItems: LibraryEntry[];
  wishlistItems: LibraryEntry[];
  watchedItems: LibraryEntry[];
  onRefresh: () => void | Promise<void>;
  onNotesEdit?: (item: MediaItem) => void;
  onTagsEdit?: (item: MediaItem) => void;
  onNotificationToggle?: (item: MediaItem) => void;
  onSimpleReminder?: (item: MediaItem) => void;
  onBloopersOpen?: (item: MediaItem) => void;
  onGoofsOpen?: (item: MediaItem) => void;
  onExtrasOpen?: (item: MediaItem) => void;
};

export default function LibraryPage({
  segment,
  onBackFromCustomLists,
  onSegmentChange,
  watchingItems,
  wishlistItems,
  watchedItems,
  onRefresh,
  onNotesEdit,
  onTagsEdit,
  onNotificationToggle,
  onSimpleReminder,
  onBloopersOpen,
  onGoofsOpen,
  onExtrasOpen,
}: LibraryPageProps) {
  const userLists = useCustomLists();

  const segmentCounts: LibrarySegmentCounts = {
    watching: watchingItems.length,
    want: wishlistItems.length,
    watched: watchedItems.length,
    mylists: userLists.customLists.reduce(
      (sum, list) => sum + (list.itemCount ?? 0),
      0
    ),
  };

  const listHandlers = {
    onNotesEdit,
    onTagsEdit,
    onNotificationToggle,
    onSimpleReminder,
    onBloopersOpen,
    onGoofsOpen,
    onExtrasOpen,
  };

  return (
    <div data-page="library" data-library-segment={segment}>
      <LibrarySegmentBar
        segment={segment}
        counts={segmentCounts}
        onChange={onSegmentChange}
      />

      {segment === 'mylists' ? (
        <div data-page="lists" data-list="mylists" className="px-1 md:px-0">
          <MyListsPage onBack={onBackFromCustomLists || (() => onSegmentChange("watching"))} />
        </div>
      ) : (
        <PullToRefreshWrapper onRefresh={onRefresh}>
          {segment === 'watching' && (
            <div data-page="lists" data-list="watching">
              <ListPage
                title="Watching"
                items={watchingItems}
                mode="watching"
                {...listHandlers}
              />
            </div>
          )}
          {segment === 'want' && (
            <div data-page="lists" data-list="wishlist">
              <ListPage
                title="Want to Watch"
                items={wishlistItems}
                mode="want"
                {...listHandlers}
              />
            </div>
          )}
          {segment === 'watched' && (
            <div data-page="lists" data-list="watched">
              <ListPage
                title="Watched"
                items={watchedItems}
                mode="watched"
                {...listHandlers}
              />
            </div>
          )}
        </PullToRefreshWrapper>
      )}
    </div>
  );
}
