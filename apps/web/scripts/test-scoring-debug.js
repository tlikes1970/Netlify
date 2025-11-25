// Debug scoring algorithm
function scoreGuess(guess, target) {
  const result = Array(5).fill("absent");
  const pool = target.split("");

  console.log(`\nScoring: "${guess}" vs "${target}"`);
  console.log(`Initial pool: ${pool.join('')}`);

  // First pass: exact matches
  for (let i = 0; i < 5; i++) {
    if (guess[i] === pool[i]) {
      result[i] = "correct";
      pool[i] = "";
      console.log(`  Position ${i}: "${guess[i]}" = correct (exact match)`);
    }
  }

  console.log(`After exact matches - pool: ${pool.join('')}, result: ${JSON.stringify(result)}`);

  // Second pass: present matches
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") {
      console.log(`  Position ${i}: already correct, skipping`);
      continue;
    }
    const idx = pool.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "present";
      pool[idx] = "";
      console.log(`  Position ${i}: "${guess[i]}" = present (found at pool index ${idx})`);
    } else {
      console.log(`  Position ${i}: "${guess[i]}" = absent (not in pool)`);
    }
  }

  console.log(`Final result: ${JSON.stringify(result)}`);
  return result;
}

// Test the failing cases
console.log('TEST 1: CRANE vs HOUSE (should be all absent)');
scoreGuess('CRANE', 'HOUSE');

console.log('\nTEST 2: CRANE vs TRACE (should be all present)');
scoreGuess('CRANE', 'TRACE');


