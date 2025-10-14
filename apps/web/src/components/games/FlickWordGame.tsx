import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from '@/lib/language';

// Game configuration
const WORDS = [
  'bliss', 'crane', 'flick', 'gravy', 'masks', 'toast', 'crown', 'spine', 'tiger', 'pride',
  'happy', 'smile', 'peace', 'light', 'dream', 'magic', 'story', 'music', 'dance', 'heart'
];

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
};

interface FlickWordGameProps {
  onClose?: () => void;
  onGameComplete?: (won: boolean, guesses: number) => void;
}

export default function FlickWordGame({ onClose, onGameComplete }: FlickWordGameProps) {
  const translations = useTranslations();
  const [game, setGame] = useState<GameState>({
    target: '',
    guesses: [],
    current: '',
    maxGuesses: 6,
    done: false,
    status: {},
    lastResults: []
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Get today's word
  const getTodayWord = useCallback(async (): Promise<string> => {
    const today = new Date().toISOString().slice(0, 10);
    const cached = localStorage.getItem(`flickword:word:${today}`);

    if (cached) {
      return cached.toUpperCase();
    }

    try {
      // Try to get a random word from API
      const response = await fetch('https://api.datamuse.com/words?sp=?????&max=1');
      const data = await response.json();
      
      if (Array.isArray(data) && data[0]?.word && /^[a-z]{5}$/.test(data[0].word)) {
        localStorage.setItem(`flickword:word:${today}`, data[0].word);
        return data[0].word.toUpperCase();
      }
    } catch (error) {
      console.warn('Failed to fetch word from API, using fallback');
    }

    // Fallback to predefined words
    const start = new Date('2023-01-01T00:00:00');
    const days = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const word = WORDS[days % WORDS.length];
    
    localStorage.setItem(`flickword:word:${today}`, word);
    return word.toUpperCase();
  }, []);

  // Validate word
  const isValidWord = useCallback(async (word: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
      );
      return response.ok;
    } catch (error) {
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
        pool[i] = null;
      }
    }

    // Second pass: present matches
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'correct') continue;
      const idx = pool.indexOf(guess[i]);
      if (idx !== -1) {
        result[i] = 'present';
        pool[idx] = null;
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
  const initializeGame = useCallback(async () => {
    const target = await getTodayWord();
    setGame({
      target,
      guesses: [],
      current: '',
      maxGuesses: 6,
      done: false,
      status: {},
      lastResults: []
    });
  }, [getTodayWord]);

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
    if (game.done || game.current.length !== 5) return;

    const valid = await isValidWord(game.current);
    if (!valid) {
      showNotification('Not a valid word!', 'error');
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
      if (game.done) return;

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
  }, [game.done, handleBackspace, handleSubmit, handleKeyInput]);

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
            const hint = game.target[0] + '____';
            showNotification(`Hint: ${hint}`, 'info');
          }
        }}>
          Hint
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
