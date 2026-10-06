import { beforeEach, expect, it, vi } from 'vitest';
import { getRelatedTitles } from '../relatedTitles';
import { get } from '../tmdb';
vi.mock('../tmdb', () => ({ get: vi.fn() }));
vi.mock('../storage', () => ({ Library: {} }));
const row = (id: number, media_type?: string) => ({ id, media_type, title: `Title ${id}`, poster_path: '/poster.jpg', release_date: '2020-01-01', first_air_date: '2020-01-01' });
beforeEach(() => vi.mocked(get).mockReset());
it.each(['movie', 'tv'] as const)('requests %s Recommendations then Similar with selected language', async kind => {
  vi.mocked(get).mockResolvedValueOnce({results:[row(2)]}).mockResolvedValueOnce({results:[row(3)]});
  expect(await getRelatedTitles(1, kind, 'es-ES')).toMatchObject([{id:2,mediaType:kind,title:'Title 2',year:'2020'},{id:3}]);
  expect(get).toHaveBeenNthCalledWith(1,`/${kind}/1/recommendations`,{language:'es-ES'});
  expect(get).toHaveBeenNthCalledWith(2,`/${kind}/1/similar`,{language:'es-ES'});
});
it('fills an empty Recommendations result from Similar', async () => {
  vi.mocked(get).mockResolvedValueOnce({results:[]}).mockResolvedValueOnce({results:[row(2)]});
  expect(await getRelatedTitles(1,'tv')).toHaveLength(1);
});
it('excludes current compound identity and deduplicates while preserving provider order', async () => {
  vi.mocked(get).mockResolvedValueOnce({results:[row(1),row(2),row(2),row(1,'movie')]}).mockResolvedValueOnce({results:[row(2),row(3)]});
  expect((await getRelatedTitles(1,'tv')).map(x=>`${x.mediaType}:${x.id}`)).toEqual(['tv:2','movie:1','tv:3']);
});
it('caps at eight and skips Similar when Recommendations are sufficient', async () => {
  vi.mocked(get).mockResolvedValue({results:Array.from({length:20},(_,i)=>row(i+2))});
  expect(await getRelatedTitles(1,'movie')).toHaveLength(8); expect(get).toHaveBeenCalledOnce();
});
it('keeps valid Recommendations when Similar fails', async () => {
  vi.mocked(get).mockResolvedValueOnce({results:[row(2)]}).mockRejectedValueOnce(new Error('offline'));
  expect(await getRelatedTitles(1,'movie')).toHaveLength(1);
});
it('recovers from Recommendations failure using Similar', async () => {
  vi.mocked(get).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({results:[row(2)]});
  expect(await getRelatedTitles(1,'tv')).toHaveLength(1);
});
it('returns genuine empty only when both provider responses are valid', async () => {
  vi.mocked(get).mockResolvedValue({results:[]}); expect(await getRelatedTitles(1,'tv')).toEqual([]);
});
it.each(['offline', 'malformed'])('does not label %s retrieval as valid empty', async mode => {
  if(mode==='offline')vi.mocked(get).mockRejectedValueOnce(new Error('offline')).mockRejectedValueOnce(new Error('offline'));else vi.mocked(get).mockResolvedValue({});
  await expect(getRelatedTitles(1,'tv')).rejects.toThrow('unavailable');
});
it('filters invalid identities and preserves missing-poster fallback', async () => {
  vi.mocked(get).mockResolvedValue({results:[null,{id:-1,title:'Bad'},{id:2},{id:5,title:'  '},{id:3,media_type:'person',name:'Person'},{id:4,name:'Valid'}]});
  expect(await getRelatedTitles(1,'tv')).toMatchObject([{id:4,title:'Valid',posterUrl:undefined}]);
});
it('rejects invalid source identity before requesting', async () => {
  await expect(getRelatedTitles('bad','tv')).rejects.toThrow('Invalid');expect(get).not.toHaveBeenCalled();
});
