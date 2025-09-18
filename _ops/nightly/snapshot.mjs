import fs from 'fs';
import { log, flog } from './log.js';
import shell from './shell.mjs';

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const out = `_ops/nightly/backup/snap-${ts}.zip`;

await shell(`git rev-parse --short HEAD`).then(r => log('HEAD', r.stdout?.trim() || ''));
await shell(`git archive -o ${out} HEAD`);
if (fs.existsSync(out)) log('SNAPSHOT', out); else flog('SNAPSHOT_FAIL', out);

