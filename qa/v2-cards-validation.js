// qa/v2-cards-validation.js
// Comprehensive V2 Cards system validation

(async () => {
  const out = { ok: true, notes: [], errors: [] };
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  console.log('[V2 CARDS VALIDATION] Starting comprehensive validation...');

  // 1) Feature Flags Check
  console.log('[V2 CARDS] Checking feature flags...');
  const requiredFlags = [
    'cards_v2',
    'homeRowCurrentlyWatching', 
    'homeRowNextUp',
    'homeRowCurated',
    'homeRowSpotlight',
    'community_games_enabled'
  ];

  const missingFlags = [];
  requiredFlags.forEach(flag => {
    if (!window.FLAGS?.[flag]) {
      missingFlags.push(flag);
    }
  });

  if (missingFlags.length > 0) {
    out.ok = false;
    out.errors.push(`Missing feature flags: ${missingFlags.join(', ')}`);
  } else {
    out.notes.push('✅ All required feature flags enabled');
  }

  // 2) V2 Cards Renderers Check
  console.log('[V2 CARDS] Checking renderer availability...');
  const requiredRenderers = [
    'renderCardV2',
    'renderCurrentlyWatchingCardV2', 
    'renderCuratedCardV2',
    'renderSearchCardV2'
  ];

  const missingRenderers = [];
  requiredRenderers.forEach(renderer => {
    if (typeof window[renderer] !== 'function') {
      missingRenderers.push(renderer);
    }
  });

  if (missingRenderers.length > 0) {
    out.ok = false;
    out.errors.push(`Missing renderers: ${missingRenderers.join(', ')}`);
  } else {
    out.notes.push('✅ All V2 Cards renderers available');
  }

  // 3) Data Adapter Check
  console.log('[V2 CARDS] Checking data adapter...');
  if (typeof window.toCardProps !== 'function') {
    out.ok = false;
    out.errors.push('Missing toCardProps data adapter');
  } else {
    out.notes.push('✅ Data adapter (toCardProps) available');
  }

  // 4) Card Actions Check
  console.log('[V2 CARDS] Checking card actions...');
  if (!window.V2_ACTIONS) {
    out.ok = false;
    out.errors.push('Missing V2_ACTIONS system');
  } else {
    out.notes.push('✅ V2 Actions system available');
  }

  // 5) Home Sections Check
  console.log('[V2 CARDS] Checking home sections...');
  const homeSections = [
    'currentlyWatchingPreview',
    'up-next-row', 
    'curated-sections',
    'community-spotlight'
  ];

  const missingSections = [];
  homeSections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (!section) {
      missingSections.push(sectionId);
    }
  });

  if (missingSections.length > 0) {
    out.notes.push(`ℹ️ Some home sections not found: ${missingSections.join(', ')}`);
  } else {
    out.notes.push('✅ All home sections present');
  }

  // 6) Tab Sections Check
  console.log('[V2 CARDS] Checking tab sections...');
  const tabSections = [
    'homeSection',
    'watchingSection', 
    'wishlistSection',
    'watchedSection',
    'discoverSection',
    'settingsSection'
  ];

  const missingTabs = [];
  tabSections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (!section) {
      missingTabs.push(sectionId);
    }
  });

  if (missingTabs.length > 0) {
    out.ok = false;
    out.errors.push(`Missing tab sections: ${missingTabs.join(', ')}`);
  } else {
    out.notes.push('✅ All tab sections present');
  }

  // 7) Navigation Check
  console.log('[V2 CARDS] Checking navigation...');
  const nav = $('#navigation');
  if (!nav) {
    out.ok = false;
    out.errors.push('Navigation container not found');
  } else {
    const tabs = nav.querySelectorAll('[role="tab"]');
    if (tabs.length < 5) {
      out.ok = false;
      out.errors.push(`Insufficient tabs found: ${tabs.length}/5`);
    } else {
      out.notes.push(`✅ Navigation with ${tabs.length} tabs found`);
    }
  }

  // 8) Search System Check
  console.log('[V2 CARDS] Checking search system...');
  const searchInput = $('#search-input, input[type="search"]');
  if (!searchInput) {
    out.notes.push('ℹ️ Search input not found (may be disabled)');
  } else {
    out.notes.push('✅ Search input found');
  }

  // 9) CSS Classes Check
  console.log('[V2 CARDS] Checking CSS classes...');
  const body = document.body;
  if (!body.classList.contains('layout-mobile-fix')) {
    out.notes.push('ℹ️ layout-mobile-fix class not applied to body');
  } else {
    out.notes.push('✅ layout-mobile-fix class applied');
  }

  // 10) Runtime Test - Try to render a test card
  console.log('[V2 CARDS] Testing card rendering...');
  try {
    const testItem = {
      id: 'test-123',
      title: 'Test Movie',
      media_type: 'movie',
      poster_path: '/test.jpg',
      overview: 'Test overview'
    };

    if (window.renderCardV2) {
      const container = document.createElement('div');
      const testCard = window.renderCardV2(container, testItem, { listType: 'test', context: 'test' });
      if (testCard) {
        out.notes.push('✅ Test card rendering successful');
      } else {
        out.ok = false;
        out.errors.push('Test card rendering returned null');
      }
    } else {
      out.ok = false;
      out.errors.push('renderCardV2 not available for testing');
    }
  } catch (error) {
    out.ok = false;
    out.errors.push(`Test card rendering failed: ${error.message}`);
  }

  // Summary
  console.log('[V2 CARDS VALIDATION]', out.ok ? '✅ PASS' : '❌ FAIL');
  console.log('[V2 CARDS VALIDATION] Notes:', out.notes);
  if (out.errors.length > 0) {
    console.log('[V2 CARDS VALIDATION] Errors:', out.errors);
  }
  
  // Return result for external use
  window.v2CardsValidationResult = out;
  return out;
})();
