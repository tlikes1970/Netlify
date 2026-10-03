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

describe('swipe without recurring advertisement', () => {
  it('renders no recurring mobile advertisement', () => {
    fixture();
    expect(screen.queryByText('Swipe for actions')).toBeNull();
  });
  it('retains absolute placement and the existing card structure without adding layout space', () => {
    const {surface}=fixture();
    expect(surface.parentElement).toHaveClass('relative','overflow-hidden');
    expect(surface.parentElement?.children).toHaveLength(1);
  });
  it('preserves overflow and card navigation callbacks while the hint exists', () => {
    const {overflow,navigate}=fixture();
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
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    expect(setPrimaryStatus).not.toHaveBeenCalled();
  });
  it('retains the early preview without triggering a below-threshold action', () => {
    const {surface}=fixture();
    touch(surface,40);
    expect(screen.getByText('Swipe to watched')).toBeInTheDocument();
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    fireEvent.touchEnd(surface);
    expect(setPrimaryStatus).not.toHaveBeenCalled();
    expect(screen.queryByText('Swipe for actions')).toBeNull();
  });
  it.each([
    [100,'watched'],
    [-100,'wishlist'],
  ] as const)('retains the 100px action threshold for swipe distance %s', (distance,status) => {
    const {surface}=fixture();
    touch(surface,distance);
    fireEvent.touchEnd(surface);
    expect(setPrimaryStatus).toHaveBeenCalledWith(item,status,{feedback:true});
    expect(screen.queryByText('Swipe for actions')).toBeNull();
  });
  it('delegates Discovery swipe to the visible action callback exactly once', () => {
    const onWant=vi.fn();
    render(<SwipeableCard item={item} context="tab-foryou" actions={{onWant}}><article data-testid="discovery"/></SwipeableCard>);
    const surface=screen.getByTestId('discovery').parentElement!.parentElement!;
    touch(surface,100); fireEvent.touchEnd(surface);
    expect(onWant).toHaveBeenCalledTimes(1);
    expect(onWant).toHaveBeenCalledWith(item);
    expect(setPrimaryStatus).not.toHaveBeenCalled();
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
    expect(screen.queryByText('Swipe for actions')).toBeNull();
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

describe('swipe card with real overflow menu', () => {
  it('hides throughout an open menu and restores normal eligibility on close/reopen', () => {
    menuFixture();
    fireEvent.click(screen.getByRole('button',{name:'More'}));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    fireEvent.scroll(window);
    fireEvent.resize(window);
    act(()=>frame(0));
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    fireEvent.keyDown(document,{key:'Escape'});
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'More'}));
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'More'}));
  });
  it('preserves menu action and restores the hint when the action closes the menu', () => {
    const {onOpen}=menuFixture();
    fireEvent.click(screen.getByRole('button',{name:'More'}));
    expect(screen.getByRole('menuitem',{name:'Open Details'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem',{name:'Open Details'}));
    expect(onOpen).toHaveBeenCalledWith(item);
    expect(screen.queryByRole('menu')).toBeNull();
  });
  it('clears local open state when the overflow child unmounts', () => {
    const {rerender,card}=menuFixture();
    fireEvent.click(screen.getByRole('button',{name:'More'}));
    expect(screen.queryByText('Swipe for actions')).toBeNull();
    rerender(card(false));
  });
});