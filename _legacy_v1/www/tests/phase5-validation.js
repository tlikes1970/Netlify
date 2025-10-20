/**
 * Phase 5 Validation Script
 * Tests the HomeClean full cutover build
 */

/**
 * Validate Phase 5 implementation
 */
function validatePhase5() {
    console.log('🔍 Phase 5 Validation Starting...');
    
    const results = {
        rails: validateRails(),
        containers: validateContainers(),
        theme: validateTheme(),
        data: validateData(),
        scroll: validateScroll()
    };
    
    console.log('📊 Phase 5 Validation Results:', results);
    
    const allPassed = Object.values(results).every(result => result.passed);
    
    if (allPassed) {
        console.log('✅ Phase 5 validation PASSED');
    } else {
        console.log('❌ Phase 5 validation FAILED');
    }
    
    return results;
}

/**
 * Validate rails structure
 */
function validateRails() {
    const rails = [...document.querySelectorAll('#clean-root .rail')];
    
    const expectedRails = [
        'cw-rail',
        'up-next-rail', 
        'drama-rail',
        'comedy-rail',
        'horror-rail',
        'in-theaters-rail'
    ];
    
    const foundRails = rails.map(r => r.id);
    const missingRails = expectedRails.filter(id => !foundRails.includes(id));
    const extraRails = foundRails.filter(id => !expectedRails.includes(id));
    
    const result = {
        passed: missingRails.length === 0 && extraRails.length === 0,
        total: rails.length,
        expected: expectedRails.length,
        found: foundRails,
        missing: missingRails,
        extra: extraRails
    };
    
    console.log('🚂 Rails validation:', result);
    return result;
}

/**
 * Validate container structure
 */
function validateContainers() {
    const containers = [
        'your-shows-container',
        'community-container', 
        'for-you-container',
        'in-theaters-container',
        'feedback-container'
    ];
    
    const foundContainers = containers.map(id => {
        const element = document.querySelector(`#${id}`);
        return {
            id,
            found: !!element,
            hasContent: element ? element.children.length > 0 : false
        };
    });
    
    const result = {
        passed: foundContainers.every(c => c.found),
        containers: foundContainers
    };
    
    console.log('📦 Containers validation:', result);
    return result;
}

/**
 * Validate theme inheritance
 */
function validateTheme() {
    const cleanRoot = document.querySelector('#clean-root');
    if (!cleanRoot) {
        return { passed: false, error: 'clean-root not found' };
    }
    
    const computedStyle = getComputedStyle(cleanRoot);
    const usesGlobalTheme = computedStyle.color.includes('rgb') && 
                           computedStyle.backgroundColor.includes('rgb');
    
    const result = {
        passed: usesGlobalTheme,
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        usesGlobalTheme
    };
    
    console.log('🎨 Theme validation:', result);
    return result;
}

/**
 * Validate data flow
 */
function validateData() {
    const dataLayer = new window.HomeCleanData();
    const mockMode = window.FLAGS?.mockMode;
    
    const result = {
        passed: !!dataLayer && !!mockMode,
        hasDataLayer: !!dataLayer,
        mockModeEnabled: !!mockMode,
        methods: {
            getCurrentlyWatching: typeof dataLayer?.getCurrentlyWatching === 'function',
            getNextUp: typeof dataLayer?.getNextUp === 'function',
            getCuratedGenres: typeof dataLayer?.getCuratedGenres === 'function',
            getInTheaters: typeof dataLayer?.getInTheaters === 'function'
        }
    };
    
    console.log('📊 Data validation:', result);
    return result;
}

/**
 * Validate scroll behavior
 */
function validateScroll() {
    const rails = [...document.querySelectorAll('#clean-root .rail')];
    
    const scrollResults = rails.map(rail => {
        const computedStyle = getComputedStyle(rail);
        return {
            id: rail.id,
            overflowX: computedStyle.overflowX,
            scrollSnapType: computedStyle.scrollSnapType,
            hasScrollSnap: computedStyle.scrollSnapType !== 'none'
        };
    });
    
    const result = {
        passed: scrollResults.every(r => r.hasScrollSnap && r.overflowX === 'auto'),
        rails: scrollResults
    };
    
    console.log('📜 Scroll validation:', result);
    return result;
}

/**
 * Run the validation script from console
 */
function runPhase5Validation() {
    return validatePhase5();
}

// Export for global access
window.validatePhase5 = validatePhase5;
window.runPhase5Validation = runPhase5Validation;

console.log('🔧 Phase 5 validation script loaded. Run validatePhase5() to test.');
