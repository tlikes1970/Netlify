/**
 * Home Verification Utilities - Dev Only
 * 
 * These utilities are only available in development builds and help verify
 * Home page layout, frame structure, and rail normalization.
 * 
 * Usage:
 * - verifyHomeFrames() - Check frame structure and gutters
 * - verifyRailNormalization() - Check rail grid layout and properties
 * - forceHomeVisible(enable) - Toggle diagnostic visibility for hidden sections
 * - HOME_CARD_MATCHERS - Selector constants for card detection
 */

// Dev flag gating - only expose in development
if (window.__DEV__ || location.hostname === 'localhost') {
  
  /**
   * Card matcher selectors for Home verification
   * Used by verification functions to detect cards and rails
   */
  export const HOME_CARD_MATCHERS = {
    // Card selectors (in order of specificity)
    cardsList: [
      '.cw-card.v2.preview-variant.preview-card',
      '.card.v2.v2-home-nextup', 
      '.card'
    ],
    
    // Rail selectors (deepest rails only)
    railsList: [
      '.preview-row-container',
      '.preview-row-scroll', 
      '.row-inner',
      '#currentlyWatchingScroll',
      '.curated-row'
    ],
    
    // Group IDs
    groupIds: [
      'group-1-your-shows',
      'group-2-community', 
      'group-3-for-you',
      'group-4-theaters',
      'group-5-feedback'
    ],
    
    // Panel candidates (carry gutters)
    panelCandidates: [
      '.home-preview-row',
      '.section-content', 
      '.card-container',
      'section',
      'div:not(.group-header)'
    ]
  };

  /**
   * Helper: Pick the first visible panel from candidates
   * @param {Element} groupEl - The group element to search within
   * @returns {Element|null} The first visible panel or null
   */
  function pickPanel(groupEl) {
    for (const selector of HOME_CARD_MATCHERS.panelCandidates) {
      const panel = groupEl.querySelector(selector);
      if (panel && panel.offsetParent !== null) {
        return panel;
      }
    }
    return null;
  }

  /**
   * Helper: Check if element contains any cards
   * @param {Element} el - Element to check
   * @returns {boolean} True if element contains cards
   */
  function containsCardDesc(el) {
    return HOME_CARD_MATCHERS.cardsList.some(selector => 
      el.querySelector(selector) !== null
    );
  }

  /**
   * Helper: Pick deepest rails that contain cards and aren't ancestors of other rail-with-cards
   * @param {Element} panelEl - The panel element to search within
   * @returns {Element[]} Array of deepest rail elements
   */
  function pickDeepestRails(panelEl) {
    const allRails = [];
    
    // Find all rails that contain cards
    HOME_CARD_MATCHERS.railsList.forEach(selector => {
      const rails = panelEl.querySelectorAll(selector);
      rails.forEach(rail => {
        if (containsCardDesc(rail)) {
          allRails.push(rail);
        }
      });
    });
    
    // Filter out rails that are ancestors of other rail-with-cards
    const deepestRails = allRails.filter(rail => {
      return !allRails.some(otherRail => 
        otherRail !== rail && otherRail.contains(rail)
      );
    });
    
    return deepestRails;
  }

  /**
   * Verify Home frame structure and gutter behavior
   * 
   * Checks:
   * - Groups have width: 100%, padding: 0
   * - Chosen panels have padding: 32px (single gutter)
   * - Ignores generic inner divs
   * 
   * @returns {Object} Results with pass/fail status and details
   */
  export function verifyHomeFrames() {
    console.log('🔍 Verifying Home frame structure...');
    
    const results = {
      sections: [],
      totalSections: 0,
      sectionsPassed: 0,
      issues: []
    };
    
    // Check each group
    HOME_CARD_MATCHERS.groupIds.forEach(groupId => {
      const group = document.getElementById(groupId);
      if (!group) {
        results.issues.push(`❌ Group ${groupId} not found`);
        return;
      }
      
      results.totalSections++;
      
      const groupComputed = getComputedStyle(group);
      const groupRect = group.getBoundingClientRect();
      
      // Check group properties
      const groupChecks = {
        width: groupComputed.width === '100%' || groupRect.width > 0,
        paddingLeft: groupComputed.paddingLeft === '0px',
        paddingRight: groupComputed.paddingRight === '0px',
        hasWidth: groupRect.width > 0
      };
      
      const groupPassed = Object.values(groupChecks).every(Boolean);
      
      // Pick the panel for this group
      const panel = pickPanel(group);
      let panelPassed = false;
      let gutterOK = 'N/A';
      
      if (panel) {
        const panelComputed = getComputedStyle(panel);
        const panelRect = panel.getBoundingClientRect();
        
        const panelChecks = {
          paddingLeft: panelComputed.paddingLeft === '32px',
          paddingRight: panelComputed.paddingRight === '32px',
          hasWidth: panelRect.width > 0
        };
        
        panelPassed = Object.values(panelChecks).every(Boolean);
        gutterOK = panelPassed ? 'PASS' : 'FAIL';
      } else {
        gutterOK = 'N/A';
      }
      
      const sectionPassed = groupPassed && (panel ? panelPassed : true);
      if (sectionPassed) {
        results.sectionsPassed++;
      }
      
      // Store section summary
      results.sections.push({
        groupId,
        groupOK: groupPassed ? 'PASS' : 'FAIL',
        gutterOK,
        panel: panel ? panel.tagName.toLowerCase() + panel.className : 'none'
      });
      
      // Log issues
      if (!groupPassed) {
        const failures = Object.entries(groupChecks)
          .filter(([key, value]) => !value)
          .map(([key, value]) => `${key}=${value}`);
        results.issues.push(`❌ Group ${groupId}: ${failures.join(', ')}`);
      }
      
      if (panel && !panelPassed) {
        const panelComputed = getComputedStyle(panel);
        const failures = [
          `paddingLeft=${panelComputed.paddingLeft}`,
          `paddingRight=${panelComputed.paddingRight}`
        ].filter(f => !f.includes('32px'));
        results.issues.push(`❌ Panel ${groupId}: ${failures.join(', ')}`);
      }
    });
    
    // Compact per-section summary
    console.log('\n📊 Home Frame Verification Results:');
    console.table(results.sections);
    
    if (results.issues.length > 0) {
      console.log('\n❌ Issues found:');
      results.issues.forEach(issue => console.log(issue));
    } else {
      console.log('\n✅ All Home frames verified successfully!');
    }
    
    const overallPass = results.sectionsPassed === results.totalSections && results.issues.length === 0;
    console.log(`\n${overallPass ? '✅' : '❌'} Home frames: ${overallPass ? 'PASS' : 'FAIL'}`);
    
    return results;
  }

  /**
   * Verify rail normalization (deepest rails only)
   * 
   * Checks:
   * - Deepest rails use grid with column flow
   * - Zero rail padding
   * - Proper overflow behavior
   * - Cards have snap alignment
   * 
   * @returns {Object} Results with pass/fail status and details
   */
  export function verifyRailNormalization() {
    console.log('🔍 Verifying Home rail normalization...');
    
    const results = {
      sections: [],
      totalSections: 0,
      sectionsWithRails: 0,
      deepRailsChecked: 0,
      deepRailsPassed: 0,
      cardsWithSnap: 0,
      totalCards: 0,
      issues: []
    };
    
    // Check each group for deepest rails
    HOME_CARD_MATCHERS.groupIds.forEach(groupId => {
      const group = document.getElementById(groupId);
      if (!group) {
        results.issues.push(`❌ Group ${groupId} not found`);
        return;
      }
      
      results.totalSections++;
      
      // Pick the panel for this group
      const panel = pickPanel(group);
      if (!panel) {
        results.sections.push({
          groupId,
          deepRails: 0,
          deepRailsOK: 'N/A',
          cardsWithSnap: 0,
          totalCards: 0
        });
        return;
      }
      
      // Get deepest rails that contain cards
      const deepRails = pickDeepestRails(panel);
      const sectionDeepRails = deepRails.length;
      let sectionDeepRailsPassed = 0;
      
      if (sectionDeepRails > 0) {
        results.sectionsWithRails++;
      }
      
      // Check each deepest rail
      deepRails.forEach((rail, index) => {
        results.deepRailsChecked++;
        
        const computed = getComputedStyle(rail);
        const rect = rail.getBoundingClientRect();
        
        const checks = {
          display: computed.display.includes('grid'),
          gridFlow: computed.gridAutoFlow.includes('column'),
          paddingLeft: computed.paddingLeft === '0px',
          paddingRight: computed.paddingRight === '0px',
          overflowX: computed.overflowX === 'auto',
          overflowY: computed.overflowY === 'hidden',
          scrollSnap: computed.scrollSnapType.includes('inline'),
          hasWidth: rect.width > 0
        };
        
        const passed = Object.values(checks).every(Boolean);
        if (passed) {
          results.deepRailsPassed++;
          sectionDeepRailsPassed++;
        } else {
          const failures = Object.entries(checks)
            .filter(([key, value]) => !value)
            .map(([key, value]) => `${key}=${value}`);
          
          results.issues.push(
            `❌ ${groupId} deep rail[${index}]: ${failures.join(', ')}`
          );
        }
      });
      
      // Count cards with snap alignment in this section
      const sectionCards = panel.querySelectorAll(HOME_CARD_MATCHERS.cardsList.join(', '));
      let sectionCardsWithSnap = 0;
      
      sectionCards.forEach(card => {
        const computed = getComputedStyle(card);
        if (computed.scrollSnapAlign === 'start') {
          sectionCardsWithSnap++;
        }
      });
      
      results.cardsWithSnap += sectionCardsWithSnap;
      results.totalCards += sectionCards.length;
      
      // Store section summary
      results.sections.push({
        groupId,
        deepRails: sectionDeepRails,
        deepRailsOK: sectionDeepRails > 0 ? 
          (sectionDeepRailsPassed === sectionDeepRails ? 'PASS' : 'FAIL') : 'N/A',
        cardsWithSnap: sectionCardsWithSnap,
        totalCards: sectionCards.length
      });
    });
    
    // Compact per-section summary
    console.log('\n📊 Rail Normalization Results:');
    console.table(results.sections);
    
    // Deep rail details
    if (results.deepRailsChecked > 0) {
      console.log('\n🔍 Deep Rail Details:');
      console.log(`Deep rails checked: ${results.deepRailsChecked}`);
      console.log(`Deep rails passed: ${results.deepRailsPassed}/${results.deepRailsChecked}`);
      console.log(`Cards with snap: ${results.cardsWithSnap}/${results.totalCards}`);
    }
    
    if (results.issues.length > 0) {
      console.log('\n❌ Issues found:');
      results.issues.forEach(issue => console.log(issue));
    } else {
      console.log('\n✅ All rails normalized successfully!');
    }
    
    const overallPass = results.deepRailsPassed === results.deepRailsChecked && results.issues.length === 0;
    console.log(`\n${overallPass ? '✅' : '❌'} Rail normalization: ${overallPass ? 'PASS' : 'FAIL'}`);
    
    return results;
  }

  /**
   * Force Home section visibility for diagnostic purposes
   * 
   * Toggles a diagnostic <style> element that makes hidden #homeSection
   * measurable for testing purposes.
   * 
   * @param {boolean} enable - Whether to enable or disable diagnostic visibility
   * @returns {boolean} Current state after toggle
   */
  export function forceHomeVisible(enable = true) {
    const styleId = 'force-home-visible';
    let styleEl = document.getElementById(styleId);
    
    if (enable) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
          #homeSection {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            min-height: 100px !important;
            position: static !important;
            transform: none !important;
            clip: auto !important;
            clip-path: none !important;
          }
        `;
        document.head.appendChild(styleEl);
        console.log('🔧 Diagnostic visibility enabled for #homeSection');
      }
      return true;
    } else {
      if (styleEl) {
        styleEl.remove();
        console.log('🔧 Diagnostic visibility disabled for #homeSection');
      }
      return false;
    }
  }

  // Expose utilities to window.__DEV_TOOLS for console access
  if (!window.__DEV_TOOLS) {
    window.__DEV_TOOLS = {};
  }
  
  window.__DEV_TOOLS.verifyHomeFrames = verifyHomeFrames;
  window.__DEV_TOOLS.verifyRailNormalization = verifyRailNormalization;
  window.__DEV_TOOLS.forceHomeVisible = forceHomeVisible;
  window.__DEV_TOOLS.HOME_CARD_MATCHERS = HOME_CARD_MATCHERS;
  
  console.log('🛠️  Home verification utilities loaded. Use window.__DEV_TOOLS.* to access them.');
  
} else {
  // Production: no-op exports
  export const HOME_CARD_MATCHERS = {};
  export function verifyHomeFrames() { return { error: 'Dev utilities not available in production' }; }
  export function verifyRailNormalization() { return { error: 'Dev utilities not available in production' }; }
  export function forceHomeVisible() { return false; }
}
