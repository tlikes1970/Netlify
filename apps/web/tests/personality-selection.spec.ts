import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let bundle:string,css:string;
test.use({channel:'chrome'});
const root=process.cwd();
test.beforeAll(async()=>{
 const mocks:Record<string,string>={
 'lib/auth':`export const authManager={getCurrentUser:()=>null,getUserSettings:async()=>null,subscribe:()=>()=>{}}`,
 'lib/readOnlyGuard':`export function guardMutation(){if(window.blockPersonality){window.blockedCalls=(window.blockedCalls||0)+1;return false}return true}export function openProPurchaseSettings(){}export function notifyReadOnlyBlocked(){return false}export function openUpgradeFromReadOnly(){}`,
 'hooks/useAuth':`export function useAuth(){return {user:null,isAuthenticated:false,signInWithEmail:async()=>{window.authCalls=(window.authCalls||0)+1},createAccountWithEmail:async()=>{},signInWithProvider:async()=>{}}}`,
 'lib/authLogin':`export async function googleLogin(){}`,
 'hooks/usePreferredName':`export function usePreferredName(){return {uid:'owner',preferredName:'',loading:false,error:null,updatePreferredName:async value=>{window.savedName=value},retry:()=>{}}}`,
 'hooks/useEntitlements':`export function useEntitlements(){return {phase:'expiredReadOnly',paidPro:false,isReadOnlyMode:true,hasFullAccess:false}}`,
 'hooks/useFullAccessProduct':`export function useFullAccessProduct(){return {status:'available',product:{price:'12,99 €',productId:'flicklet_full_access'}}}`,
 'lib/backupPersistence':`export async function createBackup(){return {createdAt:'2026-10-01'}} export async function restoreBackup(){}`,
 'lib/startOver':`export async function startOver(){window.resetCalls=(window.resetCalls||0)+1;throw Error('SECRET')}`,
 'lib/proUpgrade':`export function startProUpgrade(){}`,
 'lib/customLists':`export function useCustomLists(){return {customLists:[],maxLists:3}}export const customListManager={}`,
 'lib/storage':`export function useLibrary(){return []} export const Library={getAll:()=>[],getByList:()=>[],subscribe:()=>()=>{}}`,
 'hooks/useAdminRole':`export function useAdminRole(){return {isAdmin:false}}`,
 'components/modals/SharingModal':`export default function Sharing(){return null}`,
 'components/ResetSettingsButton':`export default function Reset(){return null}`,
 'components/ForYouGenreConfig':`export default function Genres(){return null}`,
 'components/modals/NotificationCenter':`export function NotificationCenter(){return null}`,
 'pages/AdminExtrasPage':`export default function Admin(){return null}`,
 };
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {renderSettingsSection} from './src/components/settingsSections';import HomeMarquee from './src/components/HomeMarquee';import {useSettings,getFlickletMarqueeMessages} from './src/lib/settings';import {changeLanguage,useLanguage} from './src/lib/language';window.localize=changeLanguage;function App(){useLanguage();const settings=useSettings();return <main style={{padding:8}}>{renderSettingsSection('account',{})}<HomeMarquee messages={getFlickletMarqueeMessages(settings.personalityLevel)}/></main>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'boundaries',setup(builder){builder.onResolve({filter:/^(\.\.?\/|@\/)/},args=>{const absolute=path.resolve(args.path.startsWith('@/')?path.join(root,'src'):args.resolveDir,args.path.replace(/^@\//,'')).replace(/\.(tsx?|jsx?)$/,'');for(const key of Object.keys(mocks))if(absolute===path.join(root,'src',key))return{path:key,namespace:'mock'};return undefined;});builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],resolveDir:root,loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;const dir=path.join(root,'dist/assets');const name=fs.readdirSync(dir).find(n=>n.startsWith('appBootstrap-')&&n.endsWith('.css'));if(!name)throw Error('Build first');css=fs.readFileSync(path.join(dir,name),'utf8');
});

for(const width of [320,360,390,768,1023,1024,1280])test(`Personality selection and Minimal marquee at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.route('http://personality.test/**',r=>r.fulfill({contentType:'text/html',body:`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle}</script></body></html>`}));await page.goto('http://personality.test');
 const standard=page.getByRole('radio',{name:/Standard/});await expect(standard).toBeChecked();await standard.focus();await expect(standard).toBeFocused();expect(await standard.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'||getComputedStyle(el).boxShadow!=='none')).toBe(true);await page.keyboard.press('ArrowDown');await expect(page.getByRole('radio',{name:/Maximum/})).toBeChecked();await page.getByRole('radio',{name:/Minimal/}).click();
 for(const lang of ['en','es','en']){await page.evaluate(l=>(window as any).localize(l),lang);const group=page.getByRole('group',{name:lang==='es'?'Nivel de Personalidad':'Personality Level'});await group.scrollIntoViewIfNeeded();await expect(group).toBeVisible();await expect(group.getByRole('radio',{name:lang==='es'?/Mínimo/:/Minimal/})).toBeChecked();await expect(group.getByText(lang==='es'?'Tono más tranquilo.':'Quieter tone.')).toBeVisible();await expect(group.getByText(lang==='es'?'Tono más intenso y con más opinión.':'Stronger, more opinionated tone.')).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('flicklet.settings.v2')!).personalityLevel)).toBe(1);const label=group.getByRole('radio',{name:lang==='es'?/Mínimo/:/Minimal/}).locator('..');expect((await label.boundingBox())!.height).toBeGreaterThanOrEqual(44);await expect(group.getByText(lang==='es'?'Vista Previa:':'Preview:')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.evaluate(()=>(window as any).blockPersonality=true);const group=page.getByRole('group',{name:'Personality Level'});const preview=await group.locator('p.text-sm.mt-1').textContent();await group.getByRole('radio',{name:/Maximum/}).click();await expect(group.getByRole('radio',{name:/Minimal/})).toBeChecked();await expect(group.locator('p.text-sm.mt-1')).toHaveText(preview!);expect(await page.evaluate(()=>(window as any).blockedCalls)).toBe(1);
 const track=page.locator('.flicklet-marquee-track');await page.locator('.flicklet-marquee-container').scrollIntoViewIfNeeded();await expect(track).toHaveCSS('animation-name','flicklet-ticker-pass');const x=await track.evaluate(el=>el.getBoundingClientRect().x);await page.waitForTimeout(200);expect(await track.evaluate(el=>el.getBoundingClientRect().x)).toBeLessThan(x);await page.emulateMedia({reducedMotion:'reduce'});await expect(track).toHaveCSS('animation-name','none');
});
