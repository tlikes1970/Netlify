import { test, expect, expectNoConsoleErrors, dumpDebug } from './fixtures';

/**
 * Process: Language Validation
 * Purpose: Comprehensive validation of language switching functionality across all UI elements
 * Data Source: i18n.js translation keys and language-manager.js persistence
 * Update Path: Language switching via langToggle dropdown and localStorage persistence
 * Dependencies: LanguageManager, applyTranslations, appData.settings.lang
 */

test.describe('Language Switching Validation', () => {
  test('Language persistence - remembers last selected language', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Test switching to Spanish
    await page.selectOption('#langToggle', 'es');
    await page.waitForTimeout(1000);

    // Verify language is saved in localStorage
    const savedLang = await page.evaluate(() => localStorage.getItem('flicklet-language'));
    expect(savedLang).toBe('es');

    // Verify language is saved in appData
    const appDataLang = await page.evaluate(() => window.appData?.settings?.lang);
    expect(appDataLang).toBe('es');

    // Reload page to test persistence
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify language dropdown shows Spanish
    const selectedLang = await page.evaluate(() => {
      const select = document.getElementById('langToggle') as HTMLSelectElement;
      return select?.value;
    });
    expect(selectedLang).toBe('es');

    // Verify appData still has Spanish
    const reloadedAppDataLang = await page.evaluate(() => window.appData?.settings?.lang);
    expect(reloadedAppDataLang).toBe('es');
  });

  test('Language switching updates all UI elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Get English text for comparison
    const englishTexts = await page.evaluate(() => {
      const getTexts = (selector: string) => {
        return Array.from(document.querySelectorAll(selector))
          .map((el) => el.textContent?.trim())
          .filter(Boolean);
      };

      return {
        appTitle: getTexts('.title, [data-i18n="app_title"]'),
        subtitle: getTexts('.subtitle, [data-i18n="subtitle"]'),
        navTabs: getTexts('#homeTab, #watchingTab, #wishlistTab, #watchedTab, #discoverTab'),
        settingsTabs: getTexts(
          '[data-i18n*="general"], [data-i18n*="notifications"], [data-i18n*="layout"]',
        ),
        searchPlaceholder: getTexts(
          'input[placeholder*="Search"], [data-i18n-placeholder="search_placeholder"]',
        ),
        buttons: getTexts(
          'button, [data-i18n*="button"], [data-i18n*="add"], [data-i18n*="remove"]',
        ),
      };
    });

    // Switch to Spanish
    await page.selectOption('#langToggle', 'es');
    await page.waitForTimeout(1000);

    // Get Spanish text
    const spanishTexts = await page.evaluate(() => {
      const getTexts = (selector: string) => {
        return Array.from(document.querySelectorAll(selector))
          .map((el) => el.textContent?.trim())
          .filter(Boolean);
      };

      return {
        appTitle: getTexts('.title, [data-i18n="app_title"]'),
        subtitle: getTexts('.subtitle, [data-i18n="subtitle"]'),
        navTabs: getTexts('#homeTab, #watchingTab, #wishlistTab, #watchedTab, #discoverTab'),
        settingsTabs: getTexts(
          '[data-i18n*="general"], [data-i18n*="notifications"], [data-i18n*="layout"]',
        ),
        searchPlaceholder: getTexts(
          'input[placeholder*="Search"], [data-i18n-placeholder="search_placeholder"]',
        ),
        buttons: getTexts(
          'button, [data-i18n*="button"], [data-i18n*="add"], [data-i18n*="remove"]',
        ),
      };
    });

    // Verify texts changed (not identical to English)
    expect(spanishTexts.appTitle).not.toEqual(englishTexts.appTitle);
    expect(spanishTexts.navTabs).not.toEqual(englishTexts.navTabs);

    // Verify specific Spanish translations (handle emoji prefixes)
    const hasInicio = spanishTexts.navTabs.some((text) => text.includes('Inicio'));
    const hasDescubrir = spanishTexts.navTabs.some((text) => text.includes('Descubrir'));
    const hasConfiguracion = spanishTexts.navTabs.some((text) => text.includes('Configuración'));

    expect(hasInicio).toBe(true); // Home in Spanish
    expect(hasDescubrir).toBe(true); // Discover in Spanish
    expect(hasConfiguracion).toBe(true); // Settings in Spanish
  });

  test('Language switching updates modals and overlays', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Open settings modal
    await page.click('#settingsTab');
    await page.waitForTimeout(500);

    // Get English modal text
    const englishModalTexts = await page.evaluate(() => {
      const modal = document.querySelector('#settingsModal, .modal, [role="dialog"]');
      if (!modal) return { titles: [], descriptions: [], buttons: [] };

      return {
        titles: Array.from(modal.querySelectorAll('h1, h2, h3, [data-i18n*="title"]'))
          .map((el) => el.textContent?.trim())
          .filter(Boolean),
        descriptions: Array.from(modal.querySelectorAll('p, [data-i18n*="description"]'))
          .map((el) => el.textContent?.trim())
          .filter(Boolean),
        buttons: Array.from(modal.querySelectorAll('button, [data-i18n*="button"]'))
          .map((el) => el.textContent?.trim())
          .filter(Boolean),
      };
    });

    // Switch to Spanish while modal is open
    await page.selectOption('#langToggle', 'es');
    await page.waitForTimeout(1000);

    // Get Spanish modal text
    const spanishModalTexts = await page.evaluate(() => {
      const modal = document.querySelector('#settingsModal, .modal, [role="dialog"]');
      if (!modal) return { titles: [], descriptions: [], buttons: [] };

      return {
        titles: Array.from(modal.querySelectorAll('h1, h2, h3, [data-i18n*="title"]'))
          .map((el) => el.textContent?.trim())
          .filter(Boolean),
        descriptions: Array.from(modal.querySelectorAll('p, [data-i18n*="description"]'))
          .map((el) => el.textContent?.trim())
          .filter(Boolean),
        buttons: Array.from(modal.querySelectorAll('button, [data-i18n*="button"]'))
          .map((el) => el.textContent?.trim())
          .filter(Boolean),
      };
    });

    // Verify modal text changed
    expect(spanishModalTexts.titles).not.toEqual(englishModalTexts.titles);
    expect(spanishModalTexts.descriptions).not.toEqual(englishModalTexts.descriptions);
  });

  test('Language switching updates search interface', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Get English search text
    const englishSearchTexts = await page.evaluate(() => {
      const searchInput = document.querySelector(
        '#searchInput, input[type="search"]',
      ) as HTMLInputElement;
      const searchButton = document.querySelector('#searchBtn, button[type="submit"]');
      const searchResults = document.querySelector('#searchResults');

      return {
        placeholder: searchInput?.placeholder || '',
        buttonText: searchButton?.textContent?.trim() || '',
        resultsText: searchResults?.textContent?.trim() || '',
      };
    });

    // Switch to Spanish
    await page.selectOption('#langToggle', 'es');
    await page.waitForTimeout(1000);

    // Get Spanish search text
    const spanishSearchTexts = await page.evaluate(() => {
      const searchInput = document.querySelector(
        '#searchInput, input[type="search"]',
      ) as HTMLInputElement;
      const searchButton = document.querySelector('#searchBtn, button[type="submit"]');
      const searchResults = document.querySelector('#searchResults');

      return {
        placeholder: searchInput?.placeholder || '',
        buttonText: searchButton?.textContent?.trim() || '',
        resultsText: searchResults?.textContent?.trim() || '',
      };
    });

    // Verify search interface changed
    expect(spanishSearchTexts.placeholder).not.toEqual(englishSearchTexts.placeholder);
    expect(spanishSearchTexts.placeholder).toContain('Buscar'); // Search in Spanish
  });

  test('Language switching updates list headers and content', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Navigate to different tabs to test list headers
    const tabs = ['#watchingTab', '#wishlistTab', '#watchedTab'];

    for (const tab of tabs) {
      await page.click(tab);
      await page.waitForTimeout(300);

      // Get English list text
      const englishListTexts = await page.evaluate(() => {
        const listContainer = document.querySelector('#watchingList, #wishlistList, #watchedList');
        return {
          headers: Array.from(
            listContainer?.querySelectorAll('h1, h2, h3, [data-i18n*="title"]') || [],
          )
            .map((el) => el.textContent?.trim())
            .filter(Boolean),
          buttons: Array.from(
            listContainer?.querySelectorAll('button, [data-i18n*="button"]') || [],
          )
            .map((el) => el.textContent?.trim())
            .filter(Boolean),
        };
      });

      // Switch to Spanish
      await page.selectOption('#langToggle', 'es');
      await page.waitForTimeout(1000);

      // Get Spanish list text
      const spanishListTexts = await page.evaluate(() => {
        const listContainer = document.querySelector('#watchingList, #wishlistList, #watchedList');
        return {
          headers: Array.from(
            listContainer?.querySelectorAll('h1, h2, h3, [data-i18n*="title"]') || [],
          )
            .map((el) => el.textContent?.trim())
            .filter(Boolean),
          buttons: Array.from(
            listContainer?.querySelectorAll('button, [data-i18n*="button"]') || [],
          )
            .map((el) => el.textContent?.trim())
            .filter(Boolean),
        };
      });

      // Verify list text changed
      expect(spanishListTexts.headers).not.toEqual(englishListTexts.headers);
    }
  });

  test('Language switching handles data-i18n attributes correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Count elements with data-i18n attributes
    const i18nElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-i18n]');
      return Array.from(elements).map((el) => ({
        tag: el.tagName,
        key: el.getAttribute('data-i18n'),
        text: el.textContent?.trim(),
      }));
    });

    expect(i18nElements.length).toBeGreaterThan(0);

    // Switch to Spanish
    await page.selectOption('#langToggle', 'es');
    await page.waitForTimeout(1000);

    // Verify data-i18n elements were translated
    const translatedElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-i18n]');
      return Array.from(elements).map((el) => ({
        tag: el.tagName,
        key: el.getAttribute('data-i18n'),
        text: el.textContent?.trim(),
      }));
    });

    // Check that some elements have Spanish text
    const hasSpanishText = translatedElements.some(
      (el) =>
        el.text &&
        (el.text.includes('Inicio') ||
          el.text.includes('Configuración') ||
          el.text.includes('Descubrir')),
    );
    expect(hasSpanishText).toBe(true);
  });

  test('Language switching updates placeholder and title attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Get elements with data-i18n-placeholder and data-i18n-title
    const placeholderElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-i18n-placeholder]');
      return Array.from(elements).map((el) => ({
        tag: el.tagName,
        key: el.getAttribute('data-i18n-placeholder'),
        placeholder: (el as HTMLInputElement).placeholder,
      }));
    });

    const titleElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-i18n-title]');
      return Array.from(elements).map((el) => ({
        tag: el.tagName,
        key: el.getAttribute('data-i18n-title'),
        title: el.getAttribute('title'),
      }));
    });

    // Switch to Spanish
    await page.selectOption('#langToggle', 'es');
    await page.waitForTimeout(1000);

    // Verify placeholder and title attributes were updated
    const updatedPlaceholders = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-i18n-placeholder]');
      return Array.from(elements).map((el) => ({
        tag: el.tagName,
        key: el.getAttribute('data-i18n-placeholder'),
        placeholder: (el as HTMLInputElement).placeholder,
      }));
    });

    const updatedTitles = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-i18n-title]');
      return Array.from(elements).map((el) => ({
        tag: el.tagName,
        key: el.getAttribute('data-i18n-title'),
        title: el.getAttribute('title'),
      }));
    });

    // Check that placeholders and titles were translated
    if (placeholderElements.length > 0) {
      expect(updatedPlaceholders).not.toEqual(placeholderElements);
    }
    if (titleElements.length > 0) {
      expect(updatedTitles).not.toEqual(titleElements);
    }
  });

  test('Language switching does not default to English on reload', async ({ page }) => {
    // Start with Spanish
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.selectOption('#langToggle', 'es');
    await page.waitForTimeout(1000);

    // Verify Spanish is set (handle emoji prefix)
    const spanishText = await page.evaluate(() => {
      const homeTab = document.querySelector('#homeTab');
      return homeTab?.textContent?.trim();
    });
    expect(spanishText).toContain('Inicio');

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify Spanish is still selected (not defaulted to English)
    const reloadedText = await page.evaluate(() => {
      const homeTab = document.querySelector('#homeTab');
      return homeTab?.textContent?.trim();
    });
    expect(reloadedText).toContain('Inicio');

    // Verify dropdown shows Spanish
    const selectedValue = await page.evaluate(() => {
      const select = document.getElementById('langToggle') as HTMLSelectElement;
      return select?.value;
    });
    expect(selectedValue).toBe('es');
  });

  test('Language switching handles missing translations gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Switch to Spanish
    await page.selectOption('#langToggle', 'es');
    await page.waitForTimeout(1000);

    // Check for any untranslated elements (should fall back to English or key)
    const untranslatedElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-i18n]');
      return Array.from(elements)
        .filter((el) => {
          const key = el.getAttribute('data-i18n');
          const text = el.textContent?.trim();
          // If text equals key, it means translation failed
          return text === key;
        })
        .map((el) => ({
          key: el.getAttribute('data-i18n'),
          text: el.textContent?.trim(),
        }));
    });

    // Should have minimal untranslated elements (some keys might not have Spanish translations)
    console.log('Untranslated elements:', untranslatedElements);
    expect(untranslatedElements.length).toBeLessThan(10); // Allow some untranslated keys
  });
});
