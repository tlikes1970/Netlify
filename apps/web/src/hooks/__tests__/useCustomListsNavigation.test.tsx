import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { useCustomListsNavigation } from '../useCustomListsNavigation';
import type { AppView, LibrarySegment } from '@/lib/navigation';

function Harness() {
  const [location,setLocation]=useState<{view:AppView;segment:LibrarySegment}>({view:'library',segment:'want'});
  const back=useCustomListsNavigation(location.view,location.segment,setLocation);
  return <><output>{location.view}/{location.segment}</output><button onClick={() => setLocation({view:'library',segment:'mylists'})}>Lists</button><button onClick={() => setLocation({view:'home',segment:'mylists'})}>Home</button><button onClick={back}>Back</button></>;
}
beforeEach(() => window.history.replaceState({},''));
describe('Custom Lists Back integration', () => {
  it('adds one history entry on entry and none for repeated entry', () => {
    const push=vi.spyOn(window.history,'pushState');render(<Harness/>);
    fireEvent.click(screen.getByText('Lists'));fireEvent.click(screen.getByText('Lists'));
    expect(push).toHaveBeenCalledTimes(1);expect(window.history.state.flickletListsLocation).toEqual({view:'library',segment:'mylists'});push.mockRestore();
  });
  it('header Back returns to the preceding meaningful Library section', async () => {
    render(<Harness/>);fireEvent.click(screen.getByText('Lists'));fireEvent.click(screen.getByText('Back'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('library/want'));
  });
  it('browser Back and Forward restore the feature without adding entries', async () => {
    render(<Harness/>);fireEvent.click(screen.getByText('Lists'));const push=vi.spyOn(window.history,'pushState');
    act(() => window.history.back());await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('library/want'));
    act(() => window.history.forward());await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('library/mylists'));
    expect(push).not.toHaveBeenCalled();push.mockRestore();
  });
  it('consumes Android Back and honors an already dismissed overlay', async () => {
    render(<Harness/>);fireEvent.click(screen.getByText('Lists'));
    const consumed=new CustomEvent('flicklet:android-back',{cancelable:true});consumed.preventDefault();act(() => {window.dispatchEvent(consumed)});expect(screen.getByRole('status')).toHaveTextContent('library/mylists');
    const back=new CustomEvent('flicklet:android-back',{cancelable:true});act(() => {window.dispatchEvent(back)});expect(back.defaultPrevented).toBe(true);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('library/want'));
  });
  it('leaves an open overlay to its existing native Back consumer', () => {
    render(<Harness/>);fireEvent.click(screen.getByText('Lists'));
    const dialog=document.createElement('div');dialog.setAttribute('role','dialog');document.body.appendChild(dialog);
    const event=new CustomEvent('flicklet:android-back',{cancelable:true});window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);expect(screen.getByRole('status')).toHaveTextContent('library/mylists');dialog.remove();
  });
  it('explicitly leaving does not leave a stale lists entry', () => {
    render(<Harness/>);fireEvent.click(screen.getByText('Lists'));fireEvent.click(screen.getByText('Home'));
    expect(window.history.state.flickletListsLocation).toEqual({view:'home',segment:'mylists'});
    const event=new CustomEvent('flicklet:android-back',{cancelable:true});window.dispatchEvent(event);expect(event.defaultPrevented).toBe(false);
  });
});
