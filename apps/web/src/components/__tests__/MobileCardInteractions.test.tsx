import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TabCard from "../cards/TabCard";
import { ContextStatusActions } from "../cards/mobile/ContextStatusActions";
import { SearchResultCard } from "../../search/SearchResults";
import CardV2 from "../cards/CardV2";
import SearchResults from "../../search/SearchResults";
import { TitlePoster, getTitleResearchUrl } from "../cards/TitlePoster";
import { MetadataIndicators } from "../cards/MetadataIndicators";
import type { MediaItem } from "../cards/card.types";
const mocks = vi.hoisted(() => ({
  search: vi.fn(),
  entry: null as any,
  move: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/search/smartSearch", () => ({ smartSearch: mocks.search }));
vi.mock("@/lib/statusTransitions", () => ({ setPrimaryStatus: mocks.move }));
vi.mock("@/lib/storage", () => ({
  getListDisplayName: (list: string) => ({watching: "Watching", wishlist: "Want to Watch", watched: "Watched", not: "Not Interested"})[list as "watching"],
  Library: {
    getEntry: () => mocks.entry,
    getCurrentList: () => mocks.entry?.list ?? null,
    has: () => !!mocks.entry,
    subscribe: () => () => {},
    getAll: () => [],
    updateRating: vi.fn(),
  },
  addToListWithConfirmation: mocks.add,
}));
vi.mock("@/lib/language", async (importOriginal) => ({...await importOriginal<typeof import("@/lib/language")>(),
  useTranslations: () => ({
    searchCorrection: "Showing results for “{query}”",
    notesAndTags: "Notes & Tags",
    wantToWatchAction: "Want to Watch",
    currentlyWatchingAction: "Watching",
    watchedAction: "Watched",
    notInterestedAction: "Not Interested",
    manageCurrentlyWatchingAction: "Manage Currently Watching",
  }),
}));
vi.mock("@/lib/settings", () => ({
  useSettings: () => ({
    layout: { episodeTracking: false },
    personality: "Zen",
  }),
  getPersonalityText: () => "",
  DEFAULT_PERSONALITY: "Zen",
}));
vi.mock("@/hooks/useEntitlements", () => ({
  useEntitlements: () => ({ hasFullAccess: true, isReadOnlyMode: false }),
}));
vi.mock("@/hooks/useDeviceDetection", () => ({ useIsDesktop: () => ({ready:true,isDesktop:false}) }));
vi.mock("@/lib/isMobile", () => ({
  isMobileNow: () => true,
  onMobileChange: () => () => {},
}));
vi.mock("@/search/api", () => ({
  fetchNetworkInfo: async () => ({}),
  fetchFullMediaMetadata: async (item: any) => item,
  discoverByGenre: vi.fn(),
}));
vi.mock("@/tmdb/tv", () => ({
  fetchNextAirDate: vi.fn(),
  fetchShowStatus: vi.fn(),
}));
vi.mock("@/lib/seriesReminders", () => ({
  isSeriesReminderEnabled: () => false,
}));
vi.mock("@/components/OptimizedImage", () => ({ OptimizedImage: () => null }));
vi.mock("@/components/MyListToggle", () => ({
  default: () => <button>Custom Lists +</button>,
}));
vi.mock("@/features/compact/CompactOverflowMenu", () => ({
  CompactOverflowMenu: () => <button aria-label="More options">⋮</button>,
}));
vi.mock("@/features/compact/CompactPrimaryAction", () => ({
  CompactPrimaryAction: () => <button>Duplicate status</button>,
}));
vi.mock("@/components/EpisodeProgressDisplay", () => ({
  EpisodeProgressDisplay: () => null,
}));
vi.mock("@/lib/tmdb", () => ({ getTVShowDetails: vi.fn() }));
const item: MediaItem = {
  id: "1",
  mediaType: "movie",
  title: "A title",
  year: "2025",
  synopsis: "Summary",
};
beforeEach(() => {
  mocks.entry = null;
  vi.clearAllMocks();
});
describe("contextual status buttons", () => {
  it.each([
    [
      "watching",
      "Want to Watch",
      "wishlist",
      "Watched",
      "watched",
    ],
    ["want", "Watching", "watching", "Watched", "watched"],
    [
      "watched",
      "Watching",
      "watching",
      "Want to Watch",
      "wishlist",
    ],
  ] as const)(
    "shows only the two destinations for %s",
    (tab, a, target, b, targetB) => {
      render(<ContextStatusActions item={item} tabKey={tab} />);
      expect(screen.getAllByRole("button")).toHaveLength(2);
      fireEvent.click(screen.getByRole("button", { name: a }));
      expect(mocks.move).toHaveBeenCalledWith(item, target, { feedback: true });
      fireEvent.click(screen.getByRole("button", { name: b }));
      expect(mocks.move).toHaveBeenCalledWith(item, targetB, {
        feedback: true,
      });
      expect(screen.queryByRole("combobox")).toBeNull();
    },
  );
  it("custom cards expose Watching and Want and retain a rating", () => {
    render(
      <CardV2
        item={item}
        context="tab-watching"
        currentListContext="custom:one"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Watching" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Want to Watch" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.queryByText("Custom Lists +")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
  it("For You exposes only Want and Watched, plus overflow", () => {
    render(<CardV2 item={item} context="tab-foryou" />);
    expect(
      screen.getByRole("button", { name: "Want to Watch" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Watched" })).toBeInTheDocument();
    expect(screen.queryByText("Custom Lists +")).toBeNull();
    expect(screen.queryByText("Duplicate status")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
describe("mobile Search", () => {
  it("untracked title has no permanent status buttons and offers add destinations in overflow", () => {
    render(<SearchResultCard item={item} index={0} onRemove={() => {}} />);
    expect(
      screen.queryByRole("button", { name: "Watching" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Manage" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    for (const name of [
      "Watching",
      "Want to Watch",
      "Watched",
      "Custom Lists +",
    ])
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Not Interested" })).toBeNull();
  });
  it("tracked title shows status and Manage without duplicate status buttons in overflow", () => {
    mocks.entry = { ...item, list: "watched", userRating: 3 };
    render(
      <SearchResultCard
        item={item}
        index={0}
        onRemove={() => {}}
        actions={{ onDelete: mocks.remove }}
      />,
    );
    expect(screen.getByText("Status: Watched")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Watched", exact: true }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      screen.getByRole("button", { name: "Custom Lists +" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Want to Watch" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    expect(screen.queryByText(/Shows Like This/)).toBeNull();
    expect(screen.getByText(/Extras/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Notes & Tags/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove from Library" }),
    );
    expect(mocks.remove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" }),
    );
    expect(screen.queryByText("Remove from List")).toBeNull();
  });
});

it.each([['watching', 'Watching'], ['wishlist', 'Want to Watch'], ['watched', 'Watched'], ['not', 'Not Interested']])('Search displays canonical %s status', (list, label) => {
  mocks.entry = {...item, list};
  render(<SearchResultCard item={item} index={0} onRemove={() => {}} />);
  expect(screen.getByText('Status: ' + label)).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Manage'})).toBeInTheDocument();
});

describe('card consistency contract', () => {
 it.each(['movie','tv'] as const)('poster keeps exact %s identity and keyboard link', mediaType => {
  const open=vi.spyOn(window,'open').mockReturnValue(null);
  render(<TitlePoster item={{...item,mediaType}}/>);
  const link=screen.getByRole('link',{name:'View A title on TMDB'});
  expect(link).toHaveAttribute('href',`https://www.themoviedb.org/${mediaType}/1`);
  fireEvent.click(link);expect(open).toHaveBeenCalledWith(`https://www.themoviedb.org/${mediaType}/1`,'_blank','noopener,noreferrer');
  open.mockRestore();
 });
 it.each(['0','-1','abc','1.5'])('does not invent research identity for %s', id=>{
  expect(getTitleResearchUrl({...item,id})).toBeUndefined();
 });
 it('does not invent a destination for person media',()=>expect(getTitleResearchUrl({...item,mediaType:'person'})).toBeUndefined());
 it.each([undefined,0,NaN,-1])('Search renders no missing/invalid TMDB score %s',voteAverage=>{
  render(<SearchResultCard item={{...item,voteAverage}} index={0} onRemove={()=>{}}/>);
  expect(screen.queryByText(/TMDB.*\/10/)).toBeNull();expect(screen.queryByText('0')).toBeNull();
 });
 it('Search labels meaningful TMDB score and omits personal metadata cues',()=>{
  mocks.entry={...item,userNotes:'Saved note',tags:['Family'],list:'watched'};
  render(<SearchResultCard item={{...item,voteAverage:7.3}} index={0} onRemove={()=>{}}/>);
  expect(screen.getByText('TMDB 7.3/10')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/Note:|Tags:/})).toBeNull();
 });
 it.each([[undefined,undefined,0],['Note',undefined,1],[undefined,['Tag'],1],['Note',['Tag'],2]] as const)('only renders present metadata indicators', (userNotes,tags,count)=>{
  const edit=vi.fn();render(<MetadataIndicators item={{...item,userNotes,tags:tags ? [...tags]:undefined}} actions={{onNotesEdit:edit}}/>);
  expect(screen.queryAllByRole('button')).toHaveLength(count);
  if(count){fireEvent.click(screen.getAllByRole('button')[0]);expect(edit).toHaveBeenCalledWith(expect.objectContaining({id:'1',mediaType:'movie'}));}
 });
 it('visible Search removal distinguishes a movie and TV with matching numeric ID', async()=>{
  mocks.add.mockImplementation((_item,_list,done)=>done());
  render(<SearchResults query="" resolvedItems={[{...item,id:'73',title:'Movie collision'},{...item,id:'73',mediaType:'tv',title:'TV collision'}]}/>);
  await screen.findByText('Movie collision (2025)');
  const card=screen.getByText('Movie collision (2025)').closest('.relative.flex')!;
  fireEvent.click(within(card as HTMLElement).getByRole('button',{name:'More actions'}));
  fireEvent.click(screen.getByRole('button',{name:'Want to Watch'}));
  await waitFor(()=>expect(screen.queryByText('Movie collision (2025)')).toBeNull());
  expect(screen.getByText('TV collision (2025)')).toBeInTheDocument();
 });
});

describe("search correction and request ordering", () => {
  it("shows correction and retains the original query", async () => {
    mocks.search.mockImplementation(async (term: string) => ({items: term === "Braking Bad" ? [] : [{...item,title:"Breaking Bad"}],page:1,totalPages:1}));
    render(<SearchResults query="Braking Bad"/>);
    expect(await screen.findByRole("status")).toHaveTextContent("Showing results for “Breaking Bad”");
    expect(screen.getByRole("heading", {name:'Search results for "Braking Bad"'})).toBeVisible();
  });
  it("ignores stale completion and clears results", async () => {
    let finish!: (value: any) => void;
    mocks.search.mockImplementation((term: string) => term === "Old search" ? new Promise(resolve => {finish=resolve}) : Promise.resolve({items:[{...item,title:term}],page:1,totalPages:1}));
    const view=render(<SearchResults query="Old search"/>);
    view.rerender(<SearchResults query="New search"/>);
    expect(await screen.findByText("New search (2025)")).toBeVisible();
    finish({items:[{...item,title:"Old search"}],page:1,totalPages:1});
    await waitFor(() => expect(screen.queryByText("Old search (2025)")).toBeNull());
    view.rerender(<SearchResults query=""/>);
    expect(screen.queryByText("New search (2025)")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});

it.each(["movie", "tv"] as const)("keeps the %s-only filter during correction", async mediaType => {
  mocks.search.mockImplementation(async (term: string) => ({items: term === "Braking Bad" ? [] : [
    {...item,id:"7",title:"Breaking Bad",mediaType:"movie"},
    {...item,id:"7",title:"Breaking Bad",mediaType:"tv"}
  ],page:1,totalPages:1}));
  render(<SearchResults query="Braking Bad" searchType="movies-tv" mediaTypeFilter={mediaType}/>);
  expect(await screen.findByRole("status")).toBeVisible();
  expect(screen.getAllByLabelText("View Breaking Bad on TMDB")).toHaveLength(1);
  expect(screen.getByLabelText("View Breaking Bad on TMDB")).toHaveAttribute("href",`https://www.themoviedb.org/${mediaType}/7`);
});

describe('touch saved-card glow production path', () => {
  it.each(['watching','want','watched'] as const)('retains %s glow and actions', tabType => {
    const action=vi.fn();
    const {container}=render(<TabCard item={{...item,posterUrl:'https://example.com/mobile.jpg'}} tabType={tabType} actions={{onWatched:action,onWant:action,onWatching:action}}/>);
    expect(container.querySelector('.card-mobile > .card-poster-glow')).toHaveAttribute('aria-hidden','true');
    expect((container.querySelector('.card-poster-glow > span') as HTMLElement).style.backgroundImage).toContain('mobile.jpg');
    const button=screen.getByRole('button',{name:tabType==='watched'?'Watching':'Watched',exact:true});
    fireEvent.click(button);
    expect(mocks.move).toHaveBeenCalledOnce();
  });
});
