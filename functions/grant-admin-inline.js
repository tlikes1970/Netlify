// Run this in Firebase functions shell:
// const { getAuth } = require('firebase-admin/auth');
// const u = await getAuth().getUserByEmail('pprowten@gmail.com');
// await getAuth().setCustomUserClaims(u.uid, { role: 'admin' });
// console.log({ message: 'Admin role granted' });

const { getAuth } = require('firebase-admin/auth');

async function grantAdmin() {
  const u = await getAuth().getUserByEmail('pprowten@gmail.com');
  await getAuth().setCustomUserClaims(u.uid, { role: 'admin' });
  return { message: 'Admin role granted' };
}

grantAdmin().then(console.log).catch(console.error);

