import { useCallback, useRef, useEffect } from 'react';

export interface KeyboardReorderOptions {
  items: Array<{ id: string }>;
  onReorder: (fromIndex: number, toIndex: number) => void;
  getItemElement: (index: number) => HTMLElement | null;
  announceChange?: (message: string) => void;
}

/**
 * Process: Keyboard Reordering
 * Purpose: Enable keyboard navigation (ArrowUp/ArrowDown) to reorder items
 * Data Source: Item list and focus state
 * Update Path: Pass onReorder callback from parent
 * Dependencies: Focus management, aria-live announcements
 */
export function useKeyboardReorder({
  items,
  onReorder,
  getItemElement,
  announceChange
}: KeyboardReorderOptions) {
  const focusedIndexRef = useRef<number | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent, index: number) => {
    // Only handle if focused item has drag handle focused or card is focused
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const isShift = e.shiftKey;
      
      // Prevent default scrolling
      e.preventDefault();
      e.stopPropagation();

      const currentIndex = focusedIndexRef.current ?? index;
      let newIndex: number;

      if (e.key === 'ArrowUp') {
        newIndex = Math.max(0, currentIndex - 1);
      } else {
        newIndex = Math.min(items.length - 1, currentIndex + 1);
      }

      if (newIndex !== currentIndex) {
        // Move item
        onReorder(currentIndex, newIndex);
        
        // Announce change
        if (announceChange) {
          const item = items[currentIndex];
          const direction = e.key === 'ArrowUp' ? 'up' : 'down';
          announceChange(`${item.id ? item.id : 'Item'} moved ${direction}, now at position ${newIndex + 1} of ${items.length}`);
        }

        // Update focus to new position after a brief delay to allow DOM update
        setTimeout(() => {
          const newElement = getItemElement(newIndex);
          if (newElement) {
            const handle = newElement.querySelector('.handle, .drag-handle') as HTMLElement;
            if (handle) {
              handle.focus();
            } else {
              newElement.focus();
            }
            focusedIndexRef.current = newIndex;
          }
        }, 50);
      } else {
        // Can't move further - announce
        if (announceChange) {
          announceChange(`Already at ${e.key === 'ArrowUp' ? 'top' : 'bottom'} of list`);
        }
      }
    }
  }, [items, onReorder, getItemElement, announceChange]);

  return {
    handleKeyDown,
    setFocusedIndex: (index: number | null) => {
      focusedIndexRef.current = index;
    }
  };
}


