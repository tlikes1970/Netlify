import React,{useState} from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import LibrarySegmentBar from '../LibrarySegmentBar';
import Tabs from '../Tabs';
import {initSettingsTabs} from '../settings/tabs/initTabs';
afterEach(cleanup);
it.each(['library','primary'])('%s tabs rove focus and selection with arrows and Home/End',kind=>{
 function Harness(){const [segment,setSegment]=useState<any>('watching');const [view,setView]=useState<any>('home');return kind==='library'?<LibrarySegmentBar segment={segment} onChange={setSegment} counts={{watching:0,want:0,watched:0,mylists:0}}/>:<Tabs current={view} onChange={setView}/>}
 render(<Harness/>);const tabs=screen.getAllByRole('tab');expect(tabs[0]).toHaveAttribute('tabindex','0');expect(tabs[1]).toHaveAttribute('tabindex','-1');
 tabs[0].focus();fireEvent.keyDown(tabs[0],{key:'ArrowRight'});expect(tabs[1]).toHaveFocus();expect(tabs[1]).toHaveAttribute('aria-selected','true');
 fireEvent.keyDown(tabs[1],{key:'End'});expect(tabs.at(-1)).toHaveFocus();fireEvent.keyDown(tabs.at(-1)!,{key:'ArrowRight'});expect(tabs[0]).toHaveFocus();fireEvent.keyDown(tabs[0],{key:'ArrowLeft'});expect(tabs.at(-1)).toHaveFocus();fireEvent.keyDown(tabs.at(-1)!,{key:'Home'});expect(tabs[0]).toHaveFocus();
});
it('Settings initialization preserves panel selection and cleanup for keyboard tabs',()=>{
 render(<div><div role="tablist"><button role="tab" id="one" aria-selected="true" aria-controls="p1">One</button><button role="tab" id="two" aria-controls="p2">Two</button></div><div id="p1" role="tabpanel">First</div><div id="p2" role="tabpanel">Second</div></div>);
 const stop=initSettingsTabs(document.body);const tabs=screen.getAllByRole('tab');fireEvent.keyDown(tabs[0],{key:'ArrowRight'});expect(tabs[1]).toHaveFocus();expect(document.getElementById('p1')).toHaveAttribute('hidden');expect(document.getElementById('p2')).not.toHaveAttribute('hidden');stop();fireEvent.keyDown(tabs[1],{key:'Home'});expect(tabs[1]).toHaveAttribute('aria-selected','true');
});
