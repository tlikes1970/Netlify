// 10-second health check (paste in console)
console.log('Firebase configured?', !!(window.firebase && (firebase.apps?.length || window.firebaseConfig)));
console.log('Login modal present?', !!document.querySelector('[data-modal="login"],#loginModal'));
console.log('Auth API present?', !!window.FlickletAuth);
['googleBtn','appleBtn','emailBtn'].forEach(id=>{
  console.log(id, document.getElementById(id)?.getAttribute('type'));
});
