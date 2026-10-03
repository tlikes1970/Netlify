import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import SearchSuggestions from '../SearchSuggestions';
import { fetchEnhancedAutocomplete } from '../../search/enhancedAutocomplete';
import { changeLanguage } from '../../lib/language';
import type { MediaItem } from '../cards/card.types';
vi.mock('../../search/enhancedAutocomplete',()=>({fetchEnhancedAutocomplete:vi.fn()}));
const fetchSuggestions=vi.mocked(fetchEnhancedAutocomplete);
beforeEach(()=>{changeLanguage('en');fetchSuggestions.mockReset();localStorage.clear();});
afterEach(()=>{cleanup();changeLanguage('en');});
it.each([['en','es'],['es','en']] as const)('autocomplete %s→%s refetches unchanged query and ignores late response',async(from,to)=>{
 changeLanguage(from);let finish!:(items:MediaItem[])=>void;
 fetchSuggestions.mockImplementation((_q,_signal,_providers,language)=>language===(from==='en'?'en-US':'es')?new Promise(resolve=>{finish=resolve}):Promise.resolve([{id:7,mediaType:'movie',title:to==='es'?'Título español':'English title'}]));
 render(<SearchSuggestions query="locale" isVisible onClose={()=>{}} onSuggestionClick={()=>{}}/>);await waitFor(()=>expect(finish).toBeTypeOf('function'));
 const oldSignal=fetchSuggestions.mock.calls[0][1]!;act(()=>changeLanguage(to));const title=to==='es'?'Título español':'English title';await screen.findByText(title);expect(oldSignal.aborted).toBe(true);
 await act(async()=>finish([{id:7,mediaType:'movie',title:'Obsolete title'}]));expect(screen.queryByText('Obsolete title')).toBeNull();expect(screen.getByText(title)).toBeInTheDocument();
});
