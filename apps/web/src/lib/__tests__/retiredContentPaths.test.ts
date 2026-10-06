import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {expect,it} from 'vitest';
const root=resolve(process.cwd(),'../..');
it('retired endpoints, exports and routes are removed',()=>{
 for(const file of ['netlify/functions/goofs-fetch.cjs','functions/src/ingestGoofs.ts','apps/web/src/components/extras/GoofsModal.tsx','apps/web/src/lib/goofs/goofsStore.ts'])expect(existsSync(join(root,file))).toBe(false);
 expect(readFileSync(join(root,'functions/src/index.ts'),'utf8')).not.toMatch(/ingestGoofs/);
 expect(readFileSync(join(root,'netlify.toml'),'utf8')).not.toMatch(/goofs-fetch/);
});
it('production source has no retired implementation naming beyond read-only cache migration',()=>{
 function inspect(directory:string){for(const entry of readdirSync(directory,{withFileTypes:true})){const path=join(directory,entry.name);if(entry.isDirectory()){if(entry.name!=='__tests__')inspect(path);}else if(/\.tsx?$/.test(entry.name)&&entry.name!=='version.ts'){const source=readFileSync(path,'utf8').replace('flicklet.goofs.v1','legacy-cache');expect(source,path).not.toMatch(/goofs?/i);}}}
 inspect(join(root,'apps/web/src'));
});
