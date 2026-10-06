import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');let bundle:string,css:string;
test.beforeAll(async()=>{
 const mocks:Record<string,string>={
 'lib/proUpgrade':`export function startProUpgrade(){} export function isAndroidBillingAvailable(){return false}`,
 'hooks/useEntitlements':`export function useEntitlements(){return {hasFullAccess:true}}`,
 'hooks/usePreferredName':`export function usePreferredName(){return {preferredName:'User Name'}}`,
 'lib/storage':`export const Library={getAll:()=>[],getByList:()=>[],subscribe:()=>()=>{}}`,
 'lib/settings':`export function useSettings(){return {personalityLevel:2}}export {resolveFlickletLine} from './flickletPersonality';`,
 'lib/extras/extrasProvider':`export const extrasProvider={fetchExtras:async()=>({kind:'success',videos:Array.from({length:9},(_,i)=>({id:String(i),title:'Provider video title remains unchanged '+i,channelName:'Netflix',thumbnail:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',publishedAt:'2020-01-01',provider:'youtube',canEmbed:true,embedUrl:'about:blank'}))}),fetchBloopers:async()=>({kind:'no-content',videos:[]})}`
 };
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {HelpModal} from './src/components/HelpModal';import {languageManager,useLanguage} from './src/lib/language';window.contentLocale=l=>languageManager.setLanguage(l);function App(){useLanguage();const [open,setOpen]=React.useState(false);return <><button id="opener" onClick={()=>setOpen(true)}>Open help</button><HelpModal isOpen={open} onClose={()=>setOpen(false)}/></>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',define:{'import.meta.env':'{}','process.env.NODE_ENV':'"production"'},plugins:[{name:'boundaries',setup(b){b.onLoad({filter:/\.[tj]sx?$/},args=>{const name=path.relative(path.join(root,'src'),args.path).replaceAll('\\','/').replace(/\.[tj]sx?$/,'');return mocks[name]?{contents:mocks[name],loader:'tsx',resolveDir:path.dirname(args.path)}:undefined})}}]});bundle=result.outputFiles[0].text;const assets=path.join(root,'dist/assets');css=fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(f=>f.startsWith('appBootstrap-')&&f.endsWith('.css'))!),'utf8');
});

for(const width of [320,360,390,768,1023,1024,1280])test(`Help responsive keyboard and EN ES EN ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.route('https://content.test/**',r=>r.fulfill({contentType:'text/html',body:'<html><body><div id="root"></div></body></html>'}));await page.goto('https://content.test');await page.addStyleTag({content:css});await page.addScriptTag({content:bundle});await page.locator('#opener').click();
 for(const lang of ['en','es','en']){await page.evaluate(l=>(window as any).contentLocale(l),lang);const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();const close=dialog.locator('[data-help-close]');await expect(close).toBeVisible();const box=await dialog.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);expect(box!.y+box!.height).toBeLessThanOrEqual(800);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const done=dialog.locator('footer button');await expect(done).toBeVisible();if(width<768){await dialog.locator('select').selectOption('managing-library');}else{await dialog.locator('nav button').nth(2).click();}await expect(dialog.locator('section p')).toHaveCount(5);await done.focus();await page.keyboard.press('Tab');await expect(close).toBeFocused();}
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('#opener')).toBeFocused();
});
