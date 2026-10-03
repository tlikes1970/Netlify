import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { auth } from '@/lib/firebaseBootstrap';
import { changeLanguage, t } from '@/lib/language';
import { startProUpgrade } from '@/lib/proUpgrade';
vi.mock('@/lib/firebaseBootstrap',()=>({auth:{currentUser:{uid:'owner'}}}));
vi.mock('@/lib/apiConfig',()=>({apiUrl:(path:string)=>path}));
vi.mock('@/lib/proStatus',()=>({clearBillingCache:vi.fn()}));
let initialize:ReturnType<typeof vi.fn>,getProducts:ReturnType<typeof vi.fn>,purchase:ReturnType<typeof vi.fn>;
beforeEach(()=>{initialize=vi.fn().mockResolvedValue({});getProducts=vi.fn().mockResolvedValue({products:[{productId:'flicklet_full_access',price:'12,99 €',currency:'EUR'}]});purchase=vi.fn().mockResolvedValue({purchaseToken:'unchanged-token'});(window as Window & {Capacitor?:unknown}).Capacitor={getPlatform:()=> 'android',Plugins:{Billing:{initialize,getProducts,purchase}}};vi.spyOn(console,'error').mockImplementation(()=>{});vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({isValid:true})}));});
afterEach(()=>{delete (window as Window & {Capacitor?:unknown}).Capacitor;vi.restoreAllMocks();vi.unstubAllGlobals();});
it.each(['en','es'] as const)('%s purchase keeps product, token, validation and success event while localizing feedback',async lang=>{
 changeLanguage(lang);const listener=vi.fn();window.addEventListener('pro-upgrade-success',listener);await startProUpgrade();window.removeEventListener('pro-upgrade-success',listener);expect(auth.currentUser?.uid).toBe('owner');expect(getProducts).toHaveBeenCalledWith({productIds:['flicklet_full_access'],productType:'inapp'});expect(purchase).toHaveBeenCalledWith({productId:'flicklet_full_access',productType:'inapp'});expect(fetch).toHaveBeenCalledWith('/api/billing/validate',expect.objectContaining({body:JSON.stringify({purchaseToken:'unchanged-token',platform:'android',productId:'flicklet_full_access',userId:'owner'})}));const event=listener.mock.calls[0][0] as CustomEvent;expect(event.detail).toMatchObject({productId:'flicklet_full_access',platform:'android',purchaseType:'one_time',message:t('purchaseSuccess'),messageKey:'purchaseSuccess'});
});
it.each(['en','es'] as const)('%s cancellation remains rejection without validation or activation',async lang=>{
 changeLanguage(lang);purchase.mockRejectedValueOnce(Error('User canceled purchase'));const listener=vi.fn();window.addEventListener('pro-upgrade-error',listener);await expect(startProUpgrade()).rejects.toThrow('User canceled purchase');window.removeEventListener('pro-upgrade-error',listener);expect(fetch).not.toHaveBeenCalled();expect((listener.mock.calls[0][0] as CustomEvent).detail.message).toBe(t('purchaseCancelled'));expect(console.error).toHaveBeenCalled();
});
it.each(['en','es'] as const)('%s unknown billing diagnostics remain in logs and use safe display',async lang=>{
 changeLanguage(lang);purchase.mockRejectedValueOnce(Error('SECRET billing debug'));const listener=vi.fn();window.addEventListener('pro-upgrade-error',listener);await expect(startProUpgrade()).rejects.toThrow('SECRET billing debug');window.removeEventListener('pro-upgrade-error',listener);expect((listener.mock.calls[0][0] as CustomEvent).detail.message).toBe(t('purchaseError'));expect(fetch).not.toHaveBeenCalled();
});
