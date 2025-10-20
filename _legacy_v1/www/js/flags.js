// Feature flags and safety guard for Flicklet - v28.82
// Cleaned up - removed zombie flags, kept only actively used ones
window.FLAGS = Object.assign(
  {
    // Core system flags
    proEnabled: false, // Pro is off by default unless user account says otherwise
    notifEngineEnabled: true, // core notifications (free)
    notifAdvancedEnabled: true, // PRO
    statsEnabled: true,
    skeletonsEnabled: true,
    
    // UI/UX flags
    mobilePolishEnabled: true, // mobile layout polish
    notesChipEnabled: true, // notes/tags chip on cards
    shareModalSanityEnabled: true, // share modal a11y + scroll lock + focus trap
    condensedModeFeatureEnabled: true, // condensed mode hardening
    safeAreasSanityEnabled: true, // sticky & safe-areas sanity
    a11yPolishEnabled: true, // tap targets & a11y polish
    
    // Feature flags
    themePacksEnabled: true, // theme packs
    providersEnabled: true, // where to watch providers
    extrasEnabled: true, // extras/outtakes discovery
    triviaEnabled: true, // per-card trivia chips
    seriesOrganizerEnabled: true, // card declutter (progressive disclosure)
    
    // Card system
    cards_v2: true, // Card v2 system for personalized rows
    
    // Home row flags (actively used)
    homeRowCurrentlyWatching: true, // Currently Watching Preview row
    homeRowNextUp: true, // Next Up This Week row
    homeRowCurated: true, // Curated Sections row
    homeRowSpotlight: true, // Community Spotlight row
    homeRowPlayAlong: true, // Play Along row (Trivia & FlickWord)
    homeRowFeedback: true, // Feedback Tile row
    
    // Modal flags
    flickwordModalEnabled: true, // optional iframe modal
    
    // Community features
    communityPlayer: true, // Community player placeholder
  },
  window.FLAGS || {},
);

window.guard = (cond, fn) => {
  try {
    if (cond) fn();
  } catch (e) {
    console.error(e);
  }
};

console.log('%cFlicklet safe mode loaded.', 'padding:2px 6px;border:1px solid #000');
