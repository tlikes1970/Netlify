// Source Code Analysis - Check for API key exposures and direct TMDB calls
console.log('🔍 SOURCE CODE ANALYSIS - API Key Security Check');
console.log('='.repeat(60));

// This script should be run in Node.js to analyze source files
// Run with: node source-code-analysis.js

const fs = require('fs');
const path = require('path');

// Patterns to search for
const patterns = {
  apiKey: /api_key\s*[=:]\s*['"`][^'"`]+['"`]/g,
  tmdbApi: /api\.themoviedb\.org/g,
  tmdbConfig: /TMDB_CONFIG/g,
  hardcodedKeys: [
    'b7247bb415b50f25b5e35e2566430b96',
    'your-api-key-here',
    'YOUR_TMDB_API_KEY_HERE'
  ],
  directFetch: /fetch\([^)]*api\.themoviedb\.org[^)]*\)/g
};

// Files to check
const filesToCheck = [
  'www/index.html',
  'www/scripts/tmdb.js',
  'www/scripts/curated-rows.js',
  'www/scripts/home.js',
  'www/scripts/theaters-near-me.js',
  'www/js/functions.js',
  'www/js/language-manager.js',
  'www/tmdb-config.js'
];

let issues = [];

function analyzeFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`\n📁 Analyzing: ${filePath}`);
    
    // Check for API key patterns
    const apiKeyMatches = content.match(patterns.apiKey);
    if (apiKeyMatches) {
      issues.push({
        file: filePath,
        type: 'API_KEY_EXPOSURE',
        matches: apiKeyMatches,
        lines: findLineNumbers(content, patterns.apiKey)
      });
      console.log(`❌ Found API key exposures: ${apiKeyMatches.length}`);
    }
    
    // Check for direct TMDB API calls
    const tmdbApiMatches = content.match(patterns.tmdbApi);
    if (tmdbApiMatches) {
      issues.push({
        file: filePath,
        type: 'DIRECT_TMDB_CALLS',
        matches: tmdbApiMatches,
        lines: findLineNumbers(content, patterns.tmdbApi)
      });
      console.log(`❌ Found direct TMDB API calls: ${tmdbApiMatches.length}`);
    }
    
    // Check for hardcoded keys
    patterns.hardcodedKeys.forEach(key => {
      if (content.includes(key)) {
        issues.push({
          file: filePath,
          type: 'HARDCODED_KEY',
          key: key,
          lines: findLineNumbers(content, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
        });
        console.log(`❌ Found hardcoded key: ${key}`);
      }
    });
    
    // Check for direct fetch calls
    const fetchMatches = content.match(patterns.directFetch);
    if (fetchMatches) {
      issues.push({
        file: filePath,
        type: 'DIRECT_FETCH_CALLS',
        matches: fetchMatches,
        lines: findLineNumbers(content, patterns.directFetch)
      });
      console.log(`❌ Found direct fetch calls: ${fetchMatches.length}`);
    }
    
    if (!apiKeyMatches && !tmdbApiMatches && !patterns.hardcodedKeys.some(key => content.includes(key)) && !fetchMatches) {
      console.log(`✅ No security issues found`);
    }
    
  } catch (error) {
    console.log(`❌ Error analyzing ${filePath}: ${error.message}`);
  }
}

function findLineNumbers(content, pattern) {
  const lines = content.split('\n');
  const lineNumbers = [];
  
  lines.forEach((line, index) => {
    if (pattern.test(line)) {
      lineNumbers.push(index + 1);
    }
  });
  
  return lineNumbers;
}

// Analyze all files
console.log('🔍 Starting source code analysis...\n');

filesToCheck.forEach(analyzeFile);

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 ANALYSIS SUMMARY');
console.log('='.repeat(60));

if (issues.length === 0) {
  console.log('✅ NO SECURITY ISSUES FOUND');
  console.log('✅ All files are properly secured');
} else {
  console.log(`❌ FOUND ${issues.length} SECURITY ISSUES:`);
  
  issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. ${issue.type} in ${issue.file}`);
    if (issue.lines) {
      console.log(`   Lines: ${issue.lines.join(', ')}`);
    }
    if (issue.matches) {
      console.log(`   Matches: ${issue.matches.slice(0, 3).join(', ')}${issue.matches.length > 3 ? '...' : ''}`);
    }
    if (issue.key) {
      console.log(`   Key: ${issue.key}`);
    }
  });
}

console.log('\n🔧 Next steps:');
if (issues.length > 0) {
  console.log('1. Fix all identified security issues');
  console.log('2. Replace direct API calls with proxy calls');
  console.log('3. Remove hardcoded API keys');
  console.log('4. Re-run this analysis until clean');
} else {
  console.log('1. Proceed with deployment');
  console.log('2. Set environment variables');
  console.log('3. Test in production');
}
