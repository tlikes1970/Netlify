// JavaScript Error Detection for Compact Mobile System
// Run this in the browser console to catch errors

console.log('🚨 JAVASCRIPT ERROR DETECTION');
console.log('==============================');

// Capture all console errors
const errors = [];
const originalError = console.error;
console.error = function(...args) {
  errors.push(args.join(' '));
  originalError.apply(console, args);
};

// Capture all console warnings
const warnings = [];
const originalWarn = console.warn;
console.warn = function(...args) {
  warnings.push(args.join(' '));
  originalWarn.apply(console, args);
};

console.log('✅ Error detection active - enabling compact mobile system...');

// Enable compact mobile system step by step
console.log('\n🔧 STEP 1: Enable mobile_compact_v1 flag');
localStorage.setItem('flag:mobile_compact_v1', 'true');
document.documentElement.dataset.density = 'compact';
window.dispatchEvent(new Event('storage'));
window.dispatchEvent(new Event('resize'));

setTimeout(() => {
  console.log('🔧 STEP 2: Enable mobile_actions_split_v1 flag');
  localStorage.setItem('flag:mobile_actions_split_v1', 'true');
  window.dispatchEvent(new Event('storage'));
  
  setTimeout(() => {
    console.log('🔧 STEP 3: Check for errors and warnings');
    
    console.log('\n📊 ERROR SUMMARY:');
    if (errors.length > 0) {
      console.log('❌ ERRORS FOUND:', errors.length);
      errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    } else {
      console.log('✅ No errors detected');
    }
    
    console.log('\n⚠️ WARNING SUMMARY:');
    if (warnings.length > 0) {
      console.log('⚠️ WARNINGS FOUND:', warnings.length);
      warnings.forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`);
      });
    } else {
      console.log('✅ No warnings detected');
    }
    
    // Check current state
    console.log('\n📊 CURRENT STATE:');
    const state = {
      compactMobileV1: document.documentElement.getAttribute('data-compact-mobile-v1'),
      actionsSplit: document.documentElement.dataset.actionsSplit,
      density: document.documentElement.dataset.density,
      tabCardCount: document.querySelectorAll('.tab-card').length,
      swipeRowCount: document.querySelectorAll('.swipe-row-container').length,
      compactActionsCount: document.querySelectorAll('.compact-actions-container').length
    };
    console.log('State:', state);
    
    // Check if SwipeRow component is working
    console.log('\n🔍 SWIPE ROW COMPONENT CHECK:');
    const swipeRows = document.querySelectorAll('.swipe-row-container');
    if (swipeRows.length > 0) {
      console.log('✅ SwipeRow containers found:', swipeRows.length);
      const firstSwipeRow = swipeRows[0];
      console.log('First SwipeRow:', {
        classes: firstSwipeRow.className,
        display: getComputedStyle(firstSwipeRow).display,
        children: firstSwipeRow.children.length
      });
    } else {
      console.log('❌ No SwipeRow containers found');
      console.log('   This suggests SwipeRow component is not rendering');
    }
    
    // Check compact actions
    console.log('\n🔍 COMPACT ACTIONS CHECK:');
    const compactActions = document.querySelectorAll('.compact-actions-container');
    if (compactActions.length > 0) {
      console.log('✅ Compact actions found:', compactActions.length);
      const firstCompactAction = compactActions[0];
      console.log('First compact action:', {
        display: getComputedStyle(firstCompactAction).display,
        children: firstCompactAction.children.length,
        innerHTML: firstCompactAction.innerHTML.substring(0, 100) + '...'
      });
    } else {
      console.log('❌ No compact actions found');
      console.log('   This suggests CompactPrimaryAction/CompactOverflowMenu are returning null');
    }
    
    // Restore original console methods
    console.error = originalError;
    console.warn = originalWarn;
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('Check the results above to identify the issue');
    
  }, 1000);
}, 1000);

