import { useState, useEffect, useCallback, useRef } from "react";
import { useSettings } from "@/lib/settings";
import { getCachedTrivia } from "../../lib/triviaApi";
import { getDailySeedDate } from "../../lib/dailySeed";
import { SAMPLE_TRIVIA_QUESTIONS, type TriviaQuestion } from "../../lib/triviaQuestions";
import { getTriviaGamesCompletedKey, getTriviaStatsKey } from '../../lib/cacheKeys';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { saveCompletedTriviaGame, getCompletedTriviaGames } from '../../lib/gameReview';
import { trackTriviaGameStart, trackTriviaGameComplete, trackTriviaAnswer, trackGameError } from '../../lib/analytics';
import { authManager } from '../../lib/auth';
import { syncGameStats } from '../../lib/gameStatsSync';

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
  const settings = useSettings();
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<Array<{ questionIndex: number; selectedAnswer: number; isCorrect: boolean }>>([]);
  const [gameState, setGameState] = useState<
    "loading" | "playing" | "completed" | "error"
  >("loading");
  const [showExplanation, setShowExplanation] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
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

  // Get today's questions based on UTC date (deterministic rotation)
  // Regular: 10 questions per day (game 1 only)
  // Pro: 30 questions per day (games 1-3, 10 questions each)
  // ALL users get the same questions in the same order (Regular gets first 10, Pro gets all 30)
  // Questions rotate on a 180-day (6 month) cycle to prevent repeats
  // Uses UTC date so all users globally share the same daily content
  const getTodaysQuestions = (
    isPro: boolean = false,
    gameNumber: number = 1
  ) => {
    const today = getDailySeedDate(); // UTC-based date for consistent daily content
    
    // Calculate days since epoch (Jan 1, 2000) for 180-day cycle
    const epochDate = new Date('2000-01-01');
    const currentDate = new Date(today + 'T00:00:00Z');
    const daysSinceEpoch = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = daysSinceEpoch % 180; // 180-day (6 month) cycle

    // Regular: 10 questions per day (1 game)
    // Pro: 30 questions per day (3 games of 10 questions each)
    const questionsPerGame = 10;
    const totalQuestionsPerDay = 30; // Pro users get 30, Regular gets first 10

    const todaysQuestions: TriviaQuestion[] = [];
    const usedQuestionIds = new Set<string>(); // Track used questions to prevent duplicates within this game
    // Calculate starting index for this game
    // Regular: gameNumber = 1, startIndex = 0 (questions 0-9)
    // Pro: gameNumber 1-3, startIndex = (gameNumber - 1) * 10 (questions 0-9, 10-19, 20-29)
    const startIndex = isPro ? (gameNumber - 1) * 10 : 0;

    for (let i = 0; i < questionsPerGame; i++) {
      const globalIndex = startIndex + i;
      // Calculate base index deterministically: cycleDay * 30 (questions per day) + globalIndex
      // This ensures all users get the same 30 questions per day, and no repeats for 180 days
      const baseIndex = (cycleDay * totalQuestionsPerDay + globalIndex) % sampleQuestions.length;
      
      // Find next available question that hasn't been used in this game
      let questionIndex = baseIndex;
      let attempts = 0;
      const maxAttempts = sampleQuestions.length; // Safety limit - should never need more than total questions
      
      while (usedQuestionIds.has(sampleQuestions[questionIndex].id) && attempts < maxAttempts) {
        // Try next question in sequence, wrapping around
        questionIndex = (questionIndex + 1) % sampleQuestions.length;
        attempts++;
      }
      
      // If we've exhausted all questions (shouldn't happen with 50 questions and 10 per game)
      if (attempts >= maxAttempts) {
        console.warn(`⚠️ Could not find unique question after ${attempts} attempts. Using question at index ${questionIndex}`);
        // Reset and try again from start - this should never happen but provides safety
        usedQuestionIds.clear();
        questionIndex = baseIndex;
      }
      
      const selectedQuestion = sampleQuestions[questionIndex];
      todaysQuestions.push(selectedQuestion);
      usedQuestionIds.add(selectedQuestion.id);
    }

    const totalForUser = isPro ? 30 : 10;
    console.log(
      `🎯 Game ${gameNumber} questions (${isPro ? "Pro" : "Regular"} user, cycle day ${cycleDay}, questions ${startIndex + 1}-${startIndex + questionsPerGame} of ${totalForUser}):`,
      todaysQuestions.map((q) => q.id)
    );
    return todaysQuestions;
  };

  // Get games completed today from localStorage (uses UTC date for consistency)
  const getGamesCompletedToday = (): number => {
    try {
      const today = getDailySeedDate(); // UTC-based date
      const key = getTriviaGamesCompletedKey(today);
      const completed = localStorage.getItem(key);
      const count = completed ? parseInt(completed, 10) : 0;
      // Cap to max games to prevent invalid counts
      const maxGames = settings.pro.isPro ? 3 : 1;
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

  // Initialize games completed - Regular: 1 game (10 questions), Pro: 3 games (30 questions)
  // Combined with question loading to avoid race condition
  useEffect(() => {
    const initializeAndLoad = async () => {
      setIsProUser(settings.pro.isPro);
      const completed = getGamesCompletedToday();
      setGamesCompletedToday(completed);
      
      // Set current game to next game to play
      // Regular: 1 game per day (10 questions)
      // Pro: 3 games per day (30 questions)
      // Don't start a new game if limit is reached
      const maxGames = settings.pro.isPro ? 3 : 1;
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
      } else if (settings.pro.isPro) {
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
            `🧠 Loading trivia questions for Game ${gameNumber} (${settings.pro.isPro ? "Pro: 30 questions/day" : "Regular: 10 questions/day"})...`
          );

          // Use cached trivia - Regular gets 10 questions, Pro gets 30 questions
          // All users get the same questions (Regular gets first 10, Pro gets all 30)
          const apiQuestions = await getCachedTrivia(gameNumber, settings.pro.isPro);

          let formattedQuestions: TriviaQuestion[] = [];
          const questionsNeeded = 10; // 10 questions per game

          if (apiQuestions && apiQuestions.length > 0) {
            // Convert API format to our format
            // Regular users (gameNumber = 1): use questions 0-9
            // Pro users: gameNumber 1-3, use questions 0-9, 10-19, 20-29 respectively
            const startIndex = settings.pro.isPro ? (gameNumber - 1) * 10 : 0;
            const endIndex = startIndex + questionsNeeded;
            formattedQuestions = apiQuestions.slice(startIndex, endIndex).map((q, index) => ({
              id: `api_${gameNumber}_${index}`,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || undefined,
              category: q.category,
              difficulty: q.difficulty,
            }));

            // If we don't have enough from API, supplement with hardcoded questions
            if (formattedQuestions.length < questionsNeeded) {
              const additionalNeeded =
                questionsNeeded - formattedQuestions.length;
              
              // Track used question text to prevent duplicates
              const usedQuestionTexts = new Set(
                formattedQuestions.map(q => q.question.toLowerCase().trim())
              );
              
              // Get hardcoded questions for this game (same questions for all users)
              const allHardcodedQuestions = getTodaysQuestions(settings.pro.isPro, gameNumber);
              
              // Filter out questions that match API questions by text content
              const availableHardcoded = allHardcodedQuestions.filter(
                q => !usedQuestionTexts.has(q.question.toLowerCase().trim())
              );
              
              // Take only what we need
              const additionalQuestions = availableHardcoded
                .slice(0, additionalNeeded)
                .map((q) => ({
                  ...q,
                  explanation: q.explanation || undefined,
                }));
              
              formattedQuestions.push(...additionalQuestions);
              
              // If still not enough, fill with any remaining hardcoded questions (shouldn't happen)
              if (formattedQuestions.length < questionsNeeded) {
                const stillNeeded = questionsNeeded - formattedQuestions.length;
                const remaining = allHardcodedQuestions
                  .filter(q => !formattedQuestions.some(fq => fq.question.toLowerCase().trim() === q.question.toLowerCase().trim()))
                  .slice(0, stillNeeded);
                formattedQuestions.push(...remaining.map(q => ({
                  ...q,
                  explanation: q.explanation || undefined,
                })));
              }
            }
          } else {
            // No API questions available, use fallback (same questions for all users)
            console.log("📚 Using fallback trivia questions");
            formattedQuestions = getTodaysQuestions(settings.pro.isPro, gameNumber)
              .slice(0, questionsNeeded)
              .map((q) => ({
                ...q,
                explanation: q.explanation || undefined,
              }));
          }
          
          // Final duplicate check - ensure no duplicates in final list
          const finalQuestions: TriviaQuestion[] = [];
          const seenQuestions = new Set<string>();
          for (const q of formattedQuestions) {
            const questionKey = q.question.toLowerCase().trim();
            if (!seenQuestions.has(questionKey)) {
              seenQuestions.add(questionKey);
              finalQuestions.push(q);
            }
          }
          
          // If we lost questions due to duplicates, fill from hardcoded pool
          if (finalQuestions.length < questionsNeeded) {
            const allHardcoded = getTodaysQuestions(settings.pro.isPro, gameNumber);
            const needed = questionsNeeded - finalQuestions.length;
            const additional = allHardcoded
              .filter(q => !seenQuestions.has(q.question.toLowerCase().trim()))
              .slice(0, needed);
            finalQuestions.push(...additional.map(q => ({
              ...q,
              explanation: q.explanation || undefined,
            })));
          }
          
          formattedQuestions = finalQuestions.slice(0, questionsNeeded);

          console.log(
            `✅ Loaded ${formattedQuestions.length} trivia questions for Game ${gameNumber} (${settings.pro.isPro ? "Pro: 30 questions/day" : "Regular: 10 questions/day"})`
          );
          setQuestions(formattedQuestions);
          setGameState("playing");
          setErrorMessage(null);
          
          // Track game start analytics
          trackTriviaGameStart(gameNumber, settings.pro.isPro);
          // Initialize option refs array
          optionRefs.current = new Array(
            formattedQuestions[0]?.options.length || 4
          ).fill(null);
        } catch (error) {
          console.error("❌ Failed to load trivia questions:", error);
          trackGameError('trivia', 'load_questions_failed', { error: String(error) });
          setErrorMessage(
            "Failed to load questions from server. Using backup questions."
          );
          // Fallback to hardcoded questions (same questions for all users)
          const fallbackQuestions = getTodaysQuestions(settings.pro.isPro, gameNumber)
            .slice(0, 10); // Always 10 questions per game
          setQuestions(fallbackQuestions);
          setGameState("playing");
          optionRefs.current = new Array(
            fallbackQuestions[0]?.options.length || 4
          ).fill(null);
        }
      }
    };

    initializeAndLoad();
  }, [settings.pro, gameState]); // Include settings.pro to react to Pro status changes

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
      const percentage = Math.round((score / questions.length) * 100);
      
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
        score,
        total: questions.length,
        percentage,
        questions: completedQuestionAnswers,
        completedAt: Date.now(),
      });
      
      // Track analytics
      trackTriviaGameComplete(score, questions.length, percentage, currentGame, isProUser);
      
      // Update stats after state is set to completed
      updateTriviaStats(score, questions.length);

      // Increment games completed today (cap to max games)
      const maxGames = isProUser ? 3 : 1;
      const newGamesCompleted = Math.min(gamesCompletedToday + 1, maxGames);
      setGamesCompletedToday(newGamesCompleted);
      saveGamesCompletedToday(newGamesCompleted);

      onGameComplete?.(score, questions.length);
    }
  }, [
    currentQuestionIndex,
    questions.length,
    score,
    onGameComplete,
    gamesCompletedToday,
    questions,
    currentGame,
    isProUser,
    selectedAnswer,
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
    const maxGames = isProUser ? 3 : 1;
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
  }, [isProUser, gamesCompletedToday]);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

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
          <p>{errorMessage || "Something went wrong. Please try again."}</p>
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
    const canPlayNextGame = isProUser && gamesCompletedToday < 3; // Only Pro users can play multiple games
    const gamesRemaining = isProUser ? 3 - gamesCompletedToday : 0;

    return (
      <div className="trivia-game" role="region" aria-label="Game completed">
        <div className="trivia-completed">
          <h3>🎉 Game {currentGame} Complete!</h3>
          {isProUser && (
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
              <p>🏆 Excellent! You&apos;re a movie trivia master!</p>
            )}
            {percentage >= 60 && percentage < 80 && (
              <p>👍 Good job! You know your movies!</p>
            )}
            {percentage < 60 && (
              <p>📚 Keep watching! You&apos;ll get better!</p>
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

          {!isProUser && (
            <div className="pro-upsell">
              <p>
                ✅ You&apos;ve completed your game today! Come back tomorrow for the next game!
              </p>
              <p>
                🔒 Want more games? Upgrade to Pro for 3 games per day (10 questions each)!
              </p>
            </div>
          )}
          {isProUser && gamesCompletedToday >= 3 && (
            <div className="games-limit">
              <p>
                ✅ You&apos;ve completed all 3 games today! Come back tomorrow for the next games!
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
      {isProUser && (
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
