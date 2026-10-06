import { t as coreText, useLanguage } from "@/lib/language";
import { libraryIdentity, processLibraryItems } from '@/lib/libraryView';
import TabCard from "@/components/cards/TabCard";
import type { MediaItem } from "@/components/cards/card.types";
import { getItemSynopsis } from "@/lib/itemSynopsis";
import { backfillSynopsisForItems } from "@/utils/backfillSynopsis";
import { removeMediaItemWithConfirmation } from "@/lib/confirmRemoveShow";
import { Library, LibraryEntry } from "@/lib/storage";
import { setPrimaryStatus, setNotInterested } from "@/lib/statusTransitions";
import { useSettings, resolveFlickletLine } from "@/lib/settings";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { EpisodeTrackingModal } from "@/components/modals/EpisodeTrackingModal";
import { getTVShowDetails } from "@/lib/tmdb";
import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import SortDropdown, { type SortMode } from "@/components/SortDropdown";
import ListFilters, { type ListFiltersState } from "@/components/ListFilters";
import {
  getTabKey,
  restoreTabState,
  saveTabState,
  TAB_STATE_CHANGED,
  networkOptions,
  validateFilters,
  type TabState,
} from "@/lib/tabState";
import {
  trackSortChange,
  trackFilterChange,
  trackReorderCompleted,
} from "@/lib/analytics";
import { flushPendingSaves } from "@/lib/storage";

export default function ListPage({
  title,
  items,
  mode = "watching",
  onNotesEdit,
  onTagsEdit,
  onNotificationToggle,
  onSimpleReminder,
  onBloopersOpen,
  onGoofsOpen,
  onExtrasOpen,
  onEpisodeTracking,
}: {
  title: string;
  items: LibraryEntry[];
  mode?: "watching" | "want" | "watched" | "returning" | "discovery";
  onNotesEdit?: (item: MediaItem) => void;
  onTagsEdit?: (item: MediaItem) => void;
  onNotificationToggle?: (item: MediaItem) => void;
  onSimpleReminder?: (item: MediaItem) => void;
  onBloopersOpen?: (item: MediaItem) => void;
  onGoofsOpen?: (item: MediaItem) => void;
  onExtrasOpen?: (item: MediaItem) => void;
  onEpisodeTracking?: (item: MediaItem) => void;
}) {
  useLanguage();
  const settings = useSettings();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortByTag, setSortByTag] = useState<boolean>(false);
  const [episodeModalOpen, setEpisodeModalOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<MediaItem | null>(null);
  const [showDetails, setShowDetails] = useState<any>(null);

  const tabKey = getTabKey(mode);

  // Get available item IDs for validation
  const availableItemIds = useMemo(() => {
    const ids = new Set<string>();
    items.forEach((item) => {
      ids.add(String(item.id));
      ids.add(`${item.id}:${item.mediaType}`);
    });
    return ids;
  }, [items]);

  // Restore tab state using unified utilities
  const [tabState, setTabStateInternal] = useState<TabState>(() => {
    return restoreTabState(tabKey, availableItemIds);
  });

  const [sortMode, setSortMode] = useState<SortMode>(tabState.sort);
  const [filters, setFilters] = useState<ListFiltersState>(tabState.filter);

  // Map mode to CardV2 context
  // const context = mode === 'watching' ? 'tab-watching' : 'tab-foryou'; // Unused

  // Get all unique tags from items
  const allTags = useMemo(() => {
    const tagSet = new Map<string, string>();
    items.forEach((item) => {
      if (item.tags) {
        item.tags.forEach((tag) => { const key = tag.trim().toLowerCase(); if (!tagSet.has(key)) tagSet.set(key, tag); });
      }
    });
    return Array.from(tagSet.values()).sort();
  }, [items]);

  // Keep the selected identity, using the current stored display casing when available.
  useEffect(() => {
    if (!selectedTag) return;
    const canonical = allTags.find(tag => tag.trim().toLowerCase() === selectedTag.trim().toLowerCase());
    if (canonical && canonical !== selectedTag) setSelectedTag(canonical);
  }, [allTags, selectedTag]);

  // Get all unique providers from items
  const availableProviders = useMemo(() => {
    const providerSet = new Set<string>();
    items.forEach((item) => {
      if (item.networks && Array.isArray(item.networks)) {
        item.networks.forEach((provider) => {
          if (provider && typeof provider === "string") {
            providerSet.add(provider);
          }
        });
      }
    });
    return networkOptions(Array.from(providerSet));
  }, [items]);

  // Both local reorder events and completed cloud restores refresh mounted tabs.
  useEffect(() => {
    const restore = () => {
      const restored = restoreTabState(tabKey, availableItemIds);
      setTabStateInternal(restored);
      setSortMode(restored.sort);
      setFilters(validateFilters(restored.filter, availableProviders));
    };
    const handleRestore = (event: Event) => {
      const detail = (event as CustomEvent<{tabKey: string; source?: string}>).detail;
      if (detail?.tabKey !== tabKey) return;
      if (detail.source === 'cloud') setSortByTag(false);
      restore();
    };
    restore();
    window.addEventListener(TAB_STATE_CHANGED, handleRestore);
    return () => window.removeEventListener(TAB_STATE_CHANGED, handleRestore);
  }, [tabKey, availableItemIds, availableProviders]);

  // Handler for sort mode change with confirmation
  const handleSortModeChange = useCallback(
    (newMode: SortMode) => {
      if (newMode !== sortMode) trackSortChange(tabKey, newMode, sortMode);
      setSortByTag(false);
      setSortMode(newMode);
      void saveTabState(tabKey, { sort: newMode });
    },
    [sortMode, tabKey]
  );

  // Handler for filter change with validation and telemetry
  const handleFilterChange = useCallback(
    (newFilters: ListFiltersState) => {
      // Validate filters against available providers
      const validatedFilters = validateFilters(newFilters, availableProviders);
      setFilters(validatedFilters);
      void saveTabState(tabKey, { filter: validatedFilters });
      trackFilterChange(
        tabKey,
        validatedFilters.type,
        validatedFilters.providers.length
      );
    },
    [tabKey, availableProviders]
  );

  const processedItems = useMemo(() => mode === 'returning' ? items :
    processLibraryItems(items, filters, selectedTag, sortByTag, sortMode, tabState.order?.ids),
    [items, filters, selectedTag, sortByTag, sortMode, mode, tabState.order]);

  // Fetch missing TMDB overviews for Want/Watched items (common gap vs search adds)
  useEffect(() => {
    if (mode !== "want" && mode !== "watched") return;
    if (processedItems.length === 0) return;

    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await backfillSynopsisForItems(processedItems);
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, processedItems]);

  // Map mode to Library list name
  const getListName = (
    mode: string
  ): "watching" | "wishlist" | "watched" | null => {
    switch (mode) {
      case "watching":
        return "watching";
      case "want":
        return "wishlist";
      case "watched":
        return "watched";
      case "returning":
        // Returning is not a standard ListName, return null
        return null;
      default:
        return null;
    }
  };

  // Drag and drop functionality
  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (mode !== "discovery") {
        // Capture positions BEFORE reorder (critical for FLIP animation)
        const cardMap = cardRefs.current;
        const currentRects = new Map<string, DOMRect>();
        processedItems.forEach((item) => {
          const el = cardMap.get(libraryIdentity(item));
          if (el) {
            currentRects.set(String(item.id), el.getBoundingClientRect());
          }
        });
        prevRects.current = currentRects;
        pendingReorderRef.current = { fromIndex, toIndex };

        console.log("[ListPage] Captured positions before reorder", {
          fromIndex,
          toIndex,
          rectCount: currentRects.size,
        });

        // When user manually reorders, switch to Custom mode
        setSortByTag(false);
        const listName = getListName(mode);
        if (listName) {
          Library.reorder(listName, fromIndex, toIndex, processedItems.map(libraryIdentity));
        }

        // Track reorder completion
        trackReorderCompleted(tabKey, fromIndex, toIndex);

        // Clear pending reorder after animation completes
        setTimeout(() => {
          pendingReorderRef.current = null;
        }, 500);
      }
    },
    [mode, processedItems, tabKey]
  );

  const {
    dragState,
    handleDragStart,
    handleDragEnd: originalHandleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(
    processedItems.map((item) => ({ ...item, id: libraryIdentity(item) })),
    handleReorder
  );

  // Wrap handleDragEnd to flush pending saves on drop completion
  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      originalHandleDragEnd(e);
      // Flush pending saves immediately after drop completes
      flushPendingSaves();
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info("[reorder] flushed on drop completion");
      }
    },
    [originalHandleDragEnd]
  );

  // Aria-live region for accessibility announcements
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");

  // Keyboard reordering
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map()); // Track by item ID, not index
  const prevRects = useRef<Map<string, DOMRect>>(new Map());
  const pendingReorderRef = useRef<{
    fromIndex: number;
    toIndex: number;
  } | null>(null);
  const getItemElement = useCallback(
    (index: number) => {
      const item = processedItems[index];
      return item ? cardRefs.current.get(libraryIdentity(item)) || null : null;
    },
    [processedItems]
  );

  const announceChange = useCallback((message: string) => {
    setAriaAnnouncement(message);
    // Clear after announcement is read
    setTimeout(() => setAriaAnnouncement(""), 1000);
  }, []);

  const handleKeyboardReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      handleReorder(fromIndex, toIndex);
      const item = processedItems[fromIndex];
      const direction = toIndex > fromIndex ? "down" : "up";
      announceChange(
        coreText('coreReordered', {title:item.title,direction:coreText(direction === 'up' ? 'coreUp' : 'coreDown'),position:toIndex+1,total:processedItems.length})
      );

      // Maintain focus on handle after reorder
      // Use setTimeout to allow DOM to update first
      setTimeout(() => {
        const newElement = getItemElement(toIndex);
        if (newElement) {
          const handle = newElement.querySelector(
            ".handle, .drag-handle"
          ) as HTMLElement;
          if (handle) {
            handle.focus();
          }
        }
      }, 50);
    },
    [processedItems, handleReorder, announceChange, getItemElement]
  );

  // Stable item IDs array for FLIP dependency (prevents unnecessary re-runs)
  const itemIds = useMemo(
    () => processedItems.map((i) => String(i.id)),
    [processedItems]
  );

  // FLIP animation for smooth reorder transitions
  // Disabled during active drag to prevent conflicts with drag transform
  // Feature flag: drag-animation-v1 (enabled by default, can be disabled for rollback)
  const isAnimationDisabled = useMemo(() => {
    // Check if explicitly disabled: if flag exists and is 'false', disable animation
    if (typeof window !== "undefined") {
      try {
        const flagValue = localStorage.getItem("flag:drag-animation-v1");
        return flagValue === "false";
      } catch {
        // Ignore localStorage errors
      }
    }
    return false; // Default: animation enabled
  }, []);

  useLayoutEffect(() => {
    if (!processedItems.length || dragState.isDragging || isAnimationDisabled) {
      console.log("[ListPage] FLIP skipped", {
        hasItems: !!processedItems.length,
        isDragging: dragState.isDragging,
        isDisabled: isAnimationDisabled,
      });
      return;
    }

    // Only run FLIP if we have a pending reorder (prevents running on every render)
    if (!pendingReorderRef.current) {
      console.log("[ListPage] FLIP skipped - no pending reorder");
      return;
    }

    console.log("[ListPage] FLIP running", {
      itemCount: processedItems.length,
      itemIds: itemIds.join(","),
      pendingReorder: pendingReorderRef.current,
    });

    const cardMap = cardRefs.current;
    const prevMap = prevRects.current; // This was captured BEFORE reorder in handleReorder
    const nextRects = new Map<string, DOMRect>();

    // 2. Let React commit the reorder (positions are already captured in handleReorder)
    requestAnimationFrame(() => {
      // 3. Read new positions - track by item ID (after reorder)
      processedItems.forEach((item) => {
        const el = cardMap.get(libraryIdentity(item));
        if (el) {
          nextRects.set(String(item.id), el.getBoundingClientRect());
        }
      });

      // 4. Animate each card that moved with enhanced effects
      let animatedCount = 0;
      const animatedCards: Array<{
        el: HTMLElement;
        itemId: string;
        index: number;
      }> = [];

      // First pass: collect all cards that need animation
      nextRects.forEach((nextRect, itemId) => {
        const prevRect = prevMap.get(itemId);
        if (!prevRect) {
          console.log("[ListPage] FLIP no prevRect for", itemId);
          return;
        }

        const dx = prevRect.left - nextRect.left;
        const dy = prevRect.top - nextRect.top;
        if (dx === 0 && dy === 0) {
          console.log("[ListPage] FLIP no movement for", itemId);
          return;
        }

        const el = cardMap.get(itemId);
        if (!el) {
          console.log("[ListPage] FLIP no element for", itemId);
          return;
        }

        // Find index of this item for stagger calculation
        const itemIndex = processedItems.findIndex(
          (item) => String(item.id) === itemId
        );
        animatedCards.push({
          el,
          itemId,
          index: itemIndex >= 0 ? itemIndex : 0,
        });
      });

      // Sort by index for proper stagger order
      animatedCards.sort((a, b) => a.index - b.index);

      // Second pass: apply FLIP animation with enhanced effects
      animatedCards.forEach(({ el, itemId, index }) => {
        const prevRect = prevMap.get(itemId);
        const nextRect = nextRects.get(itemId);
        if (!prevRect || !nextRect) return;

        const dx = prevRect.left - nextRect.left;
        const dy = prevRect.top - nextRect.top;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Dynamic duration based on distance (medium priority)
        // Base duration 0.3s, scales with distance up to 0.6s
        const baseDuration = 0.3;
        const maxDuration = 0.6;
        const duration = Math.min(baseDuration + distance / 1500, maxDuration);

        // Calculate rotation angle based on direction (flip effect)
        const rotationAngle =
          Math.abs(dy) > Math.abs(dx)
            ? dy > 0
              ? -3
              : 3 // Rotate based on vertical movement
            : dx > 0
              ? -2
              : 2; // Rotate based on horizontal movement

        // Stagger delay: 20ms per card (high priority)
        const staggerDelay = index * 20;

        console.log("[ListPage] FLIP animating card", {
          itemId,
          dx,
          dy,
          distance,
          duration,
          rotationAngle,
          staggerDelay,
        });

        // FLIP: INVERT - Set initial state with flip and scale
        // Add perspective for 3D effect
        el.style.perspective = "1000px";
        el.style.transform = `translate(${dx}px, ${dy}px) rotateX(${rotationAngle}deg) scale(0.95)`;
        el.style.transition = "transform 0s, opacity 0s";
        el.style.opacity = "0.9";
        // Ensure z-index is elevated during animation (below modals)
        el.style.zIndex = "100"; // Matches --z-dragging token
        el.style.position = "relative";
        el.style.transformStyle = "preserve-3d";

        // Stagger the animation start
        setTimeout(() => {
          requestAnimationFrame(() => {
            // FLIP: PLAY - Smooth animated transition with spring physics
            // Spring easing: cubic-bezier(.34, 1.56, .64, 1) creates bounce effect
            el.style.transition = `transform ${duration}s cubic-bezier(.34, 1.56, .64, 1), opacity ${duration}s ease-out`;
            el.style.transform = "translate(0, 0) rotateX(0deg) scale(1)";
            el.style.opacity = "1";

            el.addEventListener(
              "transitionend",
              () => {
                if (el) {
                  el.style.transition = "";
                  el.style.zIndex = "";
                  el.style.position = "";
                  el.style.perspective = "";
                  el.style.transformStyle = "";
                  el.style.opacity = "";
                  animatedCount++;
                  console.log("[ListPage] FLIP animation complete", {
                    itemId,
                    animatedCount,
                  });
                }
              },
              { once: true }
            );
          });
        }, staggerDelay);
      });

      if (animatedCount === 0) {
        console.log("[ListPage] FLIP no cards moved", {
          prevMapSize: prevMap.size,
          nextRectsSize: nextRects.size,
          itemIds: Array.from(nextRects.keys()),
        });
      }

      // 5. Store for next flip
      prevRects.current = nextRects;
    });
  }, [itemIds.join(","), dragState.isDragging, isAnimationDisabled]); // re-run only when order changes or drag ends

  // Listen for touch drag over events from DragHandle
  useEffect(() => {
    const handleTouchDragOver = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log("[ListPage] touchdragover", customEvent.detail);
      if (customEvent.detail && dragState.isDragging) {
        const targetIndex = customEvent.detail.targetIndex;
        if (targetIndex >= 0 && targetIndex !== dragState.draggedItem?.index) {
          const syntheticEvent = {
            preventDefault: () => {},
            stopPropagation: () => {},
            dataTransfer: { dropEffect: "move" },
            currentTarget: customEvent.target,
          } as any;
          handleDragOver(syntheticEvent, targetIndex);
        }
      }
    };

    document.addEventListener(
      "touchdragover",
      handleTouchDragOver as EventListener
    );
    return () => {
      document.removeEventListener(
        "touchdragover",
        handleTouchDragOver as EventListener
      );
    };
  }, [dragState, handleDragOver]);

  // Get appropriate empty state text based on title
  const getEmptyText = () => {
    const level = settings.personalityLevel;
    if (mode === "returning") {
      return (
        resolveFlickletLine("empty.upnext", level) ||
        "No upcoming releases yet. Add TV series to Currently Watching or Watched and they'll appear here when schedule information is available."
      );
    }
    if (mode === 'watching') {
      return resolveFlickletLine("empty.watching", level);
    }
    if (
      mode === 'want'
    ) {
      return resolveFlickletLine("empty.want", level);
    }
    if (mode === 'watched') {
      return resolveFlickletLine("empty.watched", level);
    }
    if (title.toLowerCase().includes("not interested")) {
      return "No items marked as not interested yet.";
    }
    return resolveFlickletLine("empty.watching", level);
  };

  // Action handlers using new Library system
  const actions = {
    onWant: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        setPrimaryStatus(item, "wishlist", { feedback: true });
      }
    },
    onWatched: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        setPrimaryStatus(item, "watched", { feedback: true });
      }
    },
    onNotInterested: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        void setNotInterested(item);
      }
    },
    onDelete: (item: MediaItem) => {
      removeMediaItemWithConfirmation(item);
    },
    onRatingChange: (item: MediaItem, rating: number) => {
      if (item.id && item.mediaType) {
        Library.updateRating(item.id, item.mediaType, rating);
      }
    },
    onNotesEdit: onNotesEdit,
    onTagsEdit: onTagsEdit,
    onEpisodeTracking: onEpisodeTracking || (async (item: MediaItem) => {
      if (item.mediaType === "tv") {
        setSelectedShow(item);
        setEpisodeModalOpen(true);

        // Fetch real show details from TMDB
        try {
          const showId =
            typeof item.id === "string" ? parseInt(item.id) : item.id;
          const details = await getTVShowDetails(showId);
          setShowDetails(details);
        } catch (error) {
          console.error("Failed to fetch show details:", error);
          // Still open modal with basic info
          setShowDetails({
            id: typeof item.id === "string" ? parseInt(item.id) : item.id,
            name: item.title,
            number_of_seasons: 1,
            number_of_episodes: 1,
          });
        }
      }
    }),
    onNotificationToggle: onNotificationToggle,
    onSimpleReminder: onSimpleReminder,
    onBloopersOpen: onBloopersOpen,
    onGoofsOpen: onGoofsOpen,
    onExtrasOpen: onExtrasOpen,
  };

  // Content wrapper for desktop centering (watching/want/watched tabs only)
  const isListTab = mode === "watching" || mode === "want" || mode === "watched";
  
  return (
    <section className="px-4 py-4">
      {isListTab ? (
          <div className="list-content-column library-list-column">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-base font-semibold"
            style={{ color: "var(--text)" }}
          >
            {title}
          </h1>
          {sortByTag && (
            <span
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: "var(--accent)", color: "white" }}
            >{coreText("coreSortedTag")}</span>
          )}
        </div>

        <div className="library-filter-toolbar flex items-center gap-3 flex-wrap">
          {/* Sort Dropdown - always shown for list tabs */}
          <>
            <SortDropdown
              value={sortMode}
              onChange={handleSortModeChange}
              disabled={false}
            />
            {(sortMode !== 'date-newest' || sortByTag) && (
              <button type="button" className="library-filter-control px-3 rounded text-xs border" onClick={() => handleSortModeChange('date-newest')}>{coreText("coreResetSort")}</button>
            )}
          </>

          {/* Filters - always shown for list tabs */}
          <ListFilters
            value={filters}
            onChange={handleFilterChange}
            availableProviders={availableProviders}
            disabled={false}
          />

          {(filters.type !== 'all' || filters.providers.length > 0 || selectedTag) && (
            <button type="button" className="library-filter-control px-3 rounded text-sm border" onClick={() => {
              setSelectedTag(null);
              handleFilterChange({type: 'all', providers: []});
            }}>{coreText("coreClearFilters")}</button>
          )}

          {/* Tag Controls */}
          {(allTags.length > 0 || selectedTag || sortByTag) && (
            <div className="library-tag-controls flex items-center gap-3 flex-wrap max-w-full">
              {/* Sort by Tag Toggle */}
              <label className="library-tag-sort library-filter-control flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sortByTag}
                  onChange={(e) => {
                    setSortByTag(e.target.checked);
                    // If disabling sort by tag, restore sort mode
                    if (!e.target.checked && sortMode === "custom") {
                      // Keep custom mode if it was set
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: "var(--muted)" }}>{coreText("coreSortTag")}</span>
              </label>

              {/* Tag Filter */}
              <div className="library-tag-filter flex items-center gap-2">
                <span className="text-sm" style={{ color: "var(--muted)" }}>{coreText("coreFilterTag")}</span>
                <select
                  aria-label={coreText("coreFilterTagAria")}
                  value={selectedTag || ""}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                  className="library-filter-control px-2 py-1 rounded text-sm border"
                  style={{
                    backgroundColor: "var(--menu-bg)",
                    borderColor: "var(--menu-border)",
                    color: "var(--menu-text)",
                  }}
                >
                  <option value="">{coreText("coreAllItems")}</option>
                  {selectedTag && !allTags.includes(selectedTag) && <option value={selectedTag}>{selectedTag}</option>}
                  {allTags.map((tag) => (
                    <option
                      key={tag}
                      value={tag}
                      style={{
                        backgroundColor: "var(--menu-bg)",
                        color: "var(--menu-text)",
                      }}
                    >
                      {tag}
                    </option>
                  ))}
                </select>

              </div>
            </div>
          )}
        </div>
      </div>

      {processedItems.length > 0 ? (
        <ErrorBoundary
          name="MobileList"
          onReset={() => {
            // ListPage receives data as props, so parent component should handle refetch
            // This will reset the error boundary state
          }}
        >
          <>
            {/* Aria-live region for accessibility announcements */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
              style={{
                position: "absolute",
                left: "-10000px",
                width: "1px",
                height: "1px",
                overflow: "hidden",
              }}
            >
              {ariaAnnouncement}
            </div>

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
                    synopsis: getItemSynopsis(item),
                    nextAirDate: item.nextAirDate,
                    showStatus: item.showStatus, // ✅ ADD THIS
                    lastAirDate: item.lastAirDate, // ✅ ADD THIS
                    userNotes: item.userNotes, // Pass notes
                    tags: item.tags, // Pass tags
                    networks: item.networks, // ✅ ADD THIS - Pass networks for provider badges
                    productionCompanies: item.productionCompanies, // ✅ ADD THIS
                  };

                  // Check if this item is being dragged (compare by id, not index, since index changes during reorder)
                  const isBeingDragged = dragState.draggedItem?.id === item.id;
                  console.log("[ListPage] Rendering item", {
                    itemId: item.id,
                    index,
                    isBeingDragged,
                    draggedItemId: dragState.draggedItem?.id,
                  });

                  // Check if this item is a drop target
                  const isDropTarget =
                    dragState.draggedOverIndex === index && !isBeingDragged;

                  return (
                    <div
                      key={libraryIdentity(item)}
                      ref={(el) => {
                        if (el) cardRefs.current.set(libraryIdentity(item), el);
                        else cardRefs.current.delete(libraryIdentity(item));
                      }}
                      data-item-index={index}
                      className={`${isBeingDragged ? "is-dragging" : ""} ${isDropTarget ? "is-drop-target" : ""}`} // Add CSS classes for animations
                      role="listitem"
                      aria-posinset={index + 1}
                      aria-setsize={processedItems.length}
                      // Drag and drop handlers on wrapper for proper drop zone
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";
                        // Add aria-dropeffect for screen readers when this is a valid drop target
                        if (
                          isDropTarget &&
                          e.currentTarget instanceof HTMLElement
                        ) {
                          e.currentTarget.setAttribute(
                            "aria-dropeffect",
                            "move"
                          );
                        }
                        console.log("[ListPage] wrapper onDragOver", {
                          index,
                          draggedItem: dragState.draggedItem,
                        });
                        handleDragOver(e, index);
                      }}
                      onDragLeave={(e) => {
                        console.log("[ListPage] wrapper onDragLeave", {
                          index,
                        });
                        // Clear aria-dropeffect when leaving
                        if (e.currentTarget instanceof HTMLElement) {
                          e.currentTarget.removeAttribute("aria-dropeffect");
                        }
                        handleDragLeave(e);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Clear aria-dropeffect on drop
                        if (e.currentTarget instanceof HTMLElement) {
                          e.currentTarget.removeAttribute("aria-dropeffect");
                        }
                        console.log("[ListPage] wrapper onDrop", {
                          index,
                          draggedItem: dragState.draggedItem,
                        });
                        handleDrop(e);
                      }}
                      aria-dropeffect={isDropTarget ? "move" : undefined}
                      onTouchEnd={(e) => {
                        // Handle touch drag end
                        if (
                          dragState.isDragging &&
                          dragState.draggedOverIndex !== null
                        ) {
                          const syntheticEvent = {
                            preventDefault: () => {},
                            stopPropagation: () => {},
                            currentTarget: e.currentTarget,
                          } as any;
                          handleDragEnd(syntheticEvent);
                        }
                      }}
                      style={{
                        touchAction: "pan-y", // Allow vertical scroll but enable drag
                        position: "relative", // Ensure z-index works during drag
                      }}
                    >
                      <TabCard
                        item={mediaItem}
                        actions={actions}
                        tabType={mode}
                        index={index}
                        dragState={dragState}
                        onDragStart={(e, idx) => {
                          // Handle both drag and touch events
                          if ("touches" in e) {
                            // Touch event - manually set drag state
                            const item = processedItems[idx];
                            if (item) {
                              // Set drag state manually
                              handleDragStart(
                                {
                                  ...e,
                                  dataTransfer: {
                                    setData: () => {},
                                    effectAllowed: "move",
                                  } as any,
                                  preventDefault: () => {},
                                  stopPropagation: () => {},
                                  currentTarget: e.currentTarget,
                                } as any,
                                idx
                              );
                            }
                          } else {
                            handleDragStart(e, idx);
                          }
                        }}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onKeyboardReorder={(direction) => {
                          const newIndex =
                            direction === "up"
                              ? Math.max(0, index - 1)
                              : Math.min(processedItems.length - 1, index + 1);
                          if (newIndex !== index) {
                            handleKeyboardReorder(index, newIndex);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </>
        </ErrorBoundary>
      ) : (
        <div className="text-center py-8" style={{ color: "var(--muted)" }}>
          <p className="text-sm">
            {items.length === 0 ? getEmptyText() : selectedTag && filters.type === 'all' && !filters.providers.length
              ? coreText('coreNoTagMatches', {tag:selectedTag})
              : coreText('coreNoFilterResults')}
          </p>
          <p className="text-xs mt-2">
            {items.length === 0 ? coreText('coreGetStarted') : coreText('coreFilterHelp')}
          </p>
        </div>
      )}
          </div>

      ) : mode === "returning" ? (
        <div className="list-content-column">
          <div className="mb-3">
            <h1
              className="text-base font-semibold"
              style={{ color: "var(--text)" }}
            >
              {title}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              All upcoming and returning shows from your Watching list.
            </p>
          </div>

          {processedItems.length > 0 ? (
            <ErrorBoundary
              name="ReturningList"
              onReset={() => {}}
            >
              <div className="space-y-3">
                {processedItems.map((item, index) => {
                  const mediaItem: MediaItem = {
                    id: item.id,
                    mediaType: item.mediaType,
                    title: item.title,
                    posterUrl: item.posterUrl,
                    year: item.year,
                    voteAverage: item.voteAverage,
                    userRating: item.userRating,
                    synopsis: getItemSynopsis(item),
                    nextAirDate: item.nextAirDate,
                    showStatus: item.showStatus,
                    lastAirDate: item.lastAirDate,
                    userNotes: item.userNotes,
                    tags: item.tags,
                    networks: item.networks,
                    productionCompanies: item.productionCompanies,
                  };

                  return (
                    <div key={`${item.mediaType}:${item.id}`}>
                      <TabCard
                        item={mediaItem}
                        actions={actions}
                        tabType="returning"
                        index={index}
                      />
                    </div>
                  );
                })}
              </div>
            </ErrorBoundary>
          ) : (
            <div className="text-center py-8" style={{ color: "var(--muted)" }}>
              <p className="text-sm">{getEmptyText()}</p>
              <p className="text-xs mt-2">
                Add TV shows to Watching to track return dates and upcoming
                seasons.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Non-list tabs (discovery) - no wrapper */}
        </>
      )}

      {/* Episode Tracking Modal */}
      {selectedShow && (
        <EpisodeTrackingModal
          isOpen={episodeModalOpen}
          onClose={() => {
            setEpisodeModalOpen(false);
            setSelectedShow(null);
            setShowDetails(null);
          }}
          show={
            showDetails || {
              id:
                typeof selectedShow.id === "string"
                  ? parseInt(selectedShow.id)
                  : selectedShow.id,
              name: selectedShow.title,
              number_of_seasons: 1,
              number_of_episodes: 1,
            }
          }
        />
      )}
    </section>
  );
}
