import { useState, useEffect, useRef, useCallback } from 'react';
import FlickWordGame from './FlickWordGame';
import FlickWordStats from './FlickWordStats';
import Portal from '../Portal';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface FlickWordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FlickWordModal({ isOpen, onClose }: FlickWordModalProps) {
  const [showStats, setShowStats] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalSize, setModalSize] = useState({ width: 500, height: 600 });
  const modalRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPositionRef = useRef({ x: 0, y: 0 });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      lockScroll();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      unlockScroll();
    };
  }, [isOpen, onClose]);

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if click is in header area (but not on close button)
    if (target.closest('.gm-header') && !target.closest('.gm-close')) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      lastPositionRef.current = modalPosition;
    }
  }, [modalPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const newX = lastPositionRef.current.x + deltaX;
      const newY = lastPositionRef.current.y + deltaY;
      
      // Clamp to viewport bounds
      const maxX = (window.innerWidth - modalSize.width) / 2;
      const maxY = (window.innerHeight - modalSize.height) / 2;
      
      setModalPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY))
      });
    }
    
    if (isResizing) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const newWidth = Math.max(300, Math.min(window.innerWidth - 40, modalSize.width + deltaX));
      const newHeight = Math.max(400, Math.min(window.innerHeight - 40, modalSize.height + deltaY));
      
      setModalSize({ width: newWidth, height: newHeight });
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [isDragging, isResizing, modalSize]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      lastPositionRef.current = modalPosition;
    }
    setIsDragging(false);
    setIsResizing(false);
  }, [isDragging, modalPosition]);

  // Add global mouse event listeners only while dragging/resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Handle game completion
  const handleGameComplete = useCallback((won: boolean, guesses: number) => {
    console.log('🎯 FlickWord game completed:', { won, guesses });
    
    // Update stats via the global handler
    if ((window as any).handleFlickWordGameComplete) {
      (window as any).handleFlickWordGameComplete(won, guesses);
    }
    
    // Show stats after a brief delay
    setTimeout(() => {
      setShowStats(true);
    }, 1500);
  }, []);

  // Reset stats view when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowStats(false);
      setModalPosition({ x: 0, y: 0 });
      setModalSize({ width: 500, height: 700 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalStyle = {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: `translate(calc(-50% + ${modalPosition.x}px), calc(-50% + ${modalPosition.y}px))`,
    width: `${modalSize.width}px`,
    height: 'auto',
    minHeight: `${modalSize.height}px`,
    maxHeight: '90vh',
    cursor: isDragging ? 'grabbing' : 'default',
    zIndex: 10000
  };

  const overlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999
  };

  return (
    <Portal>
      <div 
        className="game-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="flickword-modal-title"
      >
        <div className="gm-overlay" style={overlayStyle} onClick={onClose}></div>
        <div 
          ref={modalRef}
          className={`gm-dialog gm-draggable ${isDragging ? 'gm-dragging' : ''}`}
          style={modalStyle}
          onMouseDown={handleMouseDown}
        >
          <header className="gm-header gm-drag-handle">
            <h3 id="flickword-modal-title">🎯 FlickWord</h3>
            <button 
              className="gm-close" 
              type="button" 
              aria-label="Close" 
              onClick={onClose}
            >
              ×
            </button>
          </header>
          <main className="gm-body">
            {showStats ? (
              <div className="game-stats-view">
                <FlickWordStats />
                <div className="stats-actions">
                  <button 
                    className="btn-primary" 
                    onClick={() => setShowStats(false)}
                  >
                    Play Again
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <FlickWordGame 
                onClose={onClose}
                onGameComplete={handleGameComplete}
              />
            )}
          </main>
          {/* Resize handle */}
          <div 
            className="gm-resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
              dragStartRef.current = { x: e.clientX, y: e.clientY };
            }}
          />
        </div>
      </div>
    </Portal>
  );
}

