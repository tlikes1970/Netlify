// Test script to verify TMDB proxy functionality after implementation
console.log('🧪 Testing TMDB proxy functionality...');

// Test 1: Verify no API key exposure
const htmlSource = document.documentElement.outerHTML;
const hasExposedKey = htmlSource.includes('api_key=') && htmlSource.includes('tmdb');
console.log('✅ API key not exposed in HTML:', !hasExposedKey);

// Test 2: Verify API key is not in meta tags
const metaTags = document.querySelectorAll('meta[name*="api"]');
console.log('✅ No API key in meta tags:', metaTags.length === 0);

// Test 3: Test proxy functionality
async function testProxyFunctionality() {
  try {
    console.log('🔍 Testing search functionality...');
    const searchResult = await window.searchTMDB('test');
    console.log('✅ Search proxy working:', searchResult.results ? 'YES' : 'NO');
    
    console.log('🔍 Testing trending functionality...');
    const trendingResult = await window.getTrending('all');
    console.log('✅ Trending proxy working:', trendingResult.results ? 'YES' : 'NO');
    
    console.log('🔍 Testing genres functionality...');
    const genresResult = await window.getGenres('movie');
    console.log('✅ Genres proxy working:', genresResult.genres ? 'YES' : 'NO');
    
  } catch (error) {
    console.error('❌ Proxy functionality broken:', error);
  }
}

testProxyFunctionality();

// Test 4: Test rate limiting
async function testRateLimiting() {
  console.log('🔍 Testing rate limiting...');
  const promises = [];
  for (let i = 0; i < 35; i++) {
    promises.push(window.searchTMDB(`test${i}`));
  }
  
  try {
    await Promise.all(promises);
    console.log('⚠️ Rate limiting not working - all requests succeeded');
  } catch (error) {
    console.log('✅ Rate limiting working:', error.message.includes('Rate limit'));
  }
}

// Test 5: Test proxy endpoint directly
async function testProxyEndpoint() {
  try {
    console.log('🔍 Testing proxy endpoint directly...');
    const response = await fetch('/.netlify/functions/tmdb-proxy?path=search/multi&query=test');
    const data = await response.json();
    console.log('✅ Proxy endpoint working:', response.ok && data.results ? 'YES' : 'NO');
  } catch (error) {
    console.error('❌ Proxy endpoint broken:', error);
  }
}

testProxyEndpoint();

console.log('🧪 Proxy functionality tests complete');
