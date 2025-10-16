#!/usr/bin/env node

/**
 * Token Verification Script
 * Purpose: Scan legacy token files and print duplicate analysis
 * Usage: npm run verify:tokens
 */

const fs = require('fs');
const path = require('path');

// Token file paths
const DESIGN_TOKENS_PATH = path.join(__dirname, '../www/styles/design-tokens.css');
const TOKENS_PATH = path.join(__dirname, '../www/styles/tokens.css');

/**
 * Parse CSS file and extract CSS custom properties
 * @param {string} filePath - Path to CSS file
 * @returns {Array} Array of {name, value, line} objects
 */
function parseCSSVariables(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const variables = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // Match CSS custom properties: --variable-name: value;
    const match = trimmed.match(/^--([a-zA-Z0-9-]+):\s*(.+?);?\s*$/);
    if (match) {
      variables.push({
        name: `--${match[1]}`,
        value: match[2].replace(/;$/, '').trim(),
        line: index + 1,
        file: path.basename(filePath)
      });
    }
  });

  return variables;
}

/**
 * Find duplicate variable names between two files
 * @param {Array} vars1 - Variables from first file
 * @param {Array} vars2 - Variables from second file
 * @returns {Array} Array of duplicate objects
 */
function findDuplicates(vars1, vars2) {
  const duplicates = [];
  const nameMap = new Map();

  // Index variables by name
  vars1.forEach(v => nameMap.set(v.name, { ...v, source: 'design-tokens' }));
  vars2.forEach(v => {
    if (nameMap.has(v.name)) {
      const existing = nameMap.get(v.name);
      duplicates.push({
        name: v.name,
        designTokens: existing,
        tokens: { ...v, source: 'tokens' }
      });
    }
  });

  return duplicates;
}

/**
 * Print formatted table of duplicates
 * @param {Array} duplicates - Array of duplicate objects
 */
function printDuplicateTable(duplicates) {
  if (duplicates.length === 0) {
    console.log('✅ No duplicate CSS variables found');
    return;
  }

  console.log('\n📊 CSS Variable Duplicates Analysis');
  console.log('=====================================');
  console.log('Variable Name'.padEnd(25) + 'Design Tokens'.padEnd(15) + 'Tokens'.padEnd(15) + 'Conflict');
  console.log('-'.repeat(70));

  duplicates.forEach(dup => {
    const name = dup.name.padEnd(25);
    const dtValue = dup.designTokens.value.padEnd(15);
    const tValue = dup.tokens.value.padEnd(15);
    const conflict = dup.designTokens.value === dup.tokens.value ? 'No' : 'Yes';
    
    console.log(`${name}${dtValue}${tValue}${conflict}`);
  });

  console.log('\n📋 Summary:');
  console.log(`Total duplicates: ${duplicates.length}`);
  console.log(`Conflicts: ${duplicates.filter(d => d.designTokens.value !== d.tokens.value).length}`);
  console.log(`No conflicts: ${duplicates.filter(d => d.designTokens.value === d.tokens.value).length}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Token Verification Script');
  console.log('============================');

  // Parse both token files
  const designTokens = parseCSSVariables(DESIGN_TOKENS_PATH);
  const tokens = parseCSSVariables(TOKENS_PATH);

  console.log(`📁 Design Tokens: ${designTokens.length} variables`);
  console.log(`📁 Tokens: ${tokens.length} variables`);

  // Find duplicates
  const duplicates = findDuplicates(designTokens, tokens);
  
  // Print results
  printDuplicateTable(duplicates);

  // Exit with error code if conflicts found
  const conflicts = duplicates.filter(d => d.designTokens.value !== d.tokens.value);
  if (conflicts.length > 0) {
    console.log('\n⚠️  Conflicts detected! See /reports/tokens-alias-map.csv for resolution plan.');
    process.exit(1);
  } else {
    console.log('\n✅ All token conflicts resolved or documented.');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseCSSVariables, findDuplicates };
