/**
 * Mobile Cards Debug Script
 * Check why content isn't rendering in mobile cards
 */

console.log('🔍 MOBILE CARDS DEBUG');
console.log('====================');

// Check mobile flags
console.log('\n1. MOBILE FLAGS STATUS:');
console.log('data-compact-mobile-v1:', document.documentElement.dataset.compactMobileV1);
console.log('data-actions-split:', document.documentElement.dataset.actionsSplit);
console.log('data-density:', document.documentElement.dataset.density);
console.log('localStorage mobile_compact_v1:', localStorage.getItem('flag:mobile_compact_v1'));
console.log('localStorage mobile_actions_split_v1:', localStorage.getItem('flag:mobile_actions_split_v1'));

// Check viewport
console.log('\n2. VIEWPORT INFO:');
console.log('window.innerWidth:', window.innerWidth);
console.log('isMobile (< 768px):', window.innerWidth < 768);

// Check if mobile cards are being rendered
console.log('\n3. MOBILE CARD DETECTION:');
const mobileCards = document.querySelectorAll('.card-mobile');
const tabCards = document.querySelectorAll('.tab-card');
console.log('Mobile cards (.card-mobile):', mobileCards.length);
console.log('Tab cards (.tab-card):', tabCards.length);

if (mobileCards.length > 0) {
  console.log('\n4. MOBILE CARD CONTENT CHECK:');
  mobileCards.forEach((card, index) => {
    const title = card.querySelector('.card-title');
    const meta = card.querySelector('.card-meta');
    const summary = card.querySelector('.card-summary');
    const chips = card.querySelector('.card-footer');
    const actions = card.querySelector('.actions');
    
    console.log(`Card ${index + 1}:`, {
      title: title?.textContent || 'MISSING',
      meta: meta?.textContent || 'MISSING',
      summary: summary?.textContent || 'MISSING',
      hasChips: !!chips,
      hasActions: !!actions
    });
  });
} else {
  console.log('\n4. NO MOBILE CARDS FOUND');
  console.log('This means TabCard is not detecting mobile mode properly.');
  console.log('Check if:');
  console.log('- Mobile flags are enabled');
  console.log('- Viewport is < 768px');
  console.log('- TabCard mobile detection logic is working');
}

// Check CSS loading
console.log('\n5. CSS LOADING CHECK:');
const mobileCSS = Array.from(document.styleSheets).find(sheet => {
  try {
    return sheet.href && sheet.href.includes('cards-mobile.css');
  } catch (e) {
    return false;
  }
});
console.log('Mobile CSS loaded:', !!mobileCSS);

// Check for any JavaScript errors
console.log('\n6. JAVASCRIPT ERRORS:');
console.log('Check browser console for any React errors or component rendering issues.');

console.log('\n🎯 DEBUG COMPLETE');
console.log('If mobile cards are not rendering, the issue is likely:');
console.log('1. Mobile flags not enabled');
console.log('2. Viewport too wide (> 768px)');
console.log('3. TabCard mobile detection failing');
console.log('4. Component compilation errors');

