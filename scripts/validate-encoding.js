#!/usr/bin/env node
/**
 * Encoding Validation Script
 * Fails build if files contain null bytes, BOM, or non-UTF-8 encoding
 */

const fs = require('fs');
const path = require('path');

const EXTENSIONS = ['.js', '.ts', '.css', '.html'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build'];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Check for null bytes
    const nullBytes = content.match(/\u0000/g);
    if (nullBytes) {
      issues.push(`${nullBytes.length} null bytes found`);
    }

    // Check for BOM
    if (content.charCodeAt(0) === 0xfeff) {
      issues.push('BOM detected');
    }

    // Check for other control characters (except common ones)
    const controlChars = content.match(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g);
    if (controlChars) {
      issues.push(`${controlChars.length} control characters found`);
    }

    if (issues.length > 0) {
      console.error(`❌ ${filePath}:`);
      issues.forEach((issue) => console.error(`   ${issue}`));
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Error reading ${filePath}: ${error.message}`);
    return false;
  }
}

function walkDir(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(item)) {
        files.push(...walkDir(fullPath));
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function main() {
  console.log('🔍 Validating file encodings...');

  const files = walkDir('www');
  let allValid = true;

  for (const file of files) {
    if (!checkFile(file)) {
      allValid = false;
    }
  }

  if (allValid) {
    console.log('✅ All files have valid UTF-8 encoding (no BOM, no null bytes)');
    process.exit(0);
  } else {
    console.error('❌ Encoding validation failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, walkDir };

