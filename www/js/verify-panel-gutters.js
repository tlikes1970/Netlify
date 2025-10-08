/**
 * Panel Gutter Verification Helper
 * Verifies that Home panels have proper gutters and are measurable
 */

(function() {
  'use strict';
  
  function verifyPanelGutters() {
    console.log('🔍 Verifying Home Panel Gutters...');
    
    const results = {
      groups: [],
      panels: [],
      issues: []
    };
    
    // Check all 5 groups
    const groupIds = [
      'group-1-your-shows',
      'group-2-community', 
      'group-3-for-you',
      'group-4-theaters',
      'group-5-feedback'
    ];
    
    groupIds.forEach(groupId => {
      const group = document.getElementById(groupId);
      if (!group) {
        results.issues.push(`❌ Missing group: ${groupId}`);
        return;
      }
      
      const groupStyle = getComputedStyle(group);
      const groupResult = {
        id: groupId,
        paddingInline: groupStyle.paddingInline || groupStyle.paddingLeft + ' ' + groupStyle.paddingRight,
        width: groupStyle.width,
        maxWidth: groupStyle.maxWidth,
        boxSizing: groupStyle.boxSizing,
        status: '✅'
      };
      
      // Check for zero padding (should be 0 for groups)
      const paddingLeft = parseFloat(groupStyle.paddingLeft);
      const paddingRight = parseFloat(groupStyle.paddingRight);
      if (paddingLeft > 0 || paddingRight > 0) {
        groupResult.status = '⚠️';
        results.issues.push(`⚠️ ${groupId}: Group has padding (L:${paddingLeft}px, R:${paddingRight}px) - should be 0`);
      }
      
      results.groups.push(groupResult);
      
      // Check panels within this group
      const panels = group.querySelectorAll(':is(.home-preview-row, .section-content, .card-container, section, div)');
      panels.forEach((panel, index) => {
        const panelStyle = getComputedStyle(panel);
        const panelResult = {
          groupId,
          index,
          tagName: panel.tagName.toLowerCase(),
          className: panel.className,
          display: panelStyle.display,
          width: panelStyle.width,
          paddingInline: panelStyle.paddingInline || panelStyle.paddingLeft + ' ' + panelStyle.paddingRight,
          paddingLeft: panelStyle.paddingLeft,
          paddingRight: panelStyle.paddingRight,
          margin: panelStyle.margin,
          boxSizing: panelStyle.boxSizing,
          status: '✅'
        };
        
        // Check for proper display
        if (panelStyle.display === 'none') {
          panelResult.status = '❌';
          results.issues.push(`❌ ${groupId} panel[${index}]: display: none - not measurable`);
        } else if (panelStyle.display !== 'block') {
          panelResult.status = '⚠️';
          results.issues.push(`⚠️ ${groupId} panel[${index}]: display: ${panelStyle.display} - should be block`);
        }
        
        // Check for proper padding (should be 32px for panels)
        const paddingLeft = parseFloat(panelStyle.paddingLeft);
        const paddingRight = parseFloat(panelStyle.paddingRight);
        if (paddingLeft !== 32 || paddingRight !== 32) {
          panelResult.status = '⚠️';
          results.issues.push(`⚠️ ${groupId} panel[${index}]: Wrong padding (L:${paddingLeft}px, R:${paddingRight}px) - should be 32px`);
        }
        
        // Check for zero width
        const width = parseFloat(panelStyle.width);
        if (width === 0) {
          panelResult.status = '❌';
          results.issues.push(`❌ ${groupId} panel[${index}]: Zero width - not measurable`);
        }
        
        results.panels.push(panelResult);
      });
    });
    
    // Check for any remaining padding rules in main.css that affect Home
    const mainCssRules = Array.from(document.styleSheets)
      .filter(sheet => sheet.href && sheet.href.includes('main.css'))
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules || []);
        } catch (e) {
          return [];
        }
      });
    
    const problematicRules = mainCssRules.filter(rule => {
      if (rule.type !== CSSRule.STYLE_RULE) return false;
      const selector = rule.selectorText;
      const style = rule.style;
      
      // Check for .home-preview-row padding rules
      if (selector.includes('.home-preview-row') && 
          (style.padding === '0' || style.paddingLeft === '0' || style.paddingRight === '0')) {
        return true;
      }
      
      // Check for #group-1-your-shows padding rules
      if (selector.includes('#group-1-your-shows') && 
          selector.includes('.home-preview-row') &&
          (style.padding === '0' || style.paddingLeft === '0' || style.paddingRight === '0')) {
        return true;
      }
      
      return false;
    });
    
    if (problematicRules.length > 0) {
      results.issues.push(`❌ Found ${problematicRules.length} problematic padding rules in main.css:`);
      problematicRules.forEach(rule => {
        results.issues.push(`  - ${rule.selectorText} { padding: ${rule.style.padding} }`);
      });
    }
    
    // Summary
    console.log('\n📊 Panel Gutter Verification Results:');
    console.table(results.groups);
    console.table(results.panels);
    
    if (results.issues.length > 0) {
      console.warn('\n⚠️ Issues Found:');
      results.issues.forEach(issue => console.warn(issue));
    } else {
      console.log('\n✅ All checks passed! Home panel gutters are working correctly.');
    }
    
    // Check for temporary overrides
    const tempOverride = document.getElementById('ys-panel-gutter-override');
    if (tempOverride) {
      console.warn('⚠️ Temporary override still present - remove it for accurate testing');
    }
    
    return results;
  }
  
  // Export globally
  window.verifyPanelGutters = verifyPanelGutters;
  
  // Auto-run if in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(verifyPanelGutters, 1000);
  }
  
})();



