/**
 * Unit tests for origin-validation.cjs helper
 * Tests origin validation logic for Netlify functions
 */

// Simple test runner for CommonJS (since we're using .cjs files)
if (require.main === module) {
  console.log('Running origin-validation tests...');
  
  let passed = 0;
  let failed = 0;
  
  const expect = (actual) => ({
    toBe: (expected) => {
      if (actual === expected) {
        passed++;
        return true;
      } else {
        failed++;
        console.error(`Expected ${expected}, got ${actual}`);
        return false;
      }
    },
    toBeDefined: () => {
      if (actual !== undefined && actual !== null) {
        passed++;
        return true;
      } else {
        failed++;
        console.error(`Expected defined value, got ${actual}`);
        return false;
      }
    },
    toContain: (item) => {
      if (Array.isArray(actual) && actual.includes(item)) {
        passed++;
        return true;
      } else {
        failed++;
        console.error(`Expected array to contain ${item}`);
        return false;
      }
    },
    toBeNull: () => {
      if (actual === null) {
        passed++;
        return true;
      } else {
        failed++;
        console.error(`Expected null, got ${actual}`);
        return false;
      }
    },
  });
  
  // Run tests
  const { validateOrigin, ALLOWED_ORIGINS, normalizeOrigin } = require('../origin-validation.cjs');
  
  // Test normalizeOrigin
  if (normalizeOrigin('HTTP://LOCALHOST:8888') === 'http://localhost:8888') passed++; else failed++;
  if (normalizeOrigin('https://www.flicklet.netlify.app') === 'https://flicklet.netlify.app') passed++; else failed++;
  if (normalizeOrigin(null) === null) passed++; else failed++;
  
  // Test validateOrigin - localhost:8888
  const result1 = validateOrigin({ headers: { origin: 'http://localhost:8888' } });
  if (result1.allowed === true) passed++; else failed++;
  
  // Test validateOrigin - 127.0.0.1:8888
  const result2 = validateOrigin({ headers: { origin: 'http://127.0.0.1:8888' } });
  if (result2.allowed === true) passed++; else failed++;
  
  // Test validateOrigin - 10.0.2.2:8888
  const result3 = validateOrigin({ headers: { origin: 'http://10.0.2.2:8888' } });
  if (result3.allowed === true) passed++; else failed++;
  
  // Test validateOrigin - production origin
  const result4 = validateOrigin({ headers: { origin: 'https://flicklet.netlify.app' } });
  if (result4.allowed === true) passed++; else failed++;
  
  // Test validateOrigin - Netlify preview
  const result5 = validateOrigin({ headers: { origin: 'https://deploy-preview-123--flicklet.netlify.app' } });
  if (result5.allowed === true) passed++; else failed++;
  
  // Test validateOrigin - rejected origin
  const result6 = validateOrigin({ headers: { origin: 'https://evil.example.com' } });
  if (result6.allowed === false) passed++; else failed++;
  
  // Test validateOrigin - missing origin
  const result7 = validateOrigin({ headers: {} });
  if (result7.allowed === false && result7.error === 'Missing Origin header') passed++; else failed++;
  
  // Test validateOrigin - extract from referer
  const result8 = validateOrigin({ headers: { referer: 'http://localhost:8888/some/path' } });
  if (result8.allowed === true) passed++; else failed++;
  
  // Test ALLOWED_ORIGINS
  if (ALLOWED_ORIGINS.includes('http://localhost:8888')) passed++; else failed++;
  if (ALLOWED_ORIGINS.includes('http://127.0.0.1:8888')) passed++; else failed++;
  if (ALLOWED_ORIGINS.includes('http://10.0.2.2:8888')) passed++; else failed++;
  
  console.log(`\nTests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

