import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import NotesAndTagsModal from '../modals/NotesAndTagsModal';
import { languageManager } from '../../lib/language';
const item = { id: '1', mediaType: 'movie' as const, title: 'Title', userNotes: 'Original', tags: ['Family'] };
const save = vi.fn(); const close = vi.fn();
function open(data = item) { return render(<NotesAndTagsModal item={data} isOpen onSave={save} onClose={close}/>); }
const note = () => screen.getByLabelText('Notes');
const tag = () => screen.getByLabelText('Tags');
const clickSave = () => fireEvent.click(screen.getByRole('button', {name:'Save', exact:true}));
beforeEach(() => { save.mockReset(); close.mockReset(); languageManager.setLanguage('en'); });
afterEach(cleanup);
it('opens labelled dialog and saves multiline notes with pending trimmed tag', () => {
 open(); expect(screen.getByRole('dialog')).toHaveAccessibleName('Notes & Tags Title'); expect(note()).toHaveValue('Original');
 fireEvent.change(note(), {target:{value:'First\nSecond'}}); fireEvent.change(tag(),{target:{value:'  Comedy  '}}); clickSave();
 expect(save).toHaveBeenCalledWith(item,'First\nSecond',['Family','Comedy']); expect(close).toHaveBeenCalled();
});
it('clears notes and all tags',()=>{open();fireEvent.change(note(),{target:{value:''}});fireEvent.click(screen.getByRole('button',{name:'Remove tag: Family'}));clickSave();expect(save).toHaveBeenCalledWith(item,'',[]);});
it.each([[' family ','already assigned'],['x'.repeat(51),'50 characters']])('invalid pending tag blocks Save: %s',(value,message)=>{open();fireEvent.change(tag(),{target:{value}});clickSave();expect(screen.getByRole('alert')).toHaveTextContent(message);expect(save).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled();});
it('blank Add reports validation; valid Add trims and retains order',()=>{open();fireEvent.click(screen.getByRole('button',{name:'Add',exact:true}));expect(screen.getByRole('alert')).toHaveTextContent('Enter a tag');fireEvent.change(tag(),{target:{value:' new '}});fireEvent.keyDown(tag(),{key:'Enter'});clickSave();expect(save).toHaveBeenCalledWith(item,'Original',['Family','new']);});
it('preserves legacy notes, permits reduction, prevents increasing oversized text',()=>{open({...item,userNotes:'x'.repeat(6000)});expect(note()).toHaveValue('x'.repeat(6000));fireEvent.change(note(),{target:{value:'x'.repeat(6001)}});expect(note()).toHaveValue('x'.repeat(6000));fireEvent.change(note(),{target:{value:'x'.repeat(5500)}});clickSave();expect(save).toHaveBeenCalledWith(expect.anything(),'x'.repeat(5500),['Family']);});
it('new notes cannot exceed 5000 characters',()=>{open();fireEvent.change(note(),{target:{value:'x'.repeat(5001)}});expect(note()).toHaveValue('Original');fireEvent.change(note(),{target:{value:'x'.repeat(5000)}});clickSave();expect(save.mock.calls[0][1]).toHaveLength(5000);});
it('preserves oversized and case-variant tags; removes only selected occurrence',()=>{const data={...item,tags:['Family','family','x'.repeat(60),...Array.from({length:24},(_,i)=>`tag${i}`)]};open(data);clickSave();expect(save).toHaveBeenCalledWith(data,'Original',data.tags);fireEvent.click(screen.getByRole('button',{name:'Remove tag: family',exact:true}));fireEvent.change(tag(),{target:{value:'new'}});clickSave();expect(screen.getByRole('alert')).toHaveTextContent('25 tags');expect(screen.getByRole('button',{name:'Remove tag: Family',exact:true})).toBeInTheDocument();});
it.each(['Cancel','X','backdrop','Escape','Android Back'])('%s discards draft',path=>{open();fireEvent.change(note(),{target:{value:'Draft'}});if(path==='Cancel')fireEvent.click(screen.getByRole('button',{name:'Cancel'}));if(path==='X')fireEvent.click(screen.getByRole('button',{name:'Close Notes & Tags'}));if(path==='backdrop')fireEvent.click(screen.getByTestId('notes-backdrop'));if(path==='Escape')fireEvent.keyDown(window,{key:'Escape'});if(path==='Android Back')window.dispatchEvent(new Event('flicklet:android-back',{cancelable:true}));expect(close).toHaveBeenCalledOnce();expect(save).not.toHaveBeenCalled();});
it('failed mutation keeps editor open',()=>{save.mockReturnValue(false);open();clickSave();expect(close).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toHaveTextContent('Could not save');});
it('focuses textarea and restores previous focus',()=>{const button=document.createElement('button');document.body.append(button);button.focus();const view=open();expect(note()).toHaveFocus();view.unmount();expect(button).toHaveFocus();button.remove();});
it('Spanish copy is available',async()=>{languageManager.setLanguage('es');open();await waitFor(()=>expect(screen.getByRole('dialog')).toHaveAccessibleName('Notas y etiquetas Title'));expect(screen.getByLabelText('Notas')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Guardar'})).toBeInTheDocument();});
