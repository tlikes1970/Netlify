import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { extrasProvider } from '../extras/extrasProvider';
import { PROVIDER_CONFIG } from '../extras/config';
import { languageManager } from '../language';

const youtube = PROVIDER_CONFIG.youtube as { apiKey: string };
const originalKey = youtube.apiKey;
const fetchMock = vi.fn();
const video = { id: 'tmdb-video', site: 'YouTube', key: 'video-key', type: 'Featurette', name: 'Behind the scenes', published_at: '2024-01-01' };
const ytVideo = { id: { videoId: 'youtube-video' }, snippet: { title: 'Cast interview', channelTitle: 'Netflix', publishedAt: '2024-01-01', thumbnails: { high: { url: 'thumbnail' } } } };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const isYouTube = (url: string) => url.startsWith('https://www.googleapis.com/');

beforeEach(() => {
 languageManager.setLanguage('en');youtube.apiKey='';fetchMock.mockReset();vi.stubGlobal('fetch',fetchMock);
 vi.spyOn(console,'error').mockImplementation(()=>{});
});
afterEach(() => { youtube.apiKey=originalKey;vi.unstubAllGlobals();vi.restoreAllMocks();languageManager.setLanguage('en'); });

it.each(['movie','tv'] as const)('Extras uses the existing proxy for %s with no client TMDB key',async kind=>{
 fetchMock.mockResolvedValue(response({results:[video]}));
 const result=await extrasProvider.fetchExtras(7,'Title',kind);
 expect(result.kind).toBe('success');expect(result.videos[0].title).toBe(video.name);
 const url=new URL(String(fetchMock.mock.calls[0][0]),'https://test.local');
 expect(url.pathname).toContain('tmdb-proxy');expect(url.searchParams.get('endpoint')).toBe(`/${kind}/7/videos`);
 expect(url.searchParams.has('api_key')).toBe(false);expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('preserves TMDB content when YouTube fails',async()=>{
 youtube.apiKey='test-key';fetchMock.mockImplementation(async url=>isYouTube(String(url))?response({error:{message:'rejected'}},403):response({results:[video]}));
 const result=await extrasProvider.fetchExtras(7,'Title');expect(result.kind).toBe('success');expect(result.videos.map(v=>v.id)).toEqual(['tmdb_tmdb-video']);
});
it('preserves YouTube content when TMDB fails',async()=>{
 youtube.apiKey='test-key';fetchMock.mockImplementation(async url=>isYouTube(String(url))?response({items:[ytVideo]}):response({},502));
 const result=await extrasProvider.fetchExtras(7,'Title');expect(result.kind).toBe('success');expect(result.videos[0].title).toBe(ytVideo.snippet.title);
});
it('both valid empty providers produce no-content',async()=>{
 youtube.apiKey='test-key';fetchMock.mockImplementation(async url=>isYouTube(String(url))?response({items:[]}):response({results:[],cast:[]}));
 expect((await extrasProvider.fetchExtras(7,'Title')).kind).toBe('no-content');
});
it('an empty TMDB result without YouTube does not send credentialless fallback searches',async()=>{
 fetchMock.mockResolvedValue(response({results:[]}));expect((await extrasProvider.fetchExtras(7,'Title')).kind).toBe('no-content');expect(fetchMock).toHaveBeenCalledTimes(1);
});
it.each([401,403,429,500,502])('TMDB HTTP %s is unavailable, never no-content',async status=>{
 fetchMock.mockResolvedValue(response({},status));expect((await extrasProvider.fetchExtras(7,'Title')).kind).toBe('api-error');
});
it('network failure preserves the unavailable state',async()=>{
 fetchMock.mockRejectedValue(Error('offline'));expect((await extrasProvider.fetchExtras(7,'Title')).kind).toBe('api-error');
});
it('malformed TMDB videos data is an error rather than an empty title',async()=>{
 fetchMock.mockResolvedValue(response({results:'invalid'}));expect((await extrasProvider.fetchExtras(7,'Title')).kind).toBe('api-error');
});
it('malformed YouTube response is an error rather than no results',async()=>{
 youtube.apiKey='test-key';fetchMock.mockImplementation(async url=>isYouTube(String(url))?response({items:'invalid'}):response({results:[]}));
 expect((await extrasProvider.fetchExtras(7,'Title')).kind).toBe('api-error');
});
it('neither upstream error messages nor credential-bearing fetch exceptions leak YouTube keys',async()=>{
 youtube.apiKey='credential-sentinel';fetchMock.mockImplementation(async url=>isYouTube(String(url))?response({error:{message:'credential-sentinel'}},403):response({results:[]}));
 let result=await extrasProvider.fetchExtras(7,'Title');expect(JSON.stringify(result)).not.toContain('credential-sentinel');
 fetchMock.mockImplementation(async url=>{if(isYouTube(String(url)))throw Error('https://provider/?key=credential-sentinel');return response({results:[]});});
 result=await extrasProvider.fetchExtras(7,'Title');expect(JSON.stringify(result)).not.toContain('credential-sentinel');
 expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('credential-sentinel');
});
it('Spanish keeps localized source titles and bounded English fallback',async()=>{
 languageManager.setLanguage('es');fetchMock.mockImplementation(async url=>response({results:new URL(String(url),'https://test.local').searchParams.get('language')==='es'?[]:[video]}));
 expect((await extrasProvider.fetchExtras(7,'Title')).videos[0].title).toBe(video.name);expect(fetchMock).toHaveBeenCalledTimes(2);
 expect(String(fetchMock.mock.calls[0][0])).toContain('language=es');expect(String(fetchMock.mock.calls[1][0])).toContain('language=en-US');
});
