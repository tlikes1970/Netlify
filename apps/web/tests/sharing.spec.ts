import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let bundle: string, css: string;
const root = process.cwd();
test.beforeAll(async () => {
 const data = `const movie={id:7,mediaType:'movie',title:'Movie '+ 'Very long title '.repeat(8),voteAverage:8.1,userRating:1,userNotes:'PRIVATE-NOTE'};const series={id:7,mediaType:'tv',title:'Series collision'};export function useLibrary(list){return list==='watching'?[movie]:list==='wishlist'?[series]:[]}export const Library={getByList:()=>[movie,...Array.from({length:35},(_,i)=>({...movie,id:100+i,title:'Long item '+i+' '+ 'Title '.repeat(12)}))]};`;
 const mocks: Record<string, string> = {
  'lib/language': `import t from './src/lib/translations';export function useTranslations(){return t.en}`,
  'lib/storage': data,
  'lib/customLists': `export function useCustomLists(){return {customLists:[{id:'a',name:'Custom '+ 'Long List Name '.repeat(10)}]}}`,
  'hooks/useUsername': `export function useUsername(){return {username:'handle'}}`,
  'hooks/useAuth': `export function useAuth(){return {user:null}}`,
  'hooks/useAdminRole': `export function useAdminRole(){return {isAdmin:false}}`,
  'hooks/useDeviceDetection': `export function useIsMobileScreen(){return window.innerWidth<768}`,
  'components/settingsSections': `import React from 'react';export function renderSettingsSection(section,props){return <button onClick={props.onShowSharingModal}>Open sharing</button>}`,
  'components/modals/NotInterestedModal': `export default function Modal(){return null}`,
  'components/modals/NotificationSettings': `export function NotificationSettings(){return null}`,
  'components/modals/NotificationCenter': `export function NotificationCenter(){return null}`,
 };
 const result = await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import SettingsPage from './src/components/SettingsPage';import SettingsSheet,{openSettingsSheet} from './src/components/settings/SettingsSheet';function App(){const [desktop,setDesktop]=React.useState(false);return <><button onClick={()=>setDesktop(true)}>Desktop Settings</button><button onClick={()=>openSettingsSheet('data')}>Mobile Settings</button>{desktop&&<SettingsPage onClose={()=>setDesktop(false)} initialSection="data"/>}<SettingsSheet/></>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'local-boundaries',setup(builder){builder.onResolve({filter:/^\./},args=>{const absolute=path.resolve(args.resolveDir,args.path).replace(/\\/g,'/');const key=Object.keys(mocks).find(key=>absolute.endsWith('/'+key));return key?{path:key,namespace:'mock'}:undefined;});builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],resolveDir:root,loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;
 const dir=path.join(root,'dist/assets');const file=fs.readdirSync(dir).find(name=>name.startsWith('appBootstrap-')&&name.endsWith('.css'));if(!file)throw Error('Build first');css=fs.readFileSync(path.join(dir,file),'utf8');
});
for(const width of [320,360,390,768,1280])test(`Settings sharing fits and works at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:667});await page.route('http://sharing.test/',route=>route.fulfill({contentType:'text/html',body:`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body style="--safe-top:24px;--safe-bottom:20px"><div id="root"></div><script>${bundle}</script></body></html>`}));await page.goto('http://sharing.test/');
 const mobile=width<768;await page.getByRole('button',{name:mobile?'Mobile Settings':'Desktop Settings',exact:true}).click();
 const opener=page.getByRole('button',{name:'Open sharing'});await opener.click();const dialog=page.getByRole('dialog',{name:'Share Your Lists'});await expect(dialog).toBeVisible();
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await expect(dialog.getByRole('checkbox',{name:'Watching',exact:true})).toBeChecked();await expect(dialog.getByRole('checkbox',{name:/account handle/})).not.toBeChecked();
 await dialog.getByRole('button',{name:'Select None',exact:true}).click();await expect(dialog.getByRole('button',{name:'Share / Copy'})).toBeDisabled();await dialog.getByRole('button',{name:'Select All'}).click();
 await dialog.getByRole('checkbox',{name:/^Custom Long/}).check();await dialog.getByRole('button',{name:'Select All'}).click();
 const last=dialog.getByRole('checkbox',{name:/^🎬 Long item 34/});await last.scrollIntoViewIfNeeded();await expect(last).toBeInViewport();
 for(const name of ['Close sharing','Generate snapshot','Share / Copy']){const button=dialog.getByRole('button',{name,exact:true});await expect(button).toBeInViewport();const box=await button.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.x+box!.width).toBeLessThanOrEqual(width);}
 await dialog.getByRole('button',{name:'Share / Copy'}).focus();await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Close sharing'})).toBeFocused();
 if(width===390) await page.screenshot({path:test.info().outputPath('sharing-390.png')});
 await page.evaluate(()=>{Object.defineProperty(window.visualViewport,'height',{configurable:true,get:()=>360});window.visualViewport!.dispatchEvent(new Event('resize'));});
 const generate=dialog.getByRole('button',{name:'Generate snapshot'});await expect(generate).toBeInViewport();const bounds=await generate.boundingBox();expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(360);await generate.click();
 const snapshot=dialog.getByLabel('Text snapshot');await expect(snapshot).toHaveValue(/TMDB 8.1\/10/);expect(await snapshot.inputValue()).not.toMatch(/PRIVATE|@handle|1\.0/);
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();await opener.click();await page.evaluate(()=>window.dispatchEvent(new Event('flicklet:android-back',{cancelable:true})));await expect(dialog).toHaveCount(0);await expect(opener).toBeVisible();
});
