# Flicklet Translation System Documentation

## Overview
This document explains how the internationalization (i18n) system works in Flicklet and provides a complete guide for adding new languages (like Portuguese).

## System Architecture

### Core Files
- **`www/js/i18n.js`** - Main translation file containing all language keys and the translation function
- **`www/js/language-manager.js`** - Handles language switching and persistence
- **Translation function**: `t(key, lang)` - Returns translated text for a given key and language

### How It Works
1. All translatable text uses the `t()` function: `t('key_name')`
2. HTML elements use `data-i18n="key_name"` attributes for automatic translation
3. Language is stored in `appData.settings.lang` and persisted to localStorage
4. Language switching triggers a full UI refresh to update all text

## Current Languages
- **English (en)** - Default language
- **Spanish (es)** - Fully implemented

## Translation Key Categories

### 1. Core App Elements
- `app_title`, `subtitle` - App branding
- `home`, `discover`, `settings` - Main navigation
- `currently_watching`, `want_to_watch`, `already_watched` - List names

### 2. Curated Sections
- `trending_title`, `trending_subtitle` - Trending section
- `staff_picks_title`, `staff_picks_subtitle` - Staff picks section  
- `new_this_week_title`, `new_this_week_subtitle` - New releases section

### 3. Trivia System
- `trivia_title` - Section header
- `trivia_next`, `trivia_ok` - Button text
- `trivia_correct`, `trivia_incorrect` - Feedback messages
- `trivia_completed_today` - Status text
- `trivia_come_back_tomorrow` - Locked state message
- `trivia_incorrect_answer` - Wrong answer feedback
- `trivia_streak_up`, `trivia_try_again_tomorrow` - Notification messages

### 4. Search Interface
- `search_placeholder` - Search input placeholder
- `search_tips` - Search help text
- `end_of_search_results` - End of results message
- `search_failed`, `no_results_found`, `search_loading` - Status messages

### 5. FlickWord System
- `flickword_title` - Main title
- `flickword_play`, `flickword_streak`, `flickword_best`, `flickword_played` - Stats labels
- `flickword_daily_challenge` - Challenge title
- `hours_left_motivation` - Timer motivation text

### 6. Quotes System
- `quote_title`, `random_quote` - Quote section headers
- `quote_1` through `quote_30` - Individual quote translations

### 7. Authentication & Onboarding
- `sign_in_title`, `sign_in_subtitle` - Sign-in modal text
- `continue_google`, `email_signin` - Sign-in button text
- `sign_in_create_account`, `signing_in` - Account creation text
- `please_enter_display_name` - Validation messages

### 8. Settings Sections
- `general`, `notifications`, `layout`, `data`, `pro`, `about` - Tab names
- `general_description`, `notifications_description` - Section descriptions
- All settings labels and hints

### 9. Providers & Extras
- `available_on`, `watch_on` - Streaming provider labels
- `extras` - Extras section label
- `upgrade_to_reveal`, `upgrade_to_watch` - Pro upgrade prompts

### 10. Notifications
- `notification_success`, `notification_error`, `notification_warning`, `notification_info` - Toast types

## Adding Portuguese (pt) - Step-by-Step Guide

### Step 1: Add Portuguese Section to i18n.js
```javascript
pt: {
  // Copy all English keys and translate them
  go_dark: "🌙 Modo Escuro",
  go_light: "☀️ Modo Claro",
  app_title: "Flicklet",
  subtitle: "Rastreador de TV e Filmes",
  // ... continue with all keys
}
```

### Step 2: Update Language Manager
In `www/js/language-manager.js`, add Portuguese to the language options:
```javascript
const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español', 
  pt: 'Português'  // Add this line
};
```

### Step 3: Test Language Switching
1. Add a language switcher to the UI (if not already present)
2. Test switching between all three languages
3. Verify all text updates correctly
4. Check that language preference persists across page reloads

### Step 4: Validate All Components
Test these areas specifically:
- [ ] Curated sections (Trending, Staff Picks, New This Week)
- [ ] Trivia system (questions, feedback, buttons)
- [ ] Search interface (placeholder, results, errors)
- [ ] FlickWord system (stats, challenge text)
- [ ] Quotes system (all 30 quotes)
- [ ] Settings sections (all tabs and descriptions)
- [ ] Authentication flows (sign-in, onboarding)
- [ ] Notifications and toasts

## Translation Best Practices

### 1. Key Naming Convention
- Use descriptive, hierarchical names: `section_component_action`
- Examples: `trivia_next_button`, `search_loading_text`, `settings_general_tab`

### 2. Fallback Strategy
- Always provide English fallback: `t('key') || 'English text'`
- This ensures the app never breaks if a translation is missing

### 3. HTML Integration
- Use `data-i18n` attributes for static text: `<h2 data-i18n="trivia_title">Trivia</h2>`
- Use `t()` function for dynamic text: `element.textContent = t('dynamic_key')`

### 4. Pluralization
- For now, handle plurals with separate keys: `item_singular`, `item_plural`
- Future enhancement: implement proper pluralization rules

### 5. Context Preservation
- Maintain the tone and personality of the original English text
- Adapt cultural references appropriately
- Keep technical terms consistent across the app

## Common Issues & Solutions

### Issue: Text not translating
**Solution**: Check that the key exists in both English and target language sections

### Issue: HTML elements not updating
**Solution**: Ensure `data-i18n` attributes are present and the language manager is refreshing the UI

### Issue: Dynamic content not translating
**Solution**: Verify the `t()` function is being called with the correct key and language parameter

### Issue: Language not persisting
**Solution**: Check that `appData.settings.lang` is being saved to localStorage

## Testing Checklist

### Before Adding New Language
- [ ] All existing translations work correctly
- [ ] Language switching functions properly
- [ ] No hardcoded English text remains
- [ ] All UI components are translatable

### After Adding New Language
- [ ] All keys have translations in the new language
- [ ] Language appears in language selector
- [ ] Switching to new language works
- [ ] All components display correctly in new language
- [ ] Language preference persists across sessions
- [ ] No console errors related to missing translations

## Future Enhancements

### Planned Features
1. **Pluralization Rules** - Proper handling of singular/plural forms
2. **Date/Time Formatting** - Localized date and time display
3. **Number Formatting** - Localized number and currency formatting
4. **RTL Support** - Right-to-left language support
5. **Translation Management** - External translation file loading
6. **Auto-detection** - Browser language auto-detection

### Technical Improvements
1. **Lazy Loading** - Load translations on demand
2. **Caching** - Cache translations for better performance
3. **Validation** - Automated translation completeness checking
4. **Hot Reloading** - Update translations without page refresh

## Maintenance

### Regular Tasks
1. **Review New Features** - Ensure new UI elements are translatable
2. **Update Translations** - Keep translations current with app changes
3. **Test Language Switching** - Verify all languages work after updates
4. **Clean Up Unused Keys** - Remove obsolete translation keys

### Adding New Translation Keys
1. Add key to English section first
2. Add key to all other language sections
3. Update this documentation
4. Test in all supported languages

---

**Last Updated**: January 2025
**Maintainer**: Development Team
**Version**: 1.0
