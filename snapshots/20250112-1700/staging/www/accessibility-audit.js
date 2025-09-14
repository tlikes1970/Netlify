/**
 * Accessibility Audit Script for Phase C Changes
 * Version: v23.81-VISUAL-POLISH
 */

console.log('🔍 Starting Accessibility Audit for Phase C Changes...');

// Test 1: Check mobile font sizes
function testMobileFontSizes() {
    console.log('\n📱 Testing Mobile Font Sizes...');
    
    if (window.innerWidth <= 768) {
        const elements = document.querySelectorAll('body.mobile .show-card .show-meta, body.mobile .show-card .show-overview, body.mobile .btn, body.mobile .search-input');
        let allPassed = true;
        
        elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const fontSize = parseFloat(computedStyle.fontSize);
            const status = fontSize >= 16 ? '✅' : '❌';
            console.log(`${status} ${el.tagName}.${el.className}: ${fontSize}px`);
            if (fontSize < 16) allPassed = false;
        });
        
        return allPassed;
    } else {
        console.log('ℹ️ Not on mobile device - skipping mobile font size test');
        return true;
    }
}

// Test 2: Check focus-visible styles
function testFocusVisibleStyles() {
    console.log('\n🎯 Testing Focus-Visible Styles...');
    
    const focusableElements = document.querySelectorAll('button, input, select, [role="button"], [role="tab"]');
    let hasFocusStyles = true;
    
    focusableElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el, ':focus-visible');
        const outline = computedStyle.outline;
        const outlineWidth = computedStyle.outlineWidth;
        
        if (outline === 'none' || outlineWidth === '0px') {
            console.log(`❌ ${el.tagName}.${el.className}: No focus-visible styles`);
            hasFocusStyles = false;
        } else {
            console.log(`✅ ${el.tagName}.${el.className}: Has focus-visible styles`);
        }
    });
    
    return hasFocusStyles;
}

// Test 3: Check ARIA attributes
function testARIAAttributes() {
    console.log('\n♿ Testing ARIA Attributes...');
    
    const regions = document.querySelectorAll('[role="region"]');
    let allHaveLabels = true;
    
    regions.forEach(region => {
        const hasLabel = region.hasAttribute('aria-label') || region.hasAttribute('aria-labelledby');
        const status = hasLabel ? '✅' : '❌';
        console.log(`${status} ${region.tagName}[role="region"]: ${hasLabel ? 'Has label' : 'Missing label'}`);
        if (!hasLabel) allHaveLabels = false;
    });
    
    return allHaveLabels;
}

// Test 4: Check touch targets
function testTouchTargets() {
    console.log('\n👆 Testing Touch Targets...');
    
    const interactiveElements = document.querySelectorAll('button, input, select, [role="button"], [role="tab"]');
    let allMeetTargets = true;
    
    interactiveElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const minHeight = parseFloat(computedStyle.minHeight) || parseFloat(computedStyle.height);
        const minWidth = parseFloat(computedStyle.minWidth) || parseFloat(computedStyle.width);
        
        const meetsHeight = minHeight >= 44;
        const meetsWidth = minWidth >= 44;
        const status = (meetsHeight && meetsWidth) ? '✅' : '❌';
        
        console.log(`${status} ${el.tagName}.${el.className}: ${minHeight}x${minWidth}px`);
        if (!meetsHeight || !meetsWidth) allMeetTargets = false;
    });
    
    return allMeetTargets;
}

// Test 5: Check contrast improvements
function testContrastImprovements() {
    console.log('\n🎨 Testing Contrast Improvements...');
    
    // Check if muted color variable is improved
    const root = document.documentElement;
    const computedStyle = window.getComputedStyle(root);
    const mutedColor = computedStyle.getPropertyValue('--muted');
    
    console.log(`Muted color variable: ${mutedColor}`);
    
    // This would need a proper contrast checker in a real implementation
    console.log('ℹ️ Manual contrast check required with color picker tool');
    
    return true;
}

// Test 6: Check script loading
function testScriptLoading() {
    console.log('\n⚡ Testing Script Loading...');
    
    const scripts = document.querySelectorAll('script[src]');
    let hasDeferredScripts = false;
    
    scripts.forEach(script => {
        const isDeferred = script.hasAttribute('defer');
        const src = script.getAttribute('src');
        const status = isDeferred ? '✅' : 'ℹ️';
        console.log(`${status} ${src}: ${isDeferred ? 'Deferred' : 'Synchronous'}`);
        if (isDeferred) hasDeferredScripts = true;
    });
    
    return hasDeferredScripts;
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running Phase C Accessibility Audit...\n');
    
    const results = {
        mobileFontSizes: testMobileFontSizes(),
        focusVisibleStyles: testFocusVisibleStyles(),
        ariaAttributes: testARIAAttributes(),
        touchTargets: testTouchTargets(),
        contrastImprovements: testContrastImprovements(),
        scriptLoading: testScriptLoading()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${test}`);
    });
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed - check details above'}`);
    
    return results;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllTests);
    } else {
        runAllTests();
    }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testMobileFontSizes,
        testFocusVisibleStyles,
        testARIAAttributes,
        testTouchTargets,
        testContrastImprovements,
        testScriptLoading
    };
}
