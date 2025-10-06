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
   * Used by verifyRailNormalization() to detect cards in rails
   */
  export const HOME_CARD_MATCHERS = {
    // Primary card selectors
    cards: '#homeSection .card',
    
    // Rail selectors (deepest rails only)
    rails: [
      '.preview-row-container',
      '.preview-row-scroll', 
      '.row-inner',
      '#currentlyWatchingScroll',
      '.curated-row'
    ],
    
    // Group selectors
    groups: [
      'group-1-your-shows',
      'group-2-community', 
      'group-3-for-you',
      'group-4-theaters',
      'group-5-feedback'
    ],
    
    // Panel selectors (carry gutters)
    panels: [
      '.home-preview-row',
      '.section-content', 
      '.card-container',
      'section',
      'div'
    ]
  };

  /**
   * Verify Home frame structure and gutter behavior
   * 
   * Checks:
   * - Groups have width: 100%, padding: 0
   * - Panels have padding: 32px (single gutter)
   * - Rails have padding: 0, proper grid layout
   * - No double gutters or conflicting rules
   * 
   * @returns {Object} Results with pass/fail status and details
   */
  export function verifyHomeFrames() {
    console.log('🔍 Verifying Home frame structure...');
    
    const results = {
      totalGroups: 0,
      groupsChecked: 0,
      groupsPassed: 0,
      panelsChecked: 0,
      panelsPassed: 0,
      railsChecked: 0,
      railsPassed: 0,
      issues: []
    };
    
    // Check each group
    HOME_CARD_MATCHERS.groups.forEach(groupId => {
      const group = document.getElementById(groupId);
      if (!group) {
        results.issues.push(`❌ Group ${groupId} not found`);
        return;
      }
      
      results.totalGroups++;
      results.groupsChecked++;
      
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
      if (groupPassed) {
        results.groupsPassed++;
      } else {
        const failures = Object.entries(groupChecks)
          .filter(([key, value]) => !value)
          .map(([key, value]) => `${key}=${value}`);
        results.issues.push(`❌ Group ${groupId}: ${failures.join(', ')}`);
      }
      
      // Check panels within this group
      HOME_CARD_MATCHERS.panels.forEach(panelSelector => {
        const panels = group.querySelectorAll(panelSelector);
        
        panels.forEach((panel, index) => {
          results.panelsChecked++;
          
          const panelComputed = getComputedStyle(panel);
          const panelRect = panel.getBoundingClientRect();
          
          const panelChecks = {
            display: panelComputed.display === 'block',
            paddingLeft: panelComputed.paddingLeft === '32px',
            paddingRight: panelComputed.paddingRight === '32px',
            hasWidth: panelRect.width > 0
          };
          
          const panelPassed = Object.values(panelChecks).every(Boolean);
          if (panelPassed) {
            results.panelsPassed++;
          } else {
            const failures = Object.entries(panelChecks)
              .filter(([key, value]) => !value)
              .map(([key, value]) => `${key}=${value}`);
            results.issues.push(`❌ Panel ${groupId} ${panelSelector}[${index}]: ${failures.join(', ')}`);
          }
        });
      });
      
      // Check rails within this group
      HOME_CARD_MATCHERS.rails.forEach(railSelector => {
        const rails = group.querySelectorAll(railSelector);
        
        rails.forEach((rail, index) => {
          results.railsChecked++;
          
          const railComputed = getComputedStyle(rail);
          const railRect = rail.getBoundingClientRect();
          
          const railChecks = {
            display: railComputed.display === 'grid',
            gridFlow: railComputed.gridAutoFlow === 'column',
            paddingLeft: railComputed.paddingLeft === '0px',
            paddingRight: railComputed.paddingRight === '0px',
            overflowX: railComputed.overflowX === 'auto',
            overflowY: railComputed.overflowY === 'hidden',
            hasWidth: railRect.width > 0
          };
          
          const railPassed = Object.values(railChecks).every(Boolean);
          if (railPassed) {
            results.railsPassed++;
          } else {
            const failures = Object.entries(railChecks)
              .filter(([key, value]) => !value)
              .map(([key, value]) => `${key}=${value}`);
            results.issues.push(`❌ Rail ${groupId} ${railSelector}[${index}]: ${failures.join(', ')}`);
          }
        });
      });
    });
    
    // Summary
    console.log('\n📊 Home Frame Verification Results:');
    console.log(`Groups: ${results.groupsPassed}/${results.groupsChecked} passed`);
    console.log(`Panels: ${results.panelsPassed}/${results.panelsChecked} passed`);
    console.log(`Rails: ${results.railsPassed}/${results.railsChecked} passed`);
    
    if (results.issues.length > 0) {
      console.log('\n❌ Issues found:');
      results.issues.forEach(issue => console.log(issue));
    } else {
      console.log('\n✅ All Home frames verified successfully!');
    }
    
    const overallPass = results.groupsPassed === results.groupsChecked && 
                       results.panelsPassed === results.panelsChecked && 
                       results.railsPassed === results.railsChecked && 
                       results.issues.length === 0;
    
    console.log(`\n${overallPass ? '✅' : '❌'} Home frames: ${overallPass ? 'PASS' : 'FAIL'}`);
    
    return results;
  }

  /**
   * Verify rail normalization (deepest rails only)
   * 
   * Checks:
   * - Rails use grid with column flow
   * - Zero rail padding
   * - Proper overflow behavior
   * - Cards have snap alignment
   * - No conflicting rules in home.css
   * 
   * @returns {Object} Results with pass/fail status and details
   */
  export function verifyRailNormalization() {
    console.log('🔍 Verifying Home rail normalization...');
    
    const results = {
      totalGroups: 0,
      groupsWithRails: 0,
      railsChecked: 0,
      railsPassed: 0,
      cardsWithSnap: 0,
      totalCards: 0,
      issues: []
    };
    
    // Check each group for rails
    HOME_CARD_MATCHERS.groups.forEach(groupId => {
      const group = document.getElementById(groupId);
      if (!group) {
        results.issues.push(`❌ Group ${groupId} not found`);
        return;
      }
      
      results.totalGroups++;
      let groupHasRails = false;
      
      // Check deepest rails only
      HOME_CARD_MATCHERS.rails.forEach(railSelector => {
        const rails = group.querySelectorAll(railSelector);
        
        rails.forEach((rail, index) => {
          results.railsChecked++;
          groupHasRails = true;
          
          const computed = getComputedStyle(rail);
          const rect = rail.getBoundingClientRect();
          
          const checks = {
            display: computed.display === 'grid',
            gridFlow: computed.gridAutoFlow === 'column',
            paddingLeft: computed.paddingLeft === '0px',
            paddingRight: computed.paddingRight === '0px',
            overflowX: computed.overflowX === 'auto',
            overflowY: computed.overflowY === 'hidden',
            maxWidth: computed.maxWidth === '100%' || computed.maxWidth === 'none',
            minWidth: computed.minWidth === '0px',
            scrollSnap: computed.scrollSnapType.includes('mandatory'),
            hasWidth: rect.width > 0
          };
          
          const passed = Object.values(checks).every(Boolean);
          if (passed) {
            results.railsPassed++;
          } else {
            const failures = Object.entries(checks)
              .filter(([key, value]) => !value)
              .map(([key, value]) => `${key}=${value}`);
            
            results.issues.push(
              `❌ ${groupId} ${railSelector}[${index}]: ${failures.join(', ')}`
            );
          }
        });
      });
      
      if (groupHasRails) {
        results.groupsWithRails++;
      }
    });
    
    // Check cards with snap alignment
    const cards = document.querySelectorAll(HOME_CARD_MATCHERS.cards);
    results.totalCards = cards.length;
    
    cards.forEach(card => {
      const computed = getComputedStyle(card);
      if (computed.scrollSnapAlign === 'start') {
        results.cardsWithSnap++;
      }
    });
    
    // Check for conflicting rules in home.css
    console.log('\n🔍 Checking for conflicting rules in home.css...');
    const homeCssConflicts = [];
    HOME_CARD_MATCHERS.rails.forEach(selector => {
      const rules = Array.from(document.styleSheets)
        .filter(sheet => sheet.href && sheet.href.includes('home.css'))
        .flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules);
          } catch (e) {
            return [];
          }
        })
        .filter(rule => rule.selectorText && rule.selectorText.includes(selector));
      
      if (rules.length > 0) {
        homeCssConflicts.push(`Found ${rules.length} rules for ${selector} in home.css`);
      }
    });
    
    if (homeCssConflicts.length > 0) {
      results.issues.push('⚠️  Potential conflicts in home.css:');
      homeCssConflicts.forEach(result => results.issues.push(result));
    }
    
    // Summary
    console.log('\n📊 Rail Normalization Results:');
    console.log(`Groups with rails: ${results.groupsWithRails}/${results.totalGroups}`);
    console.log(`Rails checked: ${results.railsChecked}`);
    console.log(`Rails passed: ${results.railsPassed}/${results.railsChecked}`);
    console.log(`Cards with snap: ${results.cardsWithSnap}/${results.totalCards}`);
    
    if (results.issues.length > 0) {
      console.log('\n❌ Issues found:');
      results.issues.forEach(issue => console.log(issue));
    } else {
      console.log('\n✅ All rails normalized successfully!');
    }
    
    const overallPass = results.railsPassed === results.railsChecked && 
                       results.issues.length === 0 && 
                       homeCssConflicts.length === 0;
    
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
