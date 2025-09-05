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

  // Simple pool; add more later or swap to your dataset
  const POOL = [
    { id: 'q1', q: 'Which network originally aired "Archer"?', choices: ['HBO','FX','AMC','Paramount+'], correct: 1 },
    { id: 'q2', q: '"Alien: Earth" is a spin-off in which franchise?', choices: ['Predator','Alien','Star Trek','The Expanse'], correct: 1 },
    { id: 'q3', q: 'Sherlock (2010) starred Benedict Cumberbatch and…', choices: ['Tom Hiddleston','Martin Freeman','David Tennant','Matt Smith'], correct: 1 },
    { id: 'q4', q: '"House of the Dragon" streams primarily on…', choices: ['HBO Max','Netflix','Hulu','Apple TV+'], correct: 0 },
  ];

  // Pick a deterministic daily question
  const q = POOL[hashToIndex(today, POOL.length)];

  // Lock logic: only allow a correct completion once per day
  const lockDate = localStorage.getItem(KEYS.lock);
  const locked = lockDate === today;

  // Render
  renderStats();
  renderQuestion(q, locked);

  function renderStats(){
    const streak = Number(localStorage.getItem(KEYS.streak) || 0);
    const last = localStorage.getItem(KEYS.last);
    statsEl.textContent = `Streak: ${streak}${last === today ? ' • Completed today' : ''}`;
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
      fEl.textContent = 'Come back tomorrow for a new question.';
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
    fEl.textContent = isCorrect ? 'Correct! ✔' : `Nope — correct answer is "${q.choices[correctIdx]}".`;

    // Notify (optional)
    if (window.Notify){
      if (isCorrect) Notify.success('Trivia: +1 streak');
      else Notify.info('Trivia: try again tomorrow');
    }

    // Update streak/lock
    if (isCorrect){
      bumpStreak();
      localStorage.setItem(KEYS.lock, today);
      nBtn.hidden = false;
      nBtn.textContent = 'OK';
      nBtn.onclick = () => { /* placeholder for future: next module */ };
    } else {
      // wrong answer still locks for today
      localStorage.setItem(KEYS.lock, today);
      nBtn.hidden = false;
      nBtn.textContent = 'OK';
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

