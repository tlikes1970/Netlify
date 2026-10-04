import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { languageManager } from '../language';
import { setSeriesReminderState, reconcileSeriesReminders } from '../seriesReminders';
const m=vi.hoisted(()=>({schedule:vi.fn(),cancel:vi.fn(),pending:vi.fn(),episodes:vi.fn(),channel:vi.fn()}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>true,getPlatform:()=> 'android'}}));
vi.mock('@capacitor/local-notifications',()=>({LocalNotifications:{schedule:m.schedule,cancel:m.cancel,getPending:m.pending,createChannel:m.channel,checkPermissions:async()=>({display:'granted'})}}));
vi.mock('@/tmdb/tv',()=>({fetchRelevantSeasonEpisodes:m.episodes}));
vi.mock('../storage',()=>({Library:{getCurrentList:()=> 'watching'}}));
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();languageManager.setLanguage('es');setSeriesReminderState(8,'User title',true);m.pending.mockResolvedValue({notifications:[]});m.episodes.mockResolvedValue([{id:21,name:'Nombre',season_number:1,episode_number:2,air_date:'2030-01-01',overview:''}]);});
afterEach(()=>languageManager.setLanguage('en'));
it('new Spanish native notifications preserve structural IDs and 8 AM local timing; language changes alone do not reschedule',async()=>{
 await reconcileSeriesReminders({force:true});expect(m.schedule).toHaveBeenCalledTimes(1);
 const n=m.schedule.mock.calls[0][0].notifications[0];expect(n.title).toBe('User title se estrena hoy');expect(n.body).toBe('Temporada 1, episodio 2 · Nombre');expect(n.extra).toMatchObject({showId:8,seasonNumber:1,episodeNumber:2,airDate:'2030-01-01'});expect(n.schedule.at.getHours()).toBe(8);expect(m.channel.mock.calls[0][0]).toMatchObject({id:'episode-reminders',name:'Recordatorios de episodios'});
 m.pending.mockResolvedValue({notifications:[n]});languageManager.setLanguage('en');expect(m.cancel).not.toHaveBeenCalled();await reconcileSeriesReminders({force:true});expect(m.schedule).toHaveBeenCalledTimes(1);expect(m.cancel).not.toHaveBeenCalled();
});
