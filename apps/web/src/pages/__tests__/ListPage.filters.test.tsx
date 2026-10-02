import {act,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import ListPage from '../ListPage';
import {Library,useLibrary} from '@/lib/storage';
import {restoreTabState,saveTabState} from '@/lib/tabState';
import {loadTabStateFromFirebase} from '@/lib/tabStateSync';
import type {LibraryEntry} from '@/lib/storage';
vi.mock('@/lib/auth',()=>({authManager:{getCurrentUser:()=>null}}));
vi.mock('@/lib/readOnlyGuard',()=>({guardMutation:()=>true}));
vi.mock('@/lib/customLists',()=>({customListManager:{updateItemCount:vi.fn()}}));
const cloud=vi.hoisted(()=>({state:{} as Record<string,unknown>}));
vi.mock('@/lib/firebaseBootstrap',()=>({db:{}}));
vi.mock('firebase/firestore',()=>({doc:vi.fn(),setDoc:vi.fn(),collection:vi.fn(),getDocs:async()=>({empty:false,forEach:(fn: (d:unknown)=>void)=>fn({id:'watching',data:()=>cloud.state})})}));
vi.mock('@/utils/backfillSynopsis',()=>({backfillSynopsisForItems:vi.fn()}));
vi.mock('@/lib/settings',()=>({useSettings:()=>({personalityLevel:2,layout:{}}),resolveFlickletLine:()=> 'This status is empty.'}));
vi.mock('@/components/WatchingListWithBackdrop',()=>({WatchingListWithBackdrop:({children}: {children:React.ReactNode})=><div>{children}</div>}));
vi.mock('@/components/modals/EpisodeTrackingModal',()=>({EpisodeTrackingModal:()=>null}));
vi.mock('@/components/cards/TabCard',()=>({default:({item,onKeyboardReorder}: {item:LibraryEntry,onKeyboardReorder:(direction:'up'|'down')=>void})=><div data-testid="filtered-title">{item.title}<button onClick={()=>onKeyboardReorder('down')}>Reorder {item.title}</button></div>}));
const entries:LibraryEntry[]=[
 {id:'1',title:'Alpha',mediaType:'tv',list:'watching',addedAt:1,networks:['Netflix'],tags:['family']},
 {id:'2',title:'Beta',mediaType:'movie',list:'watching',addedAt:2,tags:['family']},
 {id:'3',title:'Charlie',mediaType:'tv',list:'watching',addedAt:3,networks:['NETFLIX','HBO'],tags:['drama']},
 {id:'4',title:'Delta',mediaType:'tv',list:'watching',addedAt:4,networks:['ABC'],tags:['family']},
];
const titles=()=>screen.queryAllByTestId('filtered-title').map(el=>el.textContent?.split('Reorder')[0]);
function Harness(){const items=useLibrary('watching',{includeItemUpdates:true});return <ListPage title="Watching" items={items}/>;}
function network(name:string){fireEvent.click(screen.getByRole('button',{name:/^Network/}));fireEvent.click(screen.getByRole('checkbox',{name,exact:true}));fireEvent.click(screen.getByRole('button',{name:'Done'}));}
function seed(){let now=100;vi.spyOn(Date,'now').mockImplementation(()=>now++);entries.forEach(item=>Library.upsert(item,'watching'));}
afterEach(()=>vi.restoreAllMocks());
beforeEach(()=>{localStorage.clear();window.dispatchEvent(new Event('library:cleared'));});
describe('real Library filter toolbar',()=>{
 it('associates labels and exposes Network dialog state/Escape focus',()=>{
  render(<ListPage title="Watching" items={entries}/>);
  expect(screen.getByLabelText('Sort:')).toHaveValue('date-newest');expect(screen.getByLabelText('Type:')).toHaveValue('all');expect(screen.getByLabelText('Filter by tag')).toHaveValue('');
  const trigger=screen.getByRole('button',{name:/^Network/});expect(trigger).toHaveAttribute('aria-expanded','false');fireEvent.click(trigger);
  const dialog=screen.getByRole('dialog',{name:'Select networks'});expect(trigger).toHaveAttribute('aria-controls',dialog.id);expect(trigger).toHaveAttribute('aria-expanded','true');
  expect(screen.getByRole('checkbox',{name:'ABC'})).toHaveFocus();fireEvent.keyDown(dialog,{key:'Escape'});expect(screen.queryByRole('dialog')).toBeNull();expect(trigger).toHaveFocus();
 });
 it('filters Type AND Network AND Tag, and clear preserves sort',()=>{
  render(<ListPage title="Watching" items={entries}/>);
  fireEvent.change(screen.getByLabelText('Sort:'),{target:{value:'alphabetical-za'}});
  fireEvent.change(screen.getByLabelText('Type:'),{target:{value:'tv'}});network('Netflix');
  fireEvent.change(screen.getByLabelText('Filter by tag'),{target:{value:'family'}});expect(titles()).toEqual(['Alpha']);
  fireEvent.click(screen.getByRole('button',{name:'Clear Filters'}));expect(titles()).toEqual(['Delta','Charlie','Beta','Alpha']);expect(screen.getByLabelText('Sort:')).toHaveValue('alphabetical-za');expect(screen.getByLabelText('Filter by tag')).toHaveValue('');
  expect(restoreTabState('watching').filter).toEqual({type:'all',providers:[]});
 });
 it('Network OR matches multiple options and Clear Networks keeps Type',()=>{
  render(<ListPage title="Watching" items={entries}/>);fireEvent.change(screen.getByLabelText('Type:'),{target:{value:'tv'}});network('Netflix');network('ABC');expect(titles()).toEqual(['Delta','Charlie','Alpha']);
  fireEvent.click(screen.getByRole('button',{name:/^Network/}));fireEvent.click(screen.getByRole('button',{name:'Clear Networks'}));fireEvent.click(screen.getByRole('button',{name:'Done'}));expect(screen.getByLabelText('Type:')).toHaveValue('tv');
 });
 it('tag sorting keeps Type/Network enabled and does not blame tags for zero results',()=>{
  render(<ListPage title="Watching" items={entries}/>);fireEvent.click(screen.getByRole('checkbox',{name:'Sort by tag'}));expect(screen.getByLabelText('Type:')).toBeEnabled();expect(screen.getByRole('button',{name:/^Network/})).toBeEnabled();
  fireEvent.change(screen.getByLabelText('Type:'),{target:{value:'movie'}});network('Netflix');expect(screen.getByText('No items match your filters')).toBeInTheDocument();expect(screen.queryByText('No items with tags found')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Clear Filters'}));expect(screen.getByRole('checkbox',{name:'Sort by tag'})).toBeChecked();expect(titles()).toHaveLength(4);
 });
 it('distinguishes truly empty status from tag-specific zero results',()=>{
  const view=render(<ListPage title="Watching" items={[]}/>);expect(screen.getByText('This status is empty.')).toBeInTheDocument();view.rerender(<ListPage title="Watching" items={entries}/>);
  fireEvent.change(screen.getByLabelText('Type:'),{target:{value:'movie'}});fireEvent.change(screen.getByLabelText('Filter by tag'),{target:{value:'drama'}});expect(screen.getByText('No items match your filters')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Type:'),{target:{value:'all'}});view.rerender(<ListPage title="Watching" items={entries.filter(x=>x.id!=='3')}/>);expect(screen.getByText('No items found with tag "drama"')).toBeInTheDocument();
 });
 it('Clear Filters and changing sort preserve saved Custom Order',async()=>{
  await saveTabState('watching',{sort:'custom',order:{mode:'custom',ids:['3:tv','1:tv','4:tv','2:movie']}});
  render(<ListPage title="Watching" items={entries}/>);expect(titles()).toEqual(['Charlie','Alpha','Delta','Beta']);network('Netflix');fireEvent.click(screen.getByRole('button',{name:'Clear Filters'}));expect(titles()).toEqual(['Charlie','Alpha','Delta','Beta']);
  fireEvent.change(screen.getByLabelText('Sort:'),{target:{value:'date-oldest'}});fireEvent.change(screen.getByLabelText('Sort:'),{target:{value:'custom'}});expect(titles()).toEqual(['Charlie','Alpha','Delta','Beta']);expect(restoreTabState('watching').order.ids).toHaveLength(4);
 });
 it('restores persisted state on remount',async()=>{
  const view=render(<ListPage title="Watching" items={entries}/>);fireEvent.change(screen.getByLabelText('Sort:'),{target:{value:'alphabetical-az'}});network('Netflix');view.unmount();render(<ListPage title="Watching" items={entries}/>);expect(titles()).toEqual(['Alpha','Charlie']);expect(screen.getByLabelText('Sort:')).toHaveValue('alphabetical-az');
 });
 it('mounted tab immediately consumes restored state including custom order',async()=>{
  render(<ListPage title="Watching" items={entries}/>);
  fireEvent.click(screen.getByRole('checkbox',{name:'Sort by tag'}));
  cloud.state={tabKey:'watching',sort:'custom',filter:{type:'tv',providers:['netflix']},order:{mode:'custom',ids:['1:tv','3:tv']}};
  await act(()=>loadTabStateFromFirebase('signed-in-user'));
  expect(screen.getByRole('checkbox',{name:'Sort by tag'})).not.toBeChecked();expect(titles()).toEqual(['Alpha','Charlie']);expect(screen.getByLabelText('Sort:')).toHaveValue('custom');expect(screen.getByLabelText('Type:')).toHaveValue('tv');
 });
 it('metadata-only updates refresh tags, networks and visible results',()=>{
  seed();render(<Harness/>);network('Netflix');expect(titles()).toEqual(['Charlie','Alpha']);
  act(()=>{Library.upsert({...entries[2],networks:['PBS']},'watching');Library.updateNotesAndTags('3','tv','',['newtag']);});expect(titles()).toEqual(['Alpha']);expect(within(screen.getByLabelText('Filter by tag')).getByRole('option',{name:'newtag'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:/^Network/}));expect(screen.getByRole('checkbox',{name:'PBS'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Done'}));
  act(()=>{Library.upsert({...entries[1],networks:['Netflix']},'watching');Library.updateNotesAndTags('2','movie','',['newtag']);});expect(titles()).toEqual(['Beta','Alpha']);
 });
 it('filtered keyboard reorder moves the intended identities without changing dates',()=>{
  seed();render(<Harness/>);fireEvent.change(screen.getByLabelText('Sort:'),{target:{value:'date-oldest'}});network('Netflix');
  const before=Library.getByList('watching').map(x=>[x.id,x.addedAt]);fireEvent.click(screen.getByRole('button',{name:'Reorder Alpha'}));expect(titles()).toEqual(['Charlie','Alpha']);
  expect(restoreTabState('watching').order.ids).toEqual(['3:tv','2:movie','1:tv','4:tv']);expect(Library.getByList('watching').map(x=>[x.id,x.addedAt])).toEqual(before);
 });
});

it('unfiltered reorder saves complete identities and preserves entries',()=>{
  seed();const before=JSON.stringify(Library.getByList('watching'));
  Library.reorder('watching',0,3);
  expect(restoreTabState('watching').order.ids).toEqual(['2:movie','3:tv','4:tv','1:tv']);
  expect(JSON.stringify(Library.getByList('watching'))).toBe(before);
});
it('live tag predicates refresh after a tag-only edit',()=>{
  seed();render(<Harness/>);fireEvent.change(screen.getByLabelText('Filter by tag'),{target:{value:'family'}});
  expect(titles()).toEqual(['Delta','Beta','Alpha']);
  act(()=>Library.updateNotesAndTags('1','tv','',['drama']));expect(titles()).toEqual(['Delta','Beta']);
});

it('keeps a removed active tag visible and clearable',()=>{
 const view=render(<ListPage title="Watching" items={entries}/>);
 fireEvent.change(screen.getByLabelText('Filter by tag'),{target:{value:'family'}});
 view.rerender(<ListPage title="Watching" items={entries.map(x=>({...x,tags:[]}))}/>);
 expect(screen.getByLabelText('Filter by tag')).toHaveValue('family');expect(screen.getByText('No items found with tag "family"')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Clear Filters'}));expect(titles()).toHaveLength(4);
});
