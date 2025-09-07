/* ========== trivia.js ==========
   Daily trivia tile with streaks. No network calls. Uses localStorage.
   Keys: flicklet:trivia:v1:streak, flicklet:trivia:v1:lastDate, flicklet:trivia:v1:lockDate
*/
(function(){
  const el = document.getElementById('triviaTile');
  if (!el) return;

  const qEl = document.getElementById('triviaQuestion');
  const cEl = document.getElementById('triviaChoices');
  const fEl = document.getElementById('triviaFeedback');
  const nBtn = document.getElementById('triviaNextBtn');
  const statsEl = el.querySelector('.trivia-stats');

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
  ];
  
  // Cache for trivia questions
  let triviaCache = null;
  let lastFetchDate = null;

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
      const response = await fetch(`${TRIVIA_API_BASE}?amount=10&category=10&difficulty=medium&type=multiple&encode=url3986&lang=${langCode}`);
      
      if (response.status === 429) {
        console.warn('🧠 API rate limited, using fallback questions');
        return FALLBACK_POOL;
      }
      
      const data = await response.json();
      
      if (data.response_code === 0 && data.results && data.results.length > 0) {
        // Convert API format to our format
        const questions = data.results.map((item, index) => ({
          id: `api_${index}`,
          q: decodeURIComponent(item.question),
          choices: [
            decodeURIComponent(item.correct_answer),
            ...item.incorrect_answers.map(ans => decodeURIComponent(ans))
          ].sort(() => Math.random() - 0.5), // Shuffle choices
          correct: 0 // Correct answer is always first after shuffling
        }));
        
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
    return (window.appData?.settings?.lang) || 
           (window.FlickletApp?.appData?.settings?.lang) || 
           'en';
  }

  // Initialize trivia
  async function initTrivia() {
    const lang = getCurrentLanguage();
    const questions = await fetchTriviaQuestions(lang);
    const q = questions[hashToIndex(today, questions.length)];

    // Lock logic: only allow a correct completion once per day
    const lockDate = localStorage.getItem(KEYS.lock);
    const locked = lockDate === today;

    // Render
    renderStats();
    renderQuestion(q, locked);
  }

  // Refresh trivia for language change
  window.__FlickletRefreshTrivia = async function() {
    console.log('🧠 Refreshing trivia for language change');
    const lang = getCurrentLanguage();
    console.log('🧠 Current language for trivia:', lang);
    
    // Clear cache to force fresh fetch
    triviaCache = null;
    lastFetchDate = null;
    
    const questions = await fetchTriviaQuestions(lang);
    const q = questions[hashToIndex(today, questions.length)];

    console.log('🧠 New trivia question:', {id: q.id, question: q.q.substring(0, 50) + '...', choices: q.choices.length, language: lang});

    const lockDate = localStorage.getItem(KEYS.lock);
    const locked = lockDate === today;

    renderStats();
    renderQuestion(q, locked);
  };

  // Start trivia
  initTrivia();

  function renderStats(){
    const streak = Number(localStorage.getItem(KEYS.streak) || 0);
    const last = localStorage.getItem(KEYS.last);
    const streakText = t('flickword_streak') || 'Streak';
    const completedText = t('trivia_completed_today') || ' • Completed today';
    statsEl.textContent = `${streakText}: ${streak}${last === today ? completedText : ''}`;
  }

  function renderQuestion(q, isLocked){
    qEl.textContent = q.q;
    cEl.innerHTML = '';
    fEl.textContent = '';
    nBtn.hidden = true;

    q.choices.forEach((text, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role','option');
      li.setAttribute('tabindex','0');
      li.dataset.idx = idx;
      li.textContent = text;

      if (isLocked){
        li.setAttribute('aria-disabled','true');
        li.style.opacity = '.6';
        li.style.cursor = 'not-allowed';
      } else {
        li.addEventListener('click', () => choose(idx));
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(idx); }
        });
      }
      cEl.appendChild(li);
    });

    if (isLocked){
      fEl.textContent = t('trivia_come_back_tomorrow') || 'Come back tomorrow for a new question.';
    }
  }

  function choose(idx){
    const correctIdx = q.correct;
    const items = Array.from(cEl.children);

    // Prevent double answers
    if ([...items].some(li => li.classList.contains('correct') || li.classList.contains('wrong'))) return;

    items.forEach(li => li.setAttribute('aria-selected','false'));
    const chosen = items[idx];
    chosen.setAttribute('aria-selected','true');

    const isCorrect = idx === correctIdx;
    chosen.classList.add(isCorrect ? 'correct' : 'wrong');
    const correctText = t('trivia_correct') || 'Correct!';
    const incorrectText = t('trivia_incorrect_answer') || 'Nope — correct answer is';
    fEl.textContent = isCorrect ? `${correctText} ✔` : `${incorrectText} "${q.choices[correctIdx]}".`;

    // Notify (optional)
    if (window.Notify){
      const streakUpText = t('trivia_streak_up') || 'Trivia: +1 streak';
      const tryAgainText = t('trivia_try_again_tomorrow') || 'Trivia: try again tomorrow';
      if (isCorrect) Notify.success(streakUpText);
      else Notify.info(tryAgainText);
    }

    // Update streak/lock
    if (isCorrect){
      bumpStreak();
      localStorage.setItem(KEYS.lock, today);
      nBtn.hidden = false;
      nBtn.textContent = t('trivia_ok') || 'OK';
      nBtn.onclick = () => { /* placeholder for future: next module */ };
    } else {
      // wrong answer still locks for today
      localStorage.setItem(KEYS.lock, today);
      nBtn.hidden = false;
      nBtn.textContent = t('trivia_ok') || 'OK';
      nBtn.onclick = () => {};
    }
    renderStats();
  }

  function bumpStreak(){
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
  function isoDay(d){ return d.toISOString().slice(0,10); }
  function prevDay(s){
    const d = new Date(s+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()-1); return isoDay(d);
  }
  function hashToIndex(str, mod){
    let h = 0; for (let i=0;i<str.length;i++) h = ((h<<5)-h) + str.charCodeAt(i) | 0;
    return Math.abs(h) % mod;
  }
})();




