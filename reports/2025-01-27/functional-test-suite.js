// Functional Test Suite - Phase 1 API Key Security
console.log('🧪 FUNCTIONAL TEST SUITE - Phase 1 API Key Security');
console.log('='.repeat(60));

// Test configuration
const TEST_CONFIG = {
  searchQuery: 'test',
  expectedMinResults: 1,
  timeout: 10000, // 10 seconds
  rateLimitTest: 5 // Number of rapid requests to test rate limiting
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to run test
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🔍 Running: ${testName}`);
  
  try {
    const result = await Promise.race([
      testFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.timeout)
      )
    ]);
    
    if (result.success) {
      testResults.passed++;
      testResults.details.push({ name: testName, status: 'PASS', message: result.message });
      console.log(`✅ ${testName}: ${result.message}`);
    } else {
      testResults.failed++;
      testResults.details.push({ name: testName, status: 'FAIL', message: result.message });
      console.log(`❌ ${testName}: ${result.message}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'ERROR', message: error.message });
    console.log(`❌ ${testName}: ERROR - ${error.message}`);
  }
}

// Test 1: Search Functionality
async function testSearchFunctionality() {
  try {
    if (typeof window.searchTMDB !== 'function') {
      return { success: false, message: 'searchTMDB function not available' };
    }
    
    const result = await window.searchTMDB(TEST_CONFIG.searchQuery);
    
    if (!result || !result.results) {
      return { success: false, message: 'No results returned from search' };
    }
    
    if (result.results.length < TEST_CONFIG.expectedMinResults) {
      return { success: false, message: `Expected at least ${TEST_CONFIG.expectedMinResults} results, got ${result.results.length}` };
    }
    
    return { success: true, message: `Search returned ${result.results.length} results` };
  } catch (error) {
    return { success: false, message: `Search failed: ${error.message}` };
  }
}

// Test 2: Trending Content
async function testTrendingContent() {
  try {
    if (typeof window.getTrending !== 'function') {
      return { success: false, message: 'getTrending function not available' };
    }
    
    const result = await window.getTrending('all');
    
    if (!result || !result.results) {
      return { success: false, message: 'No trending results returned' };
    }
    
    if (result.results.length < TEST_CONFIG.expectedMinResults) {
      return { success: false, message: `Expected at least ${TEST_CONFIG.expectedMinResults} trending results, got ${result.results.length}` };
    }
    
    return { success: true, message: `Trending returned ${result.results.length} results` };
  } catch (error) {
    return { success: false, message: `Trending failed: ${error.message}` };
  }
}

// Test 3: Genre Discovery
async function testGenreDiscovery() {
  try {
    if (typeof window.getGenres !== 'function') {
      return { success: false, message: 'getGenres function not available' };
    }
    
    const result = await window.getGenres('movie');
    
    if (!result || !result.genres) {
      return { success: false, message: 'No genre results returned' };
    }
    
    if (result.genres.length < 5) {
      return { success: false, message: `Expected at least 5 genres, got ${result.genres.length}` };
    }
    
    return { success: true, message: `Genres returned ${result.genres.length} categories` };
  } catch (error) {
    return { success: false, message: `Genre discovery failed: ${error.message}` };
  }
}

// Test 4: Language Support
async function testLanguageSupport() {
  try {
    if (typeof window.tmdbGet !== 'function') {
      return { success: false, message: 'tmdbGet function not available' };
    }
    
    // Test with different language
    const result = await window.tmdbGet('search/multi', { 
      query: TEST_CONFIG.searchQuery, 
      language: 'es-ES' 
    });
    
    if (!result || !result.results) {
      return { success: false, message: 'No results returned for Spanish language' };
    }
    
    return { success: true, message: `Language support working - got ${result.results.length} Spanish results` };
  } catch (error) {
    return { success: false, message: `Language support failed: ${error.message}` };
  }
}

// Test 5: Rate Limiting
async function testRateLimiting() {
  try {
    if (typeof window.searchTMDB !== 'function') {
      return { success: false, message: 'searchTMDB function not available' };
    }
    
    // Make rapid requests to test rate limiting
    const promises = [];
    for (let i = 0; i < TEST_CONFIG.rateLimitTest; i++) {
      promises.push(window.searchTMDB(`test${i}`));
    }
    
    const results = await Promise.allSettled(promises);
    const failures = results.filter(r => r.status === 'rejected').length;
    
    if (failures === 0) {
      return { success: false, message: 'Rate limiting not working - all requests succeeded' };
    }
    
    if (failures === results.length) {
      return { success: false, message: 'Rate limiting too aggressive - all requests failed' };
    }
    
    return { success: true, message: `Rate limiting working - ${failures}/${results.length} requests failed` };
  } catch (error) {
    return { success: false, message: `Rate limiting test failed: ${error.message}` };
  }
}

// Test 6: Error Handling
async function testErrorHandling() {
  try {
    if (typeof window.tmdbGet !== 'function') {
      return { success: false, message: 'tmdbGet function not available' };
    }
    
    // Test with invalid endpoint
    const result = await window.tmdbGet('invalid/endpoint', { query: 'test' });
    
    if (result && result.error) {
      return { success: true, message: 'Error handling working - invalid endpoint properly rejected' };
    }
    
    return { success: false, message: 'Error handling not working - invalid endpoint should be rejected' };
  } catch (error) {
    return { success: true, message: `Error handling working - caught error: ${error.message}` };
  }
}

// Test 7: Performance
async function testPerformance() {
  try {
    if (typeof window.searchTMDB !== 'function') {
      return { success: false, message: 'searchTMDB function not available' };
    }
    
    const startTime = performance.now();
    await window.searchTMDB(TEST_CONFIG.searchQuery);
    const endTime = performance.now();
    
    const responseTime = endTime - startTime;
    
    if (responseTime > 5000) {
      return { success: false, message: `Response time too slow: ${responseTime.toFixed(2)}ms` };
    }
    
    return { success: true, message: `Response time acceptable: ${responseTime.toFixed(2)}ms` };
  } catch (error) {
    return { success: false, message: `Performance test failed: ${error.message}` };
  }
}

// Test 8: Proxy Functionality
async function testProxyFunctionality() {
  try {
    // Test direct proxy endpoint
    const response = await fetch('/.netlify/functions/tmdb-proxy?path=search/multi&query=test');
    
    if (!response.ok) {
      return { success: false, message: `Proxy endpoint not accessible: ${response.status}` };
    }
    
    const data = await response.json();
    
    if (!data || !data.results) {
      return { success: false, message: 'Proxy endpoint not returning valid data' };
    }
    
    return { success: true, message: `Proxy endpoint working - returned ${data.results.length} results` };
  } catch (error) {
    return { success: false, message: `Proxy functionality failed: ${error.message}` };
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting functional test suite...\n');
  
  await runTest('Search Functionality', testSearchFunctionality);
  await runTest('Trending Content', testTrendingContent);
  await runTest('Genre Discovery', testGenreDiscovery);
  await runTest('Language Support', testLanguageSupport);
  await runTest('Rate Limiting', testRateLimiting);
  await runTest('Error Handling', testErrorHandling);
  await runTest('Performance', testPerformance);
  await runTest('Proxy Functionality', testProxyFunctionality);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FUNCTIONAL TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => test.status !== 'PASS')
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
  }
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 ALL TESTS PASSED! Phase 1 functional testing complete.');
  } else {
    console.log('\n⚠️  Some tests failed. Review and fix issues before proceeding.');
  }
  
  return testResults;
}

// Auto-run tests
runAllTests();
