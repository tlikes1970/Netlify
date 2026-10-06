import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { changeLanguage, t } from '@/lib/language';
import { getSnapshot } from '@/i18n/translationStore';
import { renderSettingsSection } from '../settingsSections';
import FeedbackPanel from '../FeedbackPanel';
const toast=vi.hoisted(()=>vi.fn());
vi.mock('../Toast',()=>({useToast:()=>({addToast:toast})}));
async function language(value:'en'|'es'){act(()=>changeLanguage(value));await waitFor(()=>expect(getSnapshot().locale).toBe(value));}
beforeEach(async()=>{vi.clearAllMocks();await language('en');});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('About legal chrome, attribution and factual access copy switch EN ES EN with the same policy destination',async()=>{
 render(renderSettingsSection('about',{}));
 for(const lang of ['en','es','en'] as const){await language(lang);expect(screen.getByText((_text,el)=>el?.tagName==='H4' && Boolean(el.textContent?.endsWith(t('legalHeading'))))).toBeVisible();expect(screen.getByText(t('legalAttribution'))).toBeVisible();expect(screen.getByText(t('legalAccessCopy'))).toBeVisible();const link=screen.getByRole('link',{name:t('legalOpenPrivacy')});expect(link).toHaveTextContent(t('legalPrivacy'));expect(link).toHaveAttribute('href','https://flicklet.netlify.app/privacy.html');expect(link).toHaveAttribute('rel','noopener noreferrer');}
 expect(screen.queryByText(/Always free at the core/)).toBeNull();
});
it('Feedback live switching preserves the draft and shows current support guidance',async()=>{
 render(<FeedbackPanel/>);fireEvent.change(screen.getByRole('textbox',{name:t('feedbackInput')}),{target:{value:'Mi feedback stays unchanged'}});
 for(const lang of ['en','es','en'] as const){await language(lang);expect(screen.getByRole('textbox',{name:t('feedbackInput')})).toHaveValue('Mi feedback stays unchanged');for(const key of ['feedbackComments','feedbackSuggestions','feedbackKudos','feedbackBugs','feedbackTechnical','feedbackHelp'] as const)expect(screen.getByText(t(key)+':')).toBeVisible();expect(screen.getByText(t('feedbackResponseTime'))).toBeVisible();expect(screen.queryByText(/Marquee Comments|Video Submissions|Submit Content|support@flickletapp.com|Asunto:|Subject:|100MB|720p|MP4/)).toBeNull();expect(screen.getByRole('button',{name:t('sendFeedback')})).toBeEnabled();}
});
it('Spanish feedback keeps Netlify payload and localized pending/success states',async()=>{
 await language('es');let finish!:(value:unknown)=>void;const fetcher=vi.fn(()=>new Promise(resolve=>{finish=resolve;}));vi.stubGlobal('fetch',fetcher);render(<FeedbackPanel/>);const input=screen.getByRole('textbox',{name:t('feedbackInput')});fireEvent.change(input,{target:{value:'  user entered text  '}});fireEvent.submit(input.closest('form')!);expect(screen.getByRole('button',{name:t('feedbackSending')})).toBeDisabled();const [url,options]=fetcher.mock.calls[0] as unknown as [string,RequestInit];expect(url).toBe('/');const payload=new URLSearchParams(options.body as string);expect([...payload.keys()]).toEqual(['form-name','bot-field','message','theme','timestamp']);expect(payload.get('message')).toBe('user entered text');expect(payload.get('theme')).toBe('light');expect(options.method).toBe('POST');await act(async()=>finish({ok:true}));await waitFor(()=>expect(toast).toHaveBeenCalledWith(t('feedbackSuccess'),'success'));expect(input).toHaveValue('');
});
it('failed feedback reports localized error and preserves draft',async()=>{
 await language('es');vi.spyOn(console,'error').mockImplementation(()=>{});vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));render(<FeedbackPanel/>);const input=screen.getByRole('textbox',{name:t('feedbackInput')});fireEvent.change(input,{target:{value:'Keep this'}});fireEvent.submit(input.closest('form')!);await waitFor(()=>expect(toast).toHaveBeenCalledWith(t('feedbackFailure'),'error'));expect(input).toHaveValue('Keep this');
});
it('About authorship and app explanations are localized in EN ES EN',async()=>{
 render(renderSettingsSection('about',{}));
 for(const lang of ['en','es','en'] as const){await language(lang);for(const key of ['settingsAboutCreators','settingsAboutApp','settingsAboutIntro','settingsAboutHouse','settingsAboutBuilders','settingsAboutBackground','settingsAboutProblem','settingsAboutInstead','settingsAboutAudience','settingsAboutSimpleCopy','settingsAboutShareCopy'] as const)expect(screen.getByText((_text,el)=>Boolean(el && ['H4','P','LI'].includes(el.tagName) && el.textContent?.includes(t(key))))).toBeVisible();}
});
