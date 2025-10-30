import TabCard from '@/components/cards/TabCard';
import type { MediaItem } from '@/components/cards/card.types';
import { Library, LibraryEntry } from '@/lib/storage';
import { useSettings, getPersonalityText } from '@/lib/settings';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import ScrollToTopArrow from '@/components/ScrollToTopArrow';
import { EpisodeTrackingModal } from '@/components/modals/EpisodeTrackingModal';
import { getTVShowDetails } from '@/lib/tmdb';
import { useState, useMemo } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ListPage({ title, items, mode = 'watching', onNotesEdit, onTagsEdit, onNotificationToggle, onSimpleReminder, onBloopersOpen, onExtrasOpen }: {
  title: string;
  items: LibraryEntry[];
  mode?: 'watching'|'want'|'watched'|'returning'|'discovery';
  onNotesEdit?: (item: MediaItem) => void;
  onTagsEdit?: (item: MediaItem) => void;
  onNotificationToggle?: (item: MediaItem) => void;
  onSimpleReminder?: (item: MediaItem) => void;
  onBloopersOpen?: (item: MediaItem) => void;
  onExtrasOpen?: (item: MediaItem) => void;
}) {
  const settings = useSettings();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortByTag, setSortByTag] = useState<boolean>(false);
  const [episodeModalOpen, setEpisodeModalOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<MediaItem | null>(null);
  const [showDetails, setShowDetails] = useState<any>(null);
  
  // Map mode to CardV2 context
  // const context = mode === 'watching' ? 'tab-watching' : 'tab-foryou'; // Unused

  // Get all unique tags from items
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [items]);

  // Filter and sort items
  const processedItems = useMemo(() => {
    let result = items;
    
    // Filter by selected tag
    if (selectedTag) {
      result = result.filter(item => item.tags && item.tags.includes(selectedTag));
    }
    
    // Sort by tag if enabled
    if (sortByTag) {
      result = [...result].sort((a, b) => {
        const aHasTags = a.tags && a.tags.length > 0;
        const bHasTags = b.tags && b.tags.length > 0;
        
        // Items with tags come first
        if (aHasTags && !bHasTags) return -1;
        if (!aHasTags && bHasTags) return 1;
        
        // If both have tags, sort alphabetically by first tag
        if (aHasTags && bHasTags) {
          const aFirstTag = a.tags![0].toLowerCase();
          const bFirstTag = b.tags![0].toLowerCase();
          return aFirstTag.localeCompare(bFirstTag);
        }
        
        // If neither has tags, maintain original order
        return 0;
      });
    }
    
    return result;
  }, [items, selectedTag, sortByTag]);

  // Drag and drop functionality
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (mode !== 'discovery') {
      Library.reorder(mode as any, fromIndex, toIndex);
    }
  };

  const {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(processedItems.map(item => ({ ...item, id: String(item.id) })), handleReorder);

  // Get appropriate empty state text based on title
  const getEmptyText = () => {
    if (mode === 'returning') {
      return 'No returning shows yet. When a series is confirmed, it’ll show up here automatically.';
    }
    if (title.toLowerCase().includes('watching')) {
      return getPersonalityText('emptyWatching', settings.personalityLevel);
    } else if (title.toLowerCase().includes('wishlist') || title.toLowerCase().includes('want')) {
      return getPersonalityText('emptyWishlist', settings.personalityLevel);
    } else if (title.toLowerCase().includes('watched')) {
      return getPersonalityText('emptyWatched', settings.personalityLevel);
    } else if (title.toLowerCase().includes('not interested')) {
      return getPersonalityText('empty', settings.personalityLevel) || "No items marked as not interested yet.";
    }
    return getPersonalityText('empty', settings.personalityLevel);
  };

  // Action handlers using new Library system
  const actions = {
    onWant: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, 'wishlist');
      }
    },
    onWatched: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, 'watched');
      }
    },
    onNotInterested: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, 'not');
      }
    },
    onDelete: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.remove(item.id, item.mediaType);
      }
    },
    onRatingChange: (item: MediaItem, rating: number) => {
      if (item.id && item.mediaType) {
        Library.updateRating(item.id, item.mediaType, rating);
      }
    },
    onNotesEdit: onNotesEdit,
    onTagsEdit: onTagsEdit,
    onEpisodeTracking: async (item: MediaItem) => {
      if (item.mediaType === 'tv') {
        setSelectedShow(item);
        setEpisodeModalOpen(true);
        
        // Fetch real show details from TMDB
        try {
          const showId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
          const details = await getTVShowDetails(showId);
          setShowDetails(details);
        } catch (error) {
          console.error('Failed to fetch show details:', error);
          // Still open modal with basic info
          setShowDetails({
            id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
            name: item.title,
            number_of_seasons: 1,
            number_of_episodes: 1
          });
        }
      }
    },
    onNotificationToggle: onNotificationToggle,
    onSimpleReminder: onSimpleReminder,
    onBloopersOpen: onBloopersOpen,
    onExtrasOpen: onExtrasOpen,
  };

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{title}</h1>
          {sortByTag && (
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              🏷️ Sorted by Tag
            </span>
          )}
        </div>
        
        {/* Tag Controls */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-3">
            {/* Sort by Tag Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sortByTag}
                onChange={(e) => setSortByTag(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Sort by tag</span>
            </label>
            
            {/* Tag Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Filter by tag:</span>
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="px-2 py-1 rounded text-sm border"
                style={{ 
                  backgroundColor: 'var(--input-bg)', 
                  borderColor: 'var(--line)', 
                  color: 'var(--text)' 
                }}
              >
                <option value="">All items</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              {(selectedTag || sortByTag) && (
                <button
                  onClick={() => { setSelectedTag(null); setSortByTag(false); }}
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {processedItems.length > 0 ? (
        <ErrorBoundary name="MobileList" onReset={() => {
          // ListPage receives data as props, so parent component should handle refetch
          // This will reset the error boundary state
        }}>
          <div className="space-y-3">
            {processedItems.map((item, index) => {
              // LibraryEntry already has all MediaItem properties
              const mediaItem: MediaItem = {
                id: item.id,
                mediaType: item.mediaType,
                title: item.title,
                posterUrl: item.posterUrl,
                year: item.year,
                voteAverage: item.voteAverage,
                userRating: item.userRating,
                synopsis: item.synopsis,
                nextAirDate: item.nextAirDate,
                showStatus: item.showStatus,    // ✅ ADD THIS
                lastAirDate: item.lastAirDate,  // ✅ ADD THIS
                userNotes: item.userNotes, // Pass notes
                tags: item.tags,           // Pass tags
              };

              return (
                <TabCard
                  key={item.id}
                  item={mediaItem}
                  actions={actions}
                  tabType={mode}
                  index={index}
                  dragState={dragState}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
        </ErrorBoundary>
      ) : (
        <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
          <p className="text-sm">
            {selectedTag 
              ? `No items found with tag "${selectedTag}"`
              : sortByTag
              ? 'No items with tags found'
              : getEmptyText()
            }
          </p>
          <p className="text-xs mt-2">
            {selectedTag 
              ? 'Try selecting a different tag or clear the filter'
              : sortByTag
              ? 'Add tags to items to see them when sorting by tag'
              : 'Add some shows to get started!'
            }
          </p>
        </div>
      )}

      {/* Scroll to top arrow - appears when scrolled down */}
      <ScrollToTopArrow threshold={300} />

      {/* Episode Tracking Modal */}
      {selectedShow && (
        <EpisodeTrackingModal
          isOpen={episodeModalOpen}
          onClose={() => {
            setEpisodeModalOpen(false);
            setSelectedShow(null);
            setShowDetails(null);
          }}
          show={showDetails || {
            id: typeof selectedShow.id === 'string' ? parseInt(selectedShow.id) : selectedShow.id,
            name: selectedShow.title,
            number_of_seasons: 1,
            number_of_episodes: 1
          }}
        />
      )}

    </section>
  );
}
