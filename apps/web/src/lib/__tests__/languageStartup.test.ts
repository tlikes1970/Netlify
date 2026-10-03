import { beforeEach, expect, it, vi } from 'vitest';
beforeEach(()=>{vi.resetModules();localStorage.clear();document.documentElement.lang='en'});
it.each([null,'en','es','fr','es-ES','"es"'])('boots from persisted %s with safe document language',async stored=>{
 if(stored!==null)localStorage.setItem('flicklet.language.v2',stored);
 const {languageManager}=await import('../language');
 const expected=stored==='es'?'es':'en';
 expect(languageManager.getLanguage()).toBe(expected);expect(document.documentElement.lang).toBe(expected);
});
it('reloads persisted Spanish without requiring a language switch',async()=>{
 localStorage.setItem('flicklet.language.v2','es');const {languageManager}=await import('../language');
 expect(languageManager.getTranslations().settings).toBe('Configuración');
 localStorage.setItem('flicklet.language.v2','en');languageManager.reloadAfterRestore();
 expect(document.documentElement.lang).toBe('en');expect(languageManager.getTranslations().settings).toBe('Settings');
});

it.each(['en','es'] as const)('persisted %s starts subsequent Search in matching metadata language',async language=>{
 localStorage.setItem('flicklet.language.v2',language);
 const fetchMock=vi.fn(async(_url:string)=>({ok:true,json:async()=>({results:[],total_pages:1})}));vi.stubGlobal('fetch',fetchMock);
 try{const {searchMulti}=await import('../../search/api');await searchMulti('restart');const params=new URL(fetchMock.mock.calls[0][0] as unknown as string,'https://test.local').searchParams;expect(params.get('language')).toBe(language==='es'?'es':'en-US');expect(params.get('region')).toBe('US');}finally{vi.unstubAllGlobals();}
});
