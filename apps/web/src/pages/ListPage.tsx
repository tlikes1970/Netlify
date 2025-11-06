import TabCard from "@/components/cards/TabCard";
import UpNextCard from "@/components/cards/UpNextCard";
import type { MediaItem } from "@/components/cards/card.types";
import { Library, LibraryEntry } from "@/lib/storage";
import { useSettings, getPersonalityText } from "@/lib/settings";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import ScrollToTopArrow from "@/components/ScrollToTopArrow";
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
  resetTabState,
  validateFilters,
  type TabState,
} from "@/lib/tabState";
import {
  trackSortChange,
  trackFilterChange,
  trackReorderCompleted,
  trackTabStateReset,
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
  onExtrasOpen,
}: {
  title: string;
  items: LibraryEntry[];
  mode?: "watching" | "want" | "watched" | "returning" | "discovery";
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
    const tagSet = new Set<string>();
    items.forEach((item) => {
      if (item.tags) {
        item.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [items]);

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
    return Array.from(providerSet).sort();
  }, [items]);

  // Reload tab state when tab changes
  useEffect(() => {
    const restored = restoreTabState(tabKey, availableItemIds);
    setTabStateInternal(restored);
    setSortMode(restored.sort);
    // Validate filters against available providers on mount
    const validatedFilters = validateFilters(
      restored.filter,
      availableProviders
    );
    setFilters(validatedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabKey]);

  // Handler for sort mode change with confirmation
  const handleSortModeChange = useCallback(
    (newMode: SortMode) => {
      // If changing from custom to another mode, confirm first
      if (sortMode === "custom" && newMode !== "custom") {
        const confirmed = window.confirm(
          "Changing the sort mode will reset your custom order. Continue?"
        );
        if (!confirmed) {
          return; // User cancelled
        }
        // Reset custom order
        const listName = getListName(mode);
        if (listName) {
          Library.resetCustomOrder(listName);
        }
        trackSortChange(tabKey, newMode, sortMode);
      } else if (newMode !== sortMode) {
        trackSortChange(tabKey, newMode, sortMode);
      }

      setSortMode(newMode);
      saveTabState(tabKey, { sort: newMode });
    },
    [sortMode, tabKey, mode]
  );

  // Handler for filter change with validation and telemetry
  const handleFilterChange = useCallback(
    (newFilters: ListFiltersState) => {
      // Validate filters against available providers
      const validatedFilters = validateFilters(newFilters, availableProviders);
      setFilters(validatedFilters);
      saveTabState(tabKey, { filter: validatedFilters });
      trackFilterChange(
        tabKey,
        validatedFilters.type,
        validatedFilters.providers.length
      );
    },
    [tabKey, availableProviders]
  );

  // Persist sort mode changes
  useEffect(() => {
    saveTabState(tabKey, { sort: sortMode });
  }, [sortMode, tabKey]);

  // Persist filter changes (already handled by handleFilterChange, but keep for safety)
  useEffect(() => {
    saveTabState(tabKey, { filter: filters });
  }, [filters, tabKey]);

  // Stable sort function with secondary sort key
  const stableSort = useCallback(
    (items: LibraryEntry[], mode: SortMode): LibraryEntry[] => {
      if (mode === "custom") {
        // Custom mode: maintain original order (as set by drag-and-drop)
        return [...items];
      }

      // Create a copy with original indices for stable sorting
      const itemsWithIndex = items.map((item, index) => ({
        item,
        originalIndex: index,
      }));

      // Sort based on mode
      itemsWithIndex.sort((a, b) => {
        let primaryComparison = 0;

        switch (mode) {
          case "date-newest":
            // Newest first (larger addedAt first)
            primaryComparison = (b.item.addedAt || 0) - (a.item.addedAt || 0);
            break;
          case "date-oldest":
            // Oldest first (smaller addedAt first)
            primaryComparison = (a.item.addedAt || 0) - (b.item.addedAt || 0);
            break;
          case "alphabetical-az":
            // A to Z
            primaryComparison = (a.item.title || "").localeCompare(
              b.item.title || "",
              undefined,
              { sensitivity: "base" }
            );
            break;
          case "alphabetical-za":
            // Z to A
            primaryComparison = (b.item.title || "").localeCompare(
              a.item.title || "",
              undefined,
              { sensitivity: "base" }
            );
            break;
          case "streaming-service": {
            // Sort by first streaming service (alphabetically)
            const aService =
              a.item.networks && a.item.networks.length > 0
                ? a.item.networks[0].toLowerCase()
                : "zzz_no_service"; // Items without services go to end
            const bService =
              b.item.networks && b.item.networks.length > 0
                ? b.item.networks[0].toLowerCase()
                : "zzz_no_service";
            primaryComparison = aService.localeCompare(bService, undefined, {
              sensitivity: "base",
            });
            break;
          }
          default:
            primaryComparison = 0;
        }

        // If primary sort is equal, use secondary sort key (item ID for stability)
        if (primaryComparison === 0) {
          const aId = String(a.item.id);
          const bId = String(b.item.id);
          return aId.localeCompare(bId);
        }

        return primaryComparison;
      });

      return itemsWithIndex.map(({ item }) => item);
    },
    []
  );

  // Filter and sort items
  const processedItems = useMemo(() => {
    let result = items;

    // Apply type filter (AND logic)
    if (filters.type !== "all") {
      result = result.filter((item) => item.mediaType === filters.type);
    }

    // Apply provider filter (AND logic - item must have at least one selected provider)
    if (filters.providers.length > 0) {
      result = result.filter((item) => {
        if (
          !item.networks ||
          !Array.isArray(item.networks) ||
          item.networks.length === 0
        ) {
          return false; // Items without providers are excluded when providers are selected
        }
        // Check if item has at least one of the selected providers
        return filters.providers.some((provider) =>
          item.networks!.some(
            (network) =>
              network &&
              typeof network === "string" &&
              network.toLowerCase() === provider.toLowerCase()
          )
        );
      });
    }

    // Filter by selected tag (AND logic)
    if (selectedTag) {
      result = result.filter(
        (item) => item.tags && item.tags.includes(selectedTag)
      );
    }

    // Sort by tag if enabled (takes priority over sort mode)
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
    } else {
      // Apply sort mode (only if not sorting by tag)
      result = stableSort(result, sortMode);
    }

    return result;
  }, [items, filters, selectedTag, sortByTag, sortMode, stableSort]);

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
          const el = cardMap.get(String(item.id));
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
        handleSortModeChange("custom");
        const listName = getListName(mode);
        if (listName) {
          Library.reorder(listName, fromIndex, toIndex);
        }

        // Track reorder completion
        trackReorderCompleted(tabKey, fromIndex, toIndex);

        // Clear pending reorder after animation completes
        setTimeout(() => {
          pendingReorderRef.current = null;
        }, 500);
      }
    },
    [mode, processedItems, handleSortModeChange, tabKey]
  );

  const {
    dragState,
    handleDragStart,
    handleDragEnd: originalHandleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(
    processedItems.map((item) => ({ ...item, id: String(item.id) })),
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
      return item ? cardRefs.current.get(String(item.id)) || null : null;
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
        `${item.title} moved ${direction}, now at position ${toIndex + 1} of ${processedItems.length}`
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
        const el = cardMap.get(String(item.id));
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
        // Ensure z-index is high during animation
        el.style.zIndex = "9999";
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
    if (mode === "returning") {
      return "No returning shows yet. When a series is confirmed, it’ll show up here automatically.";
    }
    if (title.toLowerCase().includes("watching")) {
      return getPersonalityText("emptyWatching", settings.personalityLevel);
    } else if (
      title.toLowerCase().includes("wishlist") ||
      title.toLowerCase().includes("want")
    ) {
      return getPersonalityText("emptyWishlist", settings.personalityLevel);
    } else if (title.toLowerCase().includes("watched")) {
      return getPersonalityText("emptyWatched", settings.personalityLevel);
    } else if (title.toLowerCase().includes("not interested")) {
      return (
        getPersonalityText("empty", settings.personalityLevel) ||
        "No items marked as not interested yet."
      );
    }
    return getPersonalityText("empty", settings.personalityLevel);
  };

  // Action handlers using new Library system
  const actions = {
    onWant: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, "wishlist");
      }
    },
    onWatched: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, "watched");
      }
    },
    onNotInterested: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, "not");
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
    },
    onNotificationToggle: onNotificationToggle,
    onSimpleReminder: onSimpleReminder,
    onBloopersOpen: onBloopersOpen,
    onExtrasOpen: onExtrasOpen,
  };

  return (
    <section className="px-4 py-4">
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
            >
              🏷️ Sorted by Tag
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Sort Dropdown - only show for tabbed lists (not discovery, not returning) */}
          {mode !== "discovery" && mode !== "returning" && (
            <>
              <SortDropdown
                value={sortMode}
                onChange={handleSortModeChange}
                disabled={sortByTag}
              />
              {/* Unified Reset to Default button - shows when any custom state exists */}
              {(sortMode === "custom" ||
                filters.type !== "all" ||
                filters.providers.length > 0) && (
                <button
                  onClick={() => {
                    const confirmed = window.confirm(
                      "Reset sort, filters, and custom order to defaults?"
                    );
                    if (!confirmed) return;

                    // Reset all state
                    const defaultState = resetTabState(tabKey);
                    const listName = getListName(mode);
                    if (listName) {
                      Library.resetCustomOrder(listName);
                    }
                    setSortMode(defaultState.sort);
                    setFilters(defaultState.filter);

                    // Track reset
                    trackTabStateReset(tabKey);

                    // Reload items to reflect default order
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--btn)",
                    color: "var(--text)",
                    border: "1px solid var(--line)",
                  }}
                  title="Reset to default (sort, filters, and order)"
                  aria-label="Reset to default sort, filters, and order"
                >
                  Reset to Default
                </button>
              )}
            </>
          )}

          {/* Filters - only show for tabbed lists (not discovery, not returning) */}
          {mode !== "discovery" && mode !== "returning" && (
            <ListFilters
              value={filters}
              onChange={handleFilterChange}
              availableProviders={availableProviders}
              disabled={sortByTag}
            />
          )}

          {/* Tag Controls */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-3">
              {/* Sort by Tag Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
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
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  Sort by tag
                </span>
              </label>

              {/* Tag Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  Filter by tag:
                </span>
                <select
                  value={selectedTag || ""}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                  className="px-2 py-1 rounded text-sm border"
                  style={{
                    backgroundColor: "var(--menu-bg)",
                    borderColor: "var(--menu-border)",
                    color: "var(--menu-text)",
                  }}
                >
                  <option value="">All items</option>
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
                {(selectedTag || sortByTag) && (
                  <button
                    onClick={() => {
                      setSelectedTag(null);
                      setSortByTag(false);
                    }}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: "var(--btn)",
                      color: "var(--text)",
                      borderColor: "var(--line)",
                      border: "1px solid",
                    }}
                  >
                    Clear All
                  </button>
                )}
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
          {mode === "returning" ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {processedItems.slice(0, 12).map((item) => {
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
                  showStatus: item.showStatus,
                  lastAirDate: item.lastAirDate,
                  userNotes: item.userNotes,
                  tags: item.tags,
                };
                return (
                  <div
                    key={`${item.mediaType}:${item.id}:${item.nextAirDate}`}
                    className="flex-shrink-0"
                  >
                    <UpNextCard item={mediaItem} />
                  </div>
                );
              })}
            </div>
          ) : (
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
                    synopsis: item.synopsis,
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
                      key={item.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(String(item.id), el);
                        else cardRefs.current.delete(String(item.id));
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
          )}
        </ErrorBoundary>
      ) : (
        <div className="text-center py-8" style={{ color: "var(--muted)" }}>
          <p className="text-sm">
            {(() => {
              // Check what filters are active
              const hasTypeFilter = filters.type !== "all";
              const hasProviderFilter = filters.providers.length > 0;
              const hasFilters = hasTypeFilter || hasProviderFilter;

              if (selectedTag) {
                return `No items found with tag "${selectedTag}"`;
              }
              if (sortByTag) {
                return "No items with tags found";
              }
              if (hasFilters) {
                const filterParts: string[] = [];
                if (hasTypeFilter) {
                  filterParts.push(
                    filters.type === "movie" ? "movies" : "TV shows"
                  );
                }
                if (hasProviderFilter) {
                  filterParts.push(
                    `providers: ${filters.providers.join(", ")}`
                  );
                }
                return `No items match your filters (${filterParts.join(", ")})`;
              }
              return getEmptyText();
            })()}
          </p>
          <p className="text-xs mt-2">
            {(() => {
              const hasTypeFilter = filters.type !== "all";
              const hasProviderFilter = filters.providers.length > 0;
              const hasFilters = hasTypeFilter || hasProviderFilter;

              if (selectedTag) {
                return "Try selecting a different tag or clear the filter";
              }
              if (sortByTag) {
                return "Add tags to items to see them when sorting by tag";
              }
              if (hasFilters) {
                return 'Try adjusting your filters or click "Clear All" to see all items';
              }
              return "Add some shows to get started!";
            })()}
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
