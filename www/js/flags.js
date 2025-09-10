// Feature flags and safety guard for Flicklet
window.FLAGS = Object.assign({
  proEnabled: true,                           // flip when you want to demo Pro
  notifEngineEnabled: true,                   // core notifications (free)
  notifAdvancedEnabled: true,                 // PRO
  statsEnabled: true,
  skeletonsEnabled: true,
  flickwordModalEnabled: true,                // optional iframe modal
  upcomingEpisodesEnabled: false,             // Tonight On - upcoming episodes section (disabled)
  mobilePolishEnabled: true,                  // mobile layout polish
  notesChipEnabled: true,                     // notes/tags chip on cards
  shareModalSanityEnabled: true,              // share modal a11y + scroll lock + focus trap
  condensedModeFeatureEnabled: true,          // condensed mode hardening
  safeAreasSanityEnabled: true,               // sticky & safe-areas sanity
  a11yPolishEnabled: true,                    // tap targets & a11y polish
  themePacksEnabled: true,                    // theme packs (T0)
  providersEnabled: true,                     // where to watch providers
  extrasEnabled: true,                        // extras/outtakes discovery
  cards_v2: true,                             // Card v2 system for personalized rows
            playlistsEnabled: false,                    // curated spotlight video (disabled)
          playlistsProEnabled: true,                  // curated rows (PRO)
          triviaEnabled: true,                        // per-card trivia chips
          flickwordBoostEnabled: true,                // FlickFact panel on Home
          seriesOrganizerEnabled: true,               // card declutter (progressive disclosure)
          homeRowCurrentlyWatching: true,             // Currently Watching Preview row
          homeRowNextUp: true,                        // Next Up This Week row
          homeRowSpotlight: true,                     // Community Spotlight row
          homeRowPlayAlong: true,                     // Play Along row (Trivia & FlickWord)
          homeRowFeedback: true,                      // Feedback Tile row
}, window.FLAGS || {});

window.guard = (cond, fn) => { 
  try { 
    if (cond) fn(); 
  } catch(e) { 
    console.error(e); 
  } 
};

console.log("%cFlicklet safe mode loaded.", "padding:2px 6px;border:1px solid #000");
