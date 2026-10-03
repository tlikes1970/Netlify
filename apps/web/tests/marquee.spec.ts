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

// Render the actual Home and shared personality marquee components with local data boundaries and production CSS.
test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    "hooks/usePreferredName": `export function usePreferredName(){return {preferredName:""}}`,
    "lib/settings": `export function useSettings(){return {personalityLevel:2}} export function resolveFlickletLine(){return "Your lists remember what you forgot."}`,
    "lib/storage": `export const Library={getAll:()=>[],getByList:()=>[],subscribe:()=>()=>{}}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import HomeMarquee from './src/components/HomeMarquee';import {PersonalityBanner} from './src/components/PersonalityBanner';import {getFlickletMarqueeMessages} from './src/lib/flickletPersonality';createRoot(document.getElementById('root')).render(<><section data-testid="home"><HomeMarquee messages={getFlickletMarqueeMessages(2)}/></section><section data-testid="library"><PersonalityBanner/></section><section data-testid="long"><HomeMarquee messages={[getFlickletMarqueeMessages(3)[0]]}/></section></>)`,
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
 for (const reducedMotion of ['no-preference','reduce'] as const) {
  test(`marquee movement ${width}px ${reducedMotion}`, async ({page}) => {
   await page.setViewportSize({width,height:900});
   await page.emulateMedia({reducedMotion});
   await page.route('https://cards-test.local/**',route=>route.fulfill({contentType:'text/html',body:'<html><body><div id="root"></div></body></html>'}));
   await page.goto('https://cards-test.local/');
   await page.addStyleTag({content:css});
   await page.addScriptTag({content:headerBundle});
   for (const surface of ['home','library','long']) {
    const track=page.getByTestId(surface).locator('.flicklet-marquee-track');
    await expect(track).toBeAttached();
    const before=await track.evaluate(el=>({x:el.getBoundingClientRect().x,animation:getComputedStyle(el).animationName}));
    await page.waitForTimeout(350);
    const after=await track.evaluate(el=>el.getBoundingClientRect().x);
    if(reducedMotion==='reduce') {
     expect(before.animation).toBe('none');
     expect(after).toBeCloseTo(before.x);
     expect(await track.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    } else {
     expect(before.animation).toBe('flicklet-ticker-pass');
     expect(before.x-after).toBeGreaterThan(10);
    }
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   expect(await page.getByTestId('library').locator('[role="note"]').count()).toBe(1);
  });
 }
}
