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

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const item = items[index];
    if (!item) return;

    dragStartRef.current = index;
    
    setDragState({
      draggedItem: { id: item.id, index },
      draggedOverIndex: null,
      isDragging: true,
    });

    // Set drag data
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';

    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
      e.currentTarget.style.transform = 'rotate(2deg)';
    }
  }, [items]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '';
      e.currentTarget.style.transform = '';
    }

    // Perform reorder if we have valid drop target
    if (
      dragState.draggedItem &&
      dragState.draggedOverIndex !== null &&
      dragStartRef.current !== null &&
      dragStartRef.current !== dragState.draggedOverIndex
    ) {
      onReorder(dragStartRef.current, dragState.draggedOverIndex);
    }

    // Reset state
    setDragState({
      draggedItem: null,
      draggedOverIndex: null,
      isDragging: false,
    });
    dragStartRef.current = null;
  }, [dragState, onReorder]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragState.draggedOverIndex !== index) {
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





