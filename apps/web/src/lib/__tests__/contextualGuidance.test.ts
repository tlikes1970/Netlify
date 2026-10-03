import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import TRANSLATIONS from '../translations';
const source=(name:string)=>readFileSync(resolve('src',name),'utf8');
describe('retired first-use and game production paths',()=>{
 it('App renders no tour and ignores old completion flags',()=>{
  localStorage.setItem('flicklet.onboardingCompleted','true');
  const app=source('App.tsx');
  expect(app).not.toMatch(/OnboardingCoachmarks|onboarding:|getOnboardingCompleted|data-onboarding/);
  expect(app).toContain('setTimeout(() => setShowAuthModal(true), 1000)');
  expect(app).toContain('auth:sign-in-required');
 });
 it.each(['components/onboarding/SearchTip.tsx','components/onboarding/OnboardingCoachmarks.tsx','components/UsernamePromptModal.tsx','components/games/FlickWordGame.tsx','components/games/TriviaGame.tsx','hooks/useOnboardingCoachmarks.ts','lib/onboarding.ts'])('removes retired module %s',name=>expect(existsSync(resolve('src',name))).toBe(false));
 it('preserves current preferred-name trigger and session dismissal',()=>{
  expect(source('components/FlickletHeader.tsx')).toContain('!!uid && !loading && !error && !preferredName && dismissedUid !== uid');
  expect(source('components/FlickletHeader.tsx')).toContain('<PreferredNamePromptModal');
 });
 it('exposes touch and keyboard reorder guidance',()=>{
  const handle=source('components/cards/DragHandle.tsx');
  expect(handle).toContain('coreReorderAria');
  expect(TRANSLATIONS.en.coreReorderAria).toContain('On touch, hold then drag. Press Arrow Up or Down');
  expect(handle).toContain('onKeyboardReorder?.');
 });
 it('keeps EN/ES genre guidance factual',()=>{
  expect(TRANSLATIONS.en.forYouTipText).toBe('💡 Tip: Choose genres for your For You rows. Titles already in your Library are hidden.');
  expect(TRANSLATIONS.es.forYouTipText).toContain('Biblioteca');
  expect(TRANSLATIONS.es.forYouTipText).not.toContain('actividad');
 });
});
