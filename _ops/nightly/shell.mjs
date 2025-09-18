import { exec } from 'child_process';
import { log, flog } from './log.js';

export default (cmd) => new Promise(res => 
  exec(cmd, (e, stdout, stderr) => {
    log('CMD', cmd);
    if (e) { flog('ERR', e.message); }
    if (stdout) log('OUT', stdout.trim());
    if (stderr) log('ERR', stderr.trim());
    res({ ok: !e, stdout, stderr });
  })
);
