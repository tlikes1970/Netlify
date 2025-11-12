/**
 * Cross-platform script to copy bad-words.json to lib/ directory
 */
const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'src', 'bad-words.json');
const destFile = path.join(__dirname, 'lib', 'bad-words.json');
const libDir = path.join(__dirname, 'lib');

// Ensure lib directory exists
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

// Copy file
if (fs.existsSync(srcFile)) {
  fs.copyFileSync(srcFile, destFile);
  console.log('✓ Copied bad-words.json to lib/');
} else {
  console.warn('⚠ bad-words.json not found in src/');
}















