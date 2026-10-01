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
    "lib/language": `export function useTranslations(){return {home:'Home',discovery:'Discovery',search:'Search',clear:'Clear',searchPlaceholder:'Search movies, shows, people...'}}`,
    "lib/capacitorEnv": `export function isCapacitorNative(){return true} export function isCapacitorAndroid(){return true} export function getCapacitorPlatform(){return "android"}`,
    "lib/mobileViewportLayout": `export function dispatchKeyboardDismiss(){} export const KEYBOARD_DISMISS_EVENT="keyboard-dismiss";export const KEYBOARD_OPEN_THRESHOLD=50;export function useNavViewportLift(){return false}`,
    "pwa/useInstall": `export function useCanInstallPWA(){return false}`,
    "pwa/installSignal": `export function promptInstall(){}`,
    "components/AccountButton": `export default function AccountButton(){return null}`,
    "components/SearchSuggestions": `export function addSearchToHistory(){} export default function SearchSuggestions(){return null}`,
    "components/VoiceSearch": `export default function VoiceSearch(){return null}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Header from './src/components/FlickletHeader';import MobileTabs from './src/components/MobileTabs';function App(){const [view,setView]=React.useState('library');const [settings,setSettings]=React.useState(false);return <><Header/><div style={{height:3000,background:'repeating-linear-gradient(red 0px,red 30px,yellow 30px,yellow 60px)'}}>Scrolling content</div><MobileTabs current={view} onChange={setView} onSettingsClick={()=>setSettings(true)}/>{settings&&<output>Settings opened</output>}</>};createRoot(document.getElementById('root')).render(<App/>);`,
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
          builder.onResolve({ filter: /^(\.\.?\/|@\/)/ }, (args) => {
            const absolute = path
              .resolve(args.path.startsWith("@/") ? path.join(appRoot,"src") : args.resolveDir, args.path.replace(/^@\//,""))
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

for(const [width,height] of [[320,800],[360,800],[390,844],[768,1024],[844,390]]) {
 test(`native chrome protects insets ${width}x${height}`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.route('https://chrome-test.local/**',route=>route.fulfill({contentType:'text/html',body:'<html class="capacitor-native capacitor-android" data-safe-area-ready><body><div id="root"></div></body></html>'}));
  await page.goto('https://chrome-test.local/');await page.addStyleTag({content:css});await page.addStyleTag({content:'#root{height:auto;min-height:100%}'});
  await page.evaluate(()=>{const root=document.documentElement;root.style.setProperty('--safe-top','24px');root.style.setProperty('--safe-bottom','30px');root.style.setProperty('--safe-left','0px');root.style.setProperty('--safe-right','0px');Object.assign(window,{nameState:{uid:null,preferredName:'',loading:false,error:null},nameWrites:[]})});
  await page.addScriptTag({content:headerBundle});
  const nav=page.getByRole('navigation',{name:'Main navigation'});await expect(nav).toBeVisible();
  expect(await nav.getByRole('button',{name:'Open Settings'}).locator('svg').count()).toBe(0);
  await nav.getByRole('button',{name:'Discovery'}).click();await expect(nav.getByRole('button',{name:'Discovery'})).toHaveAttribute('aria-current','page');
  await nav.getByRole('button',{name:'Open Settings'}).click();await expect(page.getByRole('status')).toHaveText('Settings opened');
  await page.evaluate(()=>document.body.scrollTo(0,600));await page.waitForTimeout(100);
  const search=await page.locator('.flicklet-sticky-search').boundingBox();expect(search!.y).toBeCloseTo(24,0);
  const mask=await page.locator('.flicklet-sticky-search').evaluate(el=>{const s=getComputedStyle(el,'::before');return {position:s.position,top:s.top,height:s.height,color:s.backgroundColor}});
  expect(mask).toEqual({position:'fixed',top:'0px',height:'24px',color:'rgb(15, 17, 21)'});
  const b=await nav.boundingBox();expect(b!.y+b!.height).toBeCloseTo(height-30,0);
  const bottom=await nav.evaluate(el=>{const s=getComputedStyle(el,'::after');return {top:s.top,height:s.height,color:s.backgroundColor}});expect(bottom.height).toBe('30px');expect(bottom.color).toBe('rgb(15, 17, 21)');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  if(width===390||width===844)await page.screenshot({path:test.info().outputPath(`chrome-${width}.png`)});
 });
}
