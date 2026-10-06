import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { languageManager } from '../language';
import { PERSONALITY_SPANISH } from '../../data/flickletPersonalitySpanish';
import { getLinesForContext, personalityTierFromLevel } from '../../data/flickletPersonalityPhase2';
import { getFlickletMarqueeMessages, localizedPersonalityLine } from '../flickletPersonality';
import { getPersonalityText, PERSONALITY_LIST, PERSONALITIES } from '../../data/personalities';
import { getInsightsForTitle, localizeInsightItems } from '../insights/insightsStore';
import translations from '../../data/insightTranslations.json';
import { extrasProvider } from '../extras/extrasProvider';
import { videoQueryTerms, EXTRAS_KEYWORDS } from '../extras/config';
beforeEach(()=>languageManager.setLanguage('en'));
afterEach(()=>{languageManager.setLanguage('en');vi.restoreAllMocks()});
it('all 959 stable message IDs have Spanish equivalents without editing English pools',()=>{
 expect(Object.keys(PERSONALITY_SPANISH)).toHaveLength(959);
 for(const level of [1,2,3] as const){
 const pool=getLinesForContext('Home Marquee - Rotating',personalityTierFromLevel(level));const en=getFlickletMarqueeMessages(level);expect(en).toEqual(pool.map(line=>line.text));languageManager.setLanguage('es');expect(getFlickletMarqueeMessages(level)).toEqual(pool.map(line=>PERSONALITY_SPANISH[line.id]));expect(pool.map(line=>localizedPersonalityLine(line))).toEqual(getFlickletMarqueeMessages(level));languageManager.setLanguage('en');expect(getFlickletMarqueeMessages(level)).toEqual(en);
 }
});
it('greeting variant index remains session-stable across languages and preserves user name',()=>{
 for(const {name} of PERSONALITY_LIST){const en=getPersonalityText(name,'welcome',{username:'$& User'});languageManager.setLanguage('es');const es=getPersonalityText(name,'welcome',{username:'$& User'});expect(es).toContain('$& User');expect(es).not.toBe(en);languageManager.setLanguage('en');expect(getPersonalityText(name,'welcome',{username:'$& User'})).toBe(en)}
});
it('known deterministic insights localize; unknown provider/manual text remains source text',()=>{
 const [en,es]=Object.entries(translations)[0];const items=[{id:'stable',type:'style' as const,text:en},{id:'manual',type:'other' as const,text:'Source proper names untouched'}];expect(localizeInsightItems(items,'es')).toMatchObject([{id:'stable',text:es,textLanguage:'es'},{id:'manual',text:'Source proper names untouched',textLanguage:undefined}]);expect(items[0].text).toBe(en);
});
it('English and Spanish insight caches stay separate through live switch and reuse',async()=>{
 const en=await getInsightsForTitle(2316,'en');const es=await getInsightsForTitle(2316,'es');expect(es!.items[0].id).toBe(en!.items[0].id);expect(es!.items[0].text).not.toBe(en!.items[0].text);expect((await getInsightsForTitle(2316,'en'))!.items[0].text).toBe(en!.items[0].text);const cache=JSON.parse(localStorage.getItem('flicklet.insights.v1')!);expect(cache['en:2316']).toBeDefined();expect(cache['es:2316']).toBeDefined();
});
it('YouTube query terms retain English behavior and preserve proper-name query separately',()=>{expect(videoQueryTerms(EXTRAS_KEYWORDS,'en-US')).toEqual(EXTRAS_KEYWORDS);expect(videoQueryTerms(EXTRAS_KEYWORDS,'es')).toContain('detrás de cámaras')});
const provider=extrasProvider as unknown as {fetchTMDBVideos:(id:number,category:string,kind:string)=>Promise<any>;searchYouTube:(query:string,words:string[],category:string)=>Promise<any>};
it('TMDB prefers Spanish once, keeps provider title, and only falls back when useful results are absent',async()=>{
 languageManager.setLanguage('es');const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(JSON.stringify({results:[{id:'v',name:'Provider título intacto',site:'YouTube',key:'v',type:'Featurette',published_at:'2020-01-01'}]}),{headers:{'content-type':'application/json'}}));const result=await provider.fetchTMDBVideos(8,'extras','tv');expect(result.videos[0].title).toBe('Provider título intacto');expect(fetch).toHaveBeenCalledTimes(1);expect(String(fetch.mock.calls[0][0])).toContain('language=es');
 fetch.mockReset().mockResolvedValueOnce(new Response(JSON.stringify({results:[]}),{headers:{'content-type':'application/json'}})).mockResolvedValueOnce(new Response(JSON.stringify({results:[{id:'v',name:'English source',site:'YouTube',key:'v',type:'Featurette',published_at:'2020-01-01'}]}),{headers:{'content-type':'application/json'}}));expect((await provider.fetchTMDBVideos(8,'extras','tv')).videos[0].title).toBe('English source');expect(fetch).toHaveBeenCalledTimes(2);expect(String(fetch.mock.calls[1][0])).toContain('language=en-US');
});
it('YouTube uses Spanish wording/relevance and bounded English fallback without translating returned titles',async()=>{
 languageManager.setLanguage('es');const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(JSON.stringify({items:[]}))).mockResolvedValueOnce(new Response(JSON.stringify({items:[{id:{videoId:'v'},snippet:{title:'Provider title',channelTitle:'Netflix',publishedAt:'2020-01-01',thumbnails:{high:{url:'thumb'}}}}]})));const result=await provider.searchYouTube('User Title',EXTRAS_KEYWORDS,'extras');expect(result.videos[0].title).toBe('Provider title');const first=new URL(String(fetch.mock.calls[0][0]));expect(first.searchParams.get('q')).toContain('User Title');expect(first.searchParams.get('q')).toContain('detrás de cámaras');expect(first.searchParams.get('relevanceLanguage')).toBe('es');expect(new URL(String(fetch.mock.calls[1][0])).searchParams.get('q')).toBe('User Title '+EXTRAS_KEYWORDS.join(' OR '));expect(fetch).toHaveBeenCalledTimes(2);
});

it('every active legacy variant has a same-position Spanish counterpart',async()=>{
 const {LEGACY_PERSONALITY_SPANISH}=await import('../../data/legacyPersonalitySpanish');
 for(const {name} of PERSONALITY_LIST)for(const key of ['welcome','searchLoading','emptyWishlist','itemAdded','itemRemoved','errorGeneric'] as const){expect(LEGACY_PERSONALITY_SPANISH[name][key]).toHaveLength(PERSONALITIES[name][key].length);const en=getPersonalityText(name,key);languageManager.setLanguage('es');expect(getPersonalityText(name,key)).not.toBe(en);languageManager.setLanguage('en');expect(getPersonalityText(name,key)).toBe(en)}
});

it('legacy cached manual content is retained rather than discarded by locale keys',async()=>{
 localStorage.removeItem('flicklet.insights.v1');localStorage.setItem('flicklet.goofs.v1',JSON.stringify({'999':{tmdbId:999,source:'manual',items:[{id:'manual',type:'other',text:'User-maintained source text'}]}}));vi.resetModules();const {getInsightsForTitle:read}=await import('../insights/insightsStore');expect((await read(999,'en'))!.items[0].text).toBe('User-maintained source text');expect((await read(999,'es'))!.items[0]).toMatchObject({id:'manual',text:'User-maintained source text',textLanguage:undefined});expect(JSON.parse(localStorage.getItem('flicklet.insights.v1')!)['999']).toBeDefined();expect(localStorage.getItem('flicklet.goofs.v1')).toContain('User-maintained source text');
});
