// Check the next 6 words for patterns
const words = ['GIVEN', 'AFTER', 'ACUTE', 'CRUDE', 'MIGHT', 'ADULT'];

console.log('Next 6 words:');
words.forEach((w, i) => {
  console.log(`${i + 1}. ${w} (${w.charAt(0)})`);
});

console.log('\nFirst letters:', words.map(w => w.charAt(0)).join(', '));

// Check for repeated first letters
const firstLetters = words.map(w => w.charAt(0).toLowerCase());
const repeated = [];
for (let i = 1; i < firstLetters.length; i++) {
  if (firstLetters[i] === firstLetters[i - 1]) {
    repeated.push({ index: i, word: words[i], letter: firstLetters[i], prevWord: words[i - 1] });
  }
}

if (repeated.length > 0) {
  console.log('\n❌ REPEATED FIRST LETTERS FOUND:');
  repeated.forEach(r => {
    console.log(`  - ${r.word} (${r.letter}) repeats from ${r.prevWord}`);
  });
} else {
  console.log('\n✅ No consecutive repeated first letters');
}

// Count A words
const aWords = words.filter(w => w.charAt(0).toLowerCase() === 'a');
console.log(`\n❌ Found ${aWords.length} words starting with 'A': ${aWords.join(', ')}`);


