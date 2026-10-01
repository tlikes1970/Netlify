import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DiscoveryPage from '../DiscoveryPage';
import CardV2 from '@/components/cards/CardV2';
import { Library } from '@/lib/storage';
const mocks = vi.hoisted(() => ({uid: 'user-a' as string | null, count: vi.fn(), toast: vi.fn(), canWrite:true, loading:false, error:null as string | null, recs:[{item:{id:'10',kind:'movie',title:'Discovery Movie',poster:'',year:2025,overview:undefined as string | undefined},score:0.7,reasons:[]}] }));
vi.mock('@/lib/auth', () => ({authManager: {getCurrentUser: () => mocks.uid ? {uid: mocks.uid} : null}}));
vi.mock('@/lib/readOnlyGuard', () => ({guardMutation: () => mocks.canWrite, notifyReadOnlyBlocked: vi.fn()}));
vi.mock('@/lib/customLists', async () => {
  const lists = [{id:'a',name:'List A',createdAt:1,itemCount:1}, {id:'b',name:'List B',createdAt:2,itemCount:1}];
  return {useCustomLists: () => ({customLists: lists,maxLists:3}), customListManager: {getListById: (id: string) => lists.find(l => l.id === id), setSelectedList: vi.fn(), updateItemCount: mocks.count}};
});
vi.mock('@/lib/settings', () => ({useSettings: () => ({layout:{episodeTracking:false}, personality:'Zen'}), getPersonalityText: () => 'Nothing here yet', DEFAULT_PERSONALITY:'Zen'}));
vi.mock('@/lib/language', () => ({useTranslations: () => ({wantToWatchAction:'Want to Watch',currentlyWatchingAction:'Watching',watchedAction:'Watched',notInterestedAction:'Not Interested'})}));
vi.mock('@/hooks/useDeviceDetection', () => ({useIsDesktop: () => ({isDesktop:false,ready:true})}));
vi.mock('@/hooks/useEntitlements', () => ({useEntitlements: () => ({hasFullAccess:true,isReadOnlyMode:false})}));
vi.mock('@/components/Toast', () => ({useToast: () => ({addToast:mocks.toast})}));
vi.mock('@/lib/tmdb', () => ({getTVShowDetails: vi.fn()}));
vi.mock('@/lib/shareLinks', () => ({shareListWithFallback: vi.fn(),shareShowWithFallback: vi.fn()}));
vi.mock('@/state/actions', () => ({getToastCallback: () => mocks.toast}));
vi.mock('@/lib/seriesReminders', () => ({isSeriesReminderEnabled: () => false}));
vi.mock('@/components/ListSelectorModal', () => ({default: () => <div role="dialog">Membership management</div>}));
vi.mock('@/components/OptimizedImage', () => ({OptimizedImage: () => <span>Poster fallback</span>}));
vi.mock('@/hooks/useAuth', () => ({useAuth: () => ({isAuthenticated:!!mocks.uid,user:mocks.uid?{uid:mocks.uid}:null})}));
vi.mock('@/hooks/useSmartDiscovery', () => ({useSmartDiscovery: () => ({recommendations:mocks.recs,isLoading:mocks.loading,error:mocks.error})}));
beforeEach(() => {
  mocks.uid=null;
  window.dispatchEvent(new Event('library:cleared'));
  localStorage.clear(); vi.clearAllMocks();
  mocks.uid='user-a';mocks.canWrite=true;mocks.loading=false;mocks.error=null;
  mocks.recs=[{item:{id:'10',kind:'movie',title:'Discovery Movie',poster:'',year:2025,overview:undefined as string | undefined},score:0.7,reasons:[]}];
  vi.spyOn(HTMLElement.prototype,'offsetHeight','get').mockReturnValue(240);
  vi.spyOn(HTMLElement.prototype,'offsetWidth','get').mockReturnValue(200);
});
afterEach(() => vi.restoreAllMocks());
async function menu() {
  fireEvent.click(screen.getByRole('button',{name:'More options'}));
  await screen.findByRole('menu');
}
describe('Discovery real card behavior', () => {
  it('has only Want to Watch and Watched primary controls, compact overflow and poster fallback', () => {
    render(<DiscoveryPage/>);
    expect(screen.getByRole('button',{name:'Want to Watch',exact:true})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Watched',exact:true})).toBeInTheDocument();
    for (const name of ['Watching','Not Interested','Delete','Custom Lists +']) expect(screen.queryByRole('button',{name,exact:true})).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.getByText('Poster fallback')).toBeInTheDocument();
    const trigger=screen.getByRole('button',{name:'More options'});
    expect(trigger.style.backgroundColor).toBe('transparent');
    expect(trigger.querySelectorAll('circle')).toHaveLength(3);
  });
  it('shows the existing overview without invented TV state or movie placeholders', () => {
    mocks.recs[0].item.overview='Existing concise synopsis';render(<DiscoveryPage/>);
    expect(screen.getByText('Existing concise synopsis')).toHaveClass('line-clamp-3');
    expect(screen.getByText('2025 • Movie')).toBeInTheDocument();
    expect(screen.queryByText(/RETURNING|ENDED|Next episode/)).toBeNull();
    expect(screen.getByRole('button',{name:'More options'}).closest('.cardv2-top-overflow')).not.toBeNull();
  });
  it('omits missing overview and does not invent TV episode or production state', () => {
    mocks.recs[0].item.kind='tv';render(<DiscoveryPage/>);
    expect(screen.getByText('2025 • TV Show')).toBeInTheDocument();
    expect(document.querySelector('.discovery-card-overview')).toBeNull();
    expect(screen.queryByText(/RETURNING|ENDED|Next episode/)).toBeNull();
  });
  it('groups available TV state and providers without inventing missing information', () => {
    render(<CardV2 item={{id:'tv-state',mediaType:'tv',title:'TV title',showStatus:'Returning Series',networks:['Seven Network'],synopsis:'Existing overview',voteAverage:8}} context="tab-foryou" secondaryWatching />);
    const row=document.querySelector('.discovery-state-providers');expect(row).toHaveTextContent('RETURNING');expect(row).toHaveTextContent('On Seven Network');
    expect(screen.getByLabelText('rating')).toHaveTextContent('8');expect(screen.getByText('Existing overview')).toHaveClass('line-clamp-3');
  });
  it('has no state/provider row for movies without reliable state and empty providers', () => {
    render(<CardV2 item={{id:'movie',mediaType:'movie',title:'Movie title',showStatus:'Returning Series',networks:[]}} context="tab-foryou" secondaryWatching />);
    expect(document.querySelector('.discovery-state-providers')).toBeNull();expect(screen.queryByText('RETURNING')).toBeNull();
  });
  it('Want to Watch saves wishlist and filters immediately without rating', () => {
    render(<DiscoveryPage/>);
    fireEvent.click(screen.getByRole('button',{name:'Want to Watch'}));
    expect(Library.getCurrentList('10','movie')).toBe('wishlist');
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.queryByRole('slider')).toBeNull();
  });
  it('Watched saves immediately, retains rating through refresh, then Not now filters without rating', () => {
    const {rerender}=render(<DiscoveryPage/>);
    fireEvent.click(screen.getByRole('button',{name:'Watched'}));
    expect(Library.getCurrentList('10','movie')).toBe('watched');
    expect(JSON.parse(localStorage.getItem('flicklet.library.v2')!)['movie:10'].list).toBe('watched');
    mocks.recs=[];mocks.loading=true;rerender(<DiscoveryPage/>);
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveClass('compact-user-rating');
    fireEvent.click(screen.getByRole('button',{name:'Not now'}));
    expect(screen.queryByRole('article')).toBeNull();
    expect(Library.getEntry('10','movie')?.userRating).toBeUndefined();
  });
  it('optional rating persists and filters while retaining two custom memberships', () => {
    render(<DiscoveryPage/>);
    fireEvent.click(screen.getByRole('button',{name:'Watched'}));
    const item=Library.getEntry('10','movie')!;
    act(() => {Library.addToCustomList(item,'a');Library.addToCustomList(item,'b');});
    fireEvent.keyDown(screen.getByRole('slider'),{key:'End'});
    expect(Library.getEntry('10','movie')).toMatchObject({list:'watched',userRating:5,customListIds:['a','b']});
    expect(screen.queryByRole('article')).toBeNull();
  });
  it('a blocked status change does not start the rating flow', () => {
    render(<DiscoveryPage/>);mocks.canWrite=false;
    fireEvent.click(screen.getByRole('button',{name:'Watched'}));
    expect(Library.has('10','movie')).toBe(false);
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
  it('a blocked rating write leaves the opportunity available', () => {
    render(<DiscoveryPage/>);fireEvent.click(screen.getByRole('button',{name:'Watched'}));
    mocks.canWrite=false;fireEvent.keyDown(screen.getByRole('slider'),{key:'End'});
    expect(Library.getCurrentList('10','movie')).toBe('watched');
    expect(Library.getEntry('10','movie')?.userRating).toBeUndefined();
    expect(screen.getByRole('slider')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Not now'}));
    expect(screen.queryByRole('article')).toBeNull();
  });
  it.each([['Watching','watching'],['Not Interested','not']] as const)('secondary %s saves its correct status and filters', async (name,status) => {
    render(<DiscoveryPage/>);await menu();
    expect(screen.queryByRole('menuitem',{name:'Remove from Library'})).toBeNull();
    fireEvent.click(screen.getByRole('menuitem',{name,exact:true}));
    expect(Library.getCurrentList('10','movie')).toBe(status);
    expect(screen.queryByRole('article')).toBeNull();
  });
  it('membership management is available in overflow', async () => {
    render(<DiscoveryPage/>);await menu();
    fireEvent.click(screen.getByRole('menuitem',{name:'Custom Lists',exact:true}));
    expect(screen.getByRole('dialog')).toHaveTextContent('Membership management');
  });
  it('external library updates immediately filter cards and cancel obsolete rating opportunities', () => {
    render(<DiscoveryPage/>);
    fireEvent.click(screen.getByRole('button',{name:'Watched'}));
    act(() => Library.move('10','movie','not'));
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.queryByRole('article')).toBeNull();
  });
  it('pending rating does not cross sign-out or another account', () => {
    const {rerender}=render(<DiscoveryPage/>);
    fireEvent.click(screen.getByRole('button',{name:'Watched'}));
    mocks.uid=null;rerender(<DiscoveryPage/>);
    expect(screen.getByRole('button',{name:'Sign In'})).toBeInTheDocument();
    expect(screen.queryByRole('slider')).toBeNull();
    mocks.uid='user-b';rerender(<DiscoveryPage/>);
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.queryByRole('article')).toBeNull();
  });
  it('signed-out sign-in path returns to Discovery after authentication', () => {
    mocks.uid=null;mocks.loading=true;
    const listener=vi.fn();window.addEventListener('auth:sign-in-required',listener);
    const {rerender}=render(<DiscoveryPage/>);
    fireEvent.click(screen.getByRole('button',{name:'Sign In'}));
    expect(listener).toHaveBeenCalledOnce();
    expect(screen.queryByRole('article')).toBeNull();
    mocks.uid='user-a';mocks.loading=false;rerender(<DiscoveryPage/>);
    expect(screen.getByRole('button',{name:'Want to Watch'})).toBeInTheDocument();
    window.removeEventListener('auth:sign-in-required',listener);
  });
  it('loading, error and empty messages do not contradict each other', () => {
    mocks.recs=[];mocks.loading=true;
    const {rerender}=render(<DiscoveryPage/>);
    expect(screen.getByText('Loading recommendations…')).toBeInTheDocument();
    expect(screen.queryByText('Building Your Recommendations')).toBeNull();
    mocks.loading=false;mocks.error='Failed';rerender(<DiscoveryPage/>);
    expect(screen.getByText('Failed to Load Recommendations')).toBeInTheDocument();
    expect(screen.queryByText('Building Your Recommendations')).toBeNull();
    mocks.error=null;rerender(<DiscoveryPage/>);
    expect(screen.getByText('Building Your Recommendations')).toBeInTheDocument();
  });
});
