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

// Render the actual header/account components with local auth boundaries. No OAuth
// request or real sign-out is made; production CSS supplies responsive layout.
test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    "features/compact/CompactPrimaryAction": `export function CompactPrimaryAction(){return null}`,
    "components/MyListToggle": `export default function MyListToggle(){return null}`,
    "lib/readOnlyGuard": `export function notifyReadOnlyBlocked(){}`,
    "lib/proUpgrade": `export function startProUpgrade(){}`,
    "lib/settings": `export function useSettings(){return {layout:{episodeTracking:false}}}`,
    "lib/language": `export function useTranslations(){return {wantToWatchAction:"Want to Watch",watchedAction:"Watched",manageCurrentlyWatchingAction:"Manage Currently Watching"}}`,
    "lib/storage": `export const Library={getEntry:()=>null,subscribe:()=>()=>{}}`,
    "lib/membership": `export function getMembershipInfo(){return {list:null,displayName:null}}`,
    "lib/statusTransitions": `export function setPrimaryStatus(){}`,
    "hooks/useDeviceDetection": `export function useIsDesktop(){return {isDesktop:false,ready:true}}`,
    "hooks/useEntitlements": `export function useEntitlements(){return {hasFullAccess:true,isReadOnlyMode:false}}`,
    "components/Toast": `export function useToast(){return {addToast:()=>{}}}`,
    "lib/shareLinks": `export function shareShowWithFallback(){}`,
    "lib/seriesReminders": `export function isSeriesReminderEnabled(){return false}`,
    "components/ListSelectorModal": `import React from 'react'; export default function Modal(){return React.createElement('div',{role:'dialog'},'Custom list picker')}`,
    "components/OptimizedImage": `import React from 'react';export function OptimizedImage(props){return React.createElement('img',{className:props.className,alt:props.alt,src:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="112" height="168"/>'})}`,
    "tmdb/tv": `export async function fetchCurrentEpisodeInfo(){return {season:1,episode:2}}`,
    "components/EpisodeProgressDisplay": `export function EpisodeProgressDisplay(){return null}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Card from './src/components/cards/CardV2';import UpNext from './src/components/cards/UpNextCard';import {MovieCardMobile} from './src/components/cards/mobile/MovieCardMobile';const names=['Short','A much longer title that wraps across two lines'];const item=(name,id)=>({id,mediaType:'movie',title:name,year:'2025',synopsis:'Existing short summary',userRating:3});const actions={onWant:()=>{},onWatched:()=>{},onRatingChange:()=>{}};createRoot(document.getElementById('root')).render(<><div data-testid="cw" style={{display:'flex',gap:12,overflowX:'auto'}}>{names.map((n,i)=><Card key={i} item={item(n,i)} context="home-cw-preview" disableOverflow/>)}</div><div data-testid="up-next" style={{display:'flex',gap:12,overflowX:'auto'}}>{names.map((n,i)=><UpNext key={i} item={{...item(n,i),mediaType:'tv',nextAirDate:'2026-11-10',showStatus:'Returning Series'}}/>)}</div><div data-testid="for-you" style={{display:'flex',gap:12,overflowX:'auto'}}>{names.map((n,i)=><Card key={i} item={item(n,i)} context="tab-foryou" actions={actions}/>)}</div><div data-testid="library">{names.map((n,i)=><MovieCardMobile key={i} item={item(n,i)} tabKey="watching" actions={actions}/>)}</div></>);`,
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
  test(`card titles reserve equal heights and controls fit ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("https://cards-test.local/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<html><body><div id="root"></div></body></html>',
      }),
    );
    await page.goto("https://cards-test.local/");
    await page.addStyleTag({ content: css });
    await page.addScriptTag({ content: headerBundle });
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
    await expect(page.getByTestId("for-you").getByRole("combobox")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("library").getByRole("combobox")).toHaveCount(
      0,
    );
    const titles = await page
      .getByTestId("library")
      .locator("h3")
      .evaluateAll((elements) =>
        elements.map((el) => el.getBoundingClientRect().height),
      );
    expect(titles[0]).toBe(titles[1]);
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
