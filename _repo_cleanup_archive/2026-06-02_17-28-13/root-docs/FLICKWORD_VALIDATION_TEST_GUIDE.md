# FlickWord Validation Testing Guide

## Quick Manual Testing Steps

### 1. Start the Development Server

```bash
cd apps/web
npm run dev
```

The app should start at `http://localhost:8888`

### 2. Open the FlickWord Game

1. Navigate to `http://localhost:8888`
2. Open browser console (F12 or Right-click → Inspect → Console)
3. Either:
   - Click the FlickWord game button/icon in the UI, OR
   - Type in console: `window.openFlickWordModal()`

### 3. Test Word Validation (Manual)

Try typing these words in the game and pressing Enter:

**Should be REJECTED (show error notification):**
- `hollo` ❌
- `heres` ❌
- `xyzab` ❌
- `abcde` ❌

**Should be ACCEPTED (process the guess):**
- `hello` ✅
- `world` ✅
- `house` ✅
- `water` ✅
- `light` ✅

### 4. Test via Browser Console

Open browser console and run:

```javascript
// Import validation function
const { validateWord } = await import('/src/lib/words/validateWord.ts');

// Test non-words (should reject)
console.log('Testing "hollo":', await validateWord('hollo')); // Should be { valid: false }
console.log('Testing "heres":', await validateWord('heres')); // Should be { valid: false }

// Test common words (should accept)
console.log('Testing "hello":', await validateWord('hello')); // Should be { valid: true }
console.log('Testing "world":', await validateWord('world')); // Should be { valid: true }
```

### 5. Check Daily Word Selection

```javascript
const { getTodaysWord } = await import('/src/lib/dailyWordApi.ts');
const wordData = await getTodaysWord();
console.log('Today\'s word:', wordData.word);
console.log('Is it a common word?', wordData.word.toLowerCase()); // Should be a familiar word
```

### 6. Verify Common Words List

```javascript
const { isCommonWord } = await import('/src/lib/words/commonWords.ts');
console.log('hollo in common words?', isCommonWord('hollo')); // false
console.log('heres in common words?', isCommonWord('heres')); // false
console.log('hello in common words?', isCommonWord('hello')); // true
console.log('world in common words?', isCommonWord('world')); // true
```

## Expected Results

✅ **PASS Criteria:**
- "hollo" is rejected with error notification
- "heres" is rejected with error notification
- Common words like "hello", "world", "house" are accepted
- Daily word is from the common words list
- No console errors during validation
- Game remains playable and enjoyable

❌ **FAIL Criteria:**
- "hollo" or "heres" are accepted as valid
- Common words are rejected
- Console shows validation errors
- Game becomes unplayable

## Browser Console Test Script

Copy and paste this into the browser console:

```javascript
async function testFlickWordValidation() {
  console.log('🧪 Testing FlickWord Validation...\n');
  
  const { validateWord } = await import('/src/lib/words/validateWord.ts');
  const { isCommonWord } = await import('/src/lib/words/commonWords.ts');
  
  const tests = [
    { word: 'hollo', expected: false, desc: 'Non-word "hollo"' },
    { word: 'heres', expected: false, desc: 'Non-word "heres"' },
    { word: 'hello', expected: true, desc: 'Common word "hello"' },
    { word: 'world', expected: true, desc: 'Common word "world"' },
    { word: 'house', expected: true, desc: 'Common word "house"' },
  ];
  
  for (const test of tests) {
    const result = await validateWord(test.word);
    const passed = result.valid === test.expected;
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test.desc}: ${result.valid ? 'ACCEPTED' : 'REJECTED'} (expected: ${test.expected ? 'ACCEPT' : 'REJECT'})`);
  }
  
  console.log('\n📊 Common Words Check:');
  console.log('hollo:', isCommonWord('hollo')); // false
  console.log('heres:', isCommonWord('heres')); // false
  console.log('hello:', isCommonWord('hello')); // true
}

testFlickWordValidation();
```

## Visual Testing Checklist

- [ ] Open FlickWord game modal
- [ ] Type "hollo" → Should show error notification "Not a valid word."
- [ ] Type "heres" → Should show error notification "Not a valid word."
- [ ] Type "hello" → Should accept and process the guess
- [ ] Type "world" → Should accept and process the guess
- [ ] Check that daily word is a familiar, common word
- [ ] Verify tile animations work correctly
- [ ] Verify keyboard highlights work correctly
- [ ] Test that game completion works
- [ ] Check stats are saved correctly

## Performance Testing

Monitor the browser console for:
- No excessive validation calls
- Validation completes quickly (<100ms per word)
- No memory leaks during extended play
- Smooth animations (60fps)

## Accessibility Testing

- [ ] Screen reader can announce game state
- [ ] Keyboard navigation works
- [ ] Focus management is correct
- [ ] ARIA labels are present



