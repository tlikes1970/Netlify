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
    "lib/storage": `export function getListDisplayName(list){return {watching:"Watching",wishlist:"Want to Watch",watched:"Watched",not:"Not Interested"}[list]} export const Library={getEntry:(id)=>id==="tracked"?{id,mediaType:"movie",title:"Tracked title",list:"watched",userRating:3}:null,getCurrentList:(id)=>id==="tracked"?"watched":null,subscribe:()=>()=>{},getAll:()=>[]};export function addToListWithConfirmation(){}`,
    "lib/membership": `export function getMembershipInfo(item){return item.id==="tracked"?{list:"watched",displayName:"Watched"}:{list:null,displayName:null}}`,
    "lib/statusTransitions": `export function setPrimaryStatus(){}`,
    "hooks/useDeviceDetection": `export function useIsDesktop(){return {isDesktop:false,ready:true}}`,
    "hooks/useEntitlements": `export function useEntitlements(){return {hasFullAccess:true,isReadOnlyMode:false}}`,
    "components/Toast": `export function useToast(){return {addToast:()=>{}}}`,
    "lib/shareLinks": `export function shareShowWithFallback(){}`,
    "lib/seriesReminders": `export function isSeriesReminderEnabled(){return false}`,
    "components/ListSelectorModal": `import React from 'react'; export default function Modal(){return React.createElement('div',{role:'dialog'},'Custom list picker')}`,
    "components/OptimizedImage": `import React from 'react';export function OptimizedImage(props){return React.createElement('img',{className:props.className,alt:props.alt,src:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="112" height="168"/>'})}`,
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
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Card from './src/components/cards/CardV2';import LibrarySegmentBar from './src/components/LibrarySegmentBar';import UpNext from './src/components/cards/UpNextCard';import {MovieCardMobile} from './src/components/cards/mobile/MovieCardMobile';import {SearchResultCard} from './src/search/SearchResults';const names=['Short','A much longer title that wraps across two lines'];const item=(name,id)=>({id,mediaType:'movie',title:name,year:'2025',synopsis:'Existing short summary',userRating:3});const actions={onWant:()=>{},onWatched:()=>{},onRatingChange:()=>{}};createRoot(document.getElementById('root')).render(<><LibrarySegmentBar segment="watching" counts={{watching:1,want:2,watched:3,mylists:4}} onChange={()=>{}}/><div data-testid="cw" style={{display:'flex',gap:12,overflowX:'auto'}}>{names.map((n,i)=><Card key={i} item={item(n,i)} context="home-cw-preview" disableOverflow/>)}</div><div data-testid="up-next" style={{display:'flex',gap:12,overflowX:'auto'}}>{names.map((n,i)=><UpNext key={i} item={{...item(n,i),mediaType:'tv',nextAirDate:'2026-11-10',showStatus:'Returning Series'}}/>)}</div><div data-testid="for-you" style={{display:'flex',gap:12,overflowX:'auto'}}>{names.map((n,i)=><Card key={i} item={item(n,i)} context="tab-foryou" actions={actions}/>)}</div><div data-testid="library">{names.map((n,i)=><MovieCardMobile key={i} item={item(n,i)} tabKey={window.testTab || "watching"} actions={actions}/>)}</div><div data-testid="search-tracked"><SearchResultCard item={item("A tracked title with a long name", "tracked")} index={0} onRemove={()=>{}} actions={actions}/></div><div data-testid="search-untracked"><SearchResultCard item={item("An untracked title with a long name", "untracked")} index={1} onRemove={()=>{}} actions={actions}/></div></>);`,
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
