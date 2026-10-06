import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
let bundle: string, css: string;
test.beforeAll(async () => {
  const root = process.cwd();
  const mocks: Record<string, string> = {
    "hooks/useAuth": `export function useAuth(){return {user:window.signedOut?null:{uid:'owner'}}}`,
    "lib/language": `import React from 'react';export function useLanguage(){const [lang,set]=React.useState(window.locale||'en');React.useEffect(()=>{const change=()=>set(window.locale);window.addEventListener('locale',change);return()=>window.removeEventListener('locale',change)},[]);return lang}export function changeLanguage(lang){window.locale=lang;window.dispatchEvent(new Event('locale'));}`,
    "lib/accountDeletion": `export async function deleteCurrentAccount(){window.deletions=(window.deletions||0)+1;throw {code:'functions/failed-precondition'}}export async function finishDeletedAccountLocally(){}`,
    "lib/accountReauthentication": `export async function reauthenticateForDeletion(){throw Error('cancelled')}`,
    "lib/firebaseBootstrap": `export const auth={currentUser:{providerData:[{providerId:'password'}]}};`,
    "hooks/useAndroidBackDismiss": `export function useAndroidBackDismiss(){}`,
    "components/AuthModal": `import React from 'react';export default function Auth({isOpen,onClose}){return isOpen?<div role="dialog" aria-label="Sign in"><button onClick={onClose}>Cancel</button></div>:null}`,
  };
  const result = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Page from './src/pages/DeleteAccountPage';createRoot(document.getElementById('root')).render(<Page/>);`,
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
  css = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".css"))
    .map((name) => fs.readFileSync(path.join(dir, name), "utf8"))
    .join("\n");
});
for (const width of [320, 360, 390, 768, 1023, 1024, 1280])
  for (const language of ["en", "es"])
    test(`public deletion and confirmation ${width} ${language}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.route("http://deletion.test/delete-account", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<html lang="${language}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>window.locale=${JSON.stringify(language)};</script><script>${bundle}</script></body></html>`,
        }),
      );
      await page.goto("http://deletion.test/delete-account");
      const name = language === "en" ? "Delete account" : "Eliminar cuenta";
      await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
      await page.getByRole("button", { name, exact: true }).click();
      const dialog = page.getByRole("dialog", { name });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("button", { name, exact: true }),
      ).toBeDisabled();
      await expect(dialog.getByRole("textbox")).toBeFocused();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toBeFocused();
      await page.getByRole("button", { name, exact: true }).click();
      await dialog.getByRole("textbox").fill("DELETE");
      await dialog.getByRole("button", { name, exact: true }).click();
      await expect(
        page.getByLabel(language === "en" ? "Password" : "Contraseña"),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    });
test("public signed-out page offers sign-in without automatic destructive action", async ({
  page,
}) => {
  await page.route("http://deletion.test/delete-account", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<div id="root"></div><script>window.signedOut=true;</script><script>${bundle}</script>`,
    }),
  );
  await page.goto("http://deletion.test/delete-account");
  await expect(
    page.getByRole("button", { name: "Sign in to delete your account" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page
    .getByRole("button", { name: "Sign in to delete your account" })
    .click();
  await expect(page.getByRole("dialog", { name: "Sign in" })).toBeVisible();
});
