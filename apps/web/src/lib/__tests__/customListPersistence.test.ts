import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({uid:'owner' as string|null,allowed:true,write:vi.fn(async()=>undefined)}));
vi.mock('../auth',()=>({authManager:{getCurrentUser:()=>mocks.uid?{uid:mocks.uid}:null}}));
vi.mock('../readOnlyGuard',()=>({guardMutation:()=>mocks.allowed}));
vi.mock('../proConfig',()=>({getMaxCustomLists:()=>10}));
vi.mock('../firebaseBootstrap',()=>({db:{}}));
vi.mock('firebase/firestore',()=>({doc:(_:unknown,...path:string[])=>path.join('/'),setDoc:mocks.write,serverTimestamp:()=>null}));
import { Library } from '../storage';
import { customListManager } from '../customLists';
import { firebaseSyncManager } from '../firebaseSync';
import { beginRestore } from '../restoreBarrier';

beforeEach(()=>{
  vi.useFakeTimers();localStorage.clear();window.dispatchEvent(new Event('library:cleared'));
  mocks.uid='owner';mocks.allowed=true;mocks.write.mockReset().mockResolvedValue(undefined);
  firebaseSyncManager.init();
});
afterEach(async()=>{await firebaseSyncManager.prepareRestore();vi.useRealTimers()});

it('creation independently queues the authoritative cloud snapshot without creating titles',async()=>{
  const list=customListManager.createList('  Family  ');
  expect(list).toMatchObject({name:'Family',isDefault:true,itemCount:0});
  expect(Library.getAll()).toEqual([]);
  expect(JSON.parse(localStorage.getItem('flicklet.customLists.v2')!).customLists[0].id).toBe(list.id);
  await vi.advanceTimersByTimeAsync(1000);
  expect(mocks.write).toHaveBeenCalledTimes(1);
  const payload=mocks.write.mock.calls[0] as unknown as [string,{watchlists:{customLists:unknown[]}}];
  expect(payload[0]).toBe('users/owner');
  expect(payload[1].watchlists.customLists).toContainEqual(expect.objectContaining({id:list.id,name:'Family'}));
});

it('rename independently saves, preserves identity/memberships and survives cloud reload',async()=>{
  const list=customListManager.createList('Original');
  customListManager.setSelectedList(list.id);
  const item={id:'1',mediaType:'movie' as const,title:'Title',userNotes:'Keep'};
  Library.upsert(item,'watching');Library.addToCustomList(item,list.id);
  await vi.advanceTimersByTimeAsync(1000);
  mocks.write.mockClear();
  const before=Library.getAll();const original=customListManager.getListById(list.id)!;
  customListManager.updateList(list.id,{name:' Renamed '});
  expect(Library.getAll()).toEqual(before);
  expect(customListManager.getListById(list.id)).toMatchObject({...original,name:'Renamed'});
  expect(customListManager.getSelectedList()?.id).toBe(list.id);
  await vi.advanceTimersByTimeAsync(1000);
  expect(mocks.write).toHaveBeenCalledTimes(1);
  const [,payload]=mocks.write.mock.calls[0] as unknown as [string,{watchlists:unknown}];
  localStorage.removeItem('flicklet.customLists.v2');
  await (firebaseSyncManager as unknown as {mergeCloudData(data:unknown):Promise<void>}).mergeCloudData(payload.watchlists);
  expect(customListManager.getListById(list.id)).toMatchObject({name:'Renamed',isDefault:true});
  expect(Library.getEntry('1','movie')).toMatchObject({list:'watching',customListIds:[list.id],userNotes:'Keep'});
});

it('rapid create/rename operations coalesce and cloud failure retains the local definition',async()=>{
  mocks.write.mockRejectedValueOnce(new Error('Offline'));
  const list=customListManager.createList('First');
  customListManager.updateList(list.id,{name:'Second'});
  customListManager.updateList(list.id,{name:'Latest'});
  await vi.advanceTimersByTimeAsync(1000);
  expect(mocks.write).toHaveBeenCalledTimes(1);
  const [,payload]=mocks.write.mock.calls[0] as unknown as [string,{watchlists:{customLists:{name:string}[]}}];
  expect(payload.watchlists.customLists[0].name).toBe('Latest');
  expect(customListManager.getListById(list.id)?.name).toBe('Latest');
  expect(JSON.parse(localStorage.getItem('flicklet.customLists.v2')!).customLists[0].name).toBe('Latest');
});

it('signed-out creation and rename remain local-only',async()=>{
  mocks.uid=null;const list=customListManager.createList('Local');customListManager.updateList(list.id,{name:'Local renamed'});
  await vi.advanceTimersByTimeAsync(1000);expect(mocks.write).not.toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem('flicklet.customLists.v2')!).customLists[0].name).toBe('Local renamed');
});

it('access and restore guards prevent definition changes and cloud writes',async()=>{
  mocks.allowed=false;expect(()=>customListManager.createList('Blocked')).toThrow();
  mocks.allowed=true;const release=await beginRestore();
  Library.syncCustomListDefinitions('customListCreate');
  await vi.advanceTimersByTimeAsync(1000);expect(mocks.write).not.toHaveBeenCalled();release();
});
