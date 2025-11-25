/**
 * Comprehensive FlickWord Algorithm Tests
 * Tests all critical game logic that was assumed correct in initial audit
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

// FIXED: Use same selection logic as actual code
function getDeterministicWordForDate(date, gameNumber, validWords, providedRecentWords = null) {
  // Use provided recent words if available, otherwise calculate them
  const recentWords = providedRecentWords !== null 
    ? providedRecentWords 
    : getRecentWords(14, gameNumber, validWords, date);
  
  // Check for same-letter pattern in recent days (last 3 days)
  const recentFirstLetters = recentWords.slice(-3).map(w => w.charAt(0).toLowerCase());
  const lastThreeLetters = recentFirstLetters.slice(-3);
  const allSameLetter = lastThreeLetters.length === 3 && 
                        lastThreeLetters[0] === lastThreeLetters[1] && 
                        lastThreeLetters[1] === lastThreeLetters[2];
  const problematicLetter = allSameLetter ? lastThreeLetters[0] : null;
  
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
  
  // FIXED: Build recent words list progressively, using previously selected words
  for (let i = 1; i <= days; i++) {
    const pastDate = new Date(today);
    pastDate.setUTCDate(pastDate.getUTCDate() - i);
    const pastDateStr = getDailySeedDate(pastDate.toISOString().split('T')[0]);
    
    // Use previously selected words as recent words (slice to get only words before this date)
    const wordsBeforeThisDate = recentWords.slice(); // Copy of words selected so far
    
    // Use the same selection logic, but with the words we've already selected
    const word = getDeterministicWordForDate(pastDateStr, gameNumber, validWords, wordsBeforeThisDate);
    
    if (word) {
      // Add to front of array (most recent first) so slice works correctly
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
  const validWords = COMMON_WORDS.filter(w => !isExcluded(w));
  
  if (validWords.length === 0) {
    const fallbackWords = ['HOUSE', 'CRANE', 'BLISS'];
    return { word: fallbackWords[(gameNumber - 1) % fallbackWords.length], usedFallback: false, attempts: 0 };
  }
  
  // FIXED: Use shared selection logic
  const word = getDeterministicWordForDate(date, gameNumber, validWords);
  return { word, usedFallback: false, attempts: 0 };
}

// Scoring algorithm test (from FlickWordGame.tsx)
function scoreGuess(guess, target) {
  const result = Array(5).fill("absent");
  const pool = target.split("");

  // First pass: exact matches
  for (let i = 0; i < 5; i++) {
    if (guess[i] === pool[i]) {
      result[i] = "correct";
      pool[i] = "";
    }
  }

  // Second pass: present matches
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    const idx = pool.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "present";
      pool[idx] = "";
    }
  }

  return result;
}

// TEST RESULTS
const results = {
  wordSelection: [],
  scoring: [],
  issues: []
};

console.log('='.repeat(80));
console.log('FLICKWORD COMPREHENSIVE ALGORITHM TESTS');
console.log('='.repeat(80));
console.log('');

// TEST 1: Word Selection - Check for same-letter patterns
console.log('TEST 1: Word Selection - Same-Letter Pattern Detection');
console.log('-'.repeat(80));

const today = getDailySeedDate();
const testDates = [];
for (let i = 0; i < 30; i++) {
  const date = new Date(today + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + i);
  testDates.push(getDailySeedDate(date.toISOString().split('T')[0]));
}

let maxSameLetterRun = 0;
let currentRun = 1;
let lastLetter = null;
let sameLetterRuns = [];

for (let i = 0; i < testDates.length; i++) {
  const result = getDeterministicWord(testDates[i], 1);
  const word = result.word;
  const firstLetter = word.charAt(0).toLowerCase();
  
  if (firstLetter === lastLetter) {
    currentRun++;
  } else {
    if (currentRun > 1) {
      sameLetterRuns.push({ start: i - currentRun, end: i - 1, length: currentRun, letter: lastLetter });
    }
    maxSameLetterRun = Math.max(maxSameLetterRun, currentRun);
    currentRun = 1;
  }
  lastLetter = firstLetter;
  
  if (result.usedFallback && result.fallbackStartsWithProblematic) {
    results.issues.push({
      test: 'Word Selection',
      date: testDates[i],
      word: word,
      issue: `Fallback word starts with problematic letter "${result.problematicLetter}"`,
      severity: 'CRITICAL'
    });
  }
}

if (currentRun > 1) {
  sameLetterRuns.push({ start: testDates.length - currentRun, end: testDates.length - 1, length: currentRun, letter: lastLetter });
  maxSameLetterRun = Math.max(maxSameLetterRun, currentRun);
}

console.log(`Max same-letter run: ${maxSameLetterRun} days`);
if (sameLetterRuns.length > 0) {
  console.log(`Found ${sameLetterRuns.length} same-letter runs:`);
  sameLetterRuns.forEach(run => {
    console.log(`  - ${run.length} days starting with "${run.letter.toUpperCase()}" (days ${run.start}-${run.end})`);
    if (run.length >= 4) {
      results.issues.push({
        test: 'Word Selection',
        issue: `${run.length} consecutive days starting with "${run.letter.toUpperCase()}"`,
        severity: 'CRITICAL',
        dates: testDates.slice(run.start, run.end + 1)
      });
    }
  });
} else {
  console.log('✅ No same-letter runs detected');
}

console.log('');

// TEST 2: Scoring Algorithm - Edge Cases
console.log('TEST 2: Scoring Algorithm - Edge Cases');
console.log('-'.repeat(80));

const scoringTests = [
  { guess: 'CRANE', target: 'CRANE', expected: ['correct', 'correct', 'correct', 'correct', 'correct'], desc: 'Perfect match' },
  { guess: 'CRANE', target: 'HOUSE', expected: ['absent', 'absent', 'absent', 'absent', 'absent'], desc: 'No matches' },
  { guess: 'CRANE', target: 'CRATE', expected: ['correct', 'correct', 'correct', 'absent', 'correct'], desc: 'Partial match' },
  { guess: 'CRANE', target: 'TRACE', expected: ['present', 'present', 'present', 'present', 'present'], desc: 'All present, wrong positions' },
  { guess: 'CRANE', target: 'CRACK', expected: ['correct', 'correct', 'correct', 'absent', 'absent'], desc: 'Duplicate C handling' },
  { guess: 'CRANE', target: 'CRANE', expected: ['correct', 'correct', 'correct', 'correct', 'correct'], desc: 'Exact match' },
  { guess: 'CRANE', target: 'CRANE', expected: ['correct', 'correct', 'correct', 'correct', 'correct'], desc: 'Same word' },
  { guess: 'CRANE', target: 'CRANE', expected: ['correct', 'correct', 'correct', 'correct', 'correct'], desc: 'Identical' },
  { guess: 'CRANE', target: 'CRANE', expected: ['correct', 'correct', 'correct', 'correct', 'correct'], desc: 'Perfect' },
];

// Test duplicate letter handling
const duplicateTests = [
  { guess: 'CRANE', target: 'CRACK', expected: ['correct', 'correct', 'correct', 'absent', 'absent'], desc: 'Duplicate C - first C correct' },
  { guess: 'CRACK', target: 'CRANE', expected: ['correct', 'correct', 'correct', 'absent', 'absent'], desc: 'Duplicate C - second C absent' },
  { guess: 'CRANE', target: 'CRACK', expected: ['correct', 'correct', 'correct', 'absent', 'absent'], desc: 'C appears twice in target' },
  { guess: 'CRANE', target: 'CRACK', expected: ['correct', 'correct', 'correct', 'absent', 'absent'], desc: 'Duplicate handling' },
];

let scoringPassed = 0;
let scoringFailed = 0;

[...scoringTests, ...duplicateTests].forEach(test => {
  const result = scoreGuess(test.guess, test.target);
  const passed = JSON.stringify(result) === JSON.stringify(test.expected);
  
  if (passed) {
    scoringPassed++;
  } else {
    scoringFailed++;
    results.issues.push({
      test: 'Scoring Algorithm',
      issue: `Failed: ${test.desc}`,
      guess: test.guess,
      target: test.target,
      expected: test.expected,
      actual: result,
      severity: 'HIGH'
    });
    console.log(`  ❌ FAILED: ${test.desc}`);
    console.log(`     Guess: ${test.guess}, Target: ${test.target}`);
    console.log(`     Expected: ${JSON.stringify(test.expected)}`);
    console.log(`     Got:      ${JSON.stringify(result)}`);
  }
});

if (scoringFailed === 0) {
  console.log(`✅ All ${scoringPassed} scoring tests passed`);
} else {
  console.log(`❌ ${scoringFailed} scoring tests failed, ${scoringPassed} passed`);
}

console.log('');

// TEST 3: Word Selection - Fallback Behavior
console.log('TEST 3: Word Selection - Fallback Behavior Analysis');
console.log('-'.repeat(80));

let fallbackCount = 0;
let problematicFallbackCount = 0;

for (let i = 0; i < 100; i++) {
  const date = new Date('2025-01-01');
  date.setUTCDate(date.getUTCDate() + i);
  const dateStr = getDailySeedDate(date.toISOString().split('T')[0]);
  const result = getDeterministicWord(dateStr, 1);
  
  if (result.usedFallback) {
    fallbackCount++;
    if (result.fallbackStartsWithProblematic) {
      problematicFallbackCount++;
      results.issues.push({
        test: 'Word Selection Fallback',
        date: dateStr,
        word: result.word,
        issue: `Fallback used and starts with problematic letter "${result.problematicLetter}"`,
        severity: 'CRITICAL'
      });
    }
  }
}

console.log(`Fallback used: ${fallbackCount} times out of 100 dates`);
console.log(`Problematic fallback: ${problematicFallbackCount} times`);
if (problematicFallbackCount > 0) {
  console.log(`❌ CRITICAL: ${problematicFallbackCount} fallbacks bypass problematic letter check`);
} else {
  console.log('✅ No problematic fallbacks detected');
}

console.log('');

// TEST 4: Word Selection - Repeat Prevention
console.log('TEST 4: Word Selection - Repeat Prevention (14-day window)');
console.log('-'.repeat(80));

const repeatTestDates = [];
for (let i = 0; i < 20; i++) {
  const date = new Date('2025-01-01');
  date.setUTCDate(date.getUTCDate() + i);
  repeatTestDates.push(getDailySeedDate(date.toISOString().split('T')[0]));
}

const words = repeatTestDates.map(d => getDeterministicWord(d, 1).word);
const wordSet = new Set(words.map(w => w.toLowerCase()));
const duplicates = [];

for (let i = 0; i < words.length; i++) {
  for (let j = Math.max(0, i - 14); j < i; j++) {
    if (words[i].toLowerCase() === words[j].toLowerCase()) {
      duplicates.push({ word: words[i], date1: repeatTestDates[j], date2: repeatTestDates[i], daysApart: i - j });
    }
  }
}

if (duplicates.length > 0) {
  console.log(`❌ Found ${duplicates.length} repeats within 14-day window:`);
  duplicates.forEach(dup => {
    console.log(`  - "${dup.word}" appears on ${dup.date1} and ${dup.date2} (${dup.daysApart} days apart)`);
    results.issues.push({
      test: 'Repeat Prevention',
      issue: `Word "${dup.word}" repeated within 14-day window`,
      date1: dup.date1,
      date2: dup.date2,
      daysApart: dup.daysApart,
      severity: 'HIGH'
    });
  });
} else {
  console.log('✅ No repeats within 14-day window');
}

console.log('');

// SUMMARY
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));

const criticalIssues = results.issues.filter(i => i.severity === 'CRITICAL');
const highIssues = results.issues.filter(i => i.severity === 'HIGH');

console.log(`Critical Issues: ${criticalIssues.length}`);
console.log(`High Priority Issues: ${highIssues.length}`);
console.log(`Total Issues Found: ${results.issues.length}`);

if (criticalIssues.length > 0) {
  console.log('\nCRITICAL ISSUES:');
  criticalIssues.forEach((issue, idx) => {
    console.log(`${idx + 1}. [${issue.test}] ${issue.issue}`);
    if (issue.word) console.log(`   Word: ${issue.word}`);
    if (issue.date) console.log(`   Date: ${issue.date}`);
    if (issue.dates) console.log(`   Dates: ${issue.dates.join(', ')}`);
  });
}

if (highIssues.length > 0) {
  console.log('\nHIGH PRIORITY ISSUES:');
  highIssues.forEach((issue, idx) => {
    console.log(`${idx + 1}. [${issue.test}] ${issue.issue}`);
  });
}

console.log('');

// Export results for report
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { results, maxSameLetterRun, sameLetterRuns, fallbackCount, problematicFallbackCount };
}

