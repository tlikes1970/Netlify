// Test Language Switching - Run this in browser console
console.log('🧪 Starting Language Switching Test');

// Test 1: Check if LanguageManager exists
console.log('1. LanguageManager available:', !!window.LanguageManager);
if (window.LanguageManager) {
    console.log('   Current language:', window.LanguageManager.getCurrentLanguage());
}

// Test 2: Check if required functions exist
const functions = [
    'seedCuratedData',
    'renderCuratedHomepage', 
    '__FlickletRefreshTrivia',
    '__FlickletRefreshSeriesOrganizer',
    'loadFrontSpotlight',
    'startDailyCountdown',
    'updateFlickWordStats',
    'rehydrateListsForLocale'
];

console.log('2. Function availability:');
functions.forEach(func => {
    const exists = typeof window[func] === 'function';
    console.log(`   ${func}: ${exists ? '✅' : '❌'}`);
});

// Test 3: Test language change
async function testLanguageChange() {
    console.log('3. Testing language change...');
    
    if (!window.LanguageManager) {
        console.error('❌ LanguageManager not available');
        return;
    }
    
    try {
        console.log('   Switching to Spanish...');
        await window.LanguageManager.changeLanguage('es');
        
        setTimeout(() => {
            console.log('   Current language after change:', window.LanguageManager.getCurrentLanguage());
            
            console.log('   Switching back to English...');
            window.LanguageManager.changeLanguage('en').then(() => {
                console.log('   Current language after change back:', window.LanguageManager.getCurrentLanguage());
                console.log('✅ Language switching test completed');
            });
        }, 2000);
        
    } catch (error) {
        console.error('❌ Language change failed:', error);
    }
}

// Run the test
testLanguageChange();

console.log('🧪 Test script loaded. Check console for results.');

