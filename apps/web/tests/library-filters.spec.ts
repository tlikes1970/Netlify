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
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import ListPage from './src/pages/ListPage';import {saveTabState,notifyTabStateChanged} from './src/lib/tabState';const mode=window.libraryMode || 'watching';const long='A Very Long Television Network Name '.repeat(5);const longTag='A long personal collection tag '.repeat(4);const items=[{id:'1',title:'Alpha',mediaType:'tv',list:'watching',addedAt:1,networks:['Netflix'],tags:['family']},{id:'2',title:'Beta',mediaType:'movie',list:'watching',addedAt:2,tags:['drama']},{id:'3',title:'Charlie',mediaType:'tv',list:'watching',addedAt:3,networks:[long],tags:['family',longTag]}];window.restoreTab=async()=>{await saveTabState(mode,{sort:'custom',filter:{type:'tv',providers:['Netflix']},order:{mode:'custom',ids:['1:tv']}});notifyTabStateChanged(mode,'cloud');};createRoot(document.getElementById('root')).render(<ListPage title={mode} mode={mode} items={items}/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'boundaries',setup(builder){builder.onResolve({filter:/^(\.\.?\/|@\/)/},args=>{const absolute=path.resolve(args.path.startsWith('@/')?path.join(root,'src'):args.resolveDir,args.path.replace(/^@\//,'')).replace(/\.(tsx?|jsx?)$/,'');for(const key of Object.keys(mocks))if(absolute===path.join(root,'src',key))return {path:key,namespace:'mock'};return undefined;});builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],resolveDir:root,loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;
 const dir=path.join(root,'dist/assets');const file=fs.readdirSync(dir).find(name=>name.startsWith('appBootstrap-')&&name.endsWith('.css'));if(!file)throw Error('Build first');css=fs.readFileSync(path.join(dir,file),'utf8');
});
for(const width of [320,360,390,430,768,1023,1024,1280]) for(const mode of ['watching','want','watched']) test(`Library filters fit and work at ${width}px ${mode}`,async({page})=>{
 await page.setViewportSize({width,height:800});
 await page.route('http://filters.test/',route=>route.fulfill({contentType:'text/html',body:`<html><head><style>${css}</style></head><body><div id="root"></div><script>window.libraryMode=${JSON.stringify(mode)};</script><script>${bundle}</script></body></html>`}));await page.goto('http://filters.test/');
 await expect(page.getByTestId('result')).toHaveCount(3);
 const toolbar=page.locator('.library-filter-toolbar');
 // Compare against the previous flex presentation on the same production markup.
 const previous=await page.addStyleTag({content:`
 .library-filter-toolbar {display:flex;gap:12px;width:auto;}
 .library-filter-toolbar .library-type-network-controls {display:flex;gap:8px;flex-wrap:wrap;}
 .library-filter-toolbar .library-tag-controls {display:flex;gap:12px;flex-wrap:wrap;}
 .library-filter-toolbar .library-sort-control {gap:8px;}
 .library-filter-toolbar .library-type-control {gap:8px;min-width:auto;}
 .library-filter-toolbar .library-type-control select {width:auto;}
 .library-filter-toolbar .library-network-control {width:auto;overflow-wrap:normal;}
 .library-filter-toolbar .library-tag-sort {gap:8px;min-width:auto;}
 .library-filter-toolbar .library-tag-sort input {flex-shrink:1;}
 .library-filter-toolbar .library-tag-sort span {min-width:auto;}
 .library-filter-toolbar .library-tag-filter {display:flex;gap:8px;min-width:auto;}
 .library-filter-toolbar .library-tag-filter select {width:auto;}
 `});
 const before=await toolbar.boundingBox();
 const firstBefore=await page.getByTestId('result').first().boundingBox();
 await previous.evaluate(el=>el.remove());
 const after=await toolbar.boundingBox();
 const firstAfter=await page.getByTestId('result').first().boundingBox();
 console.log('FILTER METRICS',mode,width,{heightBefore:before!.height,heightAfter:after!.height,firstBefore:firstBefore!.y,firstAfter:firstAfter!.y});
 if(width<768){
  await expect(toolbar).toHaveCSS('display','grid');
  expect(after!.height).toBeLessThan(before!.height*0.8);
  expect(firstAfter!.y).toBeLessThan(firstBefore!.y);
 }else{
  await expect(toolbar).toHaveCSS('display','flex');
  expect(after!.height).toBeLessThanOrEqual(before!.height);
 }
 expect(firstAfter!.y).toBeGreaterThanOrEqual(after!.y+after!.height);

 const type=page.getByLabel('Type:');const sort=page.getByLabel('Sort:');const tag=page.getByLabel('Filter by tag');
 for(const control of [type,sort,tag,page.getByRole('button',{name:/^Network/})]){const box=await control.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);}
 const trigger=page.getByRole('button',{name:/^Network/});await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','true');
 const dialog=page.getByRole('dialog',{name:'Select networks'});const box=await dialog.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);expect(box!.y+box!.height).toBeLessThanOrEqual(800);
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);await expect(dialog.getByRole('checkbox').first()).toBeFocused();
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();

 await trigger.click();
 await dialog.getByRole('checkbox',{name:/A Very Long Television Network/}).check();
 await page.getByRole('button',{name:'Done'}).click();
 await expect(page.getByTestId('result')).toHaveText(['Charlie']);
 await page.getByRole('button',{name:'Clear Filters'}).click();
 const longTag=await tag.locator('option').filter({hasText:'A long personal collection tag'}).getAttribute('value');
 await tag.selectOption(longTag!);await expect(page.getByTestId('result')).toHaveText(['Charlie']);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await page.getByRole('button',{name:'Clear Filters'}).click();
 await sort.selectOption('alphabetical-za');await trigger.click();await page.getByRole('checkbox',{name:'Netflix',exact:true}).check();await page.getByRole('button',{name:'Done'}).click();await type.selectOption('tv');await tag.selectOption('family');await expect(page.getByTestId('result')).toHaveText(['Alpha']);
 await page.getByRole('checkbox',{name:'Sort by tag'}).check();await expect(type).toBeEnabled();await expect(trigger).toBeEnabled();
 await type.selectOption('movie');await expect(page.getByText('No items match your filters',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Clear Filters'}).click();await expect(page.getByTestId('result')).toHaveCount(3);await expect(sort).toHaveValue('alphabetical-za');
 await page.evaluate(()=> (window as unknown as {restoreTab:()=>Promise<void>}).restoreTab());await expect(sort).toHaveValue('custom');await expect(page.getByRole('checkbox',{name:'Sort by tag'})).not.toBeChecked();await expect(page.getByTestId('result')).toHaveText(['Alpha']);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 if(width===390)await page.screenshot({path:test.info().outputPath('library-filters-390.png'),fullPage:true});
});
