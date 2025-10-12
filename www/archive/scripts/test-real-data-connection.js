/**
 * Test Real Currently Watching Data Connection
 * Quick test to verify the HomeClean component can access real data
 */

console.log('🧪 [REAL DATA TEST] Testing Currently Watching data connection...');

// Test function to verify real data access
async function testRealDataConnection() {
    try {
        console.log('🔍 [REAL DATA TEST] Checking data sources...');
        
        // Check if WatchlistsAdapterV2 is available
        if (window.WatchlistsAdapterV2) {
            console.log('✅ [REAL DATA TEST] WatchlistsAdapterV2 found');
            
            // Try to load data
            const uid = window.firebaseAuth?.currentUser?.uid || null;
            console.log('🔍 [REAL DATA TEST] User UID:', uid || 'No user (local data)');
            
            const adapterData = await window.WatchlistsAdapterV2.load(uid);
            console.log('📊 [REAL DATA TEST] Adapter data:', adapterData);
            
            if (adapterData && adapterData.watchingIds) {
                console.log(`✅ [REAL DATA TEST] Found ${adapterData.watchingIds.length} watching IDs`);
                
                // Test getting item data for first few items
                const testIds = adapterData.watchingIds.slice(0, 3);
                for (const id of testIds) {
                    const itemData = window.WatchlistsAdapterV2.getItemData(id);
                    if (itemData) {
                        console.log(`📺 [REAL DATA TEST] Item ${id}:`, {
                            title: itemData.title || itemData.name,
                            mediaType: itemData.media_type,
                            posterPath: itemData.poster_path ? 'Yes' : 'No'
                        });
                    } else {
                        console.warn(`⚠️ [REAL DATA TEST] No data found for ID ${id}`);
                    }
                }
            } else {
                console.warn('⚠️ [REAL DATA TEST] No watching IDs found in adapter data');
            }
        } else {
            console.warn('⚠️ [REAL DATA TEST] WatchlistsAdapterV2 not found');
        }
        
        // Check appData fallback
        if (window.appData) {
            const tvWatching = window.appData.tv?.watching || [];
            const movieWatching = window.appData.movies?.watching || [];
            console.log(`📊 [REAL DATA TEST] AppData fallback: ${tvWatching.length} TV + ${movieWatching.length} Movies = ${tvWatching.length + movieWatching.length} total`);
        } else {
            console.warn('⚠️ [REAL DATA TEST] No appData available');
        }
        
        // Test HomeClean initialization with real data
        if (window.HomeClean) {
            console.log('🧪 [REAL DATA TEST] Testing HomeClean with real data...');
            
            const homeClean = new window.HomeClean();
            const homeSection = document.querySelector('#homeSection');
            
            if (homeSection) {
                console.log('✅ [REAL DATA TEST] #homeSection found, initializing HomeClean...');
                const success = await homeClean.init(homeSection);
                
                if (success) {
                    console.log('✅ [REAL DATA TEST] HomeClean initialized successfully');
                    
                    // Check if real cards were rendered
                    const cwRail = document.querySelector('#cw-rail');
                    if (cwRail) {
                        const cards = cwRail.querySelectorAll('.card');
                        console.log(`📺 [REAL DATA TEST] Rendered ${cards.length} cards in CW rail`);
                        
                        // Check first card for real data
                        if (cards.length > 0) {
                            const firstCard = cards[0];
                            const title = firstCard.querySelector('.title')?.textContent;
                            const meta = firstCard.querySelector('.meta')?.textContent;
                            console.log(`🎬 [REAL DATA TEST] First card: "${title}" - ${meta}`);
                        }
                    }
                } else {
                    console.error('❌ [REAL DATA TEST] HomeClean initialization failed');
                }
            } else {
                console.error('❌ [REAL DATA TEST] #homeSection not found');
            }
        } else {
            console.error('❌ [REAL DATA TEST] HomeClean class not found');
        }
        
    } catch (error) {
        console.error('❌ [REAL DATA TEST] Test failed:', error);
    }
}

// Run the test
testRealDataConnection().then(() => {
    console.log('🎉 [REAL DATA TEST] Test completed');
});

// Export for manual testing
window.testRealDataConnection = testRealDataConnection;
