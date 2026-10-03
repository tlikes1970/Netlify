import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../readOnlyGuard',()=>({guardMutation:()=>true}));
afterEach(()=>cleanup());

it('publishes the hook snapshot even when an earlier access listener refreshed the manager limit', async()=>{
  vi.resetModules();
  const access=await import('../entitlements');
  let lists:typeof import('../customLists');
  const stop=access.subscribeEntitlements(()=>lists.customListManager.getUserLists());
  lists=await import('../customLists');
  localStorage.setItem('flicklet.customLists.v2',JSON.stringify({customLists:[1,2,3].map(id=>({id:String(id),name:`List ${id}`,createdAt:id})),maxLists:3}));
  window.dispatchEvent(new Event('customLists:updated'));
  function Probe(){const value=lists.useCustomLists();return <span>{value.maxLists===Infinity?'Unlimited':String(value.maxLists)}</span>}
  render(<Probe/>);
  expect(screen.getByText('3')).toBeVisible();
  act(()=>access.setEntitlementsCache(access.resolveEntitlements({isAuthenticated:true,paidPro:true,proSource:'android',trialStartMs:null})));
  expect(screen.getByText('Unlimited')).toBeVisible();
  stop();
});
