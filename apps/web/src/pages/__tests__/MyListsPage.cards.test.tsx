import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyListsPage from '../MyListsPage';
import { Library } from '@/lib/storage';
const mocks = vi.hoisted(() => ({uid: null as string | null, count: vi.fn(), toast: vi.fn()}));
vi.mock('@/lib/auth', () => ({authManager: {getCurrentUser: () => mocks.uid ? {uid: mocks.uid} : null}}));
vi.mock('@/lib/readOnlyGuard', () => ({guardMutation: () => true, notifyReadOnlyBlocked: vi.fn()}));
vi.mock('@/lib/customLists', async () => {
  const lists = [{id:'a',name:'List A',createdAt:1,itemCount:1}, {id:'b',name:'List B',createdAt:2,itemCount:1}];
  return {useCustomLists: () => ({customLists: lists,maxLists:3}), customListManager: {getListById: (id: string) => lists.find(l => l.id === id), setSelectedList: vi.fn(), updateItemCount: mocks.count}};
});
vi.mock('@/lib/settings', () => ({useSettings: () => ({layout:{episodeTracking:false}, personality:'Zen'}), getPersonalityText: () => 'Nothing here yet', DEFAULT_PERSONALITY:'Zen'}));
vi.mock('@/lib/language', async (importOriginal) => ({...await importOriginal<typeof import("@/lib/language")>(),useTranslations: () => ({wantToWatchAction:'Want to Watch',currentlyWatchingAction:'Watching',notesAndTags:'Notes & Tags',watchedAction:'Watched',notInterestedAction:'Not Interested'})}));
vi.mock('@/hooks/useDeviceDetection', () => ({useIsDesktop: () => ({isDesktop:false,ready:true}),useIsMobileScreen:()=>true}));
vi.mock('@/hooks/useEntitlements', () => ({useEntitlements: () => ({hasFullAccess:true,isReadOnlyMode:false})}));
vi.mock('@/components/Toast', () => ({useToast: () => ({addToast:mocks.toast})}));
vi.mock('@/lib/tmdb', () => ({getTVShowDetails: vi.fn()}));
vi.mock('@/lib/shareLinks', () => ({shareListWithFallback: vi.fn(),shareShowWithFallback: vi.fn()}));
vi.mock('@/state/actions', () => ({getToastCallback: () => mocks.toast}));
vi.mock('@/lib/seriesReminders', () => ({isSeriesReminderEnabled: () => false}));
vi.mock('@/components/ListSelectorModal', () => ({default: () => <div role="dialog">Membership management</div>}));
vi.mock('@/components/OptimizedImage', () => ({OptimizedImage: () => <span>Poster fallback</span>}));
const item = {id:'10',mediaType:'movie' as const,title:'A long custom list title',userRating:3};
beforeEach(() => {
  window.dispatchEvent(new Event('library:cleared'));
  localStorage.clear();
  mocks.uid = null;
  vi.clearAllMocks();
  vi.spyOn(window,'confirm').mockReturnValue(true);
  // jsdom has no layout; provide panel measurements for the real placement guard.
  vi.spyOn(HTMLElement.prototype,'offsetHeight','get').mockReturnValue(240);
  vi.spyOn(HTMLElement.prototype,'offsetWidth','get').mockReturnValue(200);
});
afterEach(() => vi.restoreAllMocks());
function setup(status: 'watching' | 'wishlist' | 'watched' | 'not' = 'watched') {
  Library.upsert(item,status);
  Library.addToCustomList(item,'a');
  Library.addToCustomList(item,'b');
  return render(<MyListsPage/>);
}
async function openMenu() { fireEvent.click(screen.getByRole('button',{name:'More options'})); await screen.findByRole('menu'); }
describe('mobile Custom List cards', async () => {
  it('omits redundant Not Interested while retaining legitimate restore destinations', async () => { setup('not'); await openMenu(); expect(screen.queryByRole('menuitem',{name:'Not Interested',exact:true})).toBeNull(); expect(screen.getByRole('menuitem',{name:'Watched',exact:true})).toBeInTheDocument(); expect(screen.getByRole('button',{name:'Watching',exact:true})).toBeInTheDocument(); expect(screen.getByRole('button',{name:'Want to Watch',exact:true})).toBeInTheDocument(); });
  it.each(['watching','wishlist','watched','not'] as const)('shows contextual destinations for %s without permanent legacy controls', status => {
    setup(status);
    expect(screen.getByRole('combobox',{name:'Select a custom list'})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Custom Lists +'})).toBeNull();
    expect(screen.queryByRole('button',{name:'Watched',exact:true})).toBeNull();
    expect(screen.queryByRole('button',{name:'Not Interested',exact:true})).toBeNull();
    expect(screen.queryByRole('button',{name:'Watching',exact:true}) !== null).toBe(status !== 'watching');
    expect(screen.queryByRole('button',{name:'Want to Watch',exact:true}) !== null).toBe(status !== 'wishlist');
    const trigger=screen.getByRole('button',{name:'More options'});
    expect(trigger.style.backgroundColor).toBe('transparent');
    expect(trigger).toHaveStyle({width:'44px',height:'44px'});
    expect(trigger.querySelectorAll('circle')).toHaveLength(3);
    expect(screen.getByRole('slider')).toHaveClass('compact-user-rating');
  });
  it('updates contextual buttons immediately and retains both memberships', async () => {
    setup('watched');
    fireEvent.click(screen.getByRole('button',{name:'Watching',exact:true}));
    expect(Library.getEntry('10','movie')).toMatchObject({list:'watching',customListIds:['a','b']});
    expect(screen.queryByRole('button',{name:'Watching',exact:true})).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Want to Watch',exact:true}));
    expect(Library.getEntry('10','movie')).toMatchObject({list:'wishlist',customListIds:['a','b']});
    expect(screen.queryByRole('button',{name:'Want to Watch',exact:true})).toBeNull();
    expect(screen.getByRole('button',{name:'Watching',exact:true})).toBeInTheDocument();
  });
  it('offers Watched, Not Interested, membership management and current-list removal only in overflow', async () => {
    setup(); await openMenu();
    expect(screen.getByRole('menuitem',{name:'Watched',exact:true})).toBeInTheDocument();
    expect(screen.getByRole('menuitem',{name:'Not Interested',exact:true})).toBeInTheDocument();
    expect(screen.getByRole('menuitem',{name:'Remove from this List',exact:true})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Remove from Library'})).toBeNull();
    fireEvent.click(screen.getByRole('menuitem',{name:'Add to Lists',exact:true}));
    expect(screen.getByRole('dialog')).toHaveTextContent('Membership management');
  });
  it('secondary status actions keep both memberships', async () => {
    setup('watching'); await openMenu();
    fireEvent.click(screen.getByRole('menuitem',{name:'Watched',exact:true}));
    expect(Library.getEntry('10','movie')).toMatchObject({list:'watched',customListIds:['a','b']});
    await openMenu(); fireEvent.click(screen.getByRole('menuitem',{name:'Not Interested',exact:true}));
    expect(Library.getEntry('10','movie')).toMatchObject({list:'not',customListIds:['a','b']});
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
  it('removes only current membership, updates the empty list, persists and notifies cloud sync', async () => {
    setup('watching'); mocks.uid='current-user';
    const event=vi.fn();window.addEventListener('library:changed',event);
    await openMenu();fireEvent.click(screen.getByRole('menuitem',{name:'Remove from this List',exact:true}));
    expect(window.confirm).toHaveBeenCalledWith('Remove “A long custom list title” from this custom list?');
    expect(Library.getEntry('10','movie')).toMatchObject({list:'watching',customListIds:['b'],userRating:3});
    expect(Library.getByList('custom:a')).toHaveLength(0);
    expect(Library.getByList('custom:b')).toHaveLength(1);
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('flicklet.library.v2')!)['movie:10']).toMatchObject({list:'watching',customListIds:['b']});
    expect(event.mock.calls[0][0].detail).toEqual({uid:'current-user',operation:'customListRemove'});
    window.removeEventListener('library:changed',event);
  });
  it('keeps the card when removal is cancelled', async () => {
    setup(); vi.mocked(window.confirm).mockReturnValue(false); await openMenu();
    fireEvent.click(screen.getByRole('menuitem',{name:'Remove from this List',exact:true}));
    expect(Library.getEntry('10','movie')?.customListIds).toEqual(['a','b']);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
  it('keeps rating keyboard and touch interaction functional', async () => {
    setup();fireEvent.keyDown(screen.getByRole('slider'),{key:'ArrowRight'});
    expect(Library.getEntry('10','movie')?.userRating).toBe(3.5);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow','3.5');
    const stars=screen.getByRole('slider').querySelectorAll('button');
    fireEvent.click(stars[4],{clientX:20});
    expect(Library.getEntry('10','movie')?.userRating).toBe(5);
  });
  it('retains the existing empty state', async () => {
    render(<MyListsPage/>);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.queryByRole('article')).toBeNull();
  });
});

it('custom-list Notes & Tags opens canonical editor and preserves status and memberships',async()=>{
 Library.upsert({...item,userNotes:'Old',tags:['Family']},'watching');Library.addToCustomList(item,'a');Library.addToCustomList(item,'b');
 const edit=vi.fn(entry=>Library.updateNotesAndTags(entry.id,entry.mediaType,'New',['Comedy']));
 render(<MyListsPage onNotesEdit={edit}/>);await openMenu();
 fireEvent.click(screen.getByRole('menuitem',{name:'Notes & Tags'}));
 expect(edit).toHaveBeenCalled();expect(Library.getEntry(item.id,item.mediaType)).toMatchObject({userNotes:'New',tags:['Comedy'],list:'watching',customListIds:['a','b']});
});

it('uses the saved-title information and cues without a TMDB score or swipe',()=>{
 const edit=vi.fn();Library.upsert({...item,year:'2025',synopsis:'Saved synopsis',voteAverage:8.3,userNotes:'Saved note',tags:['Family']},'watching');Library.addToCustomList(item,'a');
 const {container}=render(<MyListsPage onNotesEdit={edit}/>);
 expect(screen.getByText('2025 • Movie')).toBeInTheDocument();expect(screen.getByText('Saved synopsis')).toBeInTheDocument();
 expect(screen.queryByText(/8\.3/)).toBeNull();expect(container.querySelector('.swipeable')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Note: Notes & Tags'}));fireEvent.click(screen.getByRole('button',{name:'Tags: Notes & Tags'}));
 expect(edit).toHaveBeenCalledTimes(2);expect(Library.getEntry('10','movie')).toMatchObject({list:'watching',customListIds:['a'],userNotes:'Saved note',tags:['Family']});
});
