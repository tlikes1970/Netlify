/**
 * Trivia Game Comprehensive Audit Tests
 * Tests question selection, Pro vs Free limits, answer validation, etc.
 */

// Mock the question data structure
const SAMPLE_TRIVIA_QUESTIONS = [
  { id: "1", question: "Q1", options: ["A", "B", "C", "D"], correctAnswer: 0 },
  { id: "2", question: "Q2", options: ["A", "B", "C", "D"], correctAnswer: 1 },
  { id: "3", question: "Q3", options: ["A", "B", "C", "D"], correctAnswer: 2 },
  // ... add more as needed
];

function getDailySeedDate(date = null) {
  const d = date ? new Date(date + 'T00:00:00Z') : new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Test question selection logic
function testQuestionSelection() {
  console.log('\n=== TEST: Question Selection Logic ===');
  
  const today = getDailySeedDate();
  const epochDate = new Date('2000-01-01');
  const currentDate = new Date(today + 'T00:00:00Z');
  const daysSinceEpoch = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = daysSinceEpoch % 365;
  
  console.log(`Today: ${today}, Cycle day: ${cycleDay}`);
  
  // Test Regular user (10 questions)
  const regularQuestions = [];
  for (let i = 0; i < 10; i++) {
    const baseIndex = (cycleDay * 30 + i) % SAMPLE_TRIVIA_QUESTIONS.length;
    regularQuestions.push(baseIndex);
  }
  console.log(`Regular user questions (indices):`, regularQuestions);
  
  // Test Pro user Game 1 (questions 0-9)
  const proGame1Questions = [];
  for (let i = 0; i < 10; i++) {
    const baseIndex = (cycleDay * 30 + i) % SAMPLE_TRIVIA_QUESTIONS.length;
    proGame1Questions.push(baseIndex);
  }
  console.log(`Pro Game 1 questions (indices):`, proGame1Questions);
  
  // Test Pro user Game 2 (questions 10-19)
  const proGame2Questions = [];
  for (let i = 10; i < 20; i++) {
    const baseIndex = (cycleDay * 30 + i) % SAMPLE_TRIVIA_QUESTIONS.length;
    proGame2Questions.push(baseIndex);
  }
  console.log(`Pro Game 2 questions (indices):`, proGame2Questions);
  
  // Verify Regular gets same as Pro Game 1
  const matches = regularQuestions.every((q, i) => q === proGame1Questions[i]);
  console.log(`Regular matches Pro Game 1: ${matches ? '✅' : '❌'}`);
  
  // Check for duplicates within games
  const regularDupes = regularQuestions.length !== new Set(regularQuestions).size;
  const proGame1Dupes = proGame1Questions.length !== new Set(proGame1Questions).size;
  const proGame2Dupes = proGame2Questions.length !== new Set(proGame2Questions).size;
  
  console.log(`Regular has duplicates: ${regularDupes ? '❌' : '✅'}`);
  console.log(`Pro Game 1 has duplicates: ${proGame1Dupes ? '❌' : '✅'}`);
  console.log(`Pro Game 2 has duplicates: ${proGame2Dupes ? '❌' : '✅'}`);
}

// Test Pro vs Free limits
function testProFreeLimits() {
  console.log('\n=== TEST: Pro vs Free Limits ===');
  
  const MAX_GAMES_FREE = 1;
  const MAX_GAMES_PRO = 3;
  
  console.log(`Free: ${MAX_GAMES_FREE} game/day (10 questions)`);
  console.log(`Pro: ${MAX_GAMES_PRO} games/day (30 questions total)`);
  
  // Test completion tracking
  const freeCompleted = 1;
  const proCompleted = 2;
  
  const freeCanPlay = freeCompleted < MAX_GAMES_FREE;
  const proCanPlay = proCompleted < MAX_GAMES_PRO;
  
  console.log(`Free (${freeCompleted} completed) can play: ${freeCanPlay ? '✅' : '❌'} (should be false)`);
  console.log(`Pro (${proCompleted} completed) can play: ${proCanPlay ? '✅' : '❌'} (should be true)`);
}

// Test answer validation
function testAnswerValidation() {
  console.log('\n=== TEST: Answer Validation ===');
  
  const question = {
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: 1
  };
  
  // Test correct answer
  const selectedCorrect = 1;
  const isCorrect1 = selectedCorrect === question.correctAnswer;
  console.log(`Selected ${selectedCorrect}, correct is ${question.correctAnswer}: ${isCorrect1 ? '✅ Correct' : '❌ Wrong'}`);
  
  // Test incorrect answer
  const selectedWrong = 0;
  const isCorrect2 = selectedWrong === question.correctAnswer;
  console.log(`Selected ${selectedWrong}, correct is ${question.correctAnswer}: ${isCorrect2 ? '✅ Correct' : '❌ Wrong'}`);
}

// Test share text
function testShareText() {
  console.log('\n=== TEST: Share Text ===');
  
  const today = getDailySeedDate();
  const score = 8;
  const total = 10;
  const percentage = Math.round((score / total) * 100);
  
  // Free user
  const freeShareText = `🧠 Trivia ${today}\n\nScore: ${score}/${total} (${percentage}%)\n\nPlay Trivia at flicklet.app`;
  console.log('Free user share text:');
  console.log(freeShareText);
  console.log(`Contains flicklet.app: ${freeShareText.includes('flicklet.app') ? '❌ Should be flicklet.netlify.app' : '✅'}`);
  
  // Pro user
  const proShareText = `🧠 Trivia ${today} Game 2\n\nScore: ${score}/${total} (${percentage}%)\n\nPlay Trivia at flicklet.app`;
  console.log('\nPro user share text:');
  console.log(proShareText);
  console.log(`Contains flicklet.app: ${proShareText.includes('flicklet.app') ? '❌ Should be flicklet.netlify.app' : '✅'}`);
}

// Run all tests
console.log('================================================================================');
console.log('TRIVIA GAME COMPREHENSIVE AUDIT TESTS');
console.log('================================================================================');

testQuestionSelection();
testProFreeLimits();
testAnswerValidation();
testShareText();

console.log('\n================================================================================');
console.log('TEST SUMMARY');
console.log('================================================================================');






