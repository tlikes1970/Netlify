import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
declare global { interface Window { testTab?: string; edited?: boolean; opened?: string | URL; } }
let headerBundle: string;
let css: string;

// Render real card components with local data boundaries and production CSS.
test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    "features/compact/CompactPrimaryAction": `export function CompactPrimaryAction(){return null}`,
    "components/MyListToggle": `export default function MyListToggle(){return null}`,
    "lib/readOnlyGuard": `export function notifyReadOnlyBlocked(){} export function guardMutation(){return true}`,
    "lib/customLists": `export function useCustomLists(){return {customLists:[{id:"family",name:"Family",itemCount:2}],selectedListId:"family",maxLists:3}} export const customListManager={getSelectedList:()=>({id:"family"}),getListById:id=>id==="family"?{id,name:"Family"}:null,setSelectedList:()=>{}}`,
    "lib/proUpgrade": `export function startProUpgrade(){}`,
    "lib/settings": `export function useSettings(){return {layout:{episodeTracking:false,condensedView:true}}} export function getPersonalityText(){return ""} export const DEFAULT_PERSONALITY="Zen"`,
    "hooks/useAuth": `export function useAuth(){return {isAuthenticated:true,user:{uid:"browser-test"}}}`,
    "hooks/useSmartDiscovery": `export function useSmartDiscovery(){return {recommendations:[{item:{id:"d1",kind:"movie",title:"Short",poster:"",year:2025,overview:"An existing overview with enough words to wrap into multiple lines. ".repeat(5)}},{item:{id:"d2",kind:"tv",title:"A very long Discovery title that needs more than two lines to display",poster:""}},{item:{id:"d3",kind:"movie",title:"Want title",poster:"",year:2024}}],isLoading:false,error:null}}`,
    "lib/storage": `export function useLibrary(){return [{id:"41",mediaType:"tv",title:"Custom TV",year:"2025",showStatus:"Returning Series",networks:["Network"],synopsis:"Saved description",userRating:3,userNotes:"Note",tags:["Family"]},{id:"42",mediaType:"movie",title:"Custom movie",year:"2025",synopsis:"Saved description",userRating:3}]} export function getListDisplayName(list){return {watching:"Watching",wishlist:"Want to Watch",watched:"Watched",not:"Not Interested"}[list]} const entries=new Map();const subs=new Set();export const Library={has:(id)=>entries.has(id),upsert:(item,list)=>{entries.set(item.id,{...item,list});subs.forEach(fn=>fn());},updateRating:(id,type,rating)=>{entries.get(id).userRating=rating;subs.forEach(fn=>fn());},getEntry:(id)=>entries.get(id)||(id==="tracked"?{id,mediaType:"movie",title:"Tracked title",list:"watched",userRating:3}:null),getCurrentList:(id)=>entries.get(id)?.list||(id==="tracked"?"watched":id==="custom-watching"?"watching":id==="custom-want"?"wishlist":id==="custom-watched"?"watched":id==="custom-not"?"not":null),subscribe:(fn)=>{subs.add(fn);return ()=>subs.delete(fn)},getAll:()=>[],getByList:()=>[{id:"41",mediaType:"tv",title:"Custom TV",year:"2025",showStatus:"Returning Series",networks:["Network"],synopsis:"Saved description",userRating:3,userNotes:"Note",tags:["Family"]},{id:"42",mediaType:"movie",title:"Custom movie",year:"2025",synopsis:"Saved description",userRating:3}]};export function addToListWithConfirmation(){}`,
    "lib/membership": `export function getMembershipInfo(item){return item.id==="tracked"?{list:"watched",displayName:"Watched"}:{list:null,displayName:null}}`,
    "lib/statusTransitions": `export function setPrimaryStatus(){} export async function setNotInterested(){return true}`,
    "components/WatchingListWithBackdrop": `export function useBackdropCallbacks(){return null}`,
    "hooks/useEntitlements": `export function useEntitlements(){return {hasFullAccess:true,isReadOnlyMode:false}}`,
    "components/Toast": `export function useToast(){return {addToast:()=>{}}}`,
    "lib/shareLinks": `export function shareShowWithFallback(){} export function shareListWithFallback(){}`,
    "state/actions": `export function getToastCallback(){return ()=>{}}`,
    "lib/seriesReminders": `export function isSeriesReminderEnabled(){return false}`,
    "components/ListSelectorModal": `import React from 'react'; export default function Modal(){return React.createElement('div',{role:'dialog'},'Custom list picker')}`,
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
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import TabCard from './src/components/cards/TabCard';import MyListsPage from './src/pages/MyListsPage';import SearchResults, {SearchResultCard} from './src/search/SearchResults';const item={id:'31',mediaType:'tv',title:'A long saved title that needs two lines',year:'2025',showStatus:'Returning Series',networks:['Network'],synopsis:'Saved description',userRating:3,userNotes:'Note',tags:['Family']};const actions={onWant:()=>{},onWatched:()=>{},onNotInterested:()=>{},onDelete:()=>{},onRatingChange:()=>{},onNotesEdit:()=>{window.edited=true}};createRoot(document.getElementById('root')).render(<><section data-testid="correction"><SearchResults query="Braking Bad"/></section><section data-testid="library"><TabCard item={item} tabType={window.testTab || 'watching'} actions={actions}/></section><section data-testid="custom"><MyListsPage onNotesEdit={actions.onNotesEdit}/></section><section data-testid="search"><SearchResultCard item={{...item,id:'51',voteAverage:7.2}} index={0} onRemove={()=>{}} actions={actions}/><SearchResultCard item={{...item,id:'tracked',voteAverage:0}} index={1} onRemove={()=>{}} actions={actions}/></section></>);`,
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
 for (const tab of ['watching','want','watched']) {
  test(`real saved/search surface paths ${width}px ${tab}`, async ({page}) => {
   await page.setViewportSize({width,height:1400});
   await page.route('https://cards-test.local/**',route=>route.fulfill({contentType:'text/html',body:'<html><body><div id="root"></div></body></html>'}));
   await page.goto('https://cards-test.local/');
   await page.addStyleTag({content:css});
   await page.evaluate(tab=>{window.testTab=tab;window.open=(url)=>{window.opened=url;return null}},tab);
   await page.addScriptTag({content:headerBundle});
   const correction=page.getByTestId("correction").getByRole("status");
   await expect(correction).toHaveText("Showing results for “Breaking Bad”");
   expect(await correction.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
   const library=page.getByTestId('library'); const custom=page.getByTestId('custom');
   if(width>=1024) {
    await expect(library.getByRole('button',{name:'📝 Notes & Tags',exact:true})).toBeVisible();
    await expect(library.getByRole('button',{name:'Shows Like This',exact:true})).toBeVisible();
    await expect(library.getByRole('button',{name:'Extras',exact:true})).toBeVisible();
   }
   await expect(library.locator(width<1024?'.card-mobile':'.tab-card')).toHaveCount(1);
   await expect(library.locator(width<1024?'.tab-card':'.card-mobile')).toHaveCount(0);
   if (width < 1024) {
    const metadata = library.locator('.card-mobile-metadata');
    await expect(metadata.getByText('2025 • TV Show', {exact:true})).toBeVisible();
    await expect(metadata.getByText('RETURNING', {exact:true})).toBeVisible();
    await expect(library.locator('.synopsis').getByText('On Network', {exact:true})).toBeVisible();
    expect(await library.locator('.synopsis .provider-badges-container').evaluate(el => getComputedStyle(el).marginTop)).toBe('0px');
    expect(await library.locator('.card-mobile-title').evaluate(el => {const s=getComputedStyle(el);return parseFloat(s.minHeight)/parseFloat(s.lineHeight)})).toBeCloseTo(1);
    expect(await library.locator('.synopsis').evaluate(el => getComputedStyle(el).webkitLineClamp)).toBe('2');
    expect(await metadata.locator('.card-mobile-chips').evaluate(el => getComputedStyle(el).marginTop)).toBe('0px');
   }
   await expect(custom.locator(width<1024?'.card-mobile':'.tab-card')).toHaveCount(2);
   for (const surface of width<1024?[library,custom]:[]) {
    for(const poster of await surface.locator('.poster-image').all()) {const b=await poster.boundingBox();expect(b!.width).toBe(112);expect(b!.height).toBe(168);}
    await expect(surface.getByText('2025 • TV Show',{exact:true})).toBeVisible();
    await expect(surface.getByText('Saved description',{exact:true}).first()).toBeVisible();
   }
   await expect(custom.getByRole('slider')).toHaveCount(2);
   await expect(custom.getByRole('button',{name:'Delete',exact:true})).toHaveCount(0);
   await expect(custom.getByRole('button',{name:'Custom Lists +',exact:true})).toHaveCount(0);
   for(const card of await custom.locator('article').all()){const title=await card.locator('h3').boundingBox();const menu=await card.getByRole('button',{name:'More options'}).boundingBox();expect(title!.x+title!.width).toBeLessThanOrEqual(menu!.x);}
   await expect(custom.getByText(/TMDB/)).toHaveCount(0);
   await custom.getByRole('button',{name:'Note: Notes & Tags'}).click();expect(await page.evaluate(()=>window.edited)).toBe(true);
   await expect(custom.getByRole('button',{name:'Tags: Notes & Tags'})).toHaveCount(1);
   await expect(custom.locator('.swipeable')).toHaveCount(0);
   await expect(library.locator('.swipeable')).toHaveCount(width<1024?1:0);
   const link=library.getByRole('link',{name:/View .* on TMDB/});await link.click();expect(await page.evaluate(()=>window.opened)).toBe('https://www.themoviedb.org/tv/31');
   await expect(link.locator('img')).toHaveAttribute('src',/placeholder|data:image/);
   const search=page.getByTestId('search');await expect(search.getByText('TMDB 7.2/10',{exact:true})).toBeVisible();
   await expect(search.getByText(/^0(?:\.0)?(?:\/10)?$/)).toHaveCount(0);
   await expect(search.getByRole('button',{name:/Note:|Tags:/})).toHaveCount(0);
   const searchPoster=search.getByRole('link',{name:/View .* on TMDB/}).first();const box=await searchPoster.boundingBox();expect(box!.width).toBe(width<1024?80:96);
   const trigger=custom.getByRole('button',{name:'More options'}).first();await trigger.hover();await page.mouse.move(0,0);await expect(trigger).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
   if(width<1024){await library.getByRole('button',{name:'More options'}).click();await expect(page.getByRole('menuitem',{name:'Mark Watched'})).toHaveCount(0);await page.keyboard.press('Escape');}
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
   if((width===390 || width===1024) && tab==='watching') await page.screenshot({path:test.info().outputPath(`cards-${width}.png`),fullPage:true});
  });
 }
}
