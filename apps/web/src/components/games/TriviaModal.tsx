import { useState, useEffect, useRef, useCallback } from 'react';
import TriviaGame from './TriviaGame';
import Portal from '../Portal';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface TriviaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TriviaModal({ isOpen, onClose }: TriviaModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
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
      const maxX = (window.innerWidth - 500) / 2;
      const maxY = (window.innerHeight - 750) / 2;
      
      setModalPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY))
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      lastPositionRef.current = modalPosition;
    }
    setIsDragging(false);
  }, [isDragging, modalPosition]);

  // Add global mouse event listeners only while dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setModalPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalStyle = {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: `translate(calc(-50% + ${modalPosition.x}px), calc(-50% + ${modalPosition.y}px))`,
    width: '500px',
    height: '750px',
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
        aria-labelledby="trivia-modal-title"
      >
        <div className="gm-overlay" style={overlayStyle} onClick={onClose}></div>
        <div 
          ref={modalRef}
          className={`gm-dialog gm-draggable ${isDragging ? 'gm-dragging' : ''}`}
          style={modalStyle}
          onMouseDown={handleMouseDown}
        >
          <header className="gm-header gm-drag-handle">
            <h3 id="trivia-modal-title">🧠 Daily Trivia</h3>
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
            <TriviaGame onClose={onClose} />
          </main>
        </div>
      </div>
    </Portal>
  );
}