import { useState, useEffect } from 'react';
import FlickWordGame from './FlickWordGame';
import FlickWordStats from './FlickWordStats';

interface FlickWordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FlickWordModal({ isOpen, onClose }: FlickWordModalProps) {
  const [showStats, setShowStats] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle game completion
  const handleGameComplete = (won: boolean, guesses: number) => {
    console.log('🎯 FlickWord game completed:', { won, guesses });
    
    // Update stats via the global handler
    if ((window as any).handleFlickWordGameComplete) {
      (window as any).handleFlickWordGameComplete(won, guesses);
    }
    
    // Show stats after a brief delay
    setTimeout(() => {
      setShowStats(true);
    }, 1500);
  };

  // Reset stats view when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowStats(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="game-modal" role="dialog" aria-modal="true" aria-labelledby="flickword-modal-title">
      <div className="gm-overlay" onClick={onClose}></div>
      <div className="gm-dialog">
        <header className="gm-header">
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
      </div>
    </div>
  );
}

