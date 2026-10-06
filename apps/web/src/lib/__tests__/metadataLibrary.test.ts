import { backfillSynopsisForItems } from '../../utils/backfillSynopsis';
import { backfillShowStatus } from '../../utils/backfillShowStatus';
import * as tvMetadata from '../../tmdb/tv';
import { waitFor } from '@testing-library/react';
import * as metadataApi from '../../search/api';
import { mountSavedMetadataLanguageRefresh } from '../savedMetadataLanguage';
import { changeLanguage } from '../language';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { Library, flushPendingSaves } from '../storage';
import { mapTMDBToMediaItem } from '../../search/api';
vi.mock('../auth',()=>({authManager:{getCurrentUser:()=>access.uid ? {uid:access.uid} : null}}));
const access = vi.hoisted(() => ({ blocked: false, uid: null as string | null }));
vi.mock('../readOnlyGuard',()=>({guardMutation:()=>!access.blocked,isMutationBlocked:()=>access.blocked}));
vi.mock('../customLists',()=>({customListManager:{updateItemCount:vi.fn()}}));
let stop: (()=>void) | undefined;
beforeEach(()=>{changeLanguage('en');access.blocked=false;access.uid=null;localStorage.clear();window.dispatchEvent(new Event('library:cleared'));});
afterEach(()=>{stop?.();stop=undefined;vi.restoreAllMocks();changeLanguage('en');flushPendingSaves();});
it('localized normal enrichment updates one canonical title and preserves all user metadata',()=>{
 Library.upsert({id:7,mediaType:'tv',title:'English title',synopsis:'Existing',userRating:4,userNotes:'Keep note',tags:['Family'],isFavorite:true},'watching');Library.addToCustomList({id:7,mediaType:'tv',title:'English title'},'family');
 const before=Library.getEntry(7,'tv')!;
 Library.upsert(mapTMDBToMediaItem({id:7,media_type:'tv',name:'Título español',overview:'Sinopsis',first_air_date:'2025-01-01'}),'watching');
 const after=Library.getEntry(7,'tv')!;expect(Library.getAll()).toHaveLength(1);expect(after).toMatchObject({title:'Título español',synopsis:'Sinopsis',list:before.list,userRating:4,userNotes:'Keep note',tags:['Family'],isFavorite:true,addedAt:before.addedAt,customListIds:before.customListIds});
});
it('blank API synopsis cannot erase useful saved synopsis',()=>{Library.upsert({id:7,mediaType:'movie',title:'Movie',synopsis:'Useful'},'watched');Library.upsert(mapTMDBToMediaItem({id:7,media_type:'movie',title:'Película',overview:''}),'watched');expect(Library.getEntry(7,'movie')).toMatchObject({title:'Película',synopsis:'Useful',list:'watched'});});


it.each(['watching','wishlist','watched','not','custom:family'] as const)('provider merge preserves canonical identity and user fields in %s', list => {
  Library.upsert({id:7,mediaType:'tv',title:'Old',userRating:4,userNotes:'Note',tags:['Family'],isFavorite:true},list);
  Library.addToCustomList({id:7,mediaType:'tv',title:'Old'},'family');
  const before={...Library.getEntry(7,'tv')!};
  expect(Library.updateMetadata(7,'tv',{title:'Nuevo',synopsis:'Resumen',userRating:0,userNotes:'Bad',tags:[],isFavorite:false,id:999})).toBe(true);
  expect(Library.getEntry(7,'tv')).toEqual({...before,title:'Nuevo',synopsis:'Resumen'});
  expect(Library.getAll()).toHaveLength(1);
});
it.each(['', '  ', '7', 'Untitled', null, undefined])('invalid title %s never erases saved title', title => {
  Library.upsert({id:7,mediaType:'movie',title:'Valid'},'watched');
  Library.updateMetadata(7,'movie',{title} as any);
  expect(Library.getEntry(7,'movie')?.title).toBe('Valid');
});
it('does not recreate a removed canonical item',()=>{
 expect(Library.updateMetadata(7,'tv',{title:'Missing'})).toBe(false);
 expect(Library.getAll()).toEqual([]);
});
it('read-only metadata refresh leaves local state unchanged without a mutation',()=>{
 Library.upsert({id:7,mediaType:'tv',title:'Valid'},'watching');
 access.blocked=true;
 expect(Library.updateMetadata(7,'tv',{title:'Nuevo'})).toBe(false);
 expect(Library.getEntry(7,'tv')?.title).toBe('Valid');
});
it.each([null,'account'])('metadata follows existing local/signed-in persistence for %s',uid=>{
 access.uid=uid;
 Library.upsert({id:7,mediaType:'tv',title:'Valid'},'watching');
 const listener=vi.fn();window.addEventListener('library:changed',listener);
 Library.updateMetadata(7,'tv',{title:'Nuevo'});flushPendingSaves();
 expect(JSON.parse(localStorage.getItem('flicklet.library.v2')!)['tv:7'].title).toBe('Nuevo');
 expect(listener).toHaveBeenCalledTimes(uid?1:0);
 window.removeEventListener('library:changed',listener);
});

const seed = (id=7) => Library.upsert({id,mediaType:'tv',title:'English',synopsis:'English synopsis',userRating:4,userNotes:'Note',tags:['Family'],isFavorite:true},'watching');
it('EN → ES → EN refreshes title/synopsis without changing user data or separate progress/reminders',async()=>{
 seed();Library.updateRating(7,'tv',4.5);
 Library.addToCustomList({id:7,mediaType:'tv',title:'English'},'family');
 Library.addToCustomList({id:7,mediaType:'tv',title:'English'},'favorites');
 localStorage.setItem('episode-progress-7','{"S1E2":true}');localStorage.setItem('flicklet.series-reminders.v1','{"7":{"enabled":true}}');
 const before={...Library.getEntry(7,'tv')!};
 const fetch=vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockImplementation(async(_item,language)=>({title:language==='es'?'Español':'English',synopsis:language==='es'?'Resumen':'English synopsis'}));
 stop=mountSavedMetadataLanguageRefresh();expect(fetch).not.toHaveBeenCalled();
 changeLanguage('es');await waitFor(()=>expect(Library.getEntry(7,'tv')).toEqual({...before,title:'Español',synopsis:'Resumen'}));
 changeLanguage('en');await waitFor(()=>expect(Library.getEntry(7,'tv')).toEqual(before));
 expect(fetch).toHaveBeenCalledTimes(2);expect(Library.getAll()).toHaveLength(1);
 expect(localStorage.getItem('episode-progress-7')).toBe('{"S1E2":true}');expect(localStorage.getItem('flicklet.series-reminders.v1')).toBe('{"7":{"enabled":true}}');
});
it('repeated selection of the same language does not refresh',async()=>{
 seed();const fetch=vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockResolvedValue({title:'Español'});
 stop=mountSavedMetadataLanguageRefresh();changeLanguage('en');expect(fetch).not.toHaveBeenCalled();
 changeLanguage('es');await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
 changeLanguage('es');await new Promise(resolve=>setTimeout(resolve,20));expect(fetch).toHaveBeenCalledTimes(1);
});
it('an old language response cannot overwrite the newest language',async()=>{
 seed();let finish!:(value:any)=>void;
 const fetch=vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockImplementation(async(_item,language)=>language==='es'?new Promise(resolve=>{finish=resolve}):{title:'Latest English'});
 stop=mountSavedMetadataLanguageRefresh();changeLanguage('es');await waitFor(()=>expect(finish).toBeTypeOf('function'));
 changeLanguage('en');finish({title:'Stale Spanish'});
 await waitFor(()=>expect(Library.getEntry(7,'tv')?.title).toBe('Latest English'));
 expect(fetch).toHaveBeenCalledTimes(2);
});
it.each([true,false])('fetch failure or empty result preserves metadata (failure=%s)',async(failure)=>{
 seed();const before={...Library.getEntry(7,'tv')!};
 const fetch=vi.spyOn(metadataApi,'fetchFullMediaMetadata');if(failure)fetch.mockRejectedValue(new Error('offline'));else fetch.mockResolvedValue({});
 stop=mountSavedMetadataLanguageRefresh();changeLanguage('es');await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
 await new Promise(resolve=>setTimeout(resolve,10));expect(Library.getEntry(7,'tv')).toEqual(before);
});
it('valid original/provider fallback title is retained',async()=>{
 seed();vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockResolvedValue({title:'Original title',synopsis:'Resumen'});
 stop=mountSavedMetadataLanguageRefresh();changeLanguage('es');await waitFor(()=>expect(Library.getEntry(7,'tv')?.title).toBe('Original title'));
});
it('read-only skips requests and quiet metadata mutation',()=>{
 seed();access.blocked=true;const fetch=vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockResolvedValue({title:'Changed'});
 stop=mountSavedMetadataLanguageRefresh();changeLanguage('es');expect(fetch).not.toHaveBeenCalled();expect(Library.getEntry(7,'tv')?.title).toBe('English');
});
it('expiration while a request is active prevents its write',async()=>{
 seed();let finish!:(value:any)=>void;vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
 stop=mountSavedMetadataLanguageRefresh();changeLanguage('es');await waitFor(()=>expect(finish).toBeTypeOf('function'));
 access.blocked=true;finish({title:'Blocked'});await new Promise(resolve=>setTimeout(resolve,10));expect(Library.getEntry(7,'tv')?.title).toBe('English');
});
it('account changes and library clearing invalidate in-flight results',async()=>{
 seed();access.uid='A';let finish!:(value:any)=>void;vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
 stop=mountSavedMetadataLanguageRefresh();changeLanguage('es');await waitFor(()=>expect(finish).toBeTypeOf('function'));
 access.uid='B';window.dispatchEvent(new Event('library:cleared'));seed();finish({title:'Account A'});
 await new Promise(resolve=>setTimeout(resolve,10));expect(Library.getEntry(7,'tv')?.title).toBe('English');
});
it('concurrent user edits remain intact when a response arrives',async()=>{
 seed();let finish!:(value:any)=>void;vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
 stop=mountSavedMetadataLanguageRefresh();changeLanguage('es');await waitFor(()=>expect(finish).toBeTypeOf('function'));
 Library.upsert({...Library.getEntry(7,'tv')!},'watched');
 finish({title:'Español'});await waitFor(()=>expect(Library.getEntry(7,'tv')?.title).toBe('Español'));
 expect(Library.getEntry(7,'tv')?.list).toBe('watched');
});
it('bounds provider concurrency and fetches each canonical item once',async()=>{
 for(let id=1;id<=10;id++)seed(id);
 let active=0,max=0;const fetch=vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockImplementation(async item=>{
 active++;max=Math.max(max,active);await new Promise(resolve=>setTimeout(resolve,5));active--;return{title:`Localized ${item.id}`};
 });
 stop=mountSavedMetadataLanguageRefresh();changeLanguage('es');await waitFor(()=>expect(Library.getEntry(10,'tv')?.title).toBe('Localized 10'));
 expect(max).toBe(3);expect(fetch).toHaveBeenCalledTimes(10);
});
it('unmount invalidates a pending response',async()=>{
 seed();let finish!:(value:any)=>void;vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
 stop=mountSavedMetadataLanguageRefresh();changeLanguage('es');await waitFor(()=>expect(finish).toBeTypeOf('function'));stop();
 finish({title:'Obsolete'});await new Promise(resolve=>setTimeout(resolve,10));expect(Library.getEntry(7,'tv')?.title).toBe('English');
});

it('synopsis backfill cannot undo a later metadata/status update',async()=>{
 Library.upsert({id:987,mediaType:'tv',title:'Old'},'watching');
 let finish!:(value:any)=>void;vi.spyOn(metadataApi,'fetchFullMediaMetadata').mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
 const work=backfillSynopsisForItems([Library.getEntry(987,'tv')!]);
 await waitFor(()=>expect(finish).toBeTypeOf('function'));
 Library.upsert({...Library.getEntry(987,'tv')!,title:'Latest',synopsis:'Latest synopsis'},'watched');
 finish({synopsis:'Old synopsis'});await work;
 expect(Library.getEntry(987,'tv')).toMatchObject({title:'Latest',synopsis:'Latest synopsis',list:'watched'});
});
it('status backfill merges only status into the latest canonical item',async()=>{
 Library.upsert({id:988,mediaType:'tv',title:'Old'},'watching');
 let finish!:(value:any)=>void;vi.spyOn(tvMetadata,'fetchShowStatus').mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
 const work=backfillShowStatus();await waitFor(()=>expect(finish).toBeTypeOf('function'));
 Library.upsert({...Library.getEntry(988,'tv')!,title:'Latest'},'watched');
 finish({status:'Ended',lastAirDate:'2025-01-01'});await work;
 expect(Library.getEntry(988,'tv')).toMatchObject({title:'Latest',list:'watched',showStatus:'Ended',lastAirDate:'2025-01-01'});
});

it('a genuine numeric movie title remains valid when it is not the media ID',()=>{
 Library.upsert({id:530915,mediaType:'movie',title:'Old'},'watched');
 Library.updateMetadata(530915,'movie',{title:'1917'});
 expect(Library.getEntry(530915,'movie')?.title).toBe('1917');
});
