import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mergeEpisodeText, needsEpisodeFallback } from '../episodeMetadata';
import { languageManager, t } from '../language';
import { getSeasonEpisodes } from '../tmdb';
import { fetchRelevantSeasonEpisodes } from '../../tmdb/tv';
import { getHumanizedAirDate } from '../constants/metadata';
const episode = { id: 21, episode_number: 2, season_number: 1, name: 'Nombre', overview: 'Resumen', air_date: '2030-01-01' };
beforeEach(()=>languageManager.setLanguage('es'));
afterEach(()=>{vi.restoreAllMocks();languageManager.setLanguage('en')});
it('merges only display text, matching structural episode number and retaining existing useful text',()=>{
 const data={id:1,name:'Temporada',episodes:[{...episode,overview:''}]};
 const result=mergeEpisodeText(data,{name:'Season',episodes:[{...episode,name:'Existing',overview:'Previous'}]},{name:'English',episodes:[{...episode,id:999,name:'English',overview:'English'}]});
 expect(result).toMatchObject({id:1,name:'Temporada',episodes:[{id:21,name:'Nombre',overview:'Previous',episode_number:2}]});
 expect(data.episodes[0].overview).toBe('');
});
it('populated text does not require an English fallback; missing name does',()=>{
 expect(needsEpisodeFallback({name:'Temporada',episodes:[episode]})).toBe(false);
 expect(needsEpisodeFallback({name:'Temporada',episodes:[{...episode,name:''}]})).toBe(true);
});
it('specific season uses generic Spanish and makes no unconditional English request',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({name:'Temporada',episodes:[episode]}),{status:200,headers:{'content-type':'application/json'}}));
 expect(await getSeasonEpisodes(8,1)).toMatchObject([episode]);
 expect(fetch).toHaveBeenCalledTimes(1);expect(String(fetch.mock.calls[0][0])).toContain('language=es');
});
it('missing episode text gets one bounded English fallback without replacing identity/date',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(JSON.stringify({name:'Temporada',episodes:[{...episode,name:''}]}),{headers:{'content-type':'application/json'}})).mockResolvedValueOnce(new Response(JSON.stringify({name:'Season',episodes:[{...episode,id:999,name:'Fallback',air_date:'2040-01-01'}]}),{headers:{'content-type':'application/json'}}));
 expect(await getSeasonEpisodes(8,1)).toMatchObject([{id:21,name:'Fallback',air_date:'2030-01-01'}]);expect(fetch).toHaveBeenCalledTimes(2);
});
it('reminder fetch uses selected language for show and selected season while preserving schedule fields',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(JSON.stringify({next_episode_to_air:{season_number:1}}))).mockResolvedValueOnce(new Response(JSON.stringify({name:'Temporada',episodes:[episode]})));
 expect(await fetchRelevantSeasonEpisodes(8)).toMatchObject([episode]);expect(fetch).toHaveBeenCalledTimes(2);for(const [url] of fetch.mock.calls)expect(String(url)).toContain('language=es');
});
it('relative dates and native authored text switch language without touching storage',()=>{
 localStorage.setItem('episode-progress-8','{"episodes":{"S1E2":true}}');
 const now=new Date();const today=new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()));expect(getHumanizedAirDate(today)).toBe('Hoy');expect(t('episodesTitleAirsToday',{title:'User title'})).toBe('User title se estrena hoy');
 languageManager.setLanguage('en');expect(getHumanizedAirDate(today)).toBe('Today');expect(localStorage.getItem('episode-progress-8')).toContain('S1E2');
});
