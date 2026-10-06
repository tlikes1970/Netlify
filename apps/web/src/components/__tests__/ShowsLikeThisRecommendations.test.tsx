import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ShowsLikeThisModal } from '../extras/ShowsLikeThisModal';
import { languageManager } from '../../lib/language';
const m=vi.hoisted(()=>({get:vi.fn(),access:true}));
vi.mock('../../lib/relatedTitles',()=>({getRelatedTitles:m.get}));
vi.mock('../../hooks/useEntitlements',()=>({useEntitlements:()=>({hasFullAccess:m.access})}));
const result={id:2,mediaType:'tv',title:'Other Title',year:'2021',posterUrl:'https://image.tmdb.org/t/p/w342/poster.jpg'};
beforeEach(()=>{m.access=true;m.get.mockReset().mockResolvedValue([result]);languageManager.setLanguage('en')});
afterEach(()=>{cleanup();languageManager.setLanguage('en')});
function open(props={}){return render(<ShowsLikeThisModal isOpen onClose={()=>{}} tmdbId={1} mediaType="tv" title="Source" {...props}/>)}
it('renders real title/poster/year and canonical title destination',async()=>{
 const select=vi.fn();open({onSelect:select});const link=await screen.findByRole('link',{name:'Other Title 2021'});
 expect(link).toHaveAttribute('href','/?view=title&tmdbId=2&mediaType=tv');expect(link.querySelector('img')).toHaveAttribute('src',result.posterUrl);fireEvent.click(link);expect(select).toHaveBeenCalledWith(result);
});
it.each(['Insight','Pattern','Style','Easter Egg','Easy to miss','No insights found'])('retired %s UI is absent',async text=>{open();await screen.findByText('Other Title');expect(screen.queryByText(text,{exact:false})).toBeNull()});
it.each([['en','No similar titles found.'],['es','No se encontraron títulos similares.']] as const)('valid empty is localized in %s',async(lang,text)=>{languageManager.setLanguage(lang);m.get.mockResolvedValue([]);open();expect(await screen.findByText(text)).toBeInTheDocument()});
it('retrieval failure is an alert, not fake empty',async()=>{m.get.mockRejectedValue(new Error('offline'));open();expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');expect(screen.queryByText('No similar titles found.')).toBeNull()});
it('does not fetch or expose results without Full Access',()=>{m.access=false;open();expect(m.get).not.toHaveBeenCalled();expect(screen.queryByRole('link')).toBeNull()});
it('switches EN ES EN and rejects stale earlier-language responses',async()=>{
 let resolve!:(value:typeof result[])=>void;m.get.mockImplementationOnce(()=>new Promise(done=>resolve=done)).mockResolvedValue([{...result,title:'Título similar'}]);open();act(()=>languageManager.setLanguage('es'));await screen.findByText('Título similar');await act(async()=>resolve([{...result,title:'Stale'}]));expect(screen.queryByText('Stale')).toBeNull();act(()=>languageManager.setLanguage('en'));await screen.findByRole('dialog',{name:'Source - Shows Like This'});
});
it('Escape and Android Back close; focus returns to trigger',async()=>{
 const close=vi.fn();const trigger=document.createElement('button');document.body.append(trigger);trigger.focus();const view=open({onClose:close});await screen.findByText('Other Title');expect(screen.getByRole('button',{name:'Close modal'})).toHaveFocus();fireEvent.keyDown(document,{key:'Escape'});expect(close).toHaveBeenCalledOnce();const event=new Event('flicklet:android-back',{cancelable:true});act(()=>window.dispatchEvent(event));expect(event.defaultPrevented).toBe(true);view.unmount();expect(trigger).toHaveFocus();trigger.remove();
});
