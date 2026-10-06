import {act,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import Toast from '../Toast';
import {CORE_TRANSLATIONS} from '../../i18n/coreTranslations';
beforeEach(()=>vi.useFakeTimers());afterEach(()=>vi.useRealTimers());
function notification(){return screen.queryByText('Moved')?.parentElement?.parentElement ?? null;}
function show(action=true){const onClose=vi.fn(),undo=vi.fn();render(<Toast message="Moved" type="success" personalityLevel={2} onClose={onClose} action={action?{label:'Undo',onClick:undo}:undefined}/>);return {onClose,undo};}
it('actionable notification stays for eight seconds',()=>{const {onClose}=show();act(()=>vi.advanceTimersByTime(3000));expect(screen.getByRole('button',{name:'Undo'})).toBeVisible();act(()=>vi.advanceTimersByTime(5000));expect(notification()).toBeNull();act(()=>vi.advanceTimersByTime(300));expect(onClose).toHaveBeenCalledOnce();});
it('non-action notification retains existing timing',()=>{const {onClose}=show(false);act(()=>vi.advanceTimersByTime(3000));expect(notification()).toBeNull();act(()=>vi.advanceTimersByTime(300));expect(onClose).toHaveBeenCalledOnce();});
it('hover pauses and resumes only remaining lifetime',()=>{show();act(()=>vi.advanceTimersByTime(2000));fireEvent.mouseEnter(notification()!);act(()=>vi.advanceTimersByTime(20000));expect(notification()!).toBeVisible();fireEvent.mouseLeave(notification()!);act(()=>vi.advanceTimersByTime(5999));expect(notification()!).toBeVisible();act(()=>vi.advanceTimersByTime(1));expect(notification()).toBeNull();});
it('keyboard focus preserves Undo and executes it once',()=>{const {undo,onClose}=show();fireEvent.focus(screen.getByRole('button',{name:'Undo'}));act(()=>vi.advanceTimersByTime(20000));fireEvent.click(screen.getByRole('button',{name:'Undo'}));expect(undo).toHaveBeenCalledOnce();act(()=>vi.advanceTimersByTime(300));expect(onClose).toHaveBeenCalledOnce();});
it('removal warning explains saved-detail loss in EN and ES',()=>{expect(CORE_TRANSLATIONS.en.coreRemoveBody).toMatch(/notes, tags, personal rating, and custom-list memberships/);expect(CORE_TRANSLATIONS.en.coreRemoveBody).toMatch(/will not restore/);expect(CORE_TRANSLATIONS.es.coreRemoveBody).toMatch(/no recuperará/);});
