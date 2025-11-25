// Test pattern detection logic
const words = ['VALUE', 'VIRUS', 'VOICE', 'WATER', 'WHICH', 'WHOLE'];

console.log('Testing pattern detection:');
console.log('Words:', words.join(', '));

// Check for alphabetical order of WORDS (not just first letters)
let isAlphabetical = true;
for (let i = 1; i < words.length; i++) {
  if (words[i].toLowerCase() <= words[i - 1].toLowerCase()) {
    isAlphabetical = false;
    break;
  }
}

console.log('Words in alphabetical order:', isAlphabetical);

// Check for alphabetical order of FIRST LETTERS
let firstLettersAlphabetical = true;
const firstLetters = words.map(w => w.charAt(0).toLowerCase());
console.log('First letters:', firstLetters.join(', '));

for (let i = 1; i < firstLetters.length; i++) {
  if (firstLetters[i] <= firstLetters[i - 1]) {
    firstLettersAlphabetical = false;
    break;
  }
}

console.log('First letters in alphabetical order:', firstLettersAlphabetical);

// Check for repeated first letters
const repeated = [];
for (let i = 1; i < firstLetters.length; i++) {
  if (firstLetters[i] === firstLetters[i - 1]) {
    repeated.push({ index: i, letter: firstLetters[i] });
  }
}

console.log('Repeated first letters:', repeated);

