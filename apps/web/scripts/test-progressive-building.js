// Test progressive building logic
const COMMON_WORDS = ["about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult", "after", "again",
  "agent", "agree", "ahead", "alarm", "album", "alert", "alien", "align", "alike", "alive",
  "allow", "alone", "along", "alter", "among", "anger", "angle", "angry", "apart", "apple",
  "apply", "arena", "argue", "arise", "array", "aside", "asset", "avoid", "awake", "aware"];

function getDailySeedDate(date = null) {
  const d = date ? new Date(date + 'T00:00:00Z') : new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Simplified selection for testing
function selectWord(date, recentWords, validWords) {
  const epochDate = new Date('2000-01-01');
  const currentDate = new Date(date + 'T00:00:00Z');
  const daysSinceEpoch = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = daysSinceEpoch % 365;
  const seed1 = cycleDay * 7919;
  const baseIndex = seed1 % validWords.length;
  
  // Never repeat last word's first letter
  const problematicLetter = recentWords.length > 0 
    ? recentWords[recentWords.length - 1].charAt(0).toLowerCase()
    : null;
  
  let candidateIndex = baseIndex;
  let attempts = 0;
  
  while (attempts < validWords.length) {
    const candidate = validWords[candidateIndex].toUpperCase();
    const candidateLower = candidate.toLowerCase();
    const candidateFirstLetter = candidateLower.charAt(0);
    
    const isRecent = recentWords.some(w => w.toLowerCase() === candidateLower);
    const startsWithProblematic = problematicLetter && candidateFirstLetter === problematicLetter;
    
    if (!isRecent && !startsWithProblematic) {
      return candidate;
    }
    
    candidateIndex = (candidateIndex + 1) % validWords.length;
    attempts++;
  }
  
  return validWords[baseIndex].toUpperCase();
}

// Test progressive building
const today = '2025-11-24';
const selectedWords = [];

console.log('Testing progressive word selection:');
for (let i = 0; i < 6; i++) {
  const date = new Date(today + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + i);
  const dateStr = getDailySeedDate(date.toISOString().split('T')[0]);
  
  const word = selectWord(dateStr, selectedWords.slice(), COMMON_WORDS);
  selectedWords.push(word);
  console.log(`${dateStr}: ${word}`);
}

console.log('\nFirst letters:', selectedWords.map(w => w.charAt(0).toLowerCase()).join(', '));

// Check for repeated first letters
let hasRepeats = false;
for (let i = 1; i < selectedWords.length; i++) {
  if (selectedWords[i].charAt(0).toLowerCase() === selectedWords[i - 1].charAt(0).toLowerCase()) {
    console.log(`❌ ${selectedWords[i]} repeats first letter from ${selectedWords[i - 1]}`);
    hasRepeats = true;
  }
}

if (!hasRepeats) {
  console.log('✅ No repeated first letters');
}


