/* ========== flickword.js ==========
   Compact FlickWord game for community section
   Wordle-style word guessing game
*/
(function(){
  const el = document.getElementById('flickwordTile');
  if (!el) return;

  // Game state
  let game = { 
    target: null, 
    guesses: [], 
    current: "", 
    max: 6, 
    done: false, 
    status: {}, 
    lastResults: [] 
  };

  // Word lists
  const WORDS = ["bliss","crane","flick","gravy","masks","toast","crown","spine","tiger","pride","happy","smile","peace","light","dream"];
  const ROWS = ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"];

  // Initialize FlickWord
  async function initFlickWord() {
    console.log('🎯 Initializing FlickWord...');
    
    // Create game HTML
    el.innerHTML = `
      <div class="flickword-game">
        <div class="fw-header">
          <h4>FlickWord</h4>
          <div class="fw-stats">
            <span class="fw-streak">Streak: 0</span>
            <span class="fw-timer">Next: --:--</span>
          </div>
        </div>
        <div class="fw-grid"></div>
        <div class="fw-keyboard"></div>
        <div class="fw-actions">
          <button class="fw-btn fw-new-game" onclick="startNewGame()">New Game</button>
          <button class="fw-btn fw-hint" onclick="showHint()">Hint</button>
        </div>
      </div>
    `;

    // Get today's word
    game.target = await getTodayWord();
    game.guesses = [];
    game.current = "";
    game.done = false;
    game.status = {};
    game.lastResults = [];

    // Render initial state
    renderGrid();
    renderKeyboard();
    updateStats();
    
    console.log('🎯 FlickWord initialized with target:', game.target);
  }

  // Get today's word
  async function getTodayWord() {
    const today = new Date().toISOString().slice(0, 10);
    const cached = localStorage.getItem(`flickword:word:${today}`);
    
    if (cached) {
      return cached.toUpperCase();
    }
    
    // Use fallback word list
    const start = new Date("2023-01-01T00:00:00");
    const days = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
    const word = WORDS[days % WORDS.length];
    
    localStorage.setItem(`flickword:word:${today}`, word);
    return word.toUpperCase();
  }

  // Render game grid
  function renderGrid() {
    const grid = el.querySelector('.fw-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    for (let i = 0; i < game.max; i++) {
      const guess = game.guesses[i] || (i === game.guesses.length ? game.current : "");
      for (let j = 0; j < 5; j++) {
        const tile = document.createElement('div');
        tile.className = 'fw-tile';
        tile.textContent = guess[j] || '';
        
        if (i < game.guesses.length) {
          const res = game.lastResults[i][j];
          tile.classList.add(res);
        }
        
        grid.appendChild(tile);
      }
    }
  }

  // Render keyboard
  function renderKeyboard() {
    const kb = el.querySelector('.fw-keyboard');
    if (!kb) return;
    
    kb.innerHTML = '';
    
    // Row 1 + Backspace
    const r1 = document.createElement('div');
    r1.className = 'fw-kb-row';
    for (const L of ROWS[0]) r1.appendChild(makeKey(L));
    r1.appendChild(makeKey('⌫', 'fw-key-back', backspace));
    kb.appendChild(r1);
    
    // Row 2
    const r2 = document.createElement('div');
    r2.className = 'fw-kb-row';
    for (const L of ROWS[1]) r2.appendChild(makeKey(L));
    kb.appendChild(r2);
    
    // Row 3 + Enter
    const r3 = document.createElement('div');
    r3.className = 'fw-kb-row';
    for (const L of ROWS[2]) r3.appendChild(makeKey(L));
    r3.appendChild(makeKey('Enter', 'fw-key-enter', submit));
    kb.appendChild(r3);
  }

  // Create keyboard key
  function makeKey(label, extraClasses = '', handler) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = `fw-key ${extraClasses}`.trim();
    
    if (label === '⌫') {
      btn.onclick = backspace;
    } else if (label === 'Enter') {
      btn.onclick = submit;
    } else if (label.length === 1) {
      const st = game.status[label];
      if (st === 'correct') btn.classList.add('correct');
      else if (st === 'present') btn.classList.add('present');
      else if (st === 'absent') btn.classList.add('absent');
      btn.onclick = () => onKey(label);
    } else if (handler) {
      btn.onclick = handler;
    }
    
    return btn;
  }

  // Handle key input
  function onKey(letter) {
    if (game.done || game.current.length >= 5) return;
    game.current += letter;
    renderGrid();
  }

  // Handle backspace
  function backspace() {
    if (game.done || !game.current) return;
    game.current = game.current.slice(0, -1);
    renderGrid();
  }

  // Submit guess
  async function submit() {
    if (game.done || game.current.length !== 5) return;
    
    const valid = await isValidWord(game.current);
    if (!valid) {
      showNotification("Not a valid word!", "error");
      game.current = '';
      renderGrid();
      return;
    }

    const res = scoreGuess(game.current, game.target);
    game.lastResults.push(res);

    // Update keyboard status
    for (let i = 0; i < 5; i++) {
      const L = game.current[i];
      if (res[i] === 'correct') game.status[L] = 'correct';
      else if (res[i] === 'present' && game.status[L] !== 'correct') game.status[L] = 'present';
      else if (res[i] === 'absent' && !game.status[L]) game.status[L] = 'absent';
    }

    game.guesses.push(game.current);
    
    if (game.current === game.target) {
      showNotification("🎉 Correct! Well done!", "success");
      game.done = true;
      updateStats();
    } else if (game.guesses.length === game.max) {
      showNotification(`Game over! The word was: ${game.target}`, "error");
      game.done = true;
    }
    
    game.current = '';
    renderGrid();
    renderKeyboard();
  }

  // Validate word
  async function isValidWord(word) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // Score guess
  function scoreGuess(guess, target) {
    const res = Array(5).fill('absent');
    const pool = target.split('');
    
    // First pass: exact matches
    for (let i = 0; i < 5; i++) {
      if (guess[i] === pool[i]) {
        res[i] = 'correct';
        pool[i] = null;
      }
    }
    
    // Second pass: present matches
    for (let i = 0; i < 5; i++) {
      if (res[i] === 'correct') continue;
      const idx = pool.indexOf(guess[i]);
      if (idx !== -1) {
        res[i] = 'present';
        pool[idx] = null;
      }
    }
    
    return res;
  }

  // Show notification
  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = el.querySelector('.fw-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `fw-notification ${type}`;
    notification.textContent = message;
    el.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) notification.remove();
    }, 3000);
  }

  // Update stats
  function updateStats() {
    const streakEl = el.querySelector('.fw-streak');
    if (streakEl) {
      const streak = Number(localStorage.getItem('flickword:streak') || 0);
      streakEl.textContent = `Streak: ${streak}`;
    }
  }

  // Start new game
  window.startNewGame = async function() {
    await initFlickWord();
  };

  // Show hint
  window.showHint = function() {
    if (game.done) return;
    const hint = game.target[0] + '____';
    showNotification(`Hint: ${hint}`, "info");
  };

  // Keyboard event handling
  document.addEventListener('keydown', function(e) {
    if (game.done) return;
    
    if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
      e.preventDefault();
      onKey(e.key.toLowerCase());
    }
  });

  // Initialize when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFlickWord);
  } else {
    initFlickWord();
  }

  // Expose for external access
  window.FlickWord = {
    init: initFlickWord,
    startNewGame: window.startNewGame,
    showHint: window.showHint
  };
})();

