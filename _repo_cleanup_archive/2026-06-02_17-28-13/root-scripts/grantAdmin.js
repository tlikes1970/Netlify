const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
initializeApp();
getAuth().getUserByEmail('pprowten@gmail.com')
  .then(u => getAuth().setCustomUserClaims(u.uid, {role: 'admin'}))
  .then(() => console.log('Admin role granted'))
  .catch(console.error);
