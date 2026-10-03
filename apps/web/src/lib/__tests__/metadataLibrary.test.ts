import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { Library, flushPendingSaves } from '../storage';
import { mapTMDBToMediaItem } from '../../search/api';
vi.mock('../auth',()=>({authManager:{getCurrentUser:()=>null}}));
vi.mock('../readOnlyGuard',()=>({guardMutation:()=>true}));
vi.mock('../customLists',()=>({customListManager:{updateItemCount:vi.fn()}}));
beforeEach(()=>{localStorage.clear();window.dispatchEvent(new Event('library:cleared'));});
afterEach(()=>flushPendingSaves());
it('localized normal enrichment updates one canonical title and preserves all user metadata',()=>{
 Library.upsert({id:7,mediaType:'tv',title:'English title',synopsis:'Existing',userRating:4,userNotes:'Keep note',tags:['Family'],isFavorite:true},'watching');Library.addToCustomList({id:7,mediaType:'tv',title:'English title'},'family');
 const before=Library.getEntry(7,'tv')!;
 Library.upsert(mapTMDBToMediaItem({id:7,media_type:'tv',name:'Título español',overview:'Sinopsis',first_air_date:'2025-01-01'}),'watching');
 const after=Library.getEntry(7,'tv')!;expect(Library.getAll()).toHaveLength(1);expect(after).toMatchObject({title:'Título español',synopsis:'Sinopsis',list:before.list,userRating:4,userNotes:'Keep note',tags:['Family'],isFavorite:true,addedAt:before.addedAt,customListIds:before.customListIds});
});
it('blank API synopsis cannot erase useful saved synopsis',()=>{Library.upsert({id:7,mediaType:'movie',title:'Movie',synopsis:'Useful'},'watched');Library.upsert(mapTMDBToMediaItem({id:7,media_type:'movie',title:'Película',overview:''}),'watched');expect(Library.getEntry(7,'movie')).toMatchObject({title:'Película',synopsis:'Useful',list:'watched'});});
