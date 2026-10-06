import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let bundle:string,css:string;
const root=process.cwd();
test.beforeAll(async()=>{
 const mocks:Record<string,string>={
  'lib/storage':`export const Library={getByList:(id)=>window.entries.filter(x=>x.customListIds.includes(id.slice(7))),getEntry:()=>null};export function useLibrary(){return []}export function flushPendingSaves(){}`,
  'lib/settings':`export function useSettings(){return {personality:'Zen'}}export function getPersonalityText(){return 'Empty list'}export const DEFAULT_PERSONALITY='Zen';`,
  'lib/readOnlyGuard':`export function guardMutation(){return true}export function isMutationBlocked(){return false}`,
  'lib/entitlements':`export function subscribeEntitlements(){return ()=>{}}export function getEntitlementsSync(){return {hasFullAccess:true,isReadOnly:false}}`,
  'lib/proUpgrade':`export function startProUpgrade(){}export function isAndroidBillingAvailable(){return false}`,
  'lib/proConfig':`export function getMaxCustomLists(){return Infinity}`,
  'lib/shareLinks':`export async function shareListWithFallback(){window.shared=true}`,
  'state/actions':`export function getToastCallback(){return ()=>{}}`,
  'lib/statusTransitions':`export function setPrimaryStatus(){}export function setNotInterested(){}`,
  'components/cards/TabCard':`import React from 'react';export default function Card({item}){return <article data-testid="result">{item.title}</article>}`,
  'hooks/useEntitlements':`export function useEntitlements(){return {hasFullAccess:true}}`,
  'lib/tmdb':`export function getCoreTitleDetails(){}export async function get(endpoint,params){window.requests.push({endpoint,...params});return {results:[{id:1,name:'Source'},{id:2,name:params.language==='es'?'Otro título':'Other title',poster_path:'/poster.jpg',first_air_date:'2021-01-01'},{id:2,name:'duplicate'},{id:3,name:'Third title',first_air_date:'2020-01-01'}]}}`,
 };
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import MyListsPage from './src/pages/MyListsPage';import {ShowsLikeThisModal} from './src/components/extras/ShowsLikeThisModal';import {languageManager} from './src/lib/language';languageManager.setLanguage(window.locale);window.requests=[];window.entries=[{id:'2',mediaType:'tv',title:'Saved title',customListIds:['list0']},{id:'3',mediaType:'movie',title:'Another title',customListIds:['list1']}];const long='An extremely long custom list name '.repeat(6);localStorage.setItem('flicklet.customLists.v2',JSON.stringify({selectedListId:'list0',maxLists:Infinity,customLists:Array.from({length:40},(_,i)=>({id:'list'+i,name:i===0?long:'List '+i,itemCount:i<2?1:0,createdAt:i+1,isDefault:i===0}))}));window.dispatchEvent(new Event('customLists:updated'));const content=window.surface==='lists'?<MyListsPage/>:<ShowsLikeThisModal isOpen onClose={()=>{window.closed=true}} tmdbId={1} mediaType="tv" title="Source" onSelect={item=>window.selected=item}/>;createRoot(document.getElementById('root')).render(content);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,loader:{'.css':'empty'},format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'boundaries',setup(builder){builder.onResolve({filter:/^(\.\.?\/|@\/)/},args=>{const absolute=path.resolve(args.path.startsWith('@/')?path.join(root,'src'):args.resolveDir,args.path.replace(/^@\//,'')).replace(/\.(tsx?|jsx?)$/,'');for(const key of Object.keys(mocks))if(absolute===path.join(root,'src',key))return {path:key,namespace:'mock'};return undefined;});builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],resolveDir:root,loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;
 const dir=path.join(root,'dist/assets');css=fs.readdirSync(dir).filter(name=>name.endsWith('.css')).map(name=>fs.readFileSync(path.join(dir,name),'utf8')).join('\n');
});
async function load(page:any,width:number,surface:string,locale:string){await page.setViewportSize({width,height:800});await page.route('http://ux.test/',(route:any)=>route.fulfill({contentType:'text/html',body:`<html><head><style>${css}</style></head><body><div id="root"></div><script>window.surface=${JSON.stringify(surface)};window.locale=${JSON.stringify(locale)};</script><script>${bundle}</script></body></html>`}));await page.goto('http://ux.test/');}
for(const width of [320,360,390,430,768,1023,1024,1280]) for(const locale of ['en','es']){
 test(`Custom Lists ${width} ${locale}: compact header, long names, many lists and management`,async({page})=>{
  await load(page,width,'lists',locale);await expect(page.getByTestId('result')).toHaveText(['Saved title']);
  if(width<768){
   const toolbar=page.locator('.custom-list-phone-toolbar');const box=await toolbar.boundingBox();expect(box!.height).toBeLessThanOrEqual(52);const first=await page.getByTestId('result').boundingBox();expect(first!.y-box!.y-box!.height).toBeLessThanOrEqual(20);await expect(page.getByRole('heading')).toHaveCount(0);
   const selector=page.getByRole('combobox');await expect(selector.locator('option')).toHaveCount(40);await selector.selectOption('list1');await expect(page.getByTestId('result')).toHaveText(['Another title']);await selector.selectOption('list0');
   for(const control of [selector,page.getByRole('button',{name:locale==='en'?'Create New List':'Crear Nueva Lista'}),page.getByRole('button',{name:locale==='en'?'List actions':'Acciones de la lista'})]){const size=await control.boundingBox();expect(size!.height).toBeGreaterThanOrEqual(44);expect(size!.x+size!.width).toBeLessThanOrEqual(width);}
   const trigger=page.getByRole('button',{name:locale==='en'?'List actions':'Acciones de la lista'});await trigger.click();const dialog=page.getByRole('dialog');expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();await trigger.click();await page.getByRole('button',{name:locale==='en'?'Share':'Compartir',exact:true}).click();expect(await page.evaluate(()=> (window as any).shared)).toBe(true);
   console.log('CUSTOM LIST GEOMETRY',width,locale,{toolbarHeight:box!.height,firstCardY:first!.y});
  }else{await expect(page.locator('.custom-list-phone-toolbar')).toHaveCount(0);await expect(page.getByRole('heading',{level:1})).toBeVisible();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 });
 test(`Shows Like This ${width} ${locale}: real related titles and canonical selection`,async({page})=>{
  await load(page,width,'related',locale);const title=locale==='en'?'Other title':'Otro título';const link=page.getByRole('link',{name:title+' 2021'});await expect(link).toBeVisible();await expect(page.getByRole('link')).toHaveCount(2);await expect(link).toHaveAttribute('href','/?view=title&tmdbId=2&mediaType=tv');await expect(page.getByText('No insights found')).toHaveCount(0);const dialog=page.getByRole('dialog');const box=await dialog.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);expect(box!.y+box!.height).toBeLessThanOrEqual(800);expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);await link.click();expect(await page.evaluate(()=> (window as any).selected)).toMatchObject({id:2,mediaType:'tv'});expect(await page.evaluate(()=> (window as any).requests)).toEqual([{endpoint:'/tv/1/recommendations',language:locale==='en'?'en-US':'es'},{endpoint:'/tv/1/similar',language:locale==='en'?'en-US':'es'}]);
 });
}
