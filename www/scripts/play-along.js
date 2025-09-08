/* ========== play-along.js ==========
   Play Along Row - Trivia & FlickWord tiles
   Compact horizontal row with square tiles
   Hides if no content available
*/

(function(){
  'use strict';

  // Check if feature is enabled
  if (!window.FLAGS?.homeRowPlayAlong) {
    console.log('🎮 Play Along disabled by feature flag');
    return;
  }

  const section = document.getElementById('playalong-row');
  if (!section) {
    console.warn('🎮 Play Along row not found');
    return;
  }

  console.log('🎮 Initializing Play Along row...');

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPlayAlongRow);
  } else {
    renderPlayAlongRow();
  }

  /**
   * Process: Play Along Row Rendering
   * Purpose: Renders Trivia and FlickWord tiles if content is available
   * Data Source: fetchDailyTrivia() and fetchFlickWord() functions
   * Update Path: Modify tile content or add new tile types in this function
   * Dependencies: fetchDailyTrivia, fetchFlickWord, openTrivia, openFlickWord, openFeedbackOrComingSoon
   */
  async function renderPlayAlongRow() {
    if (!window.FLAGS?.homeRowPlayAlong) return;

    const section = document.getElementById('playalong-row');
    if (!section) return;

    const inner = section.querySelector('.row-inner');
    if (!inner) return;

    console.log('🎮 Fetching Play Along content...');

    // Fetch content (gracefully handle missing helpers)
    const [trivia, flickword] = await Promise.all([
      (typeof fetchDailyTrivia === 'function' ? fetchDailyTrivia() : Promise.resolve(null)),
      (typeof fetchFlickWord === 'function' ? fetchFlickWord() : Promise.resolve(null)),
    ]);

    inner.innerHTML = '';

        if (trivia) {
          console.log('🎮 Adding Trivia tile');
          const isPro = window.FLAGS?.proEnabled || false;
          const questionCount = isPro ? 50 : 10;
          const proBadge = isPro ? '<span style="color: #ffd700; font-size: 10px;">⭐ PRO</span>' : '';
          
          const t = document.createElement('div');
          t.className = 'tile tile-trivia';
          t.innerHTML = `<div class="icon" aria-hidden="true">
                           <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/>
                             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
                             <circle cx="12" cy="12" r="4" fill="white"/>
                             <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
                             <circle cx="12" cy="8" r="1" fill="currentColor"/>
                           </svg>
                         </div>
                         <div class="label">Daily Trivia ${proBadge}</div>
                         <div class="tile-stats" style="font-size: 12px; color: var(--text-secondary, #666); margin-top: 4px;">
                           🔥 ${trivia.streak || 0} streak • ${questionCount} questions
                         </div>`;
          t.addEventListener('click', () => {
            console.log('🎮 Trivia tile clicked');
            openTriviaModal(trivia);
          });
          inner.appendChild(t);
        }

        if (flickword) {
          console.log('🎮 Adding FlickWord tile');
          const f = document.createElement('div');
          f.className = 'tile tile-flickword';
          f.innerHTML = `<div class="icon" aria-hidden="true">
                           <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <rect x="2" y="3" width="20" height="14" rx="2" ry="2" fill="currentColor" opacity="0.1"/>
                             <rect x="2" y="3" width="20" height="14" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
                             <path d="M7 21l5-5 5 5" stroke="currentColor" stroke-width="2" fill="none"/>
                             <circle cx="12" cy="10" r="3" fill="currentColor"/>
                             <path d="M8 14l8 0" stroke="currentColor" stroke-width="2"/>
                             <rect x="4" y="5" width="16" height="2" fill="currentColor" opacity="0.3"/>
                             <rect x="4" y="8" width="12" height="1" fill="currentColor" opacity="0.3"/>
                             <rect x="4" y="10" width="14" height="1" fill="currentColor" opacity="0.3"/>
                           </svg>
                         </div>
                         <div class="label">FlickWord</div>`;
          f.addEventListener('click', () => {
            console.log('🎮 FlickWord tile clicked');
            openFlickWordModal(flickword);
          });
          inner.appendChild(f);
        }

    // Hide if nothing to show
    if (!inner.children.length) {
      console.log('🎮 No content available, hiding Play Along row');
      section.remove();
    } else {
      console.log(`✅ Play Along row rendered with ${inner.children.length} tile(s)`);
    }
  }

  // Enhanced trivia system with all standalone functionality (except daily lock)
  const TRIVIA_KEYS = {
    streak: 'flicklet:trivia:v1:streak',
    last: 'flicklet:trivia:v1:lastDate',
    lock: 'flicklet:trivia:v1:lockDate'
  };

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
  let usedQuestions = new Set(); // Track questions used in current session

  // Fetch trivia questions from API
  async function fetchTriviaQuestions(lang = 'en') {
    const today = new Date().toISOString().split('T')[0];
    
    // Return cached questions if we have them for today
    if (triviaCache && lastFetchDate === today) {
      console.log('🎮 Using cached trivia questions');
      return triviaCache;
    }

    // Check if Pro is enabled
    const isPro = window.FLAGS?.proEnabled || false;
    const questionCount = isPro ? 50 : 10;
    
    console.log(`🎮 Fetching ${questionCount} trivia questions (${isPro ? 'Pro' : 'Free'} mode)...`);

    try {
      const response = await fetch(`${TRIVIA_API_BASE}?amount=${questionCount}&category=11&difficulty=medium&type=multiple&encode=url3986`);
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.response_code !== 0) {
        throw new Error(`API error: ${data.response_code}`);
      }
      
      // Transform API data to our format
      const questions = data.results.map((q, index) => {
        const correctAnswer = decodeURIComponent(q.correct_answer);
        const incorrectAnswers = q.incorrect_answers.map(a => decodeURIComponent(a));
        
        // Create choices array with correct answer first
        const choices = [correctAnswer, ...incorrectAnswers];
        
        // Shuffle the choices array
        for (let i = choices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        
        // Find the new index of the correct answer after shuffling
        const correctIndex = choices.indexOf(correctAnswer);
        
        return {
          id: `api_${index}`,
          q: decodeURIComponent(q.question),
          choices: choices,
          correct: correctIndex
        };
      });
      
      triviaCache = questions;
      lastFetchDate = today;
      
      console.log('🎮 Fetched and cached trivia questions:', questions.length);
      return questions;
      
    } catch (error) {
      console.warn('🎮 API fetch failed, using fallback:', error);
      return FALLBACK_POOL;
    }
  }

  // Hash function for consistent daily question selection
  function hashToIndex(dateStr, max) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      const char = dateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % max;
  }

  // Get current language
  function getCurrentLanguage() {
    return (typeof window.FlickletApp?.appData?.settings?.lang !== 'undefined' ? 
            window.FlickletApp?.appData?.settings?.lang : 
            window.FlickletApp?.appData?.settings?.lang) || 
           (typeof window.FlickletApp?.appData?.settings?.lang !== 'undefined' ? 
            window.FlickletApp?.appData?.settings?.lang : 
            window.FlickletApp?.appData?.settings?.lang) || 
           'en';
  }

  // Streak tracking functions
  function getCurrentStreak() {
    return Number(localStorage.getItem(TRIVIA_KEYS.streak) || 0);
  }

  function updateStreak(isCorrect) {
    if (!isCorrect) {
      // Reset streak on wrong answer
      localStorage.setItem(TRIVIA_KEYS.streak, '0');
      return 0;
    }
    
    // Increment streak on correct answer
    const currentStreak = getCurrentStreak();
    const newStreak = currentStreak + 1;
    localStorage.setItem(TRIVIA_KEYS.streak, String(newStreak));
    localStorage.setItem(TRIVIA_KEYS.last, new Date().toISOString().split('T')[0]);
    return newStreak;
  }

  // Connect to the enhanced trivia system
  window.fetchDailyTrivia = async function() {
    console.log('🎮 fetchDailyTrivia using enhanced trivia system');
    
    try {
      const lang = getCurrentLanguage();
      const questions = await fetchTriviaQuestions(lang);
      
      // Find a question that hasn't been used in this session
      let availableQuestions = questions.filter(q => !usedQuestions.has(q.id));
      
      // If all questions have been used, reset the used set and use all questions
      if (availableQuestions.length === 0) {
        console.log('🎮 All questions used, resetting session');
        usedQuestions.clear();
        availableQuestions = questions;
      }
      
      // Use random selection from available questions
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const q = availableQuestions[randomIndex];
      
      // Mark this question as used
      usedQuestions.add(q.id);

      return {
        id: q.id,
        question: q.q,
        options: q.choices,
        correct: q.correct,
        source: 'enhanced_system',
        streak: getCurrentStreak()
      };
    } catch (error) {
      console.error('🎮 Error in fetchDailyTrivia:', error);
      return getFallbackTrivia();
    }
  };
  
  function getFallbackTrivia() {
    const fallbackQuestions = [
      {
        id: 'fallback_1',
        question: 'Which network originally aired "Archer"?',
        options: ['HBO', 'FX', 'AMC', 'Paramount+'],
        correct: 1, // FX is correct
        source: 'fallback'
      },
      {
        id: 'fallback_2', 
        question: '"Alien: Earth" is a spin-off in which franchise?',
        options: ['Predator', 'Alien', 'Star Trek', 'The Expanse'],
        correct: 1, // Alien is correct
        source: 'fallback'
      },
      {
        id: 'fallback_3',
        question: 'Sherlock (2010) starred Benedict Cumberbatch and…',
        options: ['Tom Hiddleston', 'Martin Freeman', 'David Tennant', 'Matt Smith'],
        correct: 1, // Martin Freeman is correct
        source: 'fallback'
      },
      {
        id: 'fallback_4',
        question: '"House of the Dragon" streams primarily on…',
        options: ['HBO Max', 'Netflix', 'Hulu', 'Apple TV+'],
        correct: 0, // HBO Max is correct
        source: 'fallback'
      },
      {
        id: 'fallback_5',
        question: 'What is Dorothy\'s dog\'s name in "The Wizard of Oz"?',
        options: ['Toto', 'Rex', 'Buddy', 'Max'],
        correct: 0, // Toto is correct
        source: 'fallback'
      }
    ];
    
    // Find a fallback question that hasn't been used in this session
    let availableFallbacks = fallbackQuestions.filter(q => !usedQuestions.has(q.id));
    
    // If all fallback questions have been used, reset the used set
    if (availableFallbacks.length === 0) {
      console.log('🎮 All fallback questions used, resetting session');
      usedQuestions.clear();
      availableFallbacks = fallbackQuestions;
    }
    
    const randomIndex = Math.floor(Math.random() * availableFallbacks.length);
    const selected = availableFallbacks[randomIndex];
    
    // Shuffle the options for fallback questions too
    const correctAnswer = selected.options[selected.correct];
    const incorrectAnswers = selected.options.filter((_, index) => index !== selected.correct);
    
    // Create shuffled choices
    const choices = [correctAnswer, ...incorrectAnswers];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    
    // Find the new index of the correct answer after shuffling
    const correctIndex = choices.indexOf(correctAnswer);
    
    // Mark this question as used
    usedQuestions.add(selected.id);
    
    return {
      id: selected.id,
      question: selected.question,
      options: choices,
      correct: correctIndex,
      source: 'fallback',
      streak: getCurrentStreak()
    };
  }

  window.fetchFlickWord = async function() {
    console.log('🎮 fetchFlickWord returning test data');
    return {
      id: 'test-flickword-1',
      word: 'CINEMA',
      hint: 'The art of making motion pictures',
      definition: 'A movie theater or the art of making motion pictures',
      difficulty: 'Medium',
      category: 'Entertainment'
    };
  };

  /**
   * Process: Interactive Trivia Modal
   * Purpose: Display interactive trivia questions with real-time feedback and next question functionality
   * Data Source: OpenTriviaDB API or fallback questions from fetchDailyTrivia()
   * Update Path: Modify modal HTML structure or interaction logic in this function
   * Dependencies: window.openModal, fetchDailyTrivia, trivia modal CSS styles
   */
  function openTriviaModal(triviaData) {
    if (typeof window.openModal !== 'function') {
      console.warn('🎮 No modal handler available');
      return;
    }
    
    console.log('🎮 Opening trivia modal with data:', triviaData);
    
    // Create interactive trivia HTML
    const triviaHtml = `
      <div class="trivia-modal-content" style="text-align: left; max-width: 500px;">
        <div class="trivia-question" style="font-weight: 600; margin-bottom: 20px; font-size: 16px; line-height: 1.4;">
          ${triviaData.question}
        </div>
        <div class="trivia-choices" style="display: grid; gap: 8px; margin-bottom: 20px;">
          ${triviaData.options.map((option, index) => `
            <button class="trivia-choice-btn" 
                    data-index="${index}" 
                    data-correct="${index === triviaData.correct}"
                    style="padding: 12px 16px; border: 2px solid var(--border, #ddd); border-radius: 8px; background: var(--card, #fff); color: var(--text, #333); cursor: pointer; text-align: left; transition: all 0.2s; font-size: 14px;">
              ${option}
            </button>
          `).join('')}
        </div>
        <div class="trivia-feedback" style="min-height: 24px; font-weight: 500; text-align: center; margin-bottom: 16px;"></div>
        <div class="trivia-actions" style="display: flex; gap: 8px; justify-content: center;">
          <button id="trivia-close-btn" class="btn secondary" style="display: none;">Close</button>
          <button id="trivia-next-btn" class="btn primary" style="display: none;">Next Question</button>
        </div>
        <div class="trivia-stats" style="font-size: 12px; color: var(--text-secondary, #666); text-align: center; margin-top: 12px;">
          Source: ${triviaData.source === 'enhanced_system' ? 'Enhanced Trivia' : 'Flicklet'} 
          • Streak: ${triviaData.streak || 0}
          • ${window.FLAGS?.proEnabled ? '50 questions (Pro)' : '10 questions (Free)'}
        </div>
      </div>
    `;
    
    console.log('🎮 Creating trivia modal with HTML:', triviaHtml.substring(0, 100) + '...');
    const modal = window.openModal('🧠 Daily Trivia', triviaHtml, 'trivia-modal');
    
    if (!modal) {
      console.error('🎮 Failed to create trivia modal - openModal returned:', modal);
      return;
    }
    
    console.log('🎮 Trivia modal created successfully:', modal);
    
    // Add interactive functionality
    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) {
      console.error('🎮 Modal body not found in modal:', modal);
      return;
    }
    
    const choiceBtns = modalBody.querySelectorAll('.trivia-choice-btn');
    const feedbackEl = modalBody.querySelector('.trivia-feedback');
    const closeBtn = modalBody.querySelector('#trivia-close-btn');
    const nextBtn = modalBody.querySelector('#trivia-next-btn');
    
    console.log('🎮 Modal elements found:', {
      modalBody: !!modalBody,
      choiceBtns: choiceBtns.length,
      feedbackEl: !!feedbackEl,
      closeBtn: !!closeBtn,
      nextBtn: !!nextBtn
    });
    
    let answered = false;
    
    choiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        
        answered = true;
        const isCorrect = btn.dataset.correct === 'true';
        const correctIndex = triviaData.correct;
        
        // Disable all buttons
        choiceBtns.forEach(b => {
          b.disabled = true;
          b.style.cursor = 'not-allowed';
        });
        
        // Highlight the selected answer
        btn.style.background = isCorrect ? '#0f5e20' : '#7a0010';
        btn.style.color = 'white';
        btn.style.borderColor = isCorrect ? '#0f5e20' : '#7a0010';
        
        // Highlight correct answer if wrong
        if (!isCorrect) {
          choiceBtns[correctIndex].style.background = '#0f5e20';
          choiceBtns[correctIndex].style.color = 'white';
          choiceBtns[correctIndex].style.borderColor = '#0f5e20';
        }
        
        // Update streak
        const newStreak = updateStreak(isCorrect);
        
        // Show feedback
        if (isCorrect) {
          feedbackEl.textContent = `✅ Correct! Well done! Streak: ${newStreak}`;
          feedbackEl.style.color = '#0f5e20';
        } else {
          feedbackEl.textContent = `❌ Not quite. The correct answer is "${triviaData.options[correctIndex]}". Streak reset to 0.`;
          feedbackEl.style.color = '#7a0010';
        }
        
        // Show action buttons
        closeBtn.style.display = 'inline-block';
        nextBtn.style.display = 'inline-block';
        
        // Update the stats display in the modal
        const statsEl = modalBody.querySelector('.trivia-stats');
        if (statsEl) {
          const isPro = window.FLAGS?.proEnabled || false;
          statsEl.innerHTML = `Source: ${triviaData.source === 'enhanced_system' ? 'Enhanced Trivia' : 'Flicklet'} • Streak: ${newStreak} • ${isPro ? '50 questions (Pro)' : '10 questions (Free)'}`;
        }
        
        console.log('🎮 Trivia answered:', isCorrect ? 'correct' : 'incorrect', 'New streak:', newStreak);
      });
    });
    
    // Close button
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    // Next question button
    nextBtn.addEventListener('click', async () => {
      modal.remove();
      // Refresh the Play Along row to update tile stats
      try {
        await renderPlayAlongRow();
      } catch (error) {
        console.warn('🎮 Error refreshing Play Along row:', error);
      }
      
      // Fetch a new question and open modal again
      try {
        const newTrivia = await window.fetchDailyTrivia();
        openTriviaModal(newTrivia);
      } catch (error) {
        console.error('🎮 Error fetching next trivia question:', error);
        // Fallback to a simple message
        if (typeof window.openModal === 'function') {
          window.openModal('Trivia Complete', '<p>Thanks for playing! Check back tomorrow for more questions.</p>', 'trivia-complete');
        }
      }
    });
  }

  /**
   * Process: FlickWord Modal (Wordle Clone)
   * Purpose: Display the actual FlickWord Wordle game in an iframe modal
   * Data Source: features/flickword.html
   * Update Path: Modify iframe source or modal behavior in this function
   * Dependencies: window.openModal, features/flickword.html
   */
  function openFlickWordModal(flickwordData) {
    if (typeof window.openModal !== 'function') {
      console.warn('🎮 No modal handler available');
      return;
    }
    
    console.log('🎮 Opening FlickWord Wordle game modal');
    
    // Create iframe modal HTML for the Wordle game
    const flickwordHtml = `
      <div class="flickword-modal-content" style="text-align: center; width: 100%; height: 100%; display: flex; flex-direction: column;">
        <div class="flickword-header" style="margin-bottom: 12px; flex-shrink: 0;">
          <h3 style="color: var(--primary, #007bff); margin-bottom: 4px;">🎯 FlickWord</h3>
          <div style="font-size: 14px; color: var(--text-secondary, #666);">
            Guess the 5-letter word in 6 tries
          </div>
        </div>
        
        <div class="flickword-game-container" style="flex: 1; width: 100%; border: 2px solid var(--border, #ddd); border-radius: 12px; overflow: hidden; min-height: 0;">
          <iframe 
            id="flickword-iframe" 
            src="features/flickword.html" 
            style="width: 100%; height: 100%; border: none; display: block;"
            title="FlickWord Game"
            sandbox="allow-scripts allow-same-origin"
          ></iframe>
        </div>
        
        <div class="flickword-modal-actions" style="display: flex; gap: 8px; justify-content: center; margin-top: 12px; flex-shrink: 0;">
          <button id="flickword-close" class="btn secondary">Close Game</button>
        </div>
      </div>
    `;
    
    console.log('🎮 Creating FlickWord iframe modal');
    const modal = window.openModal('🎯 FlickWord', flickwordHtml, 'flickword-modal');
    
    // Set custom dimensions for the FlickWord game modal
    if (modal) {
      const modalElement = modal.querySelector('.modal');
      if (modalElement) {
        modalElement.style.cssText = `
          position: relative !important;
          z-index: 100000 !important;
          pointer-events: auto !important;
          max-width: 90vw !important;
          max-height: 90vh !important;
          width: 600px !important;
          height: 700px !important;
          display: flex !important;
          flex-direction: column !important;
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important;
          overflow: hidden !important;
        `;
      }
    }
    
    if (!modal) {
      console.error('🎮 Failed to create FlickWord modal - openModal returned:', modal);
      return;
    }
    
    console.log('🎮 FlickWord modal created successfully:', modal);
    
    // Add close functionality
    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) {
      console.error('🎮 Modal body not found in FlickWord modal:', modal);
      return;
    }
    
    const closeBtn = modalBody.querySelector('#flickword-close');
    const iframe = modalBody.querySelector('#flickword-iframe');
    
    // Close button
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    // Listen for messages from the iframe (game results)
    window.addEventListener('message', function(event) {
      // Check if message is from our FlickWord game
      if (event.data && event.data.type === 'flickword:result') {
        console.log('🎮 FlickWord game result:', event.data);
        
        // You could show a notification or update stats here
        if (event.data.won) {
          console.log(`🎉 FlickWord won in ${event.data.guesses} guesses!`);
        } else {
          console.log(`😞 FlickWord lost. The word was: ${event.data.target}`);
        }
      } else if (event.data && event.data.type === 'flickword:close') {
        console.log('🎮 FlickWord game requested close');
        modal.remove();
      }
    });
    
    // Handle iframe load
    iframe.addEventListener('load', () => {
      console.log('🎮 FlickWord iframe loaded successfully');
    });
    
    iframe.addEventListener('error', (error) => {
      console.error('🎮 FlickWord iframe failed to load:', error);
    });
  }


  // Expose render function globally for manual triggering
  window.renderPlayAlongRow = renderPlayAlongRow;

})();
