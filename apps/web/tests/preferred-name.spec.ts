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
    "hooks/useAuth": `export function useAuth(){return {user:window.testUser,isAuthenticated:!!window.testUser,signOut:async()=>{}}}`,
    "hooks/usePreferredName": `import {useSyncExternalStore} from 'react';const listeners=new Set();window.setNameState=(next)=>{window.nameState=next;listeners.forEach(f=>f())};const subscribe=f=>{listeners.add(f);return ()=>listeners.delete(f)};export function usePreferredName(){return {...useSyncExternalStore(subscribe,()=>window.nameState),updatePreferredName:async(name)=>{window.nameWrites.push(name.trim());window.setNameState({...window.nameState,preferredName:name.trim()})},retry:()=>{}}}`,
    "lib/settings": `export function useSettings(){return {personality:'Zen'}}`,
    "hooks/useDeviceDetection": `export function useIsMobileScreen(){return window.innerWidth<768}`,
    "lib/language": `export function useTranslations(){return {search:'Search',clear:'Clear',searchPlaceholder:'Search movies, shows, people...'}}`,
    "lib/capacitorEnv": `export function isCapacitorNative(){return true} export function isCapacitorAndroid(){return true}`,
    "lib/mobileViewportLayout": `export function dispatchKeyboardDismiss(){}`,
    "pwa/useInstall": `export function useCanInstallPWA(){return false}`,
    "pwa/installSignal": `export function promptInstall(){}`,
    "components/AccountButton": `export default function AccountButton(){return null}`,
    "components/SearchSuggestions": `export function addSearchToHistory(){} export default function SearchSuggestions(){return null}`,
    "components/VoiceSearch": `export default function VoiceSearch(){return null}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Header from './src/components/FlickletHeader';import Editor from './src/components/PreferredNameEditor';function App(){const [settings,setSettings]=React.useState(false);return <><Header/><button onClick={()=>setSettings(!settings)}>Open name settings</button>{settings&&<Editor/>}</>};createRoot(document.getElementById('root')).render(<App/>);`,
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
            resolveDir: appRoot,
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
  test(`preferred name prompt and Settings update fit ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.route("https://preferred-name-test.local/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<html class="capacitor-native capacitor-android" data-safe-area-ready><body><div id="root"></div></body></html>',
      }),
    );
    await page.goto("https://preferred-name-test.local/");
    await page.addStyleTag({ content: css });
    await page.evaluate(() => {
      Object.assign(window, {
        nameState: {
          uid: "one",
          preferredName: "",
          loading: false,
          error: null,
        },
        nameWrites: [],
      });
    });
    await page.addScriptTag({ content: headerBundle });
    const dialog = page.getByRole("dialog", {
      name: "What should we call you?",
    });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("home-greeting")).toHaveCount(0);
    await expect(dialog.getByLabel("Flicklet preferred name")).toHaveValue("");
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await dialog.getByLabel("Flicklet preferred name").fill("Travis");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.locator("header").getByTestId("home-greeting"),
    ).toContainText("Travis");
    await expect(page.getByTestId("home-greeting")).toHaveCount(1);
    await page.getByRole("button", { name: "Open name settings" }).click();
    await expect(page.getByLabel("Flicklet preferred name")).toHaveValue(
      "Travis",
    );
    await page.getByLabel("Flicklet preferred name").fill("TJ");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByTestId("home-greeting")).toContainText("TJ");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(
        () => (window as unknown as { nameWrites: string[] }).nameWrites,
      ),
    ).toEqual(["Travis", "TJ"]);
    await page.evaluate(() =>
      (
        window as unknown as { setNameState: (state: unknown) => void }
      ).setNameState({
        uid: null,
        preferredName: "",
        loading: false,
        error: null,
      }),
    );
    await expect(page.getByTestId("home-greeting")).toHaveCount(0);
  });
}
