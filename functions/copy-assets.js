/**
 * Cross-platform script to copy bad-words.json to lib/ directory
 */
const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'src', 'bad-words.json');
const destFile = path.join(__dirname, 'lib', 'src', 'bad-words.json');
const libSrcDir = path.join(__dirname, 'lib', 'src');

// Ensure lib/src directory exists
if (!fs.existsSync(libSrcDir)) {
  fs.mkdirSync(libSrcDir, { recursive: true });
}

// Copy file
if (fs.existsSync(srcFile)) {
  fs.copyFileSync(srcFile, destFile);
  console.log('✓ Copied bad-words.json to lib/src/');
} else {
  console.warn('⚠ bad-words.json not found in src/');
}


























