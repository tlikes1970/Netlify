console.log('🧪 [TEST CARDS] Manual script loaded');

window.addTestCards = function() {
    console.log('🧪 [TEST CARDS] Manual trigger - adding 12 test cards');
    
    // Get or create appData
    if (!window.appData) {
        window.appData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
    }
    
    if (!window.appData.tv) {
        window.appData.tv = {};
    }
    
    if (!window.appData.tv.watching) {
        window.appData.tv.watching = [];
    }
    
    // Create 12 test shows
    const testShows = Array.from({length: 12}, (_, i) => ({
        id: 1000 + i,
        title: `Test Show ${i + 1}`,
        media_type: 'tv',
        poster_path: '/placeholder-poster.jpg',
        vote_average: 8.5,
        overview: `Test show ${i + 1}`,
        first_air_date: '2020-01-01',
        genre_ids: [18, 80]
    }));
    
    // Replace current data with test data
    window.appData.tv.watching = testShows;
    
    // Save to localStorage
    localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
    
    console.log('🧪 [TEST CARDS] Added 12 test shows:', window.appData.tv.watching);
    
    // Trigger refresh
    if (window.HomeClean && window.HomeClean.refresh) {
        console.log('🧪 [TEST CARDS] Triggering HomeClean refresh...');
        window.HomeClean.refresh();
    } else {
        console.log('🧪 [TEST CARDS] Reloading page...');
        location.reload();
    }
};

console.log('🧪 [TEST CARDS] Use addTestCards() to add test data');
