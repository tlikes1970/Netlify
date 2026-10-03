import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
declare global { interface Window { coreLocale?: (lang:'en'|'es') => void; } }
let metadataBundle: string;
let css: string;

// Render real card components with local data boundaries and production CSS.
test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    "hooks/usePreferredName": `export function usePreferredName(){return {uid:'owner',preferredName:'User name',loading:false,error:null}}`,
    "components/PreferredNamePromptModal": `export default function Modal(){return null}`,
    "components/AuthModal": `export default function Modal(){return null}`,
    "components/HomeGreeting": `export default function Greeting(){return null}`,
    "components/VoiceSearch": `export default function Voice(){return null}`,
    "pwa/useInstall": `export function useCanInstallPWA(){return false}`,

    "features/compact/CompactPrimaryAction": `export function CompactPrimaryAction(){return null}`,
    "lib/readOnlyGuard": `export function notifyReadOnlyBlocked(){} export function guardMutation(){return true} export function isMutationBlocked(){return false}`,
    "lib/customLists": `export function useCustomLists(){return {customLists:[{id:"family",name:"Family",itemCount:2}],selectedListId:"family",maxLists:3}} export const customListManager={getSelectedList:()=>({id:"family"}),getListById:id=>id==="family"?{id,name:"Family"}:null,setSelectedList:()=>{}}`,
    "lib/proUpgrade": `export function startProUpgrade(){}`,
    "lib/auth": `export const authManager={getCurrentUser:()=>({uid:"browser-test"})}`,
    "lib/settings": `export function useSettings(){return {layout:{episodeTracking:false,condensedView:true}}} export function resolveFlickletLine(){return ""} export function getPersonalityText(){return ""} export const DEFAULT_PERSONALITY="Zen"`,
    "hooks/useAuth": `export function useAuth(){return {isAuthenticated:true,user:{uid:"browser-test"}}}`,
    "lib/storage": `export function useLibrary(){return []}export function getListDisplayName(){return ''}export function addToListWithConfirmation(){}export const Library={has:()=>false,getAll:()=>[],getByList:()=>[],getEntry:()=>null,getCurrentList:()=>null,subscribe:()=>()=>{}}`,
    "lib/membership": `export function getMembershipInfo(item){return item.id==="tracked"?{list:"watched",displayName:"Watched"}:{list:null,displayName:null}}`,
    "lib/statusTransitions": `export function setPrimaryStatus(){} export async function setNotInterested(){return true}`,
    "components/WatchingListWithBackdrop": `export function useBackdropCallbacks(){return null}`,
    "hooks/useEntitlements": `export function useEntitlements(){return {hasFullAccess:true,isReadOnlyMode:false}}`,
    "components/Toast": `export function useToast(){return {addToast:()=>{}}}`,
    "lib/shareLinks": `export function shareShowWithFallback(){} export function shareListWithFallback(){}`,
    "state/actions": `export function getToastCallback(){return ()=>{}}`,
    "lib/seriesReminders": `export function isSeriesReminderEnabled(){return false}`,
    "tmdb/tv": `export async function fetchCurrentEpisodeInfo(){return {season:1,episode:2}} export async function fetchNextAirDate(){} export async function fetchShowStatus(){}`,
    "lib/events": `export function emit(){}`,
    "lib/confirmRemoveShow": `export function removeMediaItemWithConfirmation(){}`,
    "components/modals/EpisodeTrackingModal": `export function EpisodeTrackingModal(){return null}`,
    "components/EpisodeProgressDisplay": `export function EpisodeProgressDisplay(){return null}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import SearchResults from './src/search/SearchResults';import TabCard from './src/components/cards/TabCard';import SearchSuggestions from './src/components/SearchSuggestions';import DiscoveryPage from './src/pages/DiscoveryPage';import Rail from './src/components/Rail';import {useGenreContent} from './src/hooks/useGenreContent';import {changeLanguage} from './src/lib/language';function Saved(){const query=useGenreContent('drama','popular');const item=query.data?.[0];return item?<TabCard tabType="want" item={{id:item.id,mediaType:item.kind,title:item.title,year:String(item.year),synopsis:item.overview,userRating:4}} actions={{onWant:()=>{},onWatched:()=>{},onNotInterested:()=>{},onDelete:()=>{},onRatingChange:()=>{},onNotesEdit:()=>{}}}/>:null;}function ForYou(){const query=useGenreContent('drama','popular');return <Rail id="for-you-test" title="For You" items={query.data} loadState={query.isPending?'loading':'ready'}/>;}window.coreLocale=changeLanguage;createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><main style={{padding:8,maxWidth:1000,margin:'auto'}}><section data-testid="suggestions" style={{position:'relative',height:420}}><SearchSuggestions query="Locale" isVisible onClose={()=>{}} onSuggestionClick={()=>{}}/></section><section data-testid="search"><SearchResults query="Locale"/></section><section data-testid="discovery"><DiscoveryPage/></section><section data-testid="for-you"><ForYou/></section><section data-testid="saved"><Saved/></section></main></QueryClientProvider>);`,
      resolveDir: appRoot,
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    define: { "import.meta.env": "{}" },
    jsx: "automatic",
    plugins: [
      {
        name: "local-auth-boundaries",
        setup(builder) {
          builder.onResolve({ filter: /^(\.\.?\/|@\/)/ }, (args) => {
            const absolute = path
              .resolve(
                args.path.startsWith("@/")
                  ? path.join(appRoot, "src")
                  : args.resolveDir,
                args.path.replace(/^@\//, ""),
              )
              .replace(/\.(tsx?|jsx?)$/, "");
            for (const key of Object.keys(mocks)) {
              if (absolute === path.join(appRoot, "src", key))
                return { path: key, namespace: "mock" };
            }
            return undefined;
          });
          builder.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
            contents: mocks[args.path],
            loader: "js",
            resolveDir: appRoot,
          }));
        },
      },
    ],
  });
  metadataBundle = result.outputFiles[0].text;
  const assets = path.join(appRoot, "dist/assets");
  const cssFile = fs
    .readdirSync(assets)
    .find((file) => file.startsWith("appBootstrap-") && file.endsWith(".css"));
  if (!cssFile)
    throw new Error("Run web:build or mobile:build before responsive tests");
  css = fs.readFileSync(path.join(assets, cssFile), "utf8");
});

const widths=[320,360,390,768,1023,1024,1280];
for(const width of widths){
 test(`metadata EN ES EN and restart at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});const requests:URLSearchParams[]=[];
  await page.route('https://core-test.local/**',async route=>{
   const params=new URL(route.request().url()).searchParams;
   if(!params.has('path')&&!params.has('endpoint'))return route.fulfill({contentType:'text/html',body:'<html><body><div id="root"></div></body></html>'});
   requests.push(params);const es=params.get('language')==='es';const title=es?'Locale una historia española con un título largo para comprobar el espacio':'Locale an English story with a long title to check available space';
   const overview=es?'Una sinopsis española suficientemente larga para comprobar que los controles no se superponen al texto.':'An English overview long enough to check that controls remain separated from description text.';
   const item={id:701,title,name:title,original_title:'Original',media_type:'movie',overview,release_date:'2025-01-02',poster_path:'/poster.jpg',vote_average:7.2,vote_count:500,popularity:100,genre_ids:[18],production_companies:[{name:'Netflix'}]};
   return route.fulfill({contentType:'application/json',body:JSON.stringify({results:[item],...item,total_pages:1,page:1})});
  });
  await page.route('https://image.tmdb.org/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="112" height="168"><rect width="112" height="168" fill="gray"/></svg>'}));
  await page.goto('https://core-test.local/');await page.addStyleTag({content:css});await page.addScriptTag({content:metadataBundle});
  for(const language of ['en','es','en'] as const){
   const start=requests.length;await page.evaluate(lang=>window.coreLocale!(lang),language);
   const title=language==='es'?'Locale una historia española con un título largo para comprobar el espacio':'Locale an English story with a long title to check available space';
   for(const surface of ['search','discovery','for-you','suggestions','saved'])await expect(page.getByTestId(surface).getByText(surface==='search'?title+' (2025)':title,{exact:true}).first()).toBeVisible();
   if(language==='es'){
    const current=requests.slice(start);expect(current.some(p=>p.get('language')==='es'&&p.get('path')==='search/multi')).toBe(true);
    expect(current.some(p=>p.get('language')==='es'&&p.get('endpoint')==='/discover/movie')).toBe(true);
    expect(current.some(p=>p.get('language')==='es'&&p.get('endpoint')==='/trending/all/week')).toBe(true);
   }
   expect(requests.every(p=>p.get('region')!=='ES')).toBe(true);expect(requests.filter(p=>p.has('region')).every(p=>p.get('region')==='US')).toBe(true);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  }
  await page.evaluate(()=>window.coreLocale!('es'));await expect(page.getByTestId('search').getByText(/Locale una historia española/).first()).toBeVisible();
  const start=requests.length;await page.reload();await page.addStyleTag({content:css});await page.addScriptTag({content:metadataBundle});
  await expect(page.getByTestId('search').getByText(/Locale una historia española/).first()).toBeVisible();await expect(page.getByTestId('suggestions').getByText(/Locale una historia española/).first()).toBeVisible();
  expect(requests.slice(start).every(p=>p.get('language')==='es')).toBe(true);
 });
}

for(const [from,to] of [['en','es'],['es','en']] as const){
 test(`late ${from} metadata cannot replace selected ${to} production UI`,async({page})=>{
  let release!:()=>void;let pending=0;let completed=0;const held=new Promise<void>(resolve=>{release=resolve});
  const prior=from==='en'?'en-US':'es';
  await page.route('https://core-test.local/**',async route=>{
   const params=new URL(route.request().url()).searchParams;
   if(!params.has('path')&&!params.has('endpoint'))return route.fulfill({contentType:'text/html',body:'<html><body><div id="root"></div></body></html>'});
   if(params.get('language')===prior){pending++;await held;}
   const title=params.get('language')===prior?'Locale obsolete response':'Locale current response';
   const item={id:702,title,name:title,media_type:'movie',overview:'A description',release_date:'2025-01-01',vote_average:7,popularity:100,poster_path:'/poster.jpg'};
   await route.fulfill({contentType:'application/json',body:JSON.stringify({results:[item],...item,total_pages:1})}).catch(()=>{});if(params.get('language')===prior)completed++;
  });
  await page.route('https://image.tmdb.org/**',route=>route.fulfill({status:404,body:''}));
  await page.goto('https://core-test.local/');await page.evaluate(lang=>localStorage.setItem('flicklet.language.v2',lang),from);await page.addStyleTag({content:css});await page.addScriptTag({content:metadataBundle});
  await expect.poll(()=>pending).toBeGreaterThan(0);await page.evaluate(lang=>window.coreLocale!(lang),to);
  for(const surface of ['search','discovery','for-you','saved'])await expect(page.getByTestId(surface).getByText(/Locale current response/).first()).toBeVisible();
  const expected=pending;release();await expect.poll(()=>completed).toBeGreaterThanOrEqual(expected);await expect(page.getByText('Locale obsolete response',{exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.lang)).toBe(to);
  for(const surface of ['search','discovery','for-you','saved'])await expect(page.getByTestId(surface).getByText(/Locale current response/).first()).toBeVisible();
  await expect(page.getByTestId('discovery').getByText('Locale current response',{exact:true})).toBeVisible();await expect(page.getByText('Locale obsolete response',{exact:true})).toHaveCount(0);
 });
}
