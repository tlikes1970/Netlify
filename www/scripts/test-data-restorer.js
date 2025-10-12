/**
 * Test Data Restorer - Adds sample shows to tabs for testing
 * Run this in console to populate tabs with test data
 */

(function() {
    'use strict';
    
    console.log('🧪 [TEST DATA] Starting data restoration...');
    
    // Clear existing data
    localStorage.clear();
    console.log('🧹 [TEST DATA] Cleared localStorage');
    
    // Create test appData structure
    const testAppData = {
        movies: {
            watching: [],
            wishlist: [],
            watched: []
        },
        tv: {
            watching: [
                {
                    id: 1399,
                    title: "Game of Thrones",
                    meta: "Drama • 2011-2019",
                    blurb: "Nine noble families fight for control over the mythical lands of Westeros.",
                    poster: "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
                    media_type: "tv"
                },
                {
                    id: 1396,
                    title: "Breaking Bad",
                    meta: "Crime Drama • 2008-2013",
                    blurb: "A high school chemistry teacher diagnosed with inoperable lung cancer.",
                    poster: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
                    media_type: "tv"
                },
                {
                    id: 1398,
                    title: "The Walking Dead",
                    meta: "Horror Drama • 2010-2022",
                    blurb: "Sheriff's deputy Rick Grimes awakens from a coma to a post-apocalyptic world.",
                    poster: "https://image.tmdb.org/t/p/w500/rqeYMLryjcawh2JeRpCVUDXYM5b.jpg",
                    media_type: "tv"
                }
            ],
            wishlist: [
                {
                    id: 1397,
                    title: "Stranger Things",
                    meta: "Sci-Fi Horror • 2016-Present",
                    blurb: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments.",
                    poster: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
                    media_type: "tv"
                },
                {
                    id: 1395,
                    title: "The Expanse",
                    meta: "Sci-Fi Drama • 2015-2022",
                    blurb: "A police detective in the asteroid belt, the first officer of an interplanetary ice freighter.",
                    poster: "https://image.tmdb.org/t/p/w500/6y7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q.jpg",
                    media_type: "tv"
                }
            ],
            watched: [
                {
                    id: 1394,
                    title: "The Office",
                    meta: "Comedy • 2005-2013",
                    blurb: "A mockumentary about a group of office workers where the workday consists of ego clashes.",
                    poster: "https://image.tmdb.org/t/p/w500/7DJKHzAiZ1TjH4c6DZtO8Q7Q7Q7Q7Q7Q.jpg",
                    media_type: "tv"
                }
            ]
        },
        settings: {
            theme: "light",
            lang: "en",
            username: "TestUser",
            displayName: "Test User"
        }
    };
    
    // Store test data
    localStorage.setItem('flicklet-data', JSON.stringify(testAppData));
    console.log('💾 [TEST DATA] Stored test data in localStorage');
    
    // Update global appData if it exists
    if (window.appData) {
        window.appData = testAppData;
        console.log('🔄 [TEST DATA] Updated window.appData');
    }
    
    // Trigger data ready event
    document.dispatchEvent(new CustomEvent('app:data:ready', { 
        detail: { source: 'test-data-restoration' } 
    }));
    console.log('📡 [TEST DATA] Dispatched app:data:ready event');
    
    // Also trigger cards:changed event for HomeClean
    document.dispatchEvent(new CustomEvent('cards:changed', { 
        detail: { source: 'test-data-restoration', action: 'data-loaded' } 
    }));
    console.log('📡 [TEST DATA] Dispatched cards:changed event');
    
    // Refresh HomeClean if mounted
    if (window.refreshHomeClean) {
        window.refreshHomeClean();
        console.log('🔄 [TEST DATA] Triggered HomeClean refresh');
    } else {
        console.log('⚠️ [TEST DATA] HomeClean not mounted yet');
    }
    
    // Force mount HomeClean if not already mounted
    if (window.mountHomeClean && !window.homeCleanState?.isMounted) {
        console.log('🚀 [TEST DATA] Force mounting HomeClean...');
        const homeSection = document.getElementById('homeSection');
        if (homeSection) {
            window.mountHomeClean(homeSection).then(success => {
                console.log('🚀 [TEST DATA] Force mount result:', success);
            });
        }
    }
    
    console.log('✅ [TEST DATA] Data restoration complete!');
    console.log('📊 [TEST DATA] Summary:');
    console.log('   - Currently Watching: 3 shows');
    console.log('   - Wishlist: 2 shows');
    console.log('   - Watched: 1 show');
    console.log('   - Total: 6 shows across tabs');
    
})();
