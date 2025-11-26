// Test repeat prevention logic
const COMMON_WORDS = ["about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult", "after", "again",
  "agent", "agree", "ahead", "alarm", "album", "alert", "alien", "align", "alike", "alive",
  "allow", "alone", "along", "alter", "among", "anger", "angle", "angry", "apart", "apple",
  "apply", "arena", "argue", "arise", "array", "aside", "asset", "avoid", "awake", "aware",
  "award", "badly", "basic", "beach", "began", "begin", "being", "below", "bench", "birth",
  "black", "blame", "blank", "blind", "block", "blood", "board", "boost", "booth", "bound",
  "brain", "brand", "brave", "bread", "break", "breed", "brief", "bring", "broad", "broke",
  "brown", "build", "built", "buyer", "cable", "calif", "carry", "catch", "cause", "chain"];

function getDailySeedDate(date = null) {
  const d = date ? new Date(date + 'T00:00:00Z') : new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRecentWords(days, gameNumber, validWords, currentDate) {
  const recentWords = [];
  const today = new Date(currentDate + 'T00:00:00Z');
  
  for (let i = 1; i <= days; i++) {
    const pastDate = new Date(today);
    pastDate.setUTCDate(pastDate.getUTCDate() - i);
    
    const epochDate = new Date('2000-01-01');
    const daysSinceEpoch = Math.floor((pastDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = daysSinceEpoch % 365;
    const baseIndex = (cycleDay * 3 + (gameNumber - 1)) % validWords.length;
    const word = validWords[baseIndex];
    
    if (word) {
      recentWords.push(word);
    }
  }
  
  return recentWords;
}

// Test: Check if getRecentWords is calculating correctly
console.log('Testing getRecentWords calculation:');
const testDate = '2025-01-15';
const validWords = COMMON_WORDS;

const recent = getRecentWords(14, 1, validWords, testDate);
console.log(`Recent words for ${testDate}:`, recent);

// Check what word would be selected for each of the last 14 days
console.log('\nWords for last 14 days:');
for (let i = 1; i <= 14; i++) {
  const pastDate = new Date(testDate + 'T00:00:00Z');
  pastDate.setUTCDate(pastDate.getUTCDate() - i);
  const dateStr = getDailySeedDate(pastDate.toISOString().split('T')[0]);
  
  const epochDate = new Date('2000-01-01');
  const daysSinceEpoch = Math.floor((pastDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = daysSinceEpoch % 365;
  const baseIndex = (cycleDay * 3 + (1 - 1)) % validWords.length;
  const word = validWords[baseIndex];
  
  console.log(`  ${dateStr}: ${word} (index ${baseIndex}, cycleDay ${cycleDay})`);
}

console.log('\nRecent words array:', recent);



