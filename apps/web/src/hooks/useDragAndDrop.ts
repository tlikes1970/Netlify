/**
 * DRAG PATHS:
 * - Desktop: Native HTML5 drag API → handleDragStart sets state + minimal visual feedback
 * - Mobile: Touch events handled in DragHandle.tsx → this hook only manages state
 * 
 * VISUAL TRANSFORM TARGETS:
 * - Desktop: CSS animation on .tab-card.is-dragging handles visuals (this hook should NOT apply inline transforms)
 * - Mobile: DragHandle.tsx applies inline transform to [data-item-index] wrapper
 */

import { useState, useCallback, useRef } from 'react';

export interface DragItem {
  id: string;
  index: number;
}

export interface DragState {
  draggedItem: DragItem | null;
  draggedOverIndex: number | null;
  isDragging: boolean;
}

export function useDragAndDrop<T extends { id: string }>(
  items: T[],
  onReorder: (fromIndex: number, toIndex: number) => void
) {
  const [dragState, setDragState] = useState<DragState>({
    draggedItem: null,
    draggedOverIndex: null,
    isDragging: false,
  });

  const dragStartRef = useRef<number | null>(null);
  const isDragEndingRef = useRef<boolean>(false); // Prevent double onDragEnd calls

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const item = items[index];
    if (!item) return;

    console.log('[useDragAndDrop] drag start', { index, itemId: item.id });
    dragStartRef.current = index;
    
    setDragState({
      draggedItem: { id: item.id, index },
      draggedOverIndex: null,
      isDragging: true,
    });

    // Set drag data
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';

    // Visual feedback is handled by CSS (.tab-card.is-dragging animation)
    // Do NOT apply inline transforms here to avoid conflict with CSS keyframe animation
  }, [items]);

  const handleDragEnd = useCallback((_e: React.DragEvent) => {
    // Prevent double calls
    if (isDragEndingRef.current) {
      console.log('[useDragAndDrop] drag end ignored - already processing');
      return;
    }
    
    isDragEndingRef.current = true;
    
    console.log('[useDragAndDrop] drag end', { 
      draggedItem: dragState.draggedItem, 
      draggedOverIndex: dragState.draggedOverIndex,
      dragStart: dragStartRef.current 
    });

    // Save state BEFORE resetting (in case we need it for FLIP)
    const wasDragging = dragState.isDragging;
    const draggedItem = dragState.draggedItem;
    const draggedOverIndex = dragState.draggedOverIndex;
    const fromIndex = dragStartRef.current;

    // Visual feedback reset is handled by CSS class removal
    // The .is-dragging class will be removed by parent component when dragState.isDragging becomes false

    // Reset state FIRST (before reorder) so FLIP can detect the change
    setDragState({
      draggedItem: null,
      draggedOverIndex: null,
      isDragging: false,
    });
    dragStartRef.current = null;

    // Perform reorder if we have valid drop target (use saved values)
    if (
      wasDragging &&
      draggedItem &&
      draggedOverIndex !== null &&
      fromIndex !== null &&
      fromIndex !== draggedOverIndex
    ) {
      console.log('[useDragAndDrop] reordering', { 
        from: fromIndex, 
        to: draggedOverIndex 
      });
      // Use setTimeout to ensure state reset completes before reorder
      // This allows FLIP to detect isDragging: false
      setTimeout(() => {
        onReorder(fromIndex, draggedOverIndex);
        // Reset flag after reorder completes
        setTimeout(() => {
          isDragEndingRef.current = false;
        }, 100);
      }, 0);
    } else {
      console.log('[useDragAndDrop] no reorder - invalid drop target');
      // Reset flag immediately if no reorder
      setTimeout(() => {
        isDragEndingRef.current = false;
      }, 100);
    }
  }, [dragState, onReorder]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    e.dataTransfer.dropEffect = 'move';

    if (dragState.draggedOverIndex !== index) {
      console.log('[useDragAndDrop] drag over', { index, draggedOverIndex: dragState.draggedOverIndex });
      setDragState(prev => ({
        ...prev,
        draggedOverIndex: index,
      }));
    }
  }, [dragState.draggedOverIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState(prev => ({
        ...prev,
        draggedOverIndex: null,
      }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // The actual reorder is handled in handleDragEnd
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}





