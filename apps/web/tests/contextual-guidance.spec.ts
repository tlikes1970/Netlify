import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();let bundle:string,css:string;
test.beforeAll(async()=>{
 const mocks:Record<string,string>={
 'hooks/usePreferredName':`export function usePreferredName(){return {uid:'owner',preferredName:'',loading:false,error:null,updatePreferredName:async()=>{},retry:()=>{}}}`,
 'hooks/useAuth':`export function useAuth(){return {signInWithProvider:async()=>{},signInWithEmail:async()=>{},createAccountWithEmail:async()=>{}}}`,
 'lib/authLogin':`export async function googleLogin(){}`,
 'lib/authLog':`export const authLogManager={log:()=>{}}`,
 'lib/capacitorEnv':`export const isCapacitorNative=()=>false;export const isCapacitorAndroid=()=>false;`,
 'lib/language':`import T from './src/lib/translations';export function useTranslations(){return T.en}`,
 'lib/forYouRowsStorage':`export const loadForYouRows=()=>[];export const saveForYouRows=rows=>rows;`,
 };
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import PreferredNamePromptModal from './src/components/PreferredNamePromptModal';import AuthModal from './src/components/AuthModal';import ForYouGenreConfig from './src/components/ForYouGenreConfig';function App(){const [name,setName]=React.useState(false),[auth,setAuth]=React.useState(false);return <><button onClick={()=>setName(true)}>Name</button><button onClick={()=>setAuth(true)}>Auth</button><PreferredNamePromptModal isOpen={name} onClose={()=>setName(false)}/><AuthModal isOpen={auth} onClose={()=>setAuth(false)}/><ForYouGenreConfig/></>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'boundaries',setup(b){b.onResolve({filter:/^(\.\.?\/|@\/)/},args=>{const abs=path.resolve(args.path.startsWith('@/')?path.join(root,'src'):args.resolveDir,args.path.replace(/^@\//,'')).replace(/\.(tsx?|jsx?)$/,'');for(const key of Object.keys(mocks))if(abs===path.join(root,'src',key))return{path:key,namespace:'mock'};return undefined;});b.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],loader:'tsx',resolveDir:root}));}}]});
 bundle=result.outputFiles[0].text;const dir=path.join(root,'dist/assets');css=fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(n=>n.startsWith('appBootstrap-')&&n.endsWith('.css'))!),'utf8');
});
for(const width of [320,360,390,768,1023,1024,1280])test(`contextual modals at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.route('http://guidance.test/',r=>r.fulfill({contentType:'text/html',body:`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle}</script></body></html>`}));await page.goto('http://guidance.test/');
 await expect(page.getByText('💡 Tip: Choose genres for your For You rows. Titles already in your Library are hidden.')).toBeVisible();await page.getByRole('button',{name:'Name',exact:true}).click();let dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog.getByRole('textbox')).toBeFocused();
 for(const button of await dialog.getByRole('button').all()){const box=await button.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);}
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 await page.getByRole('button',{name:'Auth',exact:true}).click();dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:/Google/})).toBeVisible();await dialog.getByRole('button',{name:'Close',exact:true}).click();await expect(dialog).toHaveCount(0);
 await expect(page.locator('[data-onboarding-id]')).toHaveCount(0);await expect(page.getByText('Swipe for actions',{exact:true})).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});
