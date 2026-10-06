import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let bundle:string,css:string;
const root=process.cwd();
test.beforeAll(async()=>{
 const mocks:Record<string,string>={
  'lib/storage':`import {saveTabState} from './src/lib/tabState';export const Library={reorder(list,from,to,ids){const next=[...ids];next.splice(to,0,next.splice(from,1)[0]);saveTabState(list==='wishlist'?'want':list,{sort:'custom',order:{mode:'custom',ids:next}});}};export function flushPendingSaves(){}`,
  'lib/readOnlyGuard':`export function guardMutation(){return true}`,
  'utils/scrollFeatureFlags':`export function isScrollFeatureEnabled(){return false}`,
  'lib/settings':`export function useSettings(){return {personalityLevel:2,layout:{}}} export function resolveFlickletLine(){return 'This status is empty.'}`,
  'lib/tabStateSync':`export async function syncTabStateToFirebase(){}`,
  'lib/analytics':`export function trackSortChange(){} export function trackFilterChange(){} export function trackReorderCompleted(){}`,
  'lib/tmdb':`export async function getTVShowDetails(){}`,
  'lib/statusTransitions':`export function setPrimaryStatus(){window.swiped=(window.swiped||0)+1} export async function setNotInterested(){return true}`,
  'lib/confirmRemoveShow':`export function removeMediaItemWithConfirmation(){}`,
  'utils/backfillSynopsis':`export async function backfillSynopsisForItems(){}`,
  'components/cards/TabCard':`import React from 'react';import SwipeableCard from './src/components/SwipeableCard';export default function Card({item,dragState}){return <SwipeableCard item={item} context="tab-watching" disableSwipe={dragState.isDragging}><article style={{height:180,background:'white',border:'1px solid gray'}} data-testid="result"><p>{item.title}</p><button onClick={()=>window.clicked=true}>Actions {item.title}</button></article></SwipeableCard>}`,
  'components/modals/EpisodeTrackingModal':`export function EpisodeTrackingModal(){return null}`,
 };
 const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import ListPage from './src/pages/ListPage';import {saveTabState,notifyTabStateChanged} from './src/lib/tabState';const mode=window.libraryMode || 'watching';const long='A Very Long Television Network Name '.repeat(5);const longTag='A long personal collection tag '.repeat(4);const items=[{id:'1',title:'Alpha',mediaType:'tv',list:'watching',addedAt:1,networks:['Netflix'],tags:['family']},{id:'2',title:'Beta',mediaType:'movie',list:'watching',addedAt:2,tags:['drama']},{id:'3',title:'Charlie',mediaType:'tv',list:'watching',addedAt:3,networks:[long],tags:['family',longTag]}];window.restoreTab=async()=>{await saveTabState(mode,{sort:'custom',filter:{type:'tv',providers:['Netflix']},order:{mode:'custom',ids:['1:tv']}});notifyTabStateChanged(mode,'cloud');};createRoot(document.getElementById('root')).render(<ListPage title={mode} mode={mode} items={items}/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,loader:{'.css':'empty'},format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'boundaries',setup(builder){builder.onResolve({filter:/^(\.\.?\/|@\/)/},args=>{const absolute=path.resolve(args.path.startsWith('@/')?path.join(root,'src'):args.resolveDir,args.path.replace(/^@\//,'')).replace(/\.(tsx?|jsx?)$/,'');for(const key of Object.keys(mocks))if(absolute===path.join(root,'src',key))return {path:key,namespace:'mock'};return undefined;});builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],resolveDir:root,loader:'tsx'}));}}]});
 bundle=result.outputFiles[0].text;
 const dir=path.join(root,'dist/assets');css=fs.readdirSync(dir).filter(name=>name.endsWith('.css')).map(name=>fs.readFileSync(path.join(dir,name),'utf8')).join('\n');
});

for(const width of [320,360,390,768,1023]) for(const mode of ['watching','want','watched']) test(`native touch reorder and swipe at ${width} ${mode}`,async({page})=>{
 await page.setViewportSize({width,height:800});
 await page.route('http://reorder.test/',route=>route.fulfill({contentType:'text/html',body:`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>window.libraryMode=${JSON.stringify(mode)};</script><script>${bundle}</script></body></html>`}));
 await page.goto('http://reorder.test/');await expect(page.getByTestId('result')).toHaveText(['CharlieActions Charlie','BetaActions Beta','AlphaActions Alpha']);
 const session=await page.context().newCDPSession(page);
 const touch=async(type:string,x=150,y=200)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
 const rows=page.locator('[data-reorder-id]');const first=await rows.first().boundingBox(),second=await rows.nth(1).boundingBox();
 const y=first!.y+90;
 await touch('touchStart',150,y);await page.waitForTimeout(240);await expect(rows.first()).toHaveClass(/is-touch-reordering/);
 await touch('touchMove',150,second!.y+90);await expect(rows.first()).toHaveCSS('transform',/matrix.*192/);
 expect(await rows.first().evaluate(el=>getComputedStyle(el).zIndex)).toBe('100');
 await touch('touchEnd');await expect(page.getByTestId('result')).toHaveText(['BetaActions Beta','CharlieActions Charlie','AlphaActions Alpha']);
 expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await page.reload();await expect(page.getByTestId('result')).toHaveText(['BetaActions Beta','CharlieActions Charlie','AlphaActions Alpha']);
 const box=await rows.first().boundingBox();await touch('touchStart',100,box!.y+90);await touch('touchMove',230,box!.y+90);await page.waitForTimeout(30);await touch('touchEnd');expect(await page.evaluate(()=> (window as unknown as {swiped:number}).swiped)).toBe(1);
});
