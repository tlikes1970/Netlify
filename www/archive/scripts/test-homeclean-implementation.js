/**
 * HomeClean Implementation Validation Script
 * Tests the mockup layout implementation
 */

console.log('🧪 [VALIDATION] Starting HomeClean implementation test...');

// Test 1: Check if HomeClean class exists
if (typeof window.HomeClean !== 'undefined') {
    console.log('✅ [VALIDATION] HomeClean class found');
} else {
    console.error('❌ [VALIDATION] HomeClean class not found');
}

// Test 2: Check if home-clean.css is loaded
const homeCleanCSS = document.querySelector('link[href*="home-clean.css"]');
if (homeCleanCSS) {
    console.log('✅ [VALIDATION] home-clean.css link found');
} else {
    console.error('❌ [VALIDATION] home-clean.css link not found');
}

// Test 3: Check light theme variables
const rootStyles = getComputedStyle(document.documentElement);
const surfaceColor = rootStyles.getPropertyValue('--surface');
const borderColor = rootStyles.getPropertyValue('--border');
const fgColor = rootStyles.getPropertyValue('--fg');

if (surfaceColor.includes('#f9fafb') || surfaceColor.includes('249, 250, 251')) {
    console.log('✅ [VALIDATION] Light theme variables applied');
} else {
    console.warn('⚠️ [VALIDATION] Light theme variables may not be applied');
}

// Test 4: Check if #homeSection exists
const homeSection = document.querySelector('#homeSection');
if (homeSection) {
    console.log('✅ [VALIDATION] #homeSection found');
} else {
    console.error('❌ [VALIDATION] #homeSection not found');
}

// Test 5: Test HomeClean initialization
async function testHomeCleanInit() {
    try {
        console.log('🧪 [VALIDATION] Testing HomeClean initialization...');
        
        const homeClean = new window.HomeClean();
        const success = await homeClean.init(document.querySelector('#homeSection'));
        
        if (success) {
            console.log('✅ [VALIDATION] HomeClean initialized successfully');
            
            // Test 6: Check if clean-root exists
            const cleanRoot = document.querySelector('#clean-root');
            if (cleanRoot) {
                console.log('✅ [VALIDATION] #clean-root created');
                
                // Test 7: Check if all containers exist
                const containers = [
                    '#your-shows-container',
                    '#community-container', 
                    '#for-you-container',
                    '#in-theaters-container',
                    '#feedback-container'
                ];
                
                let containersFound = 0;
                containers.forEach(selector => {
                    if (cleanRoot.querySelector(selector)) {
                        containersFound++;
                    }
                });
                
                if (containersFound === containers.length) {
                    console.log('✅ [VALIDATION] All containers created');
                } else {
                    console.warn(`⚠️ [VALIDATION] Only ${containersFound}/${containers.length} containers found`);
                }
                
                // Test 8: Check if rails exist
                const rails = [
                    '#cw-rail',
                    '#up-next-rail',
                    '#drama-rail',
                    '#comedy-rail',
                    '#horror-rail',
                    '#in-theaters-rail'
                ];
                
                let railsFound = 0;
                rails.forEach(selector => {
                    if (cleanRoot.querySelector(selector)) {
                        railsFound++;
                    }
                });
                
                if (railsFound === rails.length) {
                    console.log('✅ [VALIDATION] All rails created');
                } else {
                    console.warn(`⚠️ [VALIDATION] Only ${railsFound}/${rails.length} rails found`);
                }
                
                // Test 9: Check if cards are rendered
                const cards = cleanRoot.querySelectorAll('.card');
                if (cards.length > 0) {
                    console.log(`✅ [VALIDATION] ${cards.length} cards rendered`);
                } else {
                    console.warn('⚠️ [VALIDATION] No cards rendered');
                }
                
                // Test 10: Check rail scroll behavior
                const firstRail = cleanRoot.querySelector('.rail');
                if (firstRail) {
                    const scrollSnapType = getComputedStyle(firstRail).scrollSnapType;
                    if (scrollSnapType.includes('mandatory')) {
                        console.log('✅ [VALIDATION] Rail scroll-snap configured');
                    } else {
                        console.warn('⚠️ [VALIDATION] Rail scroll-snap not configured');
                    }
                }
                
            } else {
                console.error('❌ [VALIDATION] #clean-root not created');
            }
            
        } else {
            console.error('❌ [VALIDATION] HomeClean initialization failed');
        }
        
    } catch (error) {
        console.error('❌ [VALIDATION] HomeClean test failed:', error);
    }
}

// Test 11: Check accessibility
function testAccessibility() {
    console.log('🧪 [VALIDATION] Testing accessibility...');
    
    const cleanRoot = document.querySelector('#clean-root');
    if (cleanRoot) {
        // Check contrast ratios
        const titleElements = cleanRoot.querySelectorAll('.title, .group-title');
        let goodContrast = 0;
        
        titleElements.forEach(el => {
            const styles = getComputedStyle(el);
            const color = styles.color;
            const bgColor = styles.backgroundColor;
            
            // Simple contrast check (would need proper calculation in real implementation)
            if (color && bgColor && color !== bgColor) {
                goodContrast++;
            }
        });
        
        if (goodContrast > 0) {
            console.log('✅ [VALIDATION] Text contrast appears adequate');
        } else {
            console.warn('⚠️ [VALIDATION] Text contrast may need improvement');
        }
        
        // Check for proper heading hierarchy
        const h2Elements = cleanRoot.querySelectorAll('h2');
        const h3Elements = cleanRoot.querySelectorAll('h3');
        
        if (h2Elements.length > 0 && h3Elements.length > 0) {
            console.log('✅ [VALIDATION] Proper heading hierarchy found');
        } else {
            console.warn('⚠️ [VALIDATION] Heading hierarchy may be incomplete');
        }
    }
}

// Run tests
testHomeCleanInit().then(() => {
    testAccessibility();
    console.log('🎉 [VALIDATION] All tests completed');
});

// Export for manual testing
window.testHomeClean = testHomeCleanInit;
window.testAccessibility = testAccessibility;
