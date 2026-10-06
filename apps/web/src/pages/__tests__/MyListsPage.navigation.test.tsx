import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyListsPage from '../MyListsPage';
import { customListManager } from '@/lib/customLists';
import { shareListWithFallback } from '@/lib/shareLinks';
import { Library } from '@/lib/storage';

vi.mock('@/lib/proConfig', () => ({ getMaxCustomLists: () => 3 }));
vi.mock('@/lib/auth', () => ({authManager: {getCurrentUser: () => null}}));
vi.mock('@/lib/readOnlyGuard', () => ({guardMutation: () => true}));
vi.mock('@/lib/settings', () => ({useSettings: () => ({personality:'Zen'}), getPersonalityText: () => 'Empty list', DEFAULT_PERSONALITY:'Zen'}));
vi.mock('@/lib/language', async (importOriginal) => ({...await importOriginal<typeof import("@/lib/language")>(),useTranslations: () => ({sharingAction:"Share",createNewList:"Create New List",rename:"Rename",delete:"Delete"})}));
vi.mock('@/lib/shareLinks', () => ({shareListWithFallback: vi.fn()}));
vi.mock('@/state/actions', () => ({getToastCallback: () => vi.fn()}));
vi.mock('@/components/cards/TabCard', () => ({default: ({item}: {item:{title:string}}) => <article>{item.title}</article>}));
const a = {id:'a',name:'List A',itemCount:1,createdAt:1,isDefault:true};
const b = {id:'b',name:'List B',itemCount:1,createdAt:2};
function load(lists = [a,b], selectedListId?: string) {
  localStorage.setItem('flicklet.customLists.v2',JSON.stringify({customLists:lists,selectedListId,maxLists:3}));
  window.dispatchEvent(new Event('customLists:updated'));
}
beforeEach(() => {
  localStorage.clear(); window.dispatchEvent(new Event('library:cleared')); load();
  Library.upsert({id:'1',mediaType:'movie',title:'Only A'},'watching');
  Library.addToCustomList({id:'1',mediaType:'movie',title:'Only A'},'a');
  Library.upsert({id:'2',mediaType:'movie',title:'Only B'},'watched');
  Library.addToCustomList({id:'2',mediaType:'movie',title:'Only B'},'b');
  vi.spyOn(window,'confirm').mockReturnValue(true);
  vi.spyOn(window,'prompt').mockReturnValue(null);
});
afterEach(() => vi.restoreAllMocks());
const select = (name:string) => fireEvent.click(screen.getByRole('button',{name:new RegExp(`^${name} \\(`)}));
describe('Custom Lists navigation', () => {
  it('opens the saved selection rather than replacing it with the default', () => {
    load([a,b],'b'); render(<MyListsPage/>);
    expect(screen.getByRole('heading',{level:2})).toHaveTextContent('List B');
    expect(screen.getByRole('article')).toHaveTextContent('Only B');
  });
  it('switches repeatedly with correct active identity and no stale cards', () => {
    render(<MyListsPage/>);
    for(const name of ['List B','List A','List B']) {
      select(name);
      expect(screen.getByRole('heading',{level:2})).toHaveTextContent(name);
      expect(screen.getByRole('button',{name:new RegExp(`^${name} \\(`)})).toHaveAttribute('aria-pressed','true');
      expect(screen.getByRole('article')).toHaveTextContent(name === 'List A' ? 'Only A' : 'Only B');
    }
    expect(customListManager.getSelectedList()?.id).toBe('b');
  });
  it('follows selection updates through the current persisted definitions', () => {
    render(<MyListsPage/>);act(() => load([a,b],'b'));
    expect(screen.getByRole('heading',{level:2})).toHaveTextContent('List B');expect(screen.getByRole('article')).toHaveTextContent('Only B');
  });
  it('retains selection on leaving and re-entering the feature', () => {
    const first=render(<MyListsPage/>);select('List B');first.unmount();render(<MyListsPage/>);
    expect(screen.getByRole('heading',{level:2})).toHaveTextContent('List B');
  });
  it('handles a stored or live specific-list link and ignores invalid ids', () => {
    localStorage.setItem('flicklet:shareListId','b');render(<MyListsPage/>);
    expect(screen.getByRole('heading',{level:2})).toHaveTextContent('List B');
    expect(localStorage.getItem('flicklet:shareListId')).toBeNull();
    act(() => window.dispatchEvent(new CustomEvent('flicklet:selectList',{detail:{listId:'missing'}})));
    expect(screen.getByRole('heading',{level:2})).toHaveTextContent('List B');
    act(() => window.dispatchEvent(new CustomEvent('flicklet:selectList',{detail:{listId:'a'}})));
    expect(screen.getByRole('article')).toHaveTextContent('Only A');
  });
  it('uses the existing Back action', () => {
    const back=vi.fn();render(<MyListsPage onBack={back}/>);fireEvent.click(screen.getByRole('button',{name:'← Back'}));expect(back).toHaveBeenCalledOnce();
  });
  it('keeps one-list selection usable', () => {
    load([a]);render(<MyListsPage/>);expect(screen.getByRole('heading',{level:2})).toHaveTextContent('List A');expect(screen.getByRole('article')).toHaveTextContent('Only A');
  });
  it('provides creation from the no-list state and Cancel leaves it unchanged', () => {
    load([]);render(<MyListsPage/>);fireEvent.click(screen.getByRole('button',{name:'Create Your First List'}));expect(customListManager.getUserLists().customLists).toHaveLength(0);expect(screen.getByText('No lists created yet')).toBeInTheDocument();
  });
  it('selects and persists a newly created list immediately', () => {
    load([]);render(<MyListsPage/>);vi.mocked(window.prompt).mockReturnValue('New list');fireEvent.click(screen.getByRole('button',{name:'Create Your First List'}));
    expect(screen.getByRole('heading',{level:2})).toHaveTextContent('New list');expect(customListManager.getSelectedList()?.name).toBe('New list');expect(screen.getByText('Empty list')).toBeInTheDocument();
  });
  it('preserves blank-name and limit handling', () => {
    render(<MyListsPage/>);vi.mocked(window.prompt).mockReturnValue('  ');fireEvent.click(screen.getByRole('button',{name:'Create New List'}));expect(customListManager.getUserLists().customLists).toHaveLength(2);
    act(() => {customListManager.createList('Third')});expect(screen.queryByRole('button',{name:'Create New List'})).toBeNull();
  });
  it('deletes the selected list and selects another without removing Library data', () => {
    Library.addToCustomList({id:'1',mediaType:'movie',title:'Only A'},'b');render(<MyListsPage/>);fireEvent.click(screen.getByRole('button',{name:'Delete List A'}));
    expect(screen.getByRole('heading',{level:2})).toHaveTextContent('List B');expect(customListManager.getSelectedList()?.id).toBe('b');
    expect(Library.getEntry('1','movie')).toMatchObject({list:'watching',customListIds:['b']});expect(Library.getByList('custom:b')).toHaveLength(2);
  });
  it('recovers when the active list is invalidated externally', () => {
    load([a,b],'b');render(<MyListsPage/>);act(() => load([a]));expect(screen.getByRole('heading',{level:2})).toHaveTextContent('List A');
    act(() => load([]));expect(screen.getByText('No lists created yet')).toBeInTheDocument();expect(screen.queryByRole('article')).toBeNull();
  });
  it('updates renamed list identity and preserves long names', () => {
    render(<MyListsPage/>);const name='A very long named list '.repeat(6);vi.mocked(window.prompt).mockReturnValue(name);fireEvent.click(screen.getByRole('button',{name:'Rename List A'}));expect(screen.getByRole('heading',{level:2})).toHaveTextContent(name.trim());
  });
  it('supports local signed-out lists and clears them when the auth privacy event occurs', () => {
    render(<MyListsPage/>);expect(screen.getByRole('article')).toBeInTheDocument();act(() => window.dispatchEvent(new Event('library:cleared')));expect(screen.getByText('No lists created yet')).toBeInTheDocument();
    act(() => load([b]));expect(screen.getByRole('heading',{level:2})).toHaveTextContent('List B');
  });
  it('keeps snapshot selection, names and counts independent of manager mutations', () => {
    const snapshot=customListManager.getUserLists();const original={...snapshot.customLists[0]};customListManager.updateList('a',{name:'Renamed'});customListManager.updateItemCount('a',1);customListManager.setSelectedList('b');expect(snapshot.customLists[0]).toEqual(original);expect(snapshot.selectedListId).toBeUndefined();
  });
});

it('header shares the entire list through the privacy-safe helper without altering content or memberships', async () => {
  vi.mocked(shareListWithFallback).mockClear();
  Library.upsert({id:'1',mediaType:'movie',title:'Only A',voteAverage:8,userRating:2,userNotes:'private',tags:['private']},'watching');
  const before = JSON.stringify(Library.getAll());
  const listsBefore = JSON.stringify(customListManager.getUserLists());
  render(<MyListsPage/>);
  fireEvent.click(screen.getByRole('button',{name:'🔗 Share'}));
  expect(shareListWithFallback).toHaveBeenCalledOnce();
  expect(vi.mocked(shareListWithFallback).mock.calls[0][0]).toEqual({name:'List A'});
  expect(vi.mocked(shareListWithFallback).mock.calls[0][1]).toEqual([{title:'Only A',mediaType:'movie',voteAverage:8}]);
  expect(JSON.stringify(Library.getAll())).toBe(before);
  expect(JSON.stringify(customListManager.getUserLists())).toBe(listsBefore);
});

function phoneViewport() { vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}))); }
it('phone uses one selected-list/count toolbar and switches canonical membership',()=>{
 phoneViewport();try{
 const {container}=render(<MyListsPage onBack={vi.fn()}/>);expect(container.querySelector('.custom-list-phone-toolbar')).not.toBeNull();expect(screen.queryByRole('heading')).toBeNull();expect(screen.queryByRole('button',{name:/^List A/})).toBeNull();
 const selector=screen.getByRole('combobox',{name:'Select a custom list'});expect(selector).toHaveValue('a');expect(screen.getByRole('option',{name:'List A (1)'})).toBeInTheDocument();fireEvent.change(selector,{target:{value:'b'}});expect(screen.getByRole('article')).toHaveTextContent('Only B');expect(customListManager.getSelectedList()?.id).toBe('b');
 }finally{vi.unstubAllGlobals()}
});
it('phone create reuses manager and selects new list',()=>{
 phoneViewport();try{vi.mocked(window.prompt).mockReturnValue('New list');render(<MyListsPage/>);fireEvent.click(screen.getByRole('button',{name:'Create New List'}));expect(customListManager.getSelectedList()?.name).toBe('New list');expect(screen.getByRole('combobox')).toHaveValue(customListManager.getSelectedList()!.id);}finally{vi.unstubAllGlobals()}
});
it.each(['Rename','Share','Delete'])('phone overflow retains %s action and existing confirmation',async action=>{
 phoneViewport();try{
 vi.mocked(shareListWithFallback).mockClear();vi.mocked(window.prompt).mockReturnValue('Renamed');render(<MyListsPage/>);fireEvent.click(screen.getByRole('button',{name:'List actions'}));fireEvent.click(screen.getByRole('button',{name:action,exact:true}));expect(screen.queryByRole('dialog')).toBeNull();
 if(action==='Rename')expect(customListManager.getListById('a')?.name).toBe('Renamed');
 if(action==='Share')expect(shareListWithFallback).toHaveBeenCalledOnce();
 if(action==='Delete'){expect(window.confirm).toHaveBeenCalledWith('Delete “List A”? Titles will stay in your Library.');expect(customListManager.getListById('a')).toBeNull();expect(Library.getEntry('1','movie')).toBeDefined();}
 }finally{vi.unstubAllGlobals()}
});
it('phone menu cancellation and Escape preserve list data',()=>{
 phoneViewport();try{vi.mocked(window.confirm).mockReturnValue(false);render(<MyListsPage/>);screen.getByRole('button',{name:'List actions'}).focus();fireEvent.click(screen.getByRole('button',{name:'List actions'}));fireEvent.keyDown(document,{key:'Escape'});expect(screen.getByRole('button',{name:'List actions'})).toHaveFocus();fireEvent.click(screen.getByRole('button',{name:'List actions'}));fireEvent.click(screen.getByRole('button',{name:'Delete',exact:true}));expect(customListManager.getListById('a')).toBeDefined();}finally{vi.unstubAllGlobals()}
});