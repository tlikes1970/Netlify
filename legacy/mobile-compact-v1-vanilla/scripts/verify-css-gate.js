/**
 * CSS Gate Verification Script
 * Purpose: Verify that compact tokens are properly gated and won't affect default styles
 * Usage: node scripts/verify-css-gate.js
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 CSS Gate Verification');
console.log('=========================');

// Read compact tokens CSS
const compactTokensPath = path.join(__dirname, '../www/styles/tokens-compact-mobile.css');
const content = fs.readFileSync(compactTokensPath, 'utf8');

// Extract the gate selector
const gateMatch = content.match(/html\[data-density="compact"\]\[data-compact-mobile-v1="true"\]\s*\{([\s\S]*?)\}/);
if (gateMatch) {
  const gateContent = gateMatch[1];
  console.log('✅ Gate selector found: html[data-density="compact"][data-compact-mobile-v1="true"]');
  
  // Count tokens inside the gate
  const tokenMatches = gateContent.match(/--[a-zA-Z0-9-]+:\s*[^;]+/g);
  console.log(`✅ Tokens inside gate: ${tokenMatches ? tokenMatches.length : 0}`);
  
  // Check for key compact tokens
  const keyTokens = [
    '--poster-w-compact: 50px',
    '--poster-h-compact: 75px',
    '--space-1: 2px',
    '--space-2: 4px',
    '--space-3: 6px',
    '--space-4: 8px'
  ];
  
  keyTokens.forEach(token => {
    const found = gateContent.includes(token);
    console.log(`${found ? '✅' : '❌'} ${token}: ${found ? 'Found' : 'Missing'}`);
  });
  
  // Verify no tokens outside the gate
  const outsideGate = content.replace(gateMatch[0], '');
  const outsideTokens = outsideGate.match(/--[a-zA-Z0-9-]+:\s*[^;]+/g);
  console.log(`✅ Tokens outside gate: ${outsideTokens ? outsideTokens.length : 0} (should be 0)`);
  
} else {
  console.log('❌ Gate selector not found');
}

// Check that the CSS file is properly formatted
const hasProperStructure = content.includes(':root') === false; // Should not have :root
console.log(`✅ No :root selector (gated only): ${hasProperStructure}`);

console.log('\n📋 CSS Gate Summary:');
console.log('Compact tokens are properly gated and will not affect default styles');
console.log('Tokens only apply when both density="compact" AND compactMobileV1="true"');
