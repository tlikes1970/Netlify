// Test script to verify games are working
// Run this in browser console after the app loads

async function testGamesIntegration() {
  console.log('🧪 Testing Games Integration...');
  
  // Test 1: Check if global functions are available
  console.log('1. Checking global functions...');
  const hasOpenFlickWord = typeof window.openFlickWordModal === 'function';
  const hasCloseFlickWord = typeof window.closeFlickWordModal === 'function';
  console.log('   openFlickWordModal:', hasOpenFlickWord);
  console.log('   closeFlickWordModal:', hasCloseFlickWord);
  
  // Test 2: Check if daily word API works
  console.log('2. Testing daily word API...');
  try {
    // Import the API function dynamically
    const { getTodaysWord } = await import('/src/lib/dailyWordApi.ts');
    const wordData = await getTodaysWord();
    console.log('   Today\'s word:', wordData.word);
    console.log('   Definition:', wordData.definition);
    console.log('   Difficulty:', wordData.difficulty);
  } catch (error) {
    console.error('   API Error:', error);
  }
  
  // Test 3: Check if word validation works
  console.log('3. Testing word validation...');
  try {
    const { validateWord } = await import('/src/lib/dailyWordApi.ts');
    const isValid = await validateWord('hello');
    console.log('   "hello" is valid:', isValid);
  } catch (error) {
    console.error('   Validation Error:', error);
  }
  
  // Test 4: Check localStorage cache
  console.log('4. Checking localStorage cache...');
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
    console.error('   Cache Error:', error);
  }
  
  // Test 5: Try to open the game modal
  console.log('5. Testing game modal...');
  if (hasOpenFlickWord) {
    console.log('   Opening FlickWord modal...');
    window.openFlickWordModal();
    
    // Close it after 2 seconds
    setTimeout(() => {
      if (hasCloseFlickWord) {
        console.log('   Closing FlickWord modal...');
        window.closeFlickWordModal();
      }
    }, 2000);
  }
  
  console.log('✅ Games integration test complete!');
}

// Run the test
testGamesIntegration();
