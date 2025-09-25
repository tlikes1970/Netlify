/* ========== trivia-safe.js ==========
   Safe version of trivia.js with null checks
   Daily trivia tile with streaks. No network calls. Uses localStorage.
   Keys: flicklet:trivia:v1:streak, flicklet:trivia:v1:lastDate, flicklet:trivia:v1:lockDate
*/
(function(){
  const el = document.getElementById('triviaTile');
  if (!el) {
    console.log('triviaTile not found, skipping trivia initialization');
    return;
  }

  const qEl = document.getElementById('triviaQuestion');
  const cEl = document.getElementById('triviaChoices');
  const fEl = document.getElementById('triviaFeedback');
  const nBtn = document.getElementById('triviaNextBtn');
  const statsEl = el.querySelector('.trivia-stats');

  // Safety check for all required elements
  if (!qEl || !cEl || !fEl || !nBtn || !statsEl) {
    console.error('Required trivia elements missing:', {
      qEl: !!qEl,
      cEl: !!cEl, 
      fEl: !!fEl,
      nBtn: !!nBtn,
      statsEl: !!statsEl
    });
    return;
  }

  const KEYS = {
    streak: 'flicklet:trivia:v1:streak',
    last  : 'flicklet:trivia:v1:lastDate',
    lock  : 'flicklet:trivia:v1:lockDate'
  };

  const today = isoDay(new Date()); // YYYY-MM-DD

  // External trivia API integration via proxy
  const TRIVIA_API_BASE = '/.netlify/functions/trivia-proxy';
  
  // Fallback pool for when API fails
  const FALLBACK_POOL = [
    { id: 'q1', q: 'Which network originally aired "Archer"?', choices: ['HBO','FX','AMC','Paramount+'], correct: 1 },
    { id: 'q2', q: '"Alien: Earth" is a spin-off in which franchise?', choices: ['Predator','Alien','Star Trek','The Expanse'], correct: 1 },
    { id: 'q3', q: 'Sherlock (2010) starred Benedict Cumberbatch and…', choices: ['Tom Hiddleston','Martin Freeman','David Tennant','Matt Smith'], correct: 1 },
    { id: 'q4', q: '"House of the Dragon" streams primarily on…', choices: ['HBO Max','Netflix','Hulu','Apple TV+'], correct: 0 },
    { id: 'q5', q: 'Which streaming service is known for "The Mandalorian"?', choices: ['Netflix','Disney+','HBO Max','Amazon Prime'], correct: 1 },
    { id: 'q6', q: 'What year did "Breaking Bad" first air?', choices: ['2007','2008','2009','2010'], correct: 1 },
    { id: 'q7', q: 'Who created "Stranger Things"?', choices: ['Ryan Murphy','The Duffer Brothers','Shonda Rhimes','David Fincher'], correct: 1 },
    { id: 'q8', q: 'Which show features the character Walter White?', choices: ['Better Call Saul','Breaking Bad','The Walking Dead','Ozark'], correct: 1 },
  ];
  
  // Cache for trivia questions
  let triviaCache = null;
  let lastFetchDate = null;
  
  // Current question data (accessible to choose function)
  let currentQuestion = null;

  // Safe helper functions
  function safeSetTextContent(element, text) {
    if (element && typeof element.textContent !== 'undefined') {
      element.textContent = text;
    }
  }

  function safeSetInnerHTML(element, html) {
    if (element && typeof element.innerHTML !== 'undefined') {
      element.innerHTML = html;
    }
  }

  function safeSetHidden(element, hidden) {
    if (element && typeof element.hidden !== 'undefined') {
      element.hidden = hidden;
    }
  }

  // Fetch trivia questions from API with deterministic daily seed
  async function fetchTriviaQuestions(lang = 'en') {
    const langCode = lang === 'es' ? 'es' : 'en';
    const cacheKey = `trivia_${langCode}_${today}`;
    
    // Check cache first
    if (triviaCache && lastFetchDate === today) {
      return triviaCache;
    }
    
    try {
      // Use UTC date as seed for deterministic daily questions
      const utcDate = new Date().toISOString().split('T')[0];
      const seed = utcDate.replace(/-/g, ''); // Convert YYYY-MM-DD to YYYYMMDD
      
      // 10s timeout so the modal never freezes
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);

      const response = await fetch(`${TRIVIA_API_BASE}?amount=5&category=14&difficulty=medium&type=multiple&encode=url3986&seed=${seed}`, { 
        signal: ctrl.signal 
      });
      clearTimeout(t);
      
      if (!response.ok) throw new Error('Proxy error ' + response.status);
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Use deterministic sorting based on seed
        const seededRandom = (seed) => {
          let x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };
        
        triviaCache = data.results.map((q, idx) => {
          const choices = [...q.incorrect_answers.map(a => decodeURIComponent(a)), decodeURIComponent(q.correct_answer)];
          // Use seeded random for consistent ordering
          const shuffledChoices = choices.sort((a, b) => seededRandom(seed + idx + a.length) - seededRandom(seed + idx + b.length));
          return {
            id: `api_${idx}`,
            q: decodeURIComponent(q.question),
            choices: shuffledChoices,
            correct: shuffledChoices.indexOf(decodeURIComponent(q.correct_answer))
          };
        });
        lastFetchDate = today;
        return triviaCache;
      }
    } catch (error) {
      clearTimeout(t);
      console.warn('Trivia API failed, using fallback:', error);
      
      // Graceful failure: close modal and show a friendly message
      if (window.closeTriviaModalWithError) {
        window.closeTriviaModalWithError('Unable to load trivia questions right now.');
      } else {
        console.error('[Trivia] fetch failed', error);
      }
    }
    
    // Fallback to hardcoded questions with deterministic selection
    const utcDate = new Date().toISOString().split('T')[0];
    const seed = utcDate.replace(/-/g, '');
    const seededRandom = (seed) => {
      let x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    // Select 5 questions deterministically from fallback pool
    const selectedQuestions = [];
    const usedIndices = new Set();
    for (let i = 0; i < Math.min(5, FALLBACK_POOL.length); i++) {
      let index;
      do {
        index = Math.floor(seededRandom(seed + i) * FALLBACK_POOL.length);
      } while (usedIndices.has(index));
      usedIndices.add(index);
      selectedQuestions.push(FALLBACK_POOL[index]);
    }
    
    triviaCache = selectedQuestions;
    lastFetchDate = today;
    return triviaCache;
  }

  function isoDay(d) {
    return d.toISOString().slice(0, 10);
  }

  function prevDay(day) {
    const d = new Date(day);
    d.setDate(d.getDate() - 1);
    return isoDay(d);
  }

  function updateStreak() {
    const last = localStorage.getItem(KEYS.last);
    const streak = Number(localStorage.getItem(KEYS.streak) || 0);

    if (last === prevDay(today)) {
      localStorage.setItem(KEYS.streak, String(streak + 1));
    } else if (last === today) {
      // already counted today; no change
    } else {
      // missed a day or first time
      localStorage.setItem(KEYS.streak, '1');
    }
    localStorage.setItem(KEYS.last, today);
  }

  // Update Trivia stats similar to FlickWord
  function updateTriviaStats(isCorrect) {
    // Load current stats
    const rawStats = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
    const triviaStats = rawStats.trivia || {
      games: 0,
      wins: 0,
      losses: 0,
      streak: 0,
      maxStreak: 0
    };

    // Update stats
    triviaStats.games += 1;
    
    if (isCorrect) {
      triviaStats.wins += 1;
      triviaStats.streak += 1;
      // Update best streak if current streak is higher
      if (triviaStats.streak > triviaStats.maxStreak) {
        triviaStats.maxStreak = triviaStats.streak;
      }
    } else {
      // Reset streak on wrong answer
      triviaStats.streak = 0;
    }
    
    // Calculate losses
    triviaStats.losses = triviaStats.games - triviaStats.wins;

    // Save updated stats
    const newStats = {
      ...rawStats,
      trivia: triviaStats
    };
    localStorage.setItem('flicklet-data', JSON.stringify(newStats));
    
    // Also save to individual trivia stats for compatibility
    localStorage.setItem('flicklet:trivia:v1:streak', String(triviaStats.streak));
    localStorage.setItem('flicklet:trivia:v1:best', String(triviaStats.maxStreak));
    
    // Increment daily count for ALL answers (both correct and incorrect)
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `flicklet:trivia:daily:${today}`;
    const currentCount = parseInt(localStorage.getItem(dailyKey) || '0');
    localStorage.setItem(dailyKey, String(currentCount + 1));
    
    // Update display
    renderStats();
    
    // Send stats update to parent window
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'trivia:result',
        payload: { 
          streak: triviaStats.streak, 
          best: triviaStats.maxStreak, 
          acc: Math.round((triviaStats.wins / triviaStats.games) * 100) || 0
        }
      }, '*');
    }
  }

  function renderStats(){
    // Get daily count and limits
    const isPro = window.appData?.settings?.pro || false;
    const dailyLimit = isPro ? 50 : 5;
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `flicklet:trivia:daily:${today}`;
    const dailyCount = parseInt(localStorage.getItem(dailyKey) || '0');
    
    // Simple counter in top left
    const statsHTML = `
      <div class="daily-counter">
        ${dailyCount}/${dailyLimit}
      </div>
    `;
    
    safeSetInnerHTML(statsEl, statsHTML);
  }

  function renderQuestion(q, isLocked){
    safeSetTextContent(qEl, q.q);
    safeSetInnerHTML(cEl, '');
    safeSetTextContent(fEl, '');
    safeSetHidden(nBtn, true);

    q.choices.forEach((text, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role','option');
      li.setAttribute('tabindex','0');
      li.className = 'choice-btn';
      li.textContent = text;
      li.onclick = () => choose(idx);
      li.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          choose(idx);
        }
      };
      cEl.appendChild(li);
    });

    cEl.style.opacity = '1';
    cEl.style.pointerEvents = 'auto';
  }

  function choose(choiceIdx) {
    if (!currentQuestion) return;
    
    const isCorrect = choiceIdx === currentQuestion.correct;
    
    // Update UI
    const choices = cEl.querySelectorAll('.choice-btn');
    choices.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === currentQuestion.correct) {
        btn.classList.add('correct');
      } else if (idx === choiceIdx && !isCorrect) {
        btn.classList.add('incorrect');
      }
    });

    // Show feedback
    fEl.className = `feedback-${isCorrect ? 'correct' : 'incorrect'}`;
    fEl.style.display = 'block';
    safeSetTextContent(fEl, isCorrect ? 'Correct! 🎉' : `Wrong! The answer was: ${currentQuestion.choices[currentQuestion.correct]}`);
    
    // Update stats (includes daily count increment)
    updateTriviaStats(isCorrect);
    
    // Auto-advance to next question after 2 seconds
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  }

  async function nextQuestion() {
    try {
      // Check daily limits based on user plan
      const isPro = window.appData?.settings?.pro || false;
      const dailyLimit = isPro ? 50 : 5; // Pro users get 50, Basic users get 5
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `flicklet:trivia:daily:${today}`;
      const dailyCount = parseInt(localStorage.getItem(dailyKey) || '0');
      const locked = dailyCount >= dailyLimit;

      if (locked) {
        // Show limit reached message
        safeSetTextContent(qEl, 'Daily limit reached!');
        safeSetInnerHTML(cEl, `
          <div style="text-align: center; padding: 20px; color: var(--text-secondary); font-style: italic;">
            <p>You've reached your daily limit (${dailyCount}/${dailyLimit})</p>
            <p>${isPro ? 'Pro users get 50 questions per day' : 'Upgrade to Pro for 50 questions per day'}</p>
          </div>
        `);
        safeSetTextContent(fEl, '');
        safeSetHidden(nBtn, true);
        renderStats();
        return;
      }

      const questions = await fetchTriviaQuestions();
      const q = questions[Math.floor(Math.random() * questions.length)];
      currentQuestion = q;

      // Render
      renderStats();
      renderQuestion(q);
    } catch (error) {
      console.error('Error loading trivia question:', error);
      safeSetTextContent(qEl, 'Error loading question. Please try again.');
    }
  }

  // Initialize
  async function initTrivia() {
    try {
      await nextQuestion();
    } catch (error) {
      console.error('Error initializing trivia:', error);
    }
  }

  // Start the trivia
  initTrivia();

  // Expose functions for external use
  window.__FlickletRefreshTrivia = async function() {
    await nextQuestion();
  };

})();

