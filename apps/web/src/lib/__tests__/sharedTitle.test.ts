import { beforeEach, expect, it, vi } from 'vitest';
import { parseSharedTitle, resolveSharedTitle } from '../sharedTitle';
vi.mock('../tmdb',()=>({get:vi.fn()}));
import { get } from '../tmdb';
beforeEach(()=>vi.clearAllMocks());
it.each(['movie','tv'])('resolves %s directly from public TMDB regardless of tracked state',async(mediaType)=>{vi.mocked(get).mockResolvedValue({id:42,title:'Movie',name:'Series'});const request=parseSharedTitle(`?tmdbId=42&mediaType=${mediaType}`);const item=await resolveSharedTitle(request);expect(get).toHaveBeenCalledWith(`/${mediaType}/42`);expect(item.mediaType).toBe(mediaType);expect(item.id).toBe(42);expect(item.title).toBe(mediaType==='movie'?'Movie':'Series');});
it.each(['?mediaType=tv','?tmdbId=bad&mediaType=tv','?tmdbId=-1&mediaType=movie','?tmdbId=42&mediaType=person','?titleId=x','?tmdbId=9007199254740992&mediaType=tv'])('rejects malformed %s before fetching',async(query)=>{expect(parseSharedTitle(query)).toEqual({error:'invalid'});await expect(resolveSharedTitle(parseSharedTitle(query))).rejects.toThrow();expect(get).not.toHaveBeenCalled();});
it('legacy numeric link is explicitly ambiguous and never guesses recipient Library',()=>{expect(parseSharedTitle('?tmdbId=42')).toEqual({error:'legacy'});});
it('missing/wrong returned title rejects safely',async()=>{vi.mocked(get).mockResolvedValue({id:43,name:'Other'});await expect(resolveSharedTitle({id:42,mediaType:'tv'})).rejects.toThrow('unavailable');});
