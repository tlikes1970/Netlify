import fs from 'fs';
import path from 'path';

const root = '_ops/nightly';
const run = path.join(root, 'run.log');
const fail = path.join(root, 'failures.log');

export const log = (...a) => fs.appendFileSync(run, `[${new Date().toISOString()}] ${a.join(' ')}\n`);
export const flog = (...a) => fs.appendFileSync(fail, `[${new Date().toISOString()}] ${a.join(' ')}\n`);
