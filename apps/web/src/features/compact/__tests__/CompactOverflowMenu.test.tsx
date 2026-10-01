import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { CompactOverflowMenu } from '../CompactOverflowMenu';
import type { ActionItem } from '../actionsMap';

vi.mock('@/lib/settings', () => ({ useSettings: () => ({layout:{episodeTracking:false}}) }));
vi.mock('@/hooks/useEntitlements', () => ({useEntitlements: () => ({hasFullAccess:true,isReadOnlyMode:false})}));
vi.mock('@/components/Toast', () => ({useToast: () => ({addToast:vi.fn()})}));
vi.mock('@/lib/shareLinks', () => ({shareShowWithFallback:vi.fn()}));
vi.mock('@/lib/seriesReminders', () => ({isSeriesReminderEnabled: () => false}));
vi.mock('@/lib/isMobile', () => ({isMobileNow: () => true}));
vi.mock('@/lib/capacitorSafeArea', () => ({
  readMobileNavClearancePx: () => 80, readSafeInsetPx: () => 0,
}));

let anchorTop=200;
let panelHeight=160;
let frame: FrameRequestCallback;
let vv: EventTarget;
const measuredStates: Array<{visibility:string,pointerEvents:string,top:string}>=[];
const item={id:1,title:'Test',mediaType:'movie'} as ActionItem;
const actions={onOpen:vi.fn()};
function open() { fireEvent.click(screen.getByRole('button',{name:'More'})); }
function panel() { return document.querySelector<HTMLElement>('[role="menu"]')!; }

beforeEach(() => {
  anchorTop=200; panelHeight=160; measuredStates.length=0;
  vv=Object.assign(new EventTarget(),{offsetTop:0,offsetLeft:0,width:400,height:800});
  vi.stubGlobal('visualViewport',vv);
  vi.stubGlobal('requestAnimationFrame',vi.fn((callback:FrameRequestCallback) => {frame=callback;return 1;}));
  vi.stubGlobal('cancelAnimationFrame',vi.fn());
  vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function () {
    const top=this.dataset.anchor === 'second' ? 400 : anchorTop;
    return {top,bottom:top+40,left:200,right:300,width:100,height:40} as DOMRect;
  });
  vi.spyOn(HTMLElement.prototype,'offsetHeight','get').mockImplementation(function () {
    if(this.getAttribute('role')!=='menu') return 0;
    measuredStates.push({visibility:this.style.visibility,pointerEvents:this.style.pointerEvents,top:this.style.top});
    return panelHeight;
  });
  vi.spyOn(HTMLElement.prototype,'offsetWidth','get').mockReturnValue(200);
});
afterEach(() => {vi.restoreAllMocks();vi.unstubAllGlobals();});

describe('overflow measurement lifecycle', () => {
  it('first mount is hidden/noninteractive at default coordinates, then reveals measured placement', () => {
    render(<CompactOverflowMenu item={item} context="home" actions={actions}/>);
    open();
    expect(measuredStates[0]).toEqual({visibility:'hidden',pointerEvents:'none',top:'0px'});
    expect(panel()).toHaveStyle({visibility:'visible',pointerEvents:'auto',top:'244px',left:'100px'});
    expect(panel()).toHaveAttribute('aria-hidden','false');
    expect(screen.getAllByRole('menu')).toHaveLength(1);
  });
  it('uses actual panel height rather than inflating a long menu into an upward flip', () => {
    anchorTop=400;
    const longerActions={...actions,onWant:vi.fn(),onWatched:vi.fn(),onNotInterested:vi.fn(),
      onNotesEdit:vi.fn(),onGoofsOpen:vi.fn(),onExtrasOpen:vi.fn()};
    render(<CompactOverflowMenu item={item} context="home" actions={longerActions}/>);
    open();
    expect(screen.getAllByRole('menuitem').length).toBe(9);
    expect(panel()).toHaveAttribute('data-dir','down');
    expect(panel().style.top).toBe('444px');
  });
  it('stays hidden on zero layout and reveals only after a valid follow-up measurement', () => {
    panelHeight=0;
    render(<CompactOverflowMenu item={item} context="home" actions={actions}/>);
    open();
    expect(panel()).toHaveStyle({visibility:'hidden',pointerEvents:'none'});
    expect(screen.queryByRole('menu')).toBeNull();
    panelHeight=160;
    act(()=>frame(0));
    expect(panel()).toHaveStyle({visibility:'visible',top:'244px'});
  });
  it('reopens with fresh geometry and never exposes cached coordinates during measurement', () => {
    render(<CompactOverflowMenu item={item} context="home" actions={actions}/>);
    open();
    fireEvent.keyDown(document,{key:'Escape'});
    anchorTop=300;
    measuredStates.length=0;
    open();
    expect(measuredStates[0].visibility).toBe('hidden');
    expect(measuredStates[0].top).toBe('0px');
    expect(panel().style.top).toBe('344px');
  });
  it('same-card reopening matches equivalent first-open geometry', () => {
    render(<CompactOverflowMenu item={item} context="home" actions={actions}/>);
    open();
    const top=panel().style.top;
    fireEvent.keyDown(document,{key:'Escape'});
    open();
    expect(panel().style.top).toBe(top);
  });
  it('opening a different card closes the old panel and measures its new trigger', () => {
    render(<><CompactOverflowMenu item={item} context="home" actions={actions}/>
      <CompactOverflowMenu item={{...item,id:2}} context="home" actions={actions}/></>);
    const buttons=screen.getAllByRole('button',{name:'More'});
    buttons[1].dataset.anchor='second';
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(panel().style.top).toBe('444px');
    expect(buttons[0]).toHaveAttribute('aria-expanded','false');
  });
  it.each(['scroll','resize','capacitor-safe-area'])('recalculates on window %s',event => {
    render(<CompactOverflowMenu item={item} context="home" actions={actions}/>);
    open();
    anchorTop=300;
    fireEvent(window,new Event(event));
    expect(panel().style.top).toBe('344px');
  });
  it.each(['resize','scroll'])('recalculates on visualViewport %s',event => {
    render(<CompactOverflowMenu item={item} context="home" actions={actions}/>);
    open();
    anchorTop=300;
    act(()=>vv.dispatchEvent(new Event(event)));
    expect(panel().style.top).toBe('344px');
  });
  it('keeps a long panel internally scrollable within a short usable viewport', () => {
    Object.assign(vv,{height:300});
    anchorTop=100;panelHeight=420;
    render(<CompactOverflowMenu item={item} context="home" actions={actions}/>);
    open();
    expect(panel().style.maxHeight).toContain('88px');
    expect(panel().style.overflowY).toBe('auto');
    expect(panel().style.top).toBe('8px');
  });
  it('stays hidden when chrome leaves no usable space and recovers on resize', () => {
    Object.assign(vv,{height:80});
    render(<CompactOverflowMenu item={item} context="home" actions={actions}/>);
    open();
    expect(panel()).toHaveStyle({visibility:'hidden',pointerEvents:'none'});
    Object.assign(vv,{height:800});
    act(()=>vv.dispatchEvent(new Event('resize')));
    expect(panel()).toHaveStyle({visibility:'visible'});
  });
  it('preserves action ordering and callbacks', () => {
    render(<CompactOverflowMenu item={item} context="home" actions={actions}/>);
    open();
    expect(screen.getAllByRole('menuitem').map(el=>el.textContent)).toEqual(['Open Details','Share this show','Custom Lists']);
    fireEvent.click(screen.getByRole('menuitem',{name:'Open Details'}));
    expect(actions.onOpen).toHaveBeenCalledWith(item);
    expect(panel()).toBeNull();
  });
  it('cleans up viewport/window listeners and animation frame', () => {
    const remove=vi.spyOn(window,'removeEventListener');
    const vvRemove=vi.spyOn(vv,'removeEventListener');
    const {unmount}=render(<CompactOverflowMenu item={item} context="home" actions={actions}/>);
    open();unmount();
    expect(remove).toHaveBeenCalledWith('scroll',expect.any(Function),true);
    expect(remove).toHaveBeenCalledWith('resize',expect.any(Function));
    expect(remove).toHaveBeenCalledWith('capacitor-safe-area',expect.any(Function));
    expect(remove).toHaveBeenCalledWith('flicklet:overflow-open',expect.any(Function));
    expect(vvRemove).toHaveBeenCalledWith('resize',expect.any(Function));
    expect(vvRemove).toHaveBeenCalledWith('scroll',expect.any(Function));
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});

it('uses a compact vertical icon and omits status actions exposed on the card', () => {
  const want=vi.fn(); const watched=vi.fn();
  render(<CompactOverflowMenu item={item} context="tab-watching" actions={{onWant:want,onWatched:watched}} showText={false} hideStatusActions/>);
  const trigger=screen.getByRole('button',{name:'More options'});
  expect(trigger).toHaveStyle({minWidth:'44px',minHeight:'44px'});
  expect([...trigger.querySelectorAll('circle')].map(circle=>circle.getAttribute('cx'))).toEqual(['12','12','12']);
  fireEvent.click(trigger);
  expect(screen.queryByRole('menuitem',{name:'Want to Watch'})).toBeNull();
  expect(screen.getByRole('menuitem',{name:'Custom Lists'})).toBeInTheDocument();
});
