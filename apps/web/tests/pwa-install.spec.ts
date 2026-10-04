import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
let bundle: string, css: string;
test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    "components/HomeGreeting": `export default function Greeting(){return null}`,
    "components/AccountButton": `export default function Account(){return <button>{window.accountState||'Signed out'}</button>}`,
    "components/PreferredNamePromptModal": `export default function Preferred(){return null}`,
    "hooks/usePreferredName": `export function usePreferredName(){return {uid:null,preferredName:'',loading:false,error:null}}`,
    "components/SearchSuggestions": `export default function Suggestions(){return null}export function addSearchToHistory(){}`,
    "components/VoiceSearch": `export default function Voice(){return null}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Header from './src/components/FlickletHeader';import {initInstallSignal,getCanInstall} from './src/pwa/installSignal';import {changeLanguage} from './src/lib/language';const mode=new URLSearchParams(location.search).get('mode');if(mode==='native')window.Capacitor={getPlatform:()=> 'android',isNativePlatform:()=>true};if(mode==='standalone'){const original=window.matchMedia.bind(window);window.matchMedia=q=>q==='(display-mode: standalone)'?{matches:true,addEventListener:()=>{}}:original(q);}initInstallSignal();window.available=getCanInstall;window.localize=changeLanguage;window.offer=()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{window.attempts=(window.attempts||0)+1;return {outcome:'dismissed'}};window.dispatchEvent(e);};const app=createRoot(document.getElementById('root'));window.account=value=>{window.accountState=value;app.render(<Header showGreeting={false} appName={value?'Flicklet':'Flicklet'}/>)};window.account('Signed out');`,
      resolveDir: root,
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    define: { "import.meta.env": "{}" },
    plugins: [
      {
        name: "boundaries",
        setup(builder) {
          builder.onResolve({ filter: /^(\.\.?\/|@\/)/ }, (args) => {
            const absolute = path
              .resolve(
                args.path.startsWith("@/")
                  ? path.join(root, "src")
                  : args.resolveDir,
                args.path.replace(/^@\//, ""),
              )
              .replace(/\.(tsx?|jsx?)$/, "");
            for (const key of Object.keys(mocks))
              if (absolute === path.join(root, "src", key))
                return { path: key, namespace: "mock" };
          });
          builder.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
            contents: mocks[args.path],
            resolveDir: root,
            loader: "tsx",
          }));
        },
      },
    ],
  });
  bundle = result.outputFiles[0].text;
  const dir = path.join(root, "dist/assets");
  css = fs.readFileSync(
    path.join(
      dir,
      fs
        .readdirSync(dir)
        .find((n) => n.startsWith("appBootstrap-") && n.endsWith(".css"))!,
    ),
    "utf8",
  );
});
async function open(page: any, width: number, mode = "browser") {
  await page.setViewportSize({ width, height: 768 });
  await page.route("http://install.test/**", (route: any) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle}</script></body></html>`,
    }),
  );
  await page.goto("http://install.test/?mode=" + mode);
}
async function contained(page: any) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize().width);
}
for (const width of [320, 360, 390, 768, 1023, 1024, 1280]) {
  test(`Production header installation lifecycle EN/ES at ${width}`, async ({
    page,
  }) => {
    await open(page, width);
    await expect(page.getByTestId("install-button")).toHaveCount(0);
    const slot = page.locator("#install-slot");
    if (width >= 768) expect((await slot.boundingBox())!.width).toBe(64);
    await page.evaluate(() => (window as any).offer());
    await expect(page.getByTestId("install-button")).toHaveText("Install");
    await contained(page);
    await page.evaluate(() => (window as any).localize("es"));
    await expect(page.getByTestId("install-button")).toHaveText("Instalar");
    await expect(page.getByTestId("install-button")).toHaveAccessibleName(
      "Instalar aplicación",
    );
    await contained(page);
    await page.evaluate(() => (window as any).localize("en"));
    await page.getByTestId("install-button").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("install-button")).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).attempts)).toBe(1);
    if (width >= 768) expect((await slot.boundingBox())!.width).toBe(64);
    await contained(page);
    await page.evaluate(() => (window as any).offer());
    await expect(page.getByTestId("install-button")).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
    await expect(page.getByTestId("install-button")).toHaveCount(0);
  });
  test(`Standalone/native exclusion at ${width}`, async ({ page }) => {
    for (const mode of ["standalone", "native"]) {
      await open(page, width, mode);
      await page.evaluate(() => (window as any).offer());
      await expect(page.getByTestId("install-button")).toHaveCount(0);
      expect(await page.evaluate(() => (window as any).available())).toBe(
        false,
      );
      await contained(page);
    }
  });
  test(`Install is independent of auth/trial/paid at ${width}`, async ({
    page,
  }) => {
    await open(page, width);
    await page.evaluate(() => (window as any).offer());
    for (const state of [
      "Signed out",
      "Active trial",
      "Full Access",
      "Expired trial",
    ]) {
      await page.evaluate((value) => (window as any).account(value), state);
      await expect(
        page.getByRole("button", { name: state, exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("install-button")).toBeVisible();
      await contained(page);
    }
  });
}
