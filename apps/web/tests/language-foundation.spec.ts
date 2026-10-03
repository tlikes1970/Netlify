import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let bundle:string,css:string;
test.beforeAll(async()=>{
 const root=process.cwd();const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {changeLanguage,useLanguage,useTranslations,useT,getMetadataLanguage} from './src/lib/language';import {formatDate,formatRating,formatInteger} from './src/lib/localeFormatters';function App(){const lang=useLanguage();const strings=useTranslations();const t=useT(['settings']);return <><button onClick={()=>changeLanguage('en')}>English</button><button onClick={()=>changeLanguage('es')}>Español</button><h1>{strings.settings}</h1><p data-testid="selected">{t('settings')}</p><p data-testid="rating">{formatRating(4.5)}</p><p data-testid="integer">{formatInteger(123456)}</p><p data-testid="date">{formatDate(new Date('2026-01-02T00:30:00Z'))}</p><p data-testid="language">{lang}</p><p data-testid="metadata">{getMetadataLanguage()}</p><button onClick={()=>{changeLanguage('en');changeLanguage('es');changeLanguage('en')}}>Rapid toggle</button></>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'import.meta.env':'{}'}});
 bundle=result.outputFiles[0].text;const assets=path.join(root,'dist/assets');css=fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(name=>name.startsWith('appBootstrap-')&&name.endsWith('.css'))!),'utf8');
});
for(const width of [320,1280])for(const saved of ['en','es','invalid'])test(`device language ${saved} boots/switches/reloads at ${width}px`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:667},timezoneId:'America/New_York'});const page=await context.newPage();const apiRequests:string[]=[];
 page.on('request',request=>{if(['fetch','xhr'].includes(request.resourceType()))apiRequests.push(request.url())});
 await page.route('http://language.test/',route=>route.fulfill({contentType:'text/html',body:`<html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>if(!localStorage.getItem('flicklet.language.v2'))localStorage.setItem('flicklet.language.v2',${JSON.stringify(saved)});</script><script>${bundle}</script></body></html>`}));
 await page.goto('http://language.test/');
 const initial=saved==='es'?'es':'en';await expect(page.locator('html')).toHaveAttribute('lang',initial);await expect(page.getByRole('heading')).toHaveText(initial==='es'?'Configuración':'Settings');
 await page.getByRole('button',{name:'Español',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','es');await expect(page.getByRole('heading')).toHaveText('Configuración');await expect(page.getByTestId('selected')).toHaveText('Configuración');
 await expect(page.getByTestId('rating')).toHaveText('4,5');await expect(page.getByTestId('integer')).toHaveText('123.456');await expect(page.getByTestId('date')).toHaveText('1 ene 2026');await expect(page.getByTestId('metadata')).toHaveText('es');
 await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','es');await expect(page.getByRole('heading')).toHaveText('Configuración');
 await page.getByRole('button',{name:'Rapid toggle',exact:true}).click();await expect(page.getByRole('heading')).toHaveText('Settings');await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.getByTestId('rating')).toHaveText('4.5');await expect(page.getByTestId('date')).toHaveText('Jan 1, 2026');
 await page.reload();await expect(page.getByRole('heading')).toHaveText('Settings');expect(await page.evaluate(()=>Intl.DateTimeFormat().resolvedOptions().timeZone)).toBe('America/New_York');expect(apiRequests).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await context.close();
});
