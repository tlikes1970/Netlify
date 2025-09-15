/**
 * Auth Diagnostics - Test auth system functionality
 */

console.log('🔍 Auth Diagnostics Starting...');

// Test 1: Check auth bridge
console.log('🔍 Auth Bridge Ready:', window.__authBridgeReady);
console.log('🔍 Auth Observer Registered:', window.__authObserverRegistered);
console.log('🔍 Auth Observer Count:', window.__authObserverCount);
console.log('🔍 Auth Ready:', window.__authReady);

// Test 2: Check Firebase auth availability
console.log('🔍 Firebase Auth Available:', !!window.auth);
console.log('🔍 Current User:', window.currentUser);
console.log('🔍 FlickletApp Current User:', window.FlickletApp?.currentUser);

// Test 3: Check DOM markers
const signedOutElements = document.querySelectorAll('[data-auth="signed-out-visible"]');
const signedInElements = document.querySelectorAll('[data-auth="signed-in-visible"]');
const settingsElements = document.querySelectorAll('[data-requires-auth]');

console.log('🔍 Signed-out elements:', signedOutElements.length);
console.log('🔍 Signed-in elements:', signedInElements.length);
console.log('🔍 Settings elements:', settingsElements.length);

// Test 4: Check element visibility
console.log('🔍 Signed-out hidden:', Array.from(signedOutElements).map(el => el.hidden));
console.log('🔍 Signed-in hidden:', Array.from(signedInElements).map(el => el.hidden));
console.log('🔍 Settings disabled:', Array.from(settingsElements).map(el => el.disabled));

// Test 5: Check UserViewModel
console.log('🔍 UserViewModel available:', !!window.UserViewModel);
if (window.UserViewModel) {
  console.log('🔍 UserViewModel isAuthenticated:', window.UserViewModel.isAuthenticated);
  console.log('🔍 UserViewModel displayName:', window.UserViewModel.displayName);
}

// Test 6: Check auth functions
console.log('🔍 setAuthUI available:', typeof window.setAuthUI === 'function');
console.log('🔍 setPersistence available:', typeof window.setPersistence === 'function');
console.log('🔍 browserLocalPersistence available:', !!window.browserLocalPersistence);

console.log('✅ Auth Diagnostics Complete');

// Expose diagnostic function globally
window.runAuthDiagnostics = function() {
  console.log('🔍 Running Auth Diagnostics...');
  // Re-run the tests
  console.log('🔍 Auth Bridge Ready:', window.__authBridgeReady);
  console.log('🔍 Current User:', window.currentUser);
  console.log('🔍 Signed-out hidden:', Array.from(signedOutElements).map(el => el.hidden));
  console.log('🔍 Signed-in hidden:', Array.from(signedInElements).map(el => el.hidden));
  console.log('🔍 Settings disabled:', Array.from(settingsElements).map(el => el.disabled));
};
