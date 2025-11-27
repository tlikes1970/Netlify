import { useState, useEffect, useCallback, useRef } from "react";
import { useProStatus } from "../../lib/proStatus";
import { getCachedTrivia } from "../../lib/triviaApi";
import { getDailySeedDate } from "../../lib/dailySeed";
import { SAMPLE_TRIVIA_QUESTIONS, type TriviaQuestion } from "../../lib/triviaQuestions";
import { getTriviaGamesCompletedKey, getTriviaStatsKey } from '../../lib/cacheKeys';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { saveCompletedTriviaGame, getCompletedTriviaGames } from '../../lib/gameReview';
import { trackTriviaGameStart, trackTriviaGameComplete, trackTriviaAnswer, trackGameError } from '../../lib/analytics';
import { authManager } from '../../lib/auth';
import { syncGameStats } from '../../lib/gameStatsSync';
import { shareWithFallback } from '../../lib/shareLinks';
import { getToastCallback } from '@/state/actions';
import { ERROR_MESSAGES, logErrorDetails } from '../../lib/errorMessages';
import { 
  getUsedQuestionHashes, 
  recordUsedQuestions, 
  filterDuplicates, 
  hashQuestion,
  selectUniqueQuestions 
} from '../../lib/triviaDedup';

interface TriviaGameProps {
  onClose?: () => void;
  onGameComplete?: (score: number, total: number) => void;
  onShowReview?: () => void;
}

export default function TriviaGame({
  onClose,
  onGameComplete,
  onShowReview,
}: TriviaGameProps) {
  const { isPro } = useProStatus();
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<Array<{ questionIndex: number; selectedAnswer: number; isCorrect: boolean }>>([]);
  const [gameState, setGameState] = useState<
    "loading" | "playing" | "completed" | "error"
  >("loading");
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentGame, setCurrentGame] = useState(1);
  const [gamesCompletedToday, setGamesCompletedToday] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(
    null
  );
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const explanationRef = useRef<HTMLDivElement | null>(null);

  // Note: Hardcoded questions moved to module level (triviaQuestions.ts) to prevent recreation
  // Using imported constant instead
  const sampleQuestions = SAMPLE_TRIVIA_QUESTIONS;

  /**
   * Process: Trivia Question Selection (Unified Dedup)
   * Purpose: Select unique questions using centralized dedup system, ensuring NO duplicates
   *          within the same day or across the 7-day no-repeat window.
   * Data Source: triviaDedup.ts tracks question hashes by date/game in localStorage
   * Update Path: Questions recorded via recordUsedQuestions() after game completion
   * Dependencies: triviaDedup.ts, triviaQuestions.ts
   */
  const getUniqueQuestionsForGame = (
    gameNumber: number,
    questionsNeeded: number = 10
  ): TriviaQuestion[] => {
    // Get hashes of all questions to avoid (previous days + earlier games today)
    const usedHashes = getUsedQuestionHashes(gameNumber);
    
    // Calculate deterministic start index based on date and game number
    const today = getDailySeedDate();
    const epochDate = new Date('2000-01-01');
    const currentDate = new Date(today + 'T00:00:00Z');
    const daysSinceEpoch = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = daysSinceEpoch % 365;
    const startIndex = (cycleDay * 30 + (gameNumber - 1) * 10) % sampleQuestions.length;
    
    // Select unique questions avoiding used hashes
    const selected = selectUniqueQuestions(
      sampleQuestions,
      questionsNeeded,
      usedHashes,
      startIndex
    );
    
    console.log(
      `🎯 Game ${gameNumber}: Selected ${selected.length} unique questions (avoiding ${usedHashes.size} used hashes)`,
      selected.map(q => q.id)
    );
    
    return selected;
  };

  // Get games completed today from localStorage (uses UTC date for consistency)
  const getGamesCompletedToday = (): number => {
    try {
      const today = getDailySeedDate(); // UTC-based date
      const key = getTriviaGamesCompletedKey(today);
      const completed = localStorage.getItem(key);
      const count = completed ? parseInt(completed, 10) : 0;
      // Cap to max games to prevent invalid counts
      const maxGames = isPro ? 3 : 1;
      return Math.min(count, maxGames);
    } catch (_e) {
      return 0;
    }
  };

  // Save games completed today to localStorage (uses UTC date for consistency)
  const saveGamesCompletedToday = (count: number): void => {
    try {
      const today = getDailySeedDate(); // UTC-based date
      const key = getTriviaGamesCompletedKey(today);
      localStorage.setItem(key, String(count));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error("❌ localStorage quota exceeded. Cannot save games completed count.");
        setErrorMessage("Storage full. Game progress may not be saved.");
      } else {
        console.warn("Failed to save games completed:", error);
      }
    }
  };

  // Update trivia stats after game completes
  const updateTriviaStats = (
    gameScore: number,
    totalQuestions: number
  ): void => {
    try {
      const existingData = JSON.parse(
        localStorage.getItem("flicklet-data") || "{}"
      );
      const currentStats = existingData.trivia || {
        games: 0,
        wins: 0,
        losses: 0,
        correct: 0,
        total: 0,
        streak: 0,
        maxStreak: 0,
      };

      const percentage =
        totalQuestions > 0 ? Math.round((gameScore / totalQuestions) * 100) : 0;
      const isWin = percentage >= 60; // 60% or higher is a win

      const newStats = {
        games: currentStats.games + 1,
        wins: currentStats.wins + (isWin ? 1 : 0),
        losses: currentStats.losses + (isWin ? 0 : 1),
        correct: currentStats.correct + gameScore,
        total: currentStats.total + totalQuestions,
        streak: isWin ? currentStats.streak + 1 : 0,
        maxStreak: isWin
          ? Math.max(currentStats.maxStreak, currentStats.streak + 1)
          : currentStats.maxStreak,
      };

      const updatedData = {
        ...existingData,
        trivia: newStats,
      };

      localStorage.setItem("flicklet-data", JSON.stringify(updatedData));
      localStorage.setItem(getTriviaStatsKey(), JSON.stringify(newStats));

      // Sync to Firebase if user is authenticated
      const currentUser = authManager.getCurrentUser();
      if (currentUser?.uid) {
        syncGameStats(currentUser.uid).catch((_syncError) => {
          console.warn("Failed to sync game stats to cloud:", _syncError);
        });
      }

      // Notify listeners
      window.dispatchEvent(new CustomEvent("trivia:statsUpdated"));

      console.log("💾 Trivia stats saved:", newStats);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error("❌ localStorage quota exceeded. Cannot save trivia stats.");
        setErrorMessage("Storage full. Stats may not be saved.");
      } else {
        console.error("Failed to save trivia stats:", error);
      }
    }
  };

  // Check for share link params on mount
  useEffect(() => {
    try {
      const shareParamsStr = localStorage.getItem("trivia:shareParams");
      if (shareParamsStr) {
        const shareParams = JSON.parse(shareParamsStr);
        console.log("[Trivia] Share link params detected:", shareParams);
        
        // If mode is 'sharedResult', show review screen for that date/game
        if (shareParams.mode === "sharedResult" && shareParams.date) {
          // Navigate to review screen showing that specific game
          // The review screen will filter by date/gameNumber
          if (onShowReview) {
            onShowReview();
          }
        }
        
        // Clear share params after processing
        localStorage.removeItem("trivia:shareParams");
      }
    } catch (e) {
      console.warn("Failed to process Trivia share params:", e);
    }
  }, [onShowReview]);

  // Initialize games completed - Regular: 1 game (10 questions), Pro: 3 games (30 questions)
  // Combined with question loading to avoid race condition
  useEffect(() => {
    const initializeAndLoad = async () => {
      const completed = getGamesCompletedToday();
      setGamesCompletedToday(completed);
      
      // Set current game to next game to play
      // Regular: 1 game per day (10 questions)
      // Pro: 3 games per day (30 questions)
      // Don't start a new game if limit is reached
      const maxGames = isPro ? 3 : 1;
      let gameNumber: number;
      if (completed >= maxGames) {
        // All games completed - load last completed game's data for display
        gameNumber = maxGames;
        setCurrentGame(gameNumber);
        
        // Load last completed game to show its results
        const completedGames = getCompletedTriviaGames();
        const lastGame = completedGames.find(g => g.gameNumber === maxGames) || completedGames[completedGames.length - 1];
        
        if (lastGame) {
          // Set up state to show completion screen with last game's data
          setScore(lastGame.score);
          // Convert completed game questions back to TriviaQuestion format for display
          // Note: CompletedTriviaGame only stores basic question data, so we provide defaults
          const displayQuestions: TriviaQuestion[] = lastGame.questions.map((q, idx) => ({
            id: `completed_${lastGame.gameNumber}_${idx}`,
            question: q.question,
            options: [], // Not needed for completion screen
            correctAnswer: q.correctAnswer,
            explanation: undefined,
            category: 'General',
            difficulty: 'medium',
          }));
          setQuestions(displayQuestions);
          setGameState("completed");
          console.log(
            "🎯 All games completed:",
            "Games completed today:",
            completed,
            "Max games:",
            maxGames,
            "Showing completion screen with last game data"
          );
        } else {
          // No completed game data found, just show completion message
          setGameState("completed");
          console.log(
            "🎯 All games completed:",
            "Games completed today:",
            completed,
            "Max games:",
            maxGames,
            "No completed game data found"
          );
        }
        return; // Exit early, don't load new questions
      } else if (isPro) {
        gameNumber = Math.min(completed + 1, 3); // Max 3 games for Pro
        setCurrentGame(gameNumber);
        console.log(
          "🎯 Pro user status:",
          "Games completed today:",
          completed,
          "Starting game:",
          gameNumber,
          "(Pro: 3 games per day - 30 questions total)"
        );
      } else {
        gameNumber = 1; // Regular users get 1 game per day
        setCurrentGame(gameNumber);
        console.log(
          "🎯 Regular user status:",
          "Games completed today:",
          completed,
          "Starting game:",
          gameNumber,
          "(Regular: 1 game per day - 10 questions)"
        );
      }

      // Load questions immediately after setting game number
      if (gameState === "loading") {
        try {
          console.log(
            `🧠 Loading trivia questions for Game ${gameNumber} (${isPro ? "Pro: 30 questions/day" : "Regular: 10 questions/day"})...`
          );

          const questionsNeeded = 10; // 10 questions per game
          
          // Get hashes of questions to avoid (previous days + earlier games today)
          const usedHashes = getUsedQuestionHashes(gameNumber);
          console.log(`🔒 Avoiding ${usedHashes.size} previously used question hashes`);
          
          // Try to get questions from API first
          let formattedQuestions: TriviaQuestion[] = [];
          
          try {
            const apiQuestions = await getCachedTrivia(gameNumber, isPro);
            
            if (apiQuestions && apiQuestions.length > 0) {
              // Convert API format and filter out duplicates using centralized dedup
              const apiFormatted = apiQuestions.map((q, index) => ({
                id: `api_${gameNumber}_${index}`,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || undefined,
                category: q.category,
                difficulty: q.difficulty,
              }));
              
              // Filter using centralized dedup (removes questions seen in previous games)
              formattedQuestions = filterDuplicates(apiFormatted, usedHashes);
              console.log(`📡 API provided ${apiQuestions.length} questions, ${formattedQuestions.length} are unique`);
            }
          } catch (apiError) {
            console.warn('⚠️ API failed, using fallback questions:', apiError);
          }
          
          // If we need more questions, supplement from hardcoded pool
          if (formattedQuestions.length < questionsNeeded) {
            const needed = questionsNeeded - formattedQuestions.length;
            console.log(`📚 Need ${needed} more questions from hardcoded pool`);
            
            // Build hashes of what we already have (API questions)
            const currentHashes = new Set(usedHashes);
            formattedQuestions.forEach(q => currentHashes.add(hashQuestion(q.question)));
            
            // Get unique questions from hardcoded pool
            const hardcodedQuestions = getUniqueQuestionsForGame(gameNumber, needed + 10);
            const filteredHardcoded = filterDuplicates(hardcodedQuestions, currentHashes);
            
            // Add what we need
            const toAdd = filteredHardcoded.slice(0, needed).map(q => ({
              ...q,
              explanation: q.explanation || undefined,
            }));
            formattedQuestions.push(...toAdd);
            console.log(`✅ Added ${toAdd.length} unique hardcoded questions`);
          }
          
          // Final safety check - ensure exactly questionsNeeded unique questions
          const finalQuestions: TriviaQuestion[] = [];
          const finalHashes = new Set<string>();
          
          for (const q of formattedQuestions) {
            const hash = hashQuestion(q.question);
            if (!finalHashes.has(hash) && finalQuestions.length < questionsNeeded) {
              finalHashes.add(hash);
              finalQuestions.push(q);
            }
          }
          
          // Last resort: if still not enough, force-fill from hardcoded (ignoring dedup)
          if (finalQuestions.length < questionsNeeded) {
            console.warn(`⚠️ Only have ${finalQuestions.length}/${questionsNeeded} questions. Force-filling remaining.`);
            for (const q of sampleQuestions) {
              const hash = hashQuestion(q.question);
              if (!finalHashes.has(hash) && finalQuestions.length < questionsNeeded) {
                finalHashes.add(hash);
                finalQuestions.push({ ...q, explanation: q.explanation || undefined });
              }
            }
          }

          console.log(
            `✅ Loaded ${finalQuestions.length} trivia questions for Game ${gameNumber} (${isPro ? "Pro" : "Regular"})`
          );
          setQuestions(finalQuestions);
          setGameState("playing");
          setErrorMessage(null);
          
          // Track game start analytics
          trackTriviaGameStart(gameNumber, isPro);
          // Initialize option refs array
          optionRefs.current = new Array(
            finalQuestions[0]?.options.length || 4
          ).fill(null);
        } catch (error) {
          logErrorDetails('TriviaGame', error, { context: 'loadQuestions' });
          trackGameError('trivia', 'load_questions_failed', { error: String(error) });
          setErrorMessage(ERROR_MESSAGES.game.loadFailed);
          
          // Fallback: get unique questions using dedup system
          const fallbackQuestions = getUniqueQuestionsForGame(gameNumber, 10);
          setQuestions(fallbackQuestions);
          setGameState("playing");
          optionRefs.current = new Array(
            fallbackQuestions[0]?.options.length || 4
          ).fill(null);
        }
      }
    };

    initializeAndLoad();
  }, [isPro, gameState]); // Include isPro to react to Pro status changes

  const handleAnswerSelect = useCallback(
    (answerIndex: number) => {
      if (selectedAnswer !== null) return;

      const isCorrect = answerIndex === questions[currentQuestionIndex].correctAnswer;
      
      // Track answer analytics
      trackTriviaAnswer(currentQuestionIndex, isCorrect);
      
      // Save answer for review
      setQuestionAnswers((prev) => [
        ...prev,
        {
          questionIndex: currentQuestionIndex,
          selectedAnswer: answerIndex,
          isCorrect,
        },
      ]);

      setSelectedAnswer(answerIndex);
      setShowExplanation(true);
      setFocusedOptionIndex(null);

      if (isCorrect) {
        setScore((prev) => prev + 1);
      }

      // Focus next button after a short delay for screen readers
      setTimeout(() => {
        nextButtonRef.current?.focus();
        explanationRef.current?.focus();
      }, 100);
    },
    [selectedAnswer, questions, currentQuestionIndex]
  );

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setFocusedOptionIndex(null);
      // Focus first option on next question
      setTimeout(() => {
        optionRefs.current[0]?.focus();
      }, 100);
    } else {
      // Game completed - set state first, then update stats
      setGameState("completed");
      
      const today = getDailySeedDate();
      
      // Calculate final score by counting correct answers from questionAnswers
      // This ensures we use the actual recorded answers, not potentially stale state
      const finalScore = questionAnswers.filter(a => a.isCorrect).length + 
        (questions[currentQuestionIndex].correctAnswer === (questionAnswers.find(a => a.questionIndex === currentQuestionIndex)?.selectedAnswer ?? -1) ? 0 : 
         (selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 1 : 0));
      
      const percentage = Math.round((finalScore / questions.length) * 100);
      
      // Record used questions in dedup system (CRITICAL for preventing duplicates)
      recordUsedQuestions(currentGame, questions);
      console.log(`📝 Recorded ${questions.length} questions for dedup tracking (Game ${currentGame})`);
      
      // Save completed game for review
      const completedQuestionAnswers = questions.map((q, idx) => {
        const answerData = questionAnswers.find(a => a.questionIndex === idx);
        return {
          question: q.question,
          selectedAnswer: answerData?.selectedAnswer ?? -1,
          correctAnswer: q.correctAnswer,
          isCorrect: answerData?.isCorrect ?? false,
        };
      });
      
      saveCompletedTriviaGame({
        date: today,
        gameNumber: currentGame,
        score: finalScore,
        total: questions.length,
        percentage,
        questions: completedQuestionAnswers,
        completedAt: Date.now(),
      });
      
      // Track analytics
      trackTriviaGameComplete(finalScore, questions.length, percentage, currentGame, isPro);
      
      // Update stats after state is set to completed
      updateTriviaStats(finalScore, questions.length);

      // Increment games completed today (cap to max games)
      const maxGames = isPro ? 3 : 1;
      const newGamesCompleted = Math.min(gamesCompletedToday + 1, maxGames);
      setGamesCompletedToday(newGamesCompleted);
      saveGamesCompletedToday(newGamesCompleted);

      onGameComplete?.(finalScore, questions.length);
    }
  }, [
    currentQuestionIndex,
    questions,
    questionAnswers, // FIXED: Added missing dependency
    selectedAnswer,
    currentGame,
    isPro,
    gamesCompletedToday,
    onGameComplete,
  ]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, optionIndex: number) => {
      if (selectedAnswer !== null) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNextQuestion();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const nextIndex =
            optionIndex < questions[currentQuestionIndex].options.length - 1
              ? optionIndex + 1
              : 0;
          setFocusedOptionIndex(nextIndex);
          optionRefs.current[nextIndex]?.focus();
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prevIndex =
            optionIndex > 0
              ? optionIndex - 1
              : questions[currentQuestionIndex].options.length - 1;
          setFocusedOptionIndex(prevIndex);
          optionRefs.current[prevIndex]?.focus();
          break;
        }
        case "Enter":
        case " ":
          e.preventDefault();
          handleAnswerSelect(optionIndex);
          break;
      }
    },
    [
      selectedAnswer,
      questions,
      currentQuestionIndex,
      handleAnswerSelect,
      handleNextQuestion,
    ]
  );

  const handleRestart = useCallback(() => {
    // Reset current game
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowExplanation(false);
    setQuestionAnswers([]);
    setGameState("loading");
  }, []);

  // Start next game (for pro users with games remaining)
  const handleNextGame = useCallback(() => {
    // Pro users get 3 games per day, Regular users get 1 game per day
    const maxGames = isPro ? 3 : 1;
    if (gamesCompletedToday < maxGames) {
      const nextGame = gamesCompletedToday + 1;
      setCurrentGame(nextGame);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setShowExplanation(false);
      setQuestionAnswers([]);
      setGameState("loading");
    }
  }, [isPro, gamesCompletedToday]);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  // Generate share text for Trivia results
  // Share link deep-linking: Includes date, gameNumber, and score so link opens to correct game
  // Config: App.tsx handles ?game=trivia&date=...&gameNumber=...&score=... query params
  // Note: URL is NOT included here - it will be added by shareWithFallback
  const generateShareText = useCallback(() => {
    const today = getDailySeedDate();
    const gameLabel = isPro ? ` Game ${currentGame}` : '';
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    
    return `🧠 Trivia ${today}${gameLabel}\n\nScore: ${score}/${questions.length} (${percentage}%)\n\nPlay Trivia at flicklet.netlify.app`;
  }, [score, questions.length, isPro, currentGame]);

  // Primary share handler for Trivia
  // Handle share - single game results
  const handleShare = useCallback(async () => {
    const shareText = generateShareText();
    const today = getDailySeedDate();
    // Always use flicklet.netlify.app for consistency
    const origin = "https://flicklet.netlify.app";
    const shareUrl = `${origin}/?game=trivia&date=${today}&gameNumber=${currentGame}&score=${score}&mode=sharedResult`;
    
    // Detect if native share is available (for toast message)
    const canNativeShare =
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Use unified share helper
    await shareWithFallback({
      title: 'Trivia Results',
      text: shareText,
      url: shareUrl,
      onSuccess: () => {
        const toast = getToastCallback();
        if (toast) {
          // Different message for native share vs clipboard
          if (canNativeShare) {
            toast('Share completed!', 'success');
          } else {
            toast('Share link copied to clipboard!', 'success');
          }
        }
      },
      onError: (error) => {
        console.error('Share failed:', error);
        const toast = getToastCallback();
        if (toast) {
          toast('Unable to share – link copied instead', 'error');
        }
      },
    });
  }, [generateShareText, currentGame, score]);

  if (gameState === "loading") {
    return (
      <div
        className="trivia-game"
        role="status"
        aria-live="polite"
        aria-label="Loading trivia game"
      >
        <div className="trivia-loading">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Loading trivia questions...</p>
        </div>
      </div>
    );
  }

  if (gameState === "error") {
    return (
      <div className="trivia-game" role="alert">
        <div className="trivia-error">
          <h3>Error Loading Game</h3>
          <p>{errorMessage || ERROR_MESSAGES.generic}</p>
          <button className="btn-primary" onClick={handleRestart}>
            Try Again
          </button>
          {onClose && (
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === "completed") {
    // Handle case where questions might be empty (all games completed on load)
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const canPlayNextGame = isPro && gamesCompletedToday < 3; // Only Pro users can play multiple games
    const gamesRemaining = isPro ? 3 - gamesCompletedToday : 0;

    return (
      <div className="trivia-game" role="region" aria-label="Game completed">
        <div className="trivia-completed">
            <h3>Game {currentGame} Complete</h3>
          {isPro && (
            <p className="game-progress">Game {currentGame} of 3</p>
          )}
          <div className="score-display">
            <div
              className="score-circle"
              role="img"
              aria-label={`Score: ${score} out of ${questions.length || 10} correct, ${percentage} percent`}
            >
              <span
                className={`score-percentage ${getScoreColor(percentage)}`}
                aria-hidden="true"
              >
                {percentage}%
              </span>
              <span className="score-fraction" aria-hidden="true">
                {score}/{questions.length || 10}
              </span>
            </div>
          </div>

          <div className="score-message">
            {percentage >= 80 && (
              <p>Excellent! You really know your movies.</p>
            )}
            {percentage >= 60 && percentage < 80 && (
              <p>Good job! You know your stuff.</p>
            )}
            {percentage < 60 && (
              <p>Keep watching, you'll get better.</p>
            )}
          </div>

          <div className="completion-actions">
            {canPlayNextGame ? (
              <button
                className="btn-primary"
                onClick={handleNextGame}
                aria-label={`Play Game ${gamesCompletedToday + 1}, ${gamesRemaining} games remaining`}
              >
                <span className="btn-text-responsive">
                  Play Game {gamesCompletedToday + 1}
                </span>
                <span className="btn-text-responsive-mobile">
                  Game {gamesCompletedToday + 1}
                </span>
                <span className="btn-text-small">({gamesRemaining} left)</span>
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={handleRestart}
                aria-label="Play again"
              >
                Play Again
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={handleShare}
              aria-label="Share trivia results"
            >
              Share Results
            </button>
            {onShowReview && (
              <button
                className="btn-secondary"
                onClick={() => {
                  onShowReview();
                }}
                aria-label="Review completed games"
              >
                Review Games
              </button>
            )}
            {onClose && (
              <button
                className="btn-secondary"
                onClick={onClose}
                aria-label="Close trivia game"
              >
                Close
              </button>
            )}
          </div>

          {!isPro && (
            <div className="pro-upsell">
              <p>
                Nice work! That's your daily game. Come back tomorrow.
              </p>
              <p>
                Pro members get 3 games per day (10 questions each).
              </p>
            </div>
          )}
          {isPro && gamesCompletedToday >= 3 && (
            <div className="games-limit">
              <p>
                Nice work! You've completed all 3 games today. Come back tomorrow.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Safety check - don't render if no questions or current question is undefined
  if (!questions.length || !currentQuestion) {
    return (
      <div className="trivia-game">
        <div className="trivia-header">
          <h3>🧠 Daily Trivia</h3>
        </div>
        <div className="trivia-content">
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trivia-game" role="main" aria-label="Trivia game">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="trivia-error-banner" role="alert" aria-live="polite">
          <span className="error-icon" aria-hidden="true">📡</span>
          <span>You&apos;re offline. Using cached questions if available.</span>
        </div>
      )}
      {/* Error message banner */}
      {errorMessage && (
        <div className="trivia-error-banner" role="alert" aria-live="polite">
          <span className="error-icon" aria-hidden="true">
            ⚠️
          </span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Game progress indicator (Pro users only) */}
      {isPro && (
        <div
          className="trivia-game-header"
          aria-label={`Game ${currentGame} of 3`}
        >
          <span>Game {currentGame} of 3</span>
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

      {/* Progress indicator */}
      <div
        className="trivia-progress"
        role="progressbar"
        aria-valuenow={currentQuestionIndex + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-label={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
      >
        <span aria-hidden="true">
          {currentQuestionIndex + 1}/{questions.length}
        </span>
        <div className="progress-bar" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="trivia-question">
        <div className="question-meta" aria-hidden="true">
          <span className="category">{currentQuestion.category}</span>
          <span
            className="difficulty"
            aria-label={`Difficulty: ${currentQuestion.difficulty}`}
          >
            {currentQuestion.difficulty}
          </span>
        </div>
        <h4 id="trivia-question-text">{currentQuestion.question}</h4>
      </div>

      {/* Options */}
      <div
        className="trivia-options"
        role="radiogroup"
        aria-labelledby="trivia-question-text"
        aria-required="true"
      >
        {currentQuestion.options.map((option, index) => {
          let className = "option-btn";
          const isCorrect = index === currentQuestion.correctAnswer;
          const isSelected = index === selectedAnswer;
          const isDisabled = selectedAnswer !== null;

          if (selectedAnswer !== null) {
            if (isCorrect) {
              className += " correct";
            } else if (isSelected && !isCorrect) {
              className += " incorrect";
            } else {
              className += " disabled";
            }
          }

          let ariaLabel = option;
          if (selectedAnswer !== null) {
            if (isCorrect) {
              ariaLabel = `${option} - Correct answer`;
            } else if (isSelected) {
              ariaLabel = `${option} - Incorrect answer`;
            } else {
              ariaLabel = `${option} - Not selected`;
            }
          }

          return (
            <button
              key={index}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              className={className}
              onClick={() => handleAnswerSelect(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={isDisabled}
              role="radio"
              aria-checked={isSelected}
              aria-label={ariaLabel}
              aria-describedby={
                isDisabled && !isSelected ? "disabled-explanation" : undefined
              }
              tabIndex={
                focusedOptionIndex === index ||
                (focusedOptionIndex === null && index === 0)
                  ? 0
                  : -1
              }
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Disabled explanation tooltip */}
      {selectedAnswer !== null && (
        <div id="disabled-explanation" className="sr-only">
          Other options are disabled because you have already selected an answer
        </div>
      )}

      {/* Explanation */}
      {showExplanation && currentQuestion.explanation && (
        <div
          ref={explanationRef}
          className="trivia-explanation"
          role="region"
          aria-live="polite"
          aria-label="Explanation"
          tabIndex={-1}
        >
          <p>{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="trivia-actions">
        {selectedAnswer !== null && (
          <button
            ref={nextButtonRef}
            className="btn-primary"
            onClick={handleNextQuestion}
            aria-label={
              currentQuestionIndex < questions.length - 1
                ? "Go to next question"
                : "Finish quiz"
            }
          >
            <span className="btn-text-responsive">
              {currentQuestionIndex < questions.length - 1
                ? "Next Question"
                : "Finish Quiz"}
            </span>
            <span className="btn-text-responsive-mobile">
              {currentQuestionIndex < questions.length - 1 ? "Next" : "Finish"}
            </span>
          </button>
        )}

        {onClose && (
          <button
            className="btn-secondary"
            onClick={onClose}
            aria-label="Close trivia game"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
