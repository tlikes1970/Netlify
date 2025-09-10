
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
