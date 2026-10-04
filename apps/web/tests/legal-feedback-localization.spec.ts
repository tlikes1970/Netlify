import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let bundle:string,css:string;
test.use({channel:'chrome'});
const root=process.cwd();
test.beforeAll(async()=>{
 const mocks:Record<string,string>={
 'hooks/useAuth':`export function useAuth(){return {user:null,isAuthenticated:false,signInWithEmail:async()=>{window.authCalls=(window.authCalls||0)+1},createAccountWithEmail:async()=>{},signInWithProvider:async()=>{}}}`,
 'lib/authLogin':`export async function googleLogin(){}`,
 'hooks/usePreferredName':`export function usePreferredName(){return {uid:'owner',preferredName:'',loading:false,error:null,updatePreferredName:async value=>{window.savedName=value},retry:()=>{}}}`,
 'hooks/useEntitlements':`export function useEntitlements(){return {phase:'expiredReadOnly',paidPro:false,isReadOnlyMode:true,hasFullAccess:false}}`,
 'hooks/useFullAccessProduct':`export function useFullAccessProduct(){return {status:'available',product:{price:'12,99 €',productId:'flicklet_full_access'}}}`,
 'lib/backupPersistence':`export async function createBackup(){return {createdAt:'2026-10-01'}} export async function restoreBackup(){}`,
 'lib/startOver':`export async function startOver(){window.resetCalls=(window.resetCalls||0)+1;throw Error('SECRET')}`,
 'lib/proUpgrade':`export function startProUpgrade(){}`,
 'lib/settings':`export function useSettings(){return {layout:{},notifications:{},personality:'Zen'}} export const settingsManager={};export function resolveFlickletLine(){return ''}`,
 'lib/customLists':`export function useCustomLists(){return {customLists:[],maxLists:3}}export const customListManager={}`,
 'lib/storage':`export function useLibrary(){return []} export const Library={getAll:()=>[]}`,
 'hooks/useAdminRole':`export function useAdminRole(){return {isAdmin:false}}`,
 'components/modals/SharingModal':`export default function Sharing(){return null}`,
 'components/ResetSettingsButton':`export default function Reset(){return null}`,
 'components/ForYouGenreConfig':`export default function Genres(){return null}`,
 'components/modals/NotificationCenter':`export function NotificationCenter(){return null}`,
 'pages/AdminExtrasPage':`export default function Admin(){return null}`,
 };
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {renderSettingsSection} from './src/components/settingsSections';import FeedbackPanel from './src/components/FeedbackPanel';import {changeLanguage} from './src/lib/language';window.localize=changeLanguage;createRoot(document.getElementById('root')).render(<main style={{padding:8}}>{renderSettingsSection('about',{})}<FeedbackPanel/></main>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'boundaries',setup(builder){builder.onResolve({filter:/^(\.\.?\/|@\/)/},args=>{const absolute=path.resolve(args.path.startsWith('@/')?path.join(root,'src'):args.resolveDir,args.path.replace(/^@\//,'')).replace(/\.(tsx?|jsx?)$/,'');for(const key of Object.keys(mocks))if(absolute===path.join(root,'src',key))return{path:key,namespace:'mock'};return undefined;});builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],resolveDir:root,loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;const dir=path.join(root,'dist/assets');const name=fs.readdirSync(dir).find(n=>n.startsWith('appBootstrap-')&&n.endsWith('.css'));if(!name)throw Error('Build first');css=fs.readFileSync(path.join(dir,name),'utf8');
});

for(const width of [320,360,390,768,1023,1024,1280])test(`Legal and feedback live localization at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.route('http://legal.test/**',r=>r.fulfill({contentType:'text/html',body:`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle}</script></body></html>`}));await page.goto('http://legal.test');
 await page.getByRole('textbox',{name:'Your feedback'}).fill('My original feedback');
 for(const lang of ['en','es','en']){await page.evaluate(l=>(window as any).localize(l),lang);const link=page.getByRole('link',{name:lang==='es'?'Abrir la política de privacidad (se abre en una pestaña nueva)':'Open Privacy Policy (opens in a new tab)'});await link.scrollIntoViewIfNeeded();await expect(link).toHaveAttribute('href','https://flicklet.netlify.app/privacy.html');await expect(link).toBeVisible();expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);await expect(page.getByText(lang==='es'?/Atribución de datos:/:/Data Attribution:/)).toBeVisible();const input=page.getByRole('textbox',{name:lang==='es'?'Tus comentarios':'Your feedback'});await input.scrollIntoViewIfNeeded();await expect(input).toHaveValue('My original feedback');const button=page.getByRole('button',{name:lang==='es'?'Enviar Comentario':'Send Feedback',exact:true});await button.scrollIntoViewIfNeeded();await expect(button).toBeVisible();await expect(page.getByText('support@flickletapp.com')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
