import { test, expect } from './fixtures';

test('Debug language persistence', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Check initial state
  const initialLang = await page.evaluate(() => {
    return {
      localStorage: localStorage.getItem('flicklet-language'),
      appData: window.appData?.settings?.lang,
      dropdown: (document.getElementById('langToggle') as HTMLSelectElement)?.value,
      languageManager: window.LanguageManager?.getCurrentLanguage?.()
    };
  });
  console.log('Initial state:', initialLang);

  // Switch to Spanish
  await page.selectOption('#langToggle', 'es');
  await page.waitForTimeout(1000);

  // Check state after switch
  const afterSwitch = await page.evaluate(() => {
    return {
      localStorage: localStorage.getItem('flicklet-language'),
      flickletData: localStorage.getItem('flicklet-data'),
      appData: window.appData?.settings?.lang,
      dropdown: (document.getElementById('langToggle') as HTMLSelectElement)?.value,
      languageManager: window.LanguageManager?.getCurrentLanguage?.()
    };
  });
  console.log('After switch:', afterSwitch);

  // Reload page
  await page.reload();
  await page.waitForTimeout(1000);

  // Check state after reload
  const afterReload = await page.evaluate(() => {
    return {
      localStorage: localStorage.getItem('flicklet-language'),
      flickletData: localStorage.getItem('flicklet-data'),
      appData: window.appData?.settings?.lang,
      dropdown: (document.getElementById('langToggle') as HTMLSelectElement)?.value,
      languageManager: window.LanguageManager?.getCurrentLanguage?.()
    };
  });
  console.log('After reload:', afterReload);

  // The test should pass if language is persisted
  expect(afterReload.localStorage).toBe('es');
  expect(afterReload.appData).toBe('es');
  expect(afterReload.dropdown).toBe('es');
});
