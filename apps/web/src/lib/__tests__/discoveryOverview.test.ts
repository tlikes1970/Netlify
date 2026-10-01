import { describe, expect, it, vi } from 'vitest';
import { analyzeUserPreferences, clearRecommendationCache, getSmartRecommendations } from '../smartDiscovery';
vi.mock('../storage', () => ({Library:{getAll:()=>[]}}));
describe('Discovery response information', () => {
  it('retains overview from existing candidate responses without requesting details', async () => {
    clearRecommendationCache();
    const api=vi.fn().mockResolvedValue({results:[{id:11,title:'Film',media_type:'movie',poster_path:'/a.jpg',overview:' Existing overview ',vote_average:8},{id:12,name:'TV title',media_type:'tv',poster_path:'/b.jpg',overview:null,vote_average:8}]});
    const recs=await getSmartRecommendations(analyzeUserPreferences([],[],[]),20,api,'overview-test');
    expect(recs.find(r=>r.item.id==='11')?.item.overview).toBe('Existing overview');
    expect(recs.find(r=>r.item.id==='12')?.item.overview).toBeUndefined();
    expect(api).toHaveBeenCalledTimes(6);
    expect(api.mock.calls.every(([path])=>['/trending/all/week','/movie/popular','/tv/popular'].includes(path))).toBe(true);
    expect(recs.find(r=>r.item.id==='12')?.item).not.toHaveProperty('nextAirDate');
    expect(recs.find(r=>r.item.id==='12')?.item).not.toHaveProperty('showStatus');
  });
});
