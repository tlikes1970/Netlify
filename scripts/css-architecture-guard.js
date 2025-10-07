#!/usr/bin/env node
/**
 * CSS Architecture Guard
 * Prevents CSS rule duplication and enforces single source of truth
 */

const fs = require('fs');
const path = require('path');

// Define file responsibilities
const FILE_RESPONSIBILITIES = {
  'home-layout.css': {
    purpose: 'Home page layout ONLY',
    forbiddenPatterns: [
      /\.tab-section|\.search|\.navigation|\.header|\.footer/,
      /\.modal|\.popup|\.dropdown/
    ],
    requiredPatterns: [
      /#homeSection|\.home-group|\.home-preview-row/
    ]
  },
  'main.css': {
    purpose: 'Global styles, utilities, non-home layouts',
    forbiddenPatterns: [
      /#homeSection.*\.home-preview-row/,
      /#homeSection.*\.section-content/,
      /#group-\d+-\w+/
    ]
  },
  'components.css': {
    purpose: 'Reusable component styles',
    forbiddenPatterns: [
      /#homeSection|\.home-group/
    ]
  }
};

function checkCSSArchitecture() {
  const stylesDir = path.join(__dirname, '..', 'www', 'styles');
  const issues = [];
  
  for (const [filename, rules] of Object.entries(FILE_RESPONSIBILITIES)) {
    const filePath = path.join(stylesDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filename}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check forbidden patterns
    for (const pattern of rules.forbiddenPatterns) {
      const matches = content.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        issues.push({
          file: filename,
          type: 'FORBIDDEN_PATTERN',
          pattern: pattern.source,
          matches: matches.length,
          message: `${filename} contains forbidden pattern: ${pattern.source}`
        });
      }
    }
    
    // Check required patterns for home-layout.css
    if (filename === 'home-layout.css') {
      for (const pattern of rules.requiredPatterns) {
        if (!pattern.test(content)) {
          issues.push({
            file: filename,
            type: 'MISSING_REQUIRED_PATTERN',
            pattern: pattern.source,
            message: `${filename} missing required pattern: ${pattern.source}`
          });
        }
      }
    }
  }
  
  return issues;
}

function main() {
  console.log('🔍 CSS Architecture Guard - Checking for rule conflicts...\n');
  
  const issues = checkCSSArchitecture();
  
  if (issues.length === 0) {
    console.log('✅ CSS Architecture is clean - no conflicts found!');
    process.exit(0);
  }
  
  console.log('❌ CSS Architecture violations found:\n');
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.message}`);
    console.log(`   File: ${issue.file}`);
    console.log(`   Pattern: ${issue.pattern}`);
    if (issue.matches) {
      console.log(`   Matches: ${issue.matches}`);
    }
    console.log('');
  });
  
  console.log('🔧 Fix these issues to maintain single source of truth!');
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { checkCSSArchitecture };
