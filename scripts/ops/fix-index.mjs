import fs from 'fs';
import path from 'path';

const WWW = path.resolve('www');
const IDX = path.join(WWW, 'index.html');

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function backup() {
  const ts = nowStamp();
  const dst = path.join(WWW, `index.backup-${ts}.html`);
  fs.copyFileSync(IDX, dst);
  return dst;
}

function load() {
  return fs.readFileSync(IDX, 'utf8');
}
function save(s) {
  fs.writeFileSync(IDX, s);
}

function removeFirebaseCdnCompat(s) {
  return s
    .replace(
      /<script[^>]*https:\/\/www\.gstatic\.com\/firebasejs\/[^>]*firebase-app-compat\.js[^>]*>\s*<\/script>\s*/gi,
      '',
    )
    .replace(
      /<script[^>]*https:\/\/www\.gstatic\.com\/firebasejs\/[^>]*firebase-auth-compat\.js[^>]*>\s*<\/script>\s*/gi,
      '',
    )
    .replace(
      /<script[^>]*https:\/\/www\.gstatic\.com\/firebasejs\/[^>]*firebase-firestore-compat\.js[^>]*>\s*<\/script>\s*/gi,
      '',
    );
}

function removeDevScripts(s) {
  const devs = [
    '/verify-fixes.js',
    '/debug-verification.js',
    '/simple-translation-scanner.js',
    '/comprehensive-translation-fix.js',
  ];
  for (const d of devs) {
    const re = new RegExp(`<script[^>]*src=["']${d}["'][^>]*>\\s*<\\/script>\\s*`, 'gi');
    s = s.replace(re, '');
  }
  return s;
}

function ensureDeferForInlineBundles(s) {
  const targets = [
    '/scripts/inline-script-01.js',
    '/scripts/inline-script-02.js',
    '/scripts/inline-script-03.js',
  ];
  for (const t of targets) {
    const re = new RegExp(`(<script[^>]*src=["']${t}["'])([^>]*>)`, 'i');
    s = s.replace(re, (m, p1, p2) => {
      if (/defer/i.test(m) || /type\s*=\s*["']module["']/i.test(m)) return m;
      return `${p1} defer${p2}`;
    });
  }
  return s;
}

function insertLocalFirebaseIfPresent(s) {
  const local = path.join(WWW, 'scripts', 'build', 'firebase.bundle.js');
  if (!fs.existsSync(local)) return s; // nothing to do
  const tag = `    <script type="module" src="/scripts/build/firebase.bundle.js"></script>\n`;

  // Prefer to insert after /js/firebase-init.js
  if (s.includes('/js/firebase-init.js')) {
    return s.replace(
      /(<script[^>]*src=["']\/js\/firebase-init\.js["'][^>]*>\s*<\/script>\s*)/i,
      `$1${tag}`,
    );
  }
  // Fallback: insert before /js/app.js
  if (s.includes('/js/app.js')) {
    return s.replace(/(<script[^>]*src=["']\/js\/app\.js["'][^>]*>\s*<\/script>)/i, `${tag}$1`);
  }
  // Else append near end once
  if (!s.includes('scripts/build/firebase.bundle.js')) {
    return s.replace(/<\/body>\s*<\/html>/i, `${tag}</body></html>`);
  }
  return s;
}

function main() {
  if (!fs.existsSync(IDX)) {
    console.error('ERROR: www/index.html not found');
    process.exit(1);
  }
  const backupPath = backup();
  let html = load();
  const before = html;

  html = removeFirebaseCdnCompat(html);
  html = removeDevScripts(html);
  html = ensureDeferForInlineBundles(html);
  html = insertLocalFirebaseIfPresent(html);

  if (html !== before) {
    save(html);
    console.log(JSON.stringify({ backedUpTo: path.basename(backupPath), changed: true }));
  } else {
    console.log(JSON.stringify({ backedUpTo: path.basename(backupPath), changed: false }));
  }
}

main();
