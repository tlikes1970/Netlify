import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import StarRating from '../cards/StarRating';
import {languageManager} from '../../lib/language';
afterEach(()=>{cleanup();languageManager.setLanguage('en')});
it.each(['en','es'] as const)('unrated zero is described inside the slider range in %s',language=>{languageManager.setLanguage(language);render(<StarRating value={0} onChange={()=>{}}/>);const slider=screen.getByRole('slider');expect(slider).toHaveAttribute('aria-valuemin','0');expect(slider).toHaveAttribute('aria-valuenow','0');expect(slider).toHaveAttribute('aria-valuetext',language==='en'?'Unrated':'Sin calificar');});
it('native half-star keyboard steps and Home/End remain available',()=>{const change=vi.fn();render(<StarRating value={0} onChange={change}/>);const slider=screen.getByRole('slider');fireEvent.keyDown(slider,{key:'ArrowRight'});expect(change).toHaveBeenLastCalledWith(0.5);fireEvent.keyDown(slider,{key:'Home'});expect(change).toHaveBeenLastCalledWith(0.5);fireEvent.keyDown(slider,{key:'End'});expect(change).toHaveBeenLastCalledWith(5);});
it('a stored half-star rating remains distinct from unrated through language switch',()=>{render(<StarRating value={0.5} onChange={()=>{}}/>);expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow','0.5');act(()=>languageManager.setLanguage('es'));expect(screen.getByRole('slider')).not.toHaveAttribute('aria-valuetext','Sin calificar');});
