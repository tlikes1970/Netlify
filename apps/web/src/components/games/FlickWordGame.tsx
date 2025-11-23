/**
 * Process: FlickWord Game Component
 * Purpose: Wordle-style word guessing game with daily word challenges
 * Data Source: dailyWordApi for target word, validateWord for guess validation
 * Update Path: Game state managed via React hooks, localStorage for stats
 * Dependencies: dailyWordApi, validateWord, flickword.css
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSettings } from "@/lib/settings";
import { useProStatus } from "../../lib/proStatus";
import { getTodaysWord } from "../../lib/dailyWordApi";
import { validateWord } from "../../lib/words/validateWord";
import { getDailySeedDate } from "../../lib/dailySeed";
import { getFlickWordGameStateKey, getFlickWordGamesCompletedKey, getFlickWordDailyKey } from '../../lib/cacheKeys';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { saveCompletedFlickWordGame, getCompletedFlickWordGames } from '../../lib/gameReview';
import { trackFlickWordGameStart, trackFlickWordGameComplete, trackFlickWordGuess, trackFlickWordShare, trackGameError } from '../../lib/analytics';
import { shareWithFallback } from '../../lib/shareLinks';
import { getToastCallback } from '@/state/actions';
import { parseFlickWordShareParams, storageKeyFlickWordShareParams, type FlickWordShareParams } from '../../lib/games/flickwordShared';

// Game configuration
const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const NOTIFICATION_DURATION = 3000;
const ANIMATION_DELAY_BASE = 100; // Base delay for tile animations

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
  onShowStats?: () => void;
  onShowReview?: (params?: FlickWordShareParams | null) => void;
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
  gameNumber?: number; // Game number (1-3 for Pro users, 1 for Regular)
}

/**
 * Save game state to localStorage
 */
function saveGameState(game: GameState, date: string, gameNumber?: number): void {
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
      gameNumber,
    };
    localStorage.setItem(getFlickWordGameStateKey(), JSON.stringify(savedState));
    console.log("💾 Game state saved:", {
      target: game.target,
      guesses: game.guesses.length,
      date,
      gameNumber,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error("❌ localStorage quota exceeded. Cannot save game state.");
      // Could show user notification here
    } else {
      console.warn("Failed to save game state:", error);
    }
  }
}

/**
 * Find in-progress game state for today (any game number)
 * Returns the saved state and its gameNumber if found, null otherwise
 * This is used during initialization to determine which game to restore
 */
function findInProgressGameState(currentDate: string): { state: SavedGameState; gameNumber: number } | null {
  try {
    const saved = localStorage.getItem(getFlickWordGameStateKey());
    if (!saved) return null;

    const savedState: SavedGameState = JSON.parse(saved);
    const savedGameNumber = savedState.gameNumber ?? 1; // Default to 1 for legacy saves

    // Check if it's for today and NOT done (in-progress)
    if (
      savedState.date === currentDate &&
      savedState.done === false &&
      savedState.target
    ) {
      console.log("📂 Found in-progress game state:", {
        target: savedState.target,
        guesses: savedState.guesses.length,
        gameNumber: savedGameNumber,
      });
      return { state: savedState, gameNumber: savedGameNumber };
    }

    return null;
  } catch (error) {
    console.warn("Failed to find in-progress game state:", error);
    return null;
  }
}

/**
 * Restore game state from localStorage
 * Returns null if no saved state or state is for a different day/game
 */
function restoreGameState(currentDate: string, currentGameNumber: number): SavedGameState | null {
  try {
    const saved = localStorage.getItem(getFlickWordGameStateKey());
    if (!saved) return null;

    const savedState: SavedGameState = JSON.parse(saved);

    // Restore if it's for today's word and same game number
    // Allow restoring completed games so users can see their results
    const savedGameNumber = savedState.gameNumber ?? 1; // Default to 1 for legacy saves
    if (
      savedState.date === currentDate &&
      savedGameNumber === currentGameNumber &&
      savedState.target
    ) {
      console.log("📂 Game state restored:", {
        target: savedState.target,
        guesses: savedState.guesses.length,
        gameNumber: savedGameNumber,
        done: savedState.done,
      });
      return savedState;
    } else if (savedState.date !== currentDate || savedGameNumber !== currentGameNumber) {
      // Clear old game state from different day or game number
      localStorage.removeItem(getFlickWordGameStateKey());
      console.log("🗑️ Cleared game state from different day/game");
    }

    return null;
  } catch (error) {
    console.warn("Failed to restore game state:", error);
    // Clear corrupted state
    localStorage.removeItem(getFlickWordGameStateKey());
    return null;
  }
}

/**
 * Clear saved game state
 */
function clearGameState(): void {
  try {
    localStorage.removeItem(getFlickWordGameStateKey());
    console.log("🗑️ Game state cleared");
  } catch (error) {
    console.warn("Failed to clear game state:", error);
  }
}

export default function FlickWordGame({
  onClose,
  onGameComplete,
  onShowStats,
  onShowReview,
}: FlickWordGameProps) {
  const settings = useSettings();
  const { isPro } = useProStatus();
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gamesCompletedToday, setGamesCompletedToday] = useState(0);
  const [currentGame, setCurrentGame] = useState(1); // Track current game number (1-3 for Pro, 1 for Regular)
  const [showLostScreen, setShowLostScreen] = useState(false);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showProChip, setShowProChip] = useState(false);
  const [isSubmittingUI, setIsSubmittingUI] = useState(false); // UI state for validation feedback
  const gridRef = useRef<HTMLDivElement>(null);
  const notificationTimeoutRef = useRef<number | null>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const isSubmittingRef = useRef<boolean>(false); // Guard against concurrent submissions
  const currentGameStateRef = useRef<GameState | null>(null); // Capture game state for async operations
  const isOnline = useOnlineStatus();

  // Game limits: Regular users get 1 game per day, Pro users get 3 games per day
  const MAX_GAMES_FREE = 1; // Regular users get 1 game per day
  const MAX_GAMES_PRO = 3; // Pro users get 3 games per day

  // Get games completed today for FlickWord (uses UTC date for consistency)
  const getGamesCompletedToday = (): number => {
    try {
      const today = getDailySeedDate(); // UTC-based date
      const key = getFlickWordGamesCompletedKey(today);
      const count = parseInt(localStorage.getItem(key) || "0", 10);
      // Cap to max games to prevent invalid counts
      const maxGames = isPro ? MAX_GAMES_PRO : MAX_GAMES_FREE;
      return Math.min(count, maxGames);
    } catch {
      return 0;
    }
  };

  // Save games completed today (uses UTC date for consistency)
  const saveGamesCompletedToday = (count: number): void => {
    try {
      const today = getDailySeedDate(); // UTC-based date
      const key = getFlickWordGamesCompletedKey(today);
      localStorage.setItem(key, String(count));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error("❌ localStorage quota exceeded. Cannot save games completed count.");
        showNotification("Storage full. Game progress may not be saved.", "warning");
      } else {
        console.warn("Failed to save games completed:", e);
      }
    }
  };

  // Initialize games completed and current game
  // FIXED: Check for in-progress games first, then calculate next game from completed count
  // This prevents "Game 2" from showing when user just completed Game 1
  useEffect(() => {
    const maxGames = isPro ? MAX_GAMES_PRO : MAX_GAMES_FREE;
    const today = getDailySeedDate();
    
    // Step 1: Check for in-progress game state first
    const inProgressGame = findInProgressGameState(today);
    
    if (inProgressGame) {
      // Found in-progress game - restore it immediately
      const { state, gameNumber } = inProgressGame;
      setCurrentGame(gameNumber);
      
      // Restore the game state directly (don't wait for loadTodaysWord)
      setGame({
        ...state,
        animationState: "idle" as AnimationState,
      });
      setIsLoading(false);
      
      // Set gamesCompletedToday based on the in-progress game
      // If gameNumber is 2, then at most 1 game is completed (gameNumber - 1)
      const estimatedCompleted = Math.max(0, gameNumber - 1);
      const completed = getGamesCompletedToday();
      // Use the minimum to be safe (don't overcount)
      const safeCompleted = Math.min(completed, estimatedCompleted);
      setGamesCompletedToday(safeCompleted);
      console.log(
        "🎯 Found and restored in-progress game:",
        "Game number:",
        gameNumber,
        "Estimated completed:",
        safeCompleted,
        `(${isPro ? "Pro" : "Regular"}: ${maxGames} ${maxGames === 1 ? "game" : "games"} per day)`
      );
    } else {
      // Step 2: No in-progress game - calculate from completed count
      const completed = getGamesCompletedToday();
      // Clamp completed to valid range
      const clampedCompleted = Math.min(Math.max(0, completed), maxGames);
      setGamesCompletedToday(clampedCompleted);
      
      // Step 3: Determine currentGame
      // If all games are completed, stay on the last game
      // Otherwise, set to the next game to start
      let nextGame: number;
      if (clampedCompleted >= maxGames) {
        // All games completed - stay on last game
        nextGame = maxGames;
      } else {
        // Next game to start
        nextGame = clampedCompleted + 1;
      }
      
      setCurrentGame(nextGame);
      console.log(
        "🎯 User games status:",
        "Games completed today:",
        clampedCompleted,
        "Starting game:",
        nextGame,
        `(${isPro ? "Pro" : "Regular"}: ${maxGames} ${maxGames === 1 ? "game" : "games"} per day)`
      );
    }
  }, [isPro]);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Get today's word from API (deterministic based on date and game number)
  // Regular: 1 word per day (gameNumber = 1)
  // Pro: 3 words per day (gameNumber = 1, 2, or 3)
  const loadTodaysWord = useCallback(
    async (forceNew: boolean = false, restoreState: boolean = true) => {
      try {
        setIsLoading(true);
        // Validate and clamp game number to valid range (1-3)
        let gameNumber = isPro ? currentGame : 1;
        if (gameNumber < 1 || gameNumber > 3) {
          console.warn(`Invalid game number ${gameNumber}, clamping to valid range`);
          gameNumber = Math.max(1, Math.min(3, gameNumber));
        }
        console.log(`🔄 Loading today's word for game ${gameNumber}...`);

        // Get today's date (UTC-based for consistent daily content)
        const today = getDailySeedDate();

        // If forcing new word, clear cache first
        if (forceNew) {
          const gameCacheKey = getFlickWordDailyKey(gameNumber);
          localStorage.removeItem(gameCacheKey);
          clearGameState(); // Also clear game state when forcing new word
          console.log("🗑️ Cleared word cache for new word");
        }

        // Try to restore saved game state first (if not forcing new)
        // Only restore if it's for the same game number
        if (restoreState && !forceNew) {
          const savedState = restoreGameState(today, gameNumber);
          if (savedState && savedState.target) {
            // Restore game state (including keyboard status)
            setGame({
              ...savedState,
              animationState: "idle", // Always reset animation state
            });
            setIsLoading(false);
            console.log("✅ Game state restored from previous session");
            return;
          }
        }

        // Use daily word - pass gameNumber for Pro users
        const wordData = await getTodaysWord(gameNumber);
        console.log(`📦 Daily word data received for game ${gameNumber}:`, wordData);

        // Validate that we got a proper word (comprehensive validation)
        if (wordData && wordData.word && 
            typeof wordData.word === 'string' &&
            wordData.word.length === 5 &&
            /^[a-zA-Z]{5}$/.test(wordData.word)) {
          // Reset keyboard status when starting a new game
          const newGameState = {
            target: wordData.word.toUpperCase(),
            guesses: [],
            current: "",
            maxGuesses: 6,
            done: false,
            status: {}, // Reset keyboard status for new game
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
          saveGameState(newGameState, today, gameNumber);
          
          // Track game start analytics
          trackFlickWordGameStart(gameNumber, isPro);

          console.log(`✅ Game target set to: ${wordData.word.toUpperCase()} (game ${gameNumber})`);
        } else {
          throw new Error("Invalid word data received");
        }
      } catch (error) {
        console.error("❌ Failed to load daily word:", error);
        setErrorMessage("Failed to load today's word. Using backup word.");
        // Fallback to different words for different game numbers (deterministic based on date + game number)
        const fallbackWords = ["HOUSE", "CRANE", "BLISS"];
        const gameNumber = isProUser ? currentGame : 1;
        // Use date + game number for deterministic fallback selection
        const fallbackDate = getDailySeedDate(); // UTC-based date
        const dateSeed = parseInt(fallbackDate.replace(/-/g, ''), 10);
        const combinedSeed = dateSeed + (gameNumber - 1) * 1000;
        const fallbackIndex = combinedSeed % fallbackWords.length;
        const fallbackWord = fallbackWords[fallbackIndex];
        console.log(`🔄 Using fallback word for game ${gameNumber}:`, fallbackWord);
        const fallbackState = {
          target: fallbackWord,
          guesses: [],
          current: "",
          maxGuesses: 6,
          done: false,
          status: {}, // Reset keyboard status
          lastResults: [],
          wordInfo: {
            definition: "A building for human habitation",
            difficulty: "easy",
          },
          showHint: false,
          animationState: "idle" as AnimationState,
        };
        setGame(fallbackState);
        saveGameState(fallbackState, fallbackDate, gameNumber);
      } finally {
        setIsLoading(false);
        console.log("🏁 Word loading complete");
      }
    },
    [isPro, currentGame]
  );

  // Note: Removed unused _handleNewWord function to reduce code complexity
  // If dev testing feature is needed in future, implement proper dev mode testing interface

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

  // Clear notifications on unmount and ensure all timeouts are cleared
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
      // Clear any pending notifications
      setNotifications([]);
    };
  }, []);

  // Initialize game
  // Only loads word if game state hasn't been restored yet
  const initializeGame = useCallback(() => {
    // Check if we already have a game state loaded (from in-progress restore)
    // If game.target exists and we're not loading, skip loading
    if (game.target && !isLoading) {
      console.log("✅ Game already initialized, skipping loadTodaysWord");
      return;
    }
    loadTodaysWord();
  }, [loadTodaysWord, game.target, isLoading]);

  // Start next game - Regular: 1 game/day, Pro: 3 games/day
  const handleNextGame = useCallback(() => {
    const maxGames = isPro ? MAX_GAMES_PRO : MAX_GAMES_FREE;
    if (gamesCompletedToday < maxGames) {
      const nextGame = Math.min(gamesCompletedToday + 1, maxGames);
      // Validate game number bounds
      const validatedGame = Math.max(1, Math.min(maxGames, nextGame));
      setCurrentGame(validatedGame);
      setShowWinScreen(false);
      setShowLostScreen(false);
      // Reset game state for new game (including keyboard status)
      setGame({
        target: "",
        guesses: [],
        current: "",
        maxGuesses: 6,
        done: false,
        status: {}, // Reset keyboard status for new game
        lastResults: [],
        wordInfo: undefined,
        showHint: false,
        animationState: "idle" as AnimationState,
      });
      // Clear tile refs to prevent unbounded growth
      tileRefs.current = [];
      clearGameState();
      // Load new word for next game
      loadTodaysWord(false, false); // Don't restore state, force new game
    }
  }, [gamesCompletedToday, loadTodaysWord, isPro]);

  // Handle key input
  // FIXED: Disable input during validation
  const handleKeyInput = useCallback((letter: string) => {
    if (isSubmittingUI) return; // Block input during validation
    setGame((prev) => {
      if (prev.done || prev.current.length >= 5) return prev;
      const newState = {
        ...prev,
        current: prev.current + letter,
      };
      // Save state after input
      const today = getDailySeedDate(); // UTC-based date
      const gameNumber = isProUser ? currentGame : 1;
      saveGameState(newState, today, gameNumber);
      return newState;
    });
  }, [isPro, currentGame, isSubmittingUI];

  // Handle backspace
  // FIXED: Disable input during validation
  const handleBackspace = useCallback(() => {
    if (isSubmittingUI) return; // Block input during validation
    setGame((prev) => {
      if (prev.done || !prev.current) return prev;
      const newState = {
        ...prev,
        current: prev.current.slice(0, -1),
      };
      // Save state after backspace
      const today = getDailySeedDate(); // UTC-based date
      const gameNumber = isProUser ? currentGame : 1;
      saveGameState(newState, today, gameNumber);
      return newState;
    });
  }, [isPro, currentGame, isSubmittingUI];

  // Handle submit - fixed race condition by moving async outside setGame
  // FIXED: Added try/finally to guarantee reset, added visual feedback during validation
  const handleSubmit = useCallback(async () => {
    // Guard against concurrent submissions
    if (isSubmittingRef.current || isSubmittingUI) {
      console.log("❌ Submit blocked: already submitting");
      return;
    }

    // Get current game state before async operations
    let shouldProceed = false;
    setGame((prev) => {
      // Check if can submit
      if (prev.done || prev.current.length !== 5 || isSubmittingRef.current) {
        console.log("❌ Submit blocked:", {
          done: prev.done,
          length: prev.current.length,
          isSubmitting: isSubmittingRef.current,
        });
        currentGameStateRef.current = null;
        return prev;
      }

      // Set submitting flags and capture state
      isSubmittingRef.current = true;
      currentGameStateRef.current = prev;
      shouldProceed = true;
      return prev; // Return unchanged state, we'll update it after validation
    });

    // Wait for state to be set
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check if we have valid state
    const currentGameState = currentGameStateRef.current;
    if (!currentGameState || !shouldProceed) {
      console.error("❌ No game state available for validation");
      isSubmittingRef.current = false;
      setIsSubmittingUI(false);
      return;
    }

    // Set UI state to show validation feedback
    setIsSubmittingUI(true);

    // Now do async validation outside of setGame callback
    const currentWord = currentGameState.current;
    const currentTarget = currentGameState.target;

    try {
      console.log("🔍 Validating word:", currentWord);
      const verdict = await validateWord(currentWord);
      console.log("✅ Word validation result:", verdict);

      if (!verdict.valid) {
        // Track validation error
        trackGameError('flickword', 'invalid_word', { word: currentWord, reason: verdict.reason });
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

      // Check if word has already been guessed
      if (currentGameState.guesses.includes(currentWord)) {
        showNotification("You already tried that word!", "error");
        setTimeout(
          () => {
            setGame((p) => ({ ...p, current: "" }));
          },
          prefersReducedMotion ? 300 : 600
        );
      return;
    }

      // Word is valid - proceed with scoring and animation
      const result = scoreGuess(currentWord, currentTarget);
      
      // Track guess analytics
      trackFlickWordGuess(currentWord, currentGameState.guesses.length + 1);
      
      const newStatus = { ...currentGameState.status };

      // Update keyboard status - prioritize correct > present > absent
      for (let i = 0; i < 5; i++) {
        const letter = currentWord[i];
        const currentStatus = newStatus[letter];
        
        if (result[i] === "correct") {
          // Always set correct (highest priority)
          newStatus[letter] = "correct";
        } else if (result[i] === "present") {
          // Set present only if not already correct
          if (currentStatus !== "correct") {
            newStatus[letter] = "present";
          }
        } else if (result[i] === "absent") {
          // Set absent only if no status exists yet (don't downgrade correct/present)
          if (!currentStatus) {
            newStatus[letter] = "absent";
          }
        }
      }

      const newGuesses = [...currentGameState.guesses, currentWord];
      const newLastResults = [...currentGameState.lastResults, result];
      const saveDate = getDailySeedDate(); // UTC-based date
      const gameNumber = isProUser ? currentGame : 1;

      // Start reveal animation - clear UI submitting state once grid updates
      setGame((p) => {
        const revealingState = {
          ...p,
          animationState: "revealing" as AnimationState,
          guesses: newGuesses,
          lastResults: newLastResults,
          status: newStatus,
        };
        // Save state after submitting guess (before reveal animation)
        saveGameState(revealingState, saveDate, gameNumber);
        return revealingState;
      });

      // Clear UI submitting state now that grid has updated
      setIsSubmittingUI(false);

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
          const gameNumber = isProUser ? currentGame : 1;
          const today = getDailySeedDate();
          
          // Save completed game for review
          // Convert TileStatus[][] to Array<'correct' | 'present' | 'absent'>[]
          // scoreGuess always returns valid statuses (never empty strings in practice)
          const convertedResults: Array<'correct' | 'present' | 'absent'>[] = newLastResults.map(row =>
            row.filter((status): status is 'correct' | 'present' | 'absent' => 
              status !== ''
            ) as Array<'correct' | 'present' | 'absent'>
          );
          saveCompletedFlickWordGame({
            date: today,
            gameNumber,
            target: currentTarget,
            guesses: newGuesses,
            won: true,
            lastResults: convertedResults,
            completedAt: Date.now(),
          });
          
          // Track analytics
          trackFlickWordGameComplete(true, newGuesses.length, gameNumber, isPro);
          
          setGame((p) => {
            const completedState = {
              ...p,
              done: true,
              animationState: "idle" as AnimationState,
            };
            // Save completed state so it can be restored later
            saveGameState(completedState, today, gameNumber);
            return completedState;
          });
          // Update games completed today (cap to max games)
          const maxGames = isPro ? MAX_GAMES_PRO : MAX_GAMES_FREE;
          const newGamesCompleted = Math.min(gamesCompletedToday + 1, maxGames);
          setGamesCompletedToday(newGamesCompleted);
          saveGamesCompletedToday(newGamesCompleted);
          onGameComplete?.(true, newGuesses.length);
          isSubmittingRef.current = false; // Reset submitting flag
          // Show win screen after animation
          setTimeout(() => {
            setShowWinScreen(true);
          }, 500);
        }, animationDelay);
      } else if (newGuesses.length === currentGameState.maxGuesses) {
        setTimeout(() => {
          const gameNumber = isProUser ? currentGame : 1;
          const today = getDailySeedDate();
          
          // Save completed game for review
          // Convert TileStatus[][] to Array<'correct' | 'present' | 'absent'>[]
          // scoreGuess always returns valid statuses (never empty strings in practice)
          const convertedResults: Array<'correct' | 'present' | 'absent'>[] = newLastResults.map(row =>
            row.filter((status): status is 'correct' | 'present' | 'absent' => 
              status !== ''
            ) as Array<'correct' | 'present' | 'absent'>
          );
          saveCompletedFlickWordGame({
            date: today,
            gameNumber,
            target: currentTarget,
            guesses: newGuesses,
            won: false,
            lastResults: convertedResults,
            completedAt: Date.now(),
          });
          
          // Track analytics
          trackFlickWordGameComplete(false, newGuesses.length, gameNumber, isPro);
          
          setGame((p) => {
            const completedState = {
              ...p,
              done: true,
              animationState: "idle" as AnimationState,
            };
            // Save completed state so it can be restored later
            saveGameState(completedState, today, gameNumber);
            return completedState;
          });
          // Update games completed today (cap to max games)
          const maxGames = isPro ? MAX_GAMES_PRO : MAX_GAMES_FREE;
          const newGamesCompleted = Math.min(gamesCompletedToday + 1, maxGames);
          setGamesCompletedToday(newGamesCompleted);
          saveGamesCompletedToday(newGamesCompleted);
          onGameComplete?.(false, newGuesses.length);
          isSubmittingRef.current = false; // Reset submitting flag
          // Show lost screen after animation
          setTimeout(() => {
            setShowLostScreen(true);
          }, 500);
        }, animationDelay);
      } else {
        setTimeout(() => {
          setGame((p) => {
            const newState = {
              ...p,
              animationState: "idle" as AnimationState,
            };
            // Save state after guess (before animation completes)
            const gameNumber = isProUser ? currentGame : 1;
            saveGameState(newState, saveDate, gameNumber);
            isSubmittingRef.current = false; // Reset submitting flag
            return newState;
          });
        }, animationDelay);
      }
    } catch (error) {
      // Handle validation errors or network failures
      console.error("❌ Error during word validation or submission:", error);
      showNotification("Unable to validate word. Please try again.", "error");
      setGame((p) => ({ ...p, current: "" }));
    } finally {
      // ALWAYS reset both flags, regardless of success or failure
      isSubmittingRef.current = false;
      setIsSubmittingUI(false);
    }
  }, [scoreGuess, showNotification, onGameComplete, prefersReducedMotion, isPro, currentGame, gamesCompletedToday, isSubmittingUI]);

  // Keyboard event handling
  // FIXED: Disable input during validation to prevent spam and show clear feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.done || isLoading || isSubmittingUI) return;

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
  }, [game.done, isLoading, isSubmittingUI, handleBackspace, handleSubmit, handleKeyInput]);

  // Check for share link params on mount
  // Share params flow: App.tsx → localStorage → FlickWordGame → FlickWordModal → FlickWordReview
  useEffect(() => {
    try {
      const shareParamsStr = localStorage.getItem(storageKeyFlickWordShareParams);
      if (shareParamsStr) {
        const raw = JSON.parse(shareParamsStr);
        const shareParams = parseFlickWordShareParams(raw);
        
        if (shareParams) {
          console.log("[FlickWord] Share link params detected:", shareParams);
          
          // If mode is 'sharedResult' or 'sharedAll', show review screen
          if ((shareParams.mode === "sharedResult" || shareParams.mode === "sharedAll") && shareParams.date) {
            // Navigate to review screen with share params
            // The review screen will filter by date/gameNumber based on mode
            if (onShowReview) {
              onShowReview(shareParams);
            }
          }
          // Note: We do NOT clear share params here - FlickWordReview will clear them after reading
        } else {
          // Invalid params, clear them
          localStorage.removeItem(storageKeyFlickWordShareParams);
        }
      }
    } catch (e) {
      console.warn("Failed to process share params:", e);
      // Clear corrupted params
      try {
        localStorage.removeItem(storageKeyFlickWordShareParams);
      } catch {
        // Ignore cleanup errors
      }
    }
  }, [onShowReview]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Handle explore shows button - navigate to search with word
  const handleExploreShows = useCallback(() => {
    setShowLostScreen(false);
    // Dispatch custom event to trigger search in App
    window.dispatchEvent(new CustomEvent('flickword:explore', {
      detail: { word: game.target }
    }));
    // Also try to set search via localStorage for App to pick up
    try {
      localStorage.setItem('flickword:search-word', game.target);
    } catch (e) {
      console.warn('Failed to set search word:', e);
    }
    // Close modal and navigate
    if (onClose) {
      onClose();
    }
    // Navigate to discovery/search view
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.dispatchEvent(new CustomEvent('pushstate'));
  }, [game.target, onClose]);

  // Generate share text (Wordle-style grid) - single game
  // Note: URL is NOT included here - it will be added by shareWithFallback
  const generateShareText = useCallback((gameNumber?: number) => {
    const lines: string[] = [];
    const shareGameNumber = gameNumber ?? (isPro ? currentGame : 1);
    const gameLabel = isPro ? ` Game ${shareGameNumber}` : '';
    lines.push(`FlickWord ${getDailySeedDate()}${gameLabel}`);
    lines.push('');
    
    for (let i = 0; i < game.guesses.length; i++) {
      const result = game.lastResults[i] || [];
      const line = result.map(status => {
        if (status === 'correct') return '🟩';
        if (status === 'present') return '🟨';
        return '⬜';
      }).join('');
      lines.push(line);
    }
    
    lines.push('');
    lines.push('Play FlickWord at flicklet.app');
    
    return lines.join('\n');
  }, [game.guesses, game.lastResults, isPro, currentGame]);
  
  // Generate share text for all completed games (Pro only)
  // Note: URL is NOT included here - it will be added by shareWithFallback
  const generateAllGamesShareText = useCallback(() => {
    const completedGames = getCompletedFlickWordGames();
    
    const lines: string[] = [];
    lines.push(`FlickWord ${getDailySeedDate()} - All Games`);
    lines.push('');
    
    completedGames.forEach((completedGame, idx) => {
      if (idx > 0) lines.push('');
      lines.push(`Game ${completedGame.gameNumber}:`);
      for (let i = 0; i < completedGame.guesses.length; i++) {
        const result = completedGame.lastResults[i] || [];
        const line = result.map(status => {
          if (status === 'correct') return '🟩';
          if (status === 'present') return '🟨';
          return '⬜';
        }).join('');
        lines.push(line);
      }
    });
    
    lines.push('');
    lines.push('Play FlickWord at flicklet.app');
    
    return lines.join('\n');
  }, []);

  // Primary share handler for FlickWord
  // Handle share - single game or all games
  // Share link deep-linking: Includes date and gameNumber so link opens to correct game
  // Config: App.tsx handles ?game=flickword&date=...&gameNumber=... query params
  const handleShare = useCallback(async (shareAll: boolean = false) => {
    const shareText = shareAll && isPro 
      ? generateAllGamesShareText() 
      : generateShareText();
    
    // Build share URL with deep-link params
    const today = getDailySeedDate();
    const origin = typeof window !== "undefined" ? window.location.origin : "https://flicklet.netlify.app";
    
    let shareUrl: string;
    if (shareAll && isPro) {
      // Share all games: use mode=sharedAll, no gameNumber
      shareUrl = `${origin}/?game=flickword&date=${today}&mode=sharedAll`;
    } else {
      // Share single game: include gameNumber
      const gameNumber = isProUser ? currentGame : 1;
      shareUrl = `${origin}/?game=flickword&date=${today}&gameNumber=${gameNumber}&mode=sharedResult`;
    }
    
    // Track analytics
    const gameNumber = isProUser ? currentGame : 1;
    trackFlickWordShare(shareAll ? null : gameNumber, shareAll ? 'all' : 'single');
    
    // Use unified share helper
    await shareWithFallback({
      title: 'FlickWord',
      text: shareText,
      url: shareUrl,
      onSuccess: () => {
        const toast = getToastCallback();
        if (toast) {
          toast('Share link copied to clipboard!', 'success');
        }
        setShowShareModal(false);
      },
      onError: (error) => {
        console.error('Share failed:', error);
        const toast = getToastCallback();
        if (toast) {
          toast('Unable to share – link copied instead', 'error');
        }
        // Don't close modal on error so user can try again
      },
    });
  }, [generateShareText, generateAllGamesShareText, isPro, currentGame]);

  // Render game grid with enhanced accessibility and animations
  const renderGrid = () => {
    const rows = [];
    const currentRowIndex = game.guesses.length;
    const isRevealingRow =
      game.animationState === "revealing" &&
      currentRowIndex === game.guesses.length - 1;

    // Initialize tile refs array if needed
    if (!tileRefs.current[currentRowIndex]) {
      tileRefs.current[currentRowIndex] = [];
    }

    for (let i = 0; i < game.maxGuesses; i++) {
      const guess =
        game.guesses[i] || (i === currentRowIndex ? game.current : "");
      const isCurrentRow = i === currentRowIndex && !game.done;
      const rowStatus = i < game.guesses.length ? game.lastResults[i] : null;

      const rowTiles = [];
      for (let j = 0; j < 5; j++) {
        const letter = guess[j] || "";
        const status = rowStatus ? rowStatus[j] : "";
        const animationDelay =
          isRevealingRow && rowStatus ? j * ANIMATION_DELAY_BASE : 0;

        let ariaLabel = letter
          ? `${letter}, ${status || "empty"}`
          : "Empty tile";
        if (status === "correct") {
          ariaLabel = `${letter}, correct position`;
        } else if (status === "present") {
          ariaLabel = `${letter}, present but wrong position`;
        } else if (status === "absent") {
          ariaLabel = `${letter}, not in word`;
        }

        rowTiles.push(
          <div
            key={`${i}-${j}`}
            ref={(el) => {
              if (isCurrentRow) {
                if (!tileRefs.current[i]) {
                  tileRefs.current[i] = [];
                }
                tileRefs.current[i][j] = el;
              }
            }}
            className={`fw-tile ${status} ${isCurrentRow ? "fw-tile-current" : ""} ${isRevealingRow && rowStatus ? "fw-tile-revealing" : ""} ${isInvalidInput && isCurrentRow ? "fw-tile-shake" : ""}`}
            data-fw-el="tile"
            role="gridcell"
            aria-label={ariaLabel}
            aria-colindex={j + 1}
            aria-rowindex={i + 1}
            tabIndex={isCurrentRow && j === game.current.length ? 0 : -1}
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
      rows.push(
        <div key={`row-${i}`} data-fw-el="tile-row">
          {rowTiles}
        </div>
      );
    }
    return rows;
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
          data-fw-el="key"
          onClick={() => handleKeyInput(letter)}
          disabled={game.done || isLoading || isSubmittingUI}
          aria-label={`Key ${letter}${status ? `, ${status}` : ""}`}
          aria-pressed={status ? "true" : "false"}
        >
          {letter}
        </button>
      );
    }
    rows.push(
      <div
        key="row1"
        className="fw-kb-row"
        data-fw-el="key-row"
        style={
          { ["--cols" as string]: String(row1.length) } as React.CSSProperties
        }
      >
        {row1}
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
          data-fw-el="key"
          onClick={() => handleKeyInput(letter)}
          disabled={game.done || isLoading || isSubmittingUI}
          aria-label={`Key ${letter}${status ? `, ${status}` : ""}`}
          aria-pressed={status ? "true" : "false"}
        >
          {letter}
        </button>
      );
    }
    rows.push(
      <div
        key="row2"
        className="fw-kb-row"
        data-fw-el="key-row"
        style={
          { ["--cols" as string]: String(row2.length) } as React.CSSProperties
        }
      >
        {row2}
      </div>
    );

    // Row 3: Enter + ZXCVBNM + Backspace
    // FIXED: Show visual feedback during validation
    const row3 = [
      <button
        key="enter"
        className={`fw-key fw-key-enter ${isSubmittingUI ? 'fw-key-submitting' : ''}`}
        data-fw-el="key"
        data-fw-key="enter"
        onClick={handleSubmit}
        disabled={game.done || isLoading || game.current.length !== 5 || isSubmittingUI}
        aria-label={isSubmittingUI ? "Validating word..." : "Submit guess"}
      >
        {isSubmittingUI ? (
          <span className="fw-submitting-indicator">
            <span className="fw-spinner-small" aria-hidden="true"></span>
            Checking...
          </span>
        ) : (
          "Enter"
        )}
      </button>,
    ];
    for (const letter of KEYBOARD_ROWS[2]) {
      const status = game.status[letter] || "";
      row3.push(
        <button
          key={letter}
          className={`fw-key ${status}`}
          data-fw-el="key"
          onClick={() => handleKeyInput(letter)}
          disabled={game.done || isLoading || isSubmittingUI}
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
        data-fw-el="key"
        data-fw-key="backspace"
        onClick={handleBackspace}
        disabled={game.done || isLoading || !game.current || isSubmittingUI}
        aria-label="Delete letter"
      >
        ⌫
      </button>
    );
    rows.push(
      <div
        key="row3"
        className="fw-kb-row"
        data-fw-el="key-row"
        style={
          { ["--cols" as string]: String(row3.length) } as React.CSSProperties
        }
      >
        {row3}
      </div>
    );

    return rows;
  };

  if (isLoading) {
    return (
      <div
        className="flickword-game"
        data-fw-root
        role="status"
        aria-live="polite"
        aria-label="Loading FlickWord game"
      >
        <div className="fw-header">
          <h3>🎯 FlickWord</h3>
          <div className="fw-stats">
            <span className="fw-streak" aria-hidden="true">
              Loading...
            </span>
          </div>
        </div>
        <div className="fw-loading">
          <div className="fw-spinner" aria-hidden="true"></div>
          <p>Loading today&apos;s word...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !game.target) {
    return (
      <div className="flickword-game" data-fw-root role="alert">
        <div className="fw-error">
          <h3>Error Loading Game</h3>
          <p>{errorMessage}</p>
          <button
            className="fw-btn fw-new-game"
            onClick={() => {
              setErrorMessage(null);
              initializeGame();
            }}
            aria-label="Try loading game again"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
      <div
        className="flickword-game"
        data-fw-root
        role="application"
        aria-label="FlickWord game"
        aria-describedby="flickword-description"
      >
        {/* Game progress indicator */}
        {isPro && (
          <div
            className="fw-game-header"
            aria-label={`Game ${currentGame} of ${isPro ? MAX_GAMES_PRO : MAX_GAMES_FREE}`}
          >
            <span className="game-indicator">Game {currentGame} of {isPro ? MAX_GAMES_PRO : MAX_GAMES_FREE}</span>
            {gamesCompletedToday > 0 && (
              <span
                className="games-completed"
                aria-label={`${gamesCompletedToday} games completed today`}
              >
                ({gamesCompletedToday} completed)
              </span>
            )}
          </div>
        )}

        {/* Offline indicator */}
        {!isOnline && (
          <div className="fw-notification fw-notification-info" role="alert" aria-live="polite">
            📡 You&apos;re offline. Using cached word if available.
          </div>
        )}

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

      {/* Playfield wrapper for mobile layout (grid + stats) */}
      <div className="fw-playfield" data-fw-el="playfield">
        {/* Error banner */}
        {errorMessage && (
          <div
            className="fw-error-banner"
            role="alert"
            aria-live="polite"
            aria-label="Warning message"
          >
            <span className="fw-error-icon" aria-hidden="true">
              ⚠️
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Word Info (if available) - Hidden by default */}
        {game.wordInfo?.definition && game.showHint && (
          <div
            className="fw-word-info"
            role="region"
            aria-label="Word hint"
            tabIndex={0}
          >
            <p>
              <strong>Hint:</strong> {game.wordInfo.definition}
            </p>
          </div>
        )}

        {/* Game Grid */}
        <div
          ref={gridRef}
          className="fw-grid"
          aria-label={`FlickWord board. ${game.guesses.length} of ${game.maxGuesses} guesses used. ${game.done ? (game.guesses[game.guesses.length - 1] === game.target ? "Game won!" : "Game lost.") : "Enter a 5-letter word."}`}
          role="grid"
          aria-rowcount={game.maxGuesses}
          aria-colcount={5}
          aria-live="polite"
          aria-atomic="false"
        >
          {renderGrid()}
        </div>

        {/* Pro Chip - Purple, shows only after game ends */}
        {showProChip && game.done && (
          <div className="fw-pro-chip">
            <p><strong>Unlock 2 more rounds</strong> – Go Pro</p>
            <button
              className="fw-pro-chip-dismiss"
              onClick={() => setShowProChip(false)}
              aria-label="Dismiss Pro upgrade message"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Keyboard */}
      <div
        className="fw-keyboard"
        data-fw-el="keyboard"
        aria-label="Virtual keyboard"
        role="group"
      >
        {renderKeyboard()}
      </div>

      {/* Completion message - moved outside playfield to prevent overflow */}
      {game.done && (() => {
        const maxGames = isPro ? MAX_GAMES_PRO : MAX_GAMES_FREE;
        if (gamesCompletedToday >= maxGames) {
          return (
            <div className="fw-games-limit">
              <p>
                ✅ You&apos;ve completed all {maxGames} {maxGames === 1 ? "game" : "games"} today! Come back tomorrow for the next game!
              </p>
              {!isPro && (
                <p className="fw-pro-upsell">
                  🔒 Want more games? Upgrade to Pro for 3 games per day!
                </p>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* Actions - Hidden to match Wordle's minimal design (close via header only) */}
      {false && (
        <div className="fw-actions">
          {onClose && (
            <button
              className="fw-btn fw-close"
              onClick={onClose}
              aria-label="Close FlickWord game"
            >
              Close
            </button>
          )}
        </div>
      )}

      {/* Win Screen Modal */}
      {showWinScreen && (
        <div className="fw-lost-screen">
          <div className="fw-lost-content">
            <h2>🎉 Congratulations!</h2>
            <p className="fw-lost-word">You guessed it in <strong>{game.guesses.length}</strong> {game.guesses.length === 1 ? 'guess' : 'guesses'}!</p>
            <p className="fw-lost-word">The word was: <strong>{game.target}</strong></p>
            <div className="fw-lost-actions">
              {(() => {
                const maxGames = isPro ? MAX_GAMES_PRO : MAX_GAMES_FREE;
                if (gamesCompletedToday < maxGames) {
                  return (
                    <button
                      className="fw-btn fw-btn-primary"
                      onClick={handleNextGame}
                    >
                      Next Game ({gamesCompletedToday + 1}/{maxGames})
                    </button>
                  );
                }
                return null;
              })()}
              <button
                className="fw-btn fw-btn-share"
                onClick={() => {
                  setShowShareModal(true);
                  setShowWinScreen(false);
                }}
              >
                Share
              </button>
              {onShowStats && (
                <button
                  className="fw-btn fw-btn-stats"
                  onClick={() => {
                    setShowWinScreen(false);
                    onShowStats();
                  }}
                >
                  View Stats
                </button>
              )}
              {onShowReview && (
                <button
                  className="fw-btn fw-btn-review"
                  onClick={() => {
                    setShowWinScreen(false);
                    onShowReview(null);
                  }}
                >
                  Review Games
                </button>
              )}
              <button
                className="fw-btn fw-btn-close"
                onClick={() => setShowWinScreen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Screen Modal */}
      {showLostScreen && (
        <div className="fw-lost-screen">
          <div className="fw-lost-content">
            <h2>Game Over!</h2>
            <p className="fw-lost-word">The word was: <strong>{game.target}</strong></p>
            <div className="fw-lost-actions">
              {(() => {
                const maxGames = isPro ? MAX_GAMES_PRO : MAX_GAMES_FREE;
                if (gamesCompletedToday < maxGames) {
                  return (
                    <button
                      className="fw-btn fw-btn-primary"
                      onClick={handleNextGame}
                    >
                      Next Game ({gamesCompletedToday + 1}/{maxGames})
                    </button>
                  );
                }
                return null;
              })()}
              <button
                className="fw-btn fw-btn-explore"
                onClick={handleExploreShows}
              >
                Explore shows titled &quot;{game.target}&quot;
              </button>
              <button
                className="fw-btn fw-btn-share"
                onClick={() => {
                  setShowShareModal(true);
                  setShowLostScreen(false);
                }}
              >
                Share
              </button>
              {onShowReview && (
                <button
                  className="fw-btn fw-btn-review"
                  onClick={() => {
                    setShowLostScreen(false);
                    onShowReview(null);
                  }}
                >
                  Review Games
                </button>
              )}
              <button
                className="fw-btn fw-btn-close"
                onClick={() => setShowLostScreen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fw-share-modal" onClick={(e) => {
          // Close when clicking backdrop
          if (e.target === e.currentTarget) {
            setShowShareModal(false);
          }
        }}>
          <div className="fw-share-content">
            <div className="fw-share-header">
              <h2>Share Your Results</h2>
              <button
                className="fw-share-close"
                onClick={() => setShowShareModal(false)}
                aria-label="Close share modal"
              >
                ×
              </button>
            </div>
            <div className="fw-share-grid">
              {game.guesses.map((guess, i) => {
                const result = game.lastResults[i] || [];
                return (
                  <div key={i} className="fw-share-row">
                    {result.map((status, j) => (
                      <div
                        key={j}
                        className={`fw-share-tile ${status}`}
                        aria-label={`${guess[j]}, ${status}`}
                      >
                        {status === 'correct' && '🟩'}
                        {status === 'present' && '🟨'}
                        {status === 'absent' && '⬜'}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="fw-share-actions">
              <button
                className="fw-btn fw-btn-primary"
                onClick={() => handleShare(false)}
              >
                Share This Game
              </button>
              {isPro && (
                <button
                  className="fw-btn fw-btn-secondary"
                  onClick={() => handleShare(true)}
                >
                  Share All 3 Games
                </button>
              )}
              <button
                className="fw-btn fw-btn-secondary"
                onClick={() => setShowShareModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
