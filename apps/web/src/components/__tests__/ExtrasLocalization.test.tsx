import {act,render,screen,waitFor,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {languageManager} from '../../lib/language';
import {ExtrasModal} from '../extras/ExtrasModal';
import {GoofsModal} from '../extras/GoofsModal';
const mocks=vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock('../../hooks/useEntitlements',()=>({useEntitlements:()=>({hasFullAccess:true})}));
vi.mock('../../lib/extras/extrasProvider',()=>({extrasProvider:{fetchExtras:mocks.fetch}}));
beforeEach(()=>{languageManager.setLanguage('en');mocks.fetch.mockReset()});
afterEach(()=>{cleanup();languageManager.setLanguage('en')});
it('Shows Like This displays observations, localized labels and stable title identity EN ES EN',async()=>{
 render(<GoofsModal isOpen onClose={()=>{}} tmdbId={2316} title="User Title"/>);await screen.findByRole('dialog',{name:'User Title - Shows Like This'});await screen.findByText(/George Foreman/);act(()=>languageManager.setLanguage('es'));await screen.findByRole('dialog',{name:'User Title - Títulos similares'});await screen.findByText(/parrilla George Foreman/);expect(screen.getByRole('button',{name:'Cerrar ventana'})).toBeInTheDocument();act(()=>languageManager.setLanguage('en'));await screen.findByText(/George Foreman/);
});
it('Extras updates UI while preserving provider titles and rejecting old-language late responses',async()=>{
 let resolveOld:(value:any)=>void=()=>{};mocks.fetch.mockImplementationOnce(()=>new Promise(resolve=>{resolveOld=resolve})).mockResolvedValue({kind:'success',videos:[{id:'es',title:'Provider título original',thumbnailUrl:'',embedUrl:'',publishedAt:'2020-01-01',channelName:'Original channel'}]});render(<ExtrasModal isOpen onClose={()=>{}} showId={8} showTitle="User Title"/>);await waitFor(()=>expect(mocks.fetch).toHaveBeenCalledTimes(1));act(()=>languageManager.setLanguage('es'));await screen.findByText('Provider título original');expect(screen.getByRole('button',{name:'Cerrar ventana'})).toBeInTheDocument();await act(async()=>resolveOld({kind:'success',videos:[{id:'old',title:'Stale English video'}]}));expect(screen.queryByText('Stale English video')).not.toBeInTheDocument();act(()=>languageManager.setLanguage('en'));await screen.findByRole('button',{name:'Close modal'});expect(await screen.findByText('Provider título original')).toBeInTheDocument();
});
it('Extras empty copy is bilingual',async()=>{
 mocks.fetch.mockResolvedValue({kind:'success',videos:[]});render(<ExtrasModal isOpen onClose={()=>{}} showId={8} showTitle="User Title"/>);await screen.findByText('No extras found');act(()=>languageManager.setLanguage('es'));await screen.findByText('No se encontraron extras');
});

it('Extras configuration failure is readable in both languages',async()=>{
 mocks.fetch.mockResolvedValue({kind:'config-error',videos:[]});render(<ExtrasModal isOpen onClose={()=>{}} showId={8} showTitle="User Title"/>);await screen.findByText('Extras are temporarily unavailable due to configuration issues.');act(()=>languageManager.setLanguage('es'));await screen.findByText('Los extras no están disponibles temporalmente por un problema de configuración.');expect(screen.queryByText('No extras found')).not.toBeInTheDocument();
});
