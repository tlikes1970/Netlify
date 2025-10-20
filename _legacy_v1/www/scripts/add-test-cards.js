(function() {
    'use strict';
    console.log('🧪 [TEST CARDS] Adding test cards to Currently Watching...');

    function addTestCards() {
        // Check if appData exists
        if (!window.appData) {
            console.warn('🧪 [TEST CARDS] appData not available, waiting...');
            setTimeout(addTestCards, 1000);
            return;
        }

        // Test shows data
        const testShows = [
            { id: 1001, title: 'Breaking Bad', type: 'tv' },
            { id: 1002, title: 'The Office', type: 'tv' },
            { id: 1003, title: 'Stranger Things', type: 'tv' },
            { id: 1004, title: 'Game of Thrones', type: 'tv' },
            { id: 1005, title: 'Friends', type: 'tv' },
            { id: 1006, title: 'The Mandalorian', type: 'tv' },
            { id: 1007, title: 'Ozark', type: 'tv' },
            { id: 1008, title: 'The Crown', type: 'tv' },
            { id: 1009, title: 'House of Cards', type: 'tv' },
            { id: 1010, title: 'Narcos', type: 'tv' },
            { id: 1011, title: 'Black Mirror', type: 'tv' },
            { id: 1012, title: 'The Witcher', type: 'tv' }
        ];

        // Add test shows to Currently Watching
        if (!window.appData.tv.watching) {
            window.appData.tv.watching = [];
        }

        // Clear existing and add test data
        window.appData.tv.watching = testShows.map(show => ({
            id: show.id,
            title: show.title,
            media_type: show.type,
            poster_path: '/placeholder-poster.jpg',
            vote_average: 8.5,
            overview: `Test show: ${show.title}`,
            first_air_date: '2020-01-01',
            genre_ids: [18, 80]
        }));

        console.log(`🧪 [TEST CARDS] Added ${testShows.length} test shows to Currently Watching`);
        console.log('🧪 [TEST CARDS] Test shows:', window.appData.tv.watching);

        // Save to localStorage
        localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
        console.log('🧪 [TEST CARDS] Saved to localStorage');

        // Trigger refresh if HomeClean is available
        if (window.HomeClean && window.HomeClean.refresh) {
            console.log('🧪 [TEST CARDS] Triggering HomeClean refresh...');
            window.HomeClean.refresh();
        } else {
            console.log('🧪 [TEST CARDS] HomeClean not available, page refresh needed');
        }
    }

    // Wait for app to load
    setTimeout(addTestCards, 2000);
})();




