import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderSettingsSection } from '../settingsSections';
import { customListManager } from '../../lib/customLists';
import { getEntitlementsSync, resolveEntitlements, setEntitlementsCache } from '../../lib/entitlements';

vi.mock('../../hooks/useEntitlements', async () => {
  const entitlements = await import('../../lib/entitlements');
  return { useEntitlements: () => entitlements.getEntitlementsSync() };
});

function access(paidPro: boolean, trialStartMs: number | null = null) {
  setEntitlementsCache(resolveEntitlements({isAuthenticated: true, paidPro, proSource: null, trialStartMs}));
}
beforeEach(() => {
  localStorage.clear();
  setEntitlementsCache(resolveEntitlements({isAuthenticated:false,paidPro:false,proSource:null,trialStartMs:null}));
  localStorage.setItem('flicklet.customLists.v2', JSON.stringify({customLists: [1,2,3].map(id => ({id:String(id),name:`List ${id}`,createdAt:id,itemCount:0})),maxLists:3}));
  window.dispatchEvent(new Event('customLists:updated'));
  vi.spyOn(window, 'prompt').mockReturnValue('Fourth list');
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('reveals Settings creation when Full Access resolves after mount and creates a fourth list', () => {
  render(renderSettingsSection('display', {isMobile:true}));
  expect(screen.queryByRole('button',{name:'Create New List'})).toBeNull();
  act(() => access(true));
  fireEvent.click(screen.getByRole('button',{name:'Create New List'}));
  expect(customListManager.getUserLists().customLists).toHaveLength(4);
  expect(screen.getByText('Fourth list')).toBeVisible();
  expect(JSON.parse(localStorage.getItem('flicklet.customLists.v2')!).customLists).toHaveLength(4);
  expect(window.alert).not.toHaveBeenCalled();
});

it('updates the shared limit for an active trial and restores restrictions when it expires', () => {
  render(renderSettingsSection('display', {}));
  act(() => access(false, Date.now()));
  expect(screen.getByRole('button',{name:'Create New List'})).toBeVisible();
  expect(customListManager.getUserLists().maxLists).toBe(Infinity);
  act(() => access(false, 1));
  expect(getEntitlementsSync().isReadOnlyMode).toBe(true);
  expect(screen.queryByRole('button',{name:'Create New List'})).toBeNull();
  expect(() => customListManager.createList('Blocked')).toThrow(/trial has ended/);
  expect(customListManager.getUserLists().customLists).toHaveLength(3);
});

it('uses unlimited access when purchased status was already resolved before opening Settings', () => {
  access(true);
  render(renderSettingsSection('display', {isMobile:false}));
  expect(screen.getByRole('button',{name:'Create New List'})).toBeVisible();
});
