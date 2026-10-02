/** Run against the demo-only Firestore emulator: node scripts/test-sharing-rules.mjs */
import assert from 'node:assert/strict';
const project = 'demo-flicklet-sharing';
const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
assert.match(host, /^(127\.0\.0\.1|localhost):\d+$/, 'Rules tests must use a local emulator');
const base = `http://${host}/v1/projects/${project}/databases/(default)/documents`;
const token = (uid, admin = false) => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({alg:'none',typ:'JWT'})}.${encode({iss:`https://securetoken.google.com/${project}`,aud:project,sub:uid,user_id:uid,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,firebase:{sign_in_provider:'custom'},...(admin?{role:'admin'}:{})})}.`;
};
async function request(path, uid, method = 'GET', fields, admin = false) {
  return fetch(`${base}/${path}`, {method, headers:{'Content-Type':'application/json', ...(uid?{Authorization:`Bearer ${token(uid,admin)}`}:{})}, ...(fields?{body:JSON.stringify({fields})}:{})});
}
let passed = 0;
async function check(name, response, expected) { const body = await response.text(); assert.equal(response.status, expected, `${name}: ${body}`); passed++; console.log(`PASS ${name}`); }
const suffix = Date.now(); const owner = `sharing-owner-${suffix}`; const other = `sharing-other-${suffix}`; const path = `users/${owner}`;
await check('owner root create', await request(path,owner,'PATCH',{uid:{stringValue:owner},email:{stringValue:'private@example.test'}}),200);
await check('owner root read', await request(path,owner),200);
await check('different authenticated UID root read denied',await request(path,other),403);
await check('anonymous root read denied',await request(path,null),403);
await check('other admin root read denied (no catch-all bypass)',await request(path,other,'GET',undefined,true),403);
await check('owner update retained',await request(path,owner,'PATCH',{uid:{stringValue:owner},settings:{mapValue:{fields:{preferredName:{stringValue:'Private'}}}}}),200);
await check('non-owner update denied',await request(path,other,'PATCH',{uid:{stringValue:owner}}),403);
await check('owner settings subcollection write retained',await request(`${path}/settings/main`,owner,'PATCH',{language:{stringValue:'en'}}),200);
await check('owner settings read retained',await request(`${path}/settings/main`,owner),200);
const handle = `sharing_handle_${suffix}`;
await check('owner can reserve handle',await request(`usernames/${handle}`,owner,'PATCH',{uid:{stringValue:owner}}),200);
await check('cannot claim a handle for another UID',await request(`usernames/wrong_${suffix}`,other,'PATCH',{uid:{stringValue:owner}}),403);
await check('cannot overwrite an existing reservation',await request(`usernames/${handle}`,other,'PATCH',{uid:{stringValue:other}}),403);
await check('authenticated availability lookup retained',await request(`usernames/${handle}`,other),200);
await check('anonymous handle lookup denied',await request(`usernames/${handle}`,null),403);
await check('other user cannot release handle',await request(`usernames/${handle}`,other,'DELETE'),403);
await check('owner can release handle',await request(`usernames/${handle}`,owner,'DELETE'),200);
await check('owner can delete own root',await request(path,owner,'DELETE'),200);
console.log(`${passed} Firestore rule checks passed (emulator only).`);
