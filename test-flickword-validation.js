/**
 * Quick test script for FlickWord word validation
 * Run this in browser console when the app is loaded at localhost:8888
 */

async function testFlickWordValidation() {
  console.log('🧪 Testing FlickWord Word Validation...\n');

  // Import the validation function
  const { validateWord } = await import('./apps/web/src/lib/words/validateWord.ts');
  const { isCommonWord } = await import('./apps/web/src/lib/words/commonWords.ts');

  const testCases = [
    // Non-words that should be REJECTED
    { word: 'hollo', shouldAccept: false, description: 'Non-word "hollo"' },
    { word: 'heres', shouldAccept: false, description: 'Non-word "heres"' },
    { word: 'xyzab', shouldAccept: false, description: 'Random letters' },
    { word: 'abcde', shouldAccept: false, description: 'Non-word sequence' },
    
    // Common words that should be ACCEPTED
    { word: 'hello', shouldAccept: true, description: 'Common word "hello"' },
    { word: 'world', shouldAccept: true, description: 'Common word "world"' },
    { word: 'house', shouldAccept: true, description: 'Common word "house"' },
    { word: 'about', shouldAccept: true, description: 'Common word "about"' },
    { word: 'water', shouldAccept: true, description: 'Common word "water"' },
    
    // Edge cases
    { word: 'HELLO', shouldAccept: true, description: 'Uppercase should normalize' },
    { word: 'HeLLo', shouldAccept: true, description: 'Mixed case should normalize' },
    { word: 'abcd', shouldAccept: false, description: 'Too short' },
    { word: 'abcdef', shouldAccept: false, description: 'Too long' },
  ];

  console.log('Testing word validation:\n');
  let passCount = 0;
  let failCount = 0;

  for (const test of testCases) {
    try {
      const result = await validateWord(test.word);
      const passed = result.valid === test.shouldAccept;
      
      if (passed) {
        console.log(`✅ PASS: ${test.description}`);
        console.log(`   "${test.word}" → ${result.valid ? 'ACCEPTED' : 'REJECTED'} (expected: ${test.shouldAccept ? 'ACCEPT' : 'REJECT'})`);
        passCount++;
      } else {
        console.log(`❌ FAIL: ${test.description}`);
        console.log(`   "${test.word}" → ${result.valid ? 'ACCEPTED' : 'REJECTED'} (expected: ${test.shouldAccept ? 'ACCEPT' : 'REJECT'})`);
        console.log(`   Reason: ${result.reason || 'none'}, Source: ${result.source}`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.description}`);
      console.log(`   "${test.word}" → Error: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Passed: ${passCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Total: ${testCases.length}`);

  if (failCount === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed - please review');
  }
}

// Test common words directly
function testCommonWordsList() {
  console.log('\n🧪 Testing Common Words List...\n');
  
  const { isCommonWord } = require('./apps/web/src/lib/words/commonWords.ts');
  
  const wordsToCheck = ['hollo', 'heres', 'hello', 'world', 'house'];
  
  wordsToCheck.forEach(word => {
    const isCommon = isCommonWord(word);
    console.log(`${isCommon ? '✅' : '❌'} "${word}" → ${isCommon ? 'IN list' : 'NOT in list'}`);
  });
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('📝 Test functions available:');
  console.log('   - testFlickWordValidation() - Test word validation');
  console.log('   - testCommonWordsList() - Test common words list');
  console.log('\n💡 Run: await testFlickWordValidation()');
} else {
  // Node.js context
  testFlickWordValidation();
}



