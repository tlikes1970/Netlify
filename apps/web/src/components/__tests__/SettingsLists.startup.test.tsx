import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({billing:vi.fn(),user:{uid:'owner'}}));
vi.mock('../../hooks/useAuth',()=>({useAuth:()=>({user:mocks.user,isAuthenticated:true})}));
vi.mock('../../lib/billing',()=>({getBillingStatus:mocks.billing}));
vi.mock('../../lib/trialEntitlement',()=>({resolveServerTrialStartMs:()=>new Promise(()=>{})}));
import { renderSettingsSection } from '../settingsSections';
import { customListManager } from '../../lib/customLists';
import { clearBillingCache } from '../../lib/proStatus';
import { resolveEntitlements, setEntitlementsCache } from '../../lib/entitlements';
let resolveBilling:(data:unknown)=>void;
beforeEach(()=>{
  localStorage.clear(); clearBillingCache();
  setEntitlementsCache(resolveEntitlements({isAuthenticated:false,paidPro:false,proSource:null,trialStartMs:null}));
  const pending=new Promise(resolve=>{resolveBilling=resolve});
  mocks.billing.mockReset().mockReturnValue(pending);
  localStorage.setItem('flicklet.customLists.v2',JSON.stringify({customLists:[1,2,3].map(id=>({id:String(id),name:`List ${id}`,createdAt:id,itemCount:0})),maxLists:3}));
  window.dispatchEvent(new Event('customLists:updated'));
  vi.spyOn(window,'prompt').mockReturnValue('Fourth');
});
afterEach(()=>{cleanup();vi.restoreAllMocks();clearBillingCache()});

it.each([false,true])('real billing/pro/entitlement hooks recover Settings after unresolved access (previously purchased=%s)',async previousPaid=>{
  if(previousPaid) setEntitlementsCache(resolveEntitlements({isAuthenticated:true,paidPro:true,proSource:'android',trialStartMs:null}));
  render(renderSettingsSection('display',{isMobile:true}));
  expect(screen.queryByRole('button',{name:'Create New List'})).toBeNull();
  expect(customListManager.getUserLists().maxLists).toBe(3);
  await act(async()=>{resolveBilling({isPro:true,source:'android',purchaseType:'one_time',currentPeriodEnd:null});});
  expect(screen.getByRole('button',{name:'Create New List'})).toBeVisible();
  expect(customListManager.getUserLists().maxLists).toBe(Infinity);
  fireEvent.click(screen.getByRole('button',{name:'Create New List'}));
  expect(screen.getByText('Fourth')).toBeVisible();
  expect(customListManager.getUserLists().customLists).toHaveLength(4);
});
