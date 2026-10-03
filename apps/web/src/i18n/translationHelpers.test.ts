import { expect, it, vi } from 'vitest';
import { createTranslationDictionary, interpolate, resolveTranslation, selectPluralKey } from './translationHelpers';
const dictionaries={en:{hello:'Hello {name}',one:'{count} title',many:'{count} titles'},es:{hello:'Hola {name}',one:'{count} título',many:'{count} títulos'}};
it('missing/empty Spanish values fall back to English with diagnostics',()=>{
 const warn=vi.spyOn(console,'warn').mockImplementation(()=>undefined);
 expect(resolveTranslation({en:{missingSpanish:'English'},es:{}},'es','missingSpanish')).toBe('English');
 expect(resolveTranslation({en:{emptySpanish:'English'},es:{emptySpanish:''}},'es','emptySpanish')).toBe('English');
 expect(warn).toHaveBeenCalledTimes(2);warn.mockRestore();
});
it('fallback works through property-based dictionaries, including after freezing/serialization',()=>{
 const warn=vi.spyOn(console,'warn').mockImplementation(()=>undefined);
 const dict=createTranslationDictionary<Record<string,string>>({en:{onlyEnglish:'English'},es:{}},'es');
 expect(dict.onlyEnglish).toBe('English');expect(dict.absentInBoth).toBe('[absentInBoth]');expect(JSON.parse(JSON.stringify(dict))).toEqual({onlyEnglish:'English'});expect(Object.isFrozen(dict)).toBe(true);warn.mockRestore();
});
it('plain-text interpolation handles zero, repetition and literal replacement characters',()=>{
 expect(interpolate('Hello {name}, {name}: {count}',{name:'$& <b>',count:0})).toBe('Hello $& <b>, $& <b>: 0');
 const warn=vi.spyOn(console,'warn').mockImplementation(()=>undefined);expect(interpolate('Hello {missingName}')).toBe('Hello {missingName}');expect(warn).toHaveBeenCalled();warn.mockRestore();
});
it.each(['en','es'] as const)('cardinal selection uses native %s rules and other fallback',language=>{
 for(const count of [0,1,2,1.5,1000000]){
  const key=selectPluralKey({one:'one',other:'many'},count,language);
  expect(key).toBe(count===1?'one':'many');expect(interpolate(resolveTranslation(dictionaries,language,key),{count})).toContain(String(count));
 }
});
