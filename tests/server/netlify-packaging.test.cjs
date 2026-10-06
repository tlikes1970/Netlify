const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const test = require('node:test');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
test('billing validator can load Firebase Admin from its production dependency context', () => {
  const load = createRequire(path.join(root, 'netlify/functions/billing/validate.cjs'));
  assert.equal(typeof load('firebase-admin').auth, 'function');
  assert.ok(load.resolve('firebase-admin').includes(path.join('netlify', 'functions', 'node_modules')));
});
test('email function can load its external production dependency', () => {
  const load = createRequire(path.join(root, 'netlify/functions/send-email.cjs'));
  assert.equal(typeof load('@sendgrid/mail').send, 'function');
});
test('Netlify installs the locked function dependencies before building the site', () => {
  const config = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
  assert.match(config, /npm ci --prefix ..\/..\/netlify\/functions --omit=dev --no-audit --no-fund && npm run build/);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'netlify/functions/package.json')));
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'netlify/functions/package-lock.json')));
  assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies);
  for (const [name, version] of Object.entries(pkg.dependencies)) {
    assert.equal(lock.packages[`node_modules/${name}`].version, version);
  }
});
