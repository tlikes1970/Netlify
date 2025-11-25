/**
 * Calculate FlickWord words using FIXED logic
 * Uses the same algorithm as the fixed dailyWordApi.ts
 */

const COMMON_WORDS = [
  "about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult", "after", "again",
  "agent", "agree", "ahead", "alarm", "album", "alert", "alien", "align", "alike", "alive",
  "allow", "alone", "along", "alter", "among", "anger", "angle", "angry", "apart", "apple",
  "apply", "arena", "argue", "arise", "array", "aside", "asset", "avoid", "awake", "aware",
  "award", "badly", "basic", "beach", "began", "begin", "being", "below", "bench", "birth",
  "black", "blame", "blank", "blind", "block", "blood", "board", "boost", "booth", "bound",
  "brain", "brand", "brave", "bread", "break", "breed", "brief", "bring", "broad", "broke",
  "brown", "build", "built", "buyer", "cable", "calif", "carry", "catch", "cause", "chain",
  "chair", "chaos", "charm", "chart", "chase", "cheap", "check", "chest", "chief", "child",
  "china", "chose", "civil", "claim", "class", "clean", "clear", "click", "climb", "clock",
  "close", "cloud", "coach", "coast", "could", "count", "court", "cover", "craft", "crash",
  "crazy", "cream", "crime", "cross", "crowd", "crown", "crude", "curve", "cycle", "daily",
  "dance", "dated", "dealt", "death", "debut", "delay", "depth", "doing", "doubt", "dozen",
  "draft", "drama", "drank", "dream", "dress", "drill", "drink", "drive", "drove", "dying",
  "eager", "early", "earth", "eight", "elite", "empty", "enemy", "enjoy", "enter", "entry",
  "equal", "error", "event", "every", "exact", "exist", "extra", "faith", "false", "fault",
  "fiber", "field", "fifth", "fifty", "fight", "final", "first", "fixed", "flash", "fleet",
  "floor", "fluid", "focus", "force", "forth", "forty", "forum", "found", "frame", "frank",
  "fraud", "fresh", "front", "fruit", "fully", "funny", "giant", "given", "glass", "globe",
  "going", "grace", "grade", "grand", "grant", "grass", "grave", "great", "green", "gross",
  "group", "grown", "guard", "guess", "guest", "guide", "happy", "harry", "heart", "heavy",
  "hello", "hence", "holly", "hopes", "horse", "hotel", "house", "human", "ideal", "image", "index", "inner", "input",
  "issue", "japan", "jimmy", "joint", "jones", "judge", "known", "label", "large", "laser",
  "later", "laugh", "layer", "learn", "lease", "least", "leave", "legal", "level", "lewis",
  "light", "limit", "links", "lives", "local", "logic", "loose", "lower", "lucky", "lunch",
  "lying", "magic", "major", "maker", "march", "maria", "match", "maybe", "mayor", "meant",
  "media", "metal", "might", "minor", "minus", "mixed", "model", "money", "month", "moral",
  "motor", "mount", "mouse", "mouth", "moved", "movie", "music", "needs", "never", "newly",
  "night", "noise", "north", "noted", "novel", "nurse", "occur", "ocean", "offer", "often",
  "order", "other", "ought", "paint", "panel", "paper", "party", "peace", "penny", "peter",
  "phase", "phone", "photo", "piece", "pilot", "pitch", "place", "plain", "plane", "plant",
  "plate", "point", "pound", "power", "press", "price", "pride", "prime", "print", "prior",
  "prize", "proof", "proud", "prove", "queen", "quick", "quiet", "quite", "radio", "raise",
  "range", "rapid", "ratio", "reach", "ready", "realm", "rebel", "refer", "relax", "reply",
  "right", "rigid", "rival", "river", "robin", "roger", "roman", "rough", "round", "route",
  "royal", "rural", "scale", "scene", "scope", "score", "sense", "serve", "seven", "shall",
  "shape", "share", "sharp", "sheet", "shelf", "shell", "shift", "shine", "shirt", "shock",
  "shoot", "short", "shown", "sides", "sight", "silly", "since", "sixth", "sixty", "sized",
  "skill", "sleep", "slide", "small", "smart", "smile", "smith", "smoke", "snake", "solid",
  "solve", "sorry", "sound", "south", "space", "spare", "speak", "speed", "spend", "spent",
  "split", "spoke", "sport", "staff", "stage", "stake", "stand", "start", "state", "steam",
  "steel", "stick", "still", "stock", "stone", "stood", "store", "storm", "story", "strip",
  "stuck", "study", "stuff", "style", "sugar", "suite", "super", "sweet", "table", "taken",
  "taste", "taxes", "teach", "teeth", "thank", "theft", "their", "theme", "there", "these",
  "thick", "thing", "think", "third", "those", "three", "threw", "throw", "thumb", "tight",
  "times", "tired", "title", "today", "topic", "total", "touch", "tough", "tower", "track",
  "trade", "train", "treat", "trend", "trial", "tribe", "trick", "tried", "tries", "truck",
  "truly", "trust", "truth", "twice", "uncle", "under", "union", "unity", "until", "upper",
  "upset", "urban", "usage", "usual", "valid", "value", "video", "virus", "visit", "vital",
  "voice", "waste", "watch", "water", "wheel", "where", "which", "while", "white", "whole",
  "whose", "woman", "women", "world", "worry", "worse", "worst", "worth", "would", "wound",
  "write", "wrong", "wrote", "young", "youth"
];

const EXCLUDED_WORDS = new Set(['hollo', 'heres', 'drily', 'gonif']);

function isExcluded(word) {
  return EXCLUDED_WORDS.has(word.toLowerCase());
}

function getDailySeedDate(date = null) {
  const d = date ? new Date(date + 'T00:00:00Z') : new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// FIXED: Core selection logic - shared by all paths
function getDeterministicWordForDate(date, gameNumber, validWords, providedRecentWords = null) {
  // Use provided recent words if available, otherwise calculate them
  const recentWords = providedRecentWords !== null 
    ? providedRecentWords 
    : getRecentWords(14, gameNumber, validWords, date);
  
  // CRITICAL: Prevent ALL patterns
  const problematicLetters = new Set();
  const problematicWords = new Set();
  
  // Rule 1: NEVER repeat the last word's first letter
  if (recentWords.length > 0) {
    const lastWord = recentWords[recentWords.length - 1];
    const lastWordFirstLetter = lastWord.charAt(0).toLowerCase();
    problematicLetters.add(lastWordFirstLetter);
  }
  
  // Rule 2: Detect alphabetical order in WORDS (not just first letters)
  if (recentWords.length >= 3) {
    const lastThree = recentWords.slice(-3).map(w => w.toLowerCase());
    let isAlphabetical = true;
    for (let i = 1; i < lastThree.length; i++) {
      if (lastThree[i] <= lastThree[i - 1]) {
        isAlphabetical = false;
        break;
      }
    }
    
    if (isAlphabetical) {
      const lastWord = lastThree[lastThree.length - 1];
      problematicWords.add(lastWord);
    }
  }
  
  // Rule 3: Check for alphabetical first letters pattern
  if (recentWords.length >= 3) {
    const lastThree = recentWords.slice(-3);
    const lastThreeLetters = lastThree.map(w => w.charAt(0).toLowerCase());
    let firstLettersAlphabetical = true;
    for (let i = 1; i < lastThreeLetters.length; i++) {
      if (lastThreeLetters[i] <= lastThreeLetters[i - 1]) {
        firstLettersAlphabetical = false;
        break;
      }
    }
    
    if (firstLettersAlphabetical) {
      const lastLetter = lastThreeLetters[lastThreeLetters.length - 1];
      const nextLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
      if (nextLetter <= 'z') {
        problematicLetters.add(nextLetter);
      }
    }
  }
  
  // CRITICAL FIX: Use complex seed to avoid sequential patterns
  const epochDate = new Date('2000-01-01');
  const currentDate = new Date(date + 'T00:00:00Z');
  const daysSinceEpoch = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = daysSinceEpoch % 365;
  
  // Use prime numbers to break sequential patterns
  const seed1 = cycleDay * 7919;
  const seed2 = (gameNumber - 1) * 9973;
  const combinedSeed = (seed1 + seed2) % validWords.length;
  const baseIndex = combinedSeed;
  
  // Find a word that passes all checks
  let candidateIndex = baseIndex;
  let attempts = 0;
  const maxAttempts = validWords.length;
  
  while (attempts < maxAttempts) {
    const candidateWord = validWords[candidateIndex].toUpperCase();
    const candidateLower = candidateWord.toLowerCase();
    const candidateFirstLetter = candidateLower.charAt(0);
    
    const isRecent = recentWords.some(w => w.toLowerCase() === candidateLower);
    const startsWithProblematic = problematicLetters.has(candidateFirstLetter);
    
    // Check: prevent alphabetical word continuation
    let continuesAlphabeticalWordPattern = false;
    if (recentWords.length >= 2 && problematicWords.size > 0) {
      const lastWord = recentWords[recentWords.length - 1].toLowerCase();
      const secondLastWord = recentWords[recentWords.length - 2].toLowerCase();
      if (secondLastWord < lastWord && lastWord < candidateLower) {
        continuesAlphabeticalWordPattern = true;
      }
    }
    
    // Check: prevent alphabetical first-letter continuation
    let continuesAlphabeticalLetterPattern = false;
    if (recentWords.length >= 2 && !startsWithProblematic) {
      const lastTwo = recentWords.slice(-2).map(w => w.charAt(0).toLowerCase());
      const lastLetter = lastTwo[lastTwo.length - 1];
      const secondLastLetter = lastTwo[lastTwo.length - 2];
      if (secondLastLetter < lastLetter && lastLetter < candidateFirstLetter) {
        continuesAlphabeticalLetterPattern = true;
      }
    }
    
    if (!isRecent && !startsWithProblematic && !continuesAlphabeticalWordPattern && !continuesAlphabeticalLetterPattern) {
      return candidateWord;
    }
    
    candidateIndex = (candidateIndex + 1) % validWords.length;
    attempts++;
  }
  
  // Fallback: prioritize avoiding problematic letters and patterns
  if (problematicLetters.size > 0 || problematicWords.size > 0) {
    candidateIndex = baseIndex;
    attempts = 0;
    while (attempts < maxAttempts) {
      const candidateWord = validWords[candidateIndex].toUpperCase();
      const candidateLower = candidateWord.toLowerCase();
      const candidateFirstLetter = candidateLower.charAt(0);
      const startsWithProblematic = problematicLetters.has(candidateFirstLetter);
      
      let continuesAlphabeticalWordPattern = false;
      if (recentWords.length >= 2 && problematicWords.size > 0) {
        const lastWord = recentWords[recentWords.length - 1].toLowerCase();
        const secondLastWord = recentWords[recentWords.length - 2].toLowerCase();
        if (secondLastWord < lastWord && lastWord < candidateLower) {
          continuesAlphabeticalWordPattern = true;
        }
      }
      
      let continuesAlphabeticalLetterPattern = false;
      if (recentWords.length >= 2 && !startsWithProblematic) {
        const lastTwo = recentWords.slice(-2).map(w => w.charAt(0).toLowerCase());
        const lastLetter = lastTwo[lastTwo.length - 1];
        const secondLastLetter = lastTwo[lastTwo.length - 2];
        if (secondLastLetter < lastLetter && lastLetter < candidateFirstLetter) {
          continuesAlphabeticalLetterPattern = true;
        }
      }
      
      if (!startsWithProblematic && !continuesAlphabeticalWordPattern && !continuesAlphabeticalLetterPattern) {
        return candidateWord;
      }
      
      candidateIndex = (candidateIndex + 1) % validWords.length;
      attempts++;
    }
  }
  
  // Final fallback
  return validWords[baseIndex].toUpperCase();
}

// FIXED: Build recent words progressively using actual selections
function getRecentWords(days, gameNumber, validWords, currentDate) {
  const recentWords = [];
  const today = new Date(currentDate + 'T00:00:00Z');
  
  // Build progressively, using previously selected words
  for (let i = 1; i <= days; i++) {
    const pastDate = new Date(today);
    pastDate.setUTCDate(pastDate.getUTCDate() - i);
    const pastDateStr = getDailySeedDate(pastDate.toISOString().split('T')[0]);
    
    // Use previously selected words as recent words
    const wordsBeforeThisDate = recentWords.slice();
    
    // Use the same selection logic
    const word = getDeterministicWordForDate(pastDateStr, gameNumber, validWords, wordsBeforeThisDate);
    
    if (word) {
      // Add to front (most recent first)
      recentWords.unshift(word);
    }
  }
  
  return recentWords;
}

function getDeterministicWord(date, gameNumber = 1) {
  const validWords = COMMON_WORDS.filter(w => !isExcluded(w));
  
  if (validWords.length === 0) {
    const fallbackWords = ['HOUSE', 'CRANE', 'BLISS'];
    return fallbackWords[(gameNumber - 1) % fallbackWords.length];
  }
  
  // Use shared selection logic
  return getDeterministicWordForDate(date, gameNumber, validWords);
}

// Calculate words
const today = getDailySeedDate();
console.log(`Today's date (UTC): ${today}\n`);

console.log('=== LAST 3 WORDS (Game 1) ===');
for (let i = 3; i >= 1; i--) {
  const date = new Date(today + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - i);
  const dateStr = getDailySeedDate(date.toISOString().split('T')[0]);
  const word = getDeterministicWord(dateStr, 1);
  console.log(`${dateStr}: ${word}`);
}

console.log('\n=== TODAY\'S WORD (Game 1) ===');
const todayWord = getDeterministicWord(today, 1);
console.log(`${today}: ${todayWord}`);

console.log('\n=== NEXT 6 WORDS (Game 1) - USING FIXED LOGIC ===');
// CRITICAL: Build progressively so each word knows about previously calculated future words
const futureWords = [];
for (let i = 1; i <= 6; i++) {
  const date = new Date(today + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + i);
  const dateStr = getDailySeedDate(date.toISOString().split('T')[0]);
  
  // Get past words (last 14 days) for this date
  const pastWords = getRecentWords(14, 1, COMMON_WORDS.filter(w => !isExcluded(w)), dateStr);
  
  // Combine past words with previously calculated future words
  // This ensures we check against ALL words that will come before this one
  const allPreviousWords = [...pastWords, ...futureWords];
  
  // Use the shared function with all previous words
  const word = getDeterministicWordForDate(dateStr, 1, COMMON_WORDS.filter(w => !isExcluded(w)), allPreviousWords);
  futureWords.push(word);
  console.log(`${dateStr}: ${word}`);
}

// Verify no patterns
console.log('\n=== PATTERN CHECK ===');
const firstLetters = futureWords.map(w => w.charAt(0).toLowerCase());
console.log('First letters:', firstLetters.join(', '));

let hasRepeats = false;
for (let i = 1; i < firstLetters.length; i++) {
  if (firstLetters[i] === firstLetters[i - 1]) {
    console.log(`❌ ${futureWords[i]} repeats first letter from ${futureWords[i - 1]}`);
    hasRepeats = true;
  }
}

if (!hasRepeats) {
  console.log('✅ No repeated first letters');
}

