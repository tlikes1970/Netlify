import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { changeLanguage } from '../../lib/language';
import { searchMulti, discoverByGenre, fetchFullMediaMetadata, mapTMDBToMediaItem } from '../api';
import { cachedSearchMulti } from '../cache';
import { smartSearch } from '../smartSearch';
import { fetchEnhancedAutocomplete } from '../enhancedAutocomplete';
import { typoSearch } from '../typoSearch';
import { getCoreTitleDetails, fetchGenreContent, get } from '../../lib/tmdb';
import { getSmartRecommendations, analyzeUserPreferences, clearRecommendationCache } from '../../lib/smartDiscovery';
vi.mock('../../lib/storage', () => ({ Library: { getEntry: () => null, getAll: () => [] } }));
const fetchMock = vi.fn();
const params = (url: string) => new URL(url, 'https://test.local').searchParams;
const response = (data: unknown) => ({ ok: true, headers: new Headers({'content-type':'application/json'}), json: async () => data });
const movie = {id:501,title:'Una película',original_title:'A Movie',media_type:'movie',release_date:'2025-01-02',poster_path:'/movie.jpg',overview:'Sinopsis española',vote_average:8,vote_count:500,popularity:100,genre_ids:[18]};
beforeEach(() => { changeLanguage('en'); fetchMock.mockReset(); clearRecommendationCache(); vi.stubGlobal('fetch', fetchMock); fetchMock.mockImplementation(async () => response({results:[],total_pages:1})); });
afterEach(() => { changeLanguage('en'); vi.unstubAllGlobals(); });
it.each(['en','es'] as const)('multi/movie-TV/People use %s and preserve US', async lang => {
 changeLanguage(lang);for (const mode of ['all','movies-tv','people'] as const) await searchMulti('metadata',1,null,mode);
 for (const [url] of fetchMock.mock.calls) {expect(params(url).get('language')).toBe(lang==='en'?'en-US':'es');expect(params(url).get('region')).toBe('US');}
 expect(fetchMock.mock.calls.map(([url])=>params(url).get('path'))).toEqual(['search/multi','search/multi','search/person']);
});
it.each(['all','movies-tv','people'] as const)('smart %s endpoints and expansions use Spanish', async mode => {
 changeLanguage('es');fetchMock.mockImplementation(async (url:string) => response({results:params(url).get('path')==='search/person'?[{id:21,name:'Penélope Cruz',known_for:[movie]}]:[movie],total_pages:1}));
 const result=await smartSearch('Una película',1,mode);expect(result.items[0]).toMatchObject({id:mode==='people'?21:501,mediaType:mode==='people'?'person':'movie',title:mode==='people'?'Penélope Cruz':'Una película'});
 expect(fetchMock.mock.calls.every(([url])=>params(url).get('language')==='es')).toBe(true);
 if(mode!=='people'){expect(fetchMock.mock.calls.some(([url])=>params(url).get('path')?.endsWith('/similar'))).toBe(true);expect(fetchMock.mock.calls.some(([url])=>params(url).get('path')?.endsWith('/recommendations'))).toBe(true);}
});
it.each(['all','people'] as const)('outer %s cache separates locale and region',async mode=>{
 fetchMock.mockImplementation(async(url:string)=>response({results:[mode==='people'?{id:30,name:'Person',known_for:[{title:params(url).get('language')}]}:{...movie,title:params(url).get('language')}],total_pages:1}));
 const en=await cachedSearchMulti('cache-'+mode,1,null,mode);changeLanguage('es');const es=await cachedSearchMulti('cache-'+mode,1,null,mode);
 expect(en.items[0].id).toBe(es.items[0].id);expect(en.items[0].synopsis===es.items[0].synopsis&&en.items[0].title===es.items[0].title).toBe(false);
 await cachedSearchMulti('cache-'+mode,1,null,mode);expect(fetchMock).toHaveBeenCalledTimes(2);await cachedSearchMulti('cache-'+mode,1,null,mode,{region:'CA'});expect(fetchMock).toHaveBeenCalledTimes(3);
});
it('movie/TV inner caches separate locales',async()=>{
 const query='Locale cache';fetchMock.mockImplementation(async(url:string)=>response({results:params(url).get('path')?.startsWith('search/')?[{...movie,title:query}]:[],total_pages:1}));
 await smartSearch(query);fetchMock.mockClear();changeLanguage('es');await smartSearch(query);
 expect(fetchMock.mock.calls.filter(([url])=>['search/movie','search/tv'].includes(params(url).get('path')!))).toHaveLength(2);expect(fetchMock.mock.calls.every(([url])=>params(url).get('language')==='es')).toBe(true);
});
it.each(['en','es'] as const)('autocomplete retains captured %s locale',async lang=>{
 changeLanguage(lang);fetchMock.mockImplementation(async(url:string)=>response({results:[{id:51,name:'Alias',media_type:'tv',first_air_date:'2001-01-01'}]}));
 expect((await fetchEnhancedAutocomplete('Alias'))[0]).toMatchObject({id:'51',mediaType:'tv',title:'Alias'});expect(fetchMock).toHaveBeenCalledTimes(3);
 expect(fetchMock.mock.calls.every(([url])=>params(url).get('language')===(lang==='en'?'en-US':'es')&&params(url).get('region')==='US')).toBe(true);
});
it('real typo pipeline uses Spanish without changing thresholds',async()=>{
 changeLanguage('es');fetchMock.mockImplementation(async(url:string)=>response({results:params(url).get('query')==='Breakng Bad'?[]:[{id:44,name:'Breaking Bad',media_type:'tv',first_air_date:'2008-01-20'}],total_pages:1}));
 expect((await typoSearch('Breakng Bad',1,(q,p)=>smartSearch(q,p))).correctedQuery).toBe('Breaking Bad');expect(fetchMock.mock.calls.every(([url])=>params(url).get('language')==='es')).toBe(true);
});
it('genre-only Search retains genre identity and US',async()=>{changeLanguage('es');await discoverByGenre(18);for(const [url] of fetchMock.mock.calls){expect(params(url).get('language')).toBe('es');expect(params(url).get('region')).toBe('US');expect(params(url).get('with_genres')).toBe('18');}});
it('localized mapping preserves compound identity and genre IDs',()=>{const es=mapTMDBToMediaItem(movie),en=mapTMDBToMediaItem({...movie,title:'A Movie'});expect(es).toMatchObject({id:501,mediaType:'movie',title:'Una película',synopsis:'Sinopsis española'});expect([es.mediaType,es.id]).toEqual([en.mediaType,en.id]);expect((es as unknown as {genre_ids:number[]}).genre_ids).toEqual([18]);});
it.each([{...movie,title:'  '},{id:501,name:'',original_name:'Original Show',media_type:'tv',first_air_date:'2025-01-01'}])('blank translated title uses original source title',data=>{expect(mapTMDBToMediaItem(data).title).toBe('original_title' in data?'A Movie':'Original Show');});
it('person names remain proper names',()=>{expect(mapTMDBToMediaItem({id:2,name:'Penélope Cruz',known_for:[movie]})).toMatchObject({title:'Penélope Cruz',synopsis:'Una película'});});
it.each(['movie','tv'] as const)('core %s uses Spanish and source company/network names',async kind=>{
 changeLanguage('es');fetchMock.mockResolvedValue(response({id:501,title:'Una película',name:'Una serie',overview:'Sinopsis',networks:[{name:'HBO'}],production_companies:[{name:'Netflix'}],vote_average:8}));
 const metadata=await fetchFullMediaMetadata({id:501,mediaType:kind,title:'Old'});expect(metadata).toMatchObject({title:kind==='movie'?'Una película':'Una serie',synopsis:'Sinopsis',voteAverage:8});expect(kind==='movie'?metadata.productionCompanies:metadata.networks).toEqual([kind==='movie'?'Netflix':'HBO']);expect(params(fetchMock.mock.calls[0][0]).get('language')).toBe('es');expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('blank Spanish overview fetches English once, preserving localized title and numeric fields',async()=>{
 changeLanguage('es');fetchMock.mockImplementation(async(url:string)=>response(params(url).get('language')==='es'?{id:501,title:'Una película',overview:' ',vote_average:8}:{id:501,title:'English',overview:'Fallback synopsis',vote_average:1}));
 expect(await getCoreTitleDetails(501,'movie')).toMatchObject({title:'Una película',overview:'Fallback synopsis',vote_average:8});expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('existing synopsis and original title avoid second request',async()=>{changeLanguage('es');fetchMock.mockResolvedValue(response({id:501,title:' ',original_title:'Source title',overview:''}));expect(await getCoreTitleDetails(501,'movie',{title:'Saved',synopsis:'Useful saved synopsis'})).toMatchObject({title:'Source title',overview:'Useful saved synopsis'});expect(fetchMock).toHaveBeenCalledTimes(1);});
it('missing title without source/existing triggers bounded English fallback',async()=>{changeLanguage('es');fetchMock.mockImplementation(async(url:string)=>response(params(url).get('language')==='es'?{id:501,overview:'Spanish synopsis'}:{id:501,title:'English title',overview:'English'}));expect(await getCoreTitleDetails(501,'movie')).toMatchObject({title:'English title',overview:'Spanish synopsis'});expect(fetchMock).toHaveBeenCalledTimes(2);});
it('failed English fallback retains successful Spanish fields',async()=>{changeLanguage('es');fetchMock.mockImplementation(async(url:string)=>{if(params(url).get('language')==='en-US')throw Error('offline');return response({id:501,title:'Una película',overview:''});});expect(await getCoreTitleDetails(501,'movie')).toMatchObject({title:'Una película'});expect(fetchMock).toHaveBeenCalledTimes(2);});
it('English does not double fetch missing overview',async()=>{fetchMock.mockResolvedValue(response({id:501,title:'Movie'}));expect(await getCoreTitleDetails(501,'movie')).toMatchObject({title:'Movie'});expect(fetchMock).toHaveBeenCalledTimes(1);});
it('Discovery cache separates languages while identity and scores stay equal',async()=>{
 const prefs=analyzeUserPreferences([],[],[],[]),api=vi.fn(async(_path:string,p:{language:string})=>({results:[{...movie,title:p.language,overview:p.language}]}));
 const en=await getSmartRecommendations(prefs,10,api,'local','en-US'),es=await getSmartRecommendations(prefs,10,api,'local','es');await getSmartRecommendations(prefs,10,api,'local','es');
 expect(api).toHaveBeenCalledTimes(12);expect(en[0].item.id).toBe(es[0].item.id);expect(en[0].item.title).toBe('en-US');expect(es[0].item.title).toBe('es');expect(en[0].score).toBe(es[0].score);
});
it.each(['drama','anime','animation'])('For You %s uses Spanish without changing geographic constraints',async genre=>{
 changeLanguage('es');fetchMock.mockResolvedValue(response({results:Array.from({length:12},(_,id)=>({...movie,id}))}));await fetchGenreContent(genre,genre==='anime'?'shonen':'popular');
 expect(fetchMock.mock.calls.length).toBeGreaterThan(0);expect(fetchMock.mock.calls.every(([url])=>params(url).get('language')==='es'&&params(url).get('region')!=='ES')).toBe(true);
 if(genre==='anime')expect(params(fetchMock.mock.calls[0][0]).get('with_origin_country')).toBe('JP');if(genre==='animation')expect(params(fetchMock.mock.calls[0][0]).get('without_origin_country')).toBe('JP');
});
it('generic get does not implicitly localize deferred episode/season callers',async()=>{changeLanguage('es');await get('/tv/501/season/1');expect(params(fetchMock.mock.calls[0][0]).has('language')).toBe(false);});
it.each(['movie','tv'] as const)('saved %s enrichment honors the explicitly captured locale after selection changes',async kind=>{
 changeLanguage('en');
 fetchMock.mockResolvedValue(response({id:501,title:'Español',name:'Español',overview:'Resumen'}));
 const metadata=await fetchFullMediaMetadata({id:501,mediaType:kind,title:'Old'},'es');
 expect(metadata).toMatchObject({title:'Español',synopsis:'Resumen'});
 expect(params(fetchMock.mock.calls[0][0]).get('language')).toBe('es');
});
