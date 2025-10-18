// Comprehensive test script for FlickWord game debugging
// Run this in browser console after the app loads

async function testFlickWordGame() {
  console.log('🧪 Testing FlickWord Game - Comprehensive Debug...');
  
  // Test 1: Check if the word "couch" is valid
  console.log('\n1. Testing word validation for "couch"...');
  try {
    const { validateWord } = await import('/src/lib/dailyWordApi.ts');
    const isValid = await validateWord('couch');
    console.log('   "couch" is valid:', isValid);
  } catch (error) {
    console.error('   Validation error:', error);
  }
  
  // Test 2: Check if the word "COUCH" (uppercase) is valid
  console.log('\n2. Testing word validation for "COUCH"...');
  try {
    const { validateWord } = await import('/src/lib/dailyWordApi.ts');
    const isValid = await validateWord('COUCH');
    console.log('   "COUCH" is valid:', isValid);
  } catch (error) {
    console.error('   Validation error:', error);
  }
  
  // Test 3: Test common words
  console.log('\n3. Testing common words...');
  const testWords = ['hello', 'world', 'house', 'water', 'light', 'night', 'music', 'dance'];
  try {
    const { validateWord } = await import('/src/lib/dailyWordApi.ts');
    for (const word of testWords) {
      const isValid = await validateWord(word);
      console.log(`   "${word}" is valid:`, isValid);
    }
  } catch (error) {
    console.error('   Validation error:', error);
  }
  
  // Test 4: Check today's word loading
  console.log('\n4. Testing today\'s word loading...');
  try {
    const { getTodaysWord } = await import('/src/lib/dailyWordApi.ts');
    const wordData = await getTodaysWord();
    console.log('   Today\'s word:', wordData.word);
    console.log('   Definition:', wordData.definition);
    console.log('   Difficulty:', wordData.difficulty);
  } catch (error) {
    console.error('   Word loading error:', error);
  }
  
  // Test 5: Check localStorage cache
  console.log('\n5. Checking localStorage cache...');
  try {
    const cached = localStorage.getItem('flicklet:daily-word');
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('   Cached word:', parsed.word);
      console.log('   Cached date:', parsed.date);
    } else {
      console.log('   No cached word found');
    }
  } catch (error) {
    console.error('   Cache error:', error);
  }
  
  // Test 6: Test game modal opening
  console.log('\n6. Testing game modal...');
  if (typeof window.openFlickWordModal === 'function') {
    console.log('   Opening FlickWord modal...');
    window.openFlickWordModal();
    
    // Wait a bit then close
    setTimeout(() => {
      if (typeof window.closeFlickWordModal === 'function') {
        console.log('   Closing FlickWord modal...');
        window.closeFlickWordModal();
      }
    }, 3000);
  } else {
    console.log('   openFlickWordModal function not available');
  }
  
  console.log('\n✅ FlickWord game test complete!');
  console.log('\n📝 Instructions:');
  console.log('1. Open the FlickWord game');
  console.log('2. Type "couch" and press Enter');
  console.log('3. Check the browser console for debug logs');
  console.log('4. The word should now be accepted and processed');
}

// Run the test
testFlickWordGame();
