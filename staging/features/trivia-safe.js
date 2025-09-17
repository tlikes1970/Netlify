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

  // External trivia API integration
  const TRIVIA_API_BASE = 'https://opentdb.com/api.php';
  
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

  // Fetch trivia questions from API
  async function fetchTriviaQuestions(lang = 'en') {
    const langCode = lang === 'es' ? 'es' : 'en';
    const cacheKey = `trivia_${langCode}_${today}`;
    
    // Check cache first
    if (triviaCache && lastFetchDate === today) {
      return triviaCache;
    }
    
    try {
      const response = await fetch(`${TRIVIA_API_BASE}?amount=5&category=14&difficulty=medium&type=multiple&encode=url3986`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        triviaCache = data.results.map((q, idx) => ({
          id: `api_${idx}`,
          q: decodeURIComponent(q.question),
          choices: [...q.incorrect_answers.map(a => decodeURIComponent(a)), decodeURIComponent(q.correct_answer)].sort(() => Math.random() - 0.5),
          correct: [...q.incorrect_answers.map(a => decodeURIComponent(a)), decodeURIComponent(q.correct_answer)].indexOf(decodeURIComponent(q.correct_answer))
        }));
        lastFetchDate = today;
        return triviaCache;
      }
    } catch (error) {
      console.warn('Trivia API failed, using fallback:', error);
    }
    
    // Fallback to hardcoded questions
    triviaCache = FALLBACK_POOL;
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

  function renderStats(){
    const streak = Number(localStorage.getItem(KEYS.streak) || 0);
    const last = localStorage.getItem(KEYS.last);
    const streakText = t('flickword_streak') || 'Streak';
    const completedText = t('trivia_completed_today') || ' • Completed today';
    safeSetTextContent(statsEl, `${streakText}: ${streak}${last === today ? completedText : ''}`);
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

    if (isLocked) {
      cEl.style.opacity = '0.5';
      cEl.style.pointerEvents = 'none';
    } else {
      cEl.style.opacity = '1';
      cEl.style.pointerEvents = 'auto';
    }
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
    
    // Show next button
    safeSetHidden(nBtn, false);
    nBtn.onclick = nextQuestion;

    if (isCorrect) {
      updateStreak();
      renderStats();
    }
  }

  async function nextQuestion() {
    try {
      const questions = await fetchTriviaQuestions();
      const q = questions[Math.floor(Math.random() * questions.length)];
      currentQuestion = q;
      
      // Lock logic disabled - allow unlimited questions
      const locked = false;

      // Render
      renderStats();
      renderQuestion(q, locked);
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

