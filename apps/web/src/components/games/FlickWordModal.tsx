import { useState, useEffect, useRef, useCallback } from "react";
import FlickWordGame from "./FlickWordGame";
import FlickWordStats from "./FlickWordStats";
import Portal from "../Portal";
import { lockScroll, unlockScroll } from "../../utils/scrollLock";

interface FlickWordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FlickWordModal({
  isOpen,
  onClose,
}: FlickWordModalProps) {
  const [showStats, setShowStats] = useState(false);
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

  // Get stats for header display
  const [headerStats, setHeaderStats] = useState({
    streak: 0,
    nextWordTime: "",
  });

  useEffect(() => {
    const loadHeaderStats = () => {
      try {
        const stored =
          localStorage.getItem("flickword:stats") ||
          localStorage.getItem("flicklet-data");
        if (stored) {
          const data = JSON.parse(stored);
          const flickwordStats = data.flickword || data;
          setHeaderStats({
            streak: flickwordStats.streak || 0,
            nextWordTime: getNextWordTime(),
          });
        }
      } catch {
        // Ignore errors
      }
    };

    const getNextWordTime = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const hours = Math.floor(
        (tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        ((tomorrow.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)
      );
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    };

    loadHeaderStats();
    const interval = setInterval(() => {
      setHeaderStats((prev) => ({ ...prev, nextWordTime: getNextWordTime() }));
    }, 60000); // Update every minute

    const handleStatsUpdate = () => loadHeaderStats();
    const handleCustomEvent = () => loadHeaderStats();
    window.addEventListener(
      "flickword:stats-updated",
      handleCustomEvent as EventListener
    );
    window.addEventListener("storage", handleStatsUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "flickword:stats-updated",
        handleCustomEvent as EventListener
      );
      window.removeEventListener("storage", handleStatsUpdate);
    };
  }, []);

  // Handle game completion
  const handleGameComplete = useCallback((won: boolean, guesses: number) => {
    console.log("🎯 FlickWord game completed:", { won, guesses });

    // Update stats directly
    try {
      const existingData = JSON.parse(
        localStorage.getItem("flicklet-data") || "{}"
      );
      const currentStats = existingData.flickword || {
        games: 0,
        wins: 0,
        losses: 0,
        streak: 0,
        maxStreak: 0,
      };

      const newStats = {
        games: currentStats.games + 1,
        wins: currentStats.wins + (won ? 1 : 0),
        losses: currentStats.losses + (won ? 0 : 1),
        streak: won ? currentStats.streak + 1 : 0, // Reset streak on loss
        maxStreak: won
          ? Math.max(currentStats.maxStreak, currentStats.streak + 1)
          : currentStats.maxStreak,
      };

      const updatedData = {
        ...existingData,
        flickword: newStats,
      };

      localStorage.setItem("flicklet-data", JSON.stringify(updatedData));
      localStorage.setItem("flickword:stats", JSON.stringify(newStats));
      console.log("💾 FlickWord stats saved:", newStats);

      // Update header stats
      setHeaderStats((prev) => ({ ...prev, streak: newStats.streak }));
    } catch (error) {
      console.error("Failed to save FlickWord stats:", error);
    }

    // Notify listeners in this tab that stats changed
    try {
      window.dispatchEvent(new CustomEvent("flickword:stats-updated"));
    } catch (e) {
      void e;
    }
    // Update stats via optional global handler (legacy)
    if (
      typeof (
        window as unknown as {
          handleFlickWordGameComplete?: (won: boolean, guesses: number) => void;
        }
      ).handleFlickWordGameComplete === "function"
    ) {
      (
        window as unknown as {
          handleFlickWordGameComplete: (won: boolean, guesses: number) => void;
        }
      ).handleFlickWordGameComplete(won, guesses);
    }

    // Don't auto-show stats - let the win/lost screens stay visible
    // Stats can be accessed via the win/lost screen buttons if needed
    // This prevents the stats modal from replacing the game component and hiding the completion screens
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
    position: "fixed" as const,
    top: "50%",
    left: "50%",
    transform: `translate(-50%, -50%) translate(${modalPosition.x}px, ${modalPosition.y}px)`,
    width: "min(90vw, 500px)",
    height: "min(90vh, 750px)",
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
        aria-labelledby="flickword-modal-title"
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
            <h3 id="flickword-modal-title">🎯 FlickWord</h3>
            <div className="fw-stats" aria-label="Game statistics">
              <span
                className="fw-streak"
                aria-label={`Current streak: ${headerStats.streak}`}
              >
                Streak: {headerStats.streak}
              </span>
              <span
                className="fw-timer"
                aria-label={`Next word in: ${headerStats.nextWordTime}`}
              >
                Next: {headerStats.nextWordTime}
              </span>
            </div>
            <button
              className="gm-close"
              type="button"
              aria-label="Close FlickWord game (Press Escape to close)"
              onClick={onClose}
            >
              ×
            </button>
          </header>
          <main className="gm-body" data-fw-root>
            {showStats ? (
              <div className="game-stats-view">
                <FlickWordStats />
                <div className="stats-actions">
                  <button
                    className="btn-primary"
                    onClick={() => setShowStats(false)}
                    aria-label="Play another game"
                  >
                    Play Again
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={onClose}
                    aria-label="Close FlickWord game"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <FlickWordGame
                onClose={onClose}
                onGameComplete={handleGameComplete}
                onShowStats={() => setShowStats(true)}
              />
            )}
          </main>
        </div>
      </div>
    </Portal>
  );
}
