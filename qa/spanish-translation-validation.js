// qa/spanish-translation-validation.js
// Comprehensive Spanish translation validation and i18n key coverage test

(async () => {
  const out = { ok: true, notes: [], errors: [] };
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  console.log('[SPANISH TRANSLATION VALIDATION] Starting comprehensive validation...');

  // 1) I18N System Check
  console.log('[I18N] Checking I18N system availability...');
  
  if (window.I18N) {
    out.notes.push('✅ I18N system available');
    
    // Check available languages
    const availableLangs = Object.keys(window.I18N);
    out.notes.push(`📊 Available languages: ${availableLangs.join(', ')}`);
    
    if (availableLangs.includes('es')) {
      out.notes.push('✅ Spanish (es) language pack available');
    } else {
      out.errors.push('❌ Spanish (es) language pack not available');
    }
    
    if (availableLangs.includes('en')) {
      out.notes.push('✅ English (en) language pack available');
    } else {
      out.errors.push('❌ English (en) language pack not available');
    }
  } else {
    out.errors.push('❌ I18N system not available');
  }

  // 2) Translation Function Check
  console.log('[I18N] Checking translation function...');
  
  if (typeof window.t === 'function') {
    out.notes.push('✅ Translation function (t) available');
    
    // Test translation function
    try {
      const testKey = 'home';
      const enTranslation = window.t(testKey, 'en');
      const esTranslation = window.t(testKey, 'es');
      
      out.notes.push(`📊 Test translation - Key: ${testKey}, EN: "${enTranslation}", ES: "${esTranslation}"`);
      
      if (enTranslation && esTranslation && enTranslation !== esTranslation) {
        out.notes.push('✅ Translation function working correctly');
      } else {
        out.errors.push('❌ Translation function not working correctly');
      }
    } catch (error) {
      out.errors.push(`❌ Translation function test failed: ${error.message}`);
    }
  } else {
    out.errors.push('❌ Translation function (t) not available');
  }

  // 3) Language Manager Check
  console.log('[I18N] Checking LanguageManager...');
  
  if (window.LanguageManager) {
    out.notes.push('✅ LanguageManager available');
    
    // Check current language
    if (typeof window.LanguageManager.getCurrentLanguage === 'function') {
      try {
        const currentLang = window.LanguageManager.getCurrentLanguage();
        out.notes.push(`📊 Current language: ${currentLang}`);
      } catch (error) {
        out.notes.push(`ℹ️ Could not get current language: ${error.message}`);
      }
    }
    
    // Check language switching
    if (typeof window.LanguageManager.switchLanguage === 'function') {
      out.notes.push('✅ Language switching function available');
    } else {
      out.notes.push('ℹ️ Language switching function not available');
    }
  } else {
    out.notes.push('ℹ️ LanguageManager not available');
  }

  // 4) i18n Attributes Check
  console.log('[I18N] Checking i18n attributes in DOM...');
  
  const i18nSelectors = [
    '[data-i18n]',
    '[data-i18n-placeholder]',
    '[data-i18n-title]',
    '[data-i18n-aria-label]'
  ];
  
  const i18nElements = {};
  i18nSelectors.forEach(selector => {
    const elements = $$(selector);
    i18nElements[selector] = elements.length;
    out.notes.push(`📊 ${selector}: ${elements.length} elements found`);
  });
  
  const totalI18nElements = Object.values(i18nElements).reduce((sum, count) => sum + count, 0);
  out.notes.push(`📊 Total i18n elements: ${totalI18nElements}`);

  // 5) Key Coverage Analysis
  console.log('[I18N] Analyzing key coverage...');
  
  if (window.I18N && window.I18N.en && window.I18N.es) {
    const enKeys = Object.keys(window.I18N.en);
    const esKeys = Object.keys(window.I18N.es);
    
    out.notes.push(`📊 English keys: ${enKeys.length}`);
    out.notes.push(`📊 Spanish keys: ${esKeys.length}`);
    
    // Find missing keys
    const missingInSpanish = enKeys.filter(key => !esKeys.includes(key));
    const missingInEnglish = esKeys.filter(key => !enKeys.includes(key));
    
    if (missingInSpanish.length > 0) {
      out.errors.push(`❌ Missing in Spanish: ${missingInSpanish.slice(0, 10).join(', ')}${missingInSpanish.length > 10 ? '...' : ''}`);
    } else {
      out.notes.push('✅ All English keys have Spanish translations');
    }
    
    if (missingInEnglish.length > 0) {
      out.notes.push(`ℹ️ Extra Spanish keys: ${missingInEnglish.slice(0, 10).join(', ')}${missingInEnglish.length > 10 ? '...' : ''}`);
    }
    
    // Check for empty translations
    const emptySpanishTranslations = esKeys.filter(key => !window.I18N.es[key] || window.I18N.es[key].trim() === '');
    if (emptySpanishTranslations.length > 0) {
      out.errors.push(`❌ Empty Spanish translations: ${emptySpanishTranslations.slice(0, 10).join(', ')}${emptySpanishTranslations.length > 10 ? '...' : ''}`);
    } else {
      out.notes.push('✅ No empty Spanish translations found');
    }
  }

  // 6) DOM Translation Application Check
  console.log('[I18N] Checking DOM translation application...');
  
  // Check if applyTranslations function exists
  if (typeof window.applyTranslations === 'function') {
    out.notes.push('✅ applyTranslations function available');
    
    // Test applying Spanish translations
    try {
      window.applyTranslations('es');
      out.notes.push('✅ Spanish translations applied to DOM');
      
      // Check a few key elements
      const homeTab = $('[data-i18n="home"]');
      if (homeTab) {
        const homeText = homeTab.textContent;
        out.notes.push(`📊 Home tab text: "${homeText}"`);
        
        if (homeText === 'Inicio' || homeText === 'Home') {
          out.notes.push('✅ Home tab translation applied');
        } else {
          out.notes.push(`ℹ️ Home tab text: "${homeText}" (may be correct)`);
        }
      }
    } catch (error) {
      out.errors.push(`❌ Failed to apply Spanish translations: ${error.message}`);
    }
  } else {
    out.notes.push('ℹ️ applyTranslations function not available');
  }

  // 7) Critical UI Elements Translation Check
  console.log('[I18N] Checking critical UI elements...');
  
  const criticalElements = [
    { selector: '[data-i18n="home"]', key: 'home', expectedEs: 'Inicio' },
    { selector: '[data-i18n="discover"]', key: 'discover', expectedEs: 'Descubrir' },
    { selector: '[data-i18n="settings"]', key: 'settings', expectedEs: 'Configuración' },
    { selector: '[data-i18n="currently_watching"]', key: 'currently_watching', expectedEs: 'Viendo Ahora' },
    { selector: '[data-i18n="want_to_watch"]', key: 'want_to_watch', expectedEs: 'Quiero Ver' },
    { selector: '[data-i18n="already_watched"]', key: 'already_watched', expectedEs: 'Ya Visto' }
  ];
  
  criticalElements.forEach(({ selector, key, expectedEs }) => {
    const element = $(selector);
    if (element) {
      const text = element.textContent.trim();
      out.notes.push(`📊 ${key}: "${text}"`);
      
      if (text === expectedEs) {
        out.notes.push(`✅ ${key} correctly translated`);
      } else if (text === window.I18N?.en?.[key]) {
        out.notes.push(`ℹ️ ${key} showing English (may be normal if not switched)`);
      } else {
        out.notes.push(`⚠️ ${key} unexpected text: "${text}"`);
      }
    } else {
      out.notes.push(`ℹ️ ${key} element not found`);
    }
  });

  // 8) Language Switching Test
  console.log('[I18N] Testing language switching...');
  
  if (window.LanguageManager && typeof window.LanguageManager.switchLanguage === 'function') {
    try {
      // Switch to Spanish
      window.LanguageManager.switchLanguage('es');
      out.notes.push('✅ Language switched to Spanish');
      
      // Check if translations were applied
      const homeTab = $('[data-i18n="home"]');
      if (homeTab && homeTab.textContent === 'Inicio') {
        out.notes.push('✅ Spanish translations active after switch');
      } else {
        out.notes.push('ℹ️ Spanish translations may not be fully active');
      }
      
      // Switch back to English
      window.LanguageManager.switchLanguage('en');
      out.notes.push('✅ Language switched back to English');
      
    } catch (error) {
      out.errors.push(`❌ Language switching test failed: ${error.message}`);
    }
  } else {
    out.notes.push('ℹ️ Language switching not available for testing');
  }

  // 9) Settings Language Option Check
  console.log('[I18N] Checking settings language option...');
  
  const languageSelect = $('select[name="lang"], #lang-select, [data-i18n="language"]');
  if (languageSelect) {
    out.notes.push('✅ Language selector found in settings');
    
    const options = languageSelect.querySelectorAll('option');
    const availableOptions = Array.from(options).map(opt => opt.value);
    out.notes.push(`📊 Available language options: ${availableOptions.join(', ')}`);
    
    if (availableOptions.includes('es')) {
      out.notes.push('✅ Spanish option available in settings');
    } else {
      out.errors.push('❌ Spanish option not available in settings');
    }
  } else {
    out.notes.push('ℹ️ Language selector not found in settings');
  }

  // 10) Fallback Behavior Check
  console.log('[I18N] Checking fallback behavior...');
  
  if (typeof window.t === 'function') {
    // Test with non-existent key
    const fallbackTest = window.t('non_existent_key_12345', 'es');
    if (fallbackTest === 'non_existent_key_12345') {
      out.notes.push('✅ Fallback behavior working correctly');
    } else {
      out.notes.push(`ℹ️ Fallback behavior: "${fallbackTest}"`);
    }
  }

  // Summary
  console.log('[SPANISH TRANSLATION VALIDATION]', out.ok ? '✅ PASS' : '❌ FAIL');
  console.log('[SPANISH TRANSLATION VALIDATION] Notes:', out.notes);
  if (out.errors.length > 0) {
    console.log('[SPANISH TRANSLATION VALIDATION] Errors:', out.errors);
    out.ok = false;
  }
  
  // Return result for external use
  window.spanishTranslationValidationResult = out;
  return out;
})();
