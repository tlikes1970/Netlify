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
  'components/modals/EpisodeTrackingModal':`export function EpisodeTrackingModal(){return null}`,
 };
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import ListPage from './src/pages/ListPage';import {saveTabState,notifyTabStateChanged} from './src/lib/tabState';const mode=window.libraryMode || 'watching';const long='A Very Long Television Network Name '.repeat(5);const longTag='A long personal collection tag '.repeat(4);const items=[{id:'1',title:'Alpha',mediaType:'tv',list:'watching',addedAt:1,networks:['Netflix'],tags:['family']},{id:'2',title:'Beta',mediaType:'movie',list:'watching',addedAt:2,tags:['drama']},{id:'3',title:'Charlie',mediaType:'tv',list:'watching',addedAt:3,networks:[long],tags:['family',longTag]}];window.restoreTab=async()=>{await saveTabState(mode,{sort:'custom',filter:{type:'tv',providers:['Netflix']},order:{mode:'custom',ids:['1:tv']}});notifyTabStateChanged(mode,'cloud');};createRoot(document.getElementById('root')).render(<ListPage title={mode} mode={mode} items={items}/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,loader:{'.css':'empty'},format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'boundaries',setup(builder){builder.onResolve({filter:/^(\.\.?\/|@\/)/},args=>{const absolute=path.resolve(args.path.startsWith('@/')?path.join(root,'src'):args.resolveDir,args.path.replace(/^@\//,'')).replace(/\.(tsx?|jsx?)$/,'');for(const key of Object.keys(mocks))if(absolute===path.join(root,'src',key))return {path:key,namespace:'mock'};return undefined;});builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],resolveDir:root,loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;
 const dir=path.join(root,'dist/assets');css=fs.readdirSync(dir).filter(name=>name.endsWith('.css')).map(name=>fs.readFileSync(path.join(dir,name),'utf8')).join('\n');
});
for(const width of [320,360,390,430,768,1023,1024,1280]) for(const mode of ['watching','want','watched']) test(`Library filters fit and work at ${width}px ${mode}`,async({page})=>{
 await page.setViewportSize({width,height:800});
 await page.route('http://filters.test/',route=>route.fulfill({contentType:'text/html',body:`<html><head><style>${css}</style></head><body><div id="root"></div><script>window.libraryMode=${JSON.stringify(mode)};</script><script>${bundle}</script></body></html>`}));await page.goto('http://filters.test/');
 await expect(page.getByTestId('result')).toHaveCount(3);
 const phone=width<768;
 const toolbar=page.locator(phone?'.library-phone-toolbar':'.library-filter-toolbar');
 const toolbarBox=await toolbar.boundingBox(),first=await page.getByTestId('result').first().boundingBox();
 expect(first!.y).toBeGreaterThanOrEqual(toolbarBox!.y+toolbarBox!.height);
 if(phone){
  expect(toolbarBox!.height).toBeLessThanOrEqual(52);
  await expect(page.getByLabel('Type:')).toHaveCount(0);await expect(page.getByLabel('Filter by tag')).toHaveCount(0);
 }
 const sort=page.getByLabel('Sort:');await sort.selectOption('alphabetical-za');
 const openFilters=async()=>{if(phone)await page.getByRole('button',{name:/^Filters/}).click();};
 await openFilters();
 const type=page.getByLabel('Type:'),tag=page.getByLabel('Filter by tag');
 const network=async(name:RegExp|string)=>{
  if(!phone)await page.getByRole('button',{name:/^Network/}).click();
  await page.getByRole('checkbox',{name,exact:typeof name==='string'}).check();
  if(!phone)await page.getByRole('button',{name:'Done'}).click();
 };
 for(const control of [type,sort,tag]){const box=await control.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);}
 await network(/A Very Long Television Network/);await expect(page.getByTestId('result')).toHaveText(['Charlie']);
 await page.getByRole('button',{name:'Clear Filters'}).click();
 const longTag=await tag.locator('option').filter({hasText:'A long personal collection tag'}).getAttribute('value');await tag.selectOption(longTag!);await expect(page.getByTestId('result')).toHaveText(['Charlie']);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await page.getByRole('button',{name:'Clear Filters'}).click();await network('Netflix');await type.selectOption('tv');await tag.selectOption('family');await expect(page.getByTestId('result')).toHaveText(['Alpha']);
 if(phone){
  const dialog=page.getByRole('dialog',{name:'Filters'});const box=await dialog.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);expect(box!.y+box!.height).toBeLessThanOrEqual(800);expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.getByRole('button',{name:'Filters (3)'})).toBeFocused();await openFilters();await expect(type).toHaveValue('tv');await expect(tag).toHaveValue('family');await expect(page.getByRole('checkbox',{name:'Netflix',exact:true})).toBeChecked();
 }
 await page.getByRole('checkbox',{name:'Sort by tag'}).check();await type.selectOption('movie');await expect(page.getByText('No items match your filters',{exact:true})).toBeVisible();
 const clear=page.getByRole('button',{name:'Clear Filters'});await clear.last().click();await expect(page.getByTestId('result')).toHaveCount(3);await expect(sort).toHaveValue('alphabetical-za');
 if(phone)await page.getByRole('button',{name:'Close modal'}).click();
 await page.evaluate(()=> (window as unknown as {restoreTab:()=>Promise<void>}).restoreTab());await expect(sort).toHaveValue('custom');await expect(page.getByTestId('result')).toHaveText(['Alpha']);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 console.log('CURRENT FILTER GEOMETRY',width,mode,{toolbarHeight:toolbarBox!.height,firstCardY:first!.y});
});