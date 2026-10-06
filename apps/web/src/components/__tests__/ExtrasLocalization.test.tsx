import {act,render,screen,waitFor,cleanup,fireEvent} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {languageManager} from '../../lib/language';
import {ExtrasModal} from '../extras/ExtrasModal';
import {ShowsLikeThisModal} from '../extras/ShowsLikeThisModal';
const mocks=vi.hoisted(()=>({fetch:vi.fn(),hasFullAccess:true,upgrade:vi.fn()}));
vi.mock('../../hooks/useEntitlements',()=>({useEntitlements:()=>({hasFullAccess:mocks.hasFullAccess})}));
vi.mock('../../lib/extras/extrasProvider',()=>({extrasProvider:{fetchExtras:mocks.fetch}}));
vi.mock('../../lib/proUpgrade',()=>({startProUpgrade:mocks.upgrade,isAndroidBillingAvailable:()=>true}));
beforeEach(()=>{languageManager.setLanguage('en');mocks.fetch.mockReset();mocks.hasFullAccess=true;mocks.upgrade.mockReset()});
afterEach(()=>{cleanup();languageManager.setLanguage('en')});
it('Shows Like This displays observations, localized labels and stable title identity EN ES EN',async()=>{
 render(<ShowsLikeThisModal isOpen onClose={()=>{}} tmdbId={2316} title="User Title"/>);await screen.findByRole('dialog',{name:'User Title - Shows Like This'});await screen.findByText(/George Foreman/);act(()=>languageManager.setLanguage('es'));await screen.findByRole('dialog',{name:'User Title - Títulos similares'});await screen.findByText(/parrilla George Foreman/);expect(screen.getByRole('button',{name:'Cerrar ventana'})).toBeInTheDocument();act(()=>languageManager.setLanguage('en'));await screen.findByText(/George Foreman/);
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

it('Extras heading and exact empty explanation switch EN ES EN without changing title or destination',async()=>{
 mocks.fetch.mockResolvedValue({kind:'success',videos:[]});render(<ExtrasModal isOpen onClose={()=>{}} showId={8} showTitle="User Title"/>);
 for(const [language,explanation] of [['en',"We couldn't find extras for this title. Some movies and shows simply don't have them."],['es','No encontramos extras para este título. Algunas películas y series simplemente no los tienen.'],['en',"We couldn't find extras for this title. Some movies and shows simply don't have them."]] as const){
  act(()=>languageManager.setLanguage(language));await screen.findByRole('dialog',{name:'User Title - Extras'});await screen.findByText(explanation);
 }
});
it.each([
 ['en','Extras need Full Access','Start your 21-day trial or unlock Full Access in Settings for behind-the-scenes content.','Unlock Full Access'],
 ['es','Los extras requieren Acceso completo','Inicia tu prueba de 21 días o desbloquea Acceso completo en Ajustes para ver contenido del rodaje.','Desbloquear Acceso completo']
] as const)('Extras preserves locked copy and upgrade behavior in %s',(language,heading,explanation,action)=>{
 mocks.hasFullAccess=false;languageManager.setLanguage(language);const close=vi.fn();render(<ExtrasModal isOpen onClose={close} showId={8} showTitle="User Title"/>);
 expect(screen.getByRole('dialog',{name:'User Title - Extras'})).toBeInTheDocument();expect(screen.getByText(heading)).toBeInTheDocument();expect(screen.getByText(explanation)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:action}));expect(close).toHaveBeenCalledTimes(1);expect(mocks.upgrade).toHaveBeenCalledTimes(1);expect(mocks.fetch).not.toHaveBeenCalled();
});

it('Shows Like This keeps its Full Access gate and never exposes observations when locked',async()=>{
 mocks.hasFullAccess=false;render(<ShowsLikeThisModal isOpen onClose={()=>{}} tmdbId={2316} title="User Title"/>);
 expect(screen.getByRole('dialog',{name:'User Title - Shows Like This'})).toBeInTheDocument();expect(screen.queryByText(/George Foreman/)).not.toBeInTheDocument();
});
