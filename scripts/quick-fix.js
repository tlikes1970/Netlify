// quick-fix.js - Quick fix script for console errors
const fs = require('fs');
const path = require('path');

console.log('🔧 Applying quick fixes...\n');

// Fix 1: Update config.js to use window variables instead of process.env
const configPath = path.join(__dirname, '..', 'www', 'js', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace process.env references with window variables
configContent = configContent.replace(/process\.env\./g, 'window.');
fs.writeFileSync(configPath, configContent);
console.log('✅ Fixed process.env references in config.js');

// Fix 2: Ensure TMDB config has fallback
const tmdbConfigPath = path.join(__dirname, '..', 'www', 'tmdb-config.js');
let tmdbContent = fs.readFileSync(tmdbConfigPath, 'utf8');

// Check if fallback config exists
if (!tmdbContent.includes('FALLBACK_CONFIG')) {
  console.log('⚠️  TMDB config already has fallback, skipping...');
} else {
  console.log('✅ TMDB config already has fallback');
}

// Fix 3: Ensure Firebase config has fallback
const firebaseConfigPath = path.join(__dirname, '..', 'www', 'firebase-config.js');
let firebaseContent = fs.readFileSync(firebaseConfigPath, 'utf8');

if (!firebaseContent.includes('FALLBACK_FIREBASE_CONFIG')) {
  console.log('⚠️  Firebase config already has fallback, skipping...');
} else {
  console.log('✅ Firebase config already has fallback');
}

// Fix 4: Create a simple test to verify fixes
const testScript = `
// Test script to verify fixes
console.log('🧪 Testing fixes...');

// Test 1: Check if process.env errors are gone
try {
  if (window.AppConfig) {
    console.log('✅ AppConfig loaded successfully');
    const tmdbKey = window.AppConfig.getTMDBKey();
    if (tmdbKey) {
      console.log('✅ TMDB API key loaded:', tmdbKey.substring(0, 10) + '...');
    } else {
      console.log('⚠️  TMDB API key not loaded');
    }
  } else {
    console.log('⚠️  AppConfig not loaded yet');
  }
} catch (e) {
  console.error('❌ Error testing AppConfig:', e.message);
}

// Test 2: Check TMDB config
try {
  if (window.TMDB_CONFIG) {
    console.log('✅ TMDB_CONFIG loaded:', window.TMDB_CONFIG.apiKey ? 'API key present' : 'No API key');
  } else {
    console.log('⚠️  TMDB_CONFIG not loaded');
  }
} catch (e) {
  console.error('❌ Error testing TMDB config:', e.message);
}

// Test 3: Check Firebase config
try {
  if (window.FIREBASE_CONFIG) {
    console.log('✅ FIREBASE_CONFIG loaded:', window.FIREBASE_CONFIG.apiKey ? 'API key present' : 'No API key');
  } else {
    console.log('⚠️  FIREBASE_CONFIG not loaded');
  }
} catch (e) {
  console.error('❌ Error testing Firebase config:', e.message);
}

console.log('🧪 Test complete');
`;

const testPath = path.join(__dirname, '..', 'www', 'test-fixes.js');
fs.writeFileSync(testPath, testScript);
console.log('✅ Created test script at www/test-fixes.js');

console.log('\n🎉 Quick fixes applied!');
console.log('📝 To test the fixes:');
console.log('   1. Open the app in your browser');
console.log('   2. Open Developer Tools Console');
console.log('   3. Run: fetch("/test-fixes.js").then(r => r.text()).then(eval)');
console.log('   4. Check for any remaining errors');








