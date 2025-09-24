// Test script to verify API key exposure before implementation
console.log('🧪 Testing API key exposure...');

// Test 1: Check if API key is in HTML source
const htmlSource = document.documentElement.outerHTML;
const hasExposedKey = htmlSource.includes('api_key=') && htmlSource.includes('tmdb');
console.log('❌ API key exposed in HTML:', hasExposedKey);

// Test 2: Check if API key is in meta tags
const metaTags = document.querySelectorAll('meta[name*="api"]');
console.log('❌ API key in meta tags:', metaTags.length > 0);

// Test 3: Check if API key is in JavaScript source
const scripts = document.querySelectorAll('script');
let hasKeyInScript = false;
scripts.forEach(script => {
  if (script.textContent.includes('api_key=') || script.textContent.includes('TMDB_API_KEY')) {
    hasKeyInScript = true;
  }
});
console.log('❌ API key in script content:', hasKeyInScript);

// Test 4: Check for direct TMDB calls
const hasDirectTMDB = htmlSource.includes('api.themoviedb.org');
console.log('❌ Direct TMDB calls:', hasDirectTMDB);

// Test 5: Check for TMDB_CONFIG usage
const hasTMDBConfig = htmlSource.includes('TMDB_CONFIG');
console.log('❌ TMDB_CONFIG usage:', hasTMDBConfig);

console.log('🧪 API key exposure tests complete');
