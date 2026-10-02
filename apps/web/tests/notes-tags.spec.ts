import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let bundle:string, css:string;
const root=process.cwd();
test.beforeAll(async()=>{
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Modal from './src/components/modals/NotesAndTagsModal';function App(){const [open,setOpen]=React.useState(false);const item={id:'17',mediaType:'movie',title:'A very long title '.repeat(8),userNotes:'Original note',tags:Array.from({length:30},(_,i)=>i+'-'+ 'LongTag'.repeat(12))};return <><nav style={{position:'fixed',bottom:0,zIndex:1000}}>Navigation</nav><button onClick={()=>setOpen(true)}>Edit metadata</button>{open&&<Modal item={item} isOpen onClose={()=>setOpen(false)} onSave={(_,notes,tags)=>{window.saved={notes,tags}}}/>}</>};createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'language-boundary',setup(builder){builder.onResolve({filter:/lib\/language$/},()=>({path:'language',namespace:'mock'}));builder.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`import translations from './src/lib/translations';export function useTranslations(){return translations.en}`,resolveDir:root,loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;
 const dir=path.join(root,'dist/assets');const file=fs.readdirSync(dir).find(name=>name.startsWith('appBootstrap-')&&name.endsWith('.css'));if(!file)throw Error('Build first');css=fs.readFileSync(path.join(dir,file),'utf8');
});
for(const width of [320,360,390,768,1280])test(`Notes & Tags fits, scrolls and dismisses at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:667});await page.route('http://notes.test/',route=>route.fulfill({contentType:'text/html',body:`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle}</script></body></html>`}));await page.goto('http://notes.test/');
 const trigger=page.getByRole('button',{name:'Edit metadata'});await trigger.click();const dialog=page.getByRole('dialog');await expect(page.getByLabel('Notes',{exact:true})).toBeFocused();
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 for(const name of ['Close Notes & Tags','Save','Cancel']){const button=dialog.getByRole('button',{name,exact:true});await expect(button).toBeInViewport();const box=await button.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);}
 await dialog.getByRole('button',{name:'Save',exact:true}).focus();await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Close Notes & Tags'})).toBeFocused();
 const last=dialog.getByRole('button',{name:/^Remove tag:/}).last();await last.scrollIntoViewIfNeeded();await expect(last).toBeInViewport();expect((await last.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 // Simulate the visible viewport contracting while the native keyboard is open.
 await page.evaluate(()=>{Object.defineProperty(window.visualViewport,'height',{configurable:true,get:()=>360});window.visualViewport!.dispatchEvent(new Event('resize'));});
 const save=dialog.getByRole('button',{name:'Save',exact:true});await expect(save).toBeInViewport();expect((await save.boundingBox())!.y+(await save.boundingBox())!.height).toBeLessThanOrEqual(360);
 expect(await save.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
 await page.getByLabel('Notes',{exact:true}).fill('Changed\nmultiline');await save.click();await expect(dialog).toHaveCount(0);expect(await page.evaluate(()=>(window as unknown as {saved:{notes:string}}).saved.notes)).toBe('Changed\nmultiline');await expect(trigger).toBeFocused();
 await trigger.click();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await trigger.click();await page.evaluate(()=>window.dispatchEvent(new Event('flicklet:android-back',{cancelable:true})));await expect(dialog).toHaveCount(0);
});
