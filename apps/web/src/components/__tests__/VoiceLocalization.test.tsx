import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import VoiceSearch from '../VoiceSearch';
import { languageManager } from '@/lib/language';
let recognition:any;
class Recognition {lang='';start=vi.fn();stop=vi.fn();onresult:any;onerror:any;onend:any;constructor(){recognition=this}}
beforeEach(()=>{languageManager.setLanguage('en');localStorage.setItem('flag:voice_search_enabled','true');Object.assign(window,{SpeechRecognition:Recognition})});
afterEach(()=>{cleanup();localStorage.removeItem('flag:voice_search_enabled');languageManager.setLanguage('en')});
it('new sessions follow EN ES EN without restarting active microphone and preserve recognized input contract',async()=>{
 const result=vi.fn();render(<VoiceSearch onVoiceResult={result}/>);fireEvent.click(await screen.findByRole('button',{name:'Start voice search'}));expect(recognition.lang).toBe('en-US');act(()=>languageManager.setLanguage('es'));await screen.findByRole('button',{name:'Detener búsqueda por voz'});expect(recognition.start).toHaveBeenCalledTimes(1);expect(recognition.stop).not.toHaveBeenCalled();act(()=>recognition.onresult({results:[[{transcript:'  Mi Título Propio  '}]]}));expect(result).toHaveBeenCalledWith('mi título propio');fireEvent.click(screen.getByRole('button',{name:'Iniciar búsqueda por voz'}));expect(recognition.lang).toBe('es');act(()=>recognition.onend());act(()=>languageManager.setLanguage('en'));await waitFor(()=>expect(screen.getByRole('button',{name:'Start voice search'})).toBeInTheDocument());fireEvent.click(screen.getByRole('button',{name:'Start voice search'}));expect(recognition.lang).toBe('en-US');
});
it('permission guidance and open error text are localized',async()=>{
 const error=vi.fn();render(<VoiceSearch onVoiceResult={()=>{}} onError={error}/>);await screen.findByRole('button');act(()=>recognition.onerror({error:'not-allowed'}));expect(error).toHaveBeenCalledWith('Microphone access denied. Please allow microphone access.');act(()=>languageManager.setLanguage('es'));await screen.findByText('Acceso al micrófono denegado. Permite el acceso al micrófono.');
});

it('a parent callback refresh does not interrupt the active microphone',async()=>{
 const first=vi.fn(),next=vi.fn();const view=render(<VoiceSearch onVoiceResult={first}/>);fireEvent.click(await screen.findByRole('button',{name:'Start voice search'}));const active=recognition;act(()=>languageManager.setLanguage('es'));view.rerender(<VoiceSearch onVoiceResult={next} onError={()=>{}}/>);expect(recognition).toBe(active);expect(active.stop).not.toHaveBeenCalled();act(()=>active.onresult({results:[[{transcript:'Nombre Propio'}]]}));expect(next).toHaveBeenCalledWith('nombre propio');expect(first).not.toHaveBeenCalled();
});
