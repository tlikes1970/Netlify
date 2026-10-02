import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let bundle:string, css:string;
const root=process.cwd();
test.beforeAll(async()=>{
 const mocks:Record<string,string>={
  'lib/backupPersistence':`export async function createBackup(){return {type:'flicklet-backup',schemaVersion:1,createdAt:'2026-10-01T12:00:00Z',library:[],customLists:[],local:{},settings:{},preferredName:''}}`,
  'lib/startOver':`export async function startOver(){window.resetCalls=(window.resetCalls||0)+1;throw Error('Cloud reset could not finish. Your data was retained.');}`,
 };
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import StartOverControl from './src/components/StartOverControl';createRoot(document.getElementById('root')).render(<StartOverControl/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'boundaries',setup(builder){builder.onResolve({filter:/^(\.\.?\/|@\/)/},args=>{const absolute=path.resolve(args.path.startsWith('@/')?path.join(root,'src'):args.resolveDir,args.path.replace(/^@\//,'')).replace(/\.(tsx?|jsx?)$/,'');for(const key of Object.keys(mocks))if(absolute===path.join(root,'src',key))return{path:key,namespace:'mock'};return undefined;});builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],resolveDir:root,loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;const dir=path.join(root,'dist/assets');const name=fs.readdirSync(dir).find(n=>n.startsWith('appBootstrap-')&&n.endsWith('.css'));if(!name)throw Error('Build first');css=fs.readFileSync(path.join(dir,name),'utf8');
});
for(const width of [320,360,390,768,1280])test(`Start Over choice and confirmation fit at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:667});await page.route('http://start-over.test/',route=>route.fulfill({contentType:'text/html',body:`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle}</script></body></html>`}));await page.goto('http://start-over.test/');
 await page.getByRole('button',{name:'Start Over',exact:true}).click();let dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 for(const name of ['Download Backup','Continue Without Backup','Cancel']){const button=dialog.getByRole('button',{name,exact:true});await expect(button).toBeVisible();const box=await button.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);}
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(dialog).toHaveCount(0);
 await page.getByRole('button',{name:'Start Over',exact:true}).click();await dialog.getByRole('button',{name:'Continue Without Backup'}).click();const input=dialog.getByRole('textbox');await expect(input).toBeFocused();await input.fill('delete');await expect(dialog.getByRole('button',{name:'Start Over',exact:true})).toBeDisabled();await input.fill('DELETE');const box=await input.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);await expect(dialog.getByText(/Your login, account handle, Full Access/)).toBeVisible();
 await dialog.getByRole('button',{name:'Start Over',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('Your data was retained');expect(await page.evaluate(()=> (window as unknown as {resetCalls:number}).resetCalls)).toBe(1);await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Start Over',exact:true}).click();const downloaded=page.waitForEvent('download');await dialog.getByRole('button',{name:'Download Backup',exact:true}).click();expect((await downloaded).suggestedFilename()).toBe('flicklet-backup-2026-10-01.json');await expect(dialog.getByRole('textbox')).toBeVisible();expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await expect(page.locator('body')).not.toContainText(/Nuclear Option|System Wipe/);
 if(width===390)await page.screenshot({path:test.info().outputPath('start-over-390.png'),fullPage:true});
});
