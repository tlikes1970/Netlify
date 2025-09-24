// Comprehensive Security Test - Phase 1 API Key Migration
console.log('🔍 COMPREHENSIVE SECURITY TEST - Phase 1 API Key Migration');
console.log('='.repeat(60));

// Test 1: Check HTML source for API key exposure
console.log('\n1️⃣ Testing HTML source for API key exposure...');
const htmlSource = document.documentElement.outerHTML;
const hasExposedKey = htmlSource.includes('api_key=') && htmlSource.includes('tmdb');
const hasDirectTMDB = htmlSource.includes('api.themoviedb.org');
const hasTMDBConfig = htmlSource.includes('TMDB_CONFIG');

console.log('❌ API key exposed in HTML:', hasExposedKey);
console.log('❌ Direct TMDB calls in HTML:', hasDirectTMDB);
console.log('❌ TMDB_CONFIG usage in HTML:', hasTMDBConfig);

// Test 2: Check meta tags
console.log('\n2️⃣ Testing meta tags...');
const metaTags = document.querySelectorAll('meta[name*="api"]');
const metaTagsWithKey = Array.from(metaTags).filter(meta => 
  meta.content && (meta.content.includes('api_key') || meta.content.includes('tmdb'))
);
console.log('❌ API key in meta tags:', metaTagsWithKey.length > 0);
if (metaTagsWithKey.length > 0) {
  console.log('   Found meta tags:', metaTagsWithKey.map(m => m.outerHTML));
}

// Test 3: Check JavaScript source for API keys
console.log('\n3️⃣ Testing JavaScript source for API keys...');
const scripts = document.querySelectorAll('script');
let hasKeyInScript = false;
let hasDirectCalls = false;
let scriptIssues = [];

scripts.forEach((script, index) => {
  const content = script.textContent || '';
  if (content.includes('api_key=') || content.includes('TMDB_API_KEY')) {
    hasKeyInScript = true;
    scriptIssues.push(`Script ${index}: Contains API key reference`);
  }
  if (content.includes('api.themoviedb.org')) {
    hasDirectCalls = true;
    scriptIssues.push(`Script ${index}: Contains direct TMDB API calls`);
  }
});

console.log('❌ API key in script content:', hasKeyInScript);
console.log('❌ Direct TMDB calls in scripts:', hasDirectCalls);
if (scriptIssues.length > 0) {
  console.log('   Script issues found:', scriptIssues);
}

// Test 4: Check for hardcoded API keys
console.log('\n4️⃣ Testing for hardcoded API keys...');
const hardcodedKeys = [
  'b7247bb415b50f25b5e35e2566430b96',
  'your-api-key-here',
  'YOUR_TMDB_API_KEY_HERE'
];

let foundHardcodedKeys = [];
hardcodedKeys.forEach(key => {
  if (htmlSource.includes(key)) {
    foundHardcodedKeys.push(key);
  }
});

console.log('❌ Hardcoded API keys found:', foundHardcodedKeys.length > 0);
if (foundHardcodedKeys.length > 0) {
  console.log('   Found keys:', foundHardcodedKeys);
}

// Test 5: Check if proxy is working
console.log('\n5️⃣ Testing proxy functionality...');
async function testProxy() {
  try {
    // Test proxy endpoint directly
    const proxyResponse = await fetch('/.netlify/functions/tmdb-proxy?path=search/multi&query=test');
    console.log('✅ Proxy endpoint accessible:', proxyResponse.ok);
    
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      console.log('✅ Proxy returns data:', data.results ? 'YES' : 'NO');
    } else {
      console.log('❌ Proxy error:', proxyResponse.status, proxyResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Proxy test failed:', error.message);
  }
}

// Test 6: Check if tmdbGet function exists and works
console.log('\n6️⃣ Testing tmdbGet function...');
if (typeof window.tmdbGet === 'function') {
  console.log('✅ tmdbGet function exists');
  
  // Test tmdbGet function
  try {
    const result = await window.tmdbGet('search/multi', { query: 'test' });
    console.log('✅ tmdbGet function works:', result.results ? 'YES' : 'NO');
  } catch (error) {
    console.log('❌ tmdbGet function error:', error.message);
  }
} else {
  console.log('❌ tmdbGet function not found');
}

// Test 7: Check for remaining direct fetch calls to TMDB
console.log('\n7️⃣ Testing for remaining direct TMDB fetch calls...');
const fetchCalls = [];
scripts.forEach((script, index) => {
  const content = script.textContent || '';
  const matches = content.match(/fetch\([^)]*api\.themoviedb\.org[^)]*\)/g);
  if (matches) {
    fetchCalls.push(`Script ${index}: ${matches.join(', ')}`);
  }
});

console.log('❌ Direct fetch calls to TMDB:', fetchCalls.length > 0);
if (fetchCalls.length > 0) {
  console.log('   Found fetch calls:', fetchCalls);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SECURITY TEST SUMMARY');
console.log('='.repeat(60));

const allTestsPassed = !hasExposedKey && !hasDirectTMDB && !hasTMDBConfig && 
                      !hasKeyInScript && !hasDirectCalls && 
                      foundHardcodedKeys.length === 0 && fetchCalls.length === 0;

if (allTestsPassed) {
  console.log('✅ ALL SECURITY TESTS PASSED');
  console.log('✅ API key is properly secured');
  console.log('✅ No direct TMDB API calls found');
  console.log('✅ All requests go through proxy');
} else {
  console.log('❌ SECURITY TESTS FAILED');
  console.log('❌ Issues found that need to be fixed');
}

console.log('\n🔧 Next steps:');
if (!allTestsPassed) {
  console.log('1. Fix remaining API key exposures');
  console.log('2. Replace direct TMDB calls with proxy calls');
  console.log('3. Remove hardcoded API keys');
  console.log('4. Re-run this test until all tests pass');
} else {
  console.log('1. Deploy to production');
  console.log('2. Set TMDB_V4_TOKEN environment variable');
  console.log('3. Test in production environment');
}

// Run proxy test
testProxy();
