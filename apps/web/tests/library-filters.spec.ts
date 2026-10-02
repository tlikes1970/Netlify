import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let bundle:string,css:string;
const root=process.cwd();
test.beforeAll(async()=>{
 const mocks:Record<string,string>={
  'lib/storage':`export const Library={};export function flushPendingSaves(){}`,
  'lib/settings':`export function useSettings(){return {personalityLevel:2,layout:{}}} export function resolveFlickletLine(){return 'This status is empty.'}`,
  'lib/tabStateSync':`export async function syncTabStateToFirebase(){}`,
  'lib/analytics':`export function trackSortChange(){} export function trackFilterChange(){} export function trackReorderCompleted(){}`,
  'lib/tmdb':`export async function getTVShowDetails(){}`,
  'lib/statusTransitions':`export function setPrimaryStatus(){} export async function setNotInterested(){return true}`,
  'lib/confirmRemoveShow':`export function removeMediaItemWithConfirmation(){}`,
  'utils/backfillSynopsis':`export async function backfillSynopsisForItems(){}`,
  'components/cards/TabCard':`import React from 'react';export default function Card({item}){return <div data-testid="result">{item.title}</div>}`,
  'components/WatchingListWithBackdrop':`import React from 'react';export function WatchingListWithBackdrop({children}){return <div>{children}</div>}`,
  'components/modals/EpisodeTrackingModal':`export function EpisodeTrackingModal(){return null}`,
 };
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import ListPage from './src/pages/ListPage';import {saveTabState,notifyTabStateChanged} from './src/lib/tabState';const long='A Very Long Television Network Name '.repeat(5);const items=[{id:'1',title:'Alpha',mediaType:'tv',list:'watching',addedAt:1,networks:['Netflix'],tags:['family']},{id:'2',title:'Beta',mediaType:'movie',list:'watching',addedAt:2,tags:['drama']},{id:'3',title:'Charlie',mediaType:'tv',list:'watching',addedAt:3,networks:[long],tags:['family']}];window.restoreTab=async()=>{await saveTabState('watching',{sort:'custom',filter:{type:'tv',providers:['Netflix']},order:{mode:'custom',ids:['1:tv']}});notifyTabStateChanged('watching','cloud');};createRoot(document.getElementById('root')).render(<ListPage title="Watching" items={items}/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'boundaries',setup(builder){builder.onResolve({filter:/^(\.\.?\/|@\/)/},args=>{const absolute=path.resolve(args.path.startsWith('@/')?path.join(root,'src'):args.resolveDir,args.path.replace(/^@\//,'')).replace(/\.(tsx?|jsx?)$/,'');for(const key of Object.keys(mocks))if(absolute===path.join(root,'src',key))return {path:key,namespace:'mock'};return undefined;});builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],resolveDir:root,loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;
 const dir=path.join(root,'dist/assets');const file=fs.readdirSync(dir).find(name=>name.startsWith('appBootstrap-')&&name.endsWith('.css'));if(!file)throw Error('Build first');css=fs.readFileSync(path.join(dir,file),'utf8');
});
for(const width of [320,360,390,768,1280])test(`Library filters fit and work at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:800});
 await page.route('http://filters.test/',route=>route.fulfill({contentType:'text/html',body:`<html><head><style>${css}</style></head><body><div id="root"></div><script>${bundle}</script></body></html>`}));await page.goto('http://filters.test/');
 await expect(page.getByTestId('result')).toHaveCount(3);
 const type=page.getByLabel('Type:');const sort=page.getByLabel('Sort:');const tag=page.getByLabel('Filter by tag');
 for(const control of [type,sort,tag,page.getByRole('button',{name:/^Network/})]){const box=await control.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);}
 const trigger=page.getByRole('button',{name:/^Network/});await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','true');
 const dialog=page.getByRole('dialog',{name:'Select networks'});const box=await dialog.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);expect(box!.y+box!.height).toBeLessThanOrEqual(800);
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);await expect(dialog.getByRole('checkbox').first()).toBeFocused();
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
 await sort.selectOption('alphabetical-za');await trigger.click();await page.getByRole('checkbox',{name:'Netflix',exact:true}).check();await page.getByRole('button',{name:'Done'}).click();await type.selectOption('tv');await tag.selectOption('family');await expect(page.getByTestId('result')).toHaveText(['Alpha']);
 await page.getByRole('checkbox',{name:'Sort by tag'}).check();await expect(type).toBeEnabled();await expect(trigger).toBeEnabled();
 await type.selectOption('movie');await expect(page.getByText('No items match your filters',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Clear Filters'}).click();await expect(page.getByTestId('result')).toHaveCount(3);await expect(sort).toHaveValue('alphabetical-za');
 await page.evaluate(()=> (window as unknown as {restoreTab:()=>Promise<void>}).restoreTab());await expect(sort).toHaveValue('custom');await expect(page.getByRole('checkbox',{name:'Sort by tag'})).not.toBeChecked();await expect(page.getByTestId('result')).toHaveText(['Alpha']);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 if(width===390)await page.screenshot({path:test.info().outputPath('library-filters-390.png'),fullPage:true});
});
