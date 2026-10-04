import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
let bundle: string, css: string;
const root = process.cwd();
test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    "hooks/useAuth": `export function useAuth(){return {user:null,isAuthenticated:false,signInWithEmail:async()=>{window.authCalls=(window.authCalls||0)+1},createAccountWithEmail:async()=>{},signInWithProvider:async()=>{}}}`,
    "lib/authLogin": `export async function googleLogin(){}`,
    "hooks/usePreferredName": `export function usePreferredName(){return {uid:'owner',preferredName:'',loading:false,error:null,updatePreferredName:async value=>{window.savedName=value},retry:()=>{}}}`,
    "hooks/useEntitlements": `export function useEntitlements(){const paid=new URLSearchParams(location.search).get('surface')==='paid';return {phase:paid?'paid':'trialActive',paidPro:paid,trialActive:!paid,trialDaysRemaining:10,isReadOnlyMode:false,hasFullAccess:true}}`,
    "hooks/useFullAccessProduct": `export function useFullAccessProduct(){return {status:'available',product:{price:'12,99 €',productId:'flicklet_full_access'}}}`,
    "lib/backupPersistence": `export async function createBackup(){return {createdAt:'2026-10-01'}} export async function restoreBackup(){}`,
    "lib/startOver": `export async function startOver(){window.resetCalls=(window.resetCalls||0)+1;throw Error('SECRET')}`,
    "lib/proUpgrade": `export async function startProUpgrade(){window.purchases=(window.purchases||0)+1} export async function restoreFullAccess(){window.restores=(window.restores||0)+1} export function isAndroidBillingAvailable(){return new URLSearchParams(location.search).get('surface')!=='web'}`,
    "lib/settings": `export function useSettings(){return {layout:{},notifications:{},personality:'Zen'}} export const settingsManager={};export function resolveFlickletLine(){return ''}`,
    "lib/customLists": `export function useCustomLists(){return {customLists:[],maxLists:3}}export const customListManager={}`,
    "lib/storage": `export function useLibrary(){return []} export const Library={getAll:()=>[]}`,
    "hooks/useAdminRole": `export function useAdminRole(){return {isAdmin:false}}`,
    "components/modals/SharingModal": `export default function Sharing(){return null}`,
    "components/ResetSettingsButton": `export default function Reset(){return null}`,
    "components/ForYouGenreConfig": `export default function Genres(){return null}`,
    "components/modals/NotificationCenter": `export function NotificationCenter(){return null}`,
    "pages/AdminExtrasPage": `export default function Admin(){return null}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import AuthModal from './src/components/AuthModal';import PreferredNamePromptModal from './src/components/PreferredNamePromptModal';import StartOverControl from './src/components/StartOverControl';import {renderSettingsSection} from './src/components/settingsSections';import {changeLanguage} from './src/lib/language';const surface=new URLSearchParams(location.search).get('surface');window.localize=changeLanguage;changeLanguage('es');createRoot(document.getElementById('root')).render(renderSettingsSection('pro',{}));`,
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
            return undefined;
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
  const name = fs
    .readdirSync(dir)
    .find((n) => n.startsWith("appBootstrap-") && n.endsWith(".css"));
  if (!name) throw Error("Build first");
  css = fs.readFileSync(path.join(dir, name), "utf8");
});
async function open(page: any, surface: string, width: number, height = 667) {
  await page.setViewportSize({ width, height });
  if (surface === "blocked")
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "userAgent", { value: "Instagram" });
    });
  await page.route("http://account.test/**", (route: any) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main id="root" style="padding:8px"></main><script>${bundle}</script></body></html>`,
    }),
  );
  await page.goto("http://account.test/?surface=" + surface);
}
async function contained(page: any) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize().width);
  for (const dialog of await page.getByRole("dialog").all()) {
    expect(
      await dialog.evaluate((el: any) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
  }
}

for (const width of [320, 360, 390, 768, 1023, 1024, 1280]) {
  test(`Full Access platform, language and controls at ${width}`, async ({
    page,
  }) => {
    await open(page, "web", width);
    await expect(
      page.getByText(
        /La compra y la restauración de compras están disponibles/,
      ),
    ).toBeVisible();
    await expect(page.getByRole("button")).toHaveCount(0);
    await contained(page);
    await page.evaluate(() => (window as any).localize("en"));
    await expect(
      page.getByText(/Purchase and Restore Purchases are available/),
    ).toBeVisible();
    await page.evaluate(() => (window as any).localize("es"));
    await expect(
      page.getByRole("heading", { name: "Acceso completo", exact: true }),
    ).toBeVisible();
    await contained(page);
    await open(page, "access", width);
    await expect(page.getByRole("button")).toHaveCount(2);
    await contained(page);
    const buttons = page.getByRole("button");
    await buttons.nth(0).focus();
    await page.keyboard.press("Enter");
    await buttons.nth(1).focus();
    await page.keyboard.press("Space");
    expect(await page.evaluate(() => (window as any).purchases)).toBe(1);
    expect(await page.evaluate(() => (window as any).restores)).toBe(1);
    await page.evaluate(() => (window as any).localize("en"));
    await expect(
      page.getByRole("button", { name: "Restore Purchases", exact: true }),
    ).toBeVisible();
    await contained(page);
    await open(page, "paid", width);
    await expect(page.getByRole("button")).toHaveCount(1);
    await contained(page);
  });
}
