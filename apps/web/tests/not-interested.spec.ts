import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let bundle:string, css:string;
const root=process.cwd();
test.beforeAll(async()=>{
 const mocks:Record<string,string>={
  'lib/storage':`import {useState,useEffect} from 'react';let items=[{id:'8',mediaType:'movie',title:'A movie with an exceptionally long title that wraps across several lines',year:'2025',list:'not'},{id:'8',mediaType:'tv',title:'A TV series sharing the movie ID with a similarly long title',year:'2026',list:'not'}];let notify=()=>{};export function useLibrary(){const [state,setState]=useState(items);useEffect(()=>{notify=()=>setState([...items])},[]);return state;}export const Library={remove(id,kind){items=items.filter(i=>i.id!==id||i.mediaType!==kind);notify()},getCurrentList(id,kind){return items.find(i=>i.id===id&&i.mediaType===kind)?.list}};export function move(id,kind,target){items=items.map(i=>i.id===id&&i.mediaType===kind?{...i,list:target}:i).filter(i=>i.list==='not');notify()}`,
  'lib/statusTransitions':`import {move} from './storage';export function setPrimaryStatus(item,target){move(item.id,item.mediaType,target)}`,
  'lib/readOnlyGuard':`export function guardMutation(){return true}export function isMutationBlocked(){return false}`,
  'lib/language':`import translations from './translations';export function useTranslations(){return translations.en}`,
 };
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Modal from './src/components/modals/NotInterestedModal';import ConfirmHost from './src/components/ConfirmHost';function App(){const [open,setOpen]=React.useState(true);return <><Modal isOpen={open} onClose={()=>setOpen(false)}/><ConfirmHost/></>};createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'boundaries',setup(builder){builder.onResolve({filter:/^(\.\.?\/|@\/)/},args=>{const absolute=path.resolve(args.path.startsWith('@/')?path.join(root,'src'):args.resolveDir,args.path.replace(/^@\//,'')).replace(/\.(tsx?|jsx?)$/,'');for(const key of Object.keys(mocks))if(absolute===path.join(root,'src',key))return{path:key,namespace:'mock'};return undefined;});builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],resolveDir:path.join(root,'src',path.dirname(args.path)),loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;const dir=path.join(root,'dist/assets');const name=fs.readdirSync(dir).find(n=>n.startsWith('appBootstrap-')&&n.endsWith('.css'));if(!name)throw Error('Build first');css=fs.readFileSync(path.join(dir,name),'utf8');
});
for(const width of [320,360,390,768,1280])test(`Not Interested management fits at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:667});await page.route('http://not-interested.test/',route=>route.fulfill({contentType:'text/html',body:`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle}</script></body></html>`}));await page.goto('http://not-interested.test/');
 const dialog=page.getByRole('dialog');await expect(dialog).toHaveAccessibleName('Not Interested List (2)');
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 await dialog.getByRole('button',{name:'Close Not Interested list'}).focus();await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('button',{name:'Done',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Close Not Interested list'})).toBeFocused();
 for(const button of await dialog.getByRole('button').all()){await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);}
 const movie=page.getByTestId('not-interested-movie:8');await movie.getByRole('button',{name:'Want to Watch',exact:true}).click();await expect(movie).toHaveCount(0);await expect(page.getByTestId('not-interested-tv:8')).toBeVisible();await expect(dialog).toHaveAccessibleName('Not Interested List (1)');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 if(width===390)await page.screenshot({path:test.info().outputPath('not-interested-390.png'),fullPage:true});
 const tv=page.getByTestId('not-interested-tv:8');await tv.getByRole('button',{name:'Remove from Library',exact:true}).click();const confirmation=page.getByRole('alertdialog');await expect(confirmation).toBeVisible();await expect(confirmation.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(confirmation.getByRole('button',{name:'Remove from Library',exact:true})).toBeFocused();await confirmation.getByRole('button',{name:'Cancel',exact:true}).click();await expect(tv).toBeVisible();await expect(tv.getByRole('status')).toHaveCount(0);
 await tv.getByRole('button',{name:'Remove from Library',exact:true}).click();await expect(confirmation).toBeVisible();await page.evaluate(()=>window.dispatchEvent(new Event('flicklet:android-back',{cancelable:true})));await expect(confirmation).toHaveCount(0);await expect(tv).toBeVisible();
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
});
