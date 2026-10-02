import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
let headerBundle: string;
let css: string;

// Render real card components with local data boundaries and production CSS.
test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    "features/compact/CompactPrimaryAction": `export function CompactPrimaryAction(){return null}`,
    "components/MyListToggle": `export default function MyListToggle(){return null}`,
    "lib/readOnlyGuard": `export function notifyReadOnlyBlocked(){}`,
    "lib/proUpgrade": `export function startProUpgrade(){}`,
    "lib/settings": `export function useSettings(){return {layout:{episodeTracking:false}}} export function getPersonalityText(){return ""} export const DEFAULT_PERSONALITY="Zen"`,
    "lib/language": `export function useTranslations(){return {currentlyWatchingAction:"Watching",notInterestedAction:"Not Interested",wantToWatchAction:"Want to Watch",watchedAction:"Watched",manageCurrentlyWatchingAction:"Manage Currently Watching"}}`,
    "hooks/useAuth": `export function useAuth(){return {isAuthenticated:true,user:{uid:"browser-test"}}}`,
    "hooks/useSmartDiscovery": `export function useSmartDiscovery(){return {recommendations:[{item:{id:"d1",kind:"movie",title:"Short",poster:"",year:2025}},{item:{id:"d2",kind:"tv",title:"A very long Discovery title that needs more than two lines to display",poster:""}},{item:{id:"d3",kind:"movie",title:"Want title",poster:"",year:2024}}],isLoading:false,error:null}}`,
    "lib/storage": `export function getListDisplayName(list){return {watching:"Watching",wishlist:"Want to Watch",watched:"Watched",not:"Not Interested"}[list]} const entries=new Map();const subs=new Set();export const Library={has:(id)=>entries.has(id),upsert:(item,list)=>{entries.set(item.id,{...item,list});subs.forEach(fn=>fn());},updateRating:(id,type,rating)=>{entries.get(id).userRating=rating;subs.forEach(fn=>fn());},getEntry:(id)=>entries.get(id)||(id==="tracked"?{id,mediaType:"movie",title:"Tracked title",list:"watched",userRating:3}:null),getCurrentList:(id)=>entries.get(id)?.list||(id==="tracked"?"watched":id==="custom-watching"?"watching":id==="custom-want"?"wishlist":id==="custom-watched"?"watched":id==="custom-not"?"not":null),subscribe:(fn)=>{subs.add(fn);return ()=>subs.delete(fn)},getAll:()=>[]};export function addToListWithConfirmation(){} export function useLibrary(){return []} Library.getByList=(list)=>list==='custom:a'?[{id:'custom-watching',mediaType:'movie',title:'Title in A',year:'2025',userRating:3}]:list==='custom:b'?[{id:'custom-watched',mediaType:'movie',title:'Title in B',year:'2024',userRating:3}]:[];`,
    "lib/membership": `export function getMembershipInfo(item){return item.id==="tracked"?{list:"watched",displayName:"Watched"}:{list:null,displayName:null}}`,
    "lib/customLists": `import React from 'react';const listeners=new Set();let state={customLists:[{id:'a',name:'Short list',itemCount:1,createdAt:1,isDefault:true},{id:'b',name:'An extremely long custom list name '.repeat(6),itemCount:1,createdAt:2}],selectedListId:'a',maxLists:3};const notify=()=>listeners.forEach(fn=>fn());export const customListManager={getSelectedList:()=>state.customLists.find(l=>l.id===state.selectedListId),getListById:(id)=>state.customLists.find(l=>l.id===id),getUserLists:()=>state,setSelectedList:(id)=>{state={...state,selectedListId:id};notify();},createList:(name)=>{const list={id:'new',name,createdAt:3,itemCount:0};state={...state,customLists:[...state.customLists,list]};notify();return list;},deleteList:(id)=>{state={...state,customLists:state.customLists.filter(l=>l.id!==id)};notify();return true;},updateList:(id,updates)=>{state={...state,customLists:state.customLists.map(l=>l.id===id?{...l,...updates}:l)};notify();}};export function useCustomLists(){const [s,set]=React.useState(state);React.useEffect(()=>{const fn=()=>set(state);listeners.add(fn);return ()=>listeners.delete(fn)},[]);return s}`,
    "state/actions": `export function getToastCallback(){return ()=>{}}`,
    "lib/statusTransitions": `export function setPrimaryStatus(){} export async function setNotInterested(){return true}`,
    "hooks/useDeviceDetection": `export function useIsDesktop(){return {isDesktop:false,ready:true}}`,
    "hooks/useEntitlements": `export function useEntitlements(){return {hasFullAccess:true,isReadOnlyMode:false}}`,
    "components/Toast": `export function useToast(){return {addToast:()=>{}}}`,
    "lib/shareLinks": `export function shareShowWithFallback(){} export function shareListWithFallback(){}`,
    "lib/seriesReminders": `export function isSeriesReminderEnabled(){return false}`,
    "components/ListSelectorModal": `import React from 'react'; export default function Modal(){return React.createElement('div',{role:'dialog'},'Custom list picker')}`,
    "components/OptimizedImage": `import React from 'react';export function OptimizedImage(props){return React.createElement('img',{className:props.className,alt:props.alt,src:props.src || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="112" height="168"/>'})}`,
    "tmdb/tv": `export async function fetchCurrentEpisodeInfo(){return {season:1,episode:2}} export async function fetchNextAirDate(){} export async function fetchShowStatus(){}`,
    "lib/isMobile": `export function isMobileNow(){return true} export function onMobileChange(){return ()=>{}}`,
    "search/cache": `export function cachedSearchMulti(){}`,
    "search/smartSearch": `export function smartSearch(){}`,
    "search/api": `export async function fetchNetworkInfo(){return {}} export async function fetchFullMediaMetadata(item){return item} export function discoverByGenre(){}`,
    "lib/tmdb": `export function getTVShowDetails(){}`,
    "lib/events": `export function emit(){}`,
    "lib/confirmRemoveShow": `export function removeMediaItemWithConfirmation(){}`,
    "components/modals/EpisodeTrackingModal": `export function EpisodeTrackingModal(){return null}`,
    "components/EpisodeProgressDisplay": `export function EpisodeProgressDisplay(){return null}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import MyListsPage from './src/pages/MyListsPage';import {useCustomListsNavigation} from './src/hooks/useCustomListsNavigation';function App(){const [location,set]=React.useState({view:'library',segment:'want'});const back=useCustomListsNavigation(location.view,location.segment,set);return location.segment==='mylists'?<MyListsPage onBack={back}/>:<button onClick={()=>set({view:'library',segment:'mylists'})}>Enter Custom Lists</button>}createRoot(document.getElementById('root')).render(<App/>);`,
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

for (const width of [320,360,390,768,1280]) {
 test(`Custom Lists navigation fits ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:1000});
  await page.route('https://cards-test.local/**',route=>route.fulfill({contentType:'text/html',body:'<html><body><div id="root"></div></body></html>'}));
  await page.goto('https://cards-test.local/');await page.addStyleTag({content:css});await page.addScriptTag({content:headerBundle});
  await page.getByRole('button',{name:'Enter Custom Lists'}).click();
  await expect(page.getByRole('heading',{level:2})).toHaveText('Short list');
  await expect(page.getByRole('article')).toContainText('Title in A');
  const selectors=page.locator('.custom-list-select');await expect(selectors).toHaveCount(2);
  for (const control of await page.locator('.custom-list-select,.custom-list-action').all()) {
    const box=await control.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width+1);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await selectors.nth(1).click();await expect(page.getByRole('article')).toContainText('Title in B');await expect(selectors.nth(1)).toHaveAttribute('aria-pressed','true');
  await selectors.nth(0).focus();await page.keyboard.press('Enter');await expect(page.getByRole('article')).toContainText('Title in A');
  await selectors.nth(1).click();await expect(page.getByRole('heading',{level:2})).toContainText('An extremely long custom list name');
  const title=await page.getByRole('heading',{level:2}).boundingBox();const share=await page.getByTitle('Share this list').boundingBox();expect(title!.x+title!.width).toBeLessThanOrEqual(share!.x);
  if(width===390) await page.screenshot({path:test.info().outputPath('custom-lists-navigation-390.png'),fullPage:true});
  await page.getByRole('button',{name:'← Back'}).click();await expect(page.getByRole('button',{name:'Enter Custom Lists'})).toBeVisible();
  await page.goForward();await expect(page.getByRole('heading',{level:1})).toHaveText('Custom Lists');
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Create New List'}).click();await expect(selectors).toHaveCount(2);
  page.once('dialog',dialog=>dialog.accept('New list'));await page.getByRole('button',{name:'Create New List'}).click();await expect(page.getByRole('heading',{level:2})).toHaveText('New list');await expect(page.getByRole('button',{name:'Create New List'})).toHaveCount(0);
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Delete New list',exact:true}).click();await expect(page.getByRole('heading',{level:2})).toHaveText('Short list');await expect(page.getByRole('article')).toContainText('Title in A');
 });
}
