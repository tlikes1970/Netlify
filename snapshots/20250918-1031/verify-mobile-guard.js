// Simple verification script for mobile polish guard
console.log('=== Mobile Polish Guard Verification ===');

// Test 1: Check if FLAGS is properly initialized
console.log('1. FLAGS.mobilePolishGuard:', window.FLAGS?.mobilePolishGuard);

// Test 2: Check current viewport and mobile class
const viewportWidth = window.innerWidth;
const hasMobileClass = document.body.classList.contains('mobile-v1');
console.log('2. Viewport width:', viewportWidth);
console.log('3. Has mobile-v1 class:', hasMobileClass);

// Test 3: Check if matchMedia is working
const isMobileViewport = window.matchMedia('(max-width: 640px)').matches;
console.log('4. Is mobile viewport (≤640px):', isMobileViewport);

// Test 4: Check localStorage override
const forced = localStorage.getItem('forceMobileV1') === '1';
console.log('5. Dev override (forceMobileV1=1):', forced);

// Test 5: Expected behavior
const shouldHaveMobileClass = forced || isMobileViewport;
console.log('6. Should have mobile-v1 class:', shouldHaveMobileClass);
console.log('7. Behavior matches expectation:', hasMobileClass === shouldHaveMobileClass);

// Test 6: Test resize behavior
console.log('8. Testing resize behavior...');
let resizeCount = 0;
const originalWidth = window.innerWidth;

// Simulate resize
window.dispatchEvent(new Event('resize'));
setTimeout(() => {
    const newHasMobileClass = document.body.classList.contains('mobile-v1');
    console.log('9. After resize - mobile-v1 class:', newHasMobileClass);
    console.log('10. Resize behavior working:', newHasMobileClass === shouldHaveMobileClass);
}, 100);

console.log('=== Verification Complete ===');
