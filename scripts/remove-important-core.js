// remove-important-core.js  /* PART2D */
const fs = require('fs');
const path = require('path');

const ROOTS = ['styles', 'css'];
const CORE = ['html','body','#appRoot','.panels','#homeSection','header.header','#navigation','.tab-container','.top-search'];
const LAYOUT = '(?:position|display|overflow(?:-x|-y)?|height|width|max-[^:]*|min-[^:]*|top|right|bottom|left|z-index|margin(?:-[^:]*)?|padding(?:-[^:]*)?|contain|transform|visibility)';

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && p.endsWith('.css')) files.push(p);
  }
}
ROOTS.forEach(r => fs.existsSync(r) && walk(r));

let total = 0, changes = [];
const ruleRegex = /([^{}]+)\{([^}]*)\}/gs;

for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  let out = src;
  out = out.replace(ruleRegex, (m, sel, block) => {
    const selStr = sel.trim();
    const hitCore = CORE.some(c => selStr.includes(c));
    if (!hitCore) return m;
    // strip !important on layout props only
    const newBlock = block.replace(new RegExp(`\\b(${LAYOUT})\\s*:\\s*([^;]+?)\\s*!important\\s*;`, 'gi'), (mm, prop, val) => {
      total++;
      changes.push({file: f, selector: selStr.slice(0,120), prop});
      return `${prop}: ${val.trim()};`;
    });
    return `${sel}{${newBlock}}`;
  });
  if (out !== src) fs.writeFileSync(f, out, 'utf8');
}

console.log('[PART2D] Removed layout !important count:', total);
console.table(changes);



