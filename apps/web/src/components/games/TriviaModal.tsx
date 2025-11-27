import { useState, useEffect, useRef, useCallback } from "react";
import TriviaGame from "./TriviaGame";
import TriviaReview from "./TriviaReview";
import Portal from "../Portal";
import { lockScroll, unlockScroll } from "../../utils/scrollLock";

interface TriviaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TriviaModal({ isOpen, onClose }: TriviaModalProps) {
  const [showReview, setShowReview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPositionRef = useRef({ x: 0, y: 0 });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      lockScroll();
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      unlockScroll();
    };
  }, [isOpen, onClose]);

  // Handle mouse and touch events for dragging
  const handleStartDrag = useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true);
      dragStartRef.current = { x: clientX, y: clientY };
      lastPositionRef.current = modalPosition;
    },
    [modalPosition]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".gm-header") && !target.closest(".gm-close")) {
        handleStartDrag(e.clientX, e.clientY);
      }
    },
    [handleStartDrag]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".gm-header") && !target.closest(".gm-close")) {
        const touch = e.touches[0];
        handleStartDrag(touch.clientX, touch.clientY);
      }
    },
    [handleStartDrag]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (isDragging) {
        const deltaX = clientX - dragStartRef.current.x;
        const deltaY = clientY - dragStartRef.current.y;

        const newX = lastPositionRef.current.x + deltaX;
        const newY = lastPositionRef.current.y + deltaY;

        // Clamp to viewport bounds
        const maxX = (window.innerWidth - 500) / 2;
        const maxY = (window.innerHeight - 750) / 2;

        setModalPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      }
    },
    [isDragging]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault(); // Prevent scrolling while dragging
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handleMove]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      lastPositionRef.current = modalPosition;
    }
    setIsDragging(false);
  }, [isDragging, modalPosition]);

  // Add global mouse and touch event listeners only while dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setShowReview(false);
      setModalPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Handle orientation change to prevent oversizing/undersizing
  useEffect(() => {
    if (!isOpen) return;
    
    const handleOrientationChange = () => {
      // Reset modal position on orientation change to prevent layout issues
      setModalPosition({ x: 0, y: 0 });
      // Small delay to let viewport settle
      setTimeout(() => {
        setModalPosition({ x: 0, y: 0 });
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Detect mobile for responsive height (check on each render to handle orientation changes)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const modalStyle = {
    position: "fixed" as const,
    top: "50%",
    left: "50%",
    transform: `translate(-50%, -50%) translate(${modalPosition.x}px, ${modalPosition.y}px)`,
    width: "min(90vw, 500px)",
    height: isMobile ? "100vh" : "min(90vh, 750px)",
    maxHeight: "100vh",
    cursor: isDragging ? "grabbing" : "default",
    zIndex: "var(--z-modal, 9999)",
  };

  const overlayStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
  };

  return (
    <Portal>
      <div
        className="game-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trivia-modal-title"
      >
        <div
          className="gm-overlay"
          style={overlayStyle}
          onClick={onClose}
        ></div>
        <div
          ref={modalRef}
          className={`gm-dialog gm-draggable ${isDragging ? "gm-dragging" : ""}`}
          style={modalStyle}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
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
            {showReview ? (
              <div className="game-review-view">
                <TriviaReview onClose={() => setShowReview(false)} />
                <div className="review-actions">
                  <button
                    className="btn-primary"
                    onClick={() => setShowReview(false)}
                    aria-label="Back to game"
                  >
                    Back to Game
                  </button>
                </div>
              </div>
            ) : (
              <TriviaGame 
                onClose={onClose} 
                onShowReview={() => setShowReview(true)}
              />
            )}
          </main>
        </div>
      </div>
    </Portal>
  );
}
