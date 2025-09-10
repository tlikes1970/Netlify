/* ============== Bootstrap (Cleaned) ============== */

document.addEventListener('DOMContentLoaded', () => {
  // Hide any stuck modals first
  const modals = document.querySelectorAll('.modal-backdrop');
  modals.forEach(modal => {
    modal.style.display = 'none';
    modal.classList.remove('modal-backdrop');
  });
  
  // DISABLED: Dark mode event listener - now handled in inline-script-03.js
  // const darkModeToggle = document.getElementById('darkModeToggle');
  // if (darkModeToggle) {
  //   darkModeToggle.addEventListener('click', () => {
  //     if (typeof toggleDarkMode === 'function') {
  //       toggleDarkMode();
  //     }
  //   });
  // }
  
  // Initialize the app
  if (window.FlickletApp && typeof window.FlickletApp.init === 'function') {
    window.FlickletApp.init();
  } else {
    console.error('FlickletApp.init missing');
  }
});
