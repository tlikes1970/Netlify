import { useState, useEffect, useCallback } from 'react';
import { getTodaysWord } from '../../lib/dailyWordApi';
import { validateWord } from '../../lib/words/validateWord';
// import { useTranslations } from '@/lib/language'; // Unused

// Game configuration
const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

// Types
type TileStatus = 'correct' | 'present' | 'absent' | '';
type GameState = {
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
};

interface FlickWordGameProps {
  onClose?: () => void;
  onGameComplete?: (won: boolean, guesses: number) => void;
}

export default function FlickWordGame({ onClose, onGameComplete }: FlickWordGameProps) {
  // const translations = useTranslations(); // Unused
  const [game, setGame] = useState<GameState>({
    target: '',
    guesses: [],
    current: '',
    maxGuesses: 6,
    done: false,
    status: {},
    lastResults: [],
    showHint: false
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get today's word from API
  const loadTodaysWord = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading today\'s word...');
      
      const wordData = await getTodaysWord();
      console.log('📦 Word data received:', wordData);
      
      setGame(prev => ({
        ...prev,
        target: wordData.word.toUpperCase(),
        wordInfo: {
          definition: wordData.definition,
          difficulty: wordData.difficulty
        },
        showHint: false
      }));
      
      console.log('✅ Game target set to:', wordData.word.toUpperCase());
      
    } catch (error) {
      console.error('❌ Failed to load today\'s word:', error);
      // Fallback to a static word if API fails
      const fallbackWord = 'FLICK';
      console.log('🔄 Using fallback word:', fallbackWord);
      setGame(prev => ({
        ...prev,
        target: fallbackWord,
        wordInfo: {
          definition: 'A quick, sharp movement',
          difficulty: 'easy'
        },
        showHint: false
      }));
    } finally {
      setIsLoading(false);
      console.log('🏁 Word loading complete');
    }
  }, []);

  // Validate word using new offline-first system
  const isValidWord = useCallback(async (word: string): Promise<boolean> => {
    try {
      const verdict = await validateWord(word);
      // Sanitized log
      console.log(`🔍 Word validation: ${word.toUpperCase()} → ${verdict.valid ? 'valid' : 'invalid'} [${verdict.source}]`);
      return verdict.valid;
    } catch (error) {
      console.warn('Word validation failed:', error);
      return false;
    }
  }, []);

  // Score guess
  const scoreGuess = useCallback((guess: string, target: string): TileStatus[] => {
    const result: TileStatus[] = Array(5).fill('absent');
    const pool = target.split('');

    // First pass: exact matches
    for (let i = 0; i < 5; i++) {
      if (guess[i] === pool[i]) {
        result[i] = 'correct';
        pool[i] = '';
      }
    }

    // Second pass: present matches
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'correct') continue;
      const idx = pool.indexOf(guess[i]);
      if (idx !== -1) {
        result[i] = 'present';
        pool[idx] = '';
      }
    }

    return result;
  }, []);

  // Show notification
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    loadTodaysWord();
  }, [loadTodaysWord]);

  // Handle key input
  const handleKeyInput = useCallback((letter: string) => {
    if (game.done || game.current.length >= 5) return;
    
    setGame(prev => ({
      ...prev,
      current: prev.current + letter
    }));
  }, [game.done, game.current.length]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (game.done || !game.current) return;
    
    setGame(prev => ({
      ...prev,
      current: prev.current.slice(0, -1)
    }));
  }, [game.done, game.current]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    console.log('🎯 Submit pressed:', { 
      current: game.current, 
      length: game.current.length, 
      done: game.done,
      target: game.target 
    });
    
    if (game.done || game.current.length !== 5) {
      console.log('❌ Submit blocked:', { done: game.done, length: game.current.length });
      return;
    }

    console.log('🔍 Validating word:', game.current);
    const valid = await isValidWord(game.current);
    console.log('✅ Word validation result:', valid);
    
    if (!valid) {
      console.log('❌ Word invalid, showing notification');
      showNotification('Not in word list.', 'error');
      setGame(prev => ({ ...prev, current: '' }));
      return;
    }

    const result = scoreGuess(game.current, game.target);
    const newStatus = { ...game.status };

    // Update keyboard status
    for (let i = 0; i < 5; i++) {
      const letter = game.current[i];
      if (result[i] === 'correct') {
        newStatus[letter] = 'correct';
      } else if (result[i] === 'present' && newStatus[letter] !== 'correct') {
        newStatus[letter] = 'present';
      } else if (result[i] === 'absent' && !newStatus[letter]) {
        newStatus[letter] = 'absent';
      }
    }

    const newGuesses = [...game.guesses, game.current];
    const newLastResults = [...game.lastResults, result];

    if (game.current === game.target) {
      showNotification('🎉 Correct! Well done!', 'success');
      setGame(prev => ({ ...prev, done: true, guesses: newGuesses, lastResults: newLastResults, status: newStatus }));
      onGameComplete?.(true, newGuesses.length);
    } else if (newGuesses.length === game.maxGuesses) {
      showNotification(`Game over! The word was: ${game.target}`, 'error');
      setGame(prev => ({ ...prev, done: true, guesses: newGuesses, lastResults: newLastResults, status: newStatus }));
      onGameComplete?.(false, newGuesses.length);
    } else {
      setGame(prev => ({
        ...prev,
        guesses: newGuesses,
        lastResults: newLastResults,
        status: newStatus,
        current: ''
      }));
    }
  }, [game, isValidWord, scoreGuess, showNotification, onGameComplete]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.done || isLoading) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        e.preventDefault();
        handleKeyInput(e.key.toUpperCase());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [game.done, isLoading, handleBackspace, handleSubmit, handleKeyInput]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Render game grid
  const renderGrid = () => {
    const tiles = [];
    for (let i = 0; i < game.maxGuesses; i++) {
      const guess = game.guesses[i] || (i === game.guesses.length ? game.current : '');
      for (let j = 0; j < 5; j++) {
        const letter = guess[j] || '';
        const status = i < game.guesses.length ? game.lastResults[i][j] : '';
        
        tiles.push(
          <div
            key={`${i}-${j}`}
            className={`fw-tile ${status}`}
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
    
    // Row 1: QWERTYUIOP + Backspace
    const row1 = [];
    for (const letter of KEYBOARD_ROWS[0]) {
      const status = game.status[letter] || '';
      row1.push(
        <button
          key={letter}
          className={`fw-key ${status}`}
          onClick={() => handleKeyInput(letter)}
        >
          {letter}
        </button>
      );
    }
    row1.push(
      <button
        key="backspace"
        className="fw-key fw-key-back"
        onClick={handleBackspace}
      >
        ⌫
      </button>
    );
    rows.push(
      <div key="row1" className="fw-kb-row">
        {row1}
      </div>
    );
    
    // Row 2: ASDFGHJKL
    const row2 = [];
    for (const letter of KEYBOARD_ROWS[1]) {
      const status = game.status[letter] || '';
      row2.push(
        <button
          key={letter}
          className={`fw-key ${status}`}
          onClick={() => handleKeyInput(letter)}
        >
          {letter}
        </button>
      );
    }
    rows.push(
      <div key="row2" className="fw-kb-row">
        {row2}
      </div>
    );
    
    // Row 3: ZXCVBNM + Enter
    const row3 = [];
    for (const letter of KEYBOARD_ROWS[2]) {
      const status = game.status[letter] || '';
      row3.push(
        <button
          key={letter}
          className={`fw-key ${status}`}
          onClick={() => handleKeyInput(letter)}
        >
          {letter}
        </button>
      );
    }
    row3.push(
      <button
        key="enter"
        className="fw-key fw-key-enter"
        onClick={handleSubmit}
      >
        Enter
      </button>
    );
    rows.push(
      <div key="row3" className="fw-kb-row">
        {row3}
      </div>
    );
    
    return rows;
  };

  if (isLoading) {
    return (
      <div className="flickword-game">
        <div className="fw-header">
          <h3>🎯 FlickWord</h3>
          <div className="fw-stats">
            <span className="fw-streak">Loading...</span>
          </div>
        </div>
        <div className="fw-loading">
          <div className="fw-spinner"></div>
          <p>Loading today's word...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flickword-game">
      {/* Header */}
      <div className="fw-header">
        <h3>🎯 FlickWord</h3>
        <div className="fw-stats">
          <span className="fw-streak">Streak: 0</span>
          <span className="fw-timer">Next: --:--</span>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fw-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Word Info (if available) - Hidden by default */}
      {game.wordInfo?.definition && game.showHint && (
        <div className="fw-word-info">
          <p><strong>Hint:</strong> {game.wordInfo.definition}</p>
        </div>
      )}

      {/* Game Grid */}
      <div className="fw-grid" aria-label="FlickWord board" role="group">
        {renderGrid()}
      </div>

      {/* Keyboard */}
      <div className="fw-keyboard" aria-label="Keyboard" role="group">
        {renderKeyboard()}
      </div>

      {/* Actions */}
      <div className="fw-actions">
        <button className="fw-btn fw-new-game" onClick={initializeGame}>
          New Game
        </button>
        <button className="fw-btn fw-hint" onClick={() => {
          if (!game.done) {
            setGame(prev => ({
              ...prev,
              showHint: !prev.showHint
            }));
          }
        }}>
          {game.showHint ? 'Hide Hint' : 'Hint'}
        </button>
        {onClose && (
          <button className="fw-btn fw-close" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
