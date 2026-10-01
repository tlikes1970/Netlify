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
    "hooks/useAuth": `export function useAuth(){ return {user:window.testUser,isAuthenticated:!!window.testUser,signOut:async()=>{window.logoutCalls=(window.logoutCalls||0)+1}} }`,
    "hooks/usePreferredName": `export function usePreferredName(){return {uid:window.testUser?"one":null,preferredName:window.testUser?"Dr. Travis Likes with a very long preferred name for narrow screen wrapping":"",loading:false,error:null}}`,
    "hooks/useDeviceDetection": `export function useIsMobileScreen(){return window.innerWidth<768}`,
    "lib/settings": `export function useSettings(){return {personality:"Zen"}}`,
    "lib/auth": `export const authManager={getCurrentUser:()=>null}`,
    "lib/language": `export function useTranslations(){return {search:'Search',clear:'Clear',searchPlaceholder:'Search movies, shows, people...'}}`,
    "lib/capacitorEnv": `export function isCapacitorNative(){return true} export function isCapacitorAndroid(){return true}`,
    "lib/mobileViewportLayout": `export function dispatchKeyboardDismiss(){} `,
    "pwa/useInstall": `export function useCanInstallPWA(){return false}`,
    "pwa/installSignal": `export function promptInstall(){}`,
    "components/AuthModal": `export default function AuthModal(){return null}`,
    "components/PreferredNamePromptModal": `export default function PreferredNamePromptModal(){return null}`,
    "components/SearchSuggestions": `export function addSearchToHistory(){} export default function SearchSuggestions(){return null}`,
    "components/VoiceSearch": `export default function VoiceSearch(){return null}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Header from './src/components/FlickletHeader';createRoot(document.getElementById('root')).render(<Header/>);`,
      resolveDir: appRoot,
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    plugins: [
      {
        name: "local-auth-boundaries",
        setup(builder) {
          builder.onResolve({ filter: /^\.\.?\// }, (args) => {
            const absolute = path
              .resolve(args.resolveDir, args.path)
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
  for (const signedIn of [false, true]) {
    test(`account label and dialog fit ${width}px ${signedIn ? "signed in" : "signed out"}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.route("https://account-test.local/**", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: '<html class="capacitor-native capacitor-android" data-safe-area-ready><body><div id="root"></div></body></html>',
        }),
      );
      await page.goto("https://account-test.local/");
      await page.addStyleTag({ content: css + ":root { --safe-top: 24px; }" });
      await page.evaluate((signedIn) => {
        (window as unknown as { testUser: unknown }).testUser = signedIn
          ? {
              displayName: "Test User",
              email: "long-account-address@example.com",
            }
          : null;
      }, signedIn);
      await page.addScriptTag({ content: headerBundle });
      const account = page.getByTestId("account-button");
      await expect(account).toHaveText(signedIn ? "👤Log Out" : "👤Log In");
      await expect(account).toBeVisible();
      const bounds = await account.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      const title = await page.getByTestId("app-title").locator("span").boundingBox();
      expect(Math.abs(title!.x + title!.width / 2 - width / 2)).toBeLessThanOrEqual(1);
      expect(
        bounds!.y >= title!.y + title!.height ||
          bounds!.x >= title!.x + title!.width,
      ).toBe(true);
      if (signedIn) {
        const greeting = page.locator("header").getByTestId("home-greeting");
        await expect(greeting).toHaveCount(1);
        const position = await greeting.boundingBox();
        expect(position!.x).toBeLessThanOrEqual(40);
        expect(position!.y).toBeGreaterThanOrEqual(24);
        expect(position!.y + position!.height).toBeLessThanOrEqual(title!.y);
        expect(position!.height).toBeLessThanOrEqual(40);
        await expect(greeting).toHaveCSS("text-align", "left");
        const search = await page.getByTestId("search-row").boundingBox();
        expect(position!.y + position!.height).toBeLessThanOrEqual(search!.y);

        await account.click();
        await expect(
          page.getByRole("alertdialog", { name: "Log out?" }),
        ).toBeVisible();
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
        await expect(page.getByRole("alertdialog")).toHaveCount(0);
        await expect(account).toBeFocused();
      }
    });
  }
}
