// Build script to shard a large valid guesses list and verify answers subset
// Usage: node apps/web/scripts/build-lexicon.mjs

import fs from 'node:fs/promises';
import path from 'node:path';

// Resolve relative to the working directory (apps/web)
const root = path.resolve(process.cwd(), 'public/words');
const validPath = path.join(root, 'valid-guess.txt');
const answersPath = path.join(root, 'answers.txt');
const shardsDir = path.join(root, 'shards');

const normalize = (s) => s
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim();

async function readLines(p) {
  const txt = await fs.readFile(p, 'utf8');
  return txt.split(/\r?\n/).map(x => x.trim());
}

async function main() {
  await fs.mkdir(root, { recursive: true });

  const validExists = await fs.access(validPath).then(()=>true).catch(()=>false);
  if (!validExists) {
    console.error('valid-guess.txt not found at', validPath);
    process.exit(1);
  }

  const validRaw = (await readLines(validPath)).map(normalize)
    .filter(w => /^[a-z]{5}$/.test(w));
  const byFirst = new Map();
  for (const w of validRaw) {
    const k = w[0];
    if (!byFirst.has(k)) byFirst.set(k, []);
    byFirst.get(k).push(w);
  }
  await fs.mkdir(shardsDir, { recursive: true });
  for (const [k, list] of byFirst) {
    list.sort();
    await fs.writeFile(path.join(shardsDir, `${k}.txt`), list.join('\n'));
  }

  // Optional: answers subset check
  const answersExists = await fs.access(answersPath).then(()=>true).catch(()=>false);
  if (answersExists) {
    const dict = new Set(validRaw);
    const answers = (await readLines(answersPath)).map(normalize).filter(Boolean);
    const missing = answers.filter(a => !dict.has(a));
    if (missing.length) {
      console.error('Answers not present in valid-guess:', missing.slice(0, 10));
      process.exit(1);
    }
  }

  console.log('Lexicon build complete. Shards at', shardsDir);
}

main().catch(e => { console.error(e); process.exit(1); });


