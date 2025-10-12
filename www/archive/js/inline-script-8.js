// FlickWord Modal Functions
function openFlickWordModal() {
  console.log('🎯 Opening FlickWord modal');
  const modal = document.getElementById('flickwordModal');
  const frame = document.getElementById('flickwordFrame');

  if (modal && frame) {
    // Set today's date for the game
    const today = new Date().toISOString().split('T')[0];
    frame.src = `features/flickword-v2.html?date=${today}`;
    modal.style.display = 'block';

    // Focus management
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }
}

function closeFlickWordModal() {
  console.log('🎯 Closing FlickWord modal');
  const modal = document.getElementById('flickwordModal');
  const frame = document.getElementById('flickwordFrame');

  if (modal) {
    modal.style.display = 'none';
    if (frame) frame.src = '';
  }
}

// Update FlickWord teaser stats
function updateFlickWordStats() {
  const streakEl = document.querySelector('.flickword-teaser .streak');
  const bestEl = document.querySelector('.flickword-teaser .best');

  if (streakEl && bestEl) {
    const stats = JSON.parse(localStorage.getItem('flickword:stats') || '{}');
    streakEl.textContent = `Streak: ${stats.streak || 0}`;
    bestEl.textContent = `Best: ${stats.best || 0}`;
  }
}

// Initialize FlickWord teaser
function initFlickWordTeaser() {
  console.log('🎯 Initializing FlickWord teaser');
  updateFlickWordStats();

  // Listen for game results to update stats
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'flickword:result') {
      console.log('🎯 FlickWord result received:', event.data);
      updateFlickWordStats();
    }
  });
}

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFlickWordTeaser);
} else {
  initFlickWordTeaser();
}
