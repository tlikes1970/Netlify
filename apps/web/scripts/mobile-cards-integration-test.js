/**
 * Mobile Cards Integration Test
 * Tests that the new mobile cards are being rendered when flags are enabled
 */

console.log('🧪 MOBILE CARDS INTEGRATION TEST');
console.log('================================');

// Test 1: Check if mobile flags are available
console.log('\n1. Checking mobile flags:');
console.log('   data-compact-mobile-v1:', document.documentElement.dataset.compactMobileV1);
console.log('   data-actions-split:', document.documentElement.dataset.actionsSplit);
console.log('   data-density:', document.documentElement.dataset.density);

// Test 2: Check if mobile CSS is loaded
console.log('\n2. Checking mobile CSS:');
const mobileCardStyles = document.querySelector('style[data-mobile-cards]') || 
  Array.from(document.styleSheets).find(sheet => {
    try {
      return Array.from(sheet.cssRules).some(rule => 
        rule.selectorText && rule.selectorText.includes('.card-mobile')
      );
    } catch (e) {
      return false;
    }
  });

if (mobileCardStyles) {
  console.log('   ✅ Mobile card CSS found');
} else {
  console.log('   ❌ Mobile card CSS not found');
}

// Test 3: Check if mobile components are available
console.log('\n3. Checking mobile components:');
console.log('   Looking for .card-mobile elements...');
const mobileCards = document.querySelectorAll('.card-mobile');
console.log(`   Found ${mobileCards.length} mobile card elements`);

if (mobileCards.length > 0) {
  console.log('   ✅ Mobile cards are being rendered!');
  
  // Test 4: Check card dimensions
  console.log('\n4. Checking card dimensions:');
  mobileCards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    console.log(`   Card ${index + 1}: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
    
    // Check if height is stable (~242px ±8px)
    if (rect.height >= 234 && rect.height <= 250) {
      console.log(`   ✅ Card ${index + 1} has stable height`);
    } else {
      console.log(`   ⚠️ Card ${index + 1} height may be unstable: ${Math.round(rect.height)}px`);
    }
  });
  
  // Test 5: Check swipe functionality
  console.log('\n5. Checking swipe functionality:');
  const swipeRows = document.querySelectorAll('.swipe-row');
  const swipeOverlays = document.querySelectorAll('.swipe-row-overlay');
  console.log(`   SSR placeholders (.swipe-row): ${swipeRows.length}`);
  console.log(`   Swipe overlays (.swipe-row-overlay): ${swipeOverlays.length}`);
  
  if (swipeRows.length > 0 && swipeOverlays.length > 0) {
    console.log('   ✅ Swipe functionality is active');
  } else {
    console.log('   ❌ Swipe functionality may not be working');
  }
  
} else {
  console.log('   ❌ No mobile cards found - may need to enable flags');
  console.log('\n   To enable mobile cards:');
  console.log('   1. Set localStorage.setItem("flag:mobile_compact_v1", "true")');
  console.log('   2. Set localStorage.setItem("flag:mobile_actions_split_v1", "true")');
  console.log('   3. Refresh the page');
  console.log('   4. Make sure you\'re on mobile viewport (< 768px)');
}

// Test 6: Check text clamping
console.log('\n6. Checking text clamping:');
const cardTitles = document.querySelectorAll('.card-title');
const cardSummaries = document.querySelectorAll('.card-summary');

cardTitles.forEach((title, index) => {
  const styles = window.getComputedStyle(title);
  if (styles.textOverflow === 'ellipsis' && styles.whiteSpace === 'nowrap') {
    console.log(`   ✅ Title ${index + 1} has single-line ellipsis`);
  } else {
    console.log(`   ❌ Title ${index + 1} may not be clamped properly`);
  }
});

cardSummaries.forEach((summary, index) => {
  const styles = window.getComputedStyle(summary);
  if (styles.webkitLineClamp === '3' || styles.maxHeight) {
    console.log(`   ✅ Summary ${index + 1} has 3-line clamp`);
  } else {
    console.log(`   ❌ Summary ${index + 1} may not be clamped properly`);
  }
});

console.log('\n🎯 INTEGRATION TEST COMPLETE');
console.log('If you see mobile cards with stable dimensions and swipe functionality,');
console.log('the implementation is working correctly!');

