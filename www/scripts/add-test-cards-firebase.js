console.log('🧪 [FIREBASE TEST CARDS] Adding test cards to Firebase...');

window.addTestCardsToFirebase = async function() {
    try {
        console.log('🧪 [FIREBASE TEST CARDS] Starting Firebase test data addition...');
        
        // Check if user is authenticated
        if (!window.firebase || !window.firebase.auth().currentUser) {
            console.warn('🧪 [FIREBASE TEST CARDS] User not authenticated, cannot add to Firebase');
            return;
        }
        
        const user = window.firebase.auth().currentUser;
        console.log('🧪 [FIREBASE TEST CARDS] User authenticated:', user.email);
        
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
        
        // Update Firebase with test data
        const userRef = window.firebase.firestore().collection('users').doc(user.uid);
        
        await userRef.update({
            'tv.watching': testShows,
            lastUpdated: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('🧪 [FIREBASE TEST CARDS] ✅ Added 12 test shows to Firebase');
        console.log('🧪 [FIREBASE TEST CARDS] Test shows:', testShows);
        
        // Also update local storage
        if (!window.appData) {
            window.appData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
        }
        
        if (!window.appData.tv) {
            window.appData.tv = {};
        }
        
        window.appData.tv.watching = testShows;
        localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
        
        console.log('🧪 [FIREBASE TEST CARDS] ✅ Updated local storage');
        
        // Trigger refresh
        if (window.HomeClean && window.HomeClean.refresh) {
            console.log('🧪 [FIREBASE TEST CARDS] Triggering HomeClean refresh...');
            window.HomeClean.refresh();
        } else {
            console.log('🧪 [FIREBASE TEST CARDS] Reloading page...');
            location.reload();
        }
        
    } catch (error) {
        console.error('🧪 [FIREBASE TEST CARDS] Error:', error);
    }
};

console.log('🧪 [FIREBASE TEST CARDS] Use addTestCardsToFirebase() to add test data to Firebase');




