/**
 * Process: FlickWord Game Component
 * Purpose: Wordle-style word guessing game with daily word challenges
 * Data Source: dailyWordApi for target word, validateWord for guess validation
 * Update Path: Game state managed via React hooks, localStorage for stats
 * Dependencies: dailyWordApi, validateWord, flickword.css
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getTodaysWord } from "../../lib/dailyWordApi";
import { validateWord } from "../../lib/words/validateWord";

// Game configuration
const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const NOTIFICATION_DURATION = 3000;
const ANIMATION_DELAY_BASE = 100; // Base delay for tile animations
const GAME_STATE_KEY = "flicklet:flickword-game-state"; // localStorage key for game state

// Types
type TileStatus = "correct" | "present" | "absent" | "";
type NotificationType = "success" | "error" | "info" | "warning";
type AnimationState = "idle" | "entering" | "revealing" | "revealed";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
}

interface GameState {
  target: string;
  guesses: string[];
  current: string;
  maxGuesses: number;
  done: boolean;
  status: Record<string, TileStatus>;
  lastResults: TileStatus[][];
  wordInfo?: {
    definition?: string;
    difficulty?: string;
  };
  showHint: boolean;
  animationState: AnimationState;
}

interface FlickWordGameProps {
  onClose?: () => void;
  onGameComplete?: (won: boolean, guesses: number) => void;
}

// Saved game state (excludes transient animation state)
interface SavedGameState {
  target: string;
  guesses: string[];
  current: string;
  maxGuesses: number;
  done: boolean;
  status: Record<string, TileStatus>;
  lastResults: TileStatus[][];
  wordInfo?: {
    definition?: string;
    difficulty?: string;
  };
  showHint: boolean;
  date: string; // Date when this game state was saved
}

/**
 * Save game state to localStorage
 */
function saveGameState(game: GameState, date: string): void {
  try {
    const savedState: SavedGameState = {
      target: game.target,
      guesses: game.guesses,
      current: game.current,
      maxGuesses: game.maxGuesses,
      done: game.done,
      status: game.status,
      lastResults: game.lastResults,
      wordInfo: game.wordInfo,
      showHint: game.showHint,
      date,
    };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(savedState));
    console.log("💾 Game state saved:", {
      target: game.target,
      guesses: game.guesses.length,
      date,
    });
  } catch (error) {
    console.warn("Failed to save game state:", error);
  }
}

/**
 * Restore game state from localStorage
 * Returns null if no saved state or state is for a different day
 */
function restoreGameState(currentDate: string): SavedGameState | null {
  try {
    const saved = localStorage.getItem(GAME_STATE_KEY);
    if (!saved) return null;

    const savedState: SavedGameState = JSON.parse(saved);

    // Only restore if it's for today's word and game isn't completed
    if (
      savedState.date === currentDate &&
      !savedState.done &&
      savedState.target
    ) {
      console.log("📂 Game state restored:", {
        target: savedState.target,
        guesses: savedState.guesses.length,
      });
      return savedState;
    } else if (savedState.date !== currentDate) {
      // Clear old game state from different day
      localStorage.removeItem(GAME_STATE_KEY);
      console.log("🗑️ Cleared game state from different day");
    }

    return null;
  } catch (error) {
    console.warn("Failed to restore game state:", error);
    // Clear corrupted state
    localStorage.removeItem(GAME_STATE_KEY);
    return null;
  }
}

/**
 * Clear saved game state
 */
function clearGameState(): void {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
    console.log("🗑️ Game state cleared");
  } catch (error) {
    console.warn("Failed to clear game state:", error);
  }
}

export default function FlickWordGame({
  onClose,
  onGameComplete,
}: FlickWordGameProps) {
  const [game, setGame] = useState<GameState>({
    target: "",
    guesses: [],
    current: "",
    maxGuesses: 6,
    done: false,
    status: {},
    lastResults: [],
    showHint: false,
    animationState: "idle",
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvalidInput, setIsInvalidInput] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const notificationTimeoutRef = useRef<number | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Get today's word from API (same word for all players each day)
  const loadTodaysWord = useCallback(
    async (forceNew: boolean = false, restoreState: boolean = true) => {
      try {
        setIsLoading(true);
        console.log("🔄 Loading today's word...");

        // Get today's date
        const today = new Date().toISOString().slice(0, 10);

        // If forcing new word, clear cache first
        if (forceNew) {
          localStorage.removeItem("flicklet:daily-word");
          clearGameState(); // Also clear game state when forcing new word
          console.log("🗑️ Cleared word cache for new word");
        }

        // Try to restore saved game state first (if not forcing new)
        if (restoreState && !forceNew) {
          const savedState = restoreGameState(today);
          if (savedState) {
            // Restore game state
            setGame({
              ...savedState,
              animationState: "idle", // Always reset animation state
            });
            setIsLoading(false);
            console.log("✅ Game state restored from previous session");
            return;
          }
        }

        // Use daily word (same for all players, rotates daily)
        const wordData = await getTodaysWord();
        console.log("📦 Daily word data received:", wordData);

        // Validate that we got a proper word
        if (wordData && wordData.word && wordData.word.length === 5) {
          const newGameState = {
            target: wordData.word.toUpperCase(),
            guesses: [],
            current: "",
            maxGuesses: 6,
            done: false,
            status: {},
            lastResults: [],
            wordInfo: {
              definition: wordData.definition,
              difficulty: wordData.difficulty,
            },
            showHint: false,
            animationState: "idle" as AnimationState,
          };

          setGame(newGameState);

          // Save initial state
          saveGameState(newGameState, today);

          console.log("✅ Game target set to:", wordData.word.toUpperCase());
        } else {
          throw new Error("Invalid word data received");
        }
      } catch (error) {
        console.error("❌ Failed to load daily word:", error);
        // Fallback to a static word if API fails
        const fallbackWord = "HOUSE";
        console.log("🔄 Using fallback word:", fallbackWord);
        const fallbackDate = new Date().toISOString().slice(0, 10);
        const fallbackState = {
          target: fallbackWord,
          guesses: [],
          current: "",
          maxGuesses: 6,
          done: false,
          status: {},
          lastResults: [],
          wordInfo: {
            definition: "A building for human habitation",
            difficulty: "easy",
          },
          showHint: false,
          animationState: "idle" as AnimationState,
        };
        setGame(fallbackState);
        saveGameState(fallbackState, fallbackDate);
      } finally {
        setIsLoading(false);
        console.log("🏁 Word loading complete");
      }
    },
    []
  );

  // TEMPORARY: Force load new word (for testing)
  const handleNewWord = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Loading new word for testing...");

      // Clear cache first
      localStorage.removeItem("flicklet:daily-word");

      // Get a random word from common words list
      const { getCommonWordsArray } = await import(
        "../../lib/words/commonWords"
      );
      const commonWords = getCommonWordsArray();

      if (commonWords && commonWords.length > 0) {
        // Get current target
        const currentTarget = game.target;

        // Pick a random word different from current
        let newWord;
        let attempts = 0;
        do {
          const randomIndex = Math.floor(Math.random() * commonWords.length);
          newWord = commonWords[randomIndex].toUpperCase();
          attempts++;
        } while (newWord === currentTarget && attempts < 10); // Avoid same word

        console.log("🎲 Selected random word:", newWord);

        const testDate = new Date().toISOString().slice(0, 10);
        const newGameState = {
          target: newWord,
          guesses: [],
          current: "",
          maxGuesses: 6,
          done: false,
          status: {},
          lastResults: [],
          wordInfo: {
            definition: undefined,
            difficulty: "medium",
          },
          showHint: false,
          animationState: "idle" as AnimationState,
        };
        setGame(newGameState);
        // Clear old game state and save new one
        clearGameState();
        saveGameState(newGameState, testDate);

        // Cache the new word with today's date for consistency
        const cacheData = {
          word: newWord.toLowerCase(),
          date: testDate,
          definition: undefined,
          difficulty: "medium",
          timestamp: Date.now(),
        };
        localStorage.setItem("flicklet:daily-word", JSON.stringify(cacheData));

        // Show notification using the notification system
        const notificationId = `notification-${Date.now()}-${Math.random()}`;
        const notification = {
          id: notificationId,
          message: `New word loaded: ${newWord}`,
          type: "info" as NotificationType,
          timestamp: Date.now(),
        };
        setNotifications((prev) => [...prev, notification]);

        // Auto-dismiss
        setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notificationId)
          );
        }, 3000);
      } else {
        throw new Error("Common words list not available");
      }
    } catch (error) {
      console.error("❌ Failed to load new word:", error);
      // Show error notification
      const notificationId = `notification-${Date.now()}-${Math.random()}`;
      const notification = {
        id: notificationId,
        message: "Failed to load new word",
        type: "error" as NotificationType,
        timestamp: Date.now(),
      };
      setNotifications((prev) => [...prev, notification]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  }, [game.target]);

  // Score guess
  const scoreGuess = useCallback(
    (guess: string, target: string): TileStatus[] => {
      const result: TileStatus[] = Array(5).fill("absent");
      const pool = target.split("");

      // First pass: exact matches
      for (let i = 0; i < 5; i++) {
        if (guess[i] === pool[i]) {
          result[i] = "correct";
          pool[i] = "";
        }
      }

      // Second pass: present matches
      for (let i = 0; i < 5; i++) {
        if (result[i] === "correct") continue;
        const idx = pool.indexOf(guess[i]);
        if (idx !== -1) {
          result[i] = "present";
          pool[idx] = "";
        }
      }

      return result;
    },
    []
  );

  // Enhanced notification system with auto-dismiss and icons
  const showNotification = useCallback(
    (message: string, type: NotificationType) => {
      // Prevent duplicate notifications - check if same message already exists
      setNotifications((prev) => {
        const duplicate = prev.find(
          (n) => n.message === message && n.type === type
        );
        if (duplicate) {
          // Already showing this notification, don't add another
          return prev;
        }

        const id = `notification-${Date.now()}-${Math.random()}`;
        const notification: Notification = {
          id,
          message,
          type,
          timestamp: Date.now(),
        };

        // Auto-dismiss after duration
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = window.setTimeout(() => {
          setNotifications((p) => p.filter((n) => n.id !== id));
          notificationTimeoutRef.current = null;
        }, NOTIFICATION_DURATION);

        return [...prev, notification];
      });
    },
    []
  );

  // Clear notifications on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    loadTodaysWord();
  }, [loadTodaysWord]);

  // Handle key input
  const handleKeyInput = useCallback((letter: string) => {
    setGame((prev) => {
      if (prev.done || prev.current.length >= 5) return prev;
      const newState = {
        ...prev,
        current: prev.current + letter,
      };
      // Save state after input
      const today = new Date().toISOString().slice(0, 10);
      saveGameState(newState, today);
      return newState;
    });
  }, []);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    setGame((prev) => {
      if (prev.done || !prev.current) return prev;
      const newState = {
        ...prev,
        current: prev.current.slice(0, -1),
      };
      // Save state after backspace
      const today = new Date().toISOString().slice(0, 10);
      saveGameState(newState, today);
      return newState;
    });
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    setGame((prev) => {
      // Check if can submit
      if (prev.done || prev.current.length !== 5) {
        console.log("❌ Submit blocked:", {
          done: prev.done,
          length: prev.current.length,
        });
        return prev;
      }

      // Validate word synchronously and process
      (async () => {
        const currentWord = prev.current;
        const currentTarget = prev.target;

        console.log("🔍 Validating word:", currentWord);
        const verdict = await validateWord(currentWord);
        console.log("✅ Word validation result:", verdict);

        if (!verdict.valid) {
          setIsInvalidInput(true);

          if (verdict.reason === "length") {
            showNotification("Use 5 letters.", "error");
          } else if (
            verdict.reason === "charset" ||
            verdict.reason === "format"
          ) {
            showNotification("Letters only.", "error");
          } else {
            showNotification("Not a valid word.", "error");
          }

          // Reset invalid state after animation
          setTimeout(
            () => {
              setIsInvalidInput(false);
              setGame((p) => ({ ...p, current: "" }));
            },
            prefersReducedMotion ? 300 : 600
          );
          return;
        }

        const result = scoreGuess(currentWord, currentTarget);
        const newStatus = { ...prev.status };

        // Update keyboard status
        for (let i = 0; i < 5; i++) {
          const letter = currentWord[i];
          if (result[i] === "correct") {
            newStatus[letter] = "correct";
          } else if (
            result[i] === "present" &&
            newStatus[letter] !== "correct"
          ) {
            newStatus[letter] = "present";
          } else if (result[i] === "absent" && !newStatus[letter]) {
            newStatus[letter] = "absent";
          }
        }

        const newGuesses = [...prev.guesses, currentWord];
        const newLastResults = [...prev.lastResults, result];
        const saveDate = new Date().toISOString().slice(0, 10);

        // Start reveal animation
        setGame((p) => {
          const revealingState = {
            ...p,
            animationState: "revealing" as AnimationState,
            guesses: newGuesses,
            lastResults: newLastResults,
            status: newStatus,
          };
          // Save state after submitting guess (before reveal animation)
          saveGameState(revealingState, saveDate);
          return revealingState;
        });

        // Complete animation after delay
        const animationDelay = prefersReducedMotion
          ? 300
          : ANIMATION_DELAY_BASE * 5;
        setTimeout(() => {
          setGame((p) => ({
            ...p,
            animationState: "revealed",
            current: "",
          }));
        }, animationDelay);

        if (currentWord === currentTarget) {
          setTimeout(() => {
            showNotification("🎉 Correct! Well done!", "success");
            setGame((p) => {
              const completedState = {
                ...p,
                done: true,
                animationState: "idle" as AnimationState,
              };
              // Clear saved state when game completes
              clearGameState();
              return completedState;
            });
            onGameComplete?.(true, newGuesses.length);
          }, animationDelay);
        } else if (newGuesses.length === prev.maxGuesses) {
          setTimeout(() => {
            showNotification(
              `Game over! The word was: ${currentTarget}`,
              "error"
            );
            setGame((p) => {
              const completedState = {
                ...p,
                done: true,
                animationState: "idle" as AnimationState,
              };
              // Clear saved state when game completes
              clearGameState();
              return completedState;
            });
            onGameComplete?.(false, newGuesses.length);
          }, animationDelay);
        } else {
          setTimeout(() => {
            setGame((p) => {
              const newState = {
                ...p,
                animationState: "idle" as AnimationState,
              };
              // Save state after guess (before animation completes)
              saveGameState(newState, saveDate);
              return newState;
            });
          }, animationDelay);
        }
      })();

      return prev;
    });
  }, [scoreGuess, showNotification, onGameComplete, prefersReducedMotion]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.done || isLoading) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        e.preventDefault();
        handleKeyInput(e.key.toUpperCase());
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [game.done, isLoading, handleBackspace, handleSubmit, handleKeyInput]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Render game grid with enhanced accessibility and animations
  const renderGrid = () => {
    const tiles = [];
    const currentRowIndex = game.guesses.length;
    const isRevealingRow =
      game.animationState === "revealing" &&
      currentRowIndex === game.guesses.length - 1;

    for (let i = 0; i < game.maxGuesses; i++) {
      const guess =
        game.guesses[i] || (i === currentRowIndex ? game.current : "");
      const isCurrentRow = i === currentRowIndex && !game.done;
      const rowStatus = i < game.guesses.length ? game.lastResults[i] : null;

      for (let j = 0; j < 5; j++) {
        const letter = guess[j] || "";
        const status = rowStatus ? rowStatus[j] : "";
        const animationDelay =
          isRevealingRow && rowStatus ? j * ANIMATION_DELAY_BASE : 0;

        tiles.push(
          <div
            key={`${i}-${j}`}
            className={`fw-tile ${status} ${isCurrentRow ? "fw-tile-current" : ""} ${isRevealingRow && rowStatus ? "fw-tile-revealing" : ""} ${isInvalidInput && isCurrentRow ? "fw-tile-shake" : ""}`}
            role="gridcell"
            aria-label={
              letter ? `${letter}, ${status || "empty"}` : "Empty tile"
            }
            aria-colindex={j + 1}
            aria-rowindex={i + 1}
            style={
              prefersReducedMotion
                ? {}
                : ({
                    "--reveal-delay": `${animationDelay}ms`,
                  } as React.CSSProperties)
            }
            data-status={status}
          >
            {letter}
          </div>
        );
      }
    }
    return tiles;
  };

  // Render keyboard
  const renderKeyboard = () => {
    const rows = [];

    // Row 1: QWERTYUIOP (no backspace here)
    const row1 = [];
    for (const letter of KEYBOARD_ROWS[0]) {
      const status = game.status[letter] || "";
      row1.push(
        <button
          key={letter}
          className={`fw-key ${status}`}
          onClick={() => handleKeyInput(letter)}
          disabled={game.done || isLoading}
          aria-label={`Key ${letter}${status ? `, ${status}` : ""}`}
          aria-pressed={status ? "true" : "false"}
        >
          {letter}
        </button>
      );
    }
    rows.push(
      <div key="row1" className="fw-kb-row">
        <div className="fw-kb-wrap">{row1}</div>
      </div>
    );

    // Row 2: ASDFGHJKL
    const row2 = [];
    for (const letter of KEYBOARD_ROWS[1]) {
      const status = game.status[letter] || "";
      row2.push(
        <button
          key={letter}
          className={`fw-key ${status}`}
          onClick={() => handleKeyInput(letter)}
          disabled={game.done || isLoading}
          aria-label={`Key ${letter}${status ? `, ${status}` : ""}`}
          aria-pressed={status ? "true" : "false"}
        >
          {letter}
        </button>
      );
    }
    rows.push(
      <div key="row2" className="fw-kb-row">
        <div className="fw-kb-wrap">{row2}</div>
      </div>
    );

    // Row 3: Enter + ZXCVBNM + Backspace
    const row3 = [
      <button
        key="enter"
        className="fw-key fw-key-enter"
        onClick={handleSubmit}
        disabled={game.done || isLoading || game.current.length !== 5}
        aria-label="Submit guess"
      >
        Enter
      </button>,
    ];
    for (const letter of KEYBOARD_ROWS[2]) {
      const status = game.status[letter] || "";
      row3.push(
        <button
          key={letter}
          className={`fw-key ${status}`}
          onClick={() => handleKeyInput(letter)}
          disabled={game.done || isLoading}
          aria-label={`Key ${letter}${status ? `, ${status}` : ""}`}
          aria-pressed={status ? "true" : "false"}
        >
          {letter}
        </button>
      );
    }
    row3.push(
      <button
        key="backspace"
        className="fw-key fw-key-back"
        onClick={handleBackspace}
        disabled={game.done || isLoading || !game.current}
        aria-label="Delete letter"
      >
        ⌫
      </button>
    );
    rows.push(
      <div key="row3" className="fw-kb-row">
        <div className="fw-kb-wrap">{row3}</div>
      </div>
    );

    return rows;
  };

  if (isLoading) {
    return (
      <div className="flickword-game">
        <div className="fw-header">
          {/* TEMPORARY: Small testing button above title */}
          <button
            onClick={handleNewWord}
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
            }}
            title="Load new word"
          >
            🧪
          </button>
          <h3>🎯 FlickWord</h3>
          <div className="fw-stats">
            <span className="fw-streak">Loading...</span>
          </div>
        </div>
        <div className="fw-loading">
          <div className="fw-spinner"></div>
          <p>Loading today&apos;s word...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flickword-game"
      role="application"
      aria-label="FlickWord game"
      aria-describedby="flickword-description"
    >
      {/* Hidden description for screen readers */}
      <div id="flickword-description" className="sr-only">
        Word guessing game. Guess the 5-letter word in {game.maxGuesses}{" "}
        attempts.
        {game.done &&
          `Game ${game.guesses[game.guesses.length - 1] === game.target ? "won" : "lost"}.`}
      </div>

      {/* Enhanced Toast Notifications */}
      <div
        className="fw-notifications-container"
        role="region"
        aria-live="polite"
        aria-atomic="true"
      >
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`fw-notification fw-notification-${notification.type}`}
            role="alert"
            aria-live="assertive"
          >
            <span className="fw-notification-icon" aria-hidden="true">
              {notification.type === "success" && "✓"}
              {notification.type === "error" && "✕"}
              {notification.type === "info" && "ℹ"}
              {notification.type === "warning" && "⚠"}
            </span>
            <span className="fw-notification-message">
              {notification.message}
            </span>
            <button
              className="fw-notification-close"
              onClick={() =>
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== notification.id)
                )
              }
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Word Info (if available) - Hidden by default */}
      {game.wordInfo?.definition && game.showHint && (
        <div className="fw-word-info" role="region" aria-label="Word hint">
          <p>
            <strong>Hint:</strong> {game.wordInfo.definition}
          </p>
        </div>
      )}

      {/* Game Grid */}
      <div
        ref={gridRef}
        className="fw-grid"
        aria-label="FlickWord board"
        role="grid"
        aria-rowcount={game.maxGuesses}
        aria-colcount={5}
      >
        {renderGrid()}
      </div>

      {/* Keyboard */}
      <div className="fw-keyboard" aria-label="Virtual keyboard" role="group">
        {renderKeyboard()}
      </div>

      {/* Actions */}
      <div className="fw-actions">
        {onClose && (
          <button
            className="fw-btn fw-close"
            onClick={onClose}
            aria-label="Close game"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
