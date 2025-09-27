/**
 * Search Sticky Layout Helper
 * Purpose: Sync search container height and toggle has-search class for proper sticky positioning
 * Data Source: DOM visibility and getBoundingClientRect measurements
 * Update Path: CSS custom property --search-h and appRoot.has-search class
 * Dependencies: #appRoot, #search-container.top-search, CSS sticky layout
 */
(function(){
  const root   = document.querySelector('#appRoot');
  const search = document.querySelector('#appRoot > #search-container.top-search, #appRoot > .top-search');

  function visible(element){
    if (!element) return false;
    const cs = getComputedStyle(element);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = element.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function apply(){
    if (!root) return;
    const on = visible(search);
    if (on) {
      const h = Math.round(search.getBoundingClientRect().height);
      root.classList.add('has-search');
      root.style.setProperty('--search-h', h + 'px');
    } else {
      root.classList.remove('has-search');
      root.style.removeProperty('--search-h');
    }
  }

  document.addEventListener('DOMContentLoaded', apply);
  window.addEventListener('load', apply);
  window.addEventListener('resize', apply);

  /* If app code toggles the search region, emit one of these events */
  for (const eventName of ['app:view:changed','search:toggle','search:updated']) {
    window.addEventListener(eventName, apply);
  }
})();
