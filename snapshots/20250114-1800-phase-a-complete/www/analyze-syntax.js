const fs = require('fs');

// Read the file
const content = fs.readFileSync('scripts/inline-script-02.js', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let parenCount = 0;
let issues = [];

console.log('Analyzing syntax in inline-script-02.js...\n');

for(let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  for(let char of line) {
    if(char === '{') braceCount++;
    if(char === '}') braceCount--;
    if(char === '(') parenCount++;
    if(char === ')') parenCount--;
  }
  
  if(braceCount < 0) {
    issues.push(`Line ${lineNum}: Negative brace count ${braceCount}`);
    console.log(`❌ Line ${lineNum}: ${line.trim()}`);
  }
  if(parenCount < 0) {
    issues.push(`Line ${lineNum}: Negative paren count ${parenCount}`);
    console.log(`❌ Line ${lineNum}: ${line.trim()}`);
  }
}

console.log('\n=== ANALYSIS RESULTS ===');
console.log('Final brace count:', braceCount);
console.log('Final paren count:', parenCount);
console.log('Total issues found:', issues.length);

if(issues.length > 0) {
  console.log('\nIssues:');
  issues.forEach(issue => console.log('  -', issue));
} else {
  console.log('\n✅ No syntax issues found in brace/paren counting');
}

// Check for specific patterns that might indicate issues
console.log('\n=== PATTERN ANALYSIS ===');

// Look for IIFE patterns
const iifePatterns = [];
for(let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if(line.includes('(function()') || line.includes('(() =>')) {
    iifePatterns.push(`Line ${i+1}: ${line.trim()}`);
  }
  if(line.includes('})();') || line.includes('})();')) {
    iifePatterns.push(`Line ${i+1}: ${line.trim()}`);
  }
}

console.log('IIFE patterns found:');
iifePatterns.forEach(pattern => console.log('  -', pattern));









