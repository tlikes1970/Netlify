import {beforeEach,describe,expect,it,vi} from 'vitest';
import {applyCustomOrder,processLibraryItems,reorderedIdentities} from '../libraryView';
import {networkOptions,restoreTabState,saveTabState,validateFilters} from '../tabState';
import type {LibraryEntry} from '../storage';
import type {SortMode} from '@/components/SortDropdown';
const sync=vi.hoisted(()=>vi.fn());
vi.mock('../tabStateSync',()=>({syncTabStateToFirebase:sync}));
const entry=(id:string,title:string,type='tv',networks?:string[],tags?:string[],addedAt=1)=>({id,title,mediaType:type,networks,tags,addedAt,list:'watching'} as LibraryEntry);
const items=[entry('1','Alpha','tv',['Netflix'],['family'],1),entry('2','Beta','movie',undefined,['family'],2),entry('3','Charlie','tv',['HBO','NETFLIX'],['drama'],3),entry('4','Delta','tv',['ABC'],undefined,4),entry('5','Echo','',undefined,undefined,5)];
const view=(type='all',providers:string[]=[],tag:string|null=null,tagSort=false,sort:SortMode='date-oldest',order:string[]=[])=>processLibraryItems(items,{type:type as 'all',providers},tag,tagSort,sort,order).map(x=>x.id);
beforeEach(()=>{localStorage.clear();sync.mockClear();});
describe('Library predicates and sorting',()=>{
 it.each([['all',['1','2','3','4','5']],['movie',['2']],['tv',['1','3','4']]])('Type %s including missing type',(type,expected)=>expect(view(type)).toEqual(expected));
 it.each([[['Netflix'],['1','3']],[['netflix'],['1','3']],[['Netflix','ABC'],['1','3','4']],[['Missing'],[]]])('Network matching %j',(names,expected)=>expect(view('all',names)).toEqual(expected));
 it('ANDs Movie and Network and excludes missing network data',()=>expect(view('movie',['Netflix'])).toEqual([]));
 it.each([['all',[],'family',['1','2']],['tv',[],'family',['1']],['all',['Netflix'],'family',['1']],['tv',['Netflix'],'drama',['3']]])('combines type/network/tag %s %j %s',(type,names,tag,expected)=>expect(view(type,names,tag)).toEqual(expected));
 it('tag selection is case insensitive',()=>expect(view('all',[],'Family')).toEqual(['1','2']));
 it('tag sort respects filters and puts untagged last',()=>expect(view('tv',['Netflix','ABC'],null,true)).toEqual(['3','1','4']));
 it.each([['date-newest',['5','4','3','2','1']],['date-oldest',['1','2','3','4','5']],['alphabetical-az',['1','2','3','4','5']],['alphabetical-za',['5','4','3','2','1']],['streaming-service',['4','3','1','2','5']],['custom',['3','1','2','4','5']]])('sort %s',(sort,expected)=>expect(view('all',[],null,false,sort as SortMode,['3:tv','1:tv'])).toEqual(expected));
 it.each(['date-newest','date-oldest','alphabetical-az','alphabetical-za','streaming-service'] as SortMode[])('ties use string ID for %s',sort=>{
   const pair=[entry('2','Same'),entry('10','same')];
   expect(processLibraryItems(pair,{type:'all',providers:[]},null,false,sort).map(x=>x.id)).toEqual(['10','2']);
 });
 it('missing dates/titles/networks have defined sort positions',()=>{
   const missing=entry('0','');missing.addedAt=undefined as unknown as number;
   expect(processLibraryItems([items[0],missing],{type:'all',providers:[]},null,false,'date-oldest')[0]).toBe(missing);
   expect(processLibraryItems([items[0],missing],{type:'all',providers:[]},null,false,'alphabetical-az')[0]).toBe(missing);
   expect(processLibraryItems([items[0],missing],{type:'all',providers:[]},null,false,'streaming-service')[1]).toBe(missing);
 });
 it('sort does not mutate source data',()=>{const original=JSON.stringify(items);view();view('all',[],null,true);expect(JSON.stringify(items)).toBe(original);});
});
describe('ordering and compatibility',()=>{
 it('applies saved order, ignores removed IDs and appends new items',()=>expect(applyCustomOrder(items,['gone:tv','3:tv','1:tv']).map(x=>x.id)).toEqual(['3','1','2','4','5']));
 it('accepts legacy bare IDs and differentiates movie/TV identities',()=>expect(applyCustomOrder([entry('1','TV'),entry('1','Movie','movie')],['1:movie']).map(x=>x.title)).toEqual(['Movie','TV']));
 it('supports bare-ID legacy order',()=>expect(applyCustomOrder(items,['3','1']).map(x=>x.id)).toEqual(['3','1','2','4','5']));
 it('filtered reorder preserves hidden slots and uses intended identities',()=>expect(reorderedIdentities(items,[],['3:tv','1:tv'],0,1)).toEqual(['1:tv','2:movie','3:tv','4:tv','5:']));
 it('visible reorder changes positions while preserving hidden items',()=>expect(reorderedIdentities(items,[],['1:tv','3:tv'],0,1)).toEqual(['3:tv','2:movie','1:tv','4:tv','5:']));
 it('unfiltered reorder uses displayed identities',()=>expect(reorderedIdentities(items,[],['5:','4:tv','3:tv','2:movie','1:tv'],0,4)).toEqual(['4:tv','3:tv','2:movie','1:tv','5:']));
 it('unrelated saves retain all order IDs even if list has not loaded',async()=>{
  localStorage.setItem('flk.tab.watching.order.custom',JSON.stringify(['removed:tv','3:tv','1:tv']));
  await saveTabState('watching',{sort:'alphabetical-az'});
  await saveTabState('watching',{filter:{type:'tv',providers:['Netflix']}});
  expect(restoreTabState('watching',new Set()).order.ids).toEqual(['removed:tv','3:tv','1:tv']);
  expect(sync.mock.calls.at(-1)?.[1].order.ids).toEqual(['removed:tv','3:tv','1:tv']);
 });
 it.each(['watching','want','watched'])('persists independent state for %s',async tab=>{
  await saveTabState(tab,{sort:'alphabetical-za',filter:{type:'tv',providers:['ABC']},order:{mode:'custom',ids:['4:tv']}});
  expect(restoreTabState(tab)).toMatchObject({sort:'alphabetical-za',filter:{type:'tv',providers:['ABC']},order:{ids:['4:tv']}});
  for(const other of ['watching','want','watched'].filter(x=>x!==tab))expect(restoreTabState(other).sort).toBe('date-newest');
 });
 it('case variants collapse without rewriting stored metadata',()=>{expect(networkOptions(['Netflix','NETFLIX','HBO',''])).toEqual(['HBO','Netflix']);expect(items[2].networks).toEqual(['HBO','NETFLIX']);});
 it('restores casing differences and deduplicates selected networks',()=>expect(validateFilters({type:'tv',providers:['NETFLIX','netflix']},['Netflix'])).toEqual({type:'tv',providers:['Netflix']}));
 it('retains selections while metadata has not loaded',()=>expect(validateFilters({type:'tv',providers:['Netflix']},[]).providers).toEqual(['Netflix']));
});

it('selected tag identity is case-insensitive while Type and Network remain AND predicates',()=>{const items=[{id:'case',mediaType:'tv' as const,title:'Title',list:'watching' as const,addedAt:1,tags:['Family'],networks:['Netflix']}];expect(processLibraryItems(items,{type:'tv',providers:['Netflix']},'FAMILY',false,'date-newest')).toHaveLength(1);expect(processLibraryItems(items,{type:'movie',providers:['Netflix']},'family',false,'date-newest')).toHaveLength(0);expect(processLibraryItems(items,{type:'tv',providers:['Other']},'family',false,'date-newest')).toHaveLength(0);});
