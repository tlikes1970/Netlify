/**
 * Home Frame Verification Helper
 * Console utility to verify the new token-driven layout system
 */

(function() {
  'use strict';
  
  function verifyHomeFrames() {
    console.log('🔍 Verifying Home Frame Layout...');
    
    const results = {
      groups: [],
      rails: [],
      cards: [],
      actions: [],
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
      
      const style = getComputedStyle(group);
      const groupResult = {
        id: groupId,
        paddingInline: style.paddingInline || style.paddingLeft + ' ' + style.paddingRight,
        width: style.width,
        maxWidth: style.maxWidth,
        boxSizing: style.boxSizing,
        status: '✅'
      };
      
      // Check for double padding
      const paddingLeft = parseFloat(style.paddingLeft);
      const paddingRight = parseFloat(style.paddingRight);
      if (paddingLeft > 32 || paddingRight > 32) {
        groupResult.status = '⚠️';
        results.issues.push(`⚠️ ${groupId}: Possible double padding (L:${paddingLeft}px, R:${paddingRight}px)`);
      }
      
      results.groups.push(groupResult);
    });
    
    // Check rails
    const railSelectors = [
      '.preview-row-scroll',
      '.row-inner', 
      '#currentlyWatchingScroll'
    ];
    
    railSelectors.forEach(selector => {
      const rails = document.querySelectorAll(`#homeSection ${selector}`);
      rails.forEach((rail, index) => {
        const style = getComputedStyle(rail);
        const railResult = {
          selector,
          index,
          display: style.display,
          gridAutoFlow: style.gridAutoFlow,
          gridAutoColumns: style.gridAutoColumns,
          gap: style.gap,
          paddingInline: style.paddingInline || style.paddingLeft + ' ' + style.paddingRight,
          overflowX: style.overflowX,
          scrollSnapType: style.scrollSnapType,
          status: '✅'
        };
        
        // Check for layout issues
        if (style.display !== 'grid') {
          railResult.status = '⚠️';
          results.issues.push(`⚠️ ${selector}[${index}]: Not using grid layout (${style.display})`);
        }
        
        if (style.paddingLeft !== '0px' || style.paddingRight !== '0px') {
          railResult.status = '⚠️';
          results.issues.push(`⚠️ ${selector}[${index}]: Has padding (L:${style.paddingLeft}, R:${style.paddingRight})`);
        }
        
        results.rails.push(railResult);
      });
    });
    
    // Check cards
    const cards = document.querySelectorAll('#homeSection .card');
    cards.forEach((card, index) => {
      const style = getComputedStyle(card);
      const cardResult = {
        index,
        width: style.width,
        minWidth: style.minWidth,
        maxWidth: style.maxWidth,
        containerType: style.containerType,
        scrollSnapAlign: style.scrollSnapAlign,
        status: '✅'
      };
      
      // Check for container query support
      if (style.containerType === 'none' || !style.containerType) {
        cardResult.status = '⚠️';
        results.issues.push(`⚠️ Card[${index}]: No container-type set (${style.containerType})`);
      }
      
      results.cards.push(cardResult);
    });
    
    // Check actions
    const actions = document.querySelectorAll('#homeSection .actions, #homeSection .card-actions');
    actions.forEach((action, index) => {
      const style = getComputedStyle(action);
      const actionResult = {
        index,
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns,
        gap: style.gap,
        paddingBlock: style.paddingBlock || style.paddingTop + ' ' + style.paddingBottom,
        status: '✅'
      };
      
      // Check for proper grid layout
      if (style.display !== 'grid') {
        actionResult.status = '⚠️';
        results.issues.push(`⚠️ Actions[${index}]: Not using grid layout (${style.display})`);
      }
      
      results.actions.push(actionResult);
    });
    
    // Check Community 2-column layout
    const community = document.getElementById('group-2-community');
    if (community) {
      const communityContent = community.querySelector('.home-preview-row, .section-content');
      if (communityContent) {
        const style = getComputedStyle(communityContent);
        const communityResult = {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          gap: style.gap,
          status: style.display === 'grid' && style.gridTemplateColumns.includes('1fr 1fr') ? '✅' : '⚠️'
        };
        
        if (communityResult.status === '⚠️') {
          results.issues.push(`⚠️ Community: Not using 2-column grid (${style.display}, ${style.gridTemplateColumns})`);
        }
        
        results.community = communityResult;
      }
    }
    
    // Summary
    console.log('\n📊 Home Frame Verification Results:');
    console.table(results.groups);
    console.table(results.rails);
    console.table(results.cards);
    console.table(results.actions);
    
    if (results.community) {
      console.log('\n🏘️ Community Layout:');
      console.table([results.community]);
    }
    
    if (results.issues.length > 0) {
      console.warn('\n⚠️ Issues Found:');
      results.issues.forEach(issue => console.warn(issue));
    } else {
      console.log('\n✅ All checks passed! Home frame layout is working correctly.');
    }
    
    // RTL test
    console.log('\n🌍 RTL Support:');
    console.log(`Current direction: ${document.dir || 'ltr'}`);
    console.log('To test RTL: document.documentElement.dir = "rtl"');
    
    return results;
  }
  
  // Export globally
  window.verifyHomeFrames = verifyHomeFrames;
  
  // Auto-run if in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(verifyHomeFrames, 1000);
  }
  
})();



