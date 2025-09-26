import fs from 'fs';
import path from 'path';

const WWW = path.resolve('www');
const IDX = path.join(WWW, 'index.html');
const OUT_DIR = path.resolve('reports/quick');

fs.mkdirSync(OUT_DIR, { recursive: true });

function read(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
const html = read(IDX);

const reCdn = /(firebasejs|gstatic\.com|googleapis\.com|firebase-[\w-]*-compat\.js)/gi;
const reScriptTag = /<script[^>]*>/gi;
const reSrc = /\bsrc\s*=/i;
const reDefer = /\bdefer\b/i;
const reModule = /type\s*=\s*["']module["']/i;

// matches <script ... src= ...> without defer and without type="module"
function findBlockingExternal(html) {
  const lines = html.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/<script[^>]*src=/i);
    if (m) {
      const isDefer = reDefer.test(line);
      const isModule = reModule.test(line);
      if (!isDefer && !isModule) out.push({ line: i + 1, text: line.trim() });
    }
  }
  return out;
}
// matches <script ...> with no src=
function findInline(html) {
  const lines = html.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(reScriptTag);
    if (m && !reSrc.test(line)) out.push({ line: i + 1, text: line.trim() });
  }
  return out;
}

const cdnMatches = [];
html.split(/\r?\n/).forEach((line, idx) => {
  if (reCdn.test(line)) cdnMatches.push({ line: idx + 1, text: line.trim() });
  reCdn.lastIndex = 0;
});

const blocking = findBlockingExternal(html);
const inline = findInline(html);

fs.writeFileSync(
  path.join(OUT_DIR, 'cdn-compat.txt'),
  cdnMatches.map((x) => `${x.line}: ${x.text}`).join('\n'),
);
fs.writeFileSync(
  path.join(OUT_DIR, 'blocking-scripts.txt'),
  blocking.map((x) => `${x.line}: ${x.text}`).join('\n'),
);
fs.writeFileSync(
  path.join(OUT_DIR, 'inline-scripts.txt'),
  inline.map((x) => `${x.line}: ${x.text}`).join('\n'),
);

const summary = {
  cdnCompat: cdnMatches.length,
  blockingExternal: blocking.length,
  inlineScripts: inline.length,
};
console.log(JSON.stringify(summary));
