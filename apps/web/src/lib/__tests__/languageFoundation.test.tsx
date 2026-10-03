import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { changeLanguage, languageManager, useLanguage, useTranslations, useT, t, getFormattingLocale, getMetadataLanguage } from '../language';
import { formatDate, formatDateTime, formatNumber, formatInteger, formatRating } from '../localeFormatters';
import { getSnapshot } from '../../i18n/translationStore';
beforeEach(async()=>{localStorage.clear();languageManager.setLanguage('en');await waitFor(()=>expect(getSnapshot().locale).toBe('en'))});
afterEach(()=>{cleanup();vi.restoreAllMocks()});
function Labels(){const strings=useTranslations();const translate=useT(['settings']);const language=useLanguage();return <><p>{strings.settings}</p><p>{translate('settings')}</p><p data-testid="locale">{language}:{formatRating(4.5)}</p></>}
it('subscribed labels, document language and formatters switch both ways without reload',async()=>{
 render(<Labels/>);await act(async()=>Promise.resolve());
 act(()=>changeLanguage('es'));expect(document.documentElement.lang).toBe('es');expect(localStorage.getItem('flicklet.language.v2')).toBe('es');
 await waitFor(()=>expect(screen.getAllByText('Configuración')).toHaveLength(2));expect(screen.getByTestId('locale')).toHaveTextContent('es:4,5');
 act(()=>changeLanguage('en'));await waitFor(()=>expect(screen.getAllByText('Settings')).toHaveLength(2));expect(document.documentElement.lang).toBe('en');expect(screen.getByTestId('locale')).toHaveTextContent('en:4.5');
});
it('rapid language changes keep the final selection, dictionary and document consistent',async()=>{
 render(<Labels/>);await act(async()=>Promise.resolve());
 act(()=>{changeLanguage('es');changeLanguage('en')});
 await waitFor(()=>expect(getSnapshot().locale).toBe('en'));
 await act(async()=>new Promise(resolve=>setTimeout(resolve,40)));
 expect(getSnapshot().locale).toBe('en');expect(screen.getAllByText('Settings')).toHaveLength(2);expect(document.documentElement.lang).toBe('en');
});
it('safe lookup covers dictionary properties and both public getters',()=>{
 const warn=vi.spyOn(console,'warn').mockImplementation(()=>undefined);
 expect((languageManager.getTranslations() as unknown as Record<string,string>).foundationMissing).toBe('[foundationMissing]');
 expect(t('foundationMissing' as never)).toBe('[foundationMissing]');expect(warn).toHaveBeenCalledOnce();
 expect(JSON.stringify(languageManager.getTranslations())).toContain('Settings');
});
it('mapping keeps generic Spanish separate from geography and changes no API behavior',()=>{
 expect(getFormattingLocale()).toBe('en-US');expect(getMetadataLanguage()).toBe('en-US');
 changeLanguage('es');expect(getFormattingLocale()).toBe('es');expect(getMetadataLanguage()).toBe('es');
});
it.each(['en','es'] as const)('date, date/time and decimal/count formatting use Flicklet %s',language=>{
 changeLanguage(language);const locale=getFormattingLocale();const date=new Date('2026-01-02T13:04:00Z');
 expect(formatDate(date,{timeZone:'UTC'})).toBe(new Intl.DateTimeFormat(locale,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(date));
 expect(formatDateTime(date,{timeZone:'UTC'})).toBe(new Intl.DateTimeFormat(locale,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'UTC'}).format(date));
 expect(formatDate(date,{dateStyle:'short'})).toBe(new Intl.DateTimeFormat(locale,{dateStyle:'short'}).format(date));
 expect(formatNumber(9.75)).toBe(language==='es'?'9,75':'9.75');expect(formatRating(4)).toBe(language==='es'?'4,0':'4.0');
 expect(formatInteger(123456)).toBe(language==='es'?'123.456':'123,456');
});
it('language never sets a timezone; explicit overrides remain supported',()=>{
 const date=new Date('2026-01-02T00:30:00Z');const runtime=Intl.DateTimeFormat().resolvedOptions().timeZone;
 for(const language of ['en','es'] as const){changeLanguage(language);expect(new Intl.DateTimeFormat(getFormattingLocale()).resolvedOptions().timeZone).toBe(runtime);
 expect(formatDate(date)).toBe(new Intl.DateTimeFormat(getFormattingLocale(),{year:'numeric',month:'short',day:'numeric'}).format(date));
 expect(formatDateTime(date,{timeZone:'Pacific/Auckland'})).toBe(new Intl.DateTimeFormat(getFormattingLocale(),{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Pacific/Auckland'}).format(date));}
});
it('switching language changes no content/access storage and performs no network request',()=>{
 const content={'flicklet.library.v2':'titles','flicklet.customLists.v2':'lists','episode-progress-8':'progress','flicklet.settings.v2':'access/name/preferences','flicklet.series-reminders.v1':'reminders'};
 for(const [key,value] of Object.entries(content))localStorage.setItem(key,value);
 const fetch=vi.spyOn(globalThis,'fetch');changeLanguage('es');changeLanguage('en');
 for(const [key,value] of Object.entries(content))expect(localStorage.getItem(key)).toBe(value);expect(fetch).not.toHaveBeenCalled();
});
