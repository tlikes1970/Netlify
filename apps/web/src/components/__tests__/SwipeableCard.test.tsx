import { CompactOverflowMenu } from '@/features/compact/CompactOverflowMenu';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import SwipeableCard from '../SwipeableCard';
import { setPrimaryStatus } from '@/lib/statusTransitions';
import type { MediaItem } from '../cards/card.types';

const device = vi.hoisted(() => ({isDesktop:false}));
vi.mock('@/hooks/useDeviceDetection', () => ({useIsDesktop: () => device}));
vi.mock('@/utils/scrollFeatureFlags', () => ({isScrollFeatureEnabled: () => false}));
vi.mock('@/lib/statusTransitions', () => ({setPrimaryStatus:vi.fn()}));

let frame: FrameRequestCallback;
let pointerDescriptor: PropertyDescriptor | undefined;
const item={id:1,title:'Example',mediaType:'tv'} as MediaItem;
function hint() { return screen.getByText('Swipe for actions').parentElement!.parentElement!.parentElement!; }
function fixture() {
  const overflow=vi.fn();
  const navigate=vi.fn();
  const result=render(
    <SwipeableCard item={item} context="tab-watching">
      <article data-testid="card-content">
        <button aria-label="More options" onClick={overflow}>More</button>
        <button onClick={navigate}>Open card</button>
      </article>
    </SwipeableCard>
  );
  return {...result,overflow,navigate,surface:screen.getByTestId('card-content').parentElement!.parentElement!};
}
function touch(surface:HTMLElement, distance:number) {
  fireEvent.touchStart(surface,{touches:[{clientX:150,clientY:150}]});
  fireEvent.touchMove(surface,{touches:[{clientX:150+distance,clientY:150}]});
  act(()=>frame(0));
}
beforeEach(() => {
  device.isDesktop=false;
  pointerDescriptor=Object.getOwnPropertyDescriptor(window,'PointerEvent');
  Reflect.deleteProperty(window,'PointerEvent'); // Exercise the real hook's touch fallback.
  vi.stubGlobal('requestAnimationFrame',vi.fn((callback:FrameRequestCallback)=>{frame=callback;return 1;}));
  vi.stubGlobal('cancelAnimationFrame',vi.fn());
});
afterEach(() => {
  vi.restoreAllMocks();vi.unstubAllGlobals();vi.clearAllMocks();
  if(pointerDescriptor) Object.defineProperty(window,'PointerEvent',pointerDescriptor);
});

describe('non-blocking swipe instruction', () => {
  it('renders one mobile hint with pointer events disabled and parent-controlled visibility', () => {
    fixture();
    expect(screen.getAllByText('Swipe for actions')).toHaveLength(1);
    expect(hint()).toHaveClass('pointer-events-none','opacity-0','group-hover/swipe-card:opacity-100');
    expect(hint()).not.toHaveClass('hover:opacity-100');
    expect(hint().parentElement).toHaveClass('group/swipe-card');
  });
  it('retains absolute placement and the existing card structure without adding layout space', () => {
    const {surface}=fixture();
    expect(hint()).toHaveClass('absolute','top-2','right-2','z-20');
    expect(surface.parentElement).toBe(hint().parentElement);
    expect(surface.parentElement).toHaveClass('relative','overflow-hidden');
    expect(surface.parentElement?.children).toHaveLength(2);
  });
  it('preserves overflow and card navigation callbacks while the hint exists', () => {
    const {overflow,navigate}=fixture();
    expect(hint()).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'More options'}));
    fireEvent.click(screen.getByRole('button',{name:'Open card'}));
    expect(overflow).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledOnce();
  });
  it('does not render the mobile instruction on desktop', () => {
    device.isDesktop=true;
    fixture();
    expect(screen.queryByText('Swipe for actions')).toBeNull();
  });
  it('hides the instruction during an active swipe and restores it afterward', () => {
    const {surface}=fixture();
    fireEvent.touchStart(surface,{touches:[{clientX:150,clientY:150}]});
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    fireEvent.touchEnd(surface);
    expect(screen.getByText('Swipe for actions')).toBeInTheDocument();
    expect(setPrimaryStatus).not.toHaveBeenCalled();
  });
  it('retains the early preview without triggering a below-threshold action', () => {
    const {surface}=fixture();
    touch(surface,40);
    expect(screen.getByText('Swipe to watched')).toBeInTheDocument();
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    fireEvent.touchEnd(surface);
    expect(setPrimaryStatus).not.toHaveBeenCalled();
    expect(screen.getByText('Swipe for actions')).toBeInTheDocument();
  });
  it.each([
    [100,'watched'],
    [-100,'wishlist'],
  ] as const)('retains the 100px action threshold for swipe distance %s', (distance,status) => {
    const {surface}=fixture();
    touch(surface,distance);
    fireEvent.touchEnd(surface);
    expect(setPrimaryStatus).toHaveBeenCalledWith(item,status,{feedback:true});
    expect(screen.getByText('Swipe for actions')).toBeInTheDocument();
  });
  it('retains the 200px displacement limit and resets the transform on release', () => {
    const {surface}=fixture();
    touch(surface,300);
    expect(surface.firstElementChild).toHaveStyle({transform:'translateX(200px)'});
    fireEvent.touchEnd(surface);
    expect((surface.firstElementChild as HTMLElement).style.transform).toBe('');
  });
  it('adds no timer or storage persistence and retains the hint after a tap', () => {
    vi.useFakeTimers();
    const storage=vi.spyOn(Storage.prototype,'setItem');
    const {surface}=fixture();
    fireEvent.touchStart(surface,{touches:[{clientX:150,clientY:150}]});
    fireEvent.touchEnd(surface);
    expect(screen.getByText('Swipe for actions')).toBeInTheDocument();
    expect(storage).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});

vi.mock('@/lib/settings', () => ({useSettings: () => ({layout:{episodeTracking:false}})}));
vi.mock('@/hooks/useEntitlements', () => ({useEntitlements: () => ({hasFullAccess:true,isReadOnlyMode:false})}));
vi.mock('@/components/Toast', () => ({useToast: () => ({addToast:vi.fn()})}));
vi.mock('@/lib/shareLinks', () => ({shareShowWithFallback:vi.fn()}));
vi.mock('@/lib/seriesReminders', () => ({isSeriesReminderEnabled: () => false}));

function menuFixture() {
  vi.spyOn(HTMLElement.prototype,'offsetHeight','get').mockReturnValue(160);
  vi.spyOn(HTMLElement.prototype,'offsetWidth','get').mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({
    top:200,bottom:240,left:200,right:300,width:100,height:40,
  } as DOMRect);
  const onOpen=vi.fn();
  const card=(withMenu:boolean) => <SwipeableCard item={item} context="home">
    {withMenu && <CompactOverflowMenu item={item} context="home" actions={{onOpen}}/>}
  </SwipeableCard>;
  return {...render(card(true)),onOpen,card};
}

describe('swipe hint with real overflow menu', () => {
  it('hides throughout an open menu and restores normal eligibility on close/reopen', () => {
    menuFixture();
    expect(hint()).toHaveClass('pointer-events-none');
    fireEvent.click(screen.getByRole('button',{name:'More'}));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    fireEvent.scroll(window);
    fireEvent.resize(window);
    act(()=>frame(0));
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    fireEvent.keyDown(document,{key:'Escape'});
    expect(screen.queryByRole('menu')).toBeNull();
    expect(hint()).toHaveClass('pointer-events-none','group-hover/swipe-card:opacity-100');
    fireEvent.click(screen.getByRole('button',{name:'More'}));
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'More'}));
    expect(hint()).toBeInTheDocument();
  });
  it('preserves menu action and restores the hint when the action closes the menu', () => {
    const {onOpen}=menuFixture();
    fireEvent.click(screen.getByRole('button',{name:'More'}));
    expect(screen.getByRole('menuitem',{name:'Open Details'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem',{name:'Open Details'}));
    expect(onOpen).toHaveBeenCalledWith(item);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(hint()).toBeInTheDocument();
  });
  it('clears local open state when the overflow child unmounts', () => {
    const {rerender,card}=menuFixture();
    fireEvent.click(screen.getByRole('button',{name:'More'}));
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    rerender(card(false));
    expect(hint()).toBeInTheDocument();
  });
});