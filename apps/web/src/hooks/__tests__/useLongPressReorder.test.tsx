import {useRef,useState} from 'react';
import {act,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {useLongPressReorder} from '../useLongPressReorder';
import SwipeableCard from '@/components/SwipeableCard';
import {setPrimaryStatus} from '@/lib/statusTransitions';
vi.mock('@/hooks/useDeviceDetection',()=>({useIsDesktop:()=>({isDesktop:false})}));
vi.mock('@/utils/scrollFeatureFlags',()=>({isScrollFeatureEnabled:()=>false}));
vi.mock('@/lib/statusTransitions',()=>({setPrimaryStatus:vi.fn()}));
const navigate=vi.fn(), overflow=vi.fn(), reordered=vi.fn();
let pointer:PropertyDescriptor|undefined;
let frames:FrameRequestCallback[]=[];
function Fixture({enabled=true,allowed=true}:{enabled?:boolean;allowed?:boolean}) {
 const root=useRef<HTMLDivElement>(null);
 const [items,setItems]=useState(['1:tv','2:movie','3:tv']);
 const active=useLongPressReorder({containerRef:root,enabled,identities:items,canStart:()=>allowed,onReorder:(from,to)=>{
  const next=[...items];next.splice(to,0,next.splice(from,1)[0]);reordered(from,to);setItems(next);
 }});
 return <div ref={root}>{items.map((id,index)=><div key={id} data-reorder-id={id} data-item-index={index} ref={row=>{
  if(row) row.getBoundingClientRect=()=>({top:100+index*200,height:180,left:0,right:300,bottom:280+index*200,width:300,x:0,y:100+index*200,toJSON:()=>({})});
 }}><SwipeableCard item={{id:id.split(':')[0],mediaType:id.endsWith('tv')?'tv':'movie',title:id}} context="tab-watching" disableSwipe={!!active}>
 <article data-testid={id}><a href="#title" onClick={navigate}>{id}</a><button onClick={overflow}>Actions {id}</button></article>
 </SwipeableCard></div>)}</div>;
}
const row=(id='1:tv')=>screen.getByTestId(id).closest<HTMLElement>('[data-reorder-id]')!;
function start(id='1:tv'){fireEvent.touchStart(screen.getByTestId(id),{touches:[{clientX:150,clientY:190}]});}
function hold(id='1:tv'){start(id);act(()=>vi.advanceTimersByTime(200));}
function move(y=390,x=150){fireEvent.touchMove(document,{touches:[{clientX:x,clientY:y}]});}
function end(){fireEvent.touchEnd(document,{touches:[],changedTouches:[{clientX:150,clientY:390}]});}
beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();frames=[];pointer=Object.getOwnPropertyDescriptor(window,'PointerEvent');Reflect.deleteProperty(window,'PointerEvent');localStorage.clear();document.body.style.overflow='';vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frames.push(cb);return frames.length;});vi.stubGlobal('cancelAnimationFrame',vi.fn());});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();if(pointer)Object.defineProperty(window,'PointerEvent',pointer);});
it('enters reorder only after the established hold and lifts the outer row',()=>{render(<Fixture/>);start();act(()=>vi.advanceTimersByTime(199));expect(row()).not.toHaveClass('is-touch-reordering');act(()=>vi.advanceTimersByTime(1));expect(row()).toHaveClass('is-touch-reordering');expect(row()).toHaveAttribute('data-drag-active','true');expect(document.body.style.overflow).toBe('hidden');});
it('moves vertically above neighboring cards and commits the drop',()=>{render(<Fixture/>);hold();move();expect(row().style.getPropertyValue('--reorder-y')).toBe('200px');end();expect(reordered).toHaveBeenCalledWith(0,1);expect(row().dataset.itemIndex).toBe('1');expect(document.body.style.overflow).toBe('');});
it('supports consecutive reorders after the identities change',()=>{render(<Fixture/>);hold();move();end();hold('2:movie');move(590);end();expect(reordered.mock.calls).toEqual([[0,1],[0,2]]);expect(row('2:movie').dataset.itemIndex).toBe('2');});
it('suppresses navigation/actions during drag and the drop-generated click',()=>{render(<Fixture/>);hold();fireEvent.click(screen.getByText('1:tv',{selector:'a'}));fireEvent.click(screen.getByText('Actions 1:tv'));move();end();fireEvent.click(screen.getByText('Actions 1:tv'));expect(navigate).not.toHaveBeenCalled();expect(overflow).not.toHaveBeenCalled();act(()=>vi.advanceTimersByTime(401));fireEvent.click(screen.getByText('Actions 1:tv'));expect(overflow).toHaveBeenCalledOnce();});
it('does not claim holds beginning on an action button',()=>{render(<Fixture/>);fireEvent.touchStart(screen.getByText('Actions 1:tv'),{touches:[{clientX:150,clientY:190}]});act(()=>vi.advanceTimersByTime(500));expect(row()).not.toHaveAttribute('data-drag-active');});
it('allows a fresh deliberate action immediately after the drop',()=>{render(<Fixture/>);hold();move();end();const button=screen.getByText('Actions 1:tv');fireEvent.touchStart(button,{touches:[{clientX:150,clientY:190}]});fireEvent.click(button);expect(overflow).toHaveBeenCalledOnce();});
it('leaves quick scrolling/swiping out of reorder mode',()=>{render(<Fixture/>);start();move(200,170);act(()=>vi.advanceTimersByTime(500));expect(row()).not.toHaveAttribute('data-drag-active');end();expect(reordered).not.toHaveBeenCalled();});
it.each(['touchcancel','Escape','back'])('cancels safely with %s',kind=>{render(<Fixture/>);hold();move();if(kind==='touchcancel')fireEvent.touchCancel(document);else if(kind==='Escape')fireEvent.keyDown(document,{key:'Escape'});else act(()=>window.dispatchEvent(new Event('flicklet:android-back',{cancelable:true})));expect(reordered).not.toHaveBeenCalled();expect(row()).not.toHaveAttribute('data-drag-active');expect(document.body.style.overflow).toBe('');});
it.each([{enabled:false},{allowed:false}])('preserves non-sortable/read-only eligibility %j',props=>{render(<Fixture {...props}/>);hold();move();end();expect(reordered).not.toHaveBeenCalled();expect(row()).not.toHaveAttribute('data-drag-active');});
it('disables horizontal status changes during drag and restores swipe afterward',()=>{render(<Fixture/>);hold();move(190,300);end();expect(setPrimaryStatus).not.toHaveBeenCalled();const surface=screen.getByTestId('1:tv').parentElement!.parentElement!;fireEvent.touchStart(surface,{touches:[{clientX:150,clientY:190}]});fireEvent.touchMove(surface,{touches:[{clientX:300,clientY:190}]});act(()=>{const callbacks=frames;frames=[];callbacks.forEach(cb=>cb(0));});fireEvent.touchEnd(surface,{touches:[]});expect(setPrimaryStatus).toHaveBeenCalledOnce();});
it('cleans up an active gesture on unmount',()=>{const view=render(<Fixture/>);hold();view.unmount();expect(document.body.style.overflow).toBe('');expect(reordered).not.toHaveBeenCalled();});
