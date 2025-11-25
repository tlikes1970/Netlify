/**
 * Calculate FlickWord words for past and future dates
 * Uses the same deterministic logic as the game
 */

// Import the word selection logic
// Note: This runs in Node.js, so we need to adapt the browser code

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

const EXCLUDED_WORDS = new Set([
  'hollo',
  'heres',
  'drily',
  'gonif',
]);

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

// FIXED: Use same selection logic as actual code
function getDeterministicWordForDate(date, gameNumber, validWords, providedRecentWords = null) {
  // Use provided recent words if available, otherwise calculate them
  const recentWords = providedRecentWords !== null 
    ? providedRecentWords 
    : getRecentWords(14, gameNumber, validWords, date);
  
  // Check for same-letter pattern in recent days (last 2 days)
  const recentFirstLetters = recentWords.slice(-3).map(w => w.charAt(0).toLowerCase());
  let problematicLetter = null;
  
  if (recentFirstLetters.length >= 2) {
    // Check if last 2 days start with same letter
    const lastTwo = recentFirstLetters.slice(-2);
    if (lastTwo[0] === lastTwo[1]) {
      problematicLetter = lastTwo[0];
    }
  }
  
  // Calculate base index
  const epochDate = new Date('2000-01-01');
  const currentDate = new Date(date + 'T00:00:00Z');
  const daysSinceEpoch = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = daysSinceEpoch % 365;
  const baseIndex = (cycleDay * 3 + (gameNumber - 1)) % validWords.length;
  
  // Find a word that passes all checks
  let candidateIndex = baseIndex;
  let attempts = 0;
  const maxAttempts = validWords.length;
  
  while (attempts < maxAttempts) {
    const candidateWord = validWords[candidateIndex].toUpperCase();
    const candidateLower = candidateWord.toLowerCase();
    
    const isRecent = recentWords.some(w => w.toLowerCase() === candidateLower);
    const startsWithProblematic = problematicLetter && 
                                  candidateLower.charAt(0) === problematicLetter.toLowerCase();
    
    if (!isRecent && !startsWithProblematic) {
      return candidateWord;
    }
    
    candidateIndex = (candidateIndex + 1) % validWords.length;
    attempts++;
  }
  
  // FIXED: Fallback prioritizes avoiding problematic letter
  if (problematicLetter) {
    candidateIndex = baseIndex;
    attempts = 0;
    while (attempts < maxAttempts) {
      const candidateWord = validWords[candidateIndex].toUpperCase();
      const candidateLower = candidateWord.toLowerCase();
      const startsWithProblematic = candidateLower.charAt(0) === problematicLetter.toLowerCase();
      
      if (!startsWithProblematic) {
        return candidateWord;
      }
      
      candidateIndex = (candidateIndex + 1) % validWords.length;
      attempts++;
    }
  }
  
  // Final fallback
  return validWords[baseIndex].toUpperCase();
}

function getRecentWords(days, gameNumber, validWords, currentDate) {
  const recentWords = [];
  const today = new Date(currentDate + 'T00:00:00Z');
  
  // FIXED: Build recent words list progressively
  for (let i = 1; i <= days; i++) {
    const pastDate = new Date(today);
    pastDate.setUTCDate(pastDate.getUTCDate() - i);
    const pastDateStr = getDailySeedDate(pastDate.toISOString().split('T')[0]);
    
    // Use previously selected words as recent words
    const wordsBeforeThisDate = recentWords.slice();
    
    // Use the same selection logic
    const word = getDeterministicWordForDate(pastDateStr, gameNumber, validWords, wordsBeforeThisDate);
    
    if (word) {
      // Add to front of array (most recent first)
      recentWords.unshift(word);
    }
  }
  
  return recentWords;
}

function getRecentFirstLetters(days, gameNumber, validWords, currentDate) {
  const recentWords = getRecentWords(days, gameNumber, validWords, currentDate);
  return recentWords.map(w => w.charAt(0).toLowerCase());
}

function getDeterministicWord(date, gameNumber = 1) {
  // Filter out excluded words
  const validWords = COMMON_WORDS.filter(w => !isExcluded(w));
  
  if (validWords.length === 0) {
    const fallbackWords = ['HOUSE', 'CRANE', 'BLISS'];
    return fallbackWords[(gameNumber - 1) % fallbackWords.length];
  }
  
  // Get recent words (last 14 days) to avoid repeats
  const recentWords = getRecentWords(14, gameNumber, validWords, date);
  
  // Check for same-letter pattern in recent days (last 3 days)
  const recentFirstLetters = getRecentFirstLetters(3, gameNumber, validWords, date);
  const lastThreeLetters = recentFirstLetters.slice(-3);
  const allSameLetter = lastThreeLetters.length === 3 && 
                        lastThreeLetters[0] === lastThreeLetters[1] && 
                        lastThreeLetters[1] === lastThreeLetters[2];
  const problematicLetter = allSameLetter ? lastThreeLetters[0] : null;
  
  // Calculate base index using date + gameNumber (deterministic seed)
  const epochDate = new Date('2000-01-01');
  const currentDate = new Date(date + 'T00:00:00Z');
  const daysSinceEpoch = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Use a larger cycle to ensure variety (365 days = 1 year cycle)
  const cycleDay = daysSinceEpoch % 365;
  const baseIndex = (cycleDay * 3 + (gameNumber - 1)) % validWords.length;
  
  // Find a word that:
  // 1. Is not in recent words (last 14 days)
  // 2. Doesn't start with problematic letter (if last 3 days all same letter)
  // 3. Is deterministic (same date = same word)
  let candidateIndex = baseIndex;
  let attempts = 0;
  const maxAttempts = validWords.length;
  
  while (attempts < maxAttempts) {
    const candidateWord = validWords[candidateIndex].toUpperCase();
    const candidateLower = candidateWord.toLowerCase();
    
    // Check if word is in recent words
    const isRecent = recentWords.some(w => w.toLowerCase() === candidateLower);
    
    // Check if word starts with problematic letter
    const startsWithProblematic = problematicLetter && 
                                  candidateLower.charAt(0) === problematicLetter.toLowerCase();
    
    // Accept word if it passes all checks
    if (!isRecent && !startsWithProblematic) {
      return candidateWord;
    }
    
    // Try next word (deterministic step)
    candidateIndex = (candidateIndex + 1) % validWords.length;
    attempts++;
  }
  
  // Fallback: if we can't find a perfect match, use base index anyway
  const fallbackWord = validWords[baseIndex].toUpperCase();
  return fallbackWord;
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

console.log('\n=== NEXT 6 WORDS (Game 1) ===');
for (let i = 1; i <= 6; i++) {
  const date = new Date(today + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + i);
  const dateStr = getDailySeedDate(date.toISOString().split('T')[0]);
  const word = getDeterministicWord(dateStr, 1);
  console.log(`${dateStr}: ${word}`);
}

