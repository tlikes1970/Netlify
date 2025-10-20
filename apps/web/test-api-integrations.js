// Test script for API integrations
// Run this in browser console to test both games' API integrations

async function testFlickWordAPI() {
  console.log('🎯 Testing FlickWord API...');
  try {
    // Import the function dynamically
    const { getFreshWord } = await import('./src/lib/dailyWordApi.ts');
    const wordData = await getFreshWord();
    console.log('✅ FlickWord Fresh API Success:', wordData);
    return true;
  } catch (error) {
    console.error('❌ FlickWord API Failed:', error);
    return false;
  }
}

async function testTriviaAPI() {
  console.log('🧠 Testing Trivia API...');
  try {
    // Import the function dynamically
    const { getFreshTrivia } = await import('./src/lib/triviaApi.ts');
    const triviaData = await getFreshTrivia();
    console.log('✅ Trivia Fresh API Success:', triviaData);
    return true;
  } catch (error) {
    console.error('❌ Trivia API Failed:', error);
    return false;
  }
}

async function testBothAPIs() {
  console.log('🚀 Testing both game APIs with fresh content...');
  const flickwordResult = await testFlickWordAPI();
  const triviaResult = await testTriviaAPI();
  
  console.log('📊 Results:', {
    flickword: flickwordResult ? '✅ Fresh Online' : '❌ Offline',
    trivia: triviaResult ? '✅ Fresh Online' : '❌ Offline'
  });
  
  return { flickword: flickwordResult, trivia: triviaResult };
}

function clearCachesAndTest() {
  console.log('🗑️ Clearing caches and testing fresh content...');
  
  // Clear caches
  try {
    localStorage.removeItem('flicklet:daily-word');
    localStorage.removeItem('flicklet:daily-trivia');
    console.log('✅ Caches cleared');
  } catch (error) {
    console.warn('❌ Failed to clear caches:', error);
  }
  
  // Test fresh content
  setTimeout(() => {
    testBothAPIs();
  }, 1000);
}

// Export for console testing
window.testGameAPIs = testBothAPIs;
window.testFlickWordAPI = testFlickWordAPI;
window.testTriviaAPI = testTriviaAPI;
window.clearCachesAndTest = clearCachesAndTest;

console.log('🧪 Fresh API Test functions loaded. Run clearCachesAndTest() to clear caches and test fresh content.');
