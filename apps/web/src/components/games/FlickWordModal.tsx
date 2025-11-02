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

  // Handle game completion
  const handleGameComplete = useCallback((won: boolean, guesses: number) => {
    console.log('🎯 FlickWord game completed:', { won, guesses });
    
    // Update stats directly
    try {
      const existingData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
      const currentStats = existingData.flickword || { games: 0, wins: 0, losses: 0, streak: 0, maxStreak: 0 };
      
      const newStats = {
        games: currentStats.games + 1,
        wins: currentStats.wins + (won ? 1 : 0),
        losses: currentStats.losses + (won ? 0 : 1),
        streak: won ? currentStats.streak + 1 : 0, // Reset streak on loss
        maxStreak: won ? Math.max(currentStats.maxStreak, currentStats.streak + 1) : currentStats.maxStreak
      };
      
      const updatedData = {
        ...existingData,
        flickword: newStats
      };
      
      localStorage.setItem('flicklet-data', JSON.stringify(updatedData));
      localStorage.setItem('flickword:stats', JSON.stringify(newStats));
      console.log('💾 FlickWord stats saved:', newStats);
    } catch (error) {
      console.error('Failed to save FlickWord stats:', error);
    }
    
    // Notify listeners in this tab that stats changed
    try {
      window.dispatchEvent(new CustomEvent('flickword:stats-updated'));
    } catch (e) { void e; }
    // Update stats via optional global handler (legacy)
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalStyle = {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) translate(${modalPosition.x}px, ${modalPosition.y}px)`,
    width: 'min(90vw, 500px)',
    height: 'min(90vh, 750px)',
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
            {/* TEMPORARY: Small testing button above title */}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                // Clear cache and load new random word
                const { getCommonWordsArray } = await import('../../lib/words/commonWords');
                const commonWords = getCommonWordsArray();
                if (commonWords && commonWords.length > 0) {
                  const randomIndex = Math.floor(Math.random() * commonWords.length);
                  const newWord = commonWords[randomIndex].toUpperCase();
                  localStorage.removeItem('flicklet:daily-word');
                  localStorage.setItem('flicklet:daily-word', JSON.stringify({
                    word: newWord.toLowerCase(),
                    date: new Date().toISOString().slice(0, 10),
                    timestamp: Date.now()
                  }));
                  // Reload to get new word
                  window.location.reload();
                }
              }}
              aria-label="Load new word (testing)"
              style={{
                backgroundColor: "#f7c23c",
                color: "#000",
                fontSize: "10px",
                fontWeight: "600",
                padding: "4px 8px",
                border: "1px solid #000",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "4px",
                lineHeight: "1",
                display: "block",
              }}
              title="Load new word"
            >
              🧪
            </button>
            <h3 id="flickword-modal-title">🎯 FlickWord</h3>
            <div className="fw-stats">
              <span className="fw-streak">Streak: 0</span>
              <span className="fw-timer">Next: --:--</span>
            </div>
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
        </div>
      </div>
    </Portal>
  );
}

