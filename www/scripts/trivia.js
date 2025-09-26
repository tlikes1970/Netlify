/* ========== trivia.js ==========
   Daily trivia tile with streaks. No network calls. Uses localStorage.
   Keys: flicklet:trivia:v1:streak, flicklet:trivia:v1:lastDate, flicklet:trivia:v1:lockDate
*/
(function () {
  const el = document.getElementById('triviaTile');
  if (!el) return;

  const qEl = document.getElementById('triviaQuestion');
  const cEl = document.getElementById('triviaChoices');
  const fEl = document.getElementById('triviaFeedback');
  const nBtn = document.getElementById('triviaNextBtn');
  const statsEl = el.querySelector('.trivia-stats');

  // Safety check - if required elements don't exist, skip initialization
  if (!qEl || !cEl || !fEl || !nBtn) {
    console.warn('Trivia: Required elements not found, skipping initialization');
    return;
  }

  // Safety check - if statsEl doesn't exist, create a placeholder or skip stats
  if (!statsEl) {
    console.warn('trivia-stats element not found, creating placeholder');
    const placeholder = document.createElement('div');
    placeholder.className = 'trivia-stats';
    placeholder.style.display = 'none'; // Hide if no stats needed
    el.appendChild(placeholder);
  }

  const KEYS = {
    streak: 'flicklet:trivia:v1:streak',
    last: 'flicklet:trivia:v1:lastDate',
    lock: 'flicklet:trivia:v1:lockDate',
  };

  const today = isoDay(new Date()); // YYYY-MM-DD

  // External trivia API integration
  const TRIVIA_API_BASE = 'https://opentdb.com/api.php';

  // Fallback pool for when API fails
  const FALLBACK_POOL = [
    {
      id: 'q1',
      q: 'Which network originally aired "Archer"?',
      choices: ['HBO', 'FX', 'AMC', 'Paramount+'],
      correct: 1,
    },
    {
      id: 'q2',
      q: '"Alien: Earth" is a spin-off in which franchise?',
      choices: ['Predator', 'Alien', 'Star Trek', 'The Expanse'],
      correct: 1,
    },
    {
      id: 'q3',
      q: 'Sherlock (2010) starred Benedict Cumberbatch and…',
      choices: ['Tom Hiddleston', 'Martin Freeman', 'David Tennant', 'Matt Smith'],
      correct: 1,
    },
    {
      id: 'q4',
      q: '"House of the Dragon" streams primarily on…',
      choices: ['HBO Max', 'Netflix', 'Hulu', 'Apple TV+'],
      correct: 0,
    },
    {
      id: 'q5',
      q: 'Which streaming service is known for "The Mandalorian"?',
      choices: ['Netflix', 'Disney+', 'HBO Max', 'Amazon Prime'],
      correct: 1,
    },
    {
      id: 'q6',
      q: 'What year did "Breaking Bad" first air?',
      choices: ['2007', '2008', '2009', '2010'],
      correct: 1,
    },
    {
      id: 'q7',
      q: 'Who created "Stranger Things"?',
      choices: ['Ryan Murphy', 'The Duffer Brothers', 'Shonda Rhimes', 'David Fincher'],
      correct: 1,
    },
    {
      id: 'q8',
      q: 'Which show features the character Walter White?',
      choices: ['Better Call Saul', 'Breaking Bad', 'The Walking Dead', 'Ozark'],
      correct: 1,
    },
  ];

  // Cache for trivia questions
  let triviaCache = null;
  let lastFetchDate = null;

  // Current question data (accessible to choose function)
  let currentQuestion = null;

  // Fetch trivia questions from API
  async function fetchTriviaQuestions(lang = 'en') {
    const langCode = lang === 'es' ? 'es' : 'en';
    const cacheKey = `trivia_${langCode}_${today}`;

    // Check cache first
    if (triviaCache && lastFetchDate === today) {
      console.log('🧠 Using cached trivia questions');
      return triviaCache;
    }

    try {
      console.log('🧠 Fetching trivia questions from API for language:', langCode);
      const response = await fetch(
        `${TRIVIA_API_BASE}?amount=10&category=10&difficulty=medium&type=multiple&encode=url3986&lang=${langCode}`,
      );

      if (response.status === 429) {
        console.warn('🧠 API rate limited, using fallback questions');
        return FALLBACK_POOL;
      }

      const data = await response.json();

      if (data.response_code === 0 && data.results && data.results.length > 0) {
        // Convert API format to our format
        const questions = data.results.map((item, index) => {
          const correctAnswer = decodeURIComponent(item.correct_answer);
          const incorrectAnswers = item.incorrect_answers.map((ans) => decodeURIComponent(ans));
          const allChoices = [correctAnswer, ...incorrectAnswers];

          // Shuffle choices and track correct index
          const shuffledChoices = [...allChoices].sort(() => Math.random() - 0.5);
          const correctIndex = shuffledChoices.indexOf(correctAnswer);

          return {
            id: `api_${index}`,
            q: decodeURIComponent(item.question),
            choices: shuffledChoices,
            correct: correctIndex,
          };
        });

        triviaCache = questions;
        lastFetchDate = today;
        console.log('🧠 Trivia questions fetched successfully:', questions.length);
        return questions;
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.warn('🧠 Failed to fetch trivia from API, using fallback:', error);
      return FALLBACK_POOL;
    }
  }

  // Get current language
  function getCurrentLanguage() {
    return window.appData?.settings?.lang || window.FlickletApp?.appData?.settings?.lang || 'en';
  }

  // Initialize trivia
  async function initTrivia() {
    const lang = getCurrentLanguage();
    const questions = await fetchTriviaQuestions(lang);
    const q = questions[hashToIndex(today, questions.length)];

    // Store current question for choose function access
    currentQuestion = q;

    // Lock logic disabled - allow unlimited questions
    const locked = false;

    // Render
    renderStats();
    renderQuestion(q, locked);
  }

  // Refresh trivia for language change
  window.__FlickletRefreshTrivia = async function () {
    console.log('🧠 Refreshing trivia for language change');
    const lang = getCurrentLanguage();
    console.log('🧠 Current language for trivia:', lang);

    // Clear cache to force fresh fetch
    triviaCache = null;
    lastFetchDate = null;

    const questions = await fetchTriviaQuestions(lang);
    const q = questions[hashToIndex(today, questions.length)];

    // Store current question for choose function access
    currentQuestion = q;

    console.log('🧠 New trivia question:', {
      id: q.id,
      question: q.q.substring(0, 50) + '...',
      choices: q.choices.length,
      language: lang,
    });

    // Lock logic disabled - allow unlimited questions
    const locked = false;

    renderStats();
    renderQuestion(q, locked);
  };

  // Start trivia
  initTrivia();

  // Expose trivia functionality for other systems to use
  window.FlickletTrivia = {
    // Get current question data
    getCurrentQuestion: function () {
      const qEl = document.getElementById('triviaQuestion');
      const cEl = document.getElementById('triviaChoices');

      if (!qEl || !cEl) return null;

      const question = qEl.textContent;
      const choices = Array.from(cEl.children).map((li) => li.textContent);

      // Find correct answer by looking at the data attributes
      let correctIndex = 0;
      for (let i = 0; i < cEl.children.length; i++) {
        if (cEl.children[i].dataset.idx == '0') {
          // Correct answer is always at index 0 after shuffling
          correctIndex = i;
          break;
        }
      }

      return {
        id: 'main_trivia',
        question: question,
        options: choices,
        correct: correctIndex,
        source: 'main_system',
      };
    },

    // Check if trivia is locked for today
    isLockedToday: function () {
      const lockDate = localStorage.getItem(KEYS.lock);
      return lockDate === today;
    },

    // Get current streak
    getCurrentStreak: function () {
      return Number(localStorage.getItem(KEYS.streak) || 0);
    },

    // Get stats
    getStats: function () {
      return {
        streak: Number(localStorage.getItem(KEYS.streak) || 0),
        lastDate: localStorage.getItem(KEYS.last),
        locked: localStorage.getItem(KEYS.lock) === today,
      };
    },
  };

  function renderStats() {
    if (!statsEl) {
      console.warn('statsEl not available, skipping stats render');
      return;
    }

    const streak = Number(localStorage.getItem(KEYS.streak) || 0);
    const last = localStorage.getItem(KEYS.last);
    const streakText = t('flickword_streak') || 'Streak';
    const completedText = t('trivia_completed_today') || ' • Completed today';
    statsEl.textContent = `${streakText}: ${streak}${last === today ? completedText : ''}`;
  }

  function renderQuestion(q, isLocked) {
    if (!qEl) {
      console.warn('Trivia: Question element not found, skipping render');
      return;
    }
    qEl.textContent = q.q;
    if (cEl) cEl.innerHTML = '';
    if (fEl) fEl.textContent = '';
    if (nBtn) nBtn.hidden = true;

    q.choices.forEach((text, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('tabindex', '0');
      li.dataset.idx = idx;
      li.textContent = text;

      if (isLocked) {
        li.setAttribute('aria-disabled', 'true');
        li.style.opacity = '.6';
        li.style.cursor = 'not-allowed';
      } else {
        li.addEventListener('click', () => choose(idx));
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            choose(idx);
          }
        });
      }
      cEl.appendChild(li);
    });

    if (isLocked) {
      fEl.textContent = t('trivia_come_back_tomorrow') || 'Come back tomorrow for a new question.';
    }
  }

  function choose(idx) {
    // Check if current question is available
    if (!currentQuestion) {
      console.error('🧠 No current question available for trivia');
      return;
    }

    const correctIdx = currentQuestion.correct;
    const items = Array.from(cEl.children);

    // Prevent double answers
    if ([...items].some((li) => li.classList.contains('correct') || li.classList.contains('wrong')))
      return;

    items.forEach((li) => li.setAttribute('aria-selected', 'false'));
    const chosen = items[idx];
    chosen.setAttribute('aria-selected', 'true');

    const isCorrect = idx === correctIdx;
    chosen.classList.add(isCorrect ? 'correct' : 'wrong');
    const correctText = t('trivia_correct') || 'Correct!';
    const incorrectText = t('trivia_incorrect_answer') || 'Nope — correct answer is';
    fEl.textContent = isCorrect
      ? `${correctText} ✔`
      : `${incorrectText} "${currentQuestion.choices[correctIdx]}".`;

    // Notify (optional)
    if (window.Notify) {
      const streakUpText = t('trivia_streak_up') || 'Trivia: +1 streak';
      const tryAgainText = t('trivia_try_again_tomorrow') || 'Trivia: try again tomorrow';
      if (isCorrect) Notify.success(streakUpText);
      else Notify.info(tryAgainText);
    }

    // Update streak (no locking - unlimited questions)
    if (isCorrect) {
      bumpStreak();
    }

    // Always show next button after answering
    nBtn.hidden = false;
    nBtn.style.display = 'block';
    nBtn.style.visibility = 'visible';
    nBtn.style.opacity = '1';
    nBtn.style.position = 'static';
    nBtn.style.zIndex = '10';
    nBtn.textContent = isCorrect
      ? t('trivia_next_question') || 'Next Question'
      : t('trivia_try_again') || 'Try Again';
    nBtn.onclick = () => {
      try {
        loadNextQuestion().catch((error) => {
          console.error('🧠 Unhandled promise rejection in loadNextQuestion:', error);
          // Show error message to user
          fEl.textContent = 'Error loading next question. Please refresh the page.';
          nBtn.hidden = true;
        });
      } catch (error) {
        console.error('🧠 Error in loadNextQuestion click handler:', error);
        fEl.textContent = 'Error loading next question. Please refresh the page.';
        nBtn.hidden = true;
      }
    };

    // Force a reflow to ensure the button is visible
    nBtn.offsetHeight;

    console.log('🧠 Next button shown after answer', {
      isCorrect: isCorrect,
      hidden: nBtn.hidden,
      display: nBtn.style.display,
      visibility: nBtn.style.visibility,
      opacity: nBtn.style.opacity,
      textContent: nBtn.textContent,
      computedStyle: window.getComputedStyle(nBtn).display,
    });
    renderStats();
  }

  // Load next question
  async function loadNextQuestion() {
    console.log('🧠 Loading next trivia question...');

    try {
      const lang = getCurrentLanguage();
      const questions = await fetchTriviaQuestions(lang);

      // Get a different question (not the same as current)
      let nextQuestion;
      let attempts = 0;
      do {
        nextQuestion = questions[hashToIndex(today + '_' + attempts, questions.length)];
        attempts++;
      } while (
        nextQuestion &&
        currentQuestion &&
        nextQuestion.id === currentQuestion.id &&
        attempts < 10
      );

      // If we couldn't find a different question, just use the first one
      if (!nextQuestion || (currentQuestion && nextQuestion.id === currentQuestion.id)) {
        nextQuestion = questions[0];
      }

      // Store the new question
      currentQuestion = nextQuestion;

      // Reset the UI
      fEl.textContent = '';
      nBtn.hidden = true;
      nBtn.style.display = 'none';

      // Clear any existing choice styling
      const items = Array.from(cEl.children);
      items.forEach((li) => {
        li.classList.remove('correct', 'wrong');
        li.setAttribute('aria-selected', 'false');
      });

      // Render the new question
      renderQuestion(nextQuestion, false);

      console.log('🧠 Next question loaded:', nextQuestion.q.substring(0, 50) + '...');
    } catch (error) {
      console.error('🧠 Error loading next question:', error);
      // Fallback: just hide the button and show error
      nBtn.hidden = true;
      fEl.textContent = 'Error loading next question. Please refresh the page.';
    }
  }

  function bumpStreak() {
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

  // Helpers
  function isoDay(d) {
    return d.toISOString().slice(0, 10);
  }
  function prevDay(s) {
    const d = new Date(s + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return isoDay(d);
  }
  function hashToIndex(str, mod) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h) % mod;
  }
})();
