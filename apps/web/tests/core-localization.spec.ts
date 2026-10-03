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
let headerBundle: string;
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
    "search/enhancedAutocomplete": `export async function fetchEnhancedAutocomplete(){return []}`,

    "features/compact/CompactPrimaryAction": `export function CompactPrimaryAction(){return null}`,
    "lib/readOnlyGuard": `export function notifyReadOnlyBlocked(){} export function guardMutation(){return true} export function isMutationBlocked(){return false}`,
    "lib/customLists": `export function useCustomLists(){return {customLists:[{id:"family",name:"Family",itemCount:2}],selectedListId:"family",maxLists:3}} export const customListManager={getSelectedList:()=>({id:"family"}),getListById:id=>id==="family"?{id,name:"Family"}:null,setSelectedList:()=>{}}`,
    "lib/proUpgrade": `export function startProUpgrade(){}`,
    "lib/settings": `export function useSettings(){return {layout:{episodeTracking:false,condensedView:true}}} export function getPersonalityText(){return ""} export const DEFAULT_PERSONALITY="Zen"`,
    "hooks/useAuth": `export function useAuth(){return {isAuthenticated:true,user:{uid:"browser-test"}}}`,
    "hooks/useSmartDiscovery": `export function useSmartDiscovery(){return {recommendations:[{item:{id:"d1",kind:"movie",title:"Short",poster:"",year:2025,overview:"An existing overview with enough words to wrap into multiple lines. ".repeat(5)}},{item:{id:"d2",kind:"tv",title:"A very long Discovery title that needs more than two lines to display",poster:""}},{item:{id:"d3",kind:"movie",title:"Want title",poster:"",year:2024}}],isLoading:false,error:null}}`,
    "lib/storage": `export function useLibrary(){return [{id:"41",mediaType:"tv",title:"Custom TV",year:"2025",showStatus:"Returning Series",networks:["Network"],synopsis:"Saved description",userRating:3,userNotes:"Note",tags:["Family"]},{id:"42",mediaType:"movie",title:"Custom movie",year:"2025",synopsis:"Saved description",userRating:3}]} import {t} from "@/lib/language";export function getListDisplayName(list){return t({watching:"coreWatching",wishlist:"coreWant",watched:"coreWatched",not:"coreNot"}[list])} const entries=new Map();const subs=new Set();export const Library={addToCustomList:()=>{},has:(id)=>entries.has(id),upsert:(item,list)=>{entries.set(item.id,{...item,list});subs.forEach(fn=>fn());},updateRating:(id,type,rating)=>{entries.get(id).userRating=rating;subs.forEach(fn=>fn());},getEntry:(id)=>entries.get(id)||(id==="tracked"?{id,mediaType:"movie",title:"Tracked title",list:"watched",userRating:3}:null),getCurrentList:(id)=>entries.get(id)?.list||(id==="tracked"?"watched":id==="custom-watching"?"watching":id==="custom-want"?"wishlist":id==="custom-watched"?"watched":id==="custom-not"?"not":null),subscribe:(fn)=>{subs.add(fn);return ()=>subs.delete(fn)},getAll:()=>[],getByList:()=>[{id:"41",mediaType:"tv",title:"Custom TV",year:"2025",showStatus:"Returning Series",networks:["Network"],synopsis:"Saved description",userRating:3,userNotes:"Note",tags:["Family"]},{id:"42",mediaType:"movie",title:"Custom movie",year:"2025",synopsis:"Saved description",userRating:3}]};export function addToListWithConfirmation(){}`,
    "lib/membership": `export function getMembershipInfo(item){return item.id==="tracked"?{list:"watched",displayName:"Watched"}:{list:null,displayName:null}}`,
    "lib/statusTransitions": `export function setPrimaryStatus(){} export async function setNotInterested(){return true}`,
    "components/WatchingListWithBackdrop": `export function useBackdropCallbacks(){return null}`,
    "hooks/useEntitlements": `export function useEntitlements(){return {hasFullAccess:true,isReadOnlyMode:false}}`,
    "components/Toast": `export function useToast(){return {addToast:()=>{}}}`,
    "lib/shareLinks": `export function shareShowWithFallback(){} export function shareListWithFallback(){}`,
    "state/actions": `export function getToastCallback(){return ()=>{}}`,
    "lib/seriesReminders": `export function isSeriesReminderEnabled(){return false}`,
    "tmdb/tv": `export async function fetchCurrentEpisodeInfo(){return {season:1,episode:2}} export async function fetchNextAirDate(){} export async function fetchShowStatus(){}`,
    "search/cache": `export function cachedSearchMulti(){}`,
    "search/smartSearch": `export async function smartSearch(query){return {items:query==="Braking Bad"?[]:[{id:"corrected",mediaType:"tv",title:"Breaking Bad",year:"2008"}],page:1,totalPages:1}}`,
    "search/api": `export async function fetchNetworkInfo(){return {}} export async function fetchFullMediaMetadata(item){return item} export function discoverByGenre(){}`,
    "lib/tmdb": `export function getTVShowDetails(){}`,
    "lib/events": `export function emit(){}`,
    "lib/confirmRemoveShow": `export function removeMediaItemWithConfirmation(){}`,
    "components/modals/EpisodeTrackingModal": `export function EpisodeTrackingModal(){return null}`,
    "components/EpisodeProgressDisplay": `export function EpisodeProgressDisplay(){return null}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import TabCard from './src/components/cards/TabCard';import MyListsPage from './src/pages/MyListsPage';import {SearchResultCard} from './src/search/SearchResults';import Tabs from './src/components/Tabs';import MobileTabs from './src/components/MobileTabs';import LibrarySegmentBar from './src/components/LibrarySegmentBar';import ListFilters from './src/components/ListFilters';import SortDropdown from './src/components/SortDropdown';import GenreRowConfig from './src/components/GenreRowConfig';import DiscoveryPage from './src/pages/DiscoveryPage';import FlickletHeader from './src/components/FlickletHeader';import {changeLanguage} from './src/lib/language';import {useIsDesktop} from './src/hooks/useDeviceDetection';function Navigation(){const {isDesktop}=useIsDesktop();return isDesktop?<Tabs current="library" onChange={()=>{}}/>:<MobileTabs current="library" onChange={()=>{}} onSettingsClick={()=>{}}/>;}window.coreLocale=changeLanguage;const item={id:'31',mediaType:'tv',title:'A long saved title that needs two lines',year:'2025',showStatus:'Returning Series',networks:['Netflix'],synopsis:'An unchanged English synopsis from TMDB.',userRating:3,userNotes:'My unchanged note',tags:['Family']};const actions={onWant:()=>{},onWatched:()=>{},onNotInterested:()=>{},onDelete:()=>{},onRatingChange:()=>{},onNotesEdit:()=>{}};createRoot(document.getElementById('root')).render(<><section data-testid="header"><FlickletHeader showGreeting={false} onNavigateHome={()=>{}}/></section><Navigation/><LibrarySegmentBar segment="want" counts={{watching:1,want:2,watched:0,mylists:1}} onChange={()=>{}}/><main style={{padding:8,maxWidth:1000,margin:'auto',paddingBottom:100}}><section data-testid="filters"><ListFilters value={{type:'all',providers:[]}} availableProviders={['Netflix']} onChange={()=>{}}/><SortDropdown value="date-newest" onChange={()=>{}}/></section><section data-testid="library">{['watching','want','watched'].map(tab=><TabCard key={tab} item={item} tabType={tab} actions={actions}/>)}</section><section data-testid="custom"><MyListsPage onNotesEdit={actions.onNotesEdit}/></section><section data-testid="search"><SearchResultCard item={{...item,id:'51',voteAverage:7.2}} index={0} onRemove={()=>{}} actions={actions}/></section><section data-testid="discovery"><DiscoveryPage/></section><section data-testid="genre"><GenreRowConfig row={{id:'1',mainGenre:'horror',subGenre:'psychological',title:'Horror/Psychological'}} onUpdate={()=>{}} onRemove={()=>{}} canRemove/></section></main></>);`,
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
  headerBundle = result.outputFiles[0].text;
  const assets = path.join(appRoot, "dist/assets");
  const cssFile = fs
    .readdirSync(assets)
    .find((file) => file.startsWith("appBootstrap-") && file.endsWith(".css"));
  if (!cssFile)
    throw new Error("Run web:build or mobile:build before responsive tests");
  css = fs.readFileSync(path.join(assets, cssFile), "utf8");
});
for (const width of [320,360,390,768,1023,1024,1280]) {
 test(`core UI switches English Spanish English at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.route('https://core-test.local/**',route=>route.fulfill({contentType:'text/html',body:'<html><body><div id="root"></div></body></html>'}));
  await page.goto('https://core-test.local/');await page.addStyleTag({content:css});await page.addScriptTag({content:headerBundle});
  for(const language of ['en','es','en'] as const){
   await page.evaluate(lang=>window.coreLocale!(lang),language);
   const es=language==='es';const library=page.getByTestId('library');
   await page.evaluate(()=>window.scrollTo(0,0));
   const header=page.getByTestId('header');
   await expect(header.getByRole('searchbox',{name:es?'Buscar películas, series y personas':'Search movies, shows, people'})).toBeVisible();
   await header.getByRole('button',{name:es?'Cerrar sesión':'Log Out',exact:true}).click();
   const logout=page.getByRole('alertdialog');await expect(logout).toBeVisible();
   await logout.getByRole('button',{name:es?'Cancelar':'Cancel',exact:true}).click();
   await header.getByRole('button',{name:es?/^Filtros:/:/^Filters:/}).click();
   await page.getByRole('button',{name:es?'Búsqueda avanzada →':'Advanced Search →',exact:true}).click();
   await expect(page.getByRole('button',{name:es?'Aplicar':'Apply',exact:true})).toBeVisible();
   await page.getByRole('button',{name:es?'Cerrar filtros':'Close filters',exact:true}).click();

   await expect(page.getByRole('tab',{name:es?'Quiero ver, 2 títulos':'Want to Watch, 2 items'})).toBeVisible();
   await expect(library.getByText(es?'2025 • Serie':'2025 • TV Show',{exact:true})).toHaveCount(3);
   await expect(library.getByText('A long saved title that needs two lines',{exact:true})).toHaveCount(3);
   await expect(library.getByText('An unchanged English synopsis from TMDB.',{exact:true})).toHaveCount(3);
   await expect(page.getByTestId('genre').getByLabel(es?'Género principal':'Main Genre')).toBeVisible();
   await expect(page.getByTestId('search').getByText(es?'TMDB 7,2/10':'TMDB 7.2/10',{exact:true})).toBeVisible();
   await expect(page.getByTestId('custom').getByRole('heading',{name:'Family',exact:true})).toBeVisible();
   if(width<1024){
    await library.getByRole('button',{name:es?'Más opciones':'More options',exact:true}).first().click();
    await expect(page.getByRole('menuitem',{name:es?'Notas y etiquetas':'Notes & Tags',exact:true})).toBeVisible();
    await expect(page.getByRole('menuitem',{name:es?'No me interesa':'Not Interested',exact:true})).toBeVisible();
    await page.keyboard.press('Escape');
    for(const poster of await library.locator('.poster-image').all()){const b=await poster.boundingBox();expect(b!.width).toBe(112);expect(b!.height).toBe(168)}
   }else{
    await expect(library.getByRole('button',{name:es?'📝 Notas y etiquetas':'📝 Notes & Tags',exact:true})).toHaveCount(3);
    await expect(library.getByRole('button',{name:es?'Extras':'Extras',exact:true})).toHaveCount(3);
   }
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.getByTestId('filters').getByRole('button',{name:es?/^Cadena/:/^Network/}).click();
   await expect(page.getByRole('dialog',{name:es?'Seleccionar cadenas':'Select networks'})).toBeVisible();
   await expect(page.getByRole('checkbox',{name:'Netflix'})).toBeVisible();
   await page.getByRole('button',{name:es?'Listo':'Done',exact:true}).click();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
   for(const control of await library.locator('button').all()){
    if(await control.isVisible()){const b=await control.boundingBox();expect(b!.x).toBeGreaterThanOrEqual(0);expect(b!.x+b!.width).toBeLessThanOrEqual(width+1);expect(await control.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true)}
   }
  }
  await page.evaluate(()=>window.coreLocale!('es'));
  await expect(page.getByRole('tab',{name:'Quiero ver, 2 títulos'})).toBeVisible();
  await page.reload();await page.addStyleTag({content:css});await page.addScriptTag({content:headerBundle});
  await expect(page.getByRole('tab',{name:'Quiero ver, 2 títulos'})).toBeVisible();
  await expect(page.getByTestId('header').getByRole('button',{name:'Cerrar sesión',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.lang)).toBe('es');
 });
}
