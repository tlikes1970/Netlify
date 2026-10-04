import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { renderSettingsSection } from '../settingsSections';
import { settingsManager } from '@/lib/settings';
import { changeLanguage,t } from '@/lib/language';
import { getSnapshot } from '@/i18n/translationStore';
import { DEFAULT_SETTINGS } from '@/lib/settings';
const m=vi.hoisted(()=>({allowed:true}));
vi.mock('@/lib/readOnlyGuard',()=>({guardMutation:()=>m.allowed}));
async function language(value:'en'|'es'){act(()=>changeLanguage(value));await waitFor(()=>expect(getSnapshot().locale).toBe(value));}
beforeEach(async()=>{m.allowed=true;localStorage.setItem('flicklet.settings.v2',JSON.stringify(DEFAULT_SETTINGS));settingsManager.reloadAfterRestore();await language('en');});afterEach(()=>vi.restoreAllMocks());
it('named native group defaults to Standard and selects Minimal and Maximum immediately',()=>{
 render(renderSettingsSection('account',{}));const group=screen.getByRole('group',{name:t('personalityLevel')});expect(group.tagName).toBe('FIELDSET');expect(screen.getByRole('radio',{name:/Standard/})).toBeChecked();fireEvent.click(screen.getByRole('radio',{name:/Minimal/}));expect(settingsManager.getSettings().personalityLevel).toBe(1);expect(screen.getByRole('radio',{name:/Minimal/})).toBeChecked();fireEvent.click(screen.getByRole('radio',{name:/Maximum/}));expect(settingsManager.getSettings().personalityLevel).toBe(3);expect(screen.getByRole('radio',{name:/Maximum/})).toBeChecked();
});
it('EN ES EN copy and Preview update without resetting selected value',async()=>{
 render(renderSettingsSection('account',{}));fireEvent.click(screen.getByRole('radio',{name:/Minimal/}));for(const lang of ['en','es','en'] as const){await language(lang);expect(screen.getByRole('group',{name:t('personalityLevel')})).toBeVisible();expect(screen.getByText(t('contentQuietMarqueeOff'))).toBeVisible();expect(screen.getByText(t('contentMoreObservationsStrongerTone'))).toBeVisible();expect(settingsManager.getSettings().personalityLevel).toBe(1);expect(screen.getByRole('radio',{name:new RegExp(t('contentMinimal'))})).toBeChecked();expect(screen.getByText(t('preview')+':')).toBeVisible();}expect(screen.queryByText(/Marquee off/)).toBeNull();expect(screen.queryByText(/More observations/)).toBeNull();
});
it.each(['en','es'] as const)('%s blocked selection preserves checked option and Preview',async lang=>{
 await language(lang);render(renderSettingsSection('account',{}));const group=screen.getByRole('group',{name:t('personalityLevel')}),preview=group.querySelector('p.text-sm.mt-1')!.textContent;m.allowed=false;fireEvent.click(screen.getByRole('radio',{name:new RegExp(t('contentMaximum'))}));expect(screen.getByRole('radio',{name:new RegExp(t('contentStandard'))})).toBeChecked();expect(settingsManager.getSettings().personalityLevel).toBe(2);expect(group.querySelector('p.text-sm.mt-1')!.textContent).toBe(preview);
});
