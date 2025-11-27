// Verify no patterns in word list
const words = ['CRASH', 'MARIA', 'ADOPT', 'AWAKE', 'GIVEN', 'AFTER', 'ACUTE', 'CRUDE', 'MIGHT', 'ADULT'];

console.log('Checking for patterns:');
console.log('Words:', words.join(', '));

// Check 1: No repeated first letters (consecutive)
const firstLetters = words.map(w => w.charAt(0).toLowerCase());
console.log('\nFirst letters:', firstLetters.join(', '));

let repeatedFirstLetters = [];
for (let i = 1; i < firstLetters.length; i++) {
  if (firstLetters[i] === firstLetters[i - 1]) {
    repeatedFirstLetters.push({ index: i, word: words[i], letter: firstLetters[i] });
  }
}

if (repeatedFirstLetters.length > 0) {
  console.log('❌ REPEATED FIRST LETTERS FOUND:');
  repeatedFirstLetters.forEach(r => {
    console.log(`  - ${r.word} (${r.letter}) repeats letter from ${words[r.index - 1]}`);
  });
} else {
  console.log('✅ No repeated first letters');
}

// Check 2: No alphabetical order
let isAlphabetical = true;
for (let i = 1; i < words.length; i++) {
  if (words[i].toLowerCase() <= words[i - 1].toLowerCase()) {
    isAlphabetical = false;
    break;
  }
}

if (isAlphabetical) {
  console.log('❌ WORDS ARE IN ALPHABETICAL ORDER');
} else {
  console.log('✅ Words are not in alphabetical order');
}

// Check 3: No alphabetical first letters
let firstLettersAlphabetical = true;
for (let i = 1; i < firstLetters.length; i++) {
  if (firstLetters[i] <= firstLetters[i - 1]) {
    firstLettersAlphabetical = false;
    break;
  }
}

if (firstLettersAlphabetical) {
  console.log('❌ FIRST LETTERS ARE IN ALPHABETICAL ORDER');
} else {
  console.log('✅ First letters are not in alphabetical order');
}




