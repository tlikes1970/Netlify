import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { languageManager } from '@/lib/language';
import { EpisodeTrackingModal } from '../modals/EpisodeTrackingModal';
import { SeriesReminderModal } from '../modals/SeriesReminderModal';
import { NotificationCenter } from '../modals/NotificationCenter';
const m=vi.hoisted(()=>({details:vi.fn(),cleanup:vi.fn(),write:vi.fn(),enable:vi.fn(),disable:vi.fn()}));
vi.mock('@/lib/tmdb',()=>({getTVShowDetails:m.details}));
vi.mock('@/utils/episodeProgress',()=>({cleanupInvalidEpisodeKeys:m.cleanup,getValidEpisodeKeys:()=>['S1E2'],readStoredEpisodeProgress:()=>({episodes:{S1E2:true}}),writeStoredEpisodeProgress:m.write}));
vi.mock('@/lib/seriesReminders',()=>({isSeriesReminderEnabled:()=>false,enableSeriesReminder:m.enable,disableSeriesReminder:m.disable}));
vi.mock('@/lib/notifications',()=>({notificationManager:{getLog:()=>[],markAsRead:vi.fn()}}));
const details=(name:string)=>({id:8,name,number_of_episodes:1,seasons:[{id:1,name:'Temporada 1',season_number:1,episodes:[{id:21,episode_number:2,season_number:1,name:'Nombre',overview:'Resumen'}]}]});
beforeEach(()=>{vi.clearAllMocks();languageManager.setLanguage('en')});
afterEach(()=>{cleanup();languageManager.setLanguage('en')});
it('open episode UI refetches on language change and ignores late old response before cleanup/writes',async()=>{
 let finish!:(value:unknown)=>void;m.details.mockImplementationOnce(()=>new Promise(resolve=>finish=resolve)).mockResolvedValueOnce(details('Serie'));
 render(<EpisodeTrackingModal isOpen onClose={()=>{}} show={{id:8,name:'Show',number_of_seasons:1,number_of_episodes:1}}/>);
 await waitFor(()=>expect(m.details).toHaveBeenCalledTimes(1));act(()=>languageManager.setLanguage('es'));
 await screen.findByText('Serie');expect(screen.getByText('Temporada 1')).toBeInTheDocument();expect(screen.getByRole('checkbox')).toBeChecked();
 expect(m.write).toHaveBeenCalledTimes(1);await act(async()=>finish(details('Stale')));expect(screen.queryByText('Stale')).not.toBeInTheDocument();expect(m.cleanup).toHaveBeenCalledTimes(1);expect(m.write).toHaveBeenCalledTimes(1);
});
it('series reminder errors remain live-translated and language switching does not run native operations',async()=>{
 m.enable.mockResolvedValue({enabled:false,reason:'denied'});render(<SeriesReminderModal item={{id:'8',mediaType:'tv',title:'My title'}} onClose={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Set Reminder'}));await screen.findByRole('alert');act(()=>languageManager.setLanguage('es'));
 await screen.findByRole('button',{name:'Configurar recordatorio'});expect(screen.getByRole('alert')).toHaveTextContent('Las notificaciones');expect(m.enable).toHaveBeenCalledTimes(1);expect(m.disable).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Cerrar'})).toBeInTheDocument();
});
it('active history empty state updates in-place without altering logs',async()=>{
 render(<NotificationCenter isOpen onClose={()=>{}}/>);expect(screen.getByRole('dialog')).toBeInTheDocument();act(()=>languageManager.setLanguage('es'));await screen.findByRole('heading',{name:/Historial de notificaciones/});expect(screen.getByText('Aún no hay notificaciones')).toBeInTheDocument();
});
