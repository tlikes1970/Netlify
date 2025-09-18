/* scripts/app-state.js */
/* Idempotent app state + tiny event bus */

window.AppState = window.AppState || {
  activeTab: 'home',
  searchActive: false
};

window.AppEvents = window.AppEvents || {
  emit(name, detail) { document.dispatchEvent(new CustomEvent(name, { detail })); },
  on(name, handler, opts) { document.addEventListener(name, handler, opts); },
  off(name, handler) { document.removeEventListener(name, handler); }
};







