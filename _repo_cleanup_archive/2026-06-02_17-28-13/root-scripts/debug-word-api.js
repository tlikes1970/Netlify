// Debug script for daily word API
// Run this in browser console to test the API

async function testDailyWordAPI() {
  console.log('🧪 Testing Daily Word API...');
  
  try {
    // Test the API directly
    const response = await fetch('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minCorpusCount=1000&minLength=5&maxLength=5&api_key=a2a73e7b926c924fad7001ca0641ab2aaf2bab5');
    console.log('📡 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 API Data:', data);
    } else {
      console.error('❌ API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
  
  // Test localStorage cache
  try {
    const cached = localStorage.getItem('flicklet:daily-word');
    console.log('💾 Cached word:', cached);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('📋 Parsed cache:', parsed);
    }
  } catch (error) {
    console.error('❌ Cache Error:', error);
  }
  
  // Test word validation
  try {
    const validationResponse = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/test');
    console.log('🔍 Validation API status:', validationResponse.status);
  } catch (error) {
    console.error('❌ Validation API Error:', error);
  }
}

// Run the test
testDailyWordAPI();
