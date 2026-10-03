import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { changeLanguage, t } from '@/lib/language';
import { getSnapshot } from '@/i18n/translationStore';
import { authErrorKey, profileErrorKey, purchaseErrorKey, recoveryErrorKey } from '@/lib/accountErrors';
import { getTrialStatusLabel, resolveEntitlements } from '@/lib/entitlements';
import AuthModal from '../AuthModal';
import PreferredNamePromptModal from '../PreferredNamePromptModal';
import StartOverControl from '../StartOverControl';
import { renderSettingsSection } from '../settingsSections';
import { ACCOUNT_TRANSLATIONS } from '@/i18n/accountTranslations';
const m=vi.hoisted(()=>({login:vi.fn(),create:vi.fn(),google:vi.fn(),name:vi.fn(),backup:vi.fn(),restore:vi.fn(),download:vi.fn(),reset:vi.fn(),access:{phase:'anonymous',paidPro:false,trialActive:false,isReadOnlyMode:false,hasFullAccess:false},price:{status:'available',product:{price:'12,99 €',productId:'flicklet_full_access'}}}));
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>({signInWithEmail:m.login,createAccountWithEmail:m.create,signInWithProvider:vi.fn()})}));
vi.mock('@/lib/authLogin',()=>({googleLogin:m.google}));
vi.mock('@/hooks/usePreferredName',()=>({usePreferredName:()=>({uid:'owner',preferredName:'',loading:false,error:null,updatePreferredName:m.name,retry:vi.fn()})}));
vi.mock('@/hooks/useEntitlements',()=>({useEntitlements:()=>m.access}));
vi.mock('@/hooks/useFullAccessProduct',()=>({useFullAccessProduct:()=>m.price}));
vi.mock('@/lib/backupPersistence',()=>({createBackup:m.backup,restoreBackup:m.restore}));
vi.mock('@/lib/downloadBackup',()=>({downloadBackup:m.download}));
vi.mock('@/lib/startOver',()=>({startOver:m.reset}));
async function language(value:'en'|'es'){act(()=>changeLanguage(value));await waitFor(()=>expect(getSnapshot().locale).toBe(value));}
beforeEach(async()=>{vi.clearAllMocks();localStorage.clear();await language('en');m.login.mockResolvedValue(undefined);m.name.mockResolvedValue(undefined);m.backup.mockResolvedValue({createdAt:'2026-10-01'});m.reset.mockResolvedValue(undefined);m.price.status='available';m.access.paidPro=false;vi.spyOn(console,'error').mockImplementation(()=>{});});afterEach(()=>vi.restoreAllMocks());
it.each(['en','es'] as const)('%s auth keeps validation and successful credential handoff',async lang=>{
 await language(lang);const close=vi.fn();render(<AuthModal isOpen onClose={close}/>);fireEvent.click(screen.getByRole('button',{name:t('signInWithEmail')}));const email=screen.getByLabelText(t('accountEmail')),password=screen.getByLabelText(t('accountPassword')),form=email.closest('form')!;
 fireEvent.submit(form);expect(screen.getByRole('alert')).toHaveTextContent(t('accountRequired'));fireEvent.change(email,{target:{value:'abc'}});fireEvent.change(password,{target:{value:'12345'}});fireEvent.submit(form);expect(screen.getByRole('alert')).toHaveTextContent(t('accountInvalidEmail'));fireEvent.change(email,{target:{value:'user@example.com'}});fireEvent.submit(form);expect(screen.getByRole('alert')).toHaveTextContent(t('accountPasswordLength'));expect(m.login).not.toHaveBeenCalled();fireEvent.change(password,{target:{value:'123456'}});fireEvent.submit(form);await waitFor(()=>expect(m.login).toHaveBeenCalledWith('user@example.com','123456'));await waitFor(()=>expect(close).toHaveBeenCalledOnce());
});
it('open auth error switches both ways without changing drafts or retrying',async()=>{
 m.login.mockRejectedValueOnce({code:'auth/invalid-credential',message:'SECRET'});render(<AuthModal isOpen onClose={()=>{}}/>);fireEvent.click(screen.getByRole('button',{name:t('signInWithEmail')}));fireEvent.change(screen.getByLabelText(t('accountEmail')),{target:{value:'private@example.com'}});fireEvent.change(screen.getByLabelText(t('accountPassword')),{target:{value:'123456'}});fireEvent.submit(screen.getByLabelText(t('accountEmail')).closest('form')!);await screen.findByRole('alert');for(const lang of ['es','en'] as const){await language(lang);expect(screen.getByRole('alert')).toHaveTextContent(t('accountCredentials'));expect(screen.getByLabelText(t('accountEmail'))).toHaveValue('private@example.com');expect(screen.getByLabelText(t('accountPassword'))).toHaveValue('123456');expect(screen.queryByText('SECRET')).toBeNull();}expect(m.login).toHaveBeenCalledOnce();
});
it.each(['en','es'] as const)('%s blocked browser retains secure handoff',async lang=>{
 await language(lang);vi.spyOn(window,'matchMedia').mockReturnValue({matches:true,addListener:vi.fn(),removeListener:vi.fn()} as unknown as MediaQueryList);render(<AuthModal isOpen onClose={()=>{}}/>);expect(screen.getByText(t('accountBrowserCopy'))).toBeInTheDocument();expect(screen.getByRole('button',{name:t('signInWithGoogle')})).toBeDisabled();expect(screen.getByRole('link',{name:t('accountOpenBrowser')}).getAttribute('href')).toContain('redirect_bounce=1');
});
it.each(['en','es'] as const)('%s preferred-name prompt preserves literal text and Not now',async lang=>{
 await language(lang);const close=vi.fn();render(<PreferredNamePromptModal isOpen onClose={close}/>);expect(screen.getByRole('dialog',{name:t('profilePrompt')})).toBeInTheDocument();fireEvent.change(screen.getByLabelText(t('profileLabel')),{target:{value:'Mi Nombre / My Name'}});fireEvent.click(screen.getByRole('button',{name:t('coreNotNow')}));expect(close).toHaveBeenCalledOnce();expect(m.name).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:t('save')}));await waitFor(()=>expect(m.name).toHaveBeenCalledWith('Mi Nombre / My Name'));
});
it('preferred-name safe error updates live and preserves draft',async()=>{
 m.name.mockRejectedValueOnce(Error('private Firestore error'));render(<PreferredNamePromptModal isOpen onClose={()=>{}}/>);fireEvent.change(screen.getByLabelText(t('profileLabel')),{target:{value:'Travis'}});fireEvent.click(screen.getByRole('button',{name:t('save')}));await screen.findByRole('alert');await language('es');expect(screen.getByRole('alert')).toHaveTextContent(t('profileSaveError'));expect(screen.getByLabelText(t('profileLabel'))).toHaveValue('Travis');expect(m.name).toHaveBeenCalledOnce();
});
it.each(['en','es'] as const)('%s Start Over preserves backup choice, DELETE, consequences and safe failure',async lang=>{
 await language(lang);m.reset.mockRejectedValueOnce(Error('private cloud failure'));render(<StartOverControl/>);fireEvent.click(screen.getByRole('button',{name:t('startOverTitle')}));expect(screen.getByRole('button',{name:t('recoveryDownload')})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:t('startOverWithout')}));const dialog=within(screen.getByRole('dialog'));expect(dialog.getByText(t('startOverRemoval'))).toBeInTheDocument();expect(dialog.getByText(t('startOverPreserved'))).toBeInTheDocument();const input=screen.getByLabelText(t('startOverDelete'));for(const wrong of ['delete','ELIMINAR','DELETE ']){fireEvent.change(input,{target:{value:wrong}});expect(dialog.getByRole('button',{name:t('startOverTitle')})).toBeDisabled();}fireEvent.change(input,{target:{value:'DELETE'}});fireEvent.click(dialog.getByRole('button',{name:t('startOverTitle')}));expect(await screen.findByRole('alert')).toHaveTextContent(t('startOverError'));expect(m.reset).toHaveBeenCalledOnce();fireEvent.click(dialog.getByRole('button',{name:t('coreCancel')}));expect(screen.queryByRole('dialog')).toBeNull();
});
it('failed backup never auto-resets; error and dialog switch both ways',async()=>{
 m.backup.mockRejectedValueOnce(Error('private failure'));render(<StartOverControl/>);fireEvent.click(screen.getByRole('button',{name:t('startOverTitle')}));fireEvent.click(screen.getByRole('button',{name:t('recoveryDownload')}));await screen.findByRole('alert');for(const lang of ['es','en'] as const){await language(lang);expect(screen.getByRole('dialog',{name:t('startOverBefore')})).toBeInTheDocument();expect(screen.getByRole('alert')).toHaveTextContent(t('recoveryBackupError'));}expect(m.reset).not.toHaveBeenCalled();
});
it.each(['en','es'] as const)('%s access Settings preserves Play price and product',async lang=>{
 await language(lang);render(renderSettingsSection('pro',{}));expect(screen.getByRole('heading',{name:t('accessName')})).toBeInTheDocument();expect(screen.getByText(t('accessPrice',{price:'12,99 €'}))).toBeInTheDocument();expect(screen.getByText(t('accessRemindersCopy'))).toBeInTheDocument();expect(m.price.product).toEqual({price:'12,99 €',productId:'flicklet_full_access'});
});
it('access Settings switches live and displays localized unavailable/purchased state',async()=>{
 const view=render(renderSettingsSection('pro',{}));await language('es');expect(screen.getByRole('heading',{name:'Acceso completo'})).toBeInTheDocument();m.price.status='unavailable';view.rerender(renderSettingsSection('pro',{}));expect(screen.getByText(t('accessPriceUnavailable'))).toBeInTheDocument();m.access.paidPro=true;view.rerender(renderSettingsSection('pro',{}));expect(screen.getByText(t('accessPurchased'))).toBeInTheDocument();await language('en');expect(screen.getByText('Purchased')).toBeInTheDocument();
});
it.each(['en','es'] as const)('%s Data Settings uses safe backup failure',async lang=>{
 await language(lang);vi.spyOn(window,'alert').mockImplementation(()=>{});m.backup.mockRejectedValueOnce(Error('SECRET'));render(renderSettingsSection('data',{}));fireEvent.click(screen.getByRole('button',{name:new RegExp(t('recoveryDownload'))}));await waitFor(()=>expect(window.alert).toHaveBeenCalledWith(t('recoveryBackupError')));expect(m.download).not.toHaveBeenCalled();expect(m.restore).not.toHaveBeenCalled();
});
it.each(['en','es'] as const)('%s trial singular/plural/today retain entitlement calculations',async lang=>{
 await language(lang);const now=100000000000;for(const days of [1,3]){const state=resolveEntitlements({isAuthenticated:true,paidPro:false,proSource:null,trialStartMs:now-(21-days)*86400000,nowMs:now});expect(state.trialDaysRemaining).toBe(days);expect(getTrialStatusLabel(state)).toBe(t(days===1?'accessTrialOne':'accessTrialOther',{count:String(days)}));}const active=resolveEntitlements({isAuthenticated:true,paidPro:false,proSource:null,trialStartMs:now,nowMs:now});expect(getTrialStatusLabel({...active,trialDaysRemaining:0})).toBe(t('accessTrialToday'));expect(t('startOverDelete')).toContain('DELETE');expect(t('startOverRemoval')).not.toMatch(/game history|historial de juegos/);
});
it.each(['auth/invalid-email','auth/invalid-credential','auth/wrong-password','auth/user-not-found','auth/email-already-in-use','auth/weak-password','auth/network-request-failed','auth/popup-closed-by-user','auth/operation-not-allowed','auth/too-many-requests','auth/user-disabled','auth/account-exists-with-different-credential'])('maps %s safely in both languages',async code=>{
 const key=authErrorKey({code,message:'SECRET'});expect(key).not.toBe('accountError');for(const lang of ['en','es'] as const){await language(lang);expect(t(key)).toBe(ACCOUNT_TRANSLATIONS[lang][key]);expect(t(key)).not.toContain('SECRET');}
});
it('unknown errors stay safe and known app/native conditions remain actionable',()=>{
 expect(authErrorKey(Error('SECRET'))).toBe('accountError');expect(authErrorKey(Error('SECRET'),true)).toBe('accountCreateError');expect(profileErrorKey(Error('SECRET'))).toBe('profileSaveError');expect(profileErrorKey(Error('Please use 100 characters or fewer.'))).toBe('profileLength');expect(purchaseErrorKey(Error('User canceled purchase'))).toBe('purchaseCancelled');expect(purchaseErrorKey(Error('Billing setup failed: SECRET'))).toBe('purchaseUnavailable');expect(purchaseErrorKey(Error('Product not found: flicklet_full_access'))).toBe('purchaseProduct');expect(purchaseErrorKey(Error('SECRET'))).toBe('purchaseError');expect(recoveryErrorKey(Error('Invalid Flicklet backup: SECRET'),'restore')).toBe('recoveryInvalid');expect(recoveryErrorKey(Error('A backup restore or recovery is pending. Finish recovery and reload Flicklet before starting over.'),'reset')).toBe('recoveryPending');expect(recoveryErrorKey(Error('SECRET'),'reset')).toBe('startOverError');
});
