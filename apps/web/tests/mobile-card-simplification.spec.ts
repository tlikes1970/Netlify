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
    "hooks/useSmartDiscovery": `export function useSmartDiscovery(){return {recommendations:[{item:{id:"d1",kind:"movie",title:"Short",poster:"",year:2025,overview:"An existing overview with enough words to wrap into multiple lines. ".repeat(5)}},{item:{id:"d2",kind:"tv",title:"A very long Discovery title that needs more than two lines to display",poster:""}},{item:{id:"d3",kind:"movie",title:"Want title",poster:"",year:2024}}],isLoading:false,error:null}}`,
    "lib/storage": `export function getListDisplayName(list){return {watching:"Watching",wishlist:"Want to Watch",watched:"Watched",not:"Not Interested"}[list]} const entries=new Map();const subs=new Set();export const Library={has:(id)=>entries.has(id),upsert:(item,list)=>{entries.set(item.id,{...item,list});subs.forEach(fn=>fn());},updateRating:(id,type,rating)=>{entries.get(id).userRating=rating;subs.forEach(fn=>fn());},getEntry:(id)=>entries.get(id)||(id==="tracked"?{id,mediaType:"movie",title:"Tracked title",list:"watched",userRating:3}:null),getCurrentList:(id)=>entries.get(id)?.list||(id==="tracked"?"watched":id==="custom-watching"?"watching":id==="custom-want"?"wishlist":id==="custom-watched"?"watched":id==="custom-not"?"not":null),subscribe:(fn)=>{subs.add(fn);return ()=>subs.delete(fn)},getAll:()=>[]};export function addToListWithConfirmation(){}`,
    "lib/membership": `export function getMembershipInfo(item){return item.id==="tracked"?{list:"watched",displayName:"Watched"}:{list:null,displayName:null}}`,
    "lib/statusTransitions": `export function setPrimaryStatus(){} export async function setNotInterested(){return true}`,
    "hooks/useDeviceDetection": `export function useIsDesktop(){return {isDesktop:false,ready:true}}`,
    "hooks/useEntitlements": `export function useEntitlements(){return {hasFullAccess:true,isReadOnlyMode:false}}`,
    "components/Toast": `export function useToast(){return {addToast:()=>{}}}`,
    "lib/shareLinks": `export function shareShowWithFallback(){}`,
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
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Card from './src/components/cards/CardV2';import DiscoveryPage from './src/pages/DiscoveryPage';import LibrarySegmentBar from './src/components/LibrarySegmentBar';import UpNext from './src/components/cards/UpNextCard';import {MovieCardMobile} from './src/components/cards/mobile/MovieCardMobile';import {TvCardMobile} from './src/components/cards/mobile/TvCardMobile';import {SearchResultCard} from './src/search/SearchResults';const names=['Short','A much longer title that wraps across two lines'];const item=(name,id)=>({id,mediaType:'movie',title:name,year:'2025',synopsis:'Existing short summary',userRating:3});const actions={onWant:()=>{},onWatched:()=>{},onNotInterested:()=>{},onDelete:()=>{},onRatingChange:()=>{}};createRoot(document.getElementById('root')).render(<><LibrarySegmentBar segment="watching" counts={{watching:1,want:2,watched:3,mylists:4}} onChange={()=>{}}/><div data-testid="cw" style={{display:'flex',gap:12,overflowX:'auto'}}>{names.map((n,i)=><Card key={i} item={item(n,i)} context="home-cw-preview" disableOverflow/>)}</div><div data-testid="up-next" style={{display:'flex',gap:12,overflowX:'auto'}}>{names.map((n,i)=><UpNext key={i} item={{...item(n,i),mediaType:'tv',nextAirDate:'2026-11-10',showStatus:'Returning Series'}}/>)}</div><div data-testid="for-you" style={{display:'flex',gap:12,overflowX:'auto'}}>{names.map((n,i)=><Card key={i} item={item(n,i)} context="tab-foryou" actions={actions}/>)}</div><div data-testid="library">{names.map((n,i)=><MovieCardMobile key={i} item={item(n,i)} tabKey={window.testTab || "watching"} actions={actions}/>) }{names.map((n,i)=><TvCardMobile key={"tv"+i} item={{...item(n,"tv"+i),mediaType:"tv",showStatus:"Returning Series",networks:["Netflix"]}} tabKey={window.testTab || "watching"} actions={actions}/>)}</div><div data-testid="custom" className="custom-list-cards grid grid-cols-[repeat(auto-fill,minmax(154px,1fr))]" style={{gap:12}}>{["custom-watching","custom-want","custom-watched","custom-not"].map((id,i)=><Card key={id} item={item(names[i%2],id)} context="tab-watching" currentListContext="custom:family" actions={actions}/>)}</div><div data-testid="discovery"><DiscoveryPage/></div><div data-testid="discovery-details" className="discovery-results-grid">{names.map((n,i)=><Card key={i} item={{...item(n,"detail"+i),mediaType:"tv",showStatus:i===0?"Returning Series":undefined,networks:i===0?["Seven Network"]:undefined,synopsis:i===0?"Short overview":"An existing three-line overview. ".repeat(10)}} context="tab-foryou" secondaryWatching actions={actions}/>)}</div><div data-testid="search-tracked"><SearchResultCard item={item("A tracked title with a long name", "tracked")} index={0} onRemove={()=>{}} actions={actions}/></div><div data-testid="search-untracked"><SearchResultCard item={item("An untracked title with a long name", "untracked")} index={1} onRemove={()=>{}} actions={actions}/></div></>);`,
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

for (const width of [320, 360, 390, 768, 1280]) {
  for (const tab of ["watching", "want", "watched"]) {
    test(`card titles reserve equal heights and controls fit ${width}px ${tab}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.route("https://cards-test.local/**", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: '<html><body><div id="root"></div></body></html>',
        }),
      );
      page.on("pageerror", (error) => {
        throw error;
      });
      await page.goto("https://cards-test.local/");
      await page.addStyleTag({ content: css });
      await page.evaluate((tab) => {
        (window as unknown as { testTab: string }).testTab = tab;
      }, tab);
      await page.addScriptTag({ content: headerBundle });
      await expect(page.getByRole('tab', {name: 'Watching, 1 item', exact: true})).toBeVisible();
      const wantTab = page.getByRole('tab', {name: 'Want to Watch, 2 items', exact: true});
      await expect(wantTab).toBeVisible();
      expect(await wantTab.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      const custom = page.getByTestId('custom');
      await expect(custom.locator('article')).toHaveCount(4);
      await expect(custom.getByRole('combobox')).toHaveCount(0);
      await expect(custom.getByRole('button', {name:'Custom Lists +',exact:true})).toHaveCount(0);
      await expect(custom.getByRole('slider')).toHaveCount(4);
      const ratingSizes = await custom.getByRole('slider').evaluateAll(els => els.map(el => ({fits:el.scrollWidth <= el.clientWidth,svg:el.querySelector('svg')!.getBoundingClientRect().width,touchHeight:el.querySelector('button')!.getBoundingClientRect().height})));
      for (const rating of ratingSizes) {
        expect(rating.fits).toBe(true);
        expect(rating.svg).toBeLessThanOrEqual(18);
        expect(rating.touchHeight).toBeGreaterThanOrEqual(44);
      }
      await expect(custom.locator('article').nth(0).getByRole('button',{name:'Watching',exact:true})).toHaveCount(0);
      await expect(custom.locator('article').nth(1).getByRole('button',{name:'Want to Watch',exact:true})).toHaveCount(0);
      if (width === 390 && tab === 'watching') await custom.screenshot({path:test.info().outputPath('custom-390.png')});
      const customTitles = await custom.locator('h3').evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
      expect(Math.max(...customTitles)-Math.min(...customTitles)).toBeLessThanOrEqual(1);
      const customTriggers = custom.getByRole('button',{name:'More options'});
      await expect(customTriggers).toHaveCount(4);
      const styles = await customTriggers.evaluateAll(els => els.map(el => ({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,background:getComputedStyle(el).backgroundColor})));
      for (const style of styles) {
        expect(style.width).toBeGreaterThanOrEqual(44);
        expect(style.height).toBeGreaterThanOrEqual(44);
        expect(style.background).toBe('rgba(0, 0, 0, 0)');
      }
      for (const trigger of await customTriggers.all()) {
        const card=trigger.locator('xpath=ancestor::article');const c=await card.locator('.cardv2-content').boundingBox();const b=await trigger.boundingBox();
        expect(b!.y-c!.y).toBeLessThanOrEqual(12);expect(c!.x+c!.width-b!.x-b!.width).toBeLessThanOrEqual(12);
      }
      for(const trigger of await customTriggers.all()) {
        const card=trigger.locator('xpath=ancestor::article');const b=await trigger.boundingBox();const p=await card.locator('.poster-wrap').boundingBox();const title=await card.locator('h3').boundingBox();
        expect(b!.x>=p!.x+p!.width || b!.y>=p!.y+p!.height).toBe(true);expect(title!.x+title!.width).toBeLessThanOrEqual(b!.x);
      }
      await customTriggers.first().click();
      await expect(page.getByRole('menuitem',{name:'Watched',exact:true})).toBeVisible();
      await expect(page.getByRole('menuitem',{name:'Not Interested',exact:true})).toBeVisible();
      await expect(page.getByRole('menuitem',{name:'Remove from this List',exact:true})).toBeVisible();
      await expect(page.getByRole('menuitem',{name:'Add to Lists',exact:true})).toBeVisible();
      await page.keyboard.press('Escape');
      for (const rail of ["cw", "up-next", "for-you"]) {
        const cards = page.getByTestId(rail).locator("article");
        await expect(cards).toHaveCount(2);
        const heights = await cards.evaluateAll((elements) =>
          elements.map((el) => el.getBoundingClientRect().height),
        );
        expect(Math.abs(heights[0] - heights[1])).toBeLessThanOrEqual(1);
        const titles = await cards.locator("h3").evaluateAll((elements) =>
          elements.map((el) => ({
            height: el.getBoundingClientRect().height,
            line: parseFloat(getComputedStyle(el).lineHeight),
          })),
        );
        for (const title of titles)
          expect(title.height).toBeGreaterThanOrEqual(title.line * 2 - 1);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await expect(
        page.getByTestId("for-you").getByRole("combobox"),
      ).toHaveCount(0);
      await expect(
        page.getByTestId("library").getByRole("combobox"),
      ).toHaveCount(0);
      const titles = await page
        .getByTestId("library")
        .locator("h3")
        .evaluateAll((elements) =>
          elements.map((el) => el.getBoundingClientRect().height),
        );
      expect(titles[0]).toBe(titles[1]);
      const library = page.getByTestId("library");
      for(const card of await library.locator('.card-mobile').all()) {
        const c=await card.boundingBox();const p=await card.locator('.poster-col').boundingBox();const info=await card.locator('.info-col').boundingBox();const trigger=await card.getByRole('button',{name:'More options'}).boundingBox();
        expect(info!.x-p!.x-p!.width).toBeGreaterThanOrEqual(10);
        expect(c!.x+c!.width-trigger!.x-trigger!.width).toBeGreaterThanOrEqual(8);
        expect(c!.x+c!.width-trigger!.x-trigger!.width).toBeLessThanOrEqual(16);
        expect(trigger!.y-c!.y).toBeLessThanOrEqual(16);
        const title=await card.locator('h3').boundingBox();expect(title!.x+title!.width).toBeLessThanOrEqual(trigger!.x);
      }
      for (const row of await library
        .getByTestId("context-status-actions")
        .all()) {
        const buttons = await row.getByRole("button").all();
        expect(buttons).toHaveLength(2);
        const a = (await buttons[0].boundingBox())!;
        const b = (await buttons[1].boundingBox())!;
        expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(1);
        expect(a.x + a.width).toBeLessThanOrEqual(b.x);
        expect(a.height).toBeGreaterThanOrEqual(44);
        expect(b.height).toBeGreaterThanOrEqual(44);
        for (const button of buttons)
          expect(
            await button.evaluate(
              (el) =>
                el.scrollWidth <= el.clientWidth &&
                el.scrollHeight <= el.clientHeight,
            ),
          ).toBe(true);
        const card = row
          .locator('xpath=ancestor::div[contains(@class,"card-mobile")]')
          .first();
        const rating = (await card.getByRole("slider").boundingBox())!;
        expect(a.y).toBeGreaterThanOrEqual(rating.y + rating.height);
        await expect(card.locator(".synopsis")).toHaveText(
          "Existing short summary",
        );
      }
      for (const state of ["tracked", "untracked"]) {
        const search = page.getByTestId(`search-${state}`);
        const trigger = search.getByRole("button", { name: "More actions" });
        const target = (await trigger.boundingBox())!;
        const title = (await search
          .locator(".font-bold")
          .first()
          .boundingBox())!;
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
        expect(Math.abs(target.y - title.y)).toBeLessThanOrEqual(8);
        const text = (await search
          .locator(".font-bold > span")
          .first()
          .boundingBox())!;
        expect(text.x + text.width).toBeLessThanOrEqual(target.x);
        await expect(trigger).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await expect(
          search.getByRole("button", { name: "Manage" }),
        ).toHaveCount(state === "tracked" ? 1 : 0);
        if (state === "tracked")
          await expect(search.getByText("Status: Watched")).toBeVisible();
        if (width === 390 && tab === "watching")
          await search.screenshot({
            path: test.info().outputPath(`search-${state}.png`),
          });
        await trigger.click();
        if (state === "untracked")
          for (const name of ["Watching", "Want to Watch", "Watched"])
            await expect(
              page.getByRole("button", { name, exact: true }).last(),
            ).toBeVisible();
        if (state === "tracked")
          await expect(
            search.getByRole("button", { name: "Watched", exact: true }),
          ).toHaveCount(0);
        await page
          .locator(".fixed.inset-0")
          .click({ position: { x: 1, y: 1 } });
      }
      const discovery = page.getByTestId('discovery');
      await expect(discovery.locator('article')).toHaveCount(3);
      await expect(discovery.getByRole('slider')).toHaveCount(0);
      await expect(discovery.getByRole('combobox')).toHaveCount(0);
      const overview=discovery.locator('.discovery-card-overview');await expect(overview).toHaveCount(1);
      expect(await overview.evaluate(el=>el.clientHeight - parseFloat(getComputedStyle(el).paddingBottom) <= parseFloat(getComputedStyle(el).lineHeight)*3+1)).toBe(true);
      for(const card of await discovery.locator('article').all()) {
        const c=await card.locator('.cardv2-content').boundingBox();const trigger=await card.getByRole('button',{name:'More options'}).boundingBox();const title=await card.locator('h3').boundingBox();
        expect(trigger!.y-c!.y).toBeLessThanOrEqual(12);expect(c!.x+c!.width-trigger!.x-trigger!.width).toBeLessThanOrEqual(12);expect(title!.x+title!.width).toBeLessThanOrEqual(trigger!.x);
      }
      for (const name of ['Watching','Not Interested','Delete','Custom Lists +']) await expect(discovery.getByRole('button',{name,exact:true})).toHaveCount(0);
      for(const card of await page.getByTestId('discovery-details').locator('article').all()) {
        const poster=await card.locator('.poster-wrap').boundingBox();const content=await card.locator('.cardv2-content').boundingBox();const shell=await card.locator('.cardv2-shell').boundingBox();
        if(width<=768) {expect(content!.x).toBeGreaterThanOrEqual(poster!.x+poster!.width);expect(shell!.height).toBeLessThanOrEqual(Math.max(poster!.height,content!.height)+10);}
        const synopsis=card.locator('.discovery-card-overview');expect(await synopsis.evaluate(el=>el.clientHeight-parseFloat(getComputedStyle(el).paddingBottom)<=parseFloat(getComputedStyle(el).lineHeight)*3+1)).toBe(true);
      }
      const state=page.getByTestId('discovery-details').locator('.discovery-state-providers');await expect(state).toHaveCount(1);
      const badge=await state.locator('.badge').boundingBox();const provider=await state.getByRole('list').boundingBox();
      if(width===768) expect(Math.abs(badge!.y-provider!.y)).toBeLessThanOrEqual(8);
      expect(badge!.x+badge!.width<=provider!.x || badge!.y+badge!.height<=provider!.y).toBe(true);
      const discoveryBounds = await discovery.locator('article').evaluateAll(els => els.map(el => ({width:el.getBoundingClientRect().width,title:el.querySelector('h3')!.getBoundingClientRect().height,poster:el.querySelector('img')!.getBoundingClientRect().height,clipped:el.scrollWidth>el.clientWidth})));
      expect(Math.max(...discoveryBounds.map(b=>b.width))-Math.min(...discoveryBounds.map(b=>b.width))).toBeLessThanOrEqual(1);
      expect(Math.max(...discoveryBounds.map(b=>b.title))-Math.min(...discoveryBounds.map(b=>b.title))).toBeLessThanOrEqual(1);
      expect(Math.max(...discoveryBounds.map(b=>b.poster))-Math.min(...discoveryBounds.map(b=>b.poster))).toBeLessThanOrEqual(1);
      expect(discoveryBounds.every(b=>!b.clipped)).toBe(true);
      expect(await discovery.locator('article img').first().getAttribute('src')).toContain('data:image/svg+xml');
      const discoveryButtons = await discovery.getByRole('button',{name:'Want to Watch',exact:true}).evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
      expect(discoveryButtons.every(h=>h >= (width <= 768 ? 44 : 36))).toBe(true);
      await discovery.locator('article').nth(2).getByRole('button',{name:'Want to Watch',exact:true}).click();
      await expect(discovery.locator('article')).toHaveCount(2);
      await discovery.locator('article').first().getByRole('button',{name:'Watched',exact:true}).click();
      await expect(discovery.getByRole('slider')).toBeVisible();
      await expect(discovery.locator('article')).toHaveCount(2);
      if (width === 390 && tab === 'watching') await discovery.screenshot({path:test.info().outputPath('discovery-rating-390.png')});
      await discovery.getByRole('button',{name:'Not now'}).click();
      await expect(discovery.locator('article')).toHaveCount(1);
      await discovery.getByRole('button',{name:'More options'}).click();
      await expect(page.getByRole('menuitem',{name:'Not Interested',exact:true})).toBeVisible();
      await expect(page.getByRole('menuitem',{name:'Custom Lists',exact:true})).toBeVisible();
      await page.getByRole('menuitem',{name:'Watching',exact:true}).click();
      await expect(discovery.locator('article')).toHaveCount(0);
      const stars = page
        .getByTestId("library")
        .locator('[role="slider"] button svg')
        .first();
      const star = await stars.boundingBox();
      expect(star!.width).toBeLessThanOrEqual(18);
      const overflow = page
        .getByTestId("library")
        .getByRole("button", { name: "More options" })
        .first();
      const bounds = await overflow.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      if (width === 390)
        await page
          .getByTestId("library")
          .screenshot({ path: test.info().outputPath("library-390.png") });
      await overflow.click();
      await expect(
        page.getByRole("menuitem", { name: "Custom Lists" }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Want to Watch" }),
      ).toHaveCount(0);
      await page.getByRole("menuitem", { name: "Custom Lists" }).click();
      await expect(page.getByRole("dialog")).toHaveText("Custom list picker");
    });
  }
}
