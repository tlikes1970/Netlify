import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { changeLanguage, languageManager, t, tPlural } from '@/lib/language';
import { getSnapshot } from '@/i18n/translationStore';
import Tabs from '../Tabs';
import ErrorBoundary from '../ErrorBoundary';
import AccountButton from '../AccountButton';
import MobileTabs from '../MobileTabs';
import LibrarySegmentBar from '../LibrarySegmentBar';
import ListFilters from '../ListFilters';
import SortDropdown from '../SortDropdown';
import GenreRowConfig, { displayRowTitle } from '../GenreRowConfig';
import { ContextStatusActions } from '../cards/mobile/ContextStatusActions';
import { CompactOverflowMenu } from '@/features/compact/CompactOverflowMenu';
import ListSelectorModal from '../ListSelectorModal';
import SearchResults, { SearchResultCard } from '@/search/SearchResults';
import DiscoveryPage from '@/pages/DiscoveryPage';
import SearchSuggestions from '../SearchSuggestions';
import { ForYouErrorFallback } from '../home/ForYouErrorFallback';
import { getShowStatusInfo } from '@/utils/showStatus';
import { formatMobileMetaLine } from '../cards/mobile/cardMobileShared';

const state = vi.hoisted(() => ({ signedIn: true, loading: false, error: null as string | null, move: vi.fn(), upsert: vi.fn(), add: vi.fn() }));
vi.mock('@/components/AuthModal',()=>({default:()=>null}));
vi.mock('@/search/smartSearch',()=>({smartSearch:async()=>{throw new Error('private provider detail')}}));
vi.mock('@/hooks/useDeviceDetection', () => ({useIsDesktop:()=>({ready:true,isDesktop:false})}));
vi.mock('@/lib/isMobile',()=>({isMobileNow:()=>false}));
vi.mock('@/lib/capacitorEnv',()=>({isCapacitorNative:()=>false,isCapacitorAndroid:()=>false}));
vi.mock('@/hooks/useEntitlements',()=>({useEntitlements:()=>({hasFullAccess:true,isReadOnlyMode:false})}));
vi.mock('@/lib/settings',()=>({useSettings:()=>({layout:{episodeTracking:false},personality:'Zen'}),getPersonalityText:()=>'',DEFAULT_PERSONALITY:'Zen'}));
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>({isAuthenticated:state.signedIn,user:state.signedIn?{uid:'owner'}:null})}));
vi.mock('@/hooks/useSmartDiscovery',()=>({useSmartDiscovery:()=>({recommendations:[],isLoading:state.loading,error:state.error})}));
vi.mock('@/lib/statusTransitions',()=>({setPrimaryStatus:state.move,setNotInterested:vi.fn()}));
vi.mock('@/lib/seriesReminders',()=>({isSeriesReminderEnabled:()=>false}));
vi.mock('@/lib/storage',async()=>{const {getWatchStatusLabel}=await import('@/lib/watchStatus');return ({getListDisplayName:()=> getWatchStatusLabel('watching'),Library:{getAll:()=>[],getCurrentList:()=> 'watching',getEntry:()=>({list:'watching',customListIds:['family']}),has:()=>true,subscribe:()=>()=>{},upsert:state.upsert,addToCustomList:state.add,updateRating:vi.fn()},addToListWithConfirmation:vi.fn()})});
vi.mock('@/lib/customLists',()=>({useCustomLists:()=>({customLists:[{id:'family',name:'Family / Familia',itemCount:1},{id:'other',name:'Second list',itemCount:2}],maxLists:3}),customListManager:{getListById:(id:string)=>({id,name:'Family / Familia'}),setSelectedList:vi.fn()}}));
vi.mock('@/lib/events',()=>({emit:vi.fn()}));
vi.mock('@/lib/shareLinks',()=>({shareShowWithFallback:vi.fn()}));
vi.mock('@/lib/readOnlyGuard',()=>({notifyReadOnlyBlocked:vi.fn(),guardMutation:()=>true,isMutationBlocked:()=>false}));
vi.mock('@/components/UpgradeToProCTA',()=>({UpgradeToProCTA:()=>null}));
vi.mock('@/search/enhancedAutocomplete',()=>({fetchEnhancedAutocomplete:async()=>[]}));
vi.mock('@/search/api',()=>({fetchNetworkInfo:async()=>({networks:['Netflix']}),fetchFullMediaMetadata:async(item:unknown)=>item,discoverByGenre:vi.fn()}));
vi.mock('@/tmdb/tv',()=>({fetchCurrentEpisodeInfo:async()=>null,fetchNextAirDate:async()=>null,fetchShowStatus:async()=>null}));
vi.mock('@/lib/tmdb',()=>({getTVShowDetails:vi.fn()}));
vi.mock('@/components/OptimizedImage',()=>({OptimizedImage:()=>null}));
const item={id:'10',mediaType:'tv' as const,title:'Dark Winds',year:'2022',showStatus:'Returning Series' as const,networks:['Netflix'],userNotes:'My note',tags:['Family']};
beforeEach(async()=>{localStorage.clear();vi.clearAllMocks();state.signedIn=true;state.loading=false;state.error=null;changeLanguage('en');await waitFor(()=>expect(getSnapshot().locale).toBe('en'));vi.spyOn(HTMLElement.prototype,'offsetHeight','get').mockReturnValue(240);vi.spyOn(HTMLElement.prototype,'offsetWidth','get').mockReturnValue(200)});
afterEach(()=>{cleanup();vi.restoreAllMocks()});
async function language(value:'en'|'es'){act(()=>changeLanguage(value));await waitFor(()=>expect(getSnapshot().locale).toBe(value))}

it('real navigation and segments switch both ways with canonical destinations and plural counts',async()=>{
 const navigate=vi.fn(),segment=vi.fn();render(<><Tabs current="library" onChange={navigate}/><MobileTabs current="library" onChange={navigate} onSettingsClick={()=>{}}/><LibrarySegmentBar segment="want" counts={{watching:1,want:2,watched:0,mylists:1}} onChange={segment}/></>);
 expect(screen.getByRole('tab',{name:'Watching, 1 item'})).toBeInTheDocument();
 await language('es');expect(screen.getByRole('navigation',{name:'Navegación principal'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('tab',{name:'Quiero ver, 2 títulos'}));expect(segment).toHaveBeenCalledWith('want');
 fireEvent.click(screen.getByRole('button',{name:'Biblioteca',exact:true}));expect(navigate).toHaveBeenCalledWith('library');
 expect(screen.getByRole('tab',{name:'Listas personalizadas, 1 lista'})).toBeInTheDocument();
 await language('en');expect(screen.getByRole('tab',{name:'Custom Lists, 1 list'})).toBeInTheDocument();
});
it.each(['en','es'] as const)('%s filters and sorting keep canonical values and provider names',async lang=>{
 await language(lang);const filter=vi.fn(),sort=vi.fn();render(<><ListFilters value={{type:'all',providers:[]}} availableProviders={['Netflix']} onChange={filter}/><SortDropdown value="date-newest" onChange={sort}/></>);
 fireEvent.change(screen.getByLabelText(t('coreType')),{target:{value:'tv'}});expect(filter).toHaveBeenCalledWith({type:'tv',providers:[]});
 fireEvent.change(screen.getByLabelText(t('coreSort')),{target:{value:'custom'}});expect(sort).toHaveBeenCalledWith('custom');
 fireEvent.click(screen.getByRole('button',{name:new RegExp('^'+t('coreNetwork'))}));expect(screen.getByRole('dialog',{name:t('coreSelectNetworks')})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('checkbox',{name:'Netflix'}));expect(filter).toHaveBeenLastCalledWith({type:'all',providers:['Netflix']});
 expect(screen.getByRole('option',{name:t('coreAZ')})).toHaveValue('alphabetical-az');
});
it.each(['en','es'] as const)('%s card actions, overflow, TV labels and rating accessibility preserve identity',async lang=>{
 await language(lang);render(<ContextStatusActions item={item} tabKey="want"/>);fireEvent.click(screen.getByRole('button',{name:t('coreWatching')}));expect(state.move).toHaveBeenCalledWith(item,'watching',{feedback:true});cleanup();
 render(<CompactOverflowMenu item={item} context="tab-watching" actions={{onOpen:()=>{},onNotInterested:()=>{},onEpisodeTracking:()=>{},onSimpleReminder:()=>{},onNotesEdit:()=>{},onGoofsOpen:()=>{},onExtrasOpen:()=>{},onDelete:()=>{}}}/>);
 fireEvent.click(screen.getByRole('button',{name:t('coreMore')}));await screen.findByRole('menu');
 for(const key of ['coreOpenDetails','coreNot','coreRemind','notesAndTags','coreShowsLikeThis','coreExtras','coreCustomLists'] as const)expect(screen.getByRole('menuitem',{name:t(key)})).toBeInTheDocument();
 expect(formatMobileMetaLine(item,'tv')).toBe(`2022 • ${t('coreTV')}`);
 for(const [status,key] of [['Ended','coreEnded'],['Canceled','coreCancelled'],['Returning Series','coreReturning'],['In Production','coreProduction'],['Planned','corePlanned']] as const)expect(getShowStatusInfo(status)?.badge).toBe(t(key));
});
it.each(['en','es'] as const)('%s membership picker preserves user names, title and normal status',async lang=>{
 await language(lang);render(<ListSelectorModal item={item} isOpen onClose={()=>{}}/>);
 expect(screen.getByText(t('coreSelectList',{title:item.title}))).toBeInTheDocument();expect(screen.getByText('Family / Familia')).toBeInTheDocument();expect(screen.getByText(tPlural({one:'coreItemOne',other:'coreItemsOther'},1))).toBeInTheDocument();
 fireEvent.click(screen.getByRole('radio',{name:/Second list/}).closest('label')!);fireEvent.click(screen.getByRole('button',{name:t('coreAddCustomList')}));expect(state.add).toHaveBeenCalledWith(item,'other');expect(state.move).not.toHaveBeenCalled();
});
it.each(['en','es'] as const)('%s For You configuration derives display only and retains genre IDs',async lang=>{
 await language(lang);const row={id:'1',mainGenre:'horror',subGenre:'psychological',title:'Horror/Psychological'},update=vi.fn();render(<GenreRowConfig row={row} onUpdate={update} onRemove={()=>{}} canRemove/>);
 expect(screen.getByText(t('coreRowPreview',{title:displayRowTitle(row)}))).toBeInTheDocument();expect(row.title).toBe('Horror/Psychological');
 fireEvent.change(screen.getByLabelText(t('coreMainGenre')),{target:{value:'comedy'}});expect(update).toHaveBeenCalledWith(expect.objectContaining({mainGenre:'comedy',subGenre:'romantic',title:'Comedy/Romantic'}));
});
it('Spanish built-in examples display Spanish, keep supported English query and never translate history',async()=>{
 localStorage.setItem('flicklet.search-history',JSON.stringify([{q:'Marvel history',ts:Date.now()}]));await language('es');const select=vi.fn();render(<SearchSuggestions query="Marvel" onSuggestionClick={select} onClose={()=>{}} isVisible/>);
 const example=await screen.findByRole('button',{name:'💡 Películas de Marvel'});fireEvent.click(example);expect(select).toHaveBeenCalledWith('Marvel movies',undefined,undefined);expect(screen.getAllByText('Marvel history').length).toBeGreaterThan(0);
});
it.each(['en','es'] as const)('%s Discovery authored empty/loading/error/sign-in states and contextual safe errors',async lang=>{
 await language(lang);const view=render(<DiscoveryPage/>);expect(screen.getByText(t('coreBuilding'))).toBeInTheDocument();state.loading=true;view.rerender(<DiscoveryPage/>);expect(screen.getByText(t('coreLoadingRecommendations'))).toBeInTheDocument();state.error='provider-secret';view.rerender(<DiscoveryPage/>);expect(screen.getByText(t('coreRecommendationsFailed'))).toBeInTheDocument();expect(screen.queryByText('provider-secret')).toBeNull();state.signedIn=false;view.rerender(<DiscoveryPage/>);expect(screen.getByText(t('coreSignInDiscover'))).toBeInTheDocument();cleanup();render(<ForYouErrorFallback isOnline={false} onRetry={()=>{}}/>);expect(screen.getByText(t('coreOfflineRecommendations'))).toBeInTheDocument();
});
it('tracked Search labels change live without refetching or changing the title',async()=>{
 render(<SearchResultCard item={item} index={0} onRemove={()=>{}}/>);await screen.findByText('On Netflix');await language('es');expect(screen.getByText('En Netflix')).toBeInTheDocument();expect(screen.getByText('Dark Winds (2022)')).toBeInTheDocument();expect(screen.getByText(/Género por confirmar/)).toBeInTheDocument();expect(screen.getByText(/Estado: Viendo ahora/)).toBeInTheDocument();expect(languageManager.getLanguage()).toBe('es');
});

it.each(['en','es'] as const)('%s core error fallback uses safe translated text and supports retry',async lang=>{
 await language(lang);vi.spyOn(console,'error').mockImplementation(()=>{});const reset=vi.fn();let broken=true;
 function Failure(){if(broken)throw new Error('private provider detail');return <p>Recovered</p>}
 render(<ErrorBoundary onReset={reset}><Failure/></ErrorBoundary>);
 expect(screen.getByRole('alert')).toHaveTextContent(t('coreGenericError'));expect(screen.queryByText('private provider detail')).toBeNull();
 broken=false;fireEvent.click(screen.getByRole('button',{name:t('coreRetry')}));expect(reset).toHaveBeenCalledOnce();expect(screen.getByText('Recovered')).toBeInTheDocument();
});

it('an existing Search failure switches language live without exposing provider details or changing the query',async()=>{
 render(<SearchResults query="my unchanged query"/>);
 await screen.findByText('⚠️ '+t('coreSearchFailed'));
 await language('es');expect(screen.getByText('⚠️ '+t('coreSearchFailed'))).toBeInTheDocument();
 expect(screen.getByText(t('coreSearchResults',{query:'my unchanged query'}))).toBeInTheDocument();expect(screen.queryByText('private provider detail')).toBeNull();
});
it('an existing logout failure switches language live and cancel retains the account',async()=>{
 render(<AccountButton/>);fireEvent.click(screen.getByRole('button',{name:t('coreLogOut')}));
 fireEvent.click((await screen.findByRole('alertdialog')).querySelectorAll('button')[1]);
 expect(await screen.findByRole('alert')).toHaveTextContent(t('coreLogoutFailed'));
 await language('es');expect(screen.getByRole('alert')).toHaveTextContent(t('coreLogoutFailed'));
 fireEvent.click(screen.getByRole('button',{name:t('coreCancel')}));expect(screen.queryByRole('alertdialog')).toBeNull();expect(screen.getByRole('button',{name:t('coreLogOut')})).toBeInTheDocument();
});
