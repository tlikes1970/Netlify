// Feature flags and safety guard for Flicklet
window.FLAGS = Object.assign({
  proEnabled: false,                          // flip when you want to demo Pro
  notifEngineEnabled: true,                   // core notifications (free)
  notifAdvancedEnabled: false,                // PRO
  statsEnabled: true,
  skeletonsEnabled: true,
  flickwordModalEnabled: true,                // optional iframe modal
  frontSpotlightEnabled: true,                // replaces horoscope
  mobilePolishEnabled: true,                  // mobile layout polish v1
  notesChipEnabled: true,                     // notes/tags chip on cards
}, window.FLAGS || {});

window.guard = (cond, fn) => { 
  try { 
    if (cond) fn(); 
  } catch(e) { 
    console.error(e); 
  } 
};

console.log("%cFlicklet safe mode loaded.", "padding:2px 6px;border:1px solid #000");
